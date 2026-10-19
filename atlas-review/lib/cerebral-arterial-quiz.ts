import pins from '../content/cerebral-arterial-quiz-pins.json' with { type: 'json' };
import { cerebralArterialQuizQuestions, type CerebralArterialQuizGroup } from '../content/cerebral-arterial-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as CerebralArterialQuizGroup,
}]));

/** Five source-bound formative concepts for eight retained arterial identities. */
export function cerebralArterialQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  const q = cerebralArterialQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${s.name} · Cerebral arterial quick check · draft`,
    body: q.body, bullets: [...q.choices], correctAnswer: q.correctAnswer,
    explanation: q.explanation, citations: [...q.references],
    note: 'Original factual question; revision-bound radiologist sign-off pending. These source surfaces cannot prove lumen, patency, flow, complete arterial continuity, a donor-specific variant or patient-space registration. Paired selections share a usual relationship without inferred mirroring. Atlas, imaging-case and lecture access remain independent.',
  };
}
