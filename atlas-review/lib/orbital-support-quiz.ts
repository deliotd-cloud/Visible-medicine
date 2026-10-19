import pins from '../content/orbital-support-quiz-pins.json' with { type: 'json' };
import { orbitalSupportQuizQuestions, type OrbitalSupportQuizGroup } from '../content/orbital-support-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as OrbitalSupportQuizGroup,
}]));

/** Exact retained identities only: no name/FMA-only fallback or inferred side. */
export function orbitalSupportQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  const q = orbitalSupportQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${s.name} · Orbital support quick check · draft`,
    body: q.body, bullets: [...q.choices], correctAnswer: q.correctAnswer,
    explanation: q.explanation, citations: [...q.references],
    note: 'Source-backed teaching draft; revision-bound radiologist review pending. This question does not validate tendon attachments, pulley mechanics, orbital-apex boundaries or patient-space registration. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
