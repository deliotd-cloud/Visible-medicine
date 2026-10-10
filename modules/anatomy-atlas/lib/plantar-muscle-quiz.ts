import pins from '../content/plantar-muscle-quiz-pins.json' with { type: 'json' };
import { plantarMuscleQuizQuestions, type PlantarMuscleQuizGroup } from '../content/plantar-muscle-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as PlantarMuscleQuizGroup,
}]));

/** Formative draft bound to complete retained foot-muscle source identities. */
export function plantarMuscleQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  const q = plantarMuscleQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${s.name} · Foot muscle quick check · draft`,
    body: q.body, bullets: [...q.choices], correctAnswer: q.correctAnswer,
    explanation: q.explanation, citations: [...q.references],
    note: 'Original source-backed question; revision-bound radiologist review pending. Usual anatomy does not validate completeness, boundaries, attachments, nerve paths, or movement of these static source surfaces. No diagnosis or patient-specific interpretation is established. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
