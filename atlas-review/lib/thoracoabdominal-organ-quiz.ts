import pins from '../content/thoracoabdominal-organ-quiz-pins.json' with { type: 'json' };
import { thoracoabdominalOrganQuizQuestions, type ThoracoabdominalOrganQuizGroup } from '../content/thoracoabdominal-organ-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const identities = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as ThoracoabdominalOrganQuizGroup,
}]));

export function thoracoabdominalOrganQuizLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = identities.get(structure.id);
  if (!bound || sourceCanonical(structure) !== bound.signature) return undefined;
  const question = thoracoabdominalOrganQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${structure.name} · Thoracoabdominal organ quick check · draft`,
    body: question.body, bullets: [...question.choices],
    correctAnswer: question.correctAnswer, explanation: question.explanation,
    citations: [question.reference],
    note: 'Original question and reading link; no source prose or images reproduced and no licence grant implied. Revision-bound radiologist review pending. A static donor mesh supplies neither physiological measurements nor patient registration and cannot replace acquired imaging. Atlas, imaging-case and lecture access remain independent.',
  };
}
