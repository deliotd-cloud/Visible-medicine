// Test-only exact reversal; this is not a learner fallback or approval migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/toe-bone-ultrasound-pins.json' with {type: 'json'};
import transition from '../content/toe-bone-ultrasound.transition.json' with {type: 'json'};
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function authoringBeforeToeBoneUltrasound({api, catalog}) {
  assert.equal(pins.baseline, 'a1cb14f05b3070b8553e85e3596f634b2bf36a5d');
  assert.equal(hash(pins), '3821c623cf0e31b608ca2ac69f2b124a150beb27312675822e50dee1771f6f5e');
  assert.equal(hash(transition), '6907c1135c75364776c5bf18920de3b66d1f546b5bdc0a0e85aa253189fa449b');
  assert.equal(transition.sourcePinsHash, hash(pins));
  assert.equal(transition.baseline, pins.baseline);
  const display = api.bodyDisplayCatalog(catalog);
  const originals = new Map();
  let drafts = 0, previous = 0;
  for (const entry of pins.entries) {
    assert.deepEqual(display.structures.find(s => s.id === entry.identity.id), entry.identity, 'Unrecorded toe-bone ultrasound identity');
    for (const [tab, lesson] of Object.entries(entry.previous)) {
      assert.equal(lesson.readiness, 'pending');
      const recorded = transition.entries.find(e => e.id === entry.identity.id && e.tab === tab);
      assert(recorded);
      assert.equal(recorded.fmaId, entry.identity.fmaId);
      assert.equal(hash(api.toeBoneUltrasoundLesson(entry.identity, tab)), recorded.draftHash, 'Unrecorded toe-bone ultrasound draft');
      const current = api.bodyLesson(entry.identity, tab);
      if (hash(current) === recorded.draftHash) drafts++;
      else { assert.deepEqual(current, lesson, 'Unrecorded toe-bone ultrasound history'); previous++; }
      const {readiness, ...shown} = current;
      assert.deepEqual(api.bodyContent(entry.identity, tab), shown);
      originals.set(entry.identity.id + ':' + tab, {identity: entry.identity, lesson});
    }
  }
  assert(drafts === 28 || previous === 28, 'Mixed toe-bone ultrasound history');
  if (previous === 28) return api;
  const bodyLesson = (structure, tab) => {
    const entry = originals.get(structure.id + ':' + tab);
    if (!entry) return api.bodyLesson(structure, tab);
    assert.deepEqual(structure, entry.identity, 'Historical toe-bone ultrasound lesson requires exact source identity');
    return structuredClone(entry.lesson);
  };
  const bodyContent = (structure, tab) => {
    if (!originals.has(structure.id + ':' + tab)) return api.bodyContent(structure, tab);
    const {readiness, ...shown} = bodyLesson(structure, tab);
    return shown;
  };
  return {...api, bodyLesson, bodyContent};
}
