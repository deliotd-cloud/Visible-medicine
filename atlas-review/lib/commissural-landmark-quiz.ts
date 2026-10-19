import pins from '../content/commissural-landmark-quiz-pins.json' with { type: 'json' };
import { commissuralLandmarkQuizQuestions, type CommissuralLandmarkQuizGroup } from '../content/commissural-landmark-quiz';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const allowed: Readonly<Record<string, CommissuralLandmarkQuizGroup>> = {
  FMA61970: 'forniceal', FMA62072: 'posterior',
};
const bindings = new Map(pins.entries.flatMap(entry => {
  const group = allowed[entry.identity.fmaId];
  return group && group === entry.group
    ? [[entry.identity.id, { signature: sourceCanonical(entry.identity), group }] as const] : [];
}));

/** Bind the two retained source records exactly; never infer tract validity. */
export function commissuralLandmarkQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  const question = commissuralLandmarkQuizQuestions[bound.group];
  return {
    readiness: 'draft', title: `${s.name} · Commissural landmark quick check · draft`,
    body: question.body, bullets: [...question.choices], correctAnswer: question.correctAnswer,
    explanation: question.explanation, citations: [...question.references],
    note: 'Original educational draft; revision-bound radiologist review pending. Source surfaces are not tractograms, validated clinical boundaries or patient-space registration. Atlas, imaging-case and lecture access remain independent.',
  };
}
