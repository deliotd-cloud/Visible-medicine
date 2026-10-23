import pins from '../content/midfoot-relationships-reasoning-pins.json' with { type: 'json' };
import type { BodyStructure } from '../app/body-types';
import { sourceCanonical } from './body-source-additions';
import type { ReasoningConcept } from './reasoning-questions';

const identities = new Map(pins.entries.map(({ key, identity }) =>
  [`${key}:${identity.id}`, sourceCanonical(identity)] as const));

/** Whole retained source identity, never a name-only or mirrored admission. */
export function midfootRelationshipsReasoningSourceMatches(s: BodyStructure, key: string): boolean {
  const expected = identities.get(`${key}:${s.id}`);
  return expected !== undefined && sourceCanonical(s) === expected;
}

const slugs = ['medial-cuneiform', 'intermediate-cuneiform', 'lateral-cuneiform',
  'first-metatarsal', 'second-metatarsal', 'fourth-metatarsal'] as const;
type Slug = typeof slugs[number];
// The engine renders every authored alternative, so supply exactly three.
// Keep two competing cuneiforms or metatarsals plus one cross-group contrast.
const alternatives: Record<Slug, readonly Slug[]> = {
  'medial-cuneiform': ['intermediate-cuneiform', 'lateral-cuneiform', 'second-metatarsal'],
  'intermediate-cuneiform': ['medial-cuneiform', 'lateral-cuneiform', 'second-metatarsal'],
  'lateral-cuneiform': ['medial-cuneiform', 'intermediate-cuneiform', 'second-metatarsal'],
  'first-metatarsal': ['second-metatarsal', 'fourth-metatarsal', 'intermediate-cuneiform'],
  'second-metatarsal': ['first-metatarsal', 'fourth-metatarsal', 'intermediate-cuneiform'],
  'fourth-metatarsal': ['first-metatarsal', 'second-metatarsal', 'intermediate-cuneiform'],
};
const texas = {
  title: 'Texas Tech University Health Sciences Center El Paso · lower-limb bones',
  url: 'https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html',
};
const ao = {
  title: 'AO Surgery Reference · Lisfranc anatomical relationships',
  url: 'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/midfoot/lisfranc-injury/treatment-of-lisfranc-injuries',
};
const posna = {
  title: 'Pediatric Orthopaedic Society of North America · foot alignment landmarks',
  url: 'https://posna.org/physician-education/study-guide/foot-dislocations-(lisfranc-and-subtalar)',
};
const limitation = ' Reference anatomy only; whole-bone meshes do not validate patient alignment, ligament integrity or scan registration. Draft awaiting revision-bound radiologist review.';

function concept(slug: Slug, prompt: string, explanation: string,
  reference: ReasoningConcept['references'][number]): ReasoningConcept {
  const key = `midfoot-relationships-${slug}`;
  const entries = pins.entries.filter(e => e.key === key);
  if (entries.length !== 2 ||
      !entries.some(e => e.identity.laterality === 'left') ||
      !entries.some(e => e.identity.laterality === 'right') ||
      entries.some(e => e.identity.region !== 'foot' ||
        JSON.stringify(e.identity.regions) !== JSON.stringify(['foot']) ||
        e.identity.system !== 'skeleton' || e.identity.category !== 'bone' ||
        e.identity.sourceTree !== 'isa' || e.identity.bundle !== 'foot-skeleton' ||
        e.identity.sources.length !== 1))
    throw new Error(`Invalid paired midfoot source identities: ${key}`);
  return {
    key, sourceTissue: 'bone', region: 'foot', sourceRegions: ['foot'], sourceTree: 'isa',
    bindings: entries.map(({ identity }) => ({
      fma: identity.fmaId, side: identity.laterality as 'left' | 'right',
      file: identity.sources[0].file,
    })),
    prompt, explanation: explanation + limitation, references: [reference],
    distractors: alternatives[slug].map(other => `midfoot-relationships-${other}`),
    readiness: 'draft', revision: 1,
  };
}

// Original formative prompts. Referenced facts do not license illustrations or
// establish injury, thresholds, ligament segmentation or patient registration.
export const midfootRelationshipsReasoningConcepts: readonly ReasoningConcept[] = [
  concept('medial-cuneiform',
    'Which cuneiform is separated from the second metatarsal base by the interval assessed for Lisfranc ligament injury?',
    'The medial cuneiform faces the second metatarsal across this interval. The question identifies a bone, not the unsegmented ligament or its integrity.', ao),
  concept('intermediate-cuneiform',
    'Which cuneiform forms the proximal articular partner of the recessed second metatarsal base?',
    'The intermediate, also called middle, cuneiform meets that base. This joint relationship differs from the interval toward the medial cuneiform.', ao),
  concept('lateral-cuneiform',
    'Which distal-row tarsal lies between the intermediate cuneiform and the cuboid?',
    'The lateral cuneiform occupies this position and articulates proximally with the navicular. Anatomical medial and lateral do not follow screen orientation.', texas),
  concept('first-metatarsal',
    'On an AP foot radiograph, which metatarsal has its lateral border compared with the lateral border of the medial cuneiform?',
    'The first metatarsal participates in that alignment check; the second metatarsal is assessed against the middle cuneiform instead.', posna),
  concept('second-metatarsal',
    'Which recessed metatarsal base has its medial border compared with the medial border of the intermediate cuneiform on an AP view?',
    'The second metatarsal provides this landmark. Its recessed base contributes to the usual tarsometatarsal arrangement.', posna),
  concept('fourth-metatarsal',
    'On an oblique foot radiograph, which metatarsal has its medial border compared with the medial border of the cuboid?',
    'The fourth metatarsal provides this lateral-column alignment landmark, unlike the cuneiform-related checks on the AP view.', posna),
];
