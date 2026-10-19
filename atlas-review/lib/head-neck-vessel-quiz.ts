import pins from '../content/head-neck-vessel-quiz-pins.json' with { type: 'json' };
import { headNeckVesselQuizQuestions, type HeadNeckVesselQuizGroup } from '../content/head-neck-vessel-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as HeadNeckVesselQuizGroup,
}]));

/** Four formative drafts for eight exact retained head-and-neck vessel identities. */
export function headNeckVesselQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  const q = headNeckVesselQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${s.name} · Major neck vessel quick check · draft`,
    body: q.body, bullets: [...q.choices], correctAnswer: q.correctAnswer,
    explanation: q.explanation, citations: [...q.references],
    note: 'Original source-backed question; revision-bound radiologist review pending. Usual vessel relationships do not validate source-surface continuity, lumen, patency, flow, mask boundaries or patient-space registration. No diagnosis or patient-specific interpretation is established. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
