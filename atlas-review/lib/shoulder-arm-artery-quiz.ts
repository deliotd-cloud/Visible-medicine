import pins from '../content/shoulder-arm-artery-quiz-pins.json' with { type: 'json' };
import { shoulderArmArteryQuizQuestions, type ShoulderArmArteryQuizGroup } from '../content/shoulder-arm-artery-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as ShoulderArmArteryQuizGroup,
}]));

/** Formative drafts bound to fourteen complete retained shoulder and upper-arm artery identities. */
export function shoulderArmArteryQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  const q = shoulderArmArteryQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${s.name} · Shoulder and arm artery quick check · draft`,
    body: q.body, bullets: [...q.choices], correctAnswer: q.correctAnswer,
    explanation: q.explanation, citations: [...q.references],
    note: 'Original source-backed question; revision-bound radiologist review pending. Usual arterial relationships do not validate continuous lumen, patency, perfusion, source boundaries, registration, or a procedural route. No diagnosis or patient-specific interpretation is established. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
