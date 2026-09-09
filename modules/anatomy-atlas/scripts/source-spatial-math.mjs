import assert from 'node:assert/strict';
import { Line3, Vector3 } from 'three';
import { sourceDistanceIndex } from './source-topology.mjs';

// Diagnostic queries only: original coordinates, faces and degenerate faces are retained.
export function spatialDistanceIndex(shape) {
  assert(shape.triangles.length, 'Empty target surface');
  const regular = shape.triangles.filter((t) => !t.degenerate);
  const nearest = regular.length
    ? sourceDistanceIndex({ ...shape, triangles: regular })
    : () => Infinity;
  const segments = shape.triangles
    .filter((t) => t.degenerate)
    .flatMap(({ triangle: t }) => [
      new Line3(t.a, t.b),
      new Line3(t.b, t.c),
      new Line3(t.c, t.a),
    ]);
  const closest = new Vector3();
  return (point) => {
    let distance = nearest(point);
    for (const segment of segments) {
      if (segment.start.equals(segment.end))
        distance = Math.min(distance, point.distanceTo(segment.start));
      else
        distance = Math.min(
          distance,
          point.distanceTo(segment.closestPointToPoint(point, true, closest)),
        );
    }
    assert(Number.isFinite(distance), 'Non-finite surface distance');
    return distance;
  };
}

export const uniqueSourceVertices = (shape) => [
  ...new Map(shape.vertices.map((v) => [v.join(','), v])).values(),
];

export function distanceSummary(
  points,
  nearest,
  weights = points.map(() => 1),
) {
  assert(
    points.length && weights.length === points.length,
    'Empty or mismatched samples',
  );
  assert(weights.every((n) => Number.isFinite(n) && n >= 0));
  const rows = points.map((p, i) => ({
    distance: nearest(new Vector3(...p)),
    weight: weights[i],
  }));
  const ordered = rows.map((r) => r.distance).sort((a, b) => a - b);
  const total = weights.reduce((a, b) => a + b, 0);
  return {
    samples: rows.length,
    minMm: ordered[0],
    medianMm: ordered[Math.floor(ordered.length / 2)],
    maxMm: ordered.at(-1),
    thresholds: [0.1, 0.25, 1, 2].map((mm) => ({
      mm,
      count: rows.filter((r) => r.distance <= mm).length,
      weightedFraction: total
        ? rows
            .filter((r) => r.distance <= mm)
            .reduce((n, r) => n + r.weight, 0) / total
        : null,
    })),
  };
}

export function candidateContact(
  candidate,
  target,
  targetNearest = spatialDistanceIndex(target),
) {
  const points = uniqueSourceVertices(target);
  const stride = Math.max(1, Math.ceil(points.length / 128));
  return {
    candidateVertices: distanceSummary(
      uniqueSourceVertices(candidate),
      targetNearest,
    ),
    candidateTriangleCentroids: distanceSummary(
      candidate.triangles.map(({ triangle }) =>
        triangle.getMidpoint(new Vector3()).toArray(),
      ),
      targetNearest,
      candidate.triangles.map(({ triangle }) => triangle.getArea()),
    ),
    // Explicitly sampled in this direction; no continuous-surface or intersection proof.
    targetVertexSamples: distanceSummary(
      points.filter((_, i) => i % stride === 0),
      spatialDistanceIndex(candidate),
    ),
    targetUniqueVertices: points.length,
    targetStride: stride,
  };
}

// Connected components use shared exact-coordinate vertices, not tolerant welding.
// End bands are geometric extrema for inspection, NEVER certified nerve/vessel terminals.
export function componentEndBands(shape) {
  const points = uniqueSourceVertices(shape),
    lookup = new Map(points.map((p, i) => [p.join(','), i]));
  const parent = points.map((_, i) => i);
  const root = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  for (const face of shape.faces) {
    const ids = face.map((i) => lookup.get(shape.vertices[i].join(',')));
    for (const id of ids.slice(1)) parent[root(id)] = root(ids[0]);
  }
  const groups = new Map();
  points.forEach((p, i) => {
    const id = root(i);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(p);
  });
  return [...groups.values()]
    .sort((a, b) => b.length - a.length)
    .map((group, index) => {
      const min = [0, 1, 2].map((axis) =>
        Math.min(...group.map((p) => p[axis])),
      );
      const max = [0, 1, 2].map((axis) =>
        Math.max(...group.map((p) => p[axis])),
      );
      const extent = max.map((value, axis) => value - min[axis]);
      const axis = extent.indexOf(Math.max(...extent)),
        widthMm = Math.min(1, extent[axis] / 4);
      return {
        index,
        uniqueVertices: group.length,
        bounds: { min, max },
        axis,
        widthMm,
        low: group.filter((p) => p[axis] <= min[axis] + widthMm),
        high: group.filter((p) => p[axis] >= max[axis] - widthMm),
      };
    });
}
