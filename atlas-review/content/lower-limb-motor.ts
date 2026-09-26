// Original teaching relationships, explicitly bound to source records. No nerve geometry.
export const lowerLimbMotorRegions = [
  'pelvis',
  'thigh',
  'leg',
  'foot',
] as const;
export const lowerLimbMotorReferences = {
  muscles: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html',
  nerves: 'https://anatomy.ttuhscep.edu/anatomytables/nerves_lowerlimb.html',
  adductor: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4714133/',
  gemelli: 'https://pubmed.ncbi.nlm.nih.gov/11331970/',
  littleToe:
    'https://www.elsevier.com/resources/anatomy/muscular-system/muscles-of-lower-limb/flexor-digiti-minimi-of-foot/16610',
} as const;
const nerve = (
  label: string,
  note: string,
  references: readonly (keyof typeof lowerLimbMotorReferences)[] = [
    'muscles',
    'nerves',
  ],
) => ({ label, note, references });
export const lowerLimbMotorNerves = {
  femoral: nerve(
    'Femoral nerve',
    'Available hip flexors and knee extensors; psoas major uses direct lumbar branches instead.',
  ),
  obturator: nerve(
    'Obturator nerve',
    'Medial-thigh targets. Adductor magnus is a shared whole source with distinct adductor and hamstring contributions.',
    ['muscles', 'adductor'],
  ),
  sciaticTibial: nerve(
    'Sciatic nerve · tibial division',
    'Thigh branches to the long biceps head and other available hamstrings, with the hamstring part of adductor magnus. Distal leg and plantar branches are separate.',
    ['muscles', 'adductor'],
  ),
  sciaticFibular: nerve(
    'Sciatic nerve · common fibular division',
    'The short biceps femoris head has different supply from the long head. This is not the entire common fibular distribution.',
  ),
  tibialLeg: nerve(
    'Tibial nerve · leg branches',
    'Available posterior-leg muscles. Plantar targets are separate, not automatically added to this study.',
  ),
  deepFibular: nerve(
    'Deep fibular (peroneal) nerve',
    'Anterior-leg targets and the supplied extensor hallucis brevis. Extensor digitorum brevis is not separately supplied by this root catalogue.',
    ['nerves'],
  ),
  superficialFibular: nerve(
    'Superficial fibular (peroneal) nerve',
    'Fibularis longus and brevis. Fibularis tertius belongs to the deep fibular group despite its name.',
    ['nerves'],
  ),
  medialPlantar: nerve(
    'Medial plantar nerve',
    'Available medial plantar targets, including the first foot lumbrical. Flexor hallucis brevis lateral-head innervation can vary.',
  ),
  lateralPlantar: nerve(
    'Lateral plantar nerve',
    'Available plantar targets, including lumbricals two to four. Not a complete deep/superficial branch or sensory map.',
    ['nerves', 'littleToe'],
  ),
  superiorGluteal: nerve(
    'Superior gluteal nerve',
    'Gluteus medius, minimus and tensor fasciae latae where included in the current region. Not the gluteus maximus group.',
    ['nerves'],
  ),
  inferiorGluteal: nerve(
    'Inferior gluteal nerve',
    'Gluteus maximus. This view does not identify a safe injection or surgical corridor.',
    ['nerves'],
  ),
  obturatorInternus: nerve(
    'Nerve to obturator internus',
    'Distinct from the obturator nerve. Gemellar supply varies; this group shows the conventional relationship.',
    ['muscles', 'gemelli'],
  ),
  quadratusFemoris: nerve(
    'Nerve to quadratus femoris',
    'Quadratus femoris and conventional inferior gemellus supply. Reported gemellar variations are not donor-specific findings here.',
    ['muscles', 'gemelli'],
  ),
  piriformis: nerve(
    'Nerve to piriformis',
    'Named sacral branch relationship; no plexus, root or entry-point reconstruction.',
    ['nerves'],
  ),
  lumbarRami: nerve(
    'Lumbar anterior rami · psoas supply',
    'Direct lumbar branches, not femoral supply. This panel does not map individual roots.',
    ['muscles'],
  ),
} as const;
export type LowerLimbMotorKey = keyof typeof lowerLimbMotorNerves;
export type LowerLimbMotorBinding = {
  fmaId: string;
  nerve: LowerLimbMotorKey;
  part?: string;
  caveat?: string;
};
const bind = (
  nerve: LowerLimbMotorKey,
  ids: string,
  extra: Pick<LowerLimbMotorBinding, 'part' | 'caveat'> = {},
): LowerLimbMotorBinding[] =>
  ids.split(' ').map((fmaId) => ({ fmaId, nerve, ...extra }));
export const lowerLimbMotorBindings: readonly LowerLimbMotorBinding[] = [
  ...bind(
    'femoral',
    'FMA22322 FMA22323 FMA22354 FMA22355 FMA38928 FMA38929 FMA38930 FMA38931 FMA38932 FMA38933 FMA38934 FMA38935',
  ),
  ...bind('femoral', 'FMA22450 FMA22451', {
    caveat:
      'Pectineus: usual femoral supply; additional obturator or accessory obturator contributions may occur and are not mapped.',
  }),
  ...bind(
    'obturator',
    'FMA22452 FMA22454 FMA22456 FMA22457 FMA43883 FMA43884 FMA22326 FMA22327',
  ),
  ...bind('obturator', 'FMA43886 FMA43887', {
    caveat:
      'The source labels adductor minimus separately from adductor magnus. This is an upper adductor-component relationship, not proof of a distinct nerve territory or boundary in this donor.',
  }),
  ...bind('obturator', 'FMA22459 FMA22460', {
    part: 'Adductor contribution to adductor magnus',
    caveat:
      'A conventional subdivision; intramuscular branching and overlap are not demonstrated by this surface.',
  }),
  ...bind('sciaticTibial', 'FMA22459 FMA22460', {
    part: 'Hamstring contribution to adductor magnus',
    caveat:
      'Whole source remains visible; do not read the displayed boundary as a separately innervated territory.',
  }),
  ...bind(
    'sciaticTibial',
    'FMA45888 FMA45889 FMA22448 FMA22449 FMA22358 FMA22359',
  ),
  ...bind('sciaticFibular', 'FMA45891 FMA45892'),
  ...bind(
    'tibialLeg',
    'FMA22560 FMA22561 FMA22591 FMA22592 FMA22558 FMA22559 FMA45957 FMA45958 FMA45960 FMA45961 FMA65016 FMA65017 FMA65014 FMA65015 FMA65018 FMA65019',
  ),
  ...bind(
    'deepFibular',
    'FMA22544 FMA22545 FMA22548 FMA22549 FMA22546 FMA22547 FMA22550 FMA22551 FMA51144 FMA51145',
  ),
  ...bind('superficialFibular', 'FMA22554 FMA22555 FMA22552 FMA22553'),
  ...bind(
    'medialPlantar',
    'FMA37459 FMA37460 FMA37461 FMA37462 FMA37717 FMA37718 FMA45971 FMA45972',
  ),
  ...bind('medialPlantar', 'FMA45973 FMA45974', {
    caveat:
      'The lateral flexor hallucis brevis head may receive lateral plantar supply. This default relationship does not establish the branching pattern in this donor.',
  }),
  ...bind(
    'lateralPlantar',
    'FMA37719 FMA37720 FMA37485 FMA37486 FMA37483 FMA37484 FMA37745 FMA37746 FMA37743 FMA37744 FMA37741 FMA37742 FMA37463 FMA37464 FMA37471 FMA37472 FMA37465 FMA37466 FMA46018 FMA46019 FMA46020 FMA46021',
  ),
  ...bind('lateralPlantar', 'FMA86034 FMA86035', {
    caveat:
      'Opponens digiti minimi of the foot is a variable component associated with the short little-toe flexor. The source label is retained; no opposing movement or separate motor branch is simulated.',
  }),
  ...bind(
    'superiorGluteal',
    'FMA22330 FMA22331 FMA22332 FMA22333 FMA22425 FMA22426',
  ),
  ...bind('inferiorGluteal', 'FMA22328 FMA22329'),
  ...bind('obturatorInternus', 'FMA22324 FMA22325'),
  ...bind('obturatorInternus', 'FMA22334 FMA22335', {
    caveat:
      'Superior gemellus may also receive quadratus-femoris-nerve branches. The conventional target list does not exclude additional supply.',
  }),
  ...bind('quadratusFemoris', 'FMA22338 FMA22339'),
  ...bind('quadratusFemoris', 'FMA22336 FMA22337', {
    caveat:
      'Alternative gemellar branching has been reported; this is not a demonstrated donor-specific nerve map.',
  }),
  ...bind('piriformis', 'FMA22340 FMA22341'),
  ...bind('lumbarRami', 'FMA22342 FMA22343'),
];
// These pelvic-floor/perineal records do not become generic lower-limb targets.
export const lowerLimbMotorExcluded = [
  'FMA46443',
  'FMA46444',
  'FMA19728',
] as const;
