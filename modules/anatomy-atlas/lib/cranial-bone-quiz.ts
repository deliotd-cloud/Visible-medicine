import pins from '../content/cranial-bone-quiz-pins.json' with { type: 'json' };
import { cranialBoneQuizQuestions, type CranialBoneQuizGroup } from '../content/cranial-bone-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const identities = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as CranialBoneQuizGroup,
}]));
export function cranialBoneQuizLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = identities.get(structure.id);
  if (!bound || sourceCanonical(structure) !== bound.signature) return undefined;
  const question = cranialBoneQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${structure.name} · Cranial bone quick check · draft`,
    body: question.body, bullets: [...question.choices],
    correctAnswer: question.correctAnswer, explanation: question.explanation,
    citations: [question.reference],
    note: 'Original question based on UAMS and Texas Tech University Health Sciences Center El Paso anatomy teaching pages; no source prose or images reproduced. Radiologist review pending for this source revision. Landmarks, foramina and the inner ear are teaching facts, not individually segmented or validated structures. Source meshes are educational anatomy, not patient imaging or registered CT/MRI. Atlas, imaging-case and lecture access remain independent.',
  };
}
