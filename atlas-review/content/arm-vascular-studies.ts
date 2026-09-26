import type { AxialStudy } from '../lib/axial-anatomy';

export const armVascularReferences = [
  'https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html',
  'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html',
];
const humeri = ['FMA23130', 'FMA23131'];
const brachialArteries = ['FMA22691', 'FMA22692'];
const limits =
  ' Whole source surfaces remain intact. Nerves, fascial planes, complete companion veins and a validated lumen are absent. Separation changes the display, not anatomy; return to 0% to restore source positions. This is not a surgical approach or a patient scan.';

/** Exact regional source sets, not inferred nerve routes or new segmentations. */
export const armVascularStudies: AxialStudy[] = [
  {
    id: 'arm-anterior-vessels',
    title: 'Arm: brachial vessels & flexors',
    regions: ['shoulder-arm', 'whole-body'],
    targetFmaIds: [...brachialArteries, 'FMA22935', 'FMA22936'],
    context: [
      {
        fmaIds: [
          ...humeri,
          'FMA37665',
          'FMA37666',
          'FMA37668',
          'FMA37669',
          'FMA37684',
          'FMA37685',
          'FMA37686',
          'FMA37687',
        ],
      },
    ],
    view: 'anterior',
    description:
      'Compare the brachial artery and supplied medial brachial vein with the biceps heads, brachialis, coracobrachialis and humerus. Choose Left or Right for one arm.',
    inspect:
      'Select and hide either biceps head to inspect deeper structures; Undo restores it. The medial brachial vein is one source-labelled selection, not the complete paired venous system. Use Arterial connections or Venous drainage on a selected vessel to explore its separately documented relationships. Extract selected sets one surface aside.' +
      limits,
    landmarks: [
      'brachial artery$',
      'medial brachial vein$',
      'brachialis$',
      'coracobrachialis$',
    ],
  },
  {
    id: 'arm-posterior-vessels',
    title: 'Arm: deep brachial artery & triceps',
    regions: ['shoulder-arm', 'whole-body'],
    targetFmaIds: ['FMA22696', 'FMA22697'],
    context: [
      {
        fmaIds: [
          ...humeri,
          ...brachialArteries,
          'FMA37695',
          'FMA37696',
          'FMA37697',
          'FMA37698',
          'FMA37699',
          'FMA37700',
        ],
      },
    ],
    view: 'posterior',
    description:
      'Inspect the deep brachial (profunda brachii) artery with the three source-labelled triceps heads, humerus and brachial artery. The anterior arm muscles are set aside.',
    inspect:
      'Hide the lateral or long triceps head to compare the deeper source surfaces, then Undo. The deep brachial artery normally relates to the posterior humeral shaft and radial nerve; the nerve itself is not modelled here. The visible artery surfaces do not prove a joined origin, complete collateral network or radial-groove contact. Extract selected separates one target without moving the other structures.' +
      limits,
    landmarks: [
      'deep brachial artery$',
      'medial head of .*triceps',
      'lateral head of .*triceps',
      'humerus$',
    ],
  },
];
export const armVascularSourceIds = [
  ...new Set(
    armVascularStudies.flatMap((s) => [
      ...s.targetFmaIds,
      ...s.context.flatMap((r) => r.fmaIds ?? []),
    ]),
  ),
];
