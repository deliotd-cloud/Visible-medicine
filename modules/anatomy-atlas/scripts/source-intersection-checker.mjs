import assert from 'node:assert/strict';
import { Box3, BufferAttribute, BufferGeometry, Line3, Matrix4, Triangle, Vector3 } from 'three';
import { MeshBVH } from 'three-mesh-bvh';

const identity = new Matrix4();

/** Build an indirect BVH over exact source positions and original face order. */
export function prepareSourceIntersection(shape) {
  assert(shape && Array.isArray(shape.vertices) && Array.isArray(shape.faces));
  assert(shape.vertices.length && shape.faces.length, 'Empty source surface');
  assert(shape.vertices.every((v) => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite)),
    'Non-finite source position');
  assert(shape.faces.every((face) => Array.isArray(face) && face.length === 3 &&
    face.every((index) => Number.isInteger(index) && index >= 0 && index < shape.vertices.length)),
    'Invalid source face');
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float64Array(shape.vertices.flat()), 3));
  const indices = shape.faces.flat();
  const IndexArray = indices.reduce((max, index) => Math.max(max, index), 0) > 65535
    ? Uint32Array : Uint16Array;
  const originalIndex = new IndexArray(indices);
  geometry.setIndex(new BufferAttribute(originalIndex.slice(), 1));
  const degenerateFaces = [];
  for (const [faceIndex, face] of shape.faces.entries()) {
    const triangle = new Triangle(...face.map((index) => new Vector3(...shape.vertices[index])));
    if (triangle.getArea() <= 1e-10) degenerateFaces.push(faceIndex);
  }
  const bvh = new MeshBVH(geometry, { indirect: true, verbose: false });
  assert.equal(bvh.indirect, true);
  assert.deepEqual(Array.from(geometry.index.array), Array.from(originalIndex),
    'Indirect BVH changed source face index order');
  return { shape, geometry, bvh, degenerateFaces };
}

const coordinateKeys = (shape) => shape.faces.map((face) =>
  new Set(face.map((index) => shape.vertices[index].join(','))));

/** Bounded predicate diagnostics only; zero pairs does not establish containment or clearance. */
export function sourceIntersectionPairs(a, b, { self = false } = {}) {
  assert(a?.shape && a?.geometry && a?.bvh && b?.shape && b?.geometry && b?.bvh,
    'Prepared source intersection handles required');
  if (self) assert(a === b || a.shape === b.shape, 'Self test requires one source shape');
  const rows = [], bounds = new Box3();
  const degenerateA = new Set(a.degenerateFaces), degenerateB = new Set(b.degenerateFaces);
  const aKeys = self ? coordinateKeys(a.shape) : null;
  let hasSegmentBounds = false, degenerateCallbackPairsSkipped = 0;
  a.bvh.bvhcast(b.bvh, identity, {
    intersectsTriangles(triangleA, triangleB, bvhFaceA, bvhFaceB) {
      const faceA = a.bvh.resolveTriangleIndex(bvhFaceA);
      const faceB = b.bvh.resolveTriangleIndex(bvhFaceB);
      if (self) {
        if (faceA >= faceB) return false;
        if ([...aKeys[faceA]].some((key) => aKeys[faceB].has(key))) return false;
      }
      if (degenerateA.has(faceA) || degenerateB.has(faceB)) {
        degenerateCallbackPairsSkipped++;
        return false;
      }
      const line = new Line3();
      if (!triangleA.intersectsTriangle(triangleB, line, true)) return false;
      const normalsParallel = Math.abs(triangleA.plane.normal.dot(triangleB.plane.normal)) > 1 - 1e-10;
      let kind, intersectionSegment = null;
      if (normalsParallel) kind = 'coplanar-overlap-or-touch';
      else {
        intersectionSegment = [line.start.toArray(), line.end.toArray()];
        // Validate returned segments against the original face IDs, independently
        // of BVH traversal/storage order. This is a consistency guard, not clearance.
        for (const [handle, face] of [[a, faceA], [b, faceB]]) {
          const sourceTriangle = new Triangle(...handle.shape.faces[face]
            .map((index) => new Vector3(...handle.shape.vertices[index])));
          for (const endpoint of [line.start, line.end])
            assert(endpoint.distanceTo(sourceTriangle.closestPointToPoint(endpoint, new Vector3())) <= 1e-6,
              'Returned intersection segment is not on its reported source face');
        }
        bounds.expandByPoint(line.start);
        bounds.expandByPoint(line.end);
        hasSegmentBounds = true;
        kind = line.start.equals(line.end)
          ? 'noncoplanar-point-or-tangent-touch'
          : 'noncoplanar-segment-crossing-or-touch';
      }
      rows.push({ faceA, faceB, kind, intersectionSegment });
      return false;
    },
  });
  rows.sort((x, y) => x.faceA - y.faceA || x.faceB - y.faceB || x.kind.localeCompare(y.kind));
  return {
    count: rows.length,
    classifications: Object.fromEntries([...new Set(rows.map((row) => row.kind))]
      .sort().map((kind) => [kind, rows.filter((row) => row.kind === kind).length])),
    intersectionBounds: hasSegmentBounds && !bounds.isEmpty()
      ? { min: bounds.min.toArray(), max: bounds.max.toArray() } : null,
    intersectionBoundsValidFor: 'noncoplanar predicate results with a returned segment only',
    facePairs: rows,
    degeneracy: {
      facesA: [...degenerateA], facesB: [...degenerateB],
      callbackPairsSkipped: degenerateCallbackPairsSkipped,
      predicateIncomplete: degenerateA.size > 0 || degenerateB.size > 0,
    },
    limitations: [
      'Floating-point triangle predicates and padded Float32 BVH bounds are not exact arithmetic.',
      'Surface pairs do not prove containment, lumen identity or clinical correctness.',
      'Adjacent self faces sharing an exact-coordinate vertex are excluded and not tested; no tolerance welding is used.',
      'Degenerate faces are listed and excluded from triangle predicates; a zero count with degeneracy is incomplete.',
      'Coplanar overlap and boundary touch are not distinguished; noncoplanar segments are predicate outputs, not proof of penetration.',
    ],
  };
}
