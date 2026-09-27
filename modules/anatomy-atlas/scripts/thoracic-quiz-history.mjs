// Test-only exact editorial replay. Never used to admit assets or approve content.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import pins from '../content/thoracic-quiz-pins.json' with { type: 'json' };
import transition from '../content/thoracic-quiz-transition.json' with { type: 'json' };
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforeThoracicQuiz(api) {
  if (typeof api.bodyLesson !== 'function') return api;
  if (typeof api.bodyDisplayCatalog !== 'function' && pins.entries.every(e => api.bodyLesson(e.identity, 'quiz') === undefined)) return api;
  assert.equal(hash(pins), '1efb766a72f1484aaa2b403c0a7d8f25382d5d2f45cd0ecbfb6eab5848e344aa');
  assert.equal(hash(transition), 'caf93aace454881ff7a334c0921acb5634eaa701daf2d394ed0ccb1e439b3d54');
  assert.equal(transition.parentCommit, pins.parentCommit);
  assert.equal(transition.pinsHash, hash(pins));
  assert.equal(transition.previousAllLessonsAndRecipesHash, pins.previousAllLessonsAndRecipesHash);
  assert.equal(transition.entries.length, 7);
  const prior = new Map(); let old = 0, current = 0;
  for (const entry of pins.entries) {
    const records = transition.entries.filter(r => r.id === entry.identity.id && r.tab === 'quiz');
    assert.equal(records.length, 1);
    assert.equal(records[0].previousHash, hash(entry.previous.quiz));
    const lesson = api.bodyLesson(entry.identity, 'quiz');
    if (isDeepStrictEqual(lesson, entry.previous.quiz)) old++;
    else { assert.equal(hash(lesson), records[0].currentHash, 'Unrecorded thoracic quiz'); current++; }
    prior.set(entry.identity.id, entry);
  }
  assert(old === 7 || current === 7, 'Mixed thoracic quiz history');
  if (old === 7) return api;
  const matches = (s, tab) => tab === 'quiz' && isDeepStrictEqual(s, prior.get(s.id)?.identity);
  const bodyLesson = (s, tab) => matches(s, tab) ? structuredClone(prior.get(s.id).previous.quiz) : api.bodyLesson(s, tab);
  return { ...api, bodyLesson,
    thoracicQuizLesson(s, tab) { return matches(s, tab) ? undefined : api.thoracicQuizLesson?.(s, tab); },
    bodyContent(s, tab) { const { readiness: _readiness, ...shown } = bodyLesson(s, tab); return shown; },
  };
}
