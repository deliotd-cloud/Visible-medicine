import pins from '../content/hand-arterial-quiz-pins.json' with { type: 'json' };
import { handArterialQuizQuestions, type HandArterialQuizGroup } from '../content/hand-arterial-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as HandArterialQuizGroup,
}]));

/** Seven source-bound formative concepts for 28 retained arterial identities. */
export function handArterialQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  const q = handArterialQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${s.name} · Hand arterial quick check · draft`,
    body: q.body, bullets: [...q.choices], correctAnswer: q.correctAnswer,
    explanation: q.explanation, citations: [...q.references],
    note: 'Original factual question; revision-bound radiologist sign-off pending. Source labels and numbering do not establish a normal branch count. These incomplete, asymmetric surfaces cannot prove continuity, lumen, patency, flow, or patient-space registration. Atlas, imaging-case and lecture access remain independent.',
  };
}
