import pins from '../content/orbital-support-mri-pins.json' with { type: 'json' };
import { ocularSupportQuizQuestions, type OcularSupportQuizGroup } from '../content/ocular-support-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const allowedFmaGroups: Readonly<Record<string, OcularSupportQuizGroup>> = {
  FMA49144: 'check',
  FMA49145: 'check',
  FMA49147: 'check',
  FMA49148: 'check',
  FMA59091: 'tarsal',
  FMA59092: 'tarsal',
  FMA59089: 'tarsal',
  FMA59090: 'tarsal',
};

const bindings = new Map(
  pins.entries.flatMap(entry => {
    const group = allowedFmaGroups[entry.identity.fmaId];
    return group
      ? [[entry.identity.id, { signature: sourceCanonical(entry.identity), group }] as const]
      : [];
  }),
);

/** Exact retained source identities and the eight named FMA records only. */
export function ocularSupportQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  const question = ocularSupportQuizQuestions[bound.group];
  return {
    readiness: 'draft',
    title: `${s.name} · Ocular support quick check · draft`,
    body: question.body,
    bullets: [...question.choices],
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    citations: [...question.references],
    note: 'Teaching draft; revision-bound radiologist review pending. This question does not validate attachments, source geometry or patient registration.',
  };
}
