import pins from '../content/neuro-organ-quiz-pins.json' with {type: 'json'};
import {neuroOrganQuizQuestions, type NeuroOrganQuizGroup} from '../content/neuro-organ-quiz';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id,
  {signature: sourceCanonical(entry.identity), group: entry.group as NeuroOrganQuizGroup}]));

/** Six exact retained source records; formative questions remain draft and source-bound. */
export function neuroOrganQuizLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(structure.id);
  if (!bound || sourceCanonical(structure) !== bound.signature) return undefined;
  const q = neuroOrganQuizQuestions[bound.group];
  return {readiness: 'draft', title: `${structure.name} · Neuro-organ quick check · draft`,
    body: q.body, bullets: [...q.choices], correctAnswer: q.correctAnswer,
    explanation: q.explanation, citations: [...q.references],
    note: 'Original source-backed question; revision-bound radiologist review pending. A visible source surface does not validate complete anatomy, physiology, lumen patency, patient registration, or a clinical interpretation. Brain and globe entries are aggregates; retina is not independently segmented. The tentorium source covers only a right-sided portion. Atlas, imaging-case and paid-lecture access remain independent.'};
}
