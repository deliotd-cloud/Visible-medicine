// Diagnostic source-coordinate geometry only. Distances have unknown source units.
import {BufferAttribute, BufferGeometry, Matrix4, Triangle, Uint32BufferAttribute, Vector3} from 'three';
import {MeshBVH} from 'three-mesh-bvh';

const prepared = Symbol('prepared proximity object');
const point = values => new Vector3(...values);

export function prepareProximityObject({id, sourceName, vertices, faces} = {}) {
  if (typeof id !== 'string' || !id || typeof sourceName !== 'string' || !sourceName) throw new TypeError('id and sourceName are required');
  if (!Array.isArray(vertices) || !vertices.length || !Array.isArray(faces) || !faces.length) throw new TypeError('nonempty vertices and triangular faces are required');
  const positions = [];
  for (const vertex of vertices) {
    if (!Array.isArray(vertex) || vertex.length !== 3 || !vertex.every(Number.isFinite)) throw new TypeError('vertices must be finite triples');
    positions.push(...vertex);
  }
  const indices = [];
  for (const face of faces) {
    if (!Array.isArray(face) || face.length !== 3 || !face.every(i => Number.isSafeInteger(i) && i >= 0 && i < vertices.length)) throw new TypeError('faces must be indexed triangles');
    if (new Set(face).size !== 3) throw new RangeError('zero-area source triangle');
    const triangle = new Triangle(...face.map(i => point(vertices[i])));
    if (triangle.getArea() === 0) throw new RangeError('zero-area source triangle');
    indices.push(...face);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float64Array(positions), 3));
  geometry.setIndex(new Uint32BufferAttribute(indices, 1));
  const bvh = new MeshBVH(geometry, {indirect: true});
  geometry.boundsTree = bvh;
  return {id, sourceName, vertices: vertices.map(v => [...v]), faces: faces.map(f => [...f]), geometry, bvh, [prepared]: true};
}

function originalTriangle(object, faceId) {
  const face = object.faces[faceId];
  if (!face) return null;
  return new Triangle(...face.map(i => point(object.vertices[i])));
}

function witnessValid(object, faceId, witness) {
  if (!Number.isSafeInteger(faceId) || !witness?.isVector3 || ![witness.x, witness.y, witness.z].every(Number.isFinite)) return false;
  const triangle = originalTriangle(object, faceId);
  if (!triangle) return false;
  const closest = triangle.closestPointToPoint(witness, new Vector3());
  const scale = Math.max(1, ...object.faces[faceId].flatMap(i => object.vertices[i].map(Math.abs)), witness.length());
  return closest.distanceTo(witness) <= 1e-10 * scale;
}

export function sourceProximity(a, b) {
  if (!a?.[prepared] || !b?.[prepared]) throw new TypeError('prepared objects required');
  if (a === b || a.id === b.id || a.sourceName === b.sourceName ||
      (a.vertices.length === b.vertices.length && a.faces.length === b.faces.length &&
       a.vertices.every((v, i) => v.every((n, j) => n === b.vertices[i][j])) &&
       a.faces.every((f, i) => f.every((n, j) => n === b.faces[i][j])))) {
    throw new RangeError('identical objects are not a cross-pair');
  }
  const left = {}, right = {};
  const distance = a.bvh.closestPointToGeometry(b.geometry, new Matrix4(), left, right);
  if (!distance || !Number.isFinite(left.distance)) return {status: 'query-incomplete', distanceSourceUnits: null, witnessVerified: false, reason: 'no finite triangle result'};
  // The library returns BVH traversal indices; indirect mode must map them back.
  const faceIdA = a.bvh.resolveTriangleIndex(left.faceIndex);
  const faceIdB = b.bvh.resolveTriangleIndex(right.faceIndex);
  const separation = left.point?.distanceTo(right.point);
  const scale = Math.max(1, Math.abs(left.distance), left.point?.length() ?? 0, right.point?.length() ?? 0);
  const verified = witnessValid(a, faceIdA, left.point) && witnessValid(b, faceIdB, right.point) &&
    Number.isFinite(separation) && Math.abs(separation - left.distance) <= 1e-10 * scale;
  if (!verified) return {status: 'query-incomplete', distanceSourceUnits: left.distance, witnessVerified: false,
    reason: 'library witnesses do not verify on original source triangles'};
  return {status: 'verified', distanceSourceUnits: left.distance, witnessVerified: true,
    sourceFaceIdA: faceIdA, sourceFaceIdB: faceIdB,
    witnessA: left.point.toArray(), witnessB: right.point.toArray()};
}

export function edgeConnectedComponents(object) {
  if (!object?.[prepared]) throw new TypeError('prepared object required');
  // Exact-coordinate welding is diagnostic only; an edge, not a point, joins faces.
  const coordinateKeys = object.vertices.map(v => v.map(n => Object.is(n, -0) ? 0 : n).join(','));
  const edgeFaces = new Map();
  object.faces.forEach((face, faceId) => {
    for (let k = 0; k < 3; k++) {
      const pair = [coordinateKeys[face[k]], coordinateKeys[face[(k + 1) % 3]]].sort();
      const key = JSON.stringify(pair);
      if (!edgeFaces.has(key)) edgeFaces.set(key, []);
      edgeFaces.get(key).push(faceId);
    }
  });
  const adjacency = object.faces.map(() => new Set());
  for (const group of edgeFaces.values()) for (const i of group) for (const j of group) if (i !== j) adjacency[i].add(j);
  const seen = new Set(), components = [];
  for (let start = 0; start < object.faces.length; start++) {
    if (seen.has(start)) continue;
    const stack = [start], faceIds = [], vertexIds = new Set();
    seen.add(start);
    while (stack.length) {
      const faceId = stack.pop();
      faceIds.push(faceId);
      for (const vertexId of object.faces[faceId]) vertexIds.add(vertexId);
      for (const next of adjacency[faceId]) if (!seen.has(next)) { seen.add(next); stack.push(next); }
    }
    components.push({faceIds: faceIds.sort((a, b) => a - b), vertexIds: [...vertexIds].sort((a, b) => a - b)});
  }
  return components;
}
