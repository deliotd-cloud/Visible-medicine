import test from 'node:test';
import assert from 'node:assert/strict';
import { parseObj, auditObj } from './obj-audit.mjs';

const tetra = (offset = 0) => {
  const v = [
    [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1],
  ].map(([x, y, z]) => `v ${x + offset} ${y} ${z}`);
  const n = offset === 0 ? 0 : 4;
  const f = [[1, 2, 3], [1, 4, 2], [1, 3, 4], [2, 4, 3]]
    .map(indices => `f ${indices.map(i => i + n).join(' ')}`);
  return { v, f };
};

test('preserves source frame and face order; resolves relative indices at occurrence', () => {
  const source = [
    '# a comment', 'o FMA74140', 'g source', 'vt 0.1 0.2', 'vn 0 0 1',
    'v 2 3 4', 'v 3 3 4', 'v 2 4 4',
    'f -3/1/1 -2//1 -1/1',
    'v 99 99 99',
  ].join('\r\n');
  const original = new TextEncoder().encode(source);
  const copy = Uint8Array.from(original);
  const parsed = parseObj(original);
  assert.deepEqual(parsed.positions, [[2, 3, 4], [3, 3, 4], [2, 4, 4], [99, 99, 99]]);
  assert.deepEqual(parsed.faces, [[0, 1, 2]]);
  assert.deepEqual(original, copy);
  const snapshot = structuredClone(parsed);
  const report = auditObj(parsed);
  assert.deepEqual(parsed, snapshot);
  assert.strictEqual(report.positions, parsed.positions);
  assert.strictEqual(report.faces, parsed.faces);
  assert.deepEqual(report.bounds, { min: [2, 3, 4], max: [99, 99, 99] });
  assert.equal(report.boundaryEdges, 3);
  assert.equal(report.connectedFaceComponents.length, 1);
  assert.deepEqual(report.connectedFaceComponents[0].bounds, {
    min: [2, 3, 4], max: [3, 4, 4],
  });
});

test('rejects malformed geometry and forward or invalid indices', () => {
  const invalid = [
    ['v 0 NaN 1', /three finite/],
    ['v 0 Infinity 1', /three finite/],
    ['v 0 1', /three finite/],
    ['v 0 1 2 3', /three finite/],
    ['v 0 0 0\nf 1 1 0', /invalid face index/],
    ['v 0 0 0\nf 1 1 2\nv 1 0 0', /out of range at face occurrence/],
    ['v 0 0 0\nf -2 -1 -1', /out of range at face occurrence/],
    ['v 0 0 0\nf 1.0 1 1', /noninteger face index/],
    ['v 0 0 0\nf 1e0 1 1', /noninteger face index/],
    ['v 0 0 0\nf 1 1 1 1', /only triangle faces/],
    ['v 0 0 0\nf 1 1', /only triangle faces/],
    ['curv 0 1 2', /unsupported directive/],
  ];
  for (const [source, message] of invalid) {
    assert.throws(() => parseObj(source), message, source);
  }
});

test('counts duplicate faces independently of winding', () => {
  const parsed = parseObj('v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\nf 3 2 1');
  const report = auditObj(parsed);
  assert.equal(report.duplicateFaces, 1);
  assert.equal(report.faceCount, 2);
  assert.equal(report.boundaryEdges, 0);
  assert.equal(report.nonManifoldEdges, 0);
  assert.equal(report.connectedFaceComponents.length, 1);
});

test('two disconnected tetrahedra are closed edge-connected components', () => {
  const one = tetra();
  const two = tetra(10);
  const parsed = parseObj([...one.v, ...two.v, ...one.f, ...two.f].join('\n'));
  const report = auditObj(parsed);
  assert.equal(report.vertexCount, 8);
  assert.equal(report.faceCount, 8);
  assert.equal(report.boundaryEdges, 0);
  assert.equal(report.nonManifoldEdges, 0);
  assert.deepEqual(report.connectedFaceComponents.map(x => x.faceCount), [4, 4]);
  assert.deepEqual(report.connectedFaceComponents.map(x => x.bounds), [
    { min: [0, 0, 0], max: [1, 1, 1] },
    { min: [10, 0, 0], max: [11, 1, 1] },
  ]);
});

test('reports open, non-manifold and degenerate triangles', () => {
  const parsed = parseObj([
    'v 0 0 0', 'v 1 0 0', 'v 0 1 0', 'v 0 -1 0', 'v 0 0 1',
    'f 1 2 3', 'f 2 1 4', 'f 1 2 5', 'f 1 1 2',
  ].join('\n'));
  const report = auditObj(parsed);
  assert.equal(report.degenerateFaces, 1);
  assert.equal(report.nonManifoldEdges, 1);
  assert.equal(report.boundaryEdges, 6);
  assert.equal(report.connectedFaceComponents.length, 1);
  const collinear = auditObj(parseObj('v 0 0 0\nv 1 0 0\nv 2 0 0\nf 1 2 3'));
  assert.equal(collinear.degenerateFaces, 1);
  const repeated = auditObj(parseObj([
    'v 0 0 0', 'v 1 0 0', 'v 0 1 0',
    'f 1 2 3', 'f 1 1 2',
  ].join('\n')));
  assert.equal(repeated.nonManifoldEdges, 0);
  assert.equal(repeated.boundaryEdges, 2);
});

test('empty OBJ has null bounds and no components', () => {
  const report = auditObj(parseObj('# empty\n'));
  assert.equal(report.vertexCount, 0);
  assert.equal(report.faceCount, 0);
  assert.equal(report.bounds, null);
  assert.deepEqual(report.connectedFaceComponents, []);
});
