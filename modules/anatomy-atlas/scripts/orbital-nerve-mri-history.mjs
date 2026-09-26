// Exact offline editorial replay only; never modifies runtime or approvals.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import pins from '../content/orbital-nerve-mri-pins.json' with { type: 'json' };
import transition from '../content/orbital-nerve-mri-transition.json' with { type: 'json' };
import { beforeInternalThoracicImaging } from './internal-thoracic-imaging-history.mjs';

export const orbitalMriHash = v => createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeOrbitalNerveMri(api) {
  api = beforeInternalThoracicImaging(api);
  if (typeof api.bodyLesson !== 'function') return api;
  assert.equal(orbitalMriHash(pins), 'd8d69bc1fb82293e45653f1c526d083ef7776c10d6061162a75305e07e7c5d1f');
  assert.equal(orbitalMriHash(transition), '33f9d8f5aab78befd895b20ff89c7cbcba5b4df3dfd1246e7ba008c92aa9ae91');
  assert.equal(transition.pinsHash, orbitalMriHash(pins));
  assert.equal(transition.parentCommit, pins.parentCommit);
  const records = new Map(transition.entries.map(e => [e.id + '|' + e.tab, e]));
  assert.equal(records.size, 14);assert.equal(transition.entries.length, 14);
  const previous = new Map();let old = 0, current = 0;
  for (const e of pins.entries) {
    assert.deepEqual(e.topics, ['mri']);
    const key = e.identity.id + '|mri', record = records.get(key);
    assert(record);assert.equal(record.previousHash, orbitalMriHash(e.previous.mri));
    const now = api.bodyLesson(e.identity, 'mri');
    if (isDeepStrictEqual(now, e.previous.mri)) old++;
    else { assert.equal(orbitalMriHash(now), record.currentHash, 'Unrecorded orbital MRI teaching');current++; }
    previous.set(key, { identity: e.identity, lesson: e.previous.mri });
  }
  assert(old === 14 || current === 14, 'Mixed orbital MRI history');
  if (old === 14) return api;
  const bodyLesson = (structure, tab) => {
    const e = previous.get(structure.id + '|' + tab);
    return e && isDeepStrictEqual(structure, e.identity) ? structuredClone(e.lesson) : api.bodyLesson(structure, tab);
  };
  return { ...api, bodyLesson, bodyContent(s, t) { const { readiness: _readiness, ...shown } = bodyLesson(s, t);return shown; } };
}
