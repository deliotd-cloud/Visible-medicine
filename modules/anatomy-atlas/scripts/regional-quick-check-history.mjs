// Offline history only: remove exactly the eleven recorded regional answer keys.
// Runtime teaching, exported records and personal review decisions never use this.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { beforeFootVascularQuiz } from './foot-vascular-quiz-history.mjs';

export function beforeRegionalQuickCheckKeys(api, catalog) {
  api = beforeFootVascularQuiz(api);
  const keys = catalog.structures.flatMap(s => {
    const quiz = api.bodyLesson(s, 'quiz');
    return quiz.correctAnswer === undefined && quiz.explanation === undefined
      ? [] : [[s.id, quiz.correctAnswer, quiz.explanation]];
  });
  if (keys.length === 0) return api;
  assert.equal(keys.length, 11, 'Mixed or unknown regional quick-check history');
  assert.equal(createHash('sha256').update(JSON.stringify(keys)).digest('hex'),
    'e80e0b7f7fdf1d1ecd6c240b32ea8f9b2226064e7d505dcf212e504b328fa3e1',
    'Unrecorded regional quick-check keys');
  const ids = new Set(keys.map(([id]) => id));
  const bodyLesson = (s, tab) => {
    const lesson = api.bodyLesson(s, tab);
    if (tab !== 'quiz' || !ids.has(s.id)) return lesson;
    const { correctAnswer: _answer, explanation: _explanation, ...prior } = lesson;
    return prior;
  };
  return { ...api, bodyLesson, bodyContent(s, tab) {
    if (tab !== 'quiz' || !ids.has(s.id)) return api.bodyContent(s, tab);
    const { readiness: _readiness, ...shown } = bodyLesson(s, tab);
    return shown;
  } };
}
