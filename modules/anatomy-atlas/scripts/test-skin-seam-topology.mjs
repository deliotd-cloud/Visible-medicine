import assert from 'node:assert/strict';
import test from 'node:test';
import {inspectExactPositionTopology as inspect} from './skin-seam-topology.mjs';

const tetraVertices = [[0,0,0],[1,0,0],[0,1,0],[0,0,1]];
const tetraFaces = [[0,2,1],[0,1,3],[1,2,3],[2,0,3]];

await test('closed tetrahedron has no boundary or degeneracy', () => {
  const r = inspect(tetraVertices, tetraFaces);
  assert.equal(r.mergedVertexCount, 0);
  assert.deepEqual(r.indexed, r.exactPosition);
  assert.equal(r.exactPosition.connectedComponents, 1);
  assert.equal(r.exactPosition.edges, 6);
  assert.equal(r.exactPosition.boundaryEdges, 0);
  assert.equal(r.exactPosition.boundaryBounds, null);
  assert.equal(r.exactPosition.degenerateFaces, 0);
  assert.equal(r.exactPosition.nonManifoldEdges, 0);
});

await test('split-index seam equivalents merge exactly without changing inputs', () => {
  const vertices = tetraFaces.flatMap(f => f.map(i => [...tetraVertices[i]]));
  const faces = tetraFaces.map((_, i) => [i*3,i*3+1,i*3+2]);
  const snapshot = structuredClone({vertices, faces});
  const r = inspect(vertices, faces);
  assert.equal(r.indexedVertexCount, 12);
  assert.equal(r.exactPositionVertexCount, 4);
  assert.equal(r.mergedVertexCount, 8);
  assert.equal(r.indexed.connectedComponents, 4);
  assert.equal(r.indexed.boundaryEdges, 12);
  assert.deepEqual(r.exactPosition, inspect(tetraVertices, tetraFaces).exactPosition);
  assert.deepEqual({vertices, faces}, snapshot);
});

await test('genuinely open tetrahedron preserves its boundary', () => {
  const r = inspect(tetraVertices, tetraFaces.slice(0,3)).exactPosition;
  assert.equal(r.boundaryEdges, 3);
  assert.equal(r.boundaryVertices, 3);
  assert.equal(r.boundaryComponentCount, 1);
  assert.deepEqual(r.boundaryBounds, {min:[0,0,0],max:[0,1,1]});
  assert.deepEqual(r.boundaryComponents, [{vertexCount:3,edgeCount:3,bounds:r.boundaryBounds}]);
});

await test('disconnected triangles have separate bounded components', () => {
  const r = inspect([[0,0,0],[1,0,0],[0,1,0],[10,0,0],[11,0,0],[10,1,0]], [[0,1,2],[3,4,5]]).exactPosition;
  assert.equal(r.connectedComponents, 2);
  assert.deepEqual(r.componentVertexCounts, [3,3]);
  assert.equal(r.boundaryComponentCount, 2);
  assert.equal(r.boundaryEdges, 6);
  assert.deepEqual(r.boundaryBounds, {min:[0,0,0],max:[11,1,0]});
});

await test('three faces incident on one edge are nonmanifold', () => {
  const r = inspect([[0,0,0],[1,0,0],[0,1,0],[0,0,1],[0,-1,0]], [[0,1,2],[1,0,3],[0,1,4]]).exactPosition;
  assert.equal(r.nonManifoldEdges, 1);
  assert.equal(r.boundaryEdges, 6);
});

await test('degeneracy, unused vertices, signed zero and near coordinates are explicit', () => {
  const r = inspect([[0,0,0],[-0,0,0],[1,0,0],[2,0,0],[Number.EPSILON,0,0]], [[0,1,2],[0,2,3],[0,0,2]]);
  assert.equal(r.exactPositionVertexCount, 4);
  assert.equal(r.indexed.repeatedVertexFaces, 1);
  assert.equal(r.exactPosition.repeatedVertexFaces, 2);
  assert.equal(r.exactPosition.zeroAreaFaces, 3);
  assert.equal(r.exactPosition.degenerateFaces, 3);
  assert.equal(r.exactPosition.unusedVertices, 1);
});

await test('invalid coordinates, faces and indices fail validation', () => {
  for (const vertices of [[[NaN,0,0]], [[Infinity,0,0]], [[0,0]], [['0',0,0]], [Array(3)], Array(1), null]) {
    assert.throws(() => inspect(vertices, []), TypeError);
  }
  for (const faces of [[[0,1,4]], [[-1,1,2]], [[0,1,1.5]], [[0,1]], [[0,1,2,3]], [Array(3)], Array(1), null]) {
    assert.throws(() => inspect(tetraVertices, faces), TypeError);
  }
  assert.deepEqual(inspect([], []).exactPosition.componentVertexCounts, []);
  assert.throws(() => inspect([[1e308,0,0],[-1e308,0,0],[0,1e308,0]], [[0,1,2]]), RangeError);
});
