import pins from '../content/spine-imaging-pins.json' with { type: 'json' };
import { spinalDiscQuizGroups, spinalDiscQuizQuestions, type SpinalDiscQuizGroup } from '../content/spinal-disc-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const groups = new Map<string, SpinalDiscQuizGroup>(
  Object.entries(spinalDiscQuizGroups).flatMap(([group, ids]) =>
    ids.map(id => [id, group as SpinalDiscQuizGroup] as const)),
);
const bindings = new Map(pins.entries.filter(e => groups.has(e.identity.fmaId)).map(e => [
  e.identity.id, { signature: sourceCanonical(e.identity), group: groups.get(e.identity.fmaId)! },
]));

/** Complete source identity is required; an FMA match alone is not admission. */
export function spinalDiscQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const question = spinalDiscQuizQuestions[binding.group];
  const sourceNote = s.fmaId === 'FMA25058'
    ? ' This source-labelled axis disc lies below C2; there is no C1–C2 intervertebral disc.'
    : binding.group === 'thoracicCoverage' || binding.group === 'surfaceLimits'
      ? ' T12–L1 is unresolved in this source, not normally absent, collapsed or fused.'
      : binding.group === 'lumbarNumbering'
        ? ' Source names do not automatically establish patient levels, including L5–S1.'
        : '';
  return {
    readiness: 'draft', title: `${s.name} · Disc MRI quick check · draft`,
    body: question.body, bullets: [...question.choices], correctAnswer: question.correctAnswer,
    explanation: question.explanation, citations: [question.reference],
    note: 'Original question; links provide general anatomy/MRI reading, not reproduced text or images. Model limitations are source-inventory statements, not findings from those publications. Radiologist review pending for this source revision. These are whole-disc surfaces: internal tissues and neural structures are not independently segmented. No patient images, diagnosis, measured pathology or CT/MRI registration are supplied. Return explode to zero for source relationships. Atlas, imaging-case and lecture access remain independent.' + sourceNote,
  };
}
