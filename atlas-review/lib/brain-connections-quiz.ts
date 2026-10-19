import pins from '../content/brain-connections-quiz-pins.json' with { type: 'json' };
import { brainConnectionsQuizQuestions, type BrainConnectionsQuizGroup } from '../content/brain-connections-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const identities = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as BrainConnectionsQuizGroup,
}]));
export function brainConnectionsQuizLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = identities.get(structure.id);
  if (!bound || sourceCanonical(structure) !== bound.signature) return undefined;
  const question = brainConnectionsQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${structure.name} · Brain connections quick check · draft`,
    body: question.body, bullets: [...question.choices],
    correctAnswer: question.correctAnswer, explanation: question.explanation,
    citations: [question.reference],
    note: 'Original factual question with reference links; no source diagrams or question-bank items reproduced. Radiologist review pending. Source surfaces do not trace axons, segment complete circuits or register patient scans. Paired selections share the same principle; grouped selections remain grouped. Atlas, imaging-case and lecture access remain independent.',
  };
}
