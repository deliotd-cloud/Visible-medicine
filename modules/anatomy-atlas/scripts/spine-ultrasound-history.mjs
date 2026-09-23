// Offline reconstruction of the 15 prior pending ultrasound sections.
// Integration may compose this before older whole-body snapshot adapters.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import pins from '../content/spine-ultrasound-pins.json' with { type: 'json' };
import transition from '../content/spine-ultrasound.transition.json' with { type: 'json' };
import spinePins from '../content/spine-imaging-pins.json' with { type: 'json' };

const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function authoringBeforeSpineUltrasound({ api, catalog }) {
  assert.equal(hash(pins), '5be1ddb61ede871483ff7478546fde3cac3faa7755fc4c1a18346c3622ccdd57');
  assert.equal(hash(transition), '0f1980dfc7f16dd7e48c2bc5c33b2ed6d84a1897844492256eabd9a646502050');
  assert.equal(hash(spinePins), pins.parentPinsHash);
  assert.equal(pins.sourceCommit, transition.sourceCommit);
  assert.equal(pins.tab, 'ultrasound');
  assert.equal(pins.previousLesson.readiness, 'pending');
  assert.equal(pins.entries.length, 15);
  assert.deepEqual(
    transition.entries.map(({ id, fmaId }) => ({ id, fmaId })),
    pins.entries,
  );
  const parentById = new Map(spinePins.entries.map(({ identity }) => [identity.id, identity]));
  const originals = new Map();
  let draftCount = 0, priorCount = 0;
  for (const [index, entry] of pins.entries.entries()) {
    const identity = parentById.get(entry.id);
    assert(identity, 'Ultrasound entry must belong to the existing spine pin set');
    assert.equal(identity.fmaId, entry.fmaId);
    assert.deepEqual(catalog.structures.find((s) => s.id === entry.id), identity);
    const draft = api.spineImagingLesson(identity, 'ultrasound');
    assert.equal(draft?.readiness, 'draft');
    assert.equal(hash(draft), transition.entries[index].draftHash,
      'Unrecorded spine ultrasound edit: ' + entry.id);
    const current = api.bodyLesson(identity, 'ultrasound');
    if (hash(current) === transition.entries[index].draftHash) draftCount++;
    else { assert.deepEqual(current, pins.previousLesson, 'Unrecorded spine ultrasound history'); priorCount++; }
    const { readiness: _readiness, ...shown } = current;
    assert.deepEqual(api.bodyContent(identity, 'ultrasound'), shown);
    originals.set(entry.id, identity);
  }
  assert(draftCount === 15 || priorCount === 15, 'Mixed spine ultrasound history');
  if (priorCount === 15) return api;
  const bodyLesson = (s, tab) => {
    const identity = tab === 'ultrasound' && originals.get(s.id);
    if (!identity) return api.bodyLesson(s, tab);
    assert.deepEqual(s, identity, 'Historical ultrasound lesson requires exact source identity');
    return structuredClone(pins.previousLesson);
  };
  const bodyContent = (s, tab) => {
    const { readiness: _readiness, ...shown } = bodyLesson(s, tab);
    return shown;
  };
  return { ...api, bodyLesson, bodyContent };
}
