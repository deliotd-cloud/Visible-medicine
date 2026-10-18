import pins from '../content/foregut-vessel-quiz-pins.json' with { type: 'json' };
import { foregutVesselQuizQuestions, type ForegutVesselQuizGroup } from '../content/foregut-vessel-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as ForegutVesselQuizGroup,
}]));

/** Formative draft bound to eight complete retained foregut-vessel source identities. */
export function foregutVesselQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  const q = foregutVesselQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${s.name} · Foregut vessel quick check · draft`,
    body: q.body, bullets: [...q.choices], correctAnswer: q.correctAnswer,
    explanation: q.explanation, citations: [...q.references],
    note: 'Original source-backed question; revision-bound radiologist review pending. Usual anatomy does not validate complete branches, venous confluences, vascular continuity, flow, or patient anatomy of these static source surfaces. No diagnosis or patient-specific interpretation is established. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
