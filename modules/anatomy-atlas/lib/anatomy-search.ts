import type { BodyStructure, BodySystem } from '../app/body-types';

type AliasGroup = {
  aliases: readonly string[];
  system: BodySystem;
  category: string;
  tree: 'isa' | 'partof';
  members: readonly (readonly [
    fma: string,
    name: string,
    side: string,
    file: string,
  ])[];
};

// Search vocabulary only, not new identities, source admissions or clinical
// synonyms for diagnoses. References and deliberately partial scope are recorded
// in SEARCH_VOCABULARY.md. Existing source names remain the visible labels.
export const anatomySearchAliases: readonly AliasGroup[] = [
  {
    aliases: ['vas deferens', 'ductus deferens', 'vasa deferentia'],
    system: 'organs', category: 'organ', tree: 'isa',
    members: [
      ['FMA19236', 'Left deferent duct', 'left', 'FJ3135'],
      ['FMA19235', 'Right deferent duct', 'right', 'FJ3140'],
    ],
  },
  {
    aliases: ['Achilles', 'Achilles tendon', 'Achilles tendons'],
    system: 'connective',
    category: 'tendon',
    tree: 'isa',
    members: [
      ['FMA258847', 'Right calcaneal tendon', 'right', 'FJ1405'],
      ['FMA264844', 'Left calcaneal tendon', 'left', 'FJ1405M'],
    ],
  },
  {
    aliases: ['collarbone', 'collar bone', 'collarbones', 'collar bones'],
    system: 'skeleton',
    category: 'bone',
    tree: 'isa',
    members: [
      ['FMA13322', 'Right clavicle', 'right', 'FJ3362'],
      ['FMA13323', 'Left clavicle', 'left', 'FJ3237'],
    ],
  },
  {
    aliases: ['shoulder blade', 'shoulder blades'],
    system: 'skeleton',
    category: 'bone',
    tree: 'isa',
    members: [
      ['FMA13395', 'Right scapula', 'right', 'FJ3384'],
      ['FMA13396', 'Left scapula', 'left', 'FJ3279'],
    ],
  },
  {
    aliases: ['kneecap', 'knee cap', 'kneecaps', 'knee caps'],
    system: 'skeleton',
    category: 'bone',
    tree: 'isa',
    members: [
      ['FMA24486', 'Right patella', 'right', 'FJ3381'],
      ['FMA24487', 'Left patella', 'left', 'FJ3275'],
    ],
  },
  {
    aliases: ['peroneus longus'],
    system: 'muscles',
    category: 'muscle',
    tree: 'isa',
    members: [
      ['FMA22552', 'Right fibularis longus', 'right', 'FJ1410'],
      ['FMA22553', 'Left fibularis longus', 'left', 'FJ1410M'],
    ],
  },
  {
    aliases: ['peroneus brevis'],
    system: 'muscles',
    category: 'muscle',
    tree: 'isa',
    members: [
      ['FMA22554', 'Right fibularis brevis', 'right', 'FJ1409'],
      ['FMA22555', 'Left fibularis brevis', 'left', 'FJ1409M'],
    ],
  },
  {
    aliases: ['peroneus tertius'],
    system: 'muscles',
    category: 'muscle',
    tree: 'isa',
    members: [
      ['FMA22550', 'Right fibularis tertius', 'right', 'FJ1411'],
      ['FMA22551', 'Left fibularis tertius', 'left', 'FJ1411M'],
    ],
  },
  {
    aliases: ['quadratus plantae'],
    system: 'muscles',
    category: 'muscle',
    tree: 'isa',
    members: [
      ['FMA37465', 'Right flexor accessorius', 'right', 'FJ1412'],
      ['FMA37466', 'Left flexor accessorius', 'left', 'FJ1412M'],
    ],
  },
  {
    aliases: ['CN III', 'cranial nerve 3'],
    system: 'nerves',
    category: 'nerve',
    tree: 'isa',
    // Only the supplied divisions. Do not rename them as complete CN III.
    members: [
      [
        'FMA52574',
        'Superior branch of right oculomotor nerve',
        'right',
        'FJ1372',
      ],
      [
        'FMA52575',
        'Superior branch of left oculomotor nerve',
        'left',
        'FJ1321',
      ],
      [
        'FMA52576',
        'Inferior branch of right oculomotor nerve',
        'right',
        'FJ1344',
      ],
      [
        'FMA52577',
        'Inferior branch of left oculomotor nerve',
        'left',
        'FJ1293',
      ],
    ],
  },
  {
    aliases: ['CN IV', 'cranial nerve 4'],
    system: 'nerves',
    category: 'nerve',
    tree: 'isa',
    members: [
      ['FMA50881', 'Right trochlear nerve', 'right', 'FJ1381'],
      ['FMA50882', 'Left trochlear nerve', 'left', 'FJ1330'],
    ],
  },
  {
    aliases: ['oesophagus', 'gullet', 'food pipe'],
    system: 'organs',
    category: 'organ',
    tree: 'partof',
    members: [['FMA7131', 'Esophagus', 'unpaired', 'FJ2563']],
  },
];

const byFma = new Map(
  anatomySearchAliases.flatMap((group) =>
    group.members.map((member) => [member[0], { group, member }] as const),
  ),
);
export function structureSearchAliases(s: BodyStructure): string[] {
  const match = byFma.get(s.fmaId);
  if (!match) return [];
  const {
    group,
    member: [, name, side, file],
  } = match;
  if (
    s.name !== name ||
    s.laterality !== side ||
    s.system !== group.system ||
    s.category !== group.category ||
    s.sourceTree !== group.tree ||
    s.sources.length !== 1 ||
    s.sources[0].file !== file
  )
    return [];
  return [...group.aliases];
}

const cranialNumbers: Record<string, string> = {
  i: '1',
  ii: '2',
  iii: '3',
  iv: '4',
  v: '5',
  vi: '6',
  vii: '7',
  viii: '8',
  ix: '9',
  x: '10',
  xi: '11',
  xii: '12',
};
/** Optional internal hyphens affect search only, never source identities. */
export function joinAnatomyHyphens(value: string): string {
  return value.replace(/(?<=\p{L})[-\u2010\u2011](?=\p{L})/gu, '');
}

/** Unicode/spacing variants are search equivalents, never changes to labels. */
export function normalizeAnatomySearch(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[’']s\b/g, '')
    .replace(/[’']/g, '')
    .replace(
      /\b(?:cn|cranial\s+nerve)\s*[-:.]?\s*(viii|vii|xii|iii|vi|iv|ii|ix|xi|i|v|x|\d+)\b/g,
      (_whole, number: string) => 'cn' + (cranialNumbers[number] ?? number),
    )
    .replace(/\bfma\s*[:#-]?\s*(\d+)\b/g, 'fma$1')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** CN IV must never match CN VI, an identifier digit or "division". */
export function anatomySearchWordMatches(text: string, word: string): boolean {
  return /^cn\d+$/.test(word)
    ? text.split(' ').includes(word)
    : text.includes(word);
}
