// Test-only editorial history. Never used to derive production decisions.
import assert from 'node:assert/strict';
import { beforeCoronaryArterialUs } from './coronary-arterial-us-history.mjs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import pins from '../content/common-interosseous-us-pins.json' with { type: 'json' };
import transition from '../content/common-interosseous-us-transition.json' with { type: 'json' };
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforeCommonInterosseousUs(api) {
  api = beforeCoronaryArterialUs(api);
  if (typeof api.bodyLesson !== 'function') return api;
  assert.equal(hash(pins), '18eb602bfebf1836c4412848a248ca3f09f9e0ac1982762603d6c2040640a361');
  assert.equal(hash(transition), '7e0bf1883b3219c72d07bf77fb0fdf4bfd756bce221f45c77f9f37bd644db31c');
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
    else { assert.equal(hash(now), matches[0].currentHash, 'Unrecorded common interosseous ultrasound'); current++; }
    previous.set(e.identity.id, e);
  }
  assert(old === 2 || current === 2, 'Mixed common interosseous ultrasound history');
  if (old === 2) return api;
  const matches = (s, t) => t === 'ultrasound' && isDeepStrictEqual(s, previous.get(s.id)?.identity);
  const bodyLesson = (s, t) => matches(s, t) ? structuredClone(previous.get(s.id).previous.ultrasound) : api.bodyLesson(s, t);
  return { ...api, bodyLesson,
    commonInterosseousUsLesson(s, t) { return matches(s, t) ? undefined : api.commonInterosseousUsLesson(s, t); },
    bodyContent(s, t) { const { readiness: _readiness, ...shown } = bodyLesson(s, t); return shown; },
  };
}
