import { Box3, Vector3 } from 'three';

function disjointSet(size) {
  const parent = Array.from({ length: size }, (_, i) => i);
  function find(i) {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  }
  return {
    find,
    join(a, b) {
      parent[find(a)] = find(b);
    },
  };
}

/** Exact-coordinate welding is diagnostic only; never modifies source geometry. */
export function sourceTopology(shape) {
  const ids = new Map(),
    vertices = [],
    remap = shape.vertices.map((point) => {
      const key = point.join(',');
      if (!ids.has(key)) {
        ids.set(key, vertices.length);
        vertices.push(point);
      }
      return ids.get(key);
    });
  const faces = shape.faces.map((face) => face.map((i) => remap[i]));
  const edges = new Map(),
    incidents = new Map(),
    faceKeys = new Set();
  let duplicateFaces = 0,
    collapsedFaces = 0;
  faces.forEach((face, faceIndex) => {
    const key = [...face].sort((a, b) => a - b).join(',');
    if (faceKeys.has(key)) duplicateFaces++;
    faceKeys.add(key);
    if (new Set(face).size < 3) collapsedFaces++;
    for (const vertex of new Set(face)) {
      if (!incidents.has(vertex)) incidents.set(vertex, []);
      incidents.get(vertex).push(faceIndex);
    }
    for (let i = 0; i < 3; i++) {
      const a = face[i],
        b = face[(i + 1) % 3],
        edgeKey = [Math.min(a, b), Math.max(a, b)].join(',');
      if (!edges.has(edgeKey))
        edges.set(edgeKey, { a, b, faces: [], directions: [] });
      const edge = edges.get(edgeKey);
      edge.faces.push(faceIndex);
      edge.directions.push(a < b ? 1 : -1);
    }
  });
  const groups = disjointSet(faces.length),
    vertexEdges = new Map();
  for (const edge of edges.values()) {
    for (const face of edge.faces.slice(1)) groups.join(edge.faces[0], face);
    for (const vertex of new Set([edge.a, edge.b])) {
      if (!vertexEdges.has(vertex)) vertexEdges.set(vertex, []);
      vertexEdges.get(vertex).push(edge);
    }
  }
  let nonManifoldVertices = 0;
  for (const [vertex, incident] of incidents) {
    const local = disjointSet(incident.length),
      index = new Map(incident.map((face, i) => [face, i]));
    let boundary = 0,
      invalid = false;
    for (const edge of vertexEdges.get(vertex)) {
      if (edge.faces.length === 1) boundary++;
      if (edge.faces.length > 2 || edge.a === edge.b) invalid = true;
      for (const face of edge.faces.slice(1))
        local.join(index.get(edge.faces[0]), index.get(face));
    }
    if (
      invalid ||
      ![0, 2].includes(boundary) ||
      new Set(incident.map((_, i) => local.find(i))).size !== 1
    )
      nonManifoldVertices++;
  }
  const componentFaces = new Map();
  faces.forEach((_, i) => {
    const key = groups.find(i);
    if (!componentFaces.has(key)) componentFaces.set(key, []);
    componentFaces.get(key).push(i);
  });
  const components = [...componentFaces.values()]
    .map((indices) => {
      const vertexIds = new Set(indices.flatMap((i) => faces[i])),
        box = new Box3();
      for (const id of vertexIds)
        box.expandByPoint(new Vector3(...vertices[id]));
      const origin = box.getCenter(new Vector3());
      let areaMm2 = 0,
        algebraicVolumeMm3 = 0;
      for (const i of indices) {
        const triangle = shape.triangles[i].triangle;
        areaMm2 += triangle.getArea();
        const [a, b, c] = [triangle.a, triangle.b, triangle.c].map((p) =>
          p.clone().sub(origin),
        );
        algebraicVolumeMm3 += a.dot(b.cross(c)) / 6;
      }
      return {
        firstFace: indices[0],
        triangles: indices.length,
        vertices: vertexIds.size,
        bounds: { min: box.min.toArray(), max: box.max.toArray() },
        areaMm2,
        algebraicVolumeMm3,
      };
    })
    .sort((a, b) => b.triangles - a.triangles || a.firstFace - b.firstFace);
  const boundaryEdges = [...edges.values()].filter(
    (edge) => edge.faces.length === 1,
  ).length;
  const nonManifoldEdges = [...edges.values()].filter(
    (edge) => edge.faces.length > 2 || edge.a === edge.b,
  ).length;
  const inconsistentWindingEdges = [...edges.values()].filter(
    (edge) =>
      edge.faces.length === 2 && edge.directions[0] === edge.directions[1],
  ).length;
  const degenerateFaces = shape.triangles.filter(
    (entry) => entry.degenerate,
  ).length;
  return {
    sourceVertices: shape.vertices.length,
    exactUniqueVertices: vertices.length,
    unusedUniqueVertices: vertices.length - incidents.size,
    triangles: faces.length,
    edges: edges.size,
    duplicateFaces,
    collapsedFaces,
    degenerateFaces,
    boundaryEdges,
    nonManifoldEdges,
    nonManifoldVertices,
    inconsistentWindingEdges,
    eulerCharacteristic: incidents.size - edges.size + faces.length,
    closedOrientedManifold:
      !boundaryEdges &&
      !nonManifoldEdges &&
      !nonManifoldVertices &&
      !inconsistentWindingEdges &&
      !duplicateFaces &&
      !collapsedFaces &&
      !degenerateFaces,
    components,
    limitation:
      'Exact-coordinate combinatorial diagnostics only. No tolerance welding, repair, self-intersection proof, anatomical validity or clinical volume. Component algebraic volume is not enclosed volume for open, intersecting or inconsistently oriented surfaces.',
  };
}

/** Exact nearest-triangle query accelerated by conservative source-coordinate boxes. */
export function sourceDistanceIndex(shape) {
  const entries = shape.triangles.map(({ triangle, degenerate }) => {
    if (degenerate)
      throw Error('Distance index requires nondegenerate source triangles');
    return {
      triangle,
      box: new Box3().setFromPoints([triangle.a, triangle.b, triangle.c]),
    };
  });
  function build(items) {
    const box = new Box3();
    for (const item of items) box.union(item.box);
    if (items.length <= 12) return { box, items };
    const size = box.getSize(new Vector3());
    const axis =
      size.x >= size.y && size.x >= size.z ? 'x' : size.y >= size.z ? 'y' : 'z';
    items.sort(
      (a, b) =>
        a.box.min[axis] + a.box.max[axis] - (b.box.min[axis] + b.box.max[axis]),
    );
    const half = Math.floor(items.length / 2);
    return {
      box,
      children: [build(items.slice(0, half)), build(items.slice(half))],
    };
  }
  const root = build(entries),
    closest = new Vector3();
  return (point) => {
    let best = Infinity;
    function visit(node) {
      if (node.box.distanceToPoint(point) ** 2 > best) return;
      if (node.items)
        for (const entry of node.items) {
          if (entry.box.distanceToPoint(point) ** 2 > best) continue;
          best = Math.min(
            best,
            point.distanceToSquared(
              entry.triangle.closestPointToPoint(point, closest),
            ),
          );
        }
      else {
        const [a, b] = node.children;
        if (a.box.distanceToPoint(point) <= b.box.distanceToPoint(point)) {
          visit(a);
          visit(b);
        } else {
          visit(b);
          visit(a);
        }
      }
    }
    visit(root);
    if (!Number.isFinite(best)) throw Error('Invalid nearest-triangle result');
    return Math.sqrt(best);
  };
}

/** All unique stored vertices and every triangle centroid; not a continuous-surface proof. */
export function fullSourceContact(shape, target) {
  if (shape.triangles.some((entry) => entry.degenerate))
    throw Error('Contact quadrature requires nondegenerate source triangles');
  const nearest = sourceDistanceIndex(target),
    unique = new Map(shape.vertices.map((point) => [point.join(','), point]));
  function summarize(samples) {
    const distances = samples.map(({ point, weight }) => ({
      distance: nearest(point),
      weight,
    }));
    const ordered = distances.map((row) => row.distance).sort((a, b) => a - b);
    const weight = distances.reduce((sum, row) => sum + row.weight, 0);
    const thresholds = [0.1, 0.25, 1].map((mm) => ({
      mm,
      count: distances.filter((row) => row.distance <= mm).length,
      weightedFraction:
        distances
          .filter((row) => row.distance <= mm)
          .reduce((sum, row) => sum + row.weight, 0) / weight,
    }));
    return {
      samples: distances.length,
      thresholds,
      medianMm: ordered[Math.floor(ordered.length / 2)],
      maxMm: ordered.at(-1),
    };
  }
  return {
    vertices: summarize(
      [...unique.values()].map((point) => ({
        point: new Vector3(...point),
        weight: 1,
      })),
    ),
    triangleCentroids: summarize(
      shape.triangles.map(({ triangle }) => ({
        point: triangle.getMidpoint(new Vector3()),
        weight: triangle.getArea(),
      })),
    ),
    note: 'Centroid weighted fractions use triangle area as quadrature weights, not exact contact area. Unsigned distances cannot distinguish adjacency, penetration, duplication or a surgical plane.',
  };
}
