import pins from '../content/cervical-vascular-reasoning-pins.json' with { type: 'json' };
import type { BodyStructure } from '../app/body-types';
import { sourceCanonical } from './body-source-additions';
import type { ReasoningConcept } from './reasoning-questions';

const slugs = [
  'common-carotid-artery',
  'internal-carotid-artery',
  'vertebral-artery',
  'internal-jugular-vein',
] as const;
type Slug = typeof slugs[number];
const prefix = 'cervical-vascular-';
const signatures = new Map<string, string>();

function entries(slug: Slug) {
  const key = prefix + slug;
  const paired = pins.entries.filter(entry => entry.key === key);
  if (paired.length !== 2 ||
      paired[0].identity.laterality !== 'right' ||
      paired[1].identity.laterality !== 'left' ||
      paired.some(({ identity }) =>
        identity.id !== `vm:anatomy:body:head-neck:${identity.laterality}:vessel:${identity.laterality}-${slug}` ||
        identity.region !== 'head-neck' ||
        JSON.stringify(identity.regions) !== '["head-neck","thorax"]' ||
        identity.bundle !== 'head-neck-vessels-recovery' ||
        identity.sourceTree !== 'isa' ||
        identity.system !== 'vessels' || identity.category !== 'vessel' ||
        identity.sources.length !== 1 ||
        !identity.sources[0].file ||
        !/^[a-f0-9]{64}$/.test(identity.sources[0].sha256)))
    throw new Error(`Invalid paired cervical vascular source: ${key}`);
  return paired;
}

for (const slug of slugs) {
  for (const { key, identity } of entries(slug))
    signatures.set(`${key}:${identity.id}`, sourceCanonical(identity));
}

/** Match the complete pinned catalogue record, including source file hash and laterality. */
export function cervicalVascularReasoningSourceMatches(s: BodyStructure, key: string): boolean {
  const expected = signatures.get(`${key}:${s.id}`);
  return expected !== undefined && sourceCanonical(s) === expected;
}

const anteriorNeck = {
  title: 'Texas Tech University Health Sciences Center El Paso · Anterior triangle anatomy tables',
  url: 'https://anatomy.ttuhscep.edu/nervous_system/antneck_tables.html',
};
const posteriorNeck = {
  title: 'Texas Tech University Health Sciences Center El Paso · Posterior triangle dissection answers',
  url: 'https://anatomy.ttuhscep.edu/nervous_system/postneck_ans.html',
};
const limitation = ' The selected source meshes do not establish complete vessel continuity, flow, individual variants or imaging visibility. Educational draft pending revision-bound radiologist sign-off.';

function concept(slug: Slug, prompt: string, explanation: string,
  reference: ReasoningConcept['references'][number]): ReasoningConcept {
  const key = prefix + slug;
  const paired = entries(slug);
  return {
    key, region: 'head-neck', sourceRegions: ['head-neck', 'thorax'],
    sourceTissue: 'vessel', sourceTree: 'isa',
    bindings: paired.map(({ identity }) => ({
      fma: identity.fmaId,
      side: identity.laterality as 'right' | 'left',
      file: identity.sources[0].file,
    })),
    prompt, explanation: explanation + limitation, references: [reference],
    distractors: slugs.filter(other => other !== slug).map(other => prefix + other),
    readiness: 'draft', revision: 1,
  };
}

// Original formative questions about usual anatomy, not observed source-mesh connections.
export const cervicalVascularReasoningConcepts: readonly ReasoningConcept[] = [
  concept('common-carotid-artery',
    'Which cervical arterial trunk normally divides into internal and external carotid arteries?',
    'The common carotid artery normally divides into those two terminal branches near the superior border of the thyroid cartilage.',
    anteriorNeck),
  concept('internal-carotid-artery',
    'Which common carotid branch has no named branches in the neck before supplying structures within the head?',
    'The internal carotid artery has no named cervical branches in the usual pattern; its named branches arise after it enters the head.',
    anteriorNeck),
  concept('vertebral-artery',
    'Which branch of the first part of the subclavian artery usually ascends through the cervical transverse foramina before entering the skull?',
    'The vertebral artery usually arises from the first subclavian segment, passes through the C6 to C1 transverse foramina, and enters the skull through the foramen magnum.',
    posteriorNeck),
  concept('internal-jugular-vein',
    'Which deep cervical vein joins the subclavian vein to form the brachiocephalic vein?',
    'The internal jugular vein joins the subclavian vein near the sternoclavicular joint in the usual pattern.',
    posteriorNeck),
];
