import pins from '../content/thoracic-core-reasoning-pins.json' with { type: 'json' };
import type { BodyStructure } from '../app/body-types';
import { sourceCanonical } from './body-source-additions';
import type { ReasoningConcept } from './reasoning-questions';

const heartReference = {
  title: 'NHLBI · How Blood Flows through the Heart',
  url: 'https://www.nhlbi.nih.gov/health/heart/blood-flow',
};
const lungReference = {
  title: 'NHLBI · The Respiratory System',
  url: 'https://www.nhlbi.nih.gov/health/lungs/respiratory-system',
};
const thoraxReference = {
  title: 'UAMS · Visceral Structures of the Thorax',
  url: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/viscera-tables/visceral-structures-of-the-thorax/',
};

// Whole displayed records pin ordered file/hash pairs, source tree, frame bounds,
// bundle, region and side. Neither FMA nor a plausible label admits a substitute.
const bound = new Map(
  pins.entries.map(({ key, identity }) => [
    `${key}:${identity.id}`,
    sourceCanonical(identity),
  ] as const),
);

export function thoracicCoreReasoningSourceMatches(s: BodyStructure, key: string): boolean {
  const expected = bound.get(`${key}:${s.id}`);
  return expected !== undefined && sourceCanonical(s) === expected;
}

const heart = pins.entries.find(entry => entry.identity.fmaId === 'FMA7088')!.identity;
const rightLung = pins.entries.find(entry => entry.identity.fmaId === 'FMA7309')!.identity;
const leftLung = pins.entries.find(entry => entry.identity.fmaId === 'FMA7310')!.identity;
const rightBronchus = pins.entries.find(entry => entry.identity.fmaId === 'FMA7395')!.identity;
const leftBronchus = pins.entries.find(entry => entry.identity.fmaId === 'FMA7396')!.identity;
const one = (s: typeof heart) => ({
  fma: s.fmaId,
  side: s.laterality as 'unpaired' | 'right' | 'left',
  files: s.sources.map(source => source.file) as [string, string, ...string[]],
});

/** Four new draft concepts over five exact current root selections. */
export const thoracicCoreReasoningConcepts: readonly ReasoningConcept[] = [
  {
    key: 'thoracic-core-heart',
    region: 'thorax', sourceTissue: 'organ', sourceTree: 'partof',
    bindings: [one(heart)],
    prompt: 'A learner follows blood returning from the lungs before it is sent to the body. Which supplied organ receives that pulmonary venous return and pumps it into systemic circulation?',
    explanation: 'The heart receives oxygenated blood on its left side and pumps it to the body. Oxygen enters the blood at the lungs, not within this heart surface. The model cannot show flow, coronary perfusion or a patient-specific abnormality.',
    references: [heartReference],
    distractors: ['thoracic-trachea', 'thoracic-esophagus', 'thoracic-thymus'],
    readiness: 'draft', revision: 1,
  },
  {
    key: 'thoracic-core-lung',
    region: 'thorax', sourceTissue: 'organ', sourceTree: 'partof',
    bindings: [one(rightLung), one(leftLung)],
    prompt: 'Which supplied paired organ receives air beyond the conducting bronchi and contains the alveolar tissue where blood and air exchange gases?',
    explanation: 'The lung is the gas-exchange organ; a main bronchus conducts air into it. The usual right lung has three lobes and the left has two. These grouped surfaces do not show alveoli, ventilation or perfusion in a patient.',
    references: [lungReference, thoraxReference],
    distractors: ['thoracic-core-right-main-bronchus', 'thoracic-core-left-main-bronchus', 'thoracic-trachea'],
    readiness: 'draft', revision: 1,
  },
  {
    key: 'thoracic-core-right-main-bronchus',
    region: 'thorax', sourceTissue: 'organ', sourceTree: 'partof',
    bindings: [{ fma: rightBronchus.fmaId, side: 'right', file: rightBronchus.sources[0].file }],
    prompt: 'Which right-sided supplied structure conducts air from the tracheal split toward the three-lobed right lung, rather than exchanging gases itself?',
    explanation: 'The right main bronchus is the proximal conducting airway. The right lung contains the distal gas-exchange tissue. This short source segment does not prove continuity to every lobar branch or patient airway patency.',
    references: [lungReference, thoraxReference],
    distractors: ['thoracic-core-lung', 'thoracic-trachea', 'thoracic-esophagus'],
    readiness: 'draft', revision: 1,
  },
  {
    key: 'thoracic-core-left-main-bronchus',
    region: 'thorax', sourceTissue: 'organ', sourceTree: 'isa',
    bindings: [{ fma: leftBronchus.fmaId, side: 'left', file: leftBronchus.sources[0].file }],
    prompt: 'Which left-sided supplied structure conducts air from the tracheal split toward the two-lobed left lung, rather than exchanging gases itself?',
    explanation: 'The left main bronchus is the proximal conducting airway. The left lung contains the distal gas-exchange tissue. This short source segment does not prove continuity to every lobar branch or patient airway patency.',
    references: [lungReference, thoraxReference],
    distractors: ['thoracic-core-lung', 'thoracic-trachea', 'thoracic-esophagus'],
    readiness: 'draft', revision: 1,
  },
];
