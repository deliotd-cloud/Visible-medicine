// Test-only immutable editorial replay; never production admission or approval.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import pins from '../content/circle-willis-imaging-pins.json' with { type: 'json' };
import transition from '../content/circle-willis-imaging-transition.json' with { type: 'json' };
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforeCircleWillisImaging(api) {
  if (typeof api.bodyLesson !== 'function') return api;
  if (typeof api.bodyDisplayCatalog !== 'function' && pins.entries.every(e => e.topics.every(t => api.bodyLesson(e.identity, t) === undefined))) return api;
  assert.equal(hash(pins), 'b5e35e27b271b5b9e3932872f168735428416882918c12554a9ff03c06f87f7e');
  assert.equal(hash(transition), '181ca44aca993d75c1505ac9c7fffcba61168d89ff63e34abf131d0c1e2a0ed5');
  assert.equal(transition.parentCommit, pins.parentCommit); assert.equal(transition.pinsHash, hash(pins));
  assert.equal(transition.previousAllLessonsAndRecipesHash, pins.previousAllLessonsAndRecipesHash); assert.equal(transition.entries.length, 14);
  const prior = new Map(); let old = 0, current = 0;
  for (const e of pins.entries) {
    prior.set(e.identity.id, e);
    for (const tab of e.topics) {
      const matches = transition.entries.filter(r => r.id === e.identity.id && r.tab === tab); assert.equal(matches.length, 1);
      assert.equal(matches[0].previousHash, hash(e.previous[tab])); const now = api.bodyLesson(e.identity, tab);
      if (isDeepStrictEqual(now, e.previous[tab])) old++;
      else { assert.equal(hash(now), matches[0].currentHash, 'Unrecorded Circle of Willis imaging'); current++; }
    }
  }
  assert(old === 14 || current === 14, 'Mixed Circle of Willis imaging history'); if (old === 14) return api;
  const matches = (s,t) => prior.get(s.id)?.topics.includes(t) && isDeepStrictEqual(s, prior.get(s.id).identity);
  const bodyLesson = (s,t) => matches(s,t) ? structuredClone(prior.get(s.id).previous[t]) : api.bodyLesson(s,t);
  return { ...api, bodyLesson,
    circleWillisImagingLesson(s,t) { return matches(s,t) ? undefined : api.circleWillisImagingLesson?.(s,t); },
    bodyContent(s,t) { const {readiness, ...shown} = bodyLesson(s,t); return shown; },
  };
}
