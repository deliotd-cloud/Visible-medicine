/** Reviewed-reference teaching relationships; not registered specimen contact surfaces. */
export const handBoneFmas = {
  radius: ['FMA23464', 'FMA23465'],
  ulna: ['FMA23467', 'FMA23468'],
  scaphoid: ['FMA24435', 'FMA24436'],
  lunate: ['FMA24437', 'FMA24438'],
  triquetrum: ['FMA24439', 'FMA24440'],
  pisiform: ['FMA24441', 'FMA24442'],
  trapezium: ['FMA24443', 'FMA24444'],
  trapezoid: ['FMA23725', 'FMA24445'],
  capitate: ['FMA24446', 'FMA24447'],
  hamate: ['FMA24448', 'FMA24449'],
  m1: ['FMA24464', 'FMA24465'],
  m2: ['FMA24466', 'FMA24467'],
  m3: ['FMA24468', 'FMA24469'],
  m4: ['FMA24470', 'FMA24471'],
  m5: ['FMA24472', 'FMA24473'],
  p1: ['FMA24450', 'FMA65470'],
  p2: ['FMA24451', 'FMA71915'],
  p3: ['FMA24452', 'FMA71908'],
  p4: ['FMA24453', 'FMA71916'],
  p5: ['FMA24454', 'FMA66791'],
  i2: ['FMA24455', 'FMA23938'],
  i3: ['FMA24456', 'FMA23940'],
  i4: ['FMA24457', 'FMA23942'],
  i5: ['FMA24458', 'FMA23944'],
  d1: ['FMA24459', 'FMA23951'],
  d2: ['FMA24460', 'FMA23953'],
  d3: ['FMA24461', 'FMA23955'],
  d4: ['FMA24462', 'FMA23957'],
  d5: ['FMA24463', 'FMA23959'],
} as const;
export type HandBone = keyof typeof handBoneFmas;
export const handJointReferences = {
  bones: {
    title: 'TTUHSC El Paso · Upper-limb bones',
    url: 'https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html',
  },
  joints: {
    title: 'TTUHSC El Paso · Upper-limb joints',
    url: 'https://anatomy.ttuhscep.edu/anatomytables/joints_upperlimb.html',
  },
  osteology: {
    title: 'Gray · Carpus and metacarpus (historical text)',
    url: 'https://resources.saylor.org/wwwresources/archived/site/wp-content/uploads/2011/07/BIO302-ch2with6c6d.pdf',
  },
  cmc: {
    title: 'Anatomic Structures at Risk · CMC anatomy',
    url: 'https://www.anatomyatrisk.org/cmc-joints-Anatomy',
  },
  lunate: {
    title: 'Viegas et al. · Medial hamate facet of the lunate',
    url: 'https://pubmed.ncbi.nlm.nih.gov/2380518/',
  },
  capitate: {
    title: 'Viegas et al. · Wrist anatomical variations',
    url: 'https://pubmed.ncbi.nlm.nih.gov/8515018/',
  },
  tfcc: {
    title: 'American Society for Surgery of the Hand · TFCC',
    url: 'https://assh.my.site.com/handcare/condition/tfcc-tear',
  },
} as const;
export type HandJoint = {
  a: HandBone;
  b: HandBone;
  label: string;
  kind: 'synovial' | 'variable';
  reference: keyof typeof handJointReferences;
};
const joint = (
  a: HandBone,
  b: HandBone,
  label: string,
  reference: HandJoint['reference'],
  kind: HandJoint['kind'] = 'synovial',
): HandJoint => ({ a, b, label, reference, kind });
export const handJoints: readonly HandJoint[] = [
  joint('radius', 'ulna', 'Distal radioulnar · pivot joint', 'joints'),
  joint('radius', 'scaphoid', 'Radiocarpal · scaphoid fossa', 'bones'),
  joint('radius', 'lunate', 'Radiocarpal · lunate fossa', 'bones'),
  joint('scaphoid', 'lunate', 'Scapholunate', 'osteology'),
  joint('lunate', 'triquetrum', 'Lunotriquetral', 'osteology'),
  joint('triquetrum', 'pisiform', 'Pisotriquetral', 'bones'),
  joint('trapezium', 'trapezoid', 'Trapeziotrapezoid', 'osteology'),
  joint('trapezoid', 'capitate', 'Trapezoid–capitate', 'osteology'),
  joint('capitate', 'hamate', 'Capitohamate', 'osteology'),
  joint('scaphoid', 'trapezium', 'Midcarpal · scaphotrapezial', 'osteology'),
  joint('scaphoid', 'trapezoid', 'Midcarpal · scaphotrapezoid', 'osteology'),
  joint('scaphoid', 'capitate', 'Midcarpal · scaphocapitate', 'osteology'),
  joint('lunate', 'capitate', 'Midcarpal · capitolunate', 'bones'),
  joint('triquetrum', 'hamate', 'Midcarpal · triquetrohamate', 'osteology'),
  joint('trapezium', 'm1', 'Thumb carpometacarpal · saddle joint', 'joints'),
  joint('trapezium', 'm2', 'Carpometacarpal · second base', 'cmc'),
  joint('trapezoid', 'm2', 'Carpometacarpal · second ray', 'cmc'),
  joint('capitate', 'm2', 'Carpometacarpal · second base', 'cmc'),
  joint('capitate', 'm3', 'Carpometacarpal · third ray', 'cmc'),
  joint('hamate', 'm4', 'Carpometacarpal · fourth ray', 'cmc'),
  joint('hamate', 'm5', 'Carpometacarpal · fifth ray', 'cmc'),
  joint('m2', 'm3', 'Intermetacarpal bases', 'joints'),
  joint('m3', 'm4', 'Intermetacarpal bases', 'joints'),
  joint('m4', 'm5', 'Intermetacarpal bases', 'joints'),
  ...([1, 2, 3, 4, 5] as const).map((n) =>
    joint(`m${n}`, `p${n}`, `Metacarpophalangeal · digit ${n}`, 'joints'),
  ),
  joint('p1', 'd1', 'Thumb interphalangeal', 'bones'),
  ...([2, 3, 4, 5] as const).flatMap((n) => [
    joint(`p${n}`, `i${n}`, `Proximal interphalangeal · digit ${n}`, 'joints'),
    joint(`i${n}`, `d${n}`, `Distal interphalangeal · digit ${n}`, 'joints'),
  ]),
  joint(
    'lunate',
    'hamate',
    'Lunohamate facet · type-II pattern, variable',
    'lunate',
    'variable',
  ),
  joint(
    'capitate',
    'm4',
    'Capitate–fourth metacarpal facet · variable',
    'capitate',
    'variable',
  ),
];
export const handJointScope = {
  title: 'Wrist & hand joint partners',
  label: 'wrist/hand',
  summary:
    'Wrist and hand only: elbow, proximal radioulnar joint and interosseous membrane are outside this map. Bone pairs do not count separate facets or joint cavities. Thumb sesamoid partners are not included.',
  limits:
    'TFCC components and individual contact facets are not segmented by this map. Neither lunate type nor fourth carpometacarpal pattern is assigned to the donor.',
};
export const handJointNote =
  'The TFCC articular disc separates the distal ulna from the ulnar carpus. Ulna–lunate and ulna–triquetrum are not direct bone-articulation entries here; the disc is not generated or measured.';
