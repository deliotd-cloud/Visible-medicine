// Test-only editorial history. Never used to derive production decisions.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import pins from '../content/lateral-cricoarytenoid-us-pins.json' with { type: 'json' };
import transition from '../content/lateral-cricoarytenoid-us-transition.json' with { type: 'json' };
import { beforePlantarArterialUs } from './plantar-arterial-us-history.mjs';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforeLateralCricoarytenoidUs(api) {
  api = beforePlantarArterialUs(api);
  if (typeof api.bodyLesson !== 'function') return api;
  assert.equal(hash(pins), '633285a88627737f664e0cf3a805680bdab9a60eee790facfdbf15b48d6b6178');
  assert.equal(hash(transition), 'ce54c7ed1ed1078164b101e96d7d1d8737111b964e24f98a491da16795396d20');
  assert.equal(transition.pinsHash, hash(pins));
  assert.equal(transition.parentCommit, pins.parentCommit);
  assert.equal(transition.previousAllLessonsAndRecipesHash, pins.previousAllLessonsAndRecipesHash);
  const previous = new Map(); let old = 0, current = 0;
  assert.equal(transition.entries.length, 2);
  for (const e of pins.entries) {
    const matches = transition.entries.filter(r => r.id === e.identity.id && r.tab === 'ultrasound');
    assert.equal(matches.length, 1); assert.equal(matches[0].previousHash, hash(e.previous.ultrasound));
    const now = api.bodyLesson(e.identity, 'ultrasound');
    if (isDeepStrictEqual(now, e.previous.ultrasound)) old++;
    else { assert.equal(hash(now), matches[0].currentHash, 'Unrecorded lateral cricoarytenoid ultrasound'); current++; }
    previous.set(e.identity.id, e);
  }
  assert(old === 2 || current === 2, 'Mixed lateral cricoarytenoid ultrasound history');
  if (old === 2) return api;
  const matches = (s, t) => t === 'ultrasound' && isDeepStrictEqual(s, previous.get(s.id)?.identity);
  const bodyLesson = (s, t) => matches(s, t) ? structuredClone(previous.get(s.id).previous.ultrasound) : api.bodyLesson(s, t);
  return { ...api, bodyLesson,
    lateralCricoarytenoidUsLesson(s, t) { return matches(s, t) ? undefined : api.lateralCricoarytenoidUsLesson(s, t); },
    bodyContent(s, t) { const { readiness: _readiness, ...shown } = bodyLesson(s, t); return shown; },
  };
}
