import pins from '../content/cervical-quiz-pins.json' with { type: 'json' };
import { cervicalQuizQuestions, type CervicalQuizGroup } from '../content/cervical-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const identities = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as CervicalQuizGroup,
}]));
export function cervicalQuizLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = identities.get(structure.id);
  if (!bound || sourceCanonical(structure) !== bound.signature) return undefined;
  const question = cervicalQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${structure.name} · Cervical quick check · draft`,
    body: question.body, bullets: [...question.choices],
    correctAnswer: question.correctAnswer, explanation: question.explanation,
    citations: [question.reference],
    note: 'Original question based on UAMS and Texas Tech University Health Sciences Center El Paso anatomy teaching pages; no source prose or images reproduced. Radiologist review pending. Source mesh surfaces are educational anatomy, not patient imaging or confirmation of vertebral numbering. Atlas, imaging-case and lecture access remain independent.',
  };
}
