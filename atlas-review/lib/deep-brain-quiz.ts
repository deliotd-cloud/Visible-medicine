import pins from '../content/deep-brain-quiz-pins.json' with { type: 'json' };
import { deepBrainQuizQuestions, type DeepBrainQuizGroup } from '../content/deep-brain-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as DeepBrainQuizGroup,
}]));

/** Six formative drafts for twelve exact retained bilateral deep-brain identities. */
export function deepBrainQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  const q = deepBrainQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${s.name} · Deep-brain quick check · draft`,
    body: q.body, bullets: [...q.choices], correctAnswer: q.correctAnswer,
    explanation: q.explanation, citations: [...q.references],
    note: 'Original source-backed question; revision-bound radiologist review pending. This whole-structure source surface does not resolve internal nuclei, fibre tracts, physiological activity, exact tissue boundaries or patient-space registration. No diagnosis or patient-specific interpretation is established. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
