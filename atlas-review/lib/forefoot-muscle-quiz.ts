import pins from '../content/forefoot-muscle-quiz-pins.json' with { type: 'json' };
import { forefootMuscleQuizQuestions, type ForefootMuscleQuizGroup } from '../content/forefoot-muscle-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as ForefootMuscleQuizGroup,
}]));

/** Original formative questions bound to complete retained source identities. */
export function forefootMuscleQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  const question = forefootMuscleQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${s.name} · Forefoot muscle quick check · draft`,
    body: question.body, bullets: [...question.choices], correctAnswer: question.correctAnswer,
    explanation: question.explanation, citations: [...question.references],
    note: 'Original source-backed question; revision-bound radiologist review pending. Usual muscle actions do not validate source boundaries, individual tendons, movement or function of these reference surfaces. No diagnosis or patient-specific interpretation is established. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
