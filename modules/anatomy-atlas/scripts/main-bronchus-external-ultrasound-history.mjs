// Offline reconstruction of the two previously pending external ultrasound lessons.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import pins from '../content/thoracoabdominal-organ-imaging-pins.json' with { type: 'json' };
import transition from '../content/main-bronchus-external-ultrasound.transition.json' with { type: 'json' };

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function authoringBeforeMainBronchusExternalUltrasound(context) {
  const { api } = context;
  assert.equal(hash(transition), '12ad7ac1d2635fc10fc6e17a4556cd7bbca22699f5b0d92a5f34c24e3918a581');
  assert.equal(transition.parentCommit, '3607b31a26058c46375fad12c5a6a9fcbddcb913');
  assert.equal(transition.originalPinsHash, hash(pins));
  assert.equal(transition.entries.length, 2);
  const pinned = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
  let draftCount = 0, priorCount = 0;
  for (const { id, fmaId, draftHash } of transition.entries) {
    const entry = pinned.get(id);
    assert.equal(entry?.identity.fmaId, fmaId);
    assert.equal(entry.group, fmaId === 'FMA7395' ? 'right-main-bronchus' : 'left-main-bronchus');
    assert.equal(hash(api.thoracoabdominalOrganImagingLesson(entry.identity, 'ultrasound')), draftHash,
      'Unrecorded main-bronchus external ultrasound draft');
    const current = api.bodyLesson(entry.identity, 'ultrasound');
    if (hash(current) === draftHash) draftCount++;
    else { assert.deepEqual(current, transition.previous, 'Unrecorded main-bronchus external ultrasound change'); priorCount++; }
  }
  assert(draftCount === 2 || priorCount === 2, 'Mixed main-bronchus external ultrasound history');
  if (priorCount === 2) return context;
  const ids = new Set(transition.entries.map(entry => entry.id));
  const bodyLesson = (structure, tab) => {
    if (tab !== 'ultrasound' || !ids.has(structure.id)) return api.bodyLesson(structure, tab);
    assert.deepEqual(structure, pinned.get(structure.id).identity);
    return structuredClone(transition.previous);
  };
  return { ...context, api: { ...api, bodyLesson, bodyContent(structure, tab) {
    const { readiness: _readiness, ...content } = bodyLesson(structure, tab);
    return content;
  } } };
}
