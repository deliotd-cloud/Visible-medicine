import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { pathToFileURL, fileURLToPath } from 'node:url';

const native = process.env.VM_PROSTATE_ORIENTATION_DEPENDENCIES ?? fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(pathToFileURL(`${native}/package.json`));
const { Matrix4, Quaternion, Vector3 } = require('three');
const { projectProstateOrientation } = await import('../lib/prostate-orientation.ts');

const anatomical = {
  R: new Vector3(-1, 0, 0), L: new Vector3(1, 0, 0),
  S: new Vector3(0, 1, 0), I: new Vector3(0, -1, 0),
  A: new Vector3(0, 0, 1), P: new Vector3(0, 0, -1),
};
const camera = (eye, up) => new Quaternion().setFromRotationMatrix(
  new Matrix4().lookAt(new Vector3(...eye), new Vector3(), new Vector3(...up)));
const get = (markers, label) => markers.find(marker => marker.label === label);
const near = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);

function checkAgainstThree(q) {
  const markers = projectProstateOrientation(q);
  assert.ok(markers && markers.length <= 6);
  const inverse = q.clone().normalize().invert();
  const labels = new Set();
  for (const marker of markers) {
    assert.ok(!labels.has(marker.label));
    labels.add(marker.label);
    const expected = anatomical[marker.label].clone().applyQuaternion(inverse);
    near(marker.x, 42 + 26 * expected.x);
    near(marker.y, 42 - 26 * expected.y);
    near(marker.depth, expected.z);
    assert.ok(Number.isFinite(marker.x) && Number.isFinite(marker.y) && Number.isFinite(marker.depth));
    assert.ok(marker.x >= 16 - 1e-9 && marker.x <= 68 + 1e-9);
    assert.ok(marker.y >= 16 - 1e-9 && marker.y <= 68 + 1e-9);
    assert.ok(marker.depth >= -1 - 1e-9 && marker.depth <= 1 + 1e-9);
    assert.ok(Math.hypot(expected.x, expected.y) >= 0.3 - 1e-9);
  }
  for (let a = 0; a < markers.length; a++) {
    if (a) assert.ok(markers[a - 1].depth <= markers[a].depth + 1e-12);
    for (let b = a + 1; b < markers.length; b++) {
      assert.ok(Math.hypot(markers[a].x - markers[b].x, markers[a].y - markers[b].y) >= 12 - 1e-9);
    }
  }
  return markers;
}

test('axial feet view places R left, L right, A top, and P bottom', () => {
  const markers = checkAgainstThree(camera([0, -3.2, 0.01], [0, 0, 1]));
  assert.deepEqual(new Set(markers.map(marker => marker.label)), new Set(['R', 'L', 'A', 'P']));
  assert.ok(get(markers, 'R').x < 42 && get(markers, 'L').x > 42);
  assert.ok(get(markers, 'A').y < 42 && get(markers, 'P').y > 42);
  assert.ok(get(markers, 'R').x < get(markers, 'L').x);
  assert.ok(get(markers, 'A').y < get(markers, 'P').y);
});

test('anterior and posterior views retain anatomical names and near depth', () => {
  const anterior = checkAgainstThree(camera([0, 0.1, 3.4], [0, 1, 0]));
  const posterior = checkAgainstThree(camera([0, 0.1, -3.4], [0, 1, 0]));
  assert.ok(get(anterior, 'R').x < 42 && get(anterior, 'L').x > 42);
  assert.ok(get(posterior, 'R').x > 42 && get(posterior, 'L').x < 42);
  assert.ok(!get(anterior, 'A') && !get(anterior, 'P'));
  assert.ok(!get(posterior, 'A') && !get(posterior, 'P'));
});

test('oblique and rolled cameras match independent Three projections', () => {
  const oblique = checkAgainstThree(camera([1.5, 2.3, 2.1], [0, 1, 0]));
  const rolled = checkAgainstThree(camera([0.7, -2.6, 1.2], [0.8, 0, 0.6]));
  assert.ok(oblique.length >= 3 && rolled.length >= 3);
});

test('quaternion sign and scale leave markers unchanged', () => {
  const q = camera([1.5, 2.3, 2.1], [0, 1, 0]);
  const baseline = projectProstateOrientation(q);
  for (const factor of [-1, 7, -0.001, 1e300, 1e-300]) {
    const scaled = { x: q.x * factor, y: q.y * factor, z: q.z * factor, w: q.w * factor };
    const actual = projectProstateOrientation(scaled);
    assert.deepEqual(actual.map(marker => marker.label), baseline.map(marker => marker.label));
    for (let i = 0; i < actual.length; i++) {
      near(actual[i].x, baseline[i].x, 1e-9);
      near(actual[i].y, baseline[i].y, 1e-9);
      near(actual[i].depth, baseline[i].depth, 1e-9);
    }
  }
});

test('zero, non-finite, and missing quaternions are rejected', () => {
  for (const invalid of [null, undefined, {}, { x: 0, y: 0, z: 0, w: 0 },
    { x: NaN, y: 0, z: 0, w: 1 }, { x: 0, y: Infinity, z: 0, w: 1 }]) {
    assert.equal(projectProstateOrientation(invalid), null);
  }
});

test('collision resolution keeps nearer labels and is deterministic', () => {
  const q = camera([1, -0.9, 0.1], [0, 0, 1]);
  const first = checkAgainstThree(q);
  assert.deepEqual(projectProstateOrientation(q), first);
  // Enumerate the candidate projections independently to ensure that a
  // suppressed centre has a retained, at least as near centre close to it.
  const inverse = q.clone().invert();
  const raw = Object.entries(anatomical).map(([label, direction]) => {
    const point = direction.clone().applyQuaternion(inverse);
    return { label, x: 42 + 26 * point.x, y: 42 - 26 * point.y,
      depth: point.z, radius: Math.hypot(point.x, point.y) };
  }).filter(marker => marker.radius >= 0.3);
  const suppressed = raw.filter(marker => !get(first, marker.label));
  assert.ok(suppressed.length > 0);
  for (const candidate of suppressed) {
    assert.ok(first.some(marker => marker.depth >= candidate.depth - 1e-9 &&
      Math.hypot(marker.x - candidate.x, marker.y - candidate.y) < 12));
  }
});
