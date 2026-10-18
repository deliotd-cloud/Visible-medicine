import pins from '../content/salivary-stylohyoid-quiz-pins.json' with { type: 'json' };
import { salivaryStylohyoidQuizQuestions, type SalivaryStylohyoidQuizGroup } from '../content/salivary-stylohyoid-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as SalivaryStylohyoidQuizGroup,
}]));

/** Original formative drafts, bound to complete retained source identities. */
export function salivaryStylohyoidQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  const q = salivaryStylohyoidQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${s.name} · Salivary & stylohyoid quick check · draft`,
    body: q.body, bullets: [...q.choices], correctAnswer: q.correctAnswer,
    explanation: q.explanation, citations: [...q.references],
    note: 'Original source-backed formative question; revision-bound radiologist review pending. Usual relationships do not validate the model attachments, ducts, flow, operative planes or individual patient anatomy. These static surfaces establish no diagnosis, acquired-image match or spatial registration. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
