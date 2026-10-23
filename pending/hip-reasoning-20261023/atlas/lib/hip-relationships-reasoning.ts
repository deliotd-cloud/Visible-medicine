import pins from '../content/hip-relationships-reasoning-pins.json' with { type: 'json' };
import type { BodyStructure } from '../app/body-types';
import { sourceCanonical } from './body-source-additions';
import type { ReasoningConcept } from './reasoning-questions';

const identities = new Map(pins.entries.map(({ key, identity }) =>
  [`${key}:${identity.id}`, sourceCanonical(identity)] as const));

export function hipRelationshipsReasoningSourceMatches(s: BodyStructure, key: string): boolean {
  const expected = identities.get(`${key}:${s.id}`);
  return expected !== undefined && sourceCanonical(s) === expected;
}

const uw = (slug: string, name: string): ReasoningConcept['references'][number] => ({
  title: `University of Washington Radiology · ${name}`,
  url: `https://rad.uw.edu/muscle-atlas/${slug}`,
});
const lowerLimb = {
  title: 'UAMS Department of Neuroscience · muscles of the lower limb',
  url: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/muscle-tables/muscles-of-the-lower-limb/',
};
const slugs = [
  'obturator-externus', 'gluteus-minimus', 'tensor-fasciae-latae',
] as const;
type Slug = typeof slugs[number];
const knownDistractors = [
  'limb-obturator-internus', 'limb-quadratus-femoris', 'limb-gemellus-inferior',
  'limb-piriformis', 'hip-relationships-obturator-externus',
  'hip-relationships-gluteus-minimus',
] as const;
type Distractor = typeof knownDistractors[number];
const limitation = ' These source meshes identify named structures, but do not establish their attachments, route, or function in an individual; dynamic motion is not represented. Revision-bound radiologist review is pending.';

function concept(slug: Slug, prompt: string, explanation: string,
  references: ReasoningConcept['references'], distractors: readonly Distractor[]): ReasoningConcept {
  const key = `hip-relationships-${slug}`;
  const entries = pins.entries.filter(e => e.key === key);
  const expectedRegions = slug === 'tensor-fasciae-latae' ? ['thigh'] : ['thigh', 'pelvis'];
  if (entries.length !== 2 ||
      !entries.some(e => e.identity.laterality === 'left') ||
      !entries.some(e => e.identity.laterality === 'right') ||
      entries.some(e => e.identity.region !== 'thigh' || e.identity.category !== 'muscle' ||
        e.identity.sources.length !== 1 || e.identity.sourceTree !== 'isa' ||
        JSON.stringify(e.identity.regions) !== JSON.stringify(expectedRegions)) ||
      distractors.length !== 3 || new Set(distractors).size !== 3 ||
      distractors.some(other => other === key || !knownDistractors.includes(other)))
    throw new Error(`Invalid paired source or distractor identities: ${key}`);
  return {
    key, region: 'thigh', sourceRegions: entries[0].identity.regions, sourceTree: 'isa',
    bindings: entries.map(({ identity }) => ({
      fma: identity.fmaId,
      side: identity.laterality as 'left' | 'right',
      file: identity.sources[0].file,
    })),
    prompt, explanation: explanation + limitation, references,
    distractors,
    readiness: 'draft', revision: 1,
  };
}

// Original teaching prompts about reference anatomy, not observations of motion.
export const hipRelationshipsReasoningConcepts: readonly ReasoningConcept[] = [
  concept('obturator-externus',
    'Which muscle arises from the external side of the obturator membrane and reaches the trochanteric fossa?',
    'Obturator externus begins on the external membrane and surrounding obturator rim, then attaches at the trochanteric fossa.',
    [uw('obturator-externus', 'obturator externus'), lowerLimb],
    ['limb-obturator-internus', 'limb-quadratus-femoris', 'limb-gemellus-inferior']),
  concept('gluteus-minimus',
    'Which muscle spans the outer ilium to the anterior greater trochanter and combines hip abduction with medial rotation?',
    'Gluteus minimus arises from the outer ilium and attaches to the anterior greater trochanter; its listed actions include abduction and medial rotation.',
    [uw('gluteus-minimus', 'gluteus minimus')],
    ['limb-piriformis', 'limb-obturator-internus', 'limb-quadratus-femoris']),
  concept('tensor-fasciae-latae',
    'Which anterior iliac muscle attaches into the iliotibial tract, creating tension along the lateral thigh toward the knee?',
    'Tensor fasciae latae starts near the anterior superior iliac spine and anterior crest and inserts into the iliotibial tract, which helps steady the hip and knee.',
    [uw('tensor-fascia-lata', 'tensor fascia lata')],
    ['hip-relationships-gluteus-minimus', 'limb-piriformis', 'hip-relationships-obturator-externus']),
];
