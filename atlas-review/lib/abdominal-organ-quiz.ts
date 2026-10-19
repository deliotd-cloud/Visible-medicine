import pins from '../content/abdominal-organ-quiz-pins.json' with { type: 'json' };
import { abdominalOrganQuizQuestions, type AbdominalOrganQuizGroup } from '../content/abdominal-organ-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const identities = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as AbdominalOrganQuizGroup,
}]));
export function abdominalOrganQuizLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = identities.get(structure.id);
  if (!bound || sourceCanonical(structure) !== bound.signature) return undefined;
  const question = abdominalOrganQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${structure.name} · Abdominal organ quick check · draft`,
    body: question.body, bullets: [...question.choices],
    correctAnswer: question.correctAnswer, explanation: question.explanation,
    citations: [question.reference],
    note: 'Original question based on NIH SEER or NIDDK teaching; no source prose or images reproduced. Radiologist review pending. Source mesh surfaces show educational organ anatomy, not microscopic anatomy or patient imaging. Paired organs share the same functional principle; no side-specific findings are inferred. Atlas, imaging-case and lecture access remain independent.',
  };
}
