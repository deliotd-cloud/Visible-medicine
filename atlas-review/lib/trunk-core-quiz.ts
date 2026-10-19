import pins from '../content/trunk-core-quiz-pins.json' with { type: 'json' };
import { trunkCoreQuizQuestions, type TrunkCoreQuizGroup } from '../content/trunk-core-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as TrunkCoreQuizGroup,
}]));

/** Three formative drafts for fifteen exact retained rectum/costal-cartilage identities. */
export function trunkCoreQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  const q = trunkCoreQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${s.name} · Trunk anatomy quick check · draft`,
    body: q.body, bullets: [...q.choices], correctAnswer: q.correctAnswer,
    explanation: q.explanation, citations: [...q.references],
    note: 'Original source-backed question; revision-bound radiologist review pending. Usual bowel continuity or sternocostal joint class does not validate source-surface continuity, joint structure, motion, internal boundaries or patient-space registration. No diagnosis or patient-specific interpretation is established. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
