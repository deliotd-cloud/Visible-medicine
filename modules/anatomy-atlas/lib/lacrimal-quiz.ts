import pins from '../content/lacrimal-quiz-pins.json' with {type: 'json'};
import {lacrimalQuizQuestions, type LacrimalQuizGroup} from '../content/lacrimal-quiz';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id,
  {signature: sourceCanonical(entry.identity), group: entry.group as LacrimalQuizGroup}]));

/** Eight retained source records; formative questions remain draft and source-bound. */
export function lacrimalQuizLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(structure.id);
  if (!bound || sourceCanonical(structure) !== bound.signature) return undefined;
  const q = lacrimalQuizQuestions[bound.group];
  return {readiness: 'draft', title: `${structure.name} · Lacrimal quick check · draft`,
    body: q.body, bullets: [...q.choices], correctAnswer: q.correctAnswer,
    explanation: q.explanation, citations: [...q.references],
    note: 'Original source-backed question; revision-bound radiologist review pending. Source geometry does not validate complete anatomy, patient registration or clinical interpretation. Paired selections share general anatomy questions; each remains bound to its own source record. Atlas, imaging-case and paid-lecture access remain independent.'};
}
