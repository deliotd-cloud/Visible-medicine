import pins from '../content/tongue-palate-quiz-pins.json' with { type: 'json' };
import { tonguePalateQuizQuestions, type TonguePalateQuizGroup } from '../content/tongue-palate-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const identities = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as TonguePalateQuizGroup,
}]));

export function tonguePalateQuizLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = identities.get(structure.id);
  if (!bound || sourceCanonical(structure) !== bound.signature) return undefined;
  const question = tonguePalateQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${structure.name} · Tongue and palate quick check · draft`,
    body: question.body, bullets: [...question.choices],
    correctAnswer: question.correctAnswer, explanation: question.explanation,
    citations: [question.reference],
    note: 'Original factual question; no source prose, assessments, tables or images reproduced. Radiologist review pending. Four principles shared across eight left/right source placements, not eight independent questions. Static whole-muscle surfaces do not show nerve courses, individual fibres, swallowing dynamics or validated patient imaging. No geometry approval or spatial registration is implied. Atlas, imaging-case and lecture access remain independent.',
  };
}
