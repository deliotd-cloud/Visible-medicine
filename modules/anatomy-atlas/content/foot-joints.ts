/** Original teaching map; anatomical relationships, not measured donor contacts. */
export const footBoneFmas = {
  tibia: ['FMA24477', 'FMA24478'],
  fibula: ['FMA24480', 'FMA24481'],
  talus: ['FMA24482', 'FMA24483'],
  calcaneus: ['FMA24497', 'FMA24498'],
  navicular: ['FMA24500', 'FMA24501'],
  c1: ['FMA24521', 'FMA24522'],
  c2: ['FMA24523', 'FMA24524'],
  c3: ['FMA24525', 'FMA24526'],
  cuboid: ['FMA24528', 'FMA24529'],
  m1: ['FMA24507', 'FMA24508'],
  m2: ['FMA24509', 'FMA24510'],
  m3: ['FMA24511', 'FMA24512'],
  m4: ['FMA24513', 'FMA24514'],
  m5: ['FMA24515', 'FMA24516'],
  p1: ['FMA43253', 'FMA43254'],
  p2: ['FMA32634', 'FMA32635'],
  p3: ['FMA32636', 'FMA32637'],
  p4: ['FMA32638', 'FMA32639'],
  p5: ['FMA32640', 'FMA32641'],
  i2: ['FMA32642', 'FMA32643'],
  i3: ['FMA32644', 'FMA32645'],
  i4: ['FMA32646', 'FMA32647'],
  i5: ['FMA230986', 'FMA230988'],
  d1: ['FMA32650', 'FMA32651'],
  d2: ['FMA32652', 'FMA32653'],
  d3: ['FMA32654', 'FMA32655'],
  d4: ['FMA32656', 'FMA32657'],
  d5: ['FMA32658', 'FMA32659'],
} as const;
export type FootBone = keyof typeof footBoneFmas;
export const footJointReferences = {
  overview: {
    title: 'OpenStax · Lower-limb bones',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/8-4-bones-of-the-lower-limb',
  },
  bones: {
    title: 'TTUHSC El Paso · Lower-limb bones',
    url: 'https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html',
  },
  joints: {
    title: 'TTUHSC El Paso · Joints and ligaments',
    url: 'https://anatomy.ttuhscep.edu/anatomytables/joints_lowerlimb.html',
  },
  forefoot: {
    title: 'Samojla · Normal anatomy of the forefoot',
    url: 'https://www-s3-live.kent.edu/s3fs-root/s3fs-public/HV-ch-02-Normal-Anatomy-of-the-Forefoot.pdf',
  },
  variant: {
    title: 'Rajaram et al. · Navicular morphology (2024)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37968490/',
  },
} as const;
export type FootJoint = {
  a: FootBone;
  b: FootBone;
  label: string;
  kind: 'synovial' | 'syndesmosis' | 'variable';
  reference: keyof typeof footJointReferences;
};
const joint = (
  a: FootBone,
  b: FootBone,
  label: string,
  reference: FootJoint['reference'],
  kind: FootJoint['kind'] = 'synovial',
): FootJoint => ({ a, b, label, reference, kind });
export const footJoints: readonly FootJoint[] = [
  joint('tibia', 'talus', 'Ankle · tibiotalar', 'joints'),
  joint('fibula', 'talus', 'Ankle · talofibular', 'joints'),
  joint(
    'tibia',
    'fibula',
    'Distal tibiofibular syndesmosis',
    'joints',
    'syndesmosis',
  ),
  joint('talus', 'calcaneus', 'Talocalcaneal', 'bones'),
  joint('talus', 'navicular', 'Talonavicular', 'bones'),
  joint('calcaneus', 'cuboid', 'Calcaneocuboid', 'bones'),
  ...(['c1', 'c2', 'c3'] as const).map((c) =>
    joint('navicular', c, 'Naviculocuneiform', 'bones'),
  ),
  joint('c1', 'c2', 'Intercuneiform', 'forefoot'),
  joint('c2', 'c3', 'Intercuneiform', 'forefoot'),
  joint('c3', 'cuboid', 'Cuneocuboid', 'overview'),
  joint('c1', 'm1', 'Tarsometatarsal · first ray', 'forefoot'),
  joint(
    'c1',
    'm2',
    'Tarsometatarsal · medial facet of second base',
    'forefoot',
  ),
  joint('c2', 'm2', 'Tarsometatarsal · second ray', 'forefoot'),
  joint(
    'c3',
    'm2',
    'Tarsometatarsal · lateral facet of second base',
    'forefoot',
  ),
  joint('c3', 'm3', 'Tarsometatarsal · third ray', 'forefoot'),
  joint(
    'c3',
    'm4',
    'Tarsometatarsal · medial facet of fourth base',
    'forefoot',
  ),
  joint('cuboid', 'm4', 'Tarsometatarsal · fourth ray', 'forefoot'),
  joint('cuboid', 'm5', 'Tarsometatarsal · fifth ray', 'forefoot'),
  joint('m2', 'm3', 'Intermetatarsal bases', 'forefoot'),
  joint('m3', 'm4', 'Intermetatarsal bases', 'forefoot'),
  joint('m4', 'm5', 'Intermetatarsal bases', 'forefoot'),
  ...([1, 2, 3, 4, 5] as const).map((n) =>
    joint(`m${n}`, `p${n}`, `Metatarsophalangeal · toe ${n}`, 'bones'),
  ),
  joint('p1', 'd1', 'Hallux interphalangeal', 'bones'),
  ...([2, 3, 4, 5] as const).flatMap((n) => [
    joint(`p${n}`, `i${n}`, `Proximal interphalangeal · toe ${n}`, 'joints'),
    joint(`i${n}`, `d${n}`, `Distal interphalangeal · toe ${n}`, 'joints'),
  ]),
  joint(
    'navicular',
    'cuboid',
    'Naviculocuboid facet · variable',
    'variant',
    'variable',
  ),
  joint(
    'm1',
    'm2',
    'First–second metatarsal facet · variable',
    'forefoot',
    'variable',
  ),
];
