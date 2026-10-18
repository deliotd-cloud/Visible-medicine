// Original, deliberately short teaching notes. These do not validate source surfaces.
const cns =
  'https://openstax.org/books/anatomy-and-physiology-2e/pages/13-2-the-central-nervous-system';
const tracts = 'https://nba.uth.tmc.edu/neuroanatomy/L10/Lab10p18_index.html';
const limbic = 'https://nba.uth.tmc.edu/neuroscience/s4/chapter05.html';
const geniculate =
  'https://nba.uth.tmc.edu/neuroanatomy/L5/Lab05p12_index.html';
export type NeuroGroup = {
  id: string;
  name: string;
  fmaIds: string[];
  color: string;
  anatomy: string;
  function: string | null;
  references: string[];
};
export const neuroGroups: NeuroGroup[] = [
  {
    id: 'caudate',
    name: 'Caudate nuclei',
    fmaIds: ['FMA72826', 'FMA72827'],
    color: '#759ca7',
    anatomy:
      'The caudate follows a curved course alongside the lateral ventricle.',
    function:
      'The caudate and putamen form the dorsal striatum, an input region of basal-ganglia circuits involved in selecting and regulating behaviour and movement.',
    references: [cns],
  },
  {
    id: 'putamen',
    name: 'Putamina',
    fmaIds: ['FMA72828', 'FMA72829'],
    color: '#b98572',
    anatomy:
      'The putamen lies lateral to the globus pallidus. Together they form the lentiform nucleus.',
    function:
      'The putamen participates in basal-ganglia circuits that regulate movement.',
    references: [cns],
  },
  {
    id: 'pallidum',
    name: 'Globi pallidi',
    fmaIds: ['FMA72830', 'FMA72831'],
    color: '#b9a566',
    anatomy:
      'The globus pallidus occupies the medial part of the lentiform nucleus. Internal and external segments are not separated in this source surface.',
    function:
      'Pallidal circuits help regulate motor output. The displayed surface does not distinguish their separate internal and external pathways.',
    references: [cns],
  },
  {
    id: 'thalamus',
    name: 'Thalami',
    fmaIds: ['FMA258714', 'FMA258716'],
    color: '#998ab5',
    anatomy:
      'The thalami flank the third ventricle. Their individual nuclear groups are not delineated by these surfaces.',
    function:
      'Thalamic nuclei process and relay information in sensory, motor and other circuits linking the cortex with deeper structures.',
    references: [cns],
  },
  {
    id: 'amygdala',
    name: 'Amygdalae',
    fmaIds: ['FMA72832', 'FMA72833'],
    color: '#bd7f91',
    anatomy:
      'The amygdala is a nuclear complex in the medial temporal region, anterior to the hippocampus.',
    function:
      'It participates in processing emotional significance; it is not a single-purpose emotion centre.',
    references: [
      'https://nba.uth.tmc.edu/neuroanatomy/L11/Lab11p07_index.html',
    ],
  },
  {
    id: 'lgn',
    name: 'Lateral geniculate bodies',
    fmaIds: ['FMA73303', 'FMA73304'],
    color: '#79a390',
    anatomy:
      'A paired thalamic relay associated with the visual pathway. Its internal layers are not segmented here.',
    function:
      'The lateral geniculate body relays visual information towards the visual cortex.',
    references: [geniculate],
  },
  {
    id: 'mgn',
    name: 'Medial geniculate bodies',
    fmaIds: ['FMA73309', 'FMA73310'],
    color: '#9a9a64',
    anatomy:
      'A paired thalamic relay associated with the auditory pathway. Its subdivisions are not segmented here.',
    function:
      'The medial geniculate body relays auditory information towards the auditory cortex.',
    references: [geniculate],
  },
  {
    id: 'fornix',
    name: 'Fornix surfaces',
    fmaIds: ['FMA72924', 'FMA72925'],
    color: '#d5c6a5',
    anatomy:
      'The fornix arches beneath the corpus callosum and carries connections of the hippocampal formation.',
    function:
      'It links hippocampal circuitry with several targets, including the mammillary bodies. This surface model does not trace individual axons.',
    references: [tracts, limbic],
  },
  {
    id: 'anterior-commissure',
    name: 'Anterior commissure',
    fmaIds: ['FMA61961'],
    color: '#d9bea6',
    anatomy:
      'A compact fibre bundle crossing the midline anterior to the columns of the fornix.',
    function:
      'It provides interhemispheric connections, including between temporal regions.',
    references: [tracts],
  },
  {
    id: 'fornix-commissure',
    name: 'Fornical commissure',
    fmaIds: ['FMA61970'],
    color: '#c6c3a1',
    anatomy:
      'The source-labelled commissure of the fornix is represented separately from the two fornix surfaces.',
    function: null,
    references: [tracts],
  },
  {
    id: 'posterior-commissure',
    name: 'Posterior commissure',
    fmaIds: ['FMA62072'],
    color: '#ccb894',
    anatomy:
      'A separately selectable source-labelled commissural surface; its constituent pathways have not been segmented.',
    function: null,
    references: [],
  },
  {
    id: 'callosum',
    name: 'Corpus callosum',
    fmaIds: ['FMA86464'],
    color: '#dfd4bd',
    anatomy:
      'A major commissural structure joining the cerebral hemispheres, superior to the fornix.',
    function:
      'Callosal fibres support communication between the hemispheres. The model does not divide them by cortical destination.',
    references: [tracts],
  },
  {
    id: 'choroid',
    name: 'Cerebral choroid plexus',
    fmaIds: ['FMA61934'],
    color: '#a96879',
    anatomy:
      'This source concept combines two cerebral choroid-plexus components; it is not a complete ventricular-system segmentation.',
    function:
      'The choroid plexus produces cerebrospinal fluid. Flow, secretion and pressure are not simulated.',
    references: [
      'https://openstax.org/books/anatomy-and-physiology-2e/pages/13-3-circulation-and-the-central-nervous-system',
    ],
  },
  {
    id: 'mammillary',
    name: 'Mammillary bodies',
    fmaIds: ['FMA74877'],
    color: '#bc9172',
    anatomy:
      'The source concept combines the paired mammillary surfaces in the inferior hypothalamic region.',
    function:
      'The mammillary bodies participate in memory-related circuits receiving hippocampal input through the fornix.',
    references: [limbic],
  },
];
export const deepBrainFmaIds = neuroGroups.flatMap((g) => g.fmaIds);
export function neuroGroupFor(fmaId: string): NeuroGroup | undefined {
  return neuroGroups.find((group) => group.fmaIds.includes(fmaId));
}
export const neuroStudySets = [
  {
    id: 'deep-brain',
    title: 'Deep-brain overview',
    groups: neuroGroups.map((g) => g.id),
    view: 'anterior' as const,
    landmarks: ['caudate nucleus', 'thalamus', 'putamen'],
    description:
      'Hide the skull and the existing brain aggregate to expose the supplied deep-brain structures. Colours distinguish study groups, not MRI signal or actual tissue colour.',
    inspect:
      'Compare the paired source surfaces and midline structures. Ghost removed tissues can restore the outer reference context; it may obscure small structures.',
  },
  {
    id: 'basal-nuclei',
    title: 'Basal nuclei & thalami',
    groups: ['caudate', 'putamen', 'pallidum', 'thalamus'],
    view: 'anterior' as const,
    landmarks: ['caudate nucleus', 'putamen', 'globus pallidus'],
    description:
      'Study the supplied caudate, putamen, pallidal and thalamic surfaces without overlying cortex or skull.',
    inspect:
      'Compare putamen and pallidum, then rotate towards the thalami. Internal capsule, individual thalamic nuclei and the complete basal-ganglia circuit are not separately shown.',
  },
  {
    id: 'limbic-detail',
    title: 'Limbic & commissural detail',
    groups: [
      'amygdala',
      'fornix',
      'mammillary',
      'callosum',
      'anterior-commissure',
      'fornix-commissure',
      'posterior-commissure',
    ],
    view: 'left' as const,
    landmarks: ['corpus callosum', '^(right|left) fornix', 'mammillary body'],
    description:
      'Inspect selected limbic and commissural source surfaces with the outer brain hidden.',
    inspect:
      'Compare the callosal arch, fornix and mammillary surfaces. This is a spatial selection, not a complete limbic circuit or a tractography reconstruction.',
  },
  {
    id: 'geniculate-detail',
    title: 'Geniculate bodies & thalami',
    groups: ['lgn', 'mgn', 'thalamus'],
    view: 'posterior' as const,
    landmarks: ['lateral geniculate', 'medial geniculate'],
    description:
      'Compare the paired source-labelled visual and auditory relay bodies with the thalamic surfaces.',
    inspect:
      'Select each body to compare its identity and position. Optic and auditory radiations are not supplied by this view.',
  },
  {
    id: 'choroid-context',
    title: 'Choroid plexus & fornix',
    groups: ['choroid', 'fornix', 'callosum', 'thalamus'],
    view: 'superior' as const,
    landmarks: ['choroid plexus', '^(right|left) fornix', 'corpus callosum'],
    description:
      'Show the paired cerebral choroid-plexus source group with selected nearby reference structures.',
    inspect:
      'The empty spaces are not a validated ventricular lumen. This view does not show cerebrospinal-fluid flow or establish clinical ventricular dimensions.',
  },
];
export function neuroStudyIds(groups: string[]): string[] {
  return neuroGroups
    .filter((g) => groups.includes(g.id))
    .flatMap((g) => g.fmaIds);
}
