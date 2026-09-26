import type { AxialStudy } from '../lib/axial-anatomy';

export const genicularStudy: AxialStudy = {
  id: 'knee-genicular-arteries',
  title: 'Knee: genicular arteries',
  regions: ['leg', 'whole-body'],
  targetFmaIds: [
    'FMA22562', 'FMA22563', 'FMA22586', 'FMA22587', 'FMA22588',
    'FMA22589', 'FMA43890', 'FMA43891', 'FMA43892', 'FMA43893',
    'FMA77380', 'FMA77381',
  ],
  context: [{ fmaIds: [
    'FMA24474', 'FMA24475', 'FMA24477', 'FMA24478',
    'FMA24480', 'FMA24481', 'FMA24486', 'FMA24487',
    'FMA22591', 'FMA22592',
  ] }],
  view: 'posterior',
  description:
    'Inspect five source-labelled genicular branches per side with the popliteal artery, popliteus and knee bones. Choose Left or Right for one knee; other muscles are set aside.',
  inspect:
    'Select a branch, then use Arterial connections to find its typical popliteal parent. Hide popliteus or a bone to inspect covered surfaces; Undo restores it. Extract selected sets one structure aside. Return separation to 0% for the original source positions. The close-up is camera framing, not a new segmentation: whole bones remain selectable. Each middle genicular group contains two disconnected pieces. This is not a complete anastomotic network, continuous lumen, popliteal-fossa dissection or registered scan; nerves, veins, capsule and ligaments are not included in this view. Clinical review is pending.',
  landmarks: ['genicular artery$', 'popliteal artery$', 'popliteus$', 'patella$'],
};
export const genicularStudyReferences = [
  'https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html',
];
export const genicularStudySourceIds = [
  ...genicularStudy.targetFmaIds,
  ...genicularStudy.context.flatMap((rule) => rule.fmaIds ?? []),
];
