import assert from 'node:assert/strict';
import test from 'node:test';
import { compareSourceShapeEquivalence, sourceShapeSignature,
  SOURCE_SHAPE_TOLERANCE } from './source-shape-equivalence.mjs';

const source = {
  vertices: [[0, 0, 0], [3, 0, 0], [0, 4, 0], [0, 0, 5], [3, 4, 1]],
  faces: [[0, 1, 2], [0, 3, 1], [1, 4, 2]],
};

function transformed(shape, fn, order = [4, 2, 0, 3, 1]) {
  const oldToNew = new Map(order.map((old, index) => [old, index]));
  return { vertices: order.map((old) => fn(shape.vertices[old])),
    faces: [...shape.faces].reverse().map((face) =>
      [...face].reverse().map((old) => oldToNew.get(old))) };
}

test('permuted vertices/faces, reversed winding and translation have one signature', () => {
  const before = structuredClone(source);
  const other = transformed(source, ([x, y, z]) => [x + 100, y - 20, z + 7]);
  const otherBefore = structuredClone(other);
  assert.equal(sourceShapeSignature(source).signature, sourceShapeSignature(other).signature);
  assert.equal(compareSourceShapeEquivalence(source, other).equivalent, true);
  assert.deepEqual(source, before);
  assert.deepEqual(other, otherBefore);
});

test('independent source-axis reflections match only when enabled', () => {
  for (let bits = 1; bits < 8; bits++) {
    const other = transformed(source, (point) => point.map((n, axis) =>
      (bits & (1 << axis) ? -n : n) + [13, -17, 23][axis]));
    assert.equal(compareSourceShapeEquivalence(source, other,
      { allowReflections: true }).equivalent, true);
  }
  const reflected = transformed(source, ([x, y, z]) => [-x + 13, y - 17, z + 23]);
  assert.equal(compareSourceShapeEquivalence(source, reflected).equivalent, false);
});

test('changed geometry, scaling and triangle count do not match', () => {
  const changed = structuredClone(source);
  changed.vertices[4][2] += 0.01;
  assert.equal(compareSourceShapeEquivalence(source, changed,
    { allowReflections: true }).equivalent, false);
  const scaled = transformed(source, (point) => point.map((n) => n * 2));
  assert.equal(compareSourceShapeEquivalence(source, scaled,
    { allowReflections: true }).equivalent, false);
  const fewer = structuredClone(source);
  fewer.faces.pop();
  assert.equal(compareSourceShapeEquivalence(source, fewer).reason,
    'triangle-count-mismatch');
});

test('invalid, nonfinite and degenerate geometry is rejected', () => {
  assert.equal(SOURCE_SHAPE_TOLERANCE, 1e-6);
  assert.throws(() => sourceShapeSignature({ vertices: [[0, 0, 0]], faces: [[0, 0, 0]] }),
    /degenerate/);
  assert.throws(() => sourceShapeSignature({ vertices: [[0, 0, 0], [1, 0, 0],
    [Infinity, 1, 0]], faces: [[0, 1, 2]] }), /Non-finite/);
  assert.throws(() => sourceShapeSignature({ vertices: [[0, 0, 0]], faces: [[0, 1, 2]] }),
    /index/);
  assert.throws(() => sourceShapeSignature(source, { tolerance: 0 }), /tolerance/);
});

test('sparse arrays and unused malformed vertices are rejected', () => {
  const sparseVertices = structuredClone(source);
  sparseVertices.vertices.length++;
  assert.throws(() => sourceShapeSignature(sparseVertices), /vertex/);
  const sparseFaces = structuredClone(source);
  sparseFaces.faces.length++;
  assert.throws(() => sourceShapeSignature(sparseFaces), /triangle/);
  const vertexHole = structuredClone(source);
  vertexHole.vertices.push([1, , 2]);
  assert.throws(() => sourceShapeSignature(vertexHole), /vertex/);
  const faceHole = structuredClone(source);
  faceHole.faces.push([0, , 2]);
  assert.throws(() => sourceShapeSignature(faceHole), /index/);
});

test('invalid options, unsafe ranges and quantized degenerate faces are rejected', () => {
  assert.throws(() => sourceShapeSignature(source, { allowReflections: 'yes' }),
    /allowReflections/);
  for (const tolerance of [-1, NaN, Infinity]) {
    assert.throws(() => sourceShapeSignature(source, { tolerance }), /tolerance/);
  }
  assert.throws(() => sourceShapeSignature(source, { tolerance: 1e-30 }),
    /safe quantization range/);
  const collapsed = { vertices: [[0, 0, 0], [1e-7, 0, 0], [0, 1e-7, 0]],
    faces: [[0, 1, 2]] };
  assert.throws(() => sourceShapeSignature(collapsed), /after quantization/);
  assert.throws(() => compareSourceShapeEquivalence(collapsed, collapsed),
    /after quantization/);
});
