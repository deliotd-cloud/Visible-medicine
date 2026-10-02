import pins from '../content/thoracic-bone-quiz-pins.json' with { type: 'json' };
import { thoracicBoneQuizGroups, thoracicBoneQuizQuestions, type ThoracicBoneQuizGroup } from '../content/thoracic-bone-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const groupByFma = new Map<string, ThoracicBoneQuizGroup>(
  Object.entries(thoracicBoneQuizGroups).flatMap(([group, ids]) =>
    ids.map(id => [id, group as ThoracicBoneQuizGroup] as const)),
);
const identities = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity),
  group: groupByFma.get(entry.identity.fmaId),
}]));

/** Admit only an exact pinned source identity, including parent and laterality. */
export function thoracicBoneQuizLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = identities.get(structure.id);
  if (!bound?.group || sourceCanonical(structure) !== bound.signature) return undefined;
  const question = thoracicBoneQuizQuestions[bound.group];
  return {
    readiness: 'draft',
    title: `${structure.name} · Thoracic bone quick check · draft`,
    body: question.body,
    bullets: [...question.choices],
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    citations: [question.reference],
    note: 'Original formative question; reference supports facts only. Revision-bound radiologist review pending. These are whole source bones: cartilage, joints, named facets, internal cortex and marrow are not separately segmented or validated. Laterality follows the pinned source identity, never screen position; relationships describe usual anatomy, not measured patient geometry. No imaging study, diagnosis, source admission, procedural guidance or clinical sign-off is supplied. Atlas, imaging-case and lecture access remain independent.',
  };
}
