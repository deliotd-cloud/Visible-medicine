import pins from '../content/forearm-muscle-quiz-pins.json' with { type: 'json' };
import { forearmMuscleQuizQuestions, type ForearmMuscleQuizGroup } from '../content/forearm-muscle-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as ForearmMuscleQuizGroup,
}]));

/** Draft formative questions bound to the complete retained source identity. */
export function forearmMuscleQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  const question = forearmMuscleQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${s.name} · Forearm muscle quick check · draft`,
    body: question.body, bullets: [...question.choices], correctAnswer: question.correctAnswer,
    explanation: question.explanation, citations: [...question.references],
    note: 'Original source-backed question; revision-bound radiologist review pending. Usual anatomy does not validate source boundaries, independent head action, movement or function of these static reference surfaces. No diagnosis or patient-specific interpretation is established. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
