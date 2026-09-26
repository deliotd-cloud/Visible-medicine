// Test-only editorial history. Never used to derive production decisions.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import pins from '../content/elbow-arterial-ct-pins.json' with { type: 'json' };
import transition from '../content/elbow-arterial-ct-transition.json' with { type: 'json' };
import clinicalPins from '../content/elbow-clinical-pins.json' with { type: 'json' };
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforeElbowArterialCt(api) {
  if (typeof api.bodyLesson !== 'function') return api;
  assert.equal(hash(pins), '2d0a3bab05388cdaaa1ac35464781c0218b8b207caa173723a278de5210df3cc');
  assert.equal(hash(transition), 'b8d048688022f7203dec47fdf6c957c233e114db1a4d9cf00410d4b384b4cd8e');
  assert.equal(transition.pinsHash, hash(pins));
  assert.equal(transition.parentCommit, pins.parentCommit);
  assert.equal(transition.previousAllLessonsAndRecipesHash, pins.previousAllLessonsAndRecipesHash);
  // Older clinical-history replay also restores the original imaging placeholder.
  // Admit only that independently pinned complete state, never arbitrary pending text.
  assert.equal(hash(clinicalPins), '971f7b3563a6042e54b36a17087ad5a0f40ea7f1a00612f03a081a8c3827f602');
  const previous = new Map(); let old = 0, current = 0, legacy = 0;
  assert.equal(transition.entries.length, 14);
  for (const e of pins.entries) {
    const matches = transition.entries.filter(r => r.id === e.identity.id && r.tab === 'ct');
    assert.equal(matches.length, 1); assert.equal(matches[0].previousHash, hash(e.previous.ct));
    const now = api.bodyLesson(e.identity, 'ct');
    const earlier = clinicalPins.entries.find(entry => entry.identity.id === e.identity.id);
    assert.deepEqual(earlier?.identity, e.identity);
    if (isDeepStrictEqual(now, e.previous.ct)) old++;
    else if (isDeepStrictEqual(now, earlier.previous.ct)) legacy++;
    else { assert.equal(hash(now), matches[0].currentHash, 'Unrecorded elbow arterial CT'); current++; }
    previous.set(e.identity.id, e);
  }
  assert(old === 14 || current === 14 || legacy === 14, 'Mixed elbow arterial CT history');
  if (old === 14 || legacy === 14) return api;
  const matches = (s, t) => t === 'ct' && isDeepStrictEqual(s, previous.get(s.id)?.identity);
  const bodyLesson = (s, t) => matches(s, t) ? structuredClone(previous.get(s.id).previous.ct) : api.bodyLesson(s, t);
  return { ...api, bodyLesson,
    elbowArterialCtLesson(s, t) { return matches(s, t) ? undefined : api.elbowArterialCtLesson?.(s, t); },
    bodyContent(s, t) { const { readiness: _readiness, ...shown } = bodyLesson(s, t); return shown; },
  };
}
