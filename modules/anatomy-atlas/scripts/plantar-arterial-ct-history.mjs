// Test-only editorial replay; never imported by runtime, review or approvals.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import pins from '../content/plantar-arterial-ct-pins.json' with { type: 'json' };
import transition from '../content/plantar-arterial-ct-transition.json' with { type: 'json' };
import { beforeTransverseMesocolonMri } from './transverse-mesocolon-mri-history.mjs';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforePlantarArterialCt(api) {
  api = beforeTransverseMesocolonMri(api);
  if (typeof api.bodyLesson !== 'function') return api;
  assert.equal(hash(pins), '6256e1410c3794e7cdaae5c7eca68801734fe8225f4b696f9080281779ba0407');
  assert.equal(hash(transition), '766237467b53229f4dafec57d3b7d7b04481639b266a16bb19032d8483f6061c');
  assert.equal(transition.pinsHash, hash(pins));
  assert.equal(transition.parentCommit, pins.parentCommit);
  assert.equal(transition.previousAllLessonsAndRecipesHash, pins.previousAllLessonsAndRecipesHash);
  const records = new Map(transition.entries.map(e => [e.id + '|' + e.tab, e]));
  assert.equal(records.size, 10); assert.equal(transition.entries.length, 10);
  const previous = new Map(); let old = 0, current = 0;
  for (const e of pins.entries) for (const tab of e.topics) {
    assert.equal(tab, 'ct');
    const key = e.identity.id + '|' + tab, record = records.get(key); assert(record);
    assert.equal(record.previousHash, hash(e.previous[tab]));
    const now = api.bodyLesson(e.identity, tab);
    if (isDeepStrictEqual(now, e.previous[tab])) old++;
    else { assert.equal(hash(now), record.currentHash, 'Unrecorded plantar arterial CT'); current++; }
    previous.set(key, { identity: e.identity, lesson: e.previous[tab] });
  }
  assert(old === 10 || current === 10, 'Mixed plantar arterial CT history');
  if (old === 10) return api;
  const bodyLesson = (structure, tab) => {
    const e = previous.get(structure.id + '|' + tab);
    return e && isDeepStrictEqual(structure, e.identity) ? structuredClone(e.lesson) : api.bodyLesson(structure, tab);
  };
  return { ...api, bodyLesson,
    plantarArterialCtLesson(structure, tab) {
      const e = previous.get(structure.id + '|' + tab);
      return e && isDeepStrictEqual(structure, e.identity) ? undefined : api.plantarArterialCtLesson(structure, tab);
    },
    bodyContent(s, t) { const { readiness: _readiness, ...shown } = bodyLesson(s, t); return shown; },
  };
}
