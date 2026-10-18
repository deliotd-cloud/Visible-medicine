import pins from '../content/shoulder-girdle-artery-quiz-pins.json' with {type: 'json'};
import {shoulderGirdleArteryQuizQuestions, type ShoulderGirdleArteryQuizGroup} from '../content/shoulder-girdle-artery-quiz';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id,
  {signature: sourceCanonical(entry.identity), group: entry.group as ShoulderGirdleArteryQuizGroup}]));

/** Eight exact retained source records; questions describe usual anatomy, not mesh completeness. */
export function shoulderGirdleArteryQuizLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(structure.id);
  if (!bound || sourceCanonical(structure) !== bound.signature) return undefined;
  const q = shoulderGirdleArteryQuizQuestions[bound.group];
  return {readiness: 'draft', title: `${structure.name} · Shoulder-girdle artery quick check · draft`,
    body: q.body, bullets: [...q.choices], correctAnswer: q.correctAnswer,
    explanation: q.explanation, citations: [...q.references],
    note: 'Original source-backed question; revision-bound radiologist review pending. Origin and branching may vary. A visible source surface does not validate continuous lumen, patency, perfusion, branch completeness, patient registration, or a procedural route. No diagnosis or patient-specific interpretation is established. Atlas, imaging-case and paid-lecture access remain independent.'};
}
