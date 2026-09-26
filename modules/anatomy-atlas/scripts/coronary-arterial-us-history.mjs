// Test-only editorial history. Never used to derive production decisions.
import assert from 'node:assert/strict';
import { beforeElbowArterialCt } from './elbow-arterial-ct-history.mjs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import pins from '../content/coronary-arterial-us-pins.json' with { type: 'json' };
import transition from '../content/coronary-arterial-us-transition.json' with { type: 'json' };
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforeCoronaryArterialUs(api) {
  api = beforeElbowArterialCt(api);
  if (typeof api.bodyLesson !== 'function') return api;
  assert.equal(hash(pins), '57c2e06c6ac884c762f77d11043874e447f032250b67889dc8281a2c959b2ec6');
  assert.equal(hash(transition), 'a64218ad569b0c3766ab92d86f736c1b5a72b3b4bb0fe652e70387c2fd825dd7');
  assert.equal(transition.pinsHash, hash(pins));
  assert.equal(transition.parentCommit, pins.parentCommit);
  assert.equal(transition.previousAllLessonsAndRecipesHash, pins.previousAllLessonsAndRecipesHash);
  const previous = new Map(); let old = 0, current = 0;
  assert.equal(transition.entries.length, 4);
  for (const e of pins.entries) {
    const matches = transition.entries.filter(r => r.id === e.identity.id && r.tab === 'ultrasound');
    assert.equal(matches.length, 1); assert.equal(matches[0].previousHash, hash(e.previous.ultrasound));
    const now = api.bodyLesson(e.identity, 'ultrasound');
    if (isDeepStrictEqual(now, e.previous.ultrasound)) old++;
    else { assert.equal(hash(now), matches[0].currentHash, 'Unrecorded coronary arterial ultrasound'); current++; }
    previous.set(e.identity.id, e);
  }
  assert(old === 4 || current === 4, 'Mixed coronary arterial ultrasound history');
  if (old === 4) return api;
  const matches = (s, t) => t === 'ultrasound' && isDeepStrictEqual(s, previous.get(s.id)?.identity);
  const bodyLesson = (s, t) => matches(s, t) ? structuredClone(previous.get(s.id).previous.ultrasound) : api.bodyLesson(s, t);
  return { ...api, bodyLesson,
    coronaryArterialUsLesson(s, t) { return matches(s, t) ? undefined : api.coronaryArterialUsLesson(s, t); },
    bodyContent(s, t) { const { readiness: _readiness, ...shown } = bodyLesson(s, t); return shown; },
  };
}
