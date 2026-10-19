import pins from '../content/laryngeal-muscle-quiz-pins.json' with {type: 'json'};
import {laryngealMuscleQuizQuestions, type LaryngealMuscleQuizGroup} from '../content/laryngeal-muscle-quiz';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id,
  {signature: sourceCanonical(entry.identity), group: entry.group as LaryngealMuscleQuizGroup}]));

/** Eleven retained source records; formative questions remain draft and source-bound. */
export function laryngealMuscleQuizLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(structure.id);
  if (!bound || sourceCanonical(structure) !== bound.signature) return undefined;
  const q = laryngealMuscleQuizQuestions[bound.group];
  return {readiness: 'draft', title: `${structure.name} · Laryngeal muscle quick check · draft`,
    body: q.body, bullets: [...q.choices], correctAnswer: q.correctAnswer,
    explanation: q.explanation, citations: [...q.references],
    note: 'Original source-backed question; revision-bound radiologist review pending. Source geometry does not validate complete anatomy, muscle attachments or action, patient registration or clinical interpretation. Paired selections share general anatomy questions; each remains bound to its own source record. Atlas, imaging-case and paid-lecture access remain independent.'};
}
