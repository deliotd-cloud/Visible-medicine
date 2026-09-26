// Test-only editorial replay; never imported by runtime, review or approvals.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import pins from '../content/limb-bone-ultrasound-pins.json' with { type: 'json' };
import transition from '../content/limb-bone-ultrasound-transition.json' with { type: 'json' };
import { beforePlantarArterialCt } from './plantar-arterial-ct-history.mjs';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforeLimbBoneUltrasound(api) {
  api = beforePlantarArterialCt(api);
  if (typeof api.bodyLesson !== 'function') return api;
  assert.equal(hash(pins), '1538314c7cb8a8e1dd877d9f616e397aa69325972f282fd90e5cdade66f7323f');
  assert.equal(hash(transition), 'ebf56496fcab31e81e11436a53f93a6700a79874d29e07f2c9b42d4b881e23f5');
  assert.equal(transition.pinsHash, hash(pins));
  assert.equal(transition.parentCommit, pins.parentCommit);
  assert.equal(transition.previousAllLessonsAndRecipesHash, pins.previousAllLessonsAndRecipesHash);
  const records = new Map(transition.entries.map(e => [e.id + '|' + e.tab, e]));
  assert.equal(records.size, 10); assert.equal(transition.entries.length, 10);
  const previous = new Map(); let old = 0, current = 0;
  for (const e of pins.entries) for (const tab of e.topics) {
    assert.equal(tab, 'ultrasound');
    const key = e.identity.id + '|' + tab, record = records.get(key); assert(record);
    assert.equal(record.previousHash, hash(e.previous[tab]));
    const now = api.bodyLesson(e.identity, tab);
    if (isDeepStrictEqual(now, e.previous[tab])) old++;
    else { assert.equal(hash(now), record.currentHash, 'Unrecorded limb bone ultrasound'); current++; }
    previous.set(key, { identity: e.identity, lesson: e.previous[tab] });
  }
  assert(old === 10 || current === 10, 'Mixed limb bone ultrasound history');
  if (old === 10) return api;
  const bodyLesson = (structure, tab) => {
    const e = previous.get(structure.id + '|' + tab);
    return e && isDeepStrictEqual(structure, e.identity) ? structuredClone(e.lesson) : api.bodyLesson(structure, tab);
  };
  const topics = structuredClone(api.limbBoneImagingTopics);
  for (const e of pins.entries) delete topics[e.group].ultrasound;
  return { ...api, bodyLesson, limbBoneImagingTopics: topics,
    limbBoneImagingLesson(structure, tab) {
      const e = previous.get(structure.id + '|' + tab);
      return e && isDeepStrictEqual(structure, e.identity) ? undefined : api.limbBoneImagingLesson(structure, tab);
    },
    bodyContent(s, t) { const { readiness: _readiness, ...shown } = bodyLesson(s, t); return shown; },
  };
}
