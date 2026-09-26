// Test-only editorial history. Never used to derive production decisions.
import assert from 'node:assert/strict';
import { beforeCommonInterosseousUs } from './common-interosseous-us-history.mjs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import pins from '../content/plantar-arterial-us-pins.json' with { type: 'json' };
import transition from '../content/plantar-arterial-us-transition.json' with { type: 'json' };
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforePlantarArterialUs(api) {
  api = beforeCommonInterosseousUs(api);
  if (typeof api.bodyLesson !== 'function') return api;
  assert.equal(hash(pins), '62ef1d830027d42e44b5f78ceab0c6dac0d6a5cd79ed85d2e06d8f068c57ff97');
  assert.equal(hash(transition), '57b2926193d639e1bf491511c43f1f54e1746a2fe2e26429a819a70dbcaa5ba0');
  assert.equal(transition.pinsHash, hash(pins));
  assert.equal(transition.parentCommit, pins.parentCommit);
  assert.equal(transition.previousAllLessonsAndRecipesHash, pins.previousAllLessonsAndRecipesHash);
  const previous = new Map(); let old = 0, current = 0;
  assert.equal(transition.entries.length, 6);
  for (const e of pins.entries) {
    const matches = transition.entries.filter(r => r.id === e.identity.id && r.tab === 'ultrasound');
    assert.equal(matches.length, 1); assert.equal(matches[0].previousHash, hash(e.previous.ultrasound));
    const now = api.bodyLesson(e.identity, 'ultrasound');
    if (isDeepStrictEqual(now, e.previous.ultrasound)) old++;
    else { assert.equal(hash(now), matches[0].currentHash, 'Unrecorded plantar arterial ultrasound'); current++; }
    previous.set(e.identity.id, e);
  }
  assert(old === 6 || current === 6, 'Mixed plantar arterial ultrasound history');
  if (old === 6) return api;
  const matches = (s, t) => t === 'ultrasound' && isDeepStrictEqual(s, previous.get(s.id)?.identity);
  const bodyLesson = (s, t) => matches(s, t) ? structuredClone(previous.get(s.id).previous.ultrasound) : api.bodyLesson(s, t);
  return { ...api, bodyLesson,
    plantarArterialUsLesson(s, t) { return matches(s, t) ? undefined : api.plantarArterialUsLesson(s, t); },
    bodyContent(s, t) { const { readiness: _readiness, ...shown } = bodyLesson(s, t); return shown; },
  };
}
