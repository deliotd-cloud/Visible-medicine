// Offline reconstruction of the 13 prior pending spinal-bone ultrasound lessons.
// Compose before older whole-body history adapters; never use in production dispatch.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import pins from '../content/spinal-bone-ultrasound-pins.json' with { type: 'json' };
import transition from '../content/spinal-bone-ultrasound.transition.json' with { type: 'json' };

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function authoringBeforeSpinalBoneUltrasound({ api, catalog }) {
  assert.equal(hash(pins), 'a958dc03a405bed6325c570f922b585f1b59d2999aca44f6fb59cbbe20ac339a');
  assert.equal(hash(transition), '8b071585a7958a0a64c7598d3ecd7207f788042334755bac22ff66255493cf2b');
  assert.equal(transition.sourcePinsHash, hash(pins));
  assert.equal(transition.baseline, pins.baseline);
  assert.equal(pins.entries.length, 13);
  assert.deepEqual(
    transition.entries.map(({ id, fmaId }) => ({ id, fmaId })),
    pins.entries.map(({ identity }) => ({ id: identity.id, fmaId: identity.fmaId })),
  );

  const originals = new Map();
  let draftCount = 0, priorCount = 0;
  for (const [index, entry] of pins.entries.entries()) {
    const identity = entry.identity;
    assert.equal(entry.previous.readiness, 'pending');
    assert.deepEqual(catalog.structures.find(s => s.id === identity.id), identity,
      'Unrecorded spinal-bone ultrasound source identity: ' + identity.id);
    const draft = api.spinalBoneUltrasoundLesson(identity, 'ultrasound');
    assert.equal(draft?.readiness, 'draft');
    assert.equal(hash(draft), transition.entries[index].draftHash,
      'Unrecorded spinal-bone ultrasound draft: ' + identity.id);
    const current = api.bodyLesson(identity, 'ultrasound');
    if (hash(current) === transition.entries[index].draftHash) draftCount++;
    else {
      assert.deepEqual(current, entry.previous, 'Unrecorded spinal-bone ultrasound history: ' + identity.id);
      priorCount++;
    }
    const { readiness: _readiness, ...shown } = current;
    assert.deepEqual(api.bodyContent(identity, 'ultrasound'), shown);
    originals.set(identity.id, identity);
  }
  assert(draftCount === 13 || priorCount === 13, 'Mixed spinal-bone ultrasound history');
  if (priorCount === 13) return api;

  const bodyLesson = (s, tab) => {
    const identity = tab === 'ultrasound' && originals.get(s.id);
    if (!identity) return api.bodyLesson(s, tab);
    assert.deepEqual(s, identity, 'Historical ultrasound lesson requires exact source identity');
    return structuredClone(pins.entries.find(entry => entry.identity.id === s.id).previous);
  };
  const bodyContent = (s, tab) => {
    const identity = tab === 'ultrasound' && originals.get(s.id);
    if (!identity) return api.bodyContent(s, tab);
    const { readiness: _readiness, ...shown } = bodyLesson(s, tab);
    return shown;
  };
  return { ...api, bodyLesson, bodyContent };
}
