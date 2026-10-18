import type { AxialGroup, AxialStudy } from './axial-anatomy';
import { handVascularGroups } from './hand-vascular-anatomy.ts';

const references = [
  'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html',
  'https://anatomy.ttuhscep.edu/anatomytables/veins_upperlimb.html',
];
const caution =
  'Unvalidated source-labelled venous surfaces, not a verified drainage network. Grouped extent, tributaries, depth, connections, valves and lumen require specialist review. The little-finger groups are withheld for source-extent review; thumb-specific and common digital venous detail is not supplied here. No flow, oxygenation, safe surgical plane or patient registration is simulated.';
export const handVenousGroups: AxialGroup[] = [
  {
    id: 'palmar-venous-arch-detail',
    name: 'Palmar venous arch sources',
    fmaIds: ['FMA22912', 'FMA22913', 'FMA22915', 'FMA22916'],
    anatomy:
      'The source provides separately labelled deep and superficial palmar venous arches for each hand. Their names and common coordinates are retained without asserting verified depth or complete arch continuity.',
    function:
      'Compare the supplied venous arch surfaces with the arterial arches. These shapes do not establish the direction or completeness of venous drainage.',
    caution,
    references,
  },
  {
    id: 'dorsal-hand-venous-detail',
    name: 'Dorsal hand venous networks',
    fmaIds: ['FMA62506', 'FMA62507'],
    anatomy:
      'The dorsal hand venous network contributes to superficial venous drainage. The source supplies one selectable network identity per hand, rather than individually named tributaries.',
    function:
      'Superficial dorsal drainage communicates with the cephalic and basilic venous systems. The displayed subset does not establish those complete connections or patient-specific branching.',
    caution,
    references,
  },
  {
    id: 'palmar-metacarpal-venous-detail',
    name: 'Palmar metacarpal vein sources',
    fmaIds: ['FMA22920', 'FMA22921'],
    anatomy:
      'Each source-labelled palmar metacarpal vein groups three supplied components. The components span the palm and remain one identity, with no independently numbered tributaries invented.',
    function:
      'Use the venous comparison views to inspect the supplied palmar surfaces. Their detailed drainage territory and connections await clinical authorship and review.',
    caution,
    references,
  },
  {
    id: 'proper-digital-venous-detail',
    name: 'Index, middle & ring digital vein sources',
    fmaIds: [
      'FMA85096',
      'FMA85097',
      'FMA85098',
      'FMA85099',
      'FMA85100',
      'FMA85101',
    ],
    anatomy:
      'Paired source identities represent proper palmar digital veins of the index, middle and ring fingers. Each identity contains two supplied mesh components; the source does not give them separate side-of-finger names here.',
    function:
      'Compare the available finger-vein segments with the palmar sources. Missing finger segments, tributaries and drainage connections are not reconstructed.',
    caution,
    references,
  },
];
export const handVenousGroupFor = (fmaId: string) =>
  handVenousGroups.find((group) => group.fmaIds.includes(fmaId));
const arches = handVenousGroups[0].fmaIds;
const deepArteries = ['FMA22839', 'FMA22840'];
const metacarpals = [
  'FMA24464',
  'FMA24465',
  'FMA24466',
  'FMA24467',
  'FMA24468',
  'FMA24469',
  'FMA24470',
  'FMA24471',
  'FMA24472',
  'FMA24473',
];
export const handVenousStudySets: AxialStudy[] = [
  {
    id: 'palmar-venous-arches-window',
    title: 'Palmar venous & arterial arches',
    regions: ['hand'],
    targetFmaIds: arches,
    context: [
      {
        fmaIds: [
          ...deepArteries,
          ...handVascularGroups[0].fmaIds,
          'FMA40120',
          'FMA40121',
        ],
      },
    ],
    view: 'anterior',
    description:
      'Compare the four supplied palmar venous arch sources with arterial arches and wrist flexor retinacula.',
    inspect:
      'Switch to one hand, remove a retinaculum and Undo to restore it. Blue and red identify veins and arteries, not depth, oxygenation or proven continuity. Source depth relationships require review.',
    landmarks: [
      'palmar venous arch',
      'palmar arterial arch',
      'deep palmar arch',
    ],
  },
  {
    id: 'dorsal-hand-veins-window',
    title: 'Dorsal hand venous networks',
    regions: ['hand'],
    targetFmaIds: handVenousGroups[1].fmaIds,
    context: [{ fmaIds: metacarpals }],
    view: 'posterior',
    description:
      'View the source-labelled dorsal venous networks against the metacarpal bones, without overlying muscle surfaces.',
    inspect:
      'Select and frame one network; set a bone aside or fade context. Each network remains one source identity, not a complete map of independently dissectible veins. Focus-only practice excludes the bones.',
    landmarks: ['dorsal venous network', 'metacarpal bone'],
  },
  {
    id: 'palmar-digital-veins-window',
    title: 'Palmar & finger vein segments',
    regions: ['hand'],
    targetFmaIds: [
      ...handVenousGroups[2].fmaIds,
      ...handVenousGroups[3].fmaIds,
    ],
    context: [{ fmaIds: arches }],
    view: 'anterior',
    description:
      'Expose the supplied metacarpal and index, middle and ring digital vein groups with venous arch context.',
    inspect:
      'Use a single-side view to select small segments, or separate them for source-name practice. Little-finger groups are withheld for extent review; no missing thumb, common digital vein or nerve surface is fabricated.',
    landmarks: [
      'palmar metacarpal vein',
      'proper palmar digital vein',
      'palmar venous arch',
    ],
  },
  {
    id: 'hand-arteries-veins-exposed',
    title: 'Hand arteries & veins exposed',
    regions: ['hand'],
    targetFmaIds: handVenousGroups.flatMap((group) => group.fmaIds),
    context: [
      {
        fmaIds: [
          ...handVascularGroups.flatMap((group) => group.fmaIds),
          ...deepArteries,
        ],
      },
    ],
    view: 'anterior',
    description:
      'Compare fourteen venous source identities with the twenty-eight supplied hand arterial entries, without bones or muscles.',
    inspect:
      'Select an artery or vein, isolate it, fade the others or use reversible separation. Red means artery and blue means vein, not oxygenation. Focus-only practice asks about the venous targets; absent connections are not bridged.',
    landmarks: [
      'palmar venous arch',
      'dorsal venous network',
      'proper palmar digital artery',
    ],
  },
];
