import pins from '../content/lower-arterial-reasoning-pins.json' with { type: 'json' };
import type { BodyStructure } from '../app/body-types';
import { sourceCanonical } from './body-source-additions';
import type { ReasoningConcept } from './reasoning-questions';

const signatures = new Map(pins.entries.map(({ key, identity }) =>
  [`${key}:${identity.id}`, sourceCanonical(identity)] as const));

/** Admit only a complete pinned source record, including ordered source files and hashes. */
export function lowerArterialReasoningSourceMatches(s: BodyStructure, key: string): boolean {
  const expected = signatures.get(`${key}:${s.id}`);
  return expected !== undefined && sourceCanonical(s) === expected;
}

const slugs = [
  'femoral-artery', 'deep-femoral-artery',
  'descending-lateral-circumflex-femoral-artery',
  'popliteal-artery', 'anterior-tibial-artery', 'posterior-tibial-artery',
] as const;
type Slug = typeof slugs[number];
type Region = 'thigh' | 'leg';
const sourceMembership: Record<Slug, { region: Region; regions: readonly string[]; bundle: string; tree: 'isa' | 'partof' }> = {
  'femoral-artery': { region: 'thigh', regions: ['thigh', 'pelvis', 'leg'], bundle: 'thigh-vessels-recovery', tree: 'isa' },
  'deep-femoral-artery': { region: 'thigh', regions: ['thigh', 'pelvis', 'leg'], bundle: 'thigh-vessels-recovery', tree: 'partof' },
  'descending-lateral-circumflex-femoral-artery': { region: 'thigh', regions: ['thigh', 'leg'], bundle: 'circumflex-femoral', tree: 'isa' },
  'popliteal-artery': { region: 'leg', regions: ['leg', 'foot'], bundle: 'leg-vessels-recovery', tree: 'isa' },
  'anterior-tibial-artery': { region: 'leg', regions: ['leg', 'foot'], bundle: 'leg-vessels-recovery', tree: 'isa' },
  'posterior-tibial-artery': { region: 'leg', regions: ['leg', 'foot'], bundle: 'leg-vessels-recovery', tree: 'isa' },
};
const alternatives: Record<Slug, readonly string[]> = {
  'femoral-artery': ['lower-arterial-deep-femoral-artery', 'lower-arterial-descending-lateral-circumflex-femoral-artery', 'lower-venous-femoral-vein'],
  'deep-femoral-artery': ['lower-arterial-femoral-artery', 'lower-arterial-descending-lateral-circumflex-femoral-artery', 'lower-venous-femoral-vein'],
  'descending-lateral-circumflex-femoral-artery': ['lower-arterial-femoral-artery', 'lower-arterial-deep-femoral-artery', 'lower-venous-femoral-vein'],
  'popliteal-artery': ['lower-arterial-anterior-tibial-artery', 'lower-arterial-posterior-tibial-artery', 'lower-venous-popliteal-vein'],
  'anterior-tibial-artery': ['lower-arterial-popliteal-artery', 'lower-arterial-posterior-tibial-artery', 'lower-venous-popliteal-vein'],
  'posterior-tibial-artery': ['lower-arterial-popliteal-artery', 'lower-arterial-anterior-tibial-artery', 'lower-venous-popliteal-vein'],
};
const uams = {
  title: 'University of Arkansas for Medical Sciences · Arteries of the lower limb',
  url: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-lower-limb/',
};
const thigh = {
  title: 'Texas Tech University Health Sciences Center El Paso · Anterior and medial thigh anatomy',
  url: 'https://anatomy.ttuhscep.edu/musculoskeletal_system/thigh_tables.html',
};
const posterior = {
  title: 'Texas Tech University Health Sciences Center El Paso · Hip, posterior thigh and leg anatomy',
  url: 'https://anatomy.ttuhscep.edu/musculoskeletal_system/gluteal_tables.html',
};
const limitation = ' Whole source surfaces do not independently verify junctions or branch variants. Educational draft pending revision-bound radiologist sign-off.';

function concept(slug: Slug, prompt: string, explanation: string, references: ReasoningConcept['references']): ReasoningConcept {
  const key = `lower-arterial-${slug}`;
  const entries = pins.entries.filter(entry => entry.key === key);
  const membership = sourceMembership[slug];
  const distractors = alternatives[slug];
  if (entries.length !== 2 ||
      entries[0].identity.laterality !== 'right' || entries[1].identity.laterality !== 'left' ||
      entries.some(({ identity }) => identity.sourceTree !== membership.tree ||
        identity.region !== membership.region ||
        JSON.stringify(identity.regions) !== JSON.stringify(membership.regions) ||
        identity.bundle !== membership.bundle || identity.system !== 'vessels' ||
        identity.category !== 'vessel' ||
        identity.sources.length !== (slug === 'deep-femoral-artery' ? 2 : 1) ||
        identity.sources.some(source => !source.file || !/^[a-f0-9]{64}$/.test(source.sha256))) ||
      distractors.length !== 3 || new Set(distractors).size !== 3 || distractors.includes(key))
    throw new Error(`Invalid paired lower arterial source or alternatives: ${key}`);
  return {
    key, region: membership.region, sourceRegions: membership.regions,
    sourceTissue: 'vessel', sourceTree: membership.tree,
    bindings: entries.map(({ identity }) => identity.sources.length === 1
      ? { fma: identity.fmaId, side: identity.laterality as 'left' | 'right', file: identity.sources[0].file }
      : { fma: identity.fmaId, side: identity.laterality as 'left' | 'right', files: identity.sources.map(source => source.file) as [string, string, ...string[]] }),
    prompt, explanation: explanation + limitation, references,
    distractors, readiness: 'draft', revision: 1,
  };
}

// Original formative questions about usual named anatomy; no source figures or question text imported.
export const lowerArterialReasoningConcepts: readonly ReasoningConcept[] = [
  concept('femoral-artery',
    'Which named thigh artery continues the external iliac artery below the inguinal ligament and becomes the popliteal artery at the adductor hiatus?',
    'The femoral artery has those two usual name transitions. The deep femoral artery branches from it in the thigh.',
    [thigh]),
  concept('deep-femoral-artery',
    'Which named branch of the femoral artery gives rise to circumflex femoral and perforating branches associated with the posterior thigh?',
    'The deep femoral artery is the usual parent of these branches and is a principal arterial route to posterior thigh muscles. Branch origins can vary.',
    [posterior]),
  concept('descending-lateral-circumflex-femoral-artery',
    'Which selected artery belongs to the lateral circumflex branch system, rather than continuing the main femoral route through the adductor hiatus?',
    'The descending lateral circumflex femoral branch belongs to that side-branch system. It is not the femoral trunk continuation behind the knee.',
    [thigh]),
  concept('popliteal-artery',
    'Which named artery continues the femoral artery behind the knee after the adductor hiatus and gives rise to tibial arteries?',
    'The popliteal artery is the usual arterial segment at the back of the knee, proximal to the anterior and posterior tibial pathways.',
    [posterior]),
  concept('anterior-tibial-artery',
    'Which tibial artery takes the anterior leg route and continues at the ankle as the dorsalis pedis artery?',
    'The anterior tibial artery follows the anterior leg and is continuous with dorsalis pedis at the ankle.',
    [uams]),
  concept('posterior-tibial-artery',
    'Which tibial artery follows the posterior leg and gives rise to the medial and lateral plantar arteries?',
    'The posterior tibial artery follows the posterior leg and usually divides into medial and lateral plantar branches on the medial side of the foot.',
    [posterior]),
];
