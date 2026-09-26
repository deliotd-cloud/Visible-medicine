// Test-only editorial replay; never imported by runtime, review or approvals.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import pins from '../content/small-intestinal-mesentery-mri-pins.json' with { type: 'json' };
import transition from '../content/small-intestinal-mesentery-mri-transition.json' with { type: 'json' };
import { beforeLateralCricoarytenoidUs } from './lateral-cricoarytenoid-us-history.mjs';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforeSmallIntestinalMesenteryMri(api) {
  api = beforeLateralCricoarytenoidUs(api);
  if (typeof api.bodyLesson !== 'function') return api;
  assert.equal(hash(pins), 'c15ed2fc727ae75ace9b9e9b7d24ad7247202bb64648f4b56827e35cd09d49bd');
  assert.equal(hash(transition), '7ea38d071aff029e7a583ba59c3a137eed7da0505dccc0604c47b7fec3c37f3c');
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
    else { assert.equal(hash(now), record.currentHash, 'Unrecorded small-intestinal mesentery MRI'); current++; }
    previous.set(key, { identity: e.identity, lesson: e.previous[tab] });
  }
  assert(old === 1 || current === 1, 'Mixed small-intestinal mesentery MRI history');
  if (old === 1) return api;
  const bodyLesson = (structure, tab) => {
    const e = previous.get(structure.id + '|' + tab);
    return e && isDeepStrictEqual(structure, e.identity) ? structuredClone(e.lesson) : api.bodyLesson(structure, tab);
  };
  return { ...api, bodyLesson,
    smallIntestinalMesenteryMriLesson(structure, tab) {
      const e = previous.get(structure.id + '|' + tab);
      return e && isDeepStrictEqual(structure, e.identity) ? undefined : api.smallIntestinalMesenteryMriLesson(structure, tab);
    },
    bodyContent(s, t) { const { readiness: _readiness, ...shown } = bodyLesson(s, t); return shown; },
  };
}
