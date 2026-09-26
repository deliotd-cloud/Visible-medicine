// Original factual relationship metadata; not nerve geometry or donor findings.
export const upperLimbMotorRegions = [
  'shoulder-arm',
  'forearm',
  'hand',
] as const;
export const upperLimbMotorReferences = {
  muscles: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html',
  hand: 'https://anatomy.ttuhscep.edu/musculoskeletal_system/hand_tables.html',
  subscapular:
    'https://anatomy.ttuhscep.edu/musculoskeletal_system/axilla.html',
  radial: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7345276/',
  anteriorInterosseous: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9048100/',
} as const;
const nerve = (
  label: string,
  note: string,
  references: readonly (keyof typeof upperLimbMotorReferences)[] = ['muscles'],
) => ({ label, note, references });
export const upperLimbMotorNerves = {
  axillary: nerve(
    'Axillary nerve',
    'Deltoid parts and teres minor. Rotator-cuff membership does not mean every cuff muscle shares this nerve.',
  ),
  suprascapular: nerve(
    'Suprascapular nerve',
    'Supraspinatus and infraspinatus; this group does not include the other cuff muscles.',
  ),
  upperSubscapular: nerve(
    'Upper subscapular nerve',
    'Subscapularis has upper and lower subscapular supply. Its whole surface appears in both groups.',
    ['subscapular'],
  ),
  lowerSubscapular: nerve(
    'Lower subscapular nerve',
    'Teres major and a contribution to subscapularis. Supplied intramuscular territories are not segmented.',
    ['subscapular'],
  ),
  longThoracic: nerve(
    'Long thoracic nerve',
    'Serratus anterior is represented. This list does not trace the nerve along the chest wall.',
  ),
  dorsalScapular: nerve(
    'Dorsal scapular nerve',
    'Rhomboids and a contribution to levator scapulae. Levator also has cervical branches.',
  ),
  cervical: nerve(
    'C3–C4 cervical branches',
    'Additional motor supply to levator scapulae; this is not a complete cervical plexus or root map.',
  ),
  musculocutaneous: nerve(
    'Musculocutaneous nerve',
    'Biceps heads, coracobrachialis and principal brachialis supply. A radial contribution to brachialis is qualified separately.',
  ),
  radialProximal: nerve(
    'Radial nerve · proximal branches',
    'Includes available arm branches, brachioradialis and extensor carpi radialis longus. Brachialis may receive a variable lateral contribution.',
    ['muscles', 'radial'],
  ),
  radialDeep: nerve(
    'Radial nerve · deep branch',
    'Supinator and usual extensor carpi radialis brevis supply before the distal posterior interosseous group. ECRB branch origin varies.',
    ['radial'],
  ),
  posteriorInterosseous: nerve(
    'Posterior interosseous nerve',
    'Available distal extensor-group targets. Proximal radial muscles and intrinsic hand muscles are not automatically included.',
    ['radial'],
  ),
  medianForearm: nerve(
    'Median nerve · forearm branches',
    'Available superficial/intermediate flexor-pronator targets; deep anterior interosseous targets form a separate group.',
  ),
  anteriorInterosseous: nerve(
    'Anterior interosseous nerve',
    'Median branch to flexor pollicis longus, pronator quadratus and the radial part of flexor digitorum profundus.',
    ['anteriorInterosseous'],
  ),
  medianThenar: nerve(
    'Median nerve · recurrent branch',
    'Available thenar targets only. Missing flexor pollicis brevis geometry is not normal anatomical absence.',
    ['hand'],
  ),
  medianDigital: nerve(
    'Median nerve · digital branches',
    'Motor branches to the first two lumbricals. These are not recurrent-branch targets or a sensory territory map.',
    ['hand'],
  ),
  ulnarForearm: nerve(
    'Ulnar nerve · forearm branches',
    'Flexor carpi ulnaris heads and the ulnar part of flexor digitorum profundus.',
  ),
  ulnarDeep: nerve(
    'Ulnar nerve · deep branch',
    'Available hypothenar, adductor, interosseous and medial lumbrical targets. Not a complete set of intrinsic hand muscles.',
    ['hand'],
  ),
} as const;
export type UpperLimbMotorKey = keyof typeof upperLimbMotorNerves;
export type UpperLimbMotorBinding = {
  fmaId: string;
  nerve: UpperLimbMotorKey;
  part?: string;
  caveat?: string;
};
const bind = (
  nerve: UpperLimbMotorKey,
  ids: string,
  extra: Pick<UpperLimbMotorBinding, 'part' | 'caveat'> = {},
): UpperLimbMotorBinding[] =>
  ids.split(' ').map((fmaId) => ({ fmaId, nerve, ...extra }));
export const upperLimbMotorBindings: readonly UpperLimbMotorBinding[] = [
  ...bind(
    'axillary',
    'FMA34680 FMA34681 FMA34682 FMA34683 FMA34684 FMA34685 FMA32553 FMA32554',
  ),
  ...bind('suprascapular', 'FMA32544 FMA32545 FMA32547 FMA32548'),
  ...bind('upperSubscapular', 'FMA13414 FMA13415', {
    part: 'Upper-nerve contribution; shares the whole subscapularis source with lower supply',
  }),
  ...bind('lowerSubscapular', 'FMA13414 FMA13415', {
    part: 'Lower-nerve contribution; shares the whole subscapularis source with upper supply',
  }),
  ...bind('lowerSubscapular', 'FMA32551 FMA32552'),
  ...bind('longThoracic', 'FMA13398 FMA13399'),
  ...bind('dorsalScapular', 'FMA13381 FMA13382 FMA13383 FMA13384'),
  ...bind('dorsalScapular', 'FMA32540 FMA32541', {
    part: 'Contribution to levator scapulae alongside cervical branches',
  }),
  ...bind('cervical', 'FMA32540 FMA32541', {
    part: 'Cervical contribution to levator scapulae alongside dorsal scapular supply',
  }),
  ...bind(
    'musculocutaneous',
    'FMA37684 FMA37685 FMA37686 FMA37687 FMA37665 FMA37666',
  ),
  ...bind('musculocutaneous', 'FMA37668 FMA37669', {
    caveat:
      'Principal supply; a variable radial contribution to lateral brachialis is also taught.',
  }),
  ...bind(
    'radialProximal',
    'FMA37695 FMA37696 FMA37697 FMA37698 FMA37699 FMA37700 FMA37705 FMA37706 FMA38486 FMA38487 FMA38495 FMA38496',
  ),
  ...bind('radialProximal', 'FMA37668 FMA37669', {
    part: 'Variable lateral contribution to brachialis',
    caveat:
      'Not demonstrated in this donor and not a replacement for principal musculocutaneous supply.',
  }),
  ...bind('radialDeep', 'FMA38513 FMA38514'),
  ...bind('radialDeep', 'FMA38498 FMA38499', {
    caveat:
      'ECRB branch origin varies; placement in this teaching group is not a donor-specific branch finding.',
  }),
  ...bind(
    'posteriorInterosseous',
    'FMA38507 FMA38508 FMA38504 FMA38505 FMA38501 FMA38502 FMA38525 FMA38526 FMA38519 FMA38520 FMA38522 FMA38523 FMA38516 FMA38517',
  ),
  ...bind(
    'medianForearm',
    'FMA38470 FMA38471 FMA38460 FMA38461 FMA38463 FMA38464 FMA38560 FMA38561 FMA38562 FMA38563',
  ),
  ...bind('anteriorInterosseous', 'FMA38482 FMA38484 FMA38454 FMA38455'),
  ...bind('anteriorInterosseous', 'FMA38479 FMA38480', {
    part: 'Radial portion of flexor digitorum profundus, usually for digits 2–3',
    caveat:
      'Whole muscle remains visible; individual digital slips and nerve territories are not segmented.',
  }),
  ...bind('medianThenar', 'FMA37386 FMA37387 FMA37390 FMA37391'),
  ...bind('medianDigital', 'FMA42398 FMA42399', {
    part: 'Lumbricals 1–2 only',
    caveat:
      'The entire four-lumbrical source group is shown, not a median-only muscle mesh.',
  }),
  ...bind('ulnarForearm', 'FMA38617 FMA38618 FMA38619 FMA38620'),
  ...bind('ulnarForearm', 'FMA38479 FMA38480', {
    part: 'Ulnar portion of flexor digitorum profundus, usually for digits 4–5',
    caveat:
      'Whole muscle remains visible; individual digital slips and nerve territories are not segmented.',
  }),
  ...bind(
    'ulnarDeep',
    'FMA37396 FMA37397 FMA37398 FMA37399 FMA37400 FMA37401 FMA46121 FMA46122 FMA46123 FMA46124 FMA42402 FMA42403 FMA42404 FMA42405',
  ),
  ...bind('ulnarDeep', 'FMA42398 FMA42399', {
    part: 'Lumbricals 3–4 only',
    caveat:
      'The entire four-lumbrical source group is shown, not an ulnar-only muscle mesh.',
  }),
];
