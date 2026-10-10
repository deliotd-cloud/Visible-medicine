// Test-only exact editorial replay. Never shipped or used to transfer approval.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import pins from '../content/hand-arterial-ct-pins.json' with { type: 'json' };
import transition from '../content/hand-arterial-ct-transition.json' with { type: 'json' };
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforeHandArterialCt(api) {
 if (typeof api.bodyLesson !== 'function') return api;
 if (typeof api.bodyDisplayCatalog !== 'function' && pins.entries.every(e => api.bodyLesson(e.identity, 'ct') === undefined)) return api;
 assert.equal(hash(pins), '002692ffff5f4289ca5f078ad7e18734e517a5cdf2bf891ac99e1fa4aa488223');
 assert.equal(hash(transition), '27f6c0e82aabd2854d41f9566593499f3a905e91f1dc7bc95c1b3024d8ae61ef');
 assert.equal(transition.parentCommit, pins.parentCommit);
 assert.equal(transition.pinsHash, hash(pins));
 const rows = new Map(transition.entries.map(e => [e.id + '|' + e.tab, e]));
 assert.equal(rows.size, 26); assert.equal(transition.entries.length, 26);
 let old = 0, current = 0;
 for (const entry of pins.entries) {
  assert.deepEqual(entry.topics, ['ct']);
  const row = rows.get(entry.identity.id + '|ct'); assert(row);
  assert.equal(row.previousHash, hash(entry.previous.ct));
  const now = hash(api.bodyLesson(entry.identity, 'ct'));
  if (now === row.previousHash) old++;
  else { assert.equal(now, row.currentHash, 'Unrecorded hand arterial CT teaching'); current++; }
 }
 assert(old === 26 || current === 26, 'Mixed hand arterial CT history');
 if (old === 26) return api;
 const entries = new Map(pins.entries.map(e => [e.identity.id, e]));
 const bodyLesson = (s, tab) => {
  const entry = entries.get(s.id);
  if (!entry || tab !== 'ct') return api.bodyLesson(s, tab);
  assert.equal(JSON.stringify(s), JSON.stringify(entry.identity), 'Foreign hand source cannot replay');
  return structuredClone(entry.previous.ct);
 };
 return { ...api, bodyLesson, bodyContent(s, tab) {
  const { readiness: _r, ...shown } = bodyLesson(s, tab); return shown;
 } };
}
