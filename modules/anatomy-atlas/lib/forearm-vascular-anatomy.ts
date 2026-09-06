import type { AxialGroup, AxialStudy } from './axial-anatomy';
const references = ['https://anatomy.ttuhscep.edu/schemes/forearm_tables.html'];
const common = ['FMA22807', 'FMA22808'];
const recurrent = ['FMA268667', 'FMA268669'];
const anterior = ['FMA22812', 'FMA22813'];
const ulnar = ['FMA22797', 'FMA22798'];
const radial = ['FMA22733', 'FMA22734'];
const bones = ['FMA23464', 'FMA23465', 'FMA23467', 'FMA23468'];
const membrane = ['FMA23707', 'FMA23708'];
const caution =
  'Unvalidated source subset. IS-A components retain their exact source names; PART-OF aggregates can include additional branches and are not interchangeable. The posterior interosseous trunk and complete elbow arterial connections are not independently supplied here. Source proximity does not prove lumen continuity, branching, perfusion, surgical planes or patient registration.';
export const forearmVascularGroups: AxialGroup[] = [
  {
    id: 'common-interosseous-detail',
    name: 'Common interosseous arteries',
    fmaIds: common,
    anatomy:
      'The common interosseous artery arises from the ulnar artery and divides into anterior and posterior interosseous branches. Here the small source-labelled common segment is separately selectable; the full branching tree is not reconstructed.',
    function:
      'Contributes to the blood supply of deep forearm structures through its branches. This static surface has no validated lumen or simulated flow.',
    caution,
    references,
  },
  {
    id: 'recurrent-interosseous-detail',
    name: 'Recurrent interosseous arteries',
    fmaIds: recurrent,
    anatomy:
      'The interosseous recurrent artery is a branch of the posterior interosseous artery. Study the supplied recurrent segment near the proximal forearm without treating it as the absent complete posterior interosseous trunk.',
    function:
      'Contributes to arterial supply around the proximal posterior forearm, including the supinator region. Connections and territories are not validated by the source mesh.',
    caution,
    references,
  },
];
export const forearmVascularGroupFor = (fmaId: string) =>
  forearmVascularGroups.find((g) => g.fmaIds.includes(fmaId));
export const forearmVascularStudySets: AxialStudy[] = [
  {
    id: 'common-interosseous-window',
    title: 'Common interosseous origins',
    regions: ['forearm'],
    targetFmaIds: common,
    context: [{ fmaIds: [...ulnar, ...anterior, ...bones, ...membrane] }],
    view: 'anterior',
    description:
      'Inspect the short common-interosseous source segments with ulnar/anterior-interosseous arteries and a radius–ulna framework.',
    inspect:
      'Choose one side, select and frame the common segment, then set the membrane or ulnar artery aside. Restore or Undo to compare the original source positions. Do not infer a continuous vascular lumen or an absent posterior branch.',
    landmarks: [
      'common interosseous artery',
      'ulnar artery',
      'anterior interosseous artery',
    ],
  },
  {
    id: 'recurrent-interosseous-window',
    title: 'Recurrent arteries & supinator',
    regions: ['forearm'],
    targetFmaIds: recurrent,
    context: [
      {
        fmaIds: [
          ...common,
          ...bones,
          'FMA23130',
          'FMA23131',
          'FMA38513',
          'FMA38514',
        ],
      },
    ],
    view: 'posterior',
    description:
      'Expose the recurrent-interosseous source segments beside the supplied supinator and elbow framework.',
    inspect:
      'Set the supinator aside, frame a recurrent artery and compare anterior/posterior views. Separation helps inspection but is not a surgical dissection plane. The complete posterior interosseous artery and elbow network are absent.',
    landmarks: ['recurrent interosseous artery', 'supinator'],
  },
  {
    id: 'forearm-arterial-comparison',
    title: 'Forearm arterial comparison',
    regions: ['forearm'],
    targetFmaIds: [...common, ...recurrent, ...anterior, ...ulnar, ...radial],
    context: [{ fmaIds: [...bones, ...membrane] }],
    view: 'anterior',
    description:
      'Compare the five supplied paired arterial identities with the interosseous membrane and forearm bones.',
    inspect:
      'Use a single side, isolate or frame a vessel, and practise only the arterial targets. Keep the membrane as a spatial reference or remove it reversibly. This is a selected source comparison, not a complete vascular tree.',
    landmarks: ['radial artery', 'ulnar artery', 'interosseous artery'],
  },
];
