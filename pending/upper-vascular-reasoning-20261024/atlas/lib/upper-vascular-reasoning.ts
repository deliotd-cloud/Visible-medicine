import pins from '../content/upper-vascular-reasoning-pins.json' with { type: 'json' };
import type { BodyStructure } from '../app/body-types';
import { sourceCanonical } from './body-source-additions';
import type { ReasoningConcept } from './reasoning-questions';

const slugs = [
  'axillary-artery', 'brachial-artery', 'deep-brachial-artery',
  'radial-artery', 'ulnar-artery', 'common-interosseous-artery',
  'anterior-interosseous-artery', 'axillary-vein', 'cephalic-vein',
  'basilic-vein',
] as const;
type Slug = typeof slugs[number];
type Region = 'shoulder-arm' | 'forearm';
type Membership = { region: Region; regions: readonly string[]; bundle: string; tree: 'isa' };

const sourceMembership: Record<Slug, Membership> = {
  'axillary-artery': { region: 'shoulder-arm', regions: ['shoulder-arm'], bundle: 'shoulder-arm-vessels-recovery', tree: 'isa' },
  'brachial-artery': { region: 'shoulder-arm', regions: ['shoulder-arm'], bundle: 'shoulder-arm-vessels-recovery', tree: 'isa' },
  'deep-brachial-artery': { region: 'shoulder-arm', regions: ['shoulder-arm'], bundle: 'shoulder-arm-vessels-recovery', tree: 'isa' },
  'radial-artery': { region: 'forearm', regions: ['forearm', 'hand'], bundle: 'forearm-vessels-recovery', tree: 'isa' },
  'ulnar-artery': { region: 'forearm', regions: ['forearm', 'hand'], bundle: 'forearm-vessels-recovery', tree: 'isa' },
  'common-interosseous-artery': { region: 'forearm', regions: ['forearm'], bundle: 'forearm-vessels-forearm-vascular', tree: 'isa' },
  'anterior-interosseous-artery': { region: 'forearm', regions: ['forearm', 'hand'], bundle: 'forearm-vessels-recovery', tree: 'isa' },
  'axillary-vein': { region: 'shoulder-arm', regions: ['shoulder-arm', 'thorax'], bundle: 'shoulder-arm-vessels-inventory', tree: 'isa' },
  'cephalic-vein': { region: 'forearm', regions: ['forearm', 'shoulder-arm'], bundle: 'forearm-vessels-recovery', tree: 'isa' },
  'basilic-vein': { region: 'forearm', regions: ['forearm', 'shoulder-arm'], bundle: 'forearm-vessels-recovery', tree: 'isa' },
};

const alternatives: Record<Slug, readonly Slug[]> = {
  'axillary-artery': ['brachial-artery', 'deep-brachial-artery', 'axillary-vein'],
  'brachial-artery': ['axillary-artery', 'deep-brachial-artery', 'axillary-vein'],
  'deep-brachial-artery': ['brachial-artery', 'axillary-artery', 'axillary-vein'],
  'radial-artery': ['ulnar-artery', 'anterior-interosseous-artery', 'common-interosseous-artery'],
  'ulnar-artery': ['radial-artery', 'anterior-interosseous-artery', 'common-interosseous-artery'],
  'common-interosseous-artery': ['ulnar-artery', 'anterior-interosseous-artery', 'radial-artery'],
  'anterior-interosseous-artery': ['common-interosseous-artery', 'radial-artery', 'ulnar-artery'],
  'axillary-vein': ['axillary-artery', 'cephalic-vein', 'basilic-vein'],
  'cephalic-vein': ['basilic-vein', 'axillary-vein', 'radial-artery'],
  'basilic-vein': ['cephalic-vein', 'axillary-vein', 'ulnar-artery'],
};

const uamsArteries = {
  title: 'University of Arkansas for Medical Sciences · Arteries of the upper limb',
  url: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-upper-limb/',
};
const ttuhscForearm = {
  title: 'Texas Tech University Health Sciences Center El Paso · Forearm anatomy',
  url: 'https://anatomy.ttuhscep.edu/musculoskeletal_system/forearm_tables.html',
};
const uamsVeins = {
  title: 'University of Arkansas for Medical Sciences · Selected veins of the upper limb',
  url: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-upper-limb/',
};
const limitation = ' Source surfaces do not independently verify junctions, patency or variants. Educational draft pending revision-bound radiologist sign-off.';

function sourceId(slug: Slug, side: 'right' | 'left'): string {
  return `vm:anatomy:body:${sourceMembership[slug].region}:${side}:vessel:${side}-${slug}`;
}

function sourceEntries(slug: Slug) {
  const key = `upper-vascular-${slug}`;
  const entries = pins.entries.filter(entry => entry.key === key);
  const membership = sourceMembership[slug];
  if (entries.length !== 2 ||
      entries[0].identity.laterality !== 'right' ||
      entries[1].identity.laterality !== 'left' ||
      entries.some(({ identity }) =>
        identity.id !== sourceId(slug, identity.laterality as 'right' | 'left') ||
        identity.region !== membership.region ||
        JSON.stringify(identity.regions) !== JSON.stringify(membership.regions) ||
        identity.bundle !== membership.bundle ||
        identity.sourceTree !== membership.tree ||
        identity.system !== 'vessels' || identity.category !== 'vessel' ||
        identity.sources.length !== 1 ||
        !identity.sources[0].file ||
        !/^[a-f0-9]{64}$/.test(identity.sources[0].sha256)))
    throw new Error(`Invalid paired upper vascular source: ${key}`);
  return entries;
}

const signatures = new Map<string, string>();
for (const slug of slugs) {
  for (const { key, identity } of sourceEntries(slug))
    signatures.set(`${key}:${identity.id}`, sourceCanonical(identity));
}

/** Match an exact key and source identity, including the complete ordered source record. */
export function upperVascularReasoningSourceMatches(s: BodyStructure, key: string): boolean {
  const expected = signatures.get(`${key}:${s.id}`);
  return expected !== undefined && sourceCanonical(s) === expected;
}

function concept(slug: Slug, prompt: string, explanation: string, reference: ReasoningConcept['references'][number]): ReasoningConcept {
  const key = `upper-vascular-${slug}`;
  const entries = sourceEntries(slug);
  const membership = sourceMembership[slug];
  const distractors = alternatives[slug];
  if (distractors.length !== 3 || new Set(distractors).size !== 3 ||
      distractors.includes(slug) ||
      distractors.some(other => !slugs.includes(other)) ||
      membership.regions.some(region =>
        slugs.some(other => other !== slug && sourceMembership[other].regions.includes(region)) &&
        !distractors.some(other => sourceMembership[other].regions.includes(region))))
    throw new Error(`Invalid upper vascular alternatives: ${key}`);
  return {
    key, region: membership.region, sourceRegions: membership.regions,
    sourceTissue: 'vessel', sourceTree: membership.tree,
    bindings: entries.map(({ identity }) => ({
      fma: identity.fmaId, side: identity.laterality as 'right' | 'left', file: identity.sources[0].file,
    })),
    prompt, explanation: explanation + limitation, references: [reference],
    distractors: distractors.map(other => `upper-vascular-${other}`),
    readiness: 'draft', revision: 1,
  };
}

// Original formative questions about usual anatomy; no source figures or question text imported.
export const upperVascularReasoningConcepts: readonly ReasoningConcept[] = [
  concept('axillary-artery',
    'Which artery continues the subclavian artery beyond the lateral edge of the first rib?',
    'The axillary artery is the named continuation at that landmark; farther along the limb it becomes brachial.',
    uamsArteries),
  concept('brachial-artery',
    'Which arm artery begins beyond teres major and usually divides into radial and ulnar arteries?',
    'The brachial artery is the usual parent of those forearm arteries. High branching is a recognised variant.',
    uamsArteries),
  concept('deep-brachial-artery',
    'Which brachial branch travels through the posterior arm in the radial groove?',
    'The deep brachial artery follows that posterior route as a branch of the brachial artery.',
    uamsArteries),
  concept('radial-artery',
    'Which forearm artery chiefly contributes to the deep palmar arch?',
    'The radial artery is the chief deep palmar arch contributor in the usual pattern.',
    ttuhscForearm),
  concept('ulnar-artery',
    'Which forearm artery chiefly forms the superficial palmar arch and gives rise to the common interosseous artery?',
    'The ulnar artery usually supplies those two routes.',
    ttuhscForearm),
  concept('common-interosseous-artery',
    'Which short branch from the ulnar artery divides into anterior and posterior interosseous arteries?',
    'The common interosseous artery is their usual parent branch.',
    ttuhscForearm),
  concept('anterior-interosseous-artery',
    'Which branch of the common interosseous artery reaches deep anterior forearm flexors?',
    'The anterior interosseous artery follows that deep route near flexor pollicis longus, flexor digitorum profundus and pronator quadratus.',
    ttuhscForearm),
  concept('axillary-vein',
    'Which vein is formed along the route where the basilic vein joins the brachial veins?',
    'The axillary vein is the usual named outflow after that union.',
    uamsVeins),
  concept('cephalic-vein',
    'Which lateral superficial upper-limb vein usually drains into the axillary vein?',
    'The cephalic vein follows the lateral superficial route and usually enters the axillary vein.',
    uamsVeins),
  concept('basilic-vein',
    'Which medial superficial upper-limb vein joins the brachial veins on the way to the axillary vein?',
    'The basilic vein follows the medial superficial route and usually joins the brachial veins.',
    uamsVeins),
];
