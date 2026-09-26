// Test-only editorial replay; never imported by runtime, review or approvals.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import pins from '../content/transverse-mesocolon-mri-pins.json' with { type: 'json' };
import transition from '../content/transverse-mesocolon-mri-transition.json' with { type: 'json' };
import { beforeSmallIntestinalMesenteryMri } from './small-intestinal-mesentery-mri-history.mjs';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforeTransverseMesocolonMri(api) {
  api = beforeSmallIntestinalMesenteryMri(api);
  if (typeof api.bodyLesson !== 'function') return api;
  assert.equal(hash(pins), '8384a4d74375463fb39379af6a5bac4702d653e876e2192b25328a00154a36e1');
  assert.equal(hash(transition), '54e2b139947b1d7d1d06517992f5b4fc012bc6840d58ce6944c37031e1a4ea5f');
  assert.equal(transition.pinsHash, hash(pins));
  assert.equal(transition.parentCommit, pins.parentCommit);
  assert.equal(transition.previousAllLessonsAndRecipesHash, pins.previousAllLessonsAndRecipesHash);
  const records = new Map(transition.entries.map(e => [e.id + '|' + e.tab, e]));
  assert.equal(records.size, 1); assert.equal(transition.entries.length, 1);
  const previous = new Map(); let old = 0, current = 0;
  for (const e of pins.entries) for (const tab of e.topics) {
    assert.equal(tab, 'mri');
    const key = e.identity.id + '|' + tab, record = records.get(key); assert(record);
    assert.equal(record.previousHash, hash(e.previous[tab]));
    const now = api.bodyLesson(e.identity, tab);
    if (isDeepStrictEqual(now, e.previous[tab])) old++;
    else { assert.equal(hash(now), record.currentHash, 'Unrecorded transverse mesocolon MRI'); current++; }
    previous.set(key, { identity: e.identity, lesson: e.previous[tab] });
  }
  assert(old === 1 || current === 1, 'Mixed transverse mesocolon MRI history');
  if (old === 1) return api;
  const bodyLesson = (structure, tab) => {
    const e = previous.get(structure.id + '|' + tab);
    return e && isDeepStrictEqual(structure, e.identity) ? structuredClone(e.lesson) : api.bodyLesson(structure, tab);
  };
  return { ...api, bodyLesson,
    transverseMesocolonMriLesson(structure, tab) {
      const e = previous.get(structure.id + '|' + tab);
      return e && isDeepStrictEqual(structure, e.identity) ? undefined : api.transverseMesocolonMriLesson(structure, tab);
    },
    bodyContent(s, t) { const { readiness: _readiness, ...shown } = bodyLesson(s, t); return shown; },
  };
}
