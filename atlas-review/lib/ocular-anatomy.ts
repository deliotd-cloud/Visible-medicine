import type { AxialGroup, AxialStudy } from './axial-anatomy';

// Original short factual teaching notes; no imported prose, diagrams or table dataset.
const references = ['https://anatomy.ttuhscep.edu/schemes/eye_ans.html'];
const caution =
  'Unvalidated source-labelled surfaces, not a complete eyelid or tear-drainage apparatus. Puncta, canalicular subdivisions, valves, gland ducts, internal lumen, tarsal glands, attachment footprints and functional flow are not established. Specialist review of identity, size, position and relationships is required. Separation is a reversible teaching aid, not a surgical plane.';
export const ocularGroups: AxialGroup[] = [
  {
    id: 'lacrimal-canalicular-detail',
    name: 'Lacrimal canalicular sources',
    fmaIds: ['FMA59582', 'FMA59583'],
    anatomy:
      'Lacrimal canaliculi convey tears from the medial eyelid puncta towards the lacrimal sac. The dataset supplies one canaliculus-labelled identity per side; separate upper, lower and common portions are not inferred.',
    function:
      'Part of the tear-drainage pathway. The supplied surface does not demonstrate a patent channel or a working lacrimal pump.',
    caution,
    references,
  },
  {
    id: 'lacrimal-sac-detail',
    name: 'Lacrimal sac sources',
    fmaIds: ['FMA59545', 'FMA59546'],
    anatomy:
      'The lacrimal sac lies beside the medial orbital wall, receiving the canaliculi and continuing into the nasolacrimal duct.',
    function:
      'A component of tear drainage towards the nose. No filling, pressure or flow is simulated.',
    caution,
    references,
  },
  {
    id: 'nasolacrimal-duct-detail',
    name: 'Nasolacrimal duct sources',
    fmaIds: ['FMA59555', 'FMA59556'],
    anatomy:
      'The nasolacrimal duct descends from the lacrimal sac towards the inferior nasal meatus, beneath the inferior nasal concha.',
    function:
      'Carries tears towards the nasal cavity. The display does not verify an open lumen, distal opening or valves.',
    caution,
    references,
  },
  {
    id: 'eyelid-tarsal-detail',
    name: 'Eyelid tarsal plate sources',
    fmaIds: ['FMA59091', 'FMA59092', 'FMA59089', 'FMA59090'],
    anatomy:
      'The upper and lower eyelids contain dense fibrous tarsal plates. These are connective tissue, not cartilage or foot tarsal bones.',
    function:
      'Help support eyelid shape. Tarsal glands and the complete eyelid attachment system are not separately represented by these plates.',
    caution,
    references,
  },
];
export const ocularGroupFor = (fmaId: string) =>
  ocularGroups.find((group) => group.fmaIds.includes(fmaId));
const eyes = ['FMA12514', 'FMA12515'];
const glands = ['FMA59102', 'FMA59103'];
export const ocularStudySets: AxialStudy[] = [
  {
    id: 'eyelid-tarsal-window',
    title: 'Eyelid tarsal plates',
    regions: ['head-neck'],
    targetFmaIds: ocularGroups[3].fmaIds,
    context: [{ fmaIds: [...eyes, 'FMA49048', 'FMA49049'] }],
    view: 'anterior',
    description:
      'Explore the upper and lower tarsal plates with the eyes and levator palpebrae superioris as context.',
    inspect:
      'Choose a side, select a plate and frame it. Set the eye aside and Undo to restore the relationship. The source eye remains grouped; absent eyelid layers and attachment footprints are not fabricated.',
    landmarks: [
      'tarsal plate.*upper',
      'tarsal plate.*lower',
      'levator palpebrae',
    ],
  },
  {
    id: 'lacrimal-drainage-window',
    title: 'Tear-drainage source structures',
    regions: ['head-neck'],
    targetFmaIds: ocularGroups.slice(0, 3).flatMap((group) => group.fmaIds),
    context: [{ fmaIds: [...eyes, ...glands] }],
    view: 'anterior',
    description:
      'Compare the canaliculus, lacrimal sac and nasolacrimal duct sources with eye and lacrimal-gland context.',
    inspect:
      'Select each fine structure, isolate or frame it, then restore the context. Adjacent source surfaces do not prove connected channels. Focus-only practice excludes the contextual eyes and glands.',
    landmarks: ['lacrimal canaliculus', 'lacrimal sac', 'nasolacrimal duct'],
  },
  {
    id: 'nasolacrimal-bone-window',
    title: 'Nasolacrimal duct & nasal context',
    regions: ['head-neck'],
    targetFmaIds: ocularGroups[2].fmaIds,
    context: [
      {
        fmaIds: [
          ...ocularGroups[1].fmaIds,
          'FMA53645',
          'FMA53646',
          'FMA54737',
          'FMA54738',
        ],
      },
    ],
    view: 'anterior',
    description:
      'Inspect each nasolacrimal duct with its sac, lacrimal bone and inferior nasal concha.',
    inspect:
      'Set a bone aside to inspect the supplied duct and Undo to recover its original position. This bounded context does not represent the entire bony canal, nasal wall or a verified distal opening.',
    landmarks: ['nasolacrimal duct', 'lacrimal bone', 'inferior nasal concha'],
  },
];
