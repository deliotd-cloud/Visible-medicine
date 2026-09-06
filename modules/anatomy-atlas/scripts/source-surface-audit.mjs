import { Vector3, Box3 } from 'three';
import { prepareShape } from './vessel-shape-math.mjs';

export function sourceObjShape(bytes) {
  const vertices = [],
    faces = [];
  for (const line of bytes.toString().split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === 'v') vertices.push(parts.slice(1).map(Number));
    if (parts[0] === 'f')
      faces.push(
        parts.slice(1).map((p) => {
          const n = Number(p.split('/')[0]);
          return n < 0 ? vertices.length + n : n - 1;
        }),
      );
  }
  return prepareShape(vertices, faces);
}
export function mergeSourceShapes(shapes) {
  const vertices = [],
    faces = [];
  for (const shape of shapes) {
    const offset = vertices.length;
    vertices.push(...shape.vertices);
    faces.push(...shape.faces.map((face) => face.map((i) => i + offset)));
  }
  return prepareShape(vertices, faces);
}
export function sourceTriangleSet(shape) {
  return new Set(
    shape.faces.map((face) =>
      face
        .map((i) => shape.vertices[i].join(','))
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
        .join(';'),
    ),
  );
}
export function sourceBoundsNear(a, b, marginMm = 1) {
  return a.min.every(
    (n, k) => n <= b.max[k] + marginMm && a.max[k] + marginMm >= b.min[k],
  );
}
function segmentSquared(p, a, b) {
  const d = new Vector3().subVectors(b, a),
    l = d.lengthSq();
  const t = l
    ? Math.max(0, Math.min(1, new Vector3().subVectors(p, a).dot(d) / l))
    : 0;
  return p.distanceToSquared(d.multiplyScalar(t).add(a));
}
/** Bounded source-coordinate surface sampling; no scene transform or alignment. */
export function sourceSurfaceDistance(a, b) {
  const values = [],
    near = [],
    point = new Vector3(),
    closest = new Vector3();
  for (
    let i = 0;
    i < a.vertices.length;
    i += Math.max(1, Math.ceil(a.vertices.length / 128))
  ) {
    point.fromArray(a.vertices[i]);
    let best = Infinity;
    for (const { triangle, degenerate } of b.triangles) {
      let d = degenerate
        ? NaN
        : point.distanceToSquared(triangle.closestPointToPoint(point, closest));
      if (!Number.isFinite(d))
        d = Math.min(
          segmentSquared(point, triangle.a, triangle.b),
          segmentSquared(point, triangle.b, triangle.c),
          segmentSquared(point, triangle.c, triangle.a),
        );
      best = Math.min(best, d);
    }
    if (!Number.isFinite(best))
      throw Error('Non-finite source surface distance');
    const mm = Math.sqrt(best);
    values.push(mm);
    if (mm <= 0.25) near.push(point.clone());
  }
  values.sort((a, b) => a - b);
  const bounds = near.length ? new Box3().setFromPoints(near) : null;
  return {
    samples: values.length,
    withinTenthMm: values.filter((v) => v <= 0.1).length,
    withinQuarterMm: values.filter((v) => v <= 0.25).length,
    withinOneMm: values.filter((v) => v <= 1).length,
    medianMm: values[Math.floor(values.length / 2)],
    maxMm: values.at(-1),
    closePointBounds: bounds
      ? { min: bounds.min.toArray(), max: bounds.max.toArray() }
      : null,
  };
}
export function compareSourceSurfaces(a, b) {
  const setA = sourceTriangleSet(a),
    setB = sourceTriangleSet(b);
  const exactTriangles = [...setA].filter((t) => setB.has(t)).length;
  const aToB = sourceSurfaceDistance(a, b),
    bToA = sourceSurfaceDistance(b, a);
  return {
    exactTriangles,
    aToB,
    bToA,
    flagged:
      exactTriangles > 0 ||
      [aToB, bToA].some((d) => d.withinQuarterMm / d.samples >= 0.25),
  };
}
