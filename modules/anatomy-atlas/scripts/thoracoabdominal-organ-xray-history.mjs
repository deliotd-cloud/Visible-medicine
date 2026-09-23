// Offline reconstruction of the 11 prior pending X-ray lessons.
// Kept separate from the older thoracoabdominal history chain to avoid cycles.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import pins from '../content/thoracoabdominal-organ-imaging-pins.json' with { type: 'json' };
import transition from '../content/thoracoabdominal-organ-xray.transition.json' with { type: 'json' };

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function authoringBeforeThoracoabdominalOrganXray(context) {
  const { api } = context;
  assert.equal(hash(transition), '7d341e6ffc5f66ac4829b21b2a7098636c09424a4a51c3c76decdfb61e479609');
  assert.equal(transition.originalPinsHash, hash(pins));
  assert.equal(transition.parentCommit, 'c3bbeb492cd14cc0f01bc2a85e6303291aab5414');
  const pinned = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
  assert.equal(transition.entries.length, 11);
  let draftCount = 0, priorCount = 0;
  for (const { id, draftHash } of transition.entries) {
    const entry = pinned.get(id);
    assert(entry?.identity && api.thoracoabdominalOrganImagingGroups[entry.group].focus.xray);
    assert.equal(hash(api.thoracoabdominalOrganImagingLesson(entry.identity, 'xray')), draftHash,
      'Unrecorded thoracoabdominal organ X-ray draft');
    const current = api.bodyLesson(entry.identity, 'xray');
    if (hash(current) === draftHash) draftCount++;
    else { assert.deepEqual(current, transition.previous, 'Unrecorded thoracoabdominal organ X-ray change'); priorCount++; }
  }
  assert(draftCount === 11 || priorCount === 11, 'Mixed thoracoabdominal organ X-ray history');
  if (priorCount === 11) return context;
  const ids = new Set(transition.entries.map(entry => entry.id));
  const bodyLesson = (structure, tab) => {
    if (tab !== 'xray' || !ids.has(structure.id)) return api.bodyLesson(structure, tab);
    assert.deepEqual(structure, pinned.get(structure.id).identity);
    return structuredClone(transition.previous);
  };
  return { ...context, api: { ...api, bodyLesson, bodyContent(structure, tab) {
    const { readiness: _readiness, ...content } = bodyLesson(structure, tab);
    return content;
  } } };
}
