import type { ArterialDefinitions } from '../lib/regional-arterial';

// Original concise teaching map, not measured donor-specific vessel junctions.
export const elbowArterialReference =
  'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-upper-limb/';
export const elbowArterialFacts = [
  {
    key: 'inferiorUlnarCollateral',
    fmaIds: ['FMA22712', 'FMA22713'],
    parent: 'brachial',
    parentName: 'brachial artery',
    anatomy:
      'The inferior ulnar collateral artery branches from the brachial artery and communicates with the anterior ulnar recurrent artery.',
  },
  {
    key: 'superiorUlnarCollateral',
    fmaIds: ['FMA22707', 'FMA22708'],
    parent: 'brachial',
    parentName: 'brachial artery',
    anatomy:
      'The superior ulnar collateral artery arises from the brachial artery, accompanies the ulnar nerve and communicates with the posterior ulnar recurrent artery.',
  },
  {
    key: 'radialCollateral',
    fmaIds: ['FMA23126', 'FMA23127'],
    parent: 'deepBrachial',
    parentName: 'deep brachial artery',
    anatomy:
      'The radial collateral branch of the deep brachial artery accompanies the radial nerve and communicates with the radial recurrent artery.',
  },
  {
    key: 'middleCollateral',
    fmaIds: ['FMA23124', 'FMA23125'],
    parent: 'deepBrachial',
    parentName: 'deep brachial artery',
    anatomy:
      'The middle collateral branch of the deep brachial artery communicates with the interosseous recurrent artery.',
  },
  {
    key: 'radialRecurrent',
    fmaIds: ['FMA22764', 'FMA22766'],
    parent: 'radial',
    parentName: 'radial artery',
    anatomy:
      'The radial recurrent artery arises from the radial artery and ascends towards the lateral elbow.',
  },
  {
    key: 'anteriorUlnarRecurrent',
    fmaIds: ['FMA22801', 'FMA22802'],
    parent: 'ulnar',
    parentName: 'ulnar artery',
    anatomy:
      'The anterior ulnar recurrent artery arises from the ulnar artery; a common origin with its posterior counterpart may occur.',
  },
  {
    key: 'posteriorUlnarRecurrent',
    fmaIds: ['FMA22804', 'FMA22805'],
    parent: 'ulnar',
    parentName: 'ulnar artery',
    anatomy:
      'The posterior ulnar recurrent artery arises from the ulnar artery and contributes to the medial elbow circulation.',
  },
] as const;
export const elbowArterialConcepts: ArterialDefinitions = Object.fromEntries(
  elbowArterialFacts.map((f) => [
    f.key,
    {
      fmaIds: f.fmaIds,
      context: 'forearm',
      note: 'Original finite source surface; typical relations are not a verified donor junction, complete network, nerve path or perfusion test. Return separation to 0% to compare source positions.',
    },
  ]),
);
export const elbowArterialRelations = [
  ...elbowArterialFacts.map((f) => ({
    from: f.parent,
    to: f.key,
    kind: 'branch' as const,
    note: 'Typical same-side parent; source junction and variation remain unvalidated.',
  })),
  ...(
    [
      ['inferiorUlnarCollateral', 'anteriorUlnarRecurrent'],
      ['superiorUlnarCollateral', 'posteriorUlnarRecurrent'],
      ['radialCollateral', 'radialRecurrent'],
      ['middleCollateral', 'recurrentInterosseous'],
    ] as const
  ).map(([from, to]) => ({
    from,
    to,
    kind: 'anastomosis' as const,
    note: 'Typical communication for comparison, not a measured connection or proof of collateral adequacy.',
  })),
];
