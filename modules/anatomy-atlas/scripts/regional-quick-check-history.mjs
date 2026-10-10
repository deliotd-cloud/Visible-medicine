// Offline history only: remove exactly the eleven recorded regional answer keys.
// Runtime teaching, exported records and personal review decisions never use this.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { beforeFootVascularQuiz } from './foot-vascular-quiz-history.mjs';

export function beforeRegionalQuickCheckKeys(api, catalog) {
  return beforeRegionalQuickCheckKeysOnly(beforeFootVascularQuiz(api), catalog);
}

// Narrow key-only reversal for later junctions that are not at the foot epoch.
export function beforeRegionalQuickCheckKeysOnly(api, catalog) {
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

const shoulderIdsHash = 'caa2fc69aa18b1f33595dacfb9a9c45166f2dbd51976a719d934732ec2e8020b';
const shoulderKeysHash = '073dbb66cdbee4854995fb83ddc693051fd5790bfcc24ca176e83c132f861180';

export function beforeRegionalShoulderQuickCheckKeys(structures) {
  assert.equal(structures.length, 9, 'Unknown shoulder history');
  assert.equal(createHash('sha256').update(JSON.stringify(structures.map(s => s.id))).digest('hex'),
    shoulderIdsHash, 'Unknown shoulder identities or order');
  const keys = structures.map(s => [s.id, s.sections.quiz.correctAnswer, s.sections.quiz.explanation]);
  const present = keys.filter(([, answer, explanation]) =>
    answer !== undefined || explanation !== undefined);
  if (present.length === 0) return structuredClone(structures);
  assert.equal(present.length, 9, 'Mixed shoulder quick-check history');
  assert.equal(createHash('sha256').update(JSON.stringify(keys)).digest('hex'),
    shoulderKeysHash, 'Unrecorded shoulder quick-check keys');
  return structures.map(s => {
    const prior = structuredClone(s);
    delete prior.sections.quiz.correctAnswer;
    delete prior.sections.quiz.explanation;
    return prior;
  });
}
