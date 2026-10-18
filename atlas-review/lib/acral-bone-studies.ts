import type { AxialStudy } from './axial-anatomy';

// Existing source surfaces only. These exposure windows are not surgical
// layers, reconstructed joints or registered radiographic projections.
export const acralBoneReferences = {
  hand: ['https://anatomy.ttuhscep.edu/musculoskeletal_system/hand_ans.html'],
  foot: [
    'https://anatomy.med.utah.edu/diganat/anatomy_tutorials/digital_dissector/index.php?add=/ankle_foot&lab=35&menu=35+Ankle/Foot&rcount=1&selectsize=Small&textsize=Small',
    'https://www.ncbi.nlm.nih.gov/books/NBK546698/',
  ],
};
const inspect =
  'Choose Left or Right for a closer view. Select and set aside a bone to expose its neighbours; Undo restores it. Return separation to zero before comparing source positions. Joint cartilage, ligament layers and normal joint-space measurements are not supplied by these bone surfaces.';

export const acralBoneStudySets: AxialStudy[] = [
  {
    id: 'carpal-proximal-row',
    title: 'Wrist: proximal carpal row',
    regions: ['hand'],
    targetFmaIds: [
      'FMA24435', 'FMA24436', // scaphoids
      'FMA24437', 'FMA24438', // lunates
      'FMA24439', 'FMA24440', // triquetrals
      'FMA24441', 'FMA24442', // pisiforms
    ],
    context: [],
    view: 'anterior',
    description:
      'Expose scaphoid, lunate, triquetral and pisiform without the distal row or overlying tissues. The pisiform lies on the palmar side of the triquetral rather than forming a flat four-bone line. Rotate to inspect that depth relationship.',
    inspect,
    landmarks: ['scaphoid$', 'lunate$', 'triquetral$', 'pisiform$'],
  },
  {
    id: 'carpal-distal-row',
    title: 'Wrist: distal carpal row',
    regions: ['hand'],
    targetFmaIds: [
      'FMA24443', 'FMA24444', // trapezia
      'FMA23725', 'FMA24445', // trapezoids: source IDs are not sequential
      'FMA24446', 'FMA24447', // capitates
      'FMA24448', 'FMA24449', // hamates
    ],
    context: [],
    view: 'anterior',
    description:
      'Expose trapezium, trapezoid, capitate and hamate, ordered anatomically from the thumb side towards the little-finger side. Select each bone to distinguish its shape. Use Retinaculum & carpal arch to return to both rows with the roof surface.',
    inspect,
    landmarks: ['trapezium$', 'trapezoid$', 'capitate$', 'hamate$'],
  },
  {
    id: 'tarsal-hindfoot',
    title: 'Foot: hindfoot bones',
    regions: ['foot'],
    targetFmaIds: ['FMA24482', 'FMA24483', 'FMA24497', 'FMA24498'],
    context: [],
    view: 'superior',
    description:
      'Keep the talus and calcaneus only. Rotate from above to a side view, then set the talus aside to inspect the underlying calcaneal surface. This is a bone exposure, not a simulation of subtalar motion or an ankle mortise.',
    inspect,
    landmarks: ['talus$', 'calcaneus$'],
  },
  {
    id: 'tarsal-midfoot',
    title: 'Foot: midfoot bones',
    regions: ['foot'],
    targetFmaIds: [
      'FMA24500', 'FMA24501', // naviculars
      'FMA24528', 'FMA24529', // cuboids
      'FMA24521', 'FMA24522', // medial cuneiforms
      'FMA24523', 'FMA24524', // intermediate cuneiforms
      'FMA24525', 'FMA24526', // lateral cuneiforms
    ],
    context: [],
    view: 'superior',
    description:
      'Expose the navicular, cuboid and three cuneiforms without the hindfoot, metatarsals or toes. Compare the medial navicular–cuneiform region with the lateral cuboid. The Skeletal framework view restores the broader bony context; Lisfranc ligaments are not reconstructed.',
    inspect,
    landmarks: ['navicular bone', 'cuboid bone$', 'cuneiform bone$'],
  },
];
