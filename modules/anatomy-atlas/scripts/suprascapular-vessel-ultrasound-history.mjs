// Test-only exact reversal. Never import into learner content dispatch.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/suprascapular-vessel-ultrasound-pins.json' with {type: 'json'};
import transition from '../content/suprascapular-vessel-ultrasound.transition.json' with {type: 'json'};
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function authoringBeforeSuprascapularVesselUltrasound({api, catalog}) {
  assert.equal(hash(pins), '0ed9e6ba9dabbbad9079639a7ecc23cc203d6c25a78b3b8d11045804498c6389');
  assert.equal(hash(transition), '65fe8cb39b7482ae350114ee5ab09332edc6ddaa50f9d4a45d0fe1285ecd31e8');
  assert.equal(transition.sourcePinsHash, hash(pins));
  assert.equal(transition.baseline, pins.baseline);
  assert.equal(pins.entries.length, 4);
  assert.equal(transition.entries.length, 4);
  const originals = new Map(); let drafts = 0, previous = 0;
  for (const [index, entry] of pins.entries.entries()) {
    assert.equal(entry.previous.readiness, 'pending');
    assert.deepEqual(catalog.structures.find(s => s.id === entry.identity.id), entry.identity, 'Unrecorded suprascapular source identity');
    assert.equal(transition.entries[index].id, entry.identity.id);
    assert.equal(transition.entries[index].fmaId, entry.identity.fmaId);
    assert.equal(hash(api.suprascapularVesselUltrasoundLesson(entry.identity, 'ultrasound')), transition.entries[index].draftHash, 'Unrecorded suprascapular draft');
    const current = api.bodyLesson(entry.identity, 'ultrasound');
    if (hash(current) === transition.entries[index].draftHash) drafts++;
    else {assert.deepEqual(current, entry.previous, 'Unrecorded suprascapular history'); previous++;}
    const {readiness, ...shown} = current;
    assert.deepEqual(api.bodyContent(entry.identity, 'ultrasound'), shown);
    originals.set(entry.identity.id, entry);
  }
  assert(drafts === 4 || previous === 4, 'Mixed suprascapular history');
  if (previous === 4) return api;
  const bodyLesson = (s, tab) => {
    const entry = tab === 'ultrasound' && originals.get(s.id);
    if (!entry) return api.bodyLesson(s, tab);
    assert.deepEqual(s, entry.identity, 'Historical suprascapular teaching requires exact source identity');
    return structuredClone(entry.previous);
  };
  const bodyContent = (s, tab) => {
    if (tab !== 'ultrasound' || !originals.has(s.id)) return api.bodyContent(s, tab);
    const {readiness, ...shown} = bodyLesson(s, tab); return shown;
  };
  return {...api, bodyLesson, bodyContent};
}
