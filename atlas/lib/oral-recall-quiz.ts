import pins from '../content/oral-recall-quiz-pins.json' with {type: 'json'};
import {oralRecallQuizQuestions, type OralRecallQuizGroup} from '../content/oral-recall-quiz';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id,
  {signature: sourceCanonical(entry.identity), group: entry.group as OralRecallQuizGroup}]));

/** Exact pinned source records only; six shared draft questions across thirty placements. */
export function oralRecallQuizLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(structure.id);
  if (!bound || sourceCanonical(structure) !== bound.signature) return undefined;
  const q = oralRecallQuizQuestions[bound.group];
  return {readiness: 'draft', title: `${structure.name} · Oral quick check · draft`,
    body: q.body, bullets: [...q.choices], correctAnswer: q.correctAnswer,
    explanation: q.explanation, citations: [...q.references],
    note: 'Original source-backed recall; revision-bound radiologist and dental review pending. Source-labelled whole surfaces do not establish individual tooth numbering, internal dental layers, muscle subdivisions, patient registration or clinical interpretation. Atlas, imaging-case and paid-lecture access remain independent.'};
}
