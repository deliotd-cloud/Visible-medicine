import pins from '../content/thoracic-quiz-pins.json' with { type: 'json' };
import { thoracicQuizQuestions, type ThoracicQuizGroup } from '../content/thoracic-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const identities = new Map(pins.entries.map(e => [e.identity.id, {
  signature: sourceCanonical(e.identity), group: e.group as ThoracicQuizGroup,
}]));
export function thoracicQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = identities.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  const question = thoracicQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${s.name} · Thoracic quick check · draft`,
    body: question.body, bullets: [...question.choices],
    correctAnswer: question.correctAnswer, explanation: question.explanation,
    citations: [question.reference],
    note: 'Original question based on Texas Tech University Health Sciences Center El Paso anatomy teaching pages; no source prose or images reproduced. Radiologist review pending. Source mesh surfaces do not demonstrate lumen, patency or physiological displacement; this question uses typical anatomy, not acquired images. Atlas, imaging-case and lecture access remain independent.',
  };
}
