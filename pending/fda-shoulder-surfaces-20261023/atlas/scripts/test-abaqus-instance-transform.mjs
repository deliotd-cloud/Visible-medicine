import assert from 'node:assert/strict';
import test from 'node:test';
import { transformInstancePoint as place } from './abaqus-instance-transform.mjs';

function near(actual, expected, tolerance = 1e-12) {
  assert.equal(actual.length, 3);
  for (let i = 0; i < 3; i++) {
    assert.ok(Math.abs(actual[i] - expected[i]) <= tolerance,
      `coordinate ${i}: expected ${expected[i]}, received ${actual[i]}`);
  }
}

test('identity returns a new point without mutating input', () => {
  const point = Object.freeze([1, -2, 3]);
  const rows = Object.freeze([]);
  const result = place(point, rows);
  assert.deepEqual(result, point);
  assert.notStrictEqual(result, point);
});

test('translation uses the three components and preserves inputs', () => {
  const point = Object.freeze([1, 2, 3]);
  const rows = Object.freeze([Object.freeze([4, -6, 0.5])]);
  assert.deepEqual(place(point, rows), [5, -4, 3.5]);
  assert.deepEqual(point, [1, 2, 3]);
  assert.deepEqual(rows[0], [4, -6, 0.5]);
});

test('right-handed positive, negative, half, and full turns', () => {
  const rotate = angle => place([1, 0, 0], [[0, 0, 0], [0, 0, 0, 0, 0, 2, angle]]);
  near(rotate(90), [0, 1, 0]);
  near(rotate(-90), [0, -1, 0]);
  near(rotate(180), [-1, 0, 0]);
  near(rotate(360), [1, 0, 0]);
});

test('rotates about an offset global axis', () => {
  near(place([2, 1, 3], [[0, 0, 0], [1, 1, 0, 1, 1, 7, 90]]), [1, 2, 3]);
});

test('normalizes an arbitrary oblique axis', () => {
  // Axis direction (1,1,1), scaled by five. A 120-degree cycle permutes x,y,z.
  near(place([1, 0, 0], [[0, 0, 0], [0, 0, 0, 5, 5, 5, 120]]), [0, 1, 0]);
});

test('translation precedes rotation and does not commute with it', () => {
  near(place([1, 0, 0], [[1, 0, 0], [0, 0, 0, 0, 0, 1, 90]]), [0, 2, 0]);
});

test('inverse rotation and translation roundtrip', () => {
  const original = [3, -4, 5];
  const translatedAndRotated = place(original, [[2, 3, -1], [1, 0, 0, 1, 0, 4, 37]]);
  const unrotated = place(translatedAndRotated, [[0, 0, 0], [1, 0, 0, 1, 0, 4, -37]]);
  near(place(unrotated, [[-2, -3, 1]]), original);
});

test('rotation preserves vector norm and pairwise distance', () => {
  const rows = [[0, 0, 0], [0, 0, 0, 2, 3, 6, 73]];
  const a = [2, -1, 4];
  const b = [-3, 5, 2];
  const ra = place(a, rows);
  const rb = place(b, rows);
  const norm = p => Math.hypot(...p);
  const distance = (p, q) => Math.hypot(...p.map((value, i) => value - q[i]));
  assert.ok(Math.abs(norm(ra) - norm(a)) < 1e-12);
  assert.ok(Math.abs(distance(ra, rb) - distance(a, b)) < 1e-12);
});

test('rejects invalid point, malformed rows, nonfinite values and zero axis', () => {
  const invalid = [
    [null, []], [[1, 2], []], [['1', 2, 3], []], [[NaN, 0, 0], []],
    [[0, 0, 0], null], [[0, 0, 0], [1, 2, 3]],
    [[0, 0, 0], [[0, 0, 0], [0, 0, 0]]],
    [[0, 0, 0], [[0, 0, 0], [0, 0, 0, 0, 0, 1]]],
    [[0, 0, 0], [[0, 0, 0], [0, 0, 0, 0, 0, 1, Infinity]]],
    [[0, 0, 0], [[0, 0, 0], [1, 2, 3, 1, 2, 3, 90]]],
    [[0, 0, 0], [[0, 0, 0], [0, 0, 0, 0, 0, 1, 90], []]],
  ];
  for (const [point, rows] of invalid) assert.throws(() => place(point, rows));
});

test('rejects arithmetic overflow in translation, axis and rotation', () => {
  assert.throws(() => place([1e308, 0, 0], [[1e308, 0, 0]]), RangeError);
  assert.throws(() => place([0, 0, 0], [[0, 0, 0], [-1e308, 0, 0, 1e308, 0, 0, 90]]), RangeError);
  assert.throws(() => place([1.5e308, 1.5e308, 0], [[0, 0, 0], [0, 0, 0, 0, 0, 1, 45]]), RangeError);
  assert.throws(() => place([1e308, 0, 0], [[0, 0, 0], [-1e308, 0, 0, -1e308, 0, 1, 90]]), RangeError);
});
