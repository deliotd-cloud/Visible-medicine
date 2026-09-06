import type { AxialGroup, AxialStudy } from './axial-anatomy';

const arterialReferences = [
  'https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html',
];
const vesselCaution =
  'Unvalidated source-labelled vessel surfaces, not a verified continuous vascular tree. Branch origins, junctions, calibre, lumen, territories and variants need specialist review. No flow, contrast enhancement or surgical planes are simulated; absent segments are not invented.';
export const pancreaticGroups: AxialGroup[] = [
  {
    id: 'pancreaticoduodenal-arterial-detail',
    name: 'Pancreaticoduodenal arterial segments',
    fmaIds: [
      'FMA14782',
      'FMA14784',
      'FMA14805',
      'FMA70479',
      'FMA70480',
      'FMA76574',
    ],
    anatomy:
      'Superior pancreaticoduodenal branches arise from the gastroduodenal artery; inferior branches connect with the superior mesenteric supply. Anterior and posterior branches participate in arcades around the pancreatic head and duodenum.',
    function:
      'These arteries contribute to the blood supply of the pancreatic head and adjacent duodenum.',
    caution: vesselCaution,
    references: arterialReferences,
  },
  {
    id: 'pancreatic-body-tail-arterial-detail',
    name: 'Pancreatic body and tail arterial segments',
    fmaIds: ['FMA14787', 'FMA14790', 'FMA14792', 'FMA14793'],
    anatomy:
      'The dorsal, inferior, great and caudal pancreatic arterial labels distinguish supplied source segments. Splenic-artery branches contribute to pancreatic supply; origins and branching vary.',
    function:
      'These segments contribute to pancreatic arterial supply. Their names do not establish individual perfusion territories in this model.',
    caution:
      vesselCaution +
      ' A small near-contact between the great and caudal source segments is retained unchanged, not reconstructed as a proven anastomosis.',
    references: arterialReferences,
  },
  {
    id: 'pancreaticoduodenal-venous-detail',
    name: 'Pancreaticoduodenal vein source group',
    fmaIds: ['FMA15398'],
    anatomy:
      'The source groups three separate mesh components under one pancreaticoduodenal-vein identity. Selection retains that grouped identity; the components are not assigned invented branch names.',
    function:
      'Use this group to compare the supplied venous surfaces with neighbouring source structures. The model does not establish a complete drainage pathway.',
    caution: vesselCaution,
    references: ['https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html'],
  },
  {
    id: 'epiglottic-detail',
    name: 'Epiglottis source surface',
    fmaIds: ['FMA55130'],
    anatomy:
      'The epiglottis is a mucosa-covered cartilaginous structure in the superior larynx. A thyroepiglottic ligament connects its cartilage with the thyroid cartilage.',
    function:
      'Compare the static source epiglottis with its laryngeal framework. The atlas does not simulate swallowing, airway closure or tissue mechanics.',
    caution:
      'Unvalidated source epiglottis, not a separately segmented cartilage core or mucosal layer. Shared pharyngeal-subdivision source aliases do not add extra anatomy. Ligament contact and attachment extent need review; the pharyngeal raphe and held middle constrictors remain absent.',
    references: ['https://anatomy.ttuhscep.edu/schemes/larynx_tables.html'],
  },
];
export const pancreaticGroupFor = (fmaId: string) =>
  pancreaticGroups.find((group) => group.fmaIds.includes(fmaId));
export const pancreaticArcadeIds = pancreaticGroups[0].fmaIds;
export const pancreaticBodyTailIds = pancreaticGroups[1].fmaIds;
export const pancreaticVesselIds = pancreaticGroups
  .slice(0, 3)
  .flatMap((g) => g.fmaIds);
export const pancreaticStudySets: AxialStudy[] = [
  {
    id: 'pancreatic-source-window',
    title: 'Pancreas & supplied vessel detail',
    regions: ['abdomen'],
    targetFmaIds: pancreaticVesselIds,
    context: [{ fmaIds: ['FMA7198'] }],
    view: 'anterior',
    description:
      'Keep the pancreas with eleven newly supplied vessel identities in a close study window.',
    inspect:
      'Set the pancreas aside, compare the exposed vessels, then Undo to restore its source position. Explode and tray views are educational translations, not dissection planes or physiological movement.',
    landmarks: [
      '^pancreas$',
      'pancreaticoduodenal vein',
      'dorsal pancreatic artery',
    ],
  },
  {
    id: 'pancreaticoduodenal-arteries',
    title: 'Pancreaticoduodenal arteries exposed',
    regions: ['abdomen'],
    targetFmaIds: pancreaticArcadeIds,
    context: [{ fmaIds: ['FMA14771', 'FMA14749'] }],
    view: 'anterior',
    description:
      'Remove organ surfaces and veins to inspect the supplied superior/inferior arterial branches and gastroduodenal trunk.',
    inspect:
      'Frame an individual branch or compare the target group with the existing hepatic and mesenteric arterial context. These disconnected surfaces do not prove arcade continuity, normal origins or surgical safety.',
    landmarks: [
      'anterior superior pancreaticoduodenal artery',
      'posterior inferior pancreaticoduodenal artery',
      'trunk of gastroduodenal artery',
    ],
  },
  {
    id: 'pancreatic-body-tail-arteries',
    title: 'Pancreatic body & tail vessels',
    regions: ['abdomen'],
    targetFmaIds: pancreaticBodyTailIds,
    context: [{ fmaIds: ['FMA7198', 'FMA14773'] }],
    view: 'posterior',
    description:
      'Compare four source-labelled arterial segments with the pancreas and splenic-artery context.',
    inspect:
      'Hide the pancreas or fade other structures to inspect a small artery. Near-touching source surfaces are not proof of an anastomosis; no branch has been extended or welded to a neighbour.',
    landmarks: [
      'great pancreatic artery',
      'caudal pancreatic artery',
      'splenic artery',
    ],
  },
  {
    id: 'pancreatic-venous-window',
    title: 'Pancreaticoduodenal venous context',
    regions: ['abdomen'],
    targetFmaIds: ['FMA15398'],
    context: [{ fmaIds: ['FMA7198', 'FMA14332', 'FMA50735'] }],
    view: 'anterior',
    description:
      'Inspect the three-component vein group with pancreas, superior mesenteric and hepatic portal-vein context.',
    inspect:
      'Set aside the pancreas for an exposed venous view. One grouped label covers all three source components; individual drainage connections and missing branches remain unvalidated.',
    landmarks: [
      'pancreaticoduodenal vein',
      'superior mesenteric vein',
      'hepatic portal vein',
    ],
  },
  {
    id: 'epiglottis-laryngeal-window',
    title: 'Epiglottis & laryngeal framework',
    regions: ['head-neck'],
    targetFmaIds: ['FMA55130'],
    context: [
      { fmaIds: ['FMA52749', 'FMA55099', 'FMA9615', 'FMA55227', 'FMA55230'] },
    ],
    view: 'left',
    description:
      'A close six-structure window for the epiglottis, hyoid, thyroid/cricoid cartilages and two source ligaments.',
    inspect:
      'Remove one framework surface at a time and use Undo to compare the epiglottis in place. This is static visibility dissection, not a moving or clinically validated airway model.',
    landmarks: [
      '^epiglottis$',
      'hyoid bone',
      'thyroid cartilage',
      'thyro-epiglottic ligament',
    ],
  },
];
