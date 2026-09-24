// Whole-body comparison of existing BodyParts3D exterior surfaces only.
// The source catalog keeps the muscles in thigh and each tibia in leg.
export const pesAnserineReferences = [
  'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html',
];

export const pesAnserineBindings = [
  { id: 'vm:anatomy:body:thigh:right:muscle:right-sartorius', fmaId: 'FMA22354', laterality: 'right', bundle: 'thigh-muscles', nodeName: 'FMA22354', sources: [{ file: 'FJ1434', sha256: '670d0351a8f017d4792ee7c5780557b5468a298e128cf44da9443d2712d24eb7' }] },
  { id: 'vm:anatomy:body:thigh:right:muscle:right-gracilis', fmaId: 'FMA43883', laterality: 'right', bundle: 'thigh-muscles', nodeName: 'FMA43883', sources: [{ file: 'FJ1421', sha256: '82d12d8359e66303a7e5a21c2b9b24b26d33b8bbeab55f8f97c87881e25e5fa7' }] },
  { id: 'vm:anatomy:body:thigh:right:muscle:right-semitendinosus', fmaId: 'FMA22358', laterality: 'right', bundle: 'thigh-muscles', nodeName: 'FMA22358', sources: [{ file: 'FJ1436', sha256: 'a9351992df5093e761784b73ca3f4a7d09d0c997e3cef2f840a45b863eb7097d' }] },
  { id: 'vm:anatomy:body:leg:right:bone:right-tibia', fmaId: 'FMA24477', laterality: 'right', bundle: 'leg-skeleton', nodeName: 'FMA24477', sources: [{ file: 'FJ3387', sha256: '01879d7310938e82eecc02e1115332497e94085ff5cc1fa8eeee47ad1f5d3578' }] },
  { id: 'vm:anatomy:body:thigh:left:muscle:left-sartorius', fmaId: 'FMA22355', laterality: 'left', bundle: 'thigh-muscles', nodeName: 'FMA22355', sources: [{ file: 'FJ1434M', sha256: '4c32d96cf9113542f135a32f8a709505fee10796b9b076cc16c7efe665778bc8' }] },
  { id: 'vm:anatomy:body:thigh:left:muscle:left-gracilis', fmaId: 'FMA43884', laterality: 'left', bundle: 'thigh-muscles', nodeName: 'FMA43884', sources: [{ file: 'FJ1421M', sha256: '1c760938cc531c810758cf5f9fb25ff3a6a0cfd7798d102da95b3269f6741b00' }] },
  { id: 'vm:anatomy:body:thigh:left:muscle:left-semitendinosus', fmaId: 'FMA22359', laterality: 'left', bundle: 'thigh-muscles', nodeName: 'FMA22359', sources: [{ file: 'FJ1436M', sha256: 'e97560023348e6d7aa6d1586862a9717b6ae6ffb72f8ceee8ecf43f3f63c567f' }] },
  { id: 'vm:anatomy:body:leg:left:bone:left-tibia', fmaId: 'FMA24478', laterality: 'left', bundle: 'leg-skeleton', nodeName: 'FMA24478', sources: [{ file: 'FJ3282', sha256: '40e55d7d28f060be61815603ee5eb1c0ba4c2e93af6fed6b5db7ca88d4ed82ef' }] },
] as const;

const limits = ' These source surfaces do not separately segment the pes tendon, bursa, medial collateral ligament, or individual insertions; they do not establish insertion order or tendon continuity, graft planning, or scan registration. This draft needs revision-bound radiologist review before clinical approval.';

export const pesAnserineStudies = [
  {
    id: 'right-pes-anserinus-muscle-convergence',
    title: 'Right pes anserinus: muscle convergence',
    targetFmaIds: ['FMA22354', 'FMA43883', 'FMA22358'],
    contextFmaIds: ['FMA24477'],
    view: 'anterior',
    description: 'Compare right sartorius, gracilis, and semitendinosus with the right tibia. Their distal attachments converge at the proximal medial tibia.',
    inspect: 'Inspect the source surfaces around the medial knee. Select a muscle or tibia to read its source label; Remove one, then Undo to restore it. Extract to separate surfaces for inspection and return separation to 0% to restore source positions.' + limits,
  },
  {
    id: 'left-pes-anserinus-muscle-convergence',
    title: 'Left pes anserinus: muscle convergence',
    targetFmaIds: ['FMA22355', 'FMA43884', 'FMA22359'],
    contextFmaIds: ['FMA24478'],
    view: 'anterior',
    description: 'Compare left sartorius, gracilis, and semitendinosus with the left tibia. Their distal attachments converge at the proximal medial tibia.',
    inspect: 'Inspect the source surfaces around the medial knee. Select a muscle or tibia to read its source label; Remove one, then Undo to restore it. Extract to separate surfaces for inspection and return separation to 0% to restore source positions.' + limits,
  },
] as const;
