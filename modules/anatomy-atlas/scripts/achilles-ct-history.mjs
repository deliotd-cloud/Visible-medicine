// Test-only immutable editorial replay; never a production admission or approval.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import pins from '../content/achilles-ct-pins.json' with { type: 'json' };
import transition from '../content/achilles-ct-transition.json' with { type: 'json' };
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforeAchillesCt(api) {
  if (typeof api.bodyLesson !== 'function') return api;
  // The elbow-only legacy fixture has no display API and no Achilles lessons.
  // A real display API must always pass the immutable checks below.
  if (typeof api.bodyDisplayCatalog !== 'function' && pins.entries.every(e => api.bodyLesson(e.identity, 'ct') === undefined)) return api;
  assert.equal(hash(pins), '572410d1ecdde2fbdd597ae56901c2202c840602899be544016ccce497f50d0a');
  assert.equal(hash(transition), 'a3ad8848367a73aeabb5f5263896c863acc97f87620b817a5f3829d04bc61afe');
  assert.equal(transition.parentCommit, pins.parentCommit);
  assert.equal(transition.pinsHash, hash(pins));
  assert.equal(transition.previousAllLessonsAndRecipesHash, pins.previousAllLessonsAndRecipesHash);
  assert.equal(transition.entries.length, 2);
  const previous = new Map(); let old = 0, current = 0;
  for (const e of pins.entries) {
    const matches = transition.entries.filter(r => r.id === e.identity.id && r.tab === 'ct');
    assert.equal(matches.length, 1); assert.equal(matches[0].previousHash, hash(e.previous.ct));
    const now = api.bodyLesson(e.identity, 'ct');
    if (isDeepStrictEqual(now, e.previous.ct)) old++;
    else { assert.equal(hash(now), matches[0].currentHash, 'Unrecorded Achilles CT'); current++; }
    previous.set(e.identity.id, e);
  }
  assert(old === 2 || current === 2, 'Mixed Achilles CT history');
  if (old === 2) return api;
  const matches = (s, t) => t === 'ct' && isDeepStrictEqual(s, previous.get(s.id)?.identity);
  const bodyLesson = (s, t) => matches(s, t) ? structuredClone(previous.get(s.id).previous.ct) : api.bodyLesson(s, t);
  return { ...api, bodyLesson,
    achillesCtLesson(s, t) { return matches(s, t) ? undefined : api.achillesCtLesson?.(s, t); },
    bodyContent(s, t) { const { readiness: _readiness, ...shown } = bodyLesson(s, t); return shown; },
  };
}
