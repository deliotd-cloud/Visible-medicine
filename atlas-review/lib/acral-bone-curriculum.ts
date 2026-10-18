import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

type Pair = readonly [string, string]; // Exact right, left FMA identities.
type Region = 'hand' | 'foot';
type Digit = 1 | 2 | 3 | 4 | 5;
type Segment = 'proximal' | 'middle' | 'distal';
interface AcralBoneLesson {
  fmaIds: Pair;
  region: Region;
  anatomy: string;
  function: string;
  distinction: string;
  references: readonly string[];
  digit?: Digit;
  segment?: Segment;
}
const books = 'https://www.ncbi.nlm.nih.gov/books/';
const carpal = books + 'NBK535382/';
const hand = books + 'NBK547684/';
const foot = books + 'NBK546698/';
const metatarsal = books + 'NBK549872/';
const jointLimit =
  'Named facets and attachment sites are context, not independently validated segmentations. Cartilage, ligaments, tendon paths and joint contact remain unvalidated.';
function bone(
  fmaIds: Pair,
  region: Region,
  anatomy: string,
  role: string,
  reference: string,
  distinction = jointLimit,
): AcralBoneLesson {
  return {
    fmaIds,
    region,
    anatomy,
    function: role,
    distinction,
    references: [reference],
  };
}

// Compact original teaching, not imported textbook prose or anatomy assets.
const carpalAndTarsal: AcralBoneLesson[] = [
  bone(
    ['FMA24435', 'FMA24436'],
    'hand',
    'The scaphoid occupies the radial proximal carpal row and spans connections to the distal row.',
    'Helps couple movement between the carpal rows.',
    carpal,
  ),
  bone(
    ['FMA24437', 'FMA24438'],
    'hand',
    'The lunate lies centrally in the proximal row between scaphoid and triquetrum.',
    'Participates in the mobile proximal carpal linkage.',
    carpal,
  ),
  bone(
    ['FMA24439', 'FMA24440'],
    'hand',
    'The triquetrum is ulnar in the proximal row; its palmar surface meets the pisiform.',
    'Contributes to the ulnar wrist articulation network.',
    carpal,
  ),
  bone(
    ['FMA24441', 'FMA24442'],
    'hand',
    'The pisiform sits palmar to the triquetrum within the flexor carpi ulnaris tendon.',
    'Links flexor carpi ulnaris to its distal ligamentous attachments.',
    books + 'NBK526051/',
    'A sesamoid carpal bone, not an extra phalanx. The pisotriquetral joint and adjacent ulnar neurovascular clearance require review.',
  ),
  bone(
    ['FMA24443', 'FMA24444'],
    'hand',
    'The trapezium lies at the radial distal row and meets the first metacarpal at a saddle-shaped joint.',
    'Provides the mobile bony base for thumb opposition.',
    carpal,
  ),
  bone(
    ['FMA23725', 'FMA24445'],
    'hand',
    'The trapezoid lies between trapezium and capitate, proximal to the second metacarpal.',
    'Supports the index-ray base within the distal carpal row.',
    hand,
  ),
  bone(
    ['FMA24446', 'FMA24447'],
    'hand',
    'The capitate occupies the central distal carpus, aligned with the third metacarpal.',
    'Links the central hand column to surrounding carpal articulations.',
    carpal,
  ),
  bone(
    ['FMA24448', 'FMA24449'],
    'hand',
    'The hamate is the ulnar distal-row carpal, with a palmar hook and distal fourth/fifth metacarpal connections.',
    'Supports the ulnar hand columns and ligament attachments.',
    hand,
    'The hook is not separately validated or detachable. Its outline does not establish a safe Guyon canal clearance or tendon corridor.',
  ),
  bone(
    ['FMA24482', 'FMA24483'],
    'foot',
    'The talar body sits in the ankle mortise; its head meets the navicular and its inferior facets meet the calcaneus.',
    'Transfers load from leg to foot without direct muscular attachment.',
    books + 'NBK541086/',
    'Ankle and subtalar motion are distinct. Facet variation, cartilage, blood supply and joint axes cannot be inferred from explode offsets.',
  ),
  bone(
    ['FMA24497', 'FMA24498'],
    'foot',
    'The calcaneus forms the heel, articulating with the talus above and cuboid anteriorly.',
    'Provides a rearfoot support platform and lever for muscle-generated forces.',
    books + 'NBK536941/',
  ),
  bone(
    ['FMA24500', 'FMA24501'],
    'foot',
    'The navicular lies between the talar head and the three cuneiforms in the medial midfoot.',
    'Links hindfoot to medial midfoot within the longitudinal arch.',
    foot,
  ),
  bone(
    ['FMA24528', 'FMA24529'],
    'foot',
    'The cuboid links the calcaneus to the fourth and fifth metatarsal bases on the lateral side.',
    'Contributes to the lateral column and midfoot support.',
    foot,
  ),
  bone(
    ['FMA24521', 'FMA24522'],
    'foot',
    'The medial cuneiform is the medial member of the cuneiform trio, principally aligned with the first metatarsal.',
    'Supports the medial tarsometatarsal column.',
    metatarsal,
  ),
  bone(
    ['FMA24523', 'FMA24524'],
    'foot',
    'The intermediate cuneiform lies between its neighbours and meets the recessed second metatarsal base.',
    'Contributes to the interlocking central midfoot architecture.',
    foot,
  ),
  bone(
    ['FMA24525', 'FMA24526'],
    'foot',
    'The lateral cuneiform lies beside the cuboid and principally aligns with the third metatarsal.',
    'Links the central forefoot to the tarsal framework.',
    metatarsal,
  ),
];

const digitNames = {
  hand: [
    'thumb',
    'index finger',
    'middle finger',
    'ring finger',
    'little finger',
  ],
  foot: ['great toe', 'second toe', 'third toe', 'fourth toe', 'little toe'],
} as const;
function metacarpalLesson(
  ids: Pair,
  digit: Digit,
  proximal: string,
): AcralBoneLesson {
  const name = digitNames.hand[digit - 1];
  return {
    ...bone(
      ids,
      'hand',
      `Metacarpal ${digit} supports the ${name}. Its base articulates with ${proximal}; its head meets that digit's proximal phalanx at the MCP joint.`,
      digit === 1
        ? 'Provides the thumb ray lever for opposition and pinch through its mobile carpometacarpal base.'
        : `Supports the ${name} ray and transfers forces between its MCP joint and the carpus.`,
      hand,
      digit === 1
        ? 'Thumb CMC motion is not the same as MCP or IP motion. Opposition requires muscle and joint coordination; it is not simulated by explosion.'
        : jointLimit,
    ),
    digit,
  };
}
function metatarsalLesson(
  ids: Pair,
  digit: Digit,
  proximal: string,
): AcralBoneLesson {
  return {
    ...bone(
      ids,
      'foot',
      `Metatarsal ${digit} links ${proximal} at its base to the proximal phalanx of the ${digitNames.foot[digit - 1]} at its head.`,
      `Forms forefoot ray ${digit}, contributing to support and propulsion through the metatarsophalangeal joint.`,
      metatarsal,
      digit === 1
        ? 'The first MTP region commonly contains sesamoids, but the atlas foot-sesamoid components are not independently assigned here. No fixed loading percentage is implied.'
        : digit === 2
          ? 'The recessed second base helps stabilise the tarsometatarsal complex; this does not validate the Lisfranc ligament or demonstrate stability under load.'
          : jointLimit,
    ),
    digit,
  };
}
const metacarpals = [
  metacarpalLesson(['FMA24464', 'FMA24465'], 1, 'the trapezium'),
  metacarpalLesson(
    ['FMA24466', 'FMA24467'],
    2,
    'the trapezoid, trapezium and capitate',
  ),
  metacarpalLesson(['FMA24468', 'FMA24469'], 3, 'the capitate'),
  metacarpalLesson(['FMA24470', 'FMA24471'], 4, 'the capitate and hamate'),
  metacarpalLesson(['FMA24472', 'FMA24473'], 5, 'the hamate'),
];
const metatarsals = [
  metatarsalLesson(
    ['FMA24507', 'FMA24508'],
    1,
    'principally the medial cuneiform',
  ),
  metatarsalLesson(
    ['FMA24509', 'FMA24510'],
    2,
    'principally the intermediate cuneiform',
  ),
  metatarsalLesson(
    ['FMA24511', 'FMA24512'],
    3,
    'principally the lateral cuneiform',
  ),
  metatarsalLesson(['FMA24513', 'FMA24514'], 4, 'the cuboid'),
  metatarsalLesson(['FMA24515', 'FMA24516'], 5, 'the cuboid'),
];
function phalanx(
  ids: Pair,
  region: Region,
  digit: Digit,
  segment: Segment,
): AcralBoneLesson {
  if (digit === 1 && segment === 'middle')
    throw new Error('Digit 1 has no middle phalanx in this curriculum');
  const name = digitNames[region][digit - 1];
  const base = region === 'hand' ? 'metacarpal' : 'metatarsal';
  const baseJoint = region === 'hand' ? 'MCP' : 'MTP';
  const ip = digit === 1 ? 'IP' : segment === 'proximal' ? 'PIP' : 'DIP';
  const relation =
    segment === 'proximal'
      ? `Its base meets ${base} ${digit} at the ${baseJoint} joint; its head meets the ${digit === 1 ? 'distal' : 'middle'} phalanx at the ${ip} joint.`
      : segment === 'middle'
        ? 'It lies between the proximal and distal phalanges, spanning the PIP and DIP joints.'
        : `Its base meets the ${digit === 1 ? 'proximal' : 'middle'} phalanx at the ${ip} joint; its tuft forms the terminal bony support.`;
  return {
    ...bone(
      ids,
      region,
      `The ${segment} phalanx belongs to the ${name}. ${relation}`,
      segment === 'distal'
        ? `Supports the end of the ${name} and supplies a bony lever for tendon-driven movement at its ${ip} joint.`
        : `Provides a ${segment === 'proximal' ? 'basal' : 'middle'} lever segment for coordinated ${region === 'hand' ? 'finger positioning and grasp' : 'toe positioning during support and push-off'}.`,
      region === 'hand' ? books + 'NBK507841/' : books + 'NBK536941/',
      digit === 1
        ? `The ${name} has proximal and distal phalanges, with one IP joint and no middle phalanx. Tendon attachments and joint mechanics remain unvalidated.`
        : 'Digit and segment are explicit source identities, not inferred from screen position. Tendon insertions, joint surfaces and developmental fusion variants require review.',
    ),
    digit,
    segment,
  };
}
const phalanges: AcralBoneLesson[] = [
  phalanx(['FMA24450', 'FMA65470'], 'hand', 1, 'proximal'),
  phalanx(['FMA24459', 'FMA23951'], 'hand', 1, 'distal'),
  phalanx(['FMA24451', 'FMA71915'], 'hand', 2, 'proximal'),
  phalanx(['FMA24455', 'FMA23938'], 'hand', 2, 'middle'),
  phalanx(['FMA24460', 'FMA23953'], 'hand', 2, 'distal'),
  phalanx(['FMA24452', 'FMA71908'], 'hand', 3, 'proximal'),
  phalanx(['FMA24456', 'FMA23940'], 'hand', 3, 'middle'),
  phalanx(['FMA24461', 'FMA23955'], 'hand', 3, 'distal'),
  phalanx(['FMA24453', 'FMA71916'], 'hand', 4, 'proximal'),
  phalanx(['FMA24457', 'FMA23942'], 'hand', 4, 'middle'),
  phalanx(['FMA24462', 'FMA23957'], 'hand', 4, 'distal'),
  phalanx(['FMA24454', 'FMA66791'], 'hand', 5, 'proximal'),
  phalanx(['FMA24458', 'FMA23944'], 'hand', 5, 'middle'),
  phalanx(['FMA24463', 'FMA23959'], 'hand', 5, 'distal'),
  phalanx(['FMA43253', 'FMA43254'], 'foot', 1, 'proximal'),
  phalanx(['FMA32650', 'FMA32651'], 'foot', 1, 'distal'),
  phalanx(['FMA32634', 'FMA32635'], 'foot', 2, 'proximal'),
  phalanx(['FMA32642', 'FMA32643'], 'foot', 2, 'middle'),
  phalanx(['FMA32652', 'FMA32653'], 'foot', 2, 'distal'),
  phalanx(['FMA32636', 'FMA32637'], 'foot', 3, 'proximal'),
  phalanx(['FMA32644', 'FMA32645'], 'foot', 3, 'middle'),
  phalanx(['FMA32654', 'FMA32655'], 'foot', 3, 'distal'),
  phalanx(['FMA32638', 'FMA32639'], 'foot', 4, 'proximal'),
  phalanx(['FMA32646', 'FMA32647'], 'foot', 4, 'middle'),
  phalanx(['FMA32656', 'FMA32657'], 'foot', 4, 'distal'),
  phalanx(['FMA32640', 'FMA32641'], 'foot', 5, 'proximal'),
  phalanx(['FMA230986', 'FMA230988'], 'foot', 5, 'middle'),
  phalanx(['FMA32658', 'FMA32659'], 'foot', 5, 'distal'),
];
export const acralBoneLessons: readonly AcralBoneLesson[] = [
  ...carpalAndTarsal,
  ...metacarpals,
  ...metatarsals,
  ...phalanges,
];
const byFma = new Map(
  acralBoneLessons.flatMap((lesson) =>
    lesson.fmaIds.map(
      (id, i) => [id, { lesson, side: i === 0 ? 'right' : 'left' }] as const,
    ),
  ),
);
export function acralBoneLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    s.system !== 'skeleton' ||
    s.category !== 'bone' ||
    (tab !== 'anatomy' && tab !== 'function')
  )
    return undefined;
  const match = byFma.get(s.fmaId);
  if (
    !match ||
    s.laterality !== match.side ||
    s.region !== match.lesson.region ||
    !s.regions.includes(match.lesson.region)
  )
    return undefined;
  const l = match.lesson;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Structure & relationships' : 'Role & limits'} · draft`,
    body: l[tab],
    bullets: [
      l.distinction,
      ...(tab === 'anatomy'
        ? [
            'Reference bone surface: cartilage, cortex, marrow, attachment footprints and physiological contact are not independently segmented or validated.',
            `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}. Side and digit numbering do not change with camera rotation.`,
          ]
        : []),
    ],
    note: [
      'Independent anatomical and clinical review pending. Explode/cut views are not tissue interiors, operative cleavage planes, physiological joint motion or acquired imaging.',
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...l.references],
  };
}
