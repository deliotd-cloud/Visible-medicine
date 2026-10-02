import pins from '../content/tarsal-bone-quiz-pins.json' with {type:'json'};
import {tarsalBoneQuizQuestions,type TarsalBoneQuizGroup} from '../content/tarsal-bone-quiz';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const identities = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity),
  group: entry.group as TarsalBoneQuizGroup,
}]));

export function tarsalBoneQuizLesson(structure:BodyStructure, tab:ContentTab):ContentLesson|undefined {
  if (tab !== 'quiz') return undefined;
  const bound = identities.get(structure.id);
  if (!bound || sourceCanonical(structure) !== bound.signature) return undefined;
  const question = tarsalBoneQuizQuestions[bound.group];
  if (!question) return undefined;
  return {
    readiness: 'draft',
    title: `${structure.name} · Tarsal quick check · draft`,
    body: question.body,
    bullets: [...question.choices],
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    citations: [question.reference, ...('additionalReference' in question ? [question.additionalReference] : [])],
    note: 'Original question; references support facts only. Revision-bound radiologist review is pending. Each selection is a whole source bone; named tuberosities, articular surfaces, tendons and ligaments are not independently segmented or validated. Anatomical relationships do not establish patient alignment, injury or ligament integrity. This Atlas source is not patient imaging or clinical validation. Atlas, imaging-case and lecture access remain independent.',
  };
}
