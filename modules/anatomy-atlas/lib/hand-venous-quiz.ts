import pins from '../content/hand-venous-quiz-pins.json' with { type: 'json' };
import { handVenousQuizQuestions, type HandVenousQuizGroup } from '../content/hand-venous-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as HandVenousQuizGroup,
}]));

/** Five source-bound formative concepts for 14 retained venous identities. */
export function handVenousQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  const q = handVenousQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${s.name} · Hand venous quick check · draft`,
    body: q.body, bullets: [...q.choices], correctAnswer: q.correctAnswer,
    explanation: q.explanation, citations: [...q.references],
    note: 'Original factual question; revision-bound radiologist sign-off pending. Source labels do not verify vascular plane or arch continuity. These incomplete surfaces cannot prove donor-specific drainage, connections, lumen, patency, flow, or patient-space registration. Atlas, imaging-case and lecture access remain independent.',
  };
}
