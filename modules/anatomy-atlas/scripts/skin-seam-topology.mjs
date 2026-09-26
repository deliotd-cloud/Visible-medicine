// Offline diagnostic only: exact coordinate equivalence does not repair or admit a mesh.
// Inputs are arrays of finite [x,y,z] positions and zero-based triangle indices.
// Components count used vertices; isolated unused vertices are reported separately.
export function inspectExactPositionTopology(vertices, faces) {
  if (!Array.isArray(vertices) || !Array.isArray(faces)) throw new TypeError('Expected vertex and face arrays');
  for (const [i, v] of vertices.entries()) {
    if (!Array.isArray(v) || v.length !== 3 || !Array.from(v).every(Number.isFinite)) {
      throw new TypeError(`Vertex ${i} must have three finite coordinates`);
    }
  }
  for (const [i, f] of faces.entries()) {
    if (!Array.isArray(f) || f.length !== 3 || !Array.from(f).every(v => Number.isInteger(v) && v >= 0 && v < vertices.length)) {
      throw new TypeError(`Face ${i} must have three valid zero-based indices`);
    }
  }
  const unique = [], byPosition = new Map();
  const remap = vertices.map(v => {
    // Number stringification round-trips finite doubles; -0 and +0 are the same position.
    const key = v.join(',');
    if (!byPosition.has(key)) { byPosition.set(key, unique.length); unique.push(v); }
    return byPosition.get(key);
  });
  return {
    indexedVertexCount: vertices.length,
    exactPositionVertexCount: unique.length,
    mergedVertexCount: vertices.length - unique.length,
    faceCount: faces.length,
    indexed: inspect(vertices, faces),
    exactPosition: inspect(unique, faces.map(f => f.map(i => remap[i]))),
  };
}

function inspect(vertices, faces) {
  const parent = vertices.map((_, i) => i), used = new Set(), edges = new Map();
  const find = i => {
    while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; }
    return i;
  };
  const unite = (a, b) => { parent[find(a)] = find(b); };
  let repeatedVertexFaces = 0, zeroAreaFaces = 0, degenerateFaces = 0;
  for (const f of faces) {
    const repeated = new Set(f).size !== 3;
    const [a, b, c] = f.map(i => vertices[i]);
    const u = b.map((v, i) => v - a[i]), v = c.map((q, i) => q - a[i]);
    const cross = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
    if (!cross.every(Number.isFinite)) throw new RangeError('Coordinates exceed finite triangle arithmetic');
    const zero = cross.every(q => q === 0);
    if (repeated) repeatedVertexFaces++;
    if (zero) zeroAreaFaces++;
    if (repeated || zero) degenerateFaces++;
    f.forEach(i => used.add(i)); unite(f[0], f[1]); unite(f[1], f[2]);
    // Count distinct incident faces, not duplicate occurrences in degenerate triangles.
    // Collapsed self-edges are omitted; degenerate triangles remain explicitly counted.
    const faceEdges = new Set();
    for (const [a, b] of [[f[0], f[1]], [f[1], f[2]], [f[2], f[0]]]) {
      if (a !== b) faceEdges.add(a < b ? `${a}:${b}` : `${b}:${a}`);
    }
    for (const key of faceEdges) edges.set(key, (edges.get(key) || 0) + 1);
  }
  const components = new Map();
  for (const i of used) { const root = find(i); components.set(root, (components.get(root) || 0) + 1); }
  const boundaryEdges = [...edges].filter(([, count]) => count === 1).map(([key]) => key.split(':').map(Number));
  const boundaryVertices = new Set(boundaryEdges.flat());
  // Independent boundary graph: a surface component can contain several boundary loops.
  for (const i of boundaryVertices) parent[i] = i;
  for (const [a, b] of boundaryEdges) unite(a, b);
  const boundaryGroups = new Map();
  for (const i of boundaryVertices) {
    const root = find(i);
    if (!boundaryGroups.has(root)) boundaryGroups.set(root, {vertexCount: 0, edgeCount: 0, bounds: null});
    const group = boundaryGroups.get(root); group.vertexCount++;
    group.bounds = extendBounds(group.bounds, vertices[i]);
  }
  for (const [a] of boundaryEdges) boundaryGroups.get(find(a)).edgeCount++;
  const boundaryComponents = [...boundaryGroups.values()].sort((a, b) => b.edgeCount - a.edgeCount || b.vertexCount - a.vertexCount);
  let boundaryBounds = null;
  for (const i of boundaryVertices) boundaryBounds = extendBounds(boundaryBounds, vertices[i]);
  return {
    usedVertices: used.size, unusedVertices: vertices.length - used.size,
    connectedComponents: components.size,
    componentVertexCounts: [...components.values()].sort((a, b) => b - a),
    edges: edges.size, boundaryEdges: boundaryEdges.length, boundaryVertices: boundaryVertices.size,
    boundaryComponentCount: boundaryComponents.length, boundaryComponents, boundaryBounds,
    nonManifoldEdges: [...edges.values()].filter(count => count > 2).length,
    repeatedVertexFaces, zeroAreaFaces, degenerateFaces,
  };
}

function extendBounds(bounds, point) {
  if (!bounds) return {min: [...point], max: [...point]};
  for (let i = 0; i < 3; i++) {
    bounds.min[i] = Math.min(bounds.min[i], point[i]);
    bounds.max[i] = Math.max(bounds.max[i], point[i]);
  }
  return bounds;
}
