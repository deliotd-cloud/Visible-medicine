import type { AxialGroup, AxialStudy } from './axial-anatomy';

const arterialReferences = [
  'https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html',
];
const venousReferences = [
  'https://anatomy.ttuhscep.edu/anatomytables/veins_lowerlimb.html',
];
const caution =
  'Unvalidated source-labelled vessels, not a complete or verified vascular tree. Extent, depth, origin/endpoints, continuity, lumen, calibre, drainage and variants require specialist review. Plantar venous arches are withheld for shape/provenance adjudication. No missing digital branch, plantar nerve, flow, oxygenation, surgical plane or patient registration is simulated.';
export const footVascularGroups: AxialGroup[] = [
  {
    id: 'plantar-arterial-arch-detail',
    name: 'Plantar arterial arch sources',
    fmaIds: ['FMA43943', 'FMA43944'],
    anatomy:
      'The plantar arterial arch continues from the lateral plantar artery and communicates with the deep plantar branch of dorsalis pedis. The source labels these entries simply right and left plantar arch; arterial-trunk aliases refer to the same supplied surfaces.',
    function:
      'The arch contributes to blood supply of the deep foot and toes through its branches. The displayed surface is not a complete or proven patent circuit.',
    caution,
    references: arterialReferences,
  },
  {
    id: 'deep-plantar-arterial-detail',
    name: 'Deep plantar arterial sources',
    fmaIds: ['FMA69514', 'FMA69515'],
    anatomy:
      'The deep plantar artery is a branch of dorsalis pedis that contributes to the plantar arterial arch. Each side is a separate source identity in the common coordinate frame.',
    function:
      'Compare the supplied deep plantar segment with dorsalis pedis and the arch. A close endpoint does not prove an anastomosis or validated lumen.',
    caution,
    references: arterialReferences,
  },
  {
    id: 'superficial-medial-plantar-detail',
    name: 'Superficial medial plantar arterial sources',
    fmaIds: ['FMA43937', 'FMA43938'],
    anatomy:
      'The medial plantar arterial system supplies the medial sole. The source provides a superficial medial plantar branch on each side, retained without inventing additional branch names or a complete digital distribution.',
    function:
      'Inspect the supplied branch beside the existing medial plantar artery and medial-foot landmarks. Detailed territory and depth relationships remain pending review.',
    caution,
    references: arterialReferences,
  },
  {
    id: 'dorsal-foot-venous-detail',
    name: 'Dorsal foot venous arch sources',
    fmaIds: ['FMA44881', 'FMA44882'],
    anatomy:
      'The dorsal venous arch receives dorsal digital/metatarsal drainage and communicates with the great saphenous system medially and small saphenous system laterally. Each supplied arch groups two components under one source identity.',
    function:
      'The arch contributes to superficial drainage of the dorsum of the foot. The displayed subset does not establish complete tributaries, valves or connections to the saphenous veins.',
    caution,
    references: venousReferences,
  },
];
export const footVascularGroupFor = (fmaId: string) =>
  footVascularGroups.find((group) => group.fmaIds.includes(fmaId));
const metatarsals = [
  'FMA24507',
  'FMA24508',
  'FMA24509',
  'FMA24510',
  'FMA24511',
  'FMA24512',
  'FMA24513',
  'FMA24514',
  'FMA24515',
  'FMA24516',
];
const dorsalArteries = ['FMA43916', 'FMA43917'];
const medialArteries = ['FMA43929', 'FMA43930'];
const lateralArteries = ['FMA43931', 'FMA43932'];
export const footVascularStudySets: AxialStudy[] = [
  {
    id: 'plantar-arterial-arch-window',
    title: 'Plantar arch & deep plantar artery',
    regions: ['foot'],
    targetFmaIds: [
      ...footVascularGroups[0].fmaIds,
      ...footVascularGroups[1].fmaIds,
    ],
    context: [
      { fmaIds: [...lateralArteries, ...dorsalArteries, ...metatarsals] },
    ],
    view: 'inferior',
    description:
      'Inspect the supplied plantar arch and deep plantar artery from the sole, with lateral plantar, dorsalis pedis and metatarsal context.',
    inspect:
      'Choose one side, set a metatarsal aside and Undo to restore it. Follow source surfaces without assuming a complete arch, patent endpoint connection or safe surgical plane.',
    landmarks: ['plantar arch', 'deep plantar artery', 'metatarsal bone'],
  },
  {
    id: 'medial-plantar-branch-window',
    title: 'Medial plantar arterial branch',
    regions: ['foot'],
    targetFmaIds: footVascularGroups[2].fmaIds,
    context: [
      {
        fmaIds: [
          ...medialArteries,
          'FMA37459',
          'FMA37460',
          'FMA24507',
          'FMA24508',
        ],
      },
    ],
    view: 'inferior',
    description:
      'Compare the superficial medial plantar arterial sources with the medial plantar arteries, abductor hallucis and first metatarsals.',
    inspect:
      'Remove or fade the muscle to inspect the fine branch, then restore it. Its source name does not establish a validated depth or dissection plane. Plantar nerves are not present.',
    landmarks: [
      'superficial medial plantar artery',
      'abductor hallucis',
      'first metatarsal bone',
    ],
  },
  {
    id: 'dorsal-foot-veins-window',
    title: 'Dorsal foot venous arches',
    regions: ['foot'],
    targetFmaIds: footVascularGroups[3].fmaIds,
    context: [{ fmaIds: [...metatarsals, ...dorsalArteries] }],
    view: 'superior',
    description:
      'Look down onto the dorsal venous arch sources with metatarsals and dorsalis pedis as context.',
    inspect:
      'Select and frame an arch or set a bone aside. The two components of each source remain grouped; absent tributaries and saphenous connections are not bridged. Focus-only practice excludes the context.',
    landmarks: [
      'dorsal venous arch',
      'dorsalis pedis artery',
      'metatarsal bone',
    ],
  },
  {
    id: 'foot-vessels-exposed',
    title: 'Foot arteries & dorsal veins exposed',
    regions: ['foot'],
    targetFmaIds: footVascularGroups.flatMap((group) => group.fmaIds),
    context: [
      { fmaIds: [...medialArteries, ...lateralArteries, ...dorsalArteries] },
    ],
    view: 'inferior',
    description:
      'Compare eight new vessel identities with the six existing local foot arterial entries, without bones or muscles.',
    inspect:
      'Rotate between the sole and dorsum, isolate an entry, or use reversible separation for source-name practice. Red and blue identify arteries and veins, not oxygenation. The uncertain plantar venous arch sources remain withheld.',
    landmarks: ['plantar arch', 'dorsal venous arch', 'medial plantar artery'],
  },
];
