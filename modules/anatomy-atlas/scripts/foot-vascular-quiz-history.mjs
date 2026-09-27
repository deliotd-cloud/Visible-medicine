// Test-only exact editorial replay; never production content or review decisions.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { beforeCircleWillisImaging } from './circle-willis-imaging-history.mjs';
import pins from '../content/foot-vascular-quiz-pins.json' with { type: 'json' };
import transition from '../content/foot-vascular-quiz-transition.json' with { type: 'json' };
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforeFootVascularQuiz(api) {
  api = beforeCircleWillisImaging(api);
  if (typeof api.bodyLesson !== 'function') return api;
  // Narrow legacy fixtures do not contain these selections at all.
  if (typeof api.bodyDisplayCatalog !== 'function' && pins.entries.every(e => api.bodyLesson(e.identity, 'quiz') === undefined)) return api;
  assert.equal(hash(pins), '2e79508e0b0844d576036557726dcea202dc71be69dfe6a3467f8b568dba4209');
  assert.equal(hash(transition), '62f90813270460ae3f45d3a5d68deea31d1a34956c7efd4b7f7d5ba848654365');
  assert.equal(transition.parentCommit, pins.parentCommit);
  assert.equal(transition.pinsHash, hash(pins));
  assert.equal(transition.previousAllLessonsAndRecipesHash, pins.previousAllLessonsAndRecipesHash);
  assert.equal(transition.entries.length, 8);
  const prior = new Map(); let old = 0, current = 0;
  for (const entry of pins.entries) {
    const records = transition.entries.filter(t => t.id === entry.identity.id && t.tab === 'quiz');
    assert.equal(records.length, 1);
    assert.equal(records[0].previousHash, hash(entry.previous.quiz));
    const lesson = api.bodyLesson(entry.identity, 'quiz');
    if (isDeepStrictEqual(lesson, entry.previous.quiz)) old++;
    else { assert.equal(hash(lesson), records[0].currentHash, 'Unrecorded foot vascular quiz'); current++; }
    prior.set(entry.identity.id, entry);
  }
  assert(old === 8 || current === 8, 'Mixed foot vascular quiz history');
  if (old === 8) return api;
  const matches = (s, tab) => tab === 'quiz' && isDeepStrictEqual(s, prior.get(s.id)?.identity);
  const bodyLesson = (s, tab) => matches(s, tab) ? structuredClone(prior.get(s.id).previous.quiz) : api.bodyLesson(s, tab);
  return { ...api, bodyLesson,
    footVascularQuizLesson(s, tab) { return matches(s, tab) ? undefined : api.footVascularQuizLesson?.(s, tab); },
    bodyContent(s, tab) { const { readiness: _readiness, ...shown } = bodyLesson(s, tab); return shown; },
  };
}
