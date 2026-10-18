import type { AxialStudy } from './axial-anatomy';

// Factual teaching relationships, not source-derived nerve endpoints. All IDs
// refer to existing surfaces; the eyeballs remain compound reference objects.
export const orbitalMotorReferences = [
  'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/nerve-tables/nerves-of-the-head-and-neck/',
  'https://www.lumen.luc.edu/lumen/meded/grossanatomy/dissector/mml/so.htm',
];
const eyes = ['FMA12514', 'FMA12515'];
const inspect =
  'Choose one side for a closer comparison. Select a nerve or muscle, then rotate, isolate or set it aside; Undo restores removal. These are draft source relationships: terminal branches, attachment endpoints and nerve conduction are not validated or simulated.';

export const orbitalMotorStudySets: AxialStudy[] = [
  {
    id: 'orbital-motor-iii-superior',
    title: 'CN III superior division & muscles',
    regions: ['head-neck'],
    targetFmaIds: ['FMA52574', 'FMA52575'],
    context: [
      { fmaIds: ['FMA49044', 'FMA49045', 'FMA49048', 'FMA49049', ...eyes] },
    ],
    view: 'anterior',
    description:
      'Compare the supplied superior oculomotor divisions with superior rectus and levator palpebrae. One muscle moves the globe; the other raises the upper lid. The grouped eyeballs provide context, not separate eyelid layers.',
    inspect,
    landmarks: [
      'superior branch of .*oculomotor',
      'superior rectus',
      'levator palpebrae',
    ],
  },
  {
    id: 'orbital-motor-iii-inferior',
    title: 'CN III inferior division & muscles',
    regions: ['head-neck'],
    targetFmaIds: ['FMA52576', 'FMA52577'],
    context: [
      {
        fmaIds: [
          'FMA49056',
          'FMA49057',
          'FMA49046',
          'FMA49047',
          'FMA49050',
          'FMA49051',
          ...eyes,
        ],
      },
    ],
    view: 'inferior',
    description:
      'Compare the supplied inferior oculomotor divisions with medial rectus, inferior rectus and inferior oblique. This motor-muscle view does not include or reconstruct the division’s parasympathetic route through the ciliary ganglion.',
    inspect,
    landmarks: [
      'inferior branch of .*oculomotor',
      'medial rectus',
      'inferior oblique',
    ],
  },
  {
    id: 'orbital-motor-iv',
    title: 'CN IV & superior oblique',
    regions: ['head-neck'],
    targetFmaIds: ['FMA50881', 'FMA50882'],
    context: [{ fmaIds: ['FMA49052', 'FMA49053', ...eyes] }],
    view: 'superior',
    description:
      'Compare the supplied trochlear nerves with superior oblique and the grouped eyeballs. Superior oblique depresses an adducted eye; the atlas does not animate gaze or reconstruct the complete intracranial nerve course.',
    inspect,
    landmarks: ['^(right|left) trochlear nerve$', 'superior oblique'],
  },
];
