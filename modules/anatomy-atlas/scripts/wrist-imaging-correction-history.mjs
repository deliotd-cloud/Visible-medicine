// Exact test-only reversal. Never imported into learner dispatch or approvals.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/wrist-imaging-correction-pins.json' with {type: 'json'};
import transition from '../content/wrist-imaging-correction.transition.json' with {type: 'json'};
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function authoringBeforeWristImagingCorrection({api, catalog}) {
  assert.equal(pins.baseline, '90191b8b236bfed00db7c424dbacde915920460d');
  assert.equal(hash(pins), '15dfbad1c4484cfb90962ee158c2f12fd113f73edbd2ddb6999f79708668f343');
  assert.equal(hash(transition), '74b600dd3a73ac6258c026289fe629f41b16956295a8a73f2d2775867f51abd7');
  assert.equal(transition.sourcePinsHash, hash(pins)); assert.equal(transition.baseline, pins.baseline);
  const display = api.bodyDisplayCatalog(catalog), originals = new Map();
  assert.equal(pins.entries.length, 16); assert.equal(transition.entries.length, 48);
  let drafts = 0, previous = 0;
  for (const entry of pins.entries) {
    assert.deepEqual(display.structures.find(s => s.id === entry.identity.id), entry.identity, 'Unrecorded wrist correction identity');
    assert.deepEqual(Object.keys(entry.previous), ['ct', 'mri', 'xray']);
    for (const [tab, lesson] of Object.entries(entry.previous)) {
      assert.equal(lesson.readiness, 'draft');
      const rows = transition.entries.filter(e => e.id === entry.identity.id && e.tab === tab);
      assert.equal(rows.length, 1); const recorded = rows[0]; assert.equal(recorded.fmaId, entry.identity.fmaId);
      const current = api.bodyLesson(entry.identity, tab);
      if (hash(current) === recorded.draftHash) drafts++;
      else {assert.deepEqual(current, lesson, 'Unrecorded wrist correction history'); previous++;}
      const {readiness, ...shown} = current; assert.deepEqual(api.bodyContent(entry.identity, tab), shown);
      originals.set(entry.identity.id + ':' + tab, {identity: entry.identity, lesson});
    }
  }
  assert(drafts === 48 || previous === 48, 'Mixed wrist correction history');
  if (previous === 48) return api;
  const bodyLesson = (s, tab) => {
    const entry = originals.get(s.id + ':' + tab);
    if (!entry) return api.bodyLesson(s, tab);
    assert.deepEqual(s, entry.identity, 'Historical wrist correction requires exact source identity');
    return structuredClone(entry.lesson);
  };
  const bodyContent = (s, tab) => {
    if (!originals.has(s.id + ':' + tab)) return api.bodyContent(s, tab);
    const {readiness, ...shown} = bodyLesson(s, tab); return shown;
  };
  return {...api, bodyLesson, bodyContent};
}
