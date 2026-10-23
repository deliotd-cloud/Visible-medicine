import pins from '../content/forearm-mechanics-reasoning-pins.json' with { type: 'json' };
import type { BodyStructure } from '../app/body-types';
import { sourceCanonical } from './body-source-additions';
import type { ReasoningConcept } from './reasoning-questions';

const signatures = new Map(pins.entries.map(({ key, identity }) =>
  [`${key}:${identity.id}`, sourceCanonical(identity)] as const));

/** Admit the whole pinned displayed identity, including ordered source hashes. */
export function forearmMechanicsReasoningSourceMatches(s: BodyStructure, key: string): boolean {
  const expected = signatures.get(`${key}:${s.id}`);
  return expected !== undefined && sourceCanonical(s) === expected;
}

const slugs = [
  'flexor-digitorum-superficialis', 'flexor-digitorum-profundus',
  'extensor-carpi-radialis-brevis', 'extensor-carpi-ulnaris',
  'extensor-digitorum', 'extensor-indicis',
] as const;
type Slug = typeof slugs[number];
const alternatives: Record<Slug, readonly string[]> = {
  'flexor-digitorum-superficialis': ['forearm-mechanics-flexor-digitorum-profundus', 'flexor-pollicis-longus', 'forearm-mechanics-extensor-digitorum'],
  'flexor-digitorum-profundus': ['forearm-mechanics-flexor-digitorum-superficialis', 'flexor-pollicis-longus', 'forearm-mechanics-extensor-digitorum'],
  'extensor-carpi-radialis-brevis': ['extensor-carpi-radialis-longus', 'forearm-mechanics-extensor-carpi-ulnaris', 'flexor-carpi-radialis'],
  'extensor-carpi-ulnaris': ['forearm-mechanics-extensor-carpi-radialis-brevis', 'extensor-carpi-radialis-longus', 'flexor-carpi-radialis'],
  'extensor-digitorum': ['forearm-mechanics-extensor-indicis', 'forearm-mechanics-flexor-digitorum-superficialis', 'forearm-mechanics-flexor-digitorum-profundus'],
  'extensor-indicis': ['forearm-mechanics-extensor-digitorum', 'forearm-mechanics-flexor-digitorum-superficialis', 'forearm-mechanics-flexor-digitorum-profundus'],
};
const limitation = ' Reference anatomy only: the retained whole-muscle meshes do not establish individual tendon function, joint motion or patient registration. Draft pending revision-bound radiologist review.';

function concept(slug: Slug, prompt: string, explanation: string): ReasoningConcept {
  const key = `forearm-mechanics-${slug}`;
  const entries = pins.entries.filter(entry => entry.key === key);
  const expectedCount = slug === 'flexor-digitorum-superficialis' || slug === 'extensor-carpi-ulnaris' ? 2 : 1;
  const distractors = alternatives[slug];
  if (entries.length !== 2 ||
      entries[0].identity.laterality !== 'right' || entries[1].identity.laterality !== 'left' ||
      entries.some(({ identity }) => identity.sourceTree !== 'isa' || identity.region !== 'forearm' ||
        JSON.stringify(identity.regions) !== JSON.stringify(['forearm']) ||
        identity.system !== 'muscles' || identity.category !== 'muscle' ||
        identity.bundle !== 'forearm-muscles' || identity.sources.length !== expectedCount) ||
      distractors.length !== 3 || new Set(distractors).size !== 3 || distractors.includes(key))
    throw new Error(`Invalid paired forearm source or alternatives: ${key}`);
  return {
    key, region: 'forearm', sourceRegions: ['forearm'], sourceTree: 'isa',
    bindings: entries.map(({ identity }) => identity.sources.length === 2
      ? { fma: identity.fmaId, side: identity.laterality as 'left' | 'right', files: [identity.sources[0].file, identity.sources[1].file] }
      : { fma: identity.fmaId, side: identity.laterality as 'left' | 'right', file: identity.sources[0].file }),
    prompt, explanation: explanation + limitation,
    references: [{ title: `University of Washington Radiology · ${slug.replaceAll('-', ' ')}`, url: `https://rad.uw.edu/muscle-atlas/${slug}` },
      ...(slug === 'extensor-carpi-radialis-brevis' ? [{ title: 'University of Washington Radiology · extensor carpi radialis longus', url: 'https://rad.uw.edu/muscle-atlas/extensor-carpi-radialis-longus' }] : [])],
    distractors, readiness: 'draft', revision: 1,
  };
}

// Original formative prompts about named reference anatomy; no borrowed illustrations.
export const forearmMechanicsReasoningConcepts: readonly ReasoningConcept[] = [
  concept('flexor-digitorum-superficialis',
    'Which forearm flexor reaches the middle phalanges of fingers two through five and bends their proximal interphalangeal joints?',
    'Flexor digitorum superficialis attaches to the middle phalanges and contributes to proximal interphalangeal flexion. Profundus continues to the distal phalanges.'),
  concept('flexor-digitorum-profundus',
    'Which whole forearm muscle sends tendons to the distal phalanges of fingers two through five for distal interphalangeal flexion?',
    'Flexor digitorum profundus reaches the distal phalanges and contributes to distal interphalangeal flexion. This whole representation does not resolve individual finger or nerve territories.'),
  concept('extensor-carpi-radialis-brevis',
    'Which radial wrist extensor inserts at the base of the third metacarpal, compared with the longus at the second?',
    'Extensor carpi radialis brevis reaches the third metacarpal base and contributes to wrist extension and radial deviation; longus reaches the second metacarpal base.'),
  concept('extensor-carpi-ulnaris',
    'Which forearm extensor reaches the fifth metacarpal base and contributes to extension with ulnar deviation at the wrist?',
    'Extensor carpi ulnaris inserts on the fifth metacarpal base and contributes to wrist extension and ulnar deviation.'),
  concept('extensor-digitorum',
    'Which common forearm extensor reaches the extensor expansions of fingers two through five?',
    'Extensor digitorum reaches the four finger extensor expansions and contributes to their extension. Extensor indicis adds a separate index-finger tendon.'),
  concept('extensor-indicis',
    'Which additional forearm extensor joins the index-finger extensor expansion?',
    'Extensor indicis joins the index extensor expansion and provides an additional contribution to index extension beside extensor digitorum.'),
];
