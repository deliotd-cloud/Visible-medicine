import assert from 'node:assert/strict';
import test from 'node:test';
import {sourceProximity, prepareProximityObject, edgeConnectedComponents} from './open3dmodel-plexus-proximity.mjs';

const tri = (id, vertices, faces = [[0, 1, 2]]) => prepareProximityObject({id, sourceName: `source-${id}`, vertices, faces});
const flat = (id, z) => tri(id, [[0, 0, z], [2, 0, z], [0, 2, z]]);
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);

test('full triangle surfaces: separated, crossing, contained projections and edge minima', () => {
  const cases = [
    [flat('a', 0), flat('b', 3), 3],
    [flat('c', 0), tri('d', [[0.5, 0.5, -1], [0.5, 0.5, 1], [1, 0.5, 0]]), 0],
    [flat('e', 0), tri('f', [[0.2, 0.2, 2], [0.4, 0.2, 2], [0.2, 0.4, 2]]), 2],
    [flat('g', 0), tri('h', [[3, 0, 0], [3, 1, 0], [4, 0, 0]]), 1],
  ];
  for (const [a, b, expected] of cases) {
    const result = sourceProximity(a, b);
    assert.equal(result.status, 'verified');
    near(result.distanceSourceUnits, expected);
    near(Math.hypot(...result.witnessA.map((n, i) => n - result.witnessB[i])), expected);
    assert.equal(result.sourceFaceIdA, 0);
    assert.equal(result.sourceFaceIdB, 0);
  }
});

test('indirect BVH reports original face IDs after traversal reorders triangles', () => {
  const vertices = [], faces = [];
  for (let i = 0; i < 18; i++) {
    const x = (i * 7 % 18) * 10;
    const start = vertices.length;
    vertices.push([x, 0, 0], [x + 1, 0, 0], [x, 1, 0]);
    faces.push([start, start + 1, start + 2]);
  }
  const a = tri('many', vertices, faces);
  const b = tri('target', [[171, 0, 2], [171.5, 0, 2], [171, 0.5, 2]]);
  const result = sourceProximity(a, b);
  assert.equal(result.status, 'verified');
  assert.equal(result.sourceFaceIdA, 5); // (5 * 7) mod 18 = 17
  near(result.distanceSourceUnits, 2);
  assert.equal(result.witnessVerified, true);
});

test('coplanar overlap is either verified or explicitly unresolved', () => {
  const a = flat('plane-a', 0);
  const b = tri('plane-b', [[0.2, 0.2, 0], [0.6, 0.2, 0], [0.2, 0.6, 0]]);
  const result = sourceProximity(a, b);
  near(result.distanceSourceUnits, 0);
  assert.ok(['verified', 'query-incomplete'].includes(result.status));
  if (result.status === 'query-incomplete') {
    assert.equal(result.witnessVerified, false);
    assert.match(result.reason, /witness/);
    assert.equal(result.witnessA, undefined);
  }
});

test('edge connectivity preserves original IDs and does not merge point-touch', () => {
  const object = tri('parts', [[0,0,0], [1,0,0], [0,1,0], [1,1,0], [2,0,0], [2,1,0], [3,0,0]],
    [[0,1,2], [1,3,2], [4,5,6]]);
  assert.deepEqual(edgeConnectedComponents(object), [
    {faceIds: [0,1], vertexIds: [0,1,2,3]},
    {faceIds: [2], vertexIds: [4,5,6]},
  ]);
  const touch = tri('touch', [[0,0,0], [1,0,0], [0,1,0], [0,0,0], [-1,0,0], [0,-1,0]],
    [[0,1,2], [3,4,5]]);
  assert.deepEqual(edgeConnectedComponents(touch).map(c => c.faceIds), [[0], [1]]);
});

test('malformed geometry and same-object comparison fail; inputs stay unchanged', () => {
  const vertices = [[0,0,0], [1,0,0], [0,1,0]], faces = [[0,1,2]];
  const snapshot = JSON.stringify({vertices, faces});
  const a = tri('valid', vertices, faces);
  assert.equal(JSON.stringify({vertices, faces}), snapshot);
  sourceProximity(a, flat('other', 2));
  assert.equal(JSON.stringify({vertices, faces}), snapshot);
  assert.throws(() => sourceProximity(a, a), /identical/);
  assert.throws(() => sourceProximity(a, tri('duplicate', vertices, faces)), /identical/);
  assert.throws(() => tri('bad', [[0,0,0], [1,0,0], [2,0,0]]), /zero-area/);
  assert.throws(() => tri('bad', [[0,0,0], [1,0,0], [NaN,1,0]]), /finite/);
  assert.throws(() => tri('bad', vertices, [[0,1,3]]), /indexed/);
  assert.throws(() => tri('bad', vertices, [[0,1,1]]), /zero-area/);
  assert.throws(() => sourceProximity({}, a), /prepared/);
});

test('skew edge interiors, not a vertex sample, supply the analytical minimum', () => {
  const a = tri('skew-a', [[-2,0,0],[2,0,0],[-2,-1,-1]]);
  const b = tri('skew-b', [[0,-2,2],[0,2,2],[1,-2,3]]);
  const result = sourceProximity(a,b);
  assert.equal(result.status,'verified');
  near(result.distanceSourceUnits,2);
  for(const [actual,expected]of result.witnessA.map((n,i)=>[n,[0,0,0][i]]))near(actual,expected);
  for(const [actual,expected]of result.witnessB.map((n,i)=>[n,[0,0,2][i]]))near(actual,expected);
  assert(!a.vertices.some(v=>v.every((n,i)=>n===result.witnessA[i])));
  assert(!b.vertices.some(v=>v.every((n,i)=>n===result.witnessB[i])));
});

test('contained closed surfaces retain positive boundary distance without a clearance claim', () => {
  const faces=[[0,2,1],[0,1,3],[0,3,2],[1,2,3]];
  const outer=tri('outer',[[0,0,0],[4,0,0],[0,4,0],[0,0,4]],faces);
  const inner=tri('inner',[[.3,.3,.3],[.5,.3,.3],[.3,.5,.3],[.3,.3,.5]],faces);
  const result=sourceProximity(outer,inner);
  assert.equal(result.status,'verified');near(result.distanceSourceUnits,.3);
  assert.equal(edgeConnectedComponents(outer).length,1);
  assert.equal(edgeConnectedComponents(inner).length,1);
});
