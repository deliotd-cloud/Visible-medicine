import assert from 'node:assert/strict';
import { test } from 'node:test';
import { prepareSourceIntersection, sourceIntersectionPairs } from './source-intersection-checker.mjs';

const base = [[0, 0, 0], [2, 0, 0], [0, 2, 0], [0, 0, 2]];
const tetraFaces = [[0, 2, 1], [0, 1, 3], [0, 3, 2], [1, 2, 3]];
const tetra = (vertices) => prepareSourceIntersection({ vertices, faces: tetraFaces });
const shifted = (vertices, offset) => vertices.map((vertex) =>
  vertex.map((n, axis) => n + offset[axis]));

test('crossing, separated, adjacent and contained tetrahedra retain predicate scope', () => {
  const original = tetra(base);
  const crossing = sourceIntersectionPairs(original, tetra(shifted(base, [1, 0.2, 0.2])));
  const separated = sourceIntersectionPairs(original, tetra(shifted(base, [5, 0, 0])));
  const adjacent = sourceIntersectionPairs(original, tetra([[0, 0, 0], [2, 0, 0], [0, 2, 0], [0, 0, -2]]));
  const contained = sourceIntersectionPairs(original, tetra([
    [0.25, 0.25, 0.25], [0.5, 0.25, 0.25], [0.25, 0.5, 0.25], [0.25, 0.25, 0.5],
  ]));
  assert(crossing.count > 0);
  assert(crossing.intersectionBounds);
  assert.equal(separated.count, 0);
  assert(adjacent.count > 0);
  assert.equal(contained.count, 0);
  assert(contained.limitations.some((line) => line.includes('containment')));
});

test('self-crossing reports original distinct faces and self-adjacent seam is excluded', () => {
  const crossing = prepareSourceIntersection({
    vertices: [[-2, -2, 0], [2, -2, 0], [0, 2, 0], [0, -1, -1], [0, -1, 1], [0, 1, 0]],
    faces: [[0, 1, 2], [3, 4, 5]],
  });
  const hit = sourceIntersectionPairs(crossing, crossing, { self: true });
  assert.deepEqual(hit.facePairs.map((row) => [row.faceA, row.faceB]), [[0, 1]]);
  const seam = prepareSourceIntersection({
    vertices: [[0, 0, 0], [2, 0, 0], [0, 2, 0], [0, 0, 0], [2, 0, 0], [0, 0, 2]],
    faces: [[0, 1, 2], [3, 4, 5]],
  });
  assert.equal(sourceIntersectionPairs(seam, seam, { self: true }).count, 0);
  const clean = tetra(base);
  assert.equal(sourceIntersectionPairs(clean, clean, { self: true }).count, 0);
});

test('indirect BVH callback IDs resolve to source face order beyond one leaf', () => {
  const vertices = [], faces = [];
  for (let originalFace = 0; originalFace < 24; originalFace++) {
    const x = (23 - originalFace) * 3, start = vertices.length;
    vertices.push([x, 0, 0], [x + 1, 0, 0], [x, 1, 0]);
    faces.push([start, start + 1, start + 2]);
  }
  const source = prepareSourceIntersection({ vertices, faces });
  const reordered = faces.map((_, index) => source.bvh.resolveTriangleIndex(index));
  assert.notDeepEqual(reordered, faces.map((_, index) => index));
  const targetFace = 17;
  const target = prepareSourceIntersection({
    vertices: faces[targetFace].map((index) => vertices[index]), faces: [[0, 1, 2]],
  });
  const pairs = sourceIntersectionPairs(source, target);
  assert.deepEqual([...new Set(pairs.facePairs.map((row) => row.faceA))], [targetFace]);
});

test('degenerate faces are explicitly incomplete and not silently counted', () => {
  const degenerate = prepareSourceIntersection({
    vertices: [[0, 0, 0], [1, 0, 0], [2, 0, 0]], faces: [[0, 1, 2]],
  });
  const result = sourceIntersectionPairs(degenerate, tetra(base));
  assert.deepEqual(result.degeneracy.facesA, [0]);
  assert.equal(result.degeneracy.predicateIncomplete, true);
  assert.equal(result.count, 0);
});

test('source vertex and face arrays remain unmodified', () => {
  const shapeA = { vertices: structuredClone(base), faces: structuredClone(tetraFaces) };
  const shapeB = { vertices: shifted(base, [1, 0.2, 0.2]), faces: structuredClone(tetraFaces) };
  const beforeA = structuredClone(shapeA), beforeB = structuredClone(shapeB);
  const a = prepareSourceIntersection(shapeA), b = prepareSourceIntersection(shapeB);
  sourceIntersectionPairs(a, b);
  assert.deepEqual(shapeA, beforeA);
  assert.deepEqual(shapeB, beforeB);
  assert(a.geometry.attributes.position.array instanceof Float64Array);
  assert.deepEqual(Array.from(a.geometry.index.array), shapeA.faces.flat());
});
