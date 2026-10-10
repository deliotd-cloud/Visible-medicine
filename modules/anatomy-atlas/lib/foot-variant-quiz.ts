import pins from '../content/foot-muscle-imaging-pins.json' with { type: 'json' };
import { footVariantQuizQuestions } from '../content/foot-variant-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const sides: Readonly<Record<string, string>> = { FMA86034: 'right', FMA86035: 'left' };
const bindings = new Map(pins.entries.flatMap(entry =>
  entry.group === 'opponensDigitiMinimi' && sides[entry.identity.fmaId] === entry.identity.laterality
    ? [[entry.identity.id, sourceCanonical(entry.identity)] as const] : []));

/** Retain both exact source-labelled slips without asserting universal separability. */
export function footVariantQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz' || bindings.get(s.id) !== sourceCanonical(s)) return undefined;
  const q = footVariantQuizQuestions.opponens;
  return {
    readiness: 'draft', title: `${s.name} · Foot variant quick check · draft`,
    body: q.body, bullets: [...q.choices], correctAnswer: q.correctAnswer,
    explanation: q.explanation, citations: [...q.references],
    note: 'Original educational draft; revision-bound radiologist review pending. Source geometry is unchanged and unvalidated. No separate motor function, patient-space registration or diagnostic finding is inferred. Atlas, imaging-case and lecture access remain independent.',
  };
}
