import pins from '../content/scapular-muscle-quiz-pins.json' with {type: 'json'};
import {scapularMuscleQuizQuestions, type ScapularMuscleQuizGroup} from '../content/scapular-muscle-quiz';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id,
  {signature: sourceCanonical(entry.identity), group: entry.group as ScapularMuscleQuizGroup}]));

/** Eight exact retained source records; formative questions remain draft and source-bound. */
export function scapularMuscleQuizLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(structure.id);
  if (!bound || sourceCanonical(structure) !== bound.signature) return undefined;
  const q = scapularMuscleQuizQuestions[bound.group];
  return {readiness: 'draft', title: `${structure.name} · Scapular muscle quick check · draft`,
    body: q.body, bullets: [...q.choices], correctAnswer: q.correctAnswer,
    explanation: q.explanation, citations: [...q.references],
    note: 'Original source-backed question; revision-bound radiologist review pending. A visible source surface does not validate complete anatomy, attachments, muscle activation, movement, patient registration or clinical interpretation. Left and right selections share general anatomy questions; each remains bound to its own source record. Atlas, imaging-case and paid-lecture access remain independent.'};
}
