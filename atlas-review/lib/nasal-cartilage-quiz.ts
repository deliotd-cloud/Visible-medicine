import pins from '../content/nasal-cartilage-quiz-pins.json' with { type: 'json' };
import { nasalCartilageQuizQuestions, type NasalCartilageQuizGroup } from '../content/nasal-cartilage-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const allowedFmaGroups: Readonly<Record<string, NasalCartilageQuizGroup>> = {
  FMA59503: 'septal',
  FMA59505: 'alar',
  FMA59506: 'alar',
  FMA59512: 'lateral',
  FMA59513: 'lateral',
};

const bindings = new Map(
  pins.entries.flatMap(entry => {
    const group = allowedFmaGroups[entry.identity.fmaId];
    return group && group === entry.group
      ? [[entry.identity.id, { signature: sourceCanonical(entry.identity), group }] as const]
      : [];
  }),
);

/** Exact retained source identities for the five named nasal cartilage records. */
export function nasalCartilageQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  const question = nasalCartilageQuizQuestions[bound.group];
  return {
    readiness: 'draft',
    title: `${s.name} · Nasal cartilage quick check · draft`,
    body: question.body,
    bullets: [...question.choices],
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    citations: [...question.references],
    note: 'Teaching draft; revision-bound radiologist review pending. This question does not validate cartilage boundaries, source geometry, nasal airflow or patient registration. Atlas, imaging-case and lecture access remain independent.',
  };
}
