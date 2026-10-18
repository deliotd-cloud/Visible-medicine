import pins from '../content/foot-vascular-quiz-pins.json' with { type: 'json' };
import { footVascularQuizQuestions, type FootVascularQuizGroup } from '../content/foot-vascular-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const identities = new Map(pins.entries.map(e => [e.identity.id, {
  signature: sourceCanonical(e.identity), group: e.group as FootVascularQuizGroup,
}]));
export function footVascularQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = identities.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  const question = footVascularQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${s.name} · Vascular quick check · draft`,
    body: question.body, bullets: [...question.choices],
    correctAnswer: question.correctAnswer, explanation: question.explanation,
    citations: [question.reference],
    note: 'Original question based on Texas Tech University Health Sciences Center El Paso anatomy tables; no table prose or images reproduced. Radiologist review pending. Source mesh topology, lumen continuity and flow are not validated by this question. Atlas, imaging-case and lecture access remain independent.',
  };
}
