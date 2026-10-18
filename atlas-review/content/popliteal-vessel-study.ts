import type { AxialStudy } from '../lib/axial-anatomy';
import pins from './popliteal-vessel-study-pins.json' with { type: 'json' };

export const poplitealVesselStudy: AxialStudy = {
  id: 'knee-popliteal-vessel-pair',
  title: 'Knee: popliteal artery and vein',
  regions: ['leg', 'whole-body'],
  targetFmaIds: ['FMA77380', 'FMA77381', 'FMA44328', 'FMA44329'],
  context: [{ fmaIds: [
    'FMA24474', 'FMA24475', 'FMA24477', 'FMA24478',
    'FMA24480', 'FMA24481', 'FMA24486', 'FMA24487',
    'FMA22591', 'FMA22592',
  ] }],
  view: 'posterior',
  description:
    'Compare the supplied popliteal artery and vein surfaces behind each knee with popliteus and whole knee bones. Choose Left or Right to inspect one side.',
  inspect:
    'Rotate to compare the same-side artery and vein surfaces; their displayed order may change with the view. Hide popliteus or a bone to inspect covered surfaces, then Undo. Extract selected separates a whole source surface; return separation to 0% before judging source positions. This is not a fixed vessel order, a compression or patency test, flow study, complete popliteal-fossa dissection, nerve or fascia map, or patient registration. Source boundaries and relationships await revision-bound radiologist review.',
  landmarks: ['popliteal artery$', 'popliteal vein$', 'popliteus$', 'patella$'],
};

export const poplitealVesselReferences = [
  'https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html',
  'https://anatomy.ttuhscep.edu/anatomytables/veins_lowerlimb.html',
];

export const poplitealVesselSourceIds = [
  ...poplitealVesselStudy.targetFmaIds,
  ...poplitealVesselStudy.context.flatMap((rule) => rule.fmaIds ?? []),
];

export const poplitealVesselBindings = pins.entries.map((entry) => ({
  id: entry.id, fmaId: entry.fmaId, laterality: entry.laterality,
  bundle: entry.bundle, nodeName: entry.nodeName, sources: entry.sources,
}));
