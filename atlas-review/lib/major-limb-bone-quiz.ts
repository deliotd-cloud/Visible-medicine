import pins from '../content/major-limb-bone-quiz-pins.json' with { type: 'json' };
import { majorLimbBoneQuizQuestions, type MajorLimbBoneQuizGroup } from '../content/major-limb-bone-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as MajorLimbBoneQuizGroup,
}]));

/** Draft formative question bound to the complete retained BodyStructure. */
export function majorLimbBoneQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  const question = majorLimbBoneQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${s.name} · Major limb bone quick check · draft`,
    body: question.body, bullets: [...question.choices], correctAnswer: question.correctAnswer,
    explanation: question.explanation, citations: [...question.references],
    note: 'Original source-backed question; revision-bound radiologist review pending. Usual anatomy does not validate landmarks, boundaries, or articulations on these static source surfaces. No diagnosis or patient-specific interpretation is established. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
