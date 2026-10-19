import type { AxialGroup, AxialStudy } from './axial-anatomy';

const references = [
  'https://anatomy.ttuhscep.edu/anatomytables/arteries_thorax.html',
];
const caution =
  'Unvalidated source-labelled surfaces, not a verified continuous vascular tree. Origins, junctions, branch number, calibre, lumen, territories and variants require specialist review. No flow, contrast enhancement, procedural plane or patient registration is simulated.';
export const thoracicGroups: AxialGroup[] = [
  {
    id: 'bronchial-arterial-detail',
    name: 'Bronchial artery source surface',
    fmaIds: ['FMA68109'],
    anatomy:
      'Bronchial arteries belong to the systemic circulation; their origins and number vary. Their supply differs from that of the pulmonary arteries.',
    function:
      'They contribute to the blood supply of the lower trachea and bronchial tree.',
    caution,
    references,
  },
  {
    id: 'bronchial-variant-detail',
    name: 'Variant-labelled bronchial source',
    fmaIds: ['FMA10704'],
    anatomy:
      'The source labels this surface variant bronchial artery. The same component also has a bronchial-branch-of-aortic-arch alias (FMA14177); it is rendered once under the variant identity.',
    function:
      'Compare this source variant with the other supplied bronchial arterial surface and aortic context. Its exact origin, territory and clinical frequency are not established here.',
    caution:
      caution +
      ' This explicitly variant-labelled surface must not be presented as the normal branching pattern.',
    references: ['https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html'],
  },
  {
    id: 'oesophageal-arterial-detail',
    name: 'Oesophageal arterial source surfaces',
    fmaIds: ['FMA4149', 'FMA71537'],
    anatomy:
      'Oesophageal arterial supply includes branches from the thoracic aorta and left gastric artery. The two supplied source identities do not establish every contribution or connection.',
    function:
      'These arteries contribute to oesophageal blood supply. The source set of oesophageal branches remains one grouped selectable identity; individual branch names are not invented.',
    caution,
    references,
  },
];
export const thoracicGroupFor = (fmaId: string) =>
  thoracicGroups.find((group) => group.fmaIds.includes(fmaId));
export const thoracicStudySets: AxialStudy[] = [
  {
    id: 'bronchial-arterial-window',
    title: 'Bronchial arteries & airway',
    regions: ['thorax'],
    targetFmaIds: ['FMA68109', 'FMA10704'],
    context: [
      { fmaIds: ['FMA7394', 'FMA7395', 'FMA7396', 'FMA3768', 'FMA87217'] },
    ],
    view: 'posterior',
    description:
      'Expose two bronchial arterial source identities beside the trachea, main bronchi and aortic context, with lungs and heart removed.',
    inspect:
      'Set the airway aside or fade other structures to inspect a small vessel, then Undo. The variant-labelled artery remains a variant, not a normal-anatomy template. Surface proximity does not prove an attachment or patent connection.',
    landmarks: [
      '^bronchial artery$',
      '^variant bronchial artery$',
      '^trachea$',
    ],
  },
  {
    id: 'oesophageal-arterial-window',
    title: 'Oesophagus & arterial branches',
    regions: ['thorax'],
    targetFmaIds: ['FMA4149', 'FMA71537'],
    context: [{ fmaIds: ['FMA7131', 'FMA87217'] }],
    view: 'posterior',
    description:
      'A four-entry window for the oesophagus, descending thoracic aorta and two oesophageal arterial source identities.',
    inspect:
      'Remove the oesophagus for an exposed arterial comparison and Undo to restore its source position. The grouped branch surface remains one selectable entry; the model does not establish branch continuity or complete supply.',
    landmarks: ['^esophagus$', '^esophageal artery$', 'oesophageal branches'],
  },
  {
    id: 'thoracic-small-arteries-exposed',
    title: 'Thoracic small arteries exposed',
    regions: ['thorax'],
    targetFmaIds: ['FMA4149', 'FMA10704', 'FMA68109', 'FMA71537'],
    context: [{ fmaIds: ['FMA3768', 'FMA87217'] }],
    view: 'posterior',
    description:
      'Compare four supplied bronchial and oesophageal arterial identities with only aortic context; airway and organ surfaces are hidden.',
    inspect:
      'Frame a single target, separate the group or use focus-only identification practice. Explode and arrangement are educational translations, not surgical dissection or physiological motion. Missing vessels are not reconstructed.',
    landmarks: [
      '^variant bronchial artery$',
      '^esophageal artery$',
      '^descending thoracic aorta$',
    ],
  },
];
