import pins from '../content/carpal-bone-quiz-pins.json' with {type:'json'};
import {carpalBoneQuizQuestions,type CarpalBoneQuizGroup} from '../content/carpal-bone-quiz';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const identities = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity),
  group: entry.group as CarpalBoneQuizGroup,
}]));

export function carpalBoneQuizLesson(structure:BodyStructure, tab:ContentTab):ContentLesson|undefined {
  if (tab !== 'quiz') return undefined;
  const bound = identities.get(structure.id);
  if (!bound || sourceCanonical(structure) !== bound.signature) return undefined;
  const question = carpalBoneQuizQuestions[bound.group];
  return {
    readiness: 'draft',
    title: `${structure.name} · Carpal quick check · draft`,
    body: question.body,
    bullets: [...question.choices],
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    citations: [question.reference],
    note: 'Original question; reference supports facts only. Radiologist review pending for this source revision. Each selection is a whole source bone: tubercles, the hamate hook, articular surfaces, ligaments and tunnel contents are not independently segmented or validated. Source laterality and anatomical radial/ulnar or palmar/dorsal directions do not follow viewer screen orientation or establish patient laterality. Row comparisons describe assembled anatomy, not registered patient geometry. This atlas source is not patient imaging or registered CT/MRI and has no clinical validation; do not use it to exclude injury or direct care. Atlas, imaging-case and lecture access remain independent.',
  };
}
