import type { AxialStudy } from './axial-anatomy';

// Exact existing source identities. No inferred disc, joint space or nerve is
// added, and a source-labelled level is not a patient-image registration.
export const spinalLevelReferences = [
  'https://anatomy.ttuhscep.edu/anatomytables/joints_back.html',
  'https://www.ncbi.nlm.nih.gov/books/NBK563271/',
];
export const spinalLevelDefinitions = [
  {
    id: 'spine-c1-c2',
    title: 'C1–C2: atlas & axis',
    bones: ['FMA12519', 'FMA12520'],
    disc: null,
    discScope: 'not-an-anatomical-disc-level',
    view: 'posterior',
    description:
      'Keep the atlas and axis only. Rotate above and around the ring of C1 to inspect its relationship to the dens, which remains part of C2.',
    inspect:
      'There is no C1–C2 intervertebral disc. The transverse and alar ligaments are not supplied. Setting the atlas aside exposes bone shape, not joint stability or a safe range of rotation.',
    landmarks: ['^atlas$', '^axis$'],
  },
  {
    id: 'spine-c5-c6',
    title: 'C5–C6: vertebrae & disc',
    bones: ['FMA12523', 'FMA12524'],
    disc: 'FMA13898',
    discScope: 'whole-source-disc',
    view: 'right',
    description:
      'Expose C5, C6 and the supplied whole-disc surface between them. Compare the anterior bodies with the posterior bony elements from the side, then rotate to inspect both sides.',
    inspect:
      'Select the disc and use Fade others, or set a vertebra aside to expose its contour. Annulus and nucleus are not separate meshes; a cutaway does not reveal validated internal disc tissues.',
    landmarks: [
      '^fifth cervical vertebra$',
      '^sixth cervical vertebra$',
      '^intervertebral disk of fifth cervical vertebra$',
    ],
  },
  {
    id: 'spine-c7-t1',
    title: 'C7–T1: cervicothoracic junction',
    bones: ['FMA12525', 'FMA9165'],
    disc: 'FMA13900',
    discScope: 'whole-source-disc',
    view: 'right',
    description:
      'Isolate the last cervical and first thoracic vertebrae with their source disc. The shoulders, ribs and neighbouring levels are set aside for a close view of this transition.',
    inspect:
      'Compare the two source vertebral shapes and the intervening disc. Ribs, joint capsules and exiting spinal nerves are not included; this view does not establish a nerve-root corridor.',
    landmarks: [
      '^seventh cervical vertebra$',
      '^first thoracic vertebra$',
      '^intervertebral disk of seventh cervical vertebra$',
    ],
  },
  {
    id: 'spine-t12-l1',
    title: 'T12–L1: bones only',
    bones: ['FMA10081', 'FMA13072'],
    disc: null,
    discScope: 'source-disc-unresolved',
    view: 'right',
    description:
      'Expose the last thoracic and first lumbar vertebrae. The T12–L1 disc is not supplied in the current admitted subset; no neighbouring disc is substituted.',
    inspect:
      'The empty interval is a source-coverage gap, not normal absence of a disc or evidence of disease. Compare bone shape only; neural structures and ligament layers are not present.',
    landmarks: ['^twelfth thoracic vertebra$', '^first lumbar vertebra$'],
  },
  {
    id: 'spine-l4-l5',
    title: 'L4–L5: vertebrae & disc',
    bones: ['FMA13075', 'FMA13076'],
    disc: 'FMA16036',
    discScope: 'whole-source-disc',
    view: 'right',
    description:
      'Keep L4, L5 and their source disc, without the overlying muscles or the rest of the spine. Rotate posteriorly to compare the bony processes as well as the vertebral bodies.',
    inspect:
      'Select and set aside either vertebra, then Undo to restore it. The facets are portions of the bone meshes, not separate cartilage layers. Spinal nerves and the cauda equina are absent.',
    landmarks: [
      '^fourth lumbar vertebra$',
      '^fifth lumbar vertebra$',
      '^intervertebral disk of fourth lumbar vertebra$',
    ],
  },
  {
    id: 'spine-l5-s1',
    title: 'L5–S1: lumbosacral junction',
    bones: ['FMA13076', 'FMA16202'],
    disc: 'FMA16037',
    discScope: 'whole-source-disc',
    view: 'right',
    description:
      'Inspect L5, its source disc and the sacrum. The entire fused sacrum remains one selectable surface; S1 is not falsely presented as a separate mesh.',
    inspect:
      'Compare the source relationship from the side and behind. Do not measure normal alignment or infer instability from this unvalidated model. No transitional variant, nerve root or sacral canal contents are reconstructed.',
    landmarks: [
      '^fifth lumbar vertebra$',
      '^sacrum$',
      '^intervertebral disk of fifth lumbar vertebra$',
    ],
  },
] as const;

const separationLimit =
  ' Return separation to 0% before comparing positions. Explode is illustrative, not spinal movement. No scan is registered to these views.';
export const spinalLevelStudySets: AxialStudy[] = spinalLevelDefinitions.map(
  (s) => ({
    id: s.id,
    title: s.title,
    regions: ['spine'],
    targetFmaIds: [...s.bones, ...(s.disc ? [s.disc] : [])],
    context: [],
    view: s.view,
    description: s.description,
    inspect: s.inspect + separationLimit,
    landmarks: [...s.landmarks],
  }),
);
