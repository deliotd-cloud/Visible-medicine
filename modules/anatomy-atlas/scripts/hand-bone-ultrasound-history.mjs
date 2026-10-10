// Test-only exact reversal; this is not a learner fallback or approval migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/hand-bone-ultrasound-pins.json' with {type: 'json'};
import transition from '../content/hand-bone-ultrasound.transition.json' with {type: 'json'};
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function authoringBeforeHandBoneUltrasound({api, catalog}) {
  assert.equal(pins.baseline, 'cdc6ad23ad5c3c13a2f6588019a057d0a063818f');
  assert.equal(hash(pins), '58673652a31c3a58f26c538901b52b883f544d6ef71be775ae703ed3e2ec96a9');
  assert.equal(hash(transition), '927670e57058bd96b35e0341bd9182e7774e070496aff0f5b89e082d41035c90');
  assert.equal(transition.sourcePinsHash, hash(pins));
  assert.equal(transition.baseline, pins.baseline);
  const display = api.bodyDisplayCatalog(catalog);
  const originals = new Map();
  let drafts = 0, previous = 0;
  for (const entry of pins.entries) {
    assert.deepEqual(display.structures.find(s => s.id === entry.identity.id), entry.identity, 'Unrecorded hand-bone ultrasound identity');
    for (const [tab, lesson] of Object.entries(entry.previous)) {
      assert.equal(lesson.readiness, 'pending');
      const recorded = transition.entries.find(e => e.id === entry.identity.id && e.tab === tab);
      assert(recorded);
      assert.equal(recorded.fmaId, entry.identity.fmaId);
      assert.equal(hash(api.handBoneUltrasoundLesson(entry.identity, tab)), recorded.draftHash, 'Unrecorded hand-bone ultrasound draft');
      const current = api.bodyLesson(entry.identity, tab);
      if (hash(current) === recorded.draftHash) drafts++;
      else { assert.deepEqual(current, lesson, 'Unrecorded hand-bone ultrasound history'); previous++; }
      const {readiness, ...shown} = current;
      assert.deepEqual(api.bodyContent(entry.identity, tab), shown);
      originals.set(entry.identity.id + ':' + tab, {identity: entry.identity, lesson});
    }
  }
  assert(drafts === 46 || previous === 46, 'Mixed hand-bone ultrasound history');
  if (previous === 46) return api;
  const bodyLesson = (structure, tab) => {
    const entry = originals.get(structure.id + ':' + tab);
    if (!entry) return api.bodyLesson(structure, tab);
    assert.deepEqual(structure, entry.identity, 'Historical hand-bone ultrasound lesson requires exact source identity');
    return structuredClone(entry.lesson);
  };
  const bodyContent = (structure, tab) => {
    if (!originals.has(structure.id + ':' + tab)) return api.bodyContent(structure, tab);
    const {readiness, ...shown} = bodyLesson(structure, tab);
    return shown;
  };
  return {...api, bodyLesson, bodyContent};
}
