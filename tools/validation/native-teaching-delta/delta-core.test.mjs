import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyTeachingDelta, verifyDisplayPinDelta } from './delta-core.mjs';

const h = character => character.repeat(64);
const row = (identity, lesson) => ({ region: 'head', identity, topic: 'topic', lesson });
const rows = [row('a', { answer: 'right', explanation: 'detail' }), row('b', { answer: 'yes' })];
const copy = value => structuredClone(value);
const report = pins => ({
  schema: 'v1', scope: { atlas: 'education' }, algorithm: 'sha256',
  evidenceFields: ['structureId', 'sha256'], pins,
});
const before = report([{ structureId: 'a', sha256: h('a') }, { structureId: 'b', sha256: h('b') }]);
const after = report([{ structureId: 'a', sha256: h('c') }, { structureId: 'b', sha256: h('b') }]);
const teachingFails = actual => assert.throws(() => verifyTeachingDelta(rows, actual));
const pinFails = (actual, changedStructureIds = ['a'], exactChangedPins = []) =>
  assert.throws(() => verifyDisplayPinDelta({ baseline: before, actual, changedStructureIds, exactChangedPins }));

test('valid composed teaching and display change', () => {
  assert.deepEqual(verifyTeachingDelta(rows, copy(rows)), { lessons: 2 });
  assert.deepEqual(verifyDisplayPinDelta({ baseline: before, actual: after, changedStructureIds: ['a'],
    exactChangedPins: [{ structureId: 'a', sha256: h('c') }] }),
  { worksheets: 2, changed: 1, unchanged: 1, exactChangedPins: 1 });
  assert.equal(verifyDisplayPinDelta({ baseline: before, actual: after, changedStructureIds: ['a'] }).exactChangedPins, 0);
});

test('teaching rejects stale lesson and incorrect answer', () => {
  const stale = copy(rows); stale[0].lesson.explanation = 'old'; teachingFails(stale);
  const wrong = copy(rows); wrong[0].lesson.answer = 'wrong'; teachingFails(wrong);
});

test('teaching distinguishes missing from undefined and rejects row changes', () => {
  const expected = [row('a', { answer: undefined })];
  const missing = [row('a', {})];
  assert.throws(() => verifyTeachingDelta(expected, missing));
  teachingFails(rows.slice(0, 1));
  teachingFails([...copy(rows), row('c', { answer: 'extra' })]);
  teachingFails([copy(rows[1]), copy(rows[0])]);
  teachingFails([copy(rows[0]), copy(rows[0])]);
  assert.throws(() => verifyTeachingDelta([], []));
  assert.throws(() => verifyTeachingDelta([row('', {})], [row('', {})]));
  assert.throws(() => verifyTeachingDelta([{ ...row('a', {}), topic: 1 }], [row('a', {})]));
  assert.throws(() => verifyTeachingDelta([{ ...row('a', {}), region: 1 }], [row('a', {})]));
});

test('display rejects stale and unrelated hashes', () => {
  pinFails(copy(before));
  const unrelated = copy(after); unrelated.pins[1].sha256 = h('d'); pinFails(unrelated);
  pinFails(copy(after), []);
});

test('display rejects duplicate, missing and reordered IDs', () => {
  const duplicate = copy(after); duplicate.pins[1].structureId = 'a'; pinFails(duplicate);
  const missing = copy(after); missing.pins.pop(); pinFails(missing);
  const reordered = copy(after); reordered.pins.reverse(); pinFails(reordered);
});

test('display rejects metadata alterations and bad hashes', () => {
  const altered = copy(after); altered.scope.atlas = 'other'; pinFails(altered);
  const removed = copy(after); delete removed.evidenceFields; pinFails(removed);
  const added = copy(after); added.newField = undefined; pinFails(added);
  const bad = copy(after); bad.pins[0].sha256 = 'A'.repeat(64); pinFails(bad);
  const badLength = copy(after); badLength.pins[0].sha256 = 'abc'; pinFails(badLength);
});

test('display rejects duplicate or out-of-scope expectations and mismatched exact pin', () => {
  pinFails(copy(after), ['a', 'a']);
  pinFails(copy(after), ['missing']);
  pinFails(copy(after), ['a'], [{ structureId: 'b', sha256: h('b') }]);
  pinFails(copy(after), ['a'], [{ structureId: 'a', sha256: h('d') }]);
  pinFails(copy(after), ['a'], [
    { structureId: 'a', sha256: h('c') }, { structureId: 'a', sha256: h('c') },
  ]);
});
