import type { AxialStudy } from '../lib/axial-anatomy';

export const limbVascularReferences = [
  'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html',
  'https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html',
  'https://pmc.ncbi.nlm.nih.gov/articles/PMC5381851/',
];
const legBones = ['FMA24477', 'FMA24478', 'FMA24480', 'FMA24481'];
const limitation =
  ' Whole source groups remain intact. Nerves, fascial boundaries, complete companion veins, lumens and exact junctions are not supplied. Source proximity is not verified continuity; separation is a teaching display, not surgery or patient imaging.';
export const limbVascularStudySets: AxialStudy[] = [
  {
    id: 'calf-anterior-vessels',
    title: 'Calf: anterior vessels & muscles',
    regions: ['leg'],
    targetFmaIds: ['FMA43896', 'FMA43897', 'FMA44336', 'FMA44337'],
    context: [
      {
        fmaIds: [
          ...legBones,
          'FMA22544',
          'FMA22545',
          'FMA22548',
          'FMA22549',
          'FMA22546',
          'FMA22547',
          'FMA22550',
          'FMA22551',
        ],
      },
    ],
    view: 'anterior',
    description:
      'Compare the anterior tibial artery and supplied vein group with tibialis anterior, the long toe extensors and fibularis tertius. Choose a side for one calf.',
    inspect:
      'Select and hide a covering muscle to expose the vessels; Undo restores it. Extract selected can set one vessel aside. Return to 0% to compare source positions. Fibularis tertius belongs to the anterior, not lateral, muscle compartment.' +
      limitation,
    landmarks: [
      'anterior tibial vein$',
      'anterior tibial artery$',
      'tibialis anterior$',
      'tibia$',
    ],
  },
  {
    id: 'calf-posterior-vessels',
    title: 'Calf: posterior vessels & muscles',
    regions: ['leg'],
    targetFmaIds: ['FMA43898', 'FMA43899', 'FMA44338', 'FMA44339'],
    context: [
      {
        fmaIds: [
          ...legBones,
          'FMA65018',
          'FMA65019',
          'FMA65016',
          'FMA65017',
          'FMA65014',
          'FMA65015',
        ],
      },
    ],
    view: 'posterior',
    description:
      'Set the superficial calf muscles aside and inspect posterior tibial vessels with tibialis posterior and the long toe flexors.',
    inspect:
      'Remove individual retained muscles to expose the vessel surfaces, then Undo. The fibular-vein source remains withheld; the deep posterior collecting system is incomplete. This is not a tarsal-tunnel dissection.' +
      limitation,
    landmarks: [
      'posterior tibial vein$',
      'posterior tibial artery$',
      'tibialis posterior$',
      'fibula$',
    ],
  },
  {
    id: 'thigh-deep-femoral-vessels',
    title: 'Thigh: deep femoral vessels',
    regions: ['thigh'],
    targetFmaIds: [
      'FMA70249',
      'FMA70250',
      'FMA20796',
      'FMA20797',
      'FMA21188',
      'FMA21189',
      'FMA51042',
      'FMA51043',
    ],
    context: [
      {
        fmaIds: [
          'FMA24474',
          'FMA24475',
          'FMA22450',
          'FMA22451',
          'FMA22456',
          'FMA22457',
          'FMA22459',
          'FMA22460',
        ],
      },
    ],
    view: 'anterior',
    description:
      'Compare supplied femoral and deep femoral vessels with pectineus, adductor longus, adductor magnus and the femur. Sartorius and other covering muscles are set aside.',
    inspect:
      'Hide one context muscle at a time to inspect deeper surfaces. Femoral and deep femoral veins are distinct deep-system selections; the common femoral junction is not separately labelled. This is not a complete femoral-triangle or adductor-canal model.' +
      limitation,
    landmarks: [
      'deep femoral vein$',
      'deep femoral artery$',
      'femoral vein$',
      'adductor longus$',
    ],
  },
];
export const limbVascularSourceIds = [
  ...new Set(
    limbVascularStudySets.flatMap((s) => [
      ...s.targetFmaIds,
      ...s.context.flatMap((r) => r.fmaIds ?? []),
    ]),
  ),
];
