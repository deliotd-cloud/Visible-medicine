// Test-only immutable editorial replay; never production admission or approval.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { beforeCervicalQuiz } from './cervical-quiz-history.mjs';
import pins from '../content/shoulder-arterial-ct-pins.json' with { type: 'json' };
import transition from '../content/shoulder-arterial-ct-transition.json' with { type: 'json' };
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforeShoulderArterialCt(api) {
  api = beforeCervicalQuiz(api);
  if (typeof api.bodyLesson !== 'function') return api;
  // Narrow legacy fixture: no display catalogue and no target lesson at all.
  if (typeof api.bodyDisplayCatalog !== 'function' && pins.entries.every(e => api.bodyLesson(e.identity, 'ct') === undefined)) return api;
  assert.equal(hash(pins), 'bc3c2f3f12a010fa7303310f0932882ef7f22b3911255a18044db9c70c524812');
  assert.equal(hash(transition), '6f428b64128bc5250fc6050813c9cdce4f50121302cf1add5a9b493ea942e19a');
  assert.equal(transition.parentCommit, pins.parentCommit);
  assert.equal(transition.pinsHash, hash(pins));
  assert.equal(transition.previousAllLessonsAndRecipesHash, pins.previousAllLessonsAndRecipesHash);
  assert.equal(transition.entries.length, 8);
  const previous = new Map(); let old = 0, current = 0;
  for (const e of pins.entries) {
    const matches = transition.entries.filter(r => r.id === e.identity.id && r.tab === 'ct');
    assert.equal(matches.length, 1); assert.equal(matches[0].previousHash, hash(e.previous.ct));
    const now = api.bodyLesson(e.identity, 'ct');
    if (isDeepStrictEqual(now, e.previous.ct)) old++;
    else { assert.equal(hash(now), matches[0].currentHash, 'Unrecorded shoulder arterial CT'); current++; }
    previous.set(e.identity.id, e);
  }
  assert(old === 8 || current === 8, 'Mixed shoulder arterial CT history');
  if (old === 8) return api;
  const matches = (s, t) => t === 'ct' && isDeepStrictEqual(s, previous.get(s.id)?.identity);
  const bodyLesson = (s, t) => matches(s, t) ? structuredClone(previous.get(s.id).previous.ct) : api.bodyLesson(s, t);
  return { ...api, bodyLesson,
    shoulderArterialCtLesson(s, t) { return matches(s, t) ? undefined : api.shoulderArterialCtLesson?.(s, t); },
    bodyContent(s, t) { const { readiness: _readiness, ...shown } = bodyLesson(s, t); return shown; },
  };
}
