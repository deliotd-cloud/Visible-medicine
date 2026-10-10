import pins from '../content/thigh-deep-muscle-quiz-pins.json' with { type: 'json' };
import { thighDeepMuscleQuizQuestions, type ThighDeepMuscleQuizGroup } from '../content/thigh-deep-muscle-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as ThighDeepMuscleQuizGroup,
}]));

/** Formative draft bound to complete retained thigh-muscle source identities. */
export function thighDeepMuscleQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  const q = thighDeepMuscleQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${s.name} · Hip and thigh quick check · draft`,
    body: q.body, bullets: [...q.choices], correctAnswer: q.correctAnswer,
    explanation: q.explanation, citations: [...q.references],
    note: 'Original source-backed question; revision-bound radiologist review pending. Usual anatomy does not validate complete attachments, innervation, movement, or patient anatomy of these static source surfaces. No diagnosis or patient-specific interpretation is established. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
