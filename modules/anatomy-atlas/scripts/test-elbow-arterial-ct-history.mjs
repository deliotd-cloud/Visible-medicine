import assert from 'node:assert/strict';
import { beforeElbowArterialCt } from './elbow-arterial-ct-history.mjs';
import pins from '../content/elbow-arterial-ct-pins.json' with { type: 'json' };
import clinicalPins from '../content/elbow-clinical-pins.json' with { type: 'json' };

// The older clinical adapter is allowed to restore exactly its recorded copy.
// No runtime content, approval, source pin or historical hash is changed here.
const earlier = new Map(clinicalPins.entries.map(e => [e.identity.id, e.previous.ct]));
const legacy = { bodyLesson(s, tab) {
  assert.equal(tab, 'ct');
  return structuredClone(earlier.get(s.id));
} };
assert.equal(beforeElbowArterialCt(legacy), legacy);
assert.equal(beforeElbowArterialCt(beforeElbowArterialCt(legacy)), legacy);
for (const entry of pins.entries) {
  assert.throws(() => beforeElbowArterialCt({ bodyLesson(s, tab) {
    return s.id === entry.identity.id ? structuredClone(entry.previous.ct) : legacy.bodyLesson(s, tab);
  } }), /Mixed elbow arterial CT history/);
  assert.throws(() => beforeElbowArterialCt({ bodyLesson(s, tab) {
    const lesson = legacy.bodyLesson(s, tab);
    return s.id === entry.identity.id ? { ...lesson, body: 'Unrecorded pending wording' } : lesson;
  } }), /Unrecorded elbow arterial CT/);
}
console.log('Elbow CT history: exact legacy replay/idempotence and 28 mixed/foreign-copy rejections pass.');
