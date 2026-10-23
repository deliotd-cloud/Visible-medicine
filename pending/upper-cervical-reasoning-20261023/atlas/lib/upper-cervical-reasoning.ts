import pins from '../content/upper-cervical-reasoning-pins.json' with { type: 'json' };
import type { BodyStructure } from '../app/body-types';
import { sourceCanonical } from './body-source-additions';
import type { ReasoningConcept } from './reasoning-questions';

const identities = new Map(pins.entries.map(({ key, identity }) =>
  [`${key}:${identity.id}`, sourceCanonical(identity)] as const));

export function upperCervicalReasoningSourceMatches(s: BodyStructure, key: string): boolean {
  const expected = identities.get(`${key}:${s.id}`);
  return expected !== undefined && sourceCanonical(s) === expected;
}

const backReference = {
  title: 'UAMS Department of Neuroscience · muscles of the back region',
  url: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/muscle-tables/muscles-of-the-back-region/',
};
const headNeckReference = {
  title: 'Texas Tech Medical Gross Anatomy · muscles of the head and neck',
  url: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_head_neck.html',
};
const slugs = [
  'rectus-capitis-posterior-minor',
  'obliquus-capitis-superior',
  'rectus-capitis-anterior',
  'rectus-capitis-lateralis',
] as const;
type Slug = typeof slugs[number];
const limitation = ' The selected source meshes identify named anatomy; they do not establish dynamic motion or patient-specific function. Radiologist review is pending.';

function concept(slug: Slug, prompt: string, explanation: string,
  reference: ReasoningConcept['references'][number]): ReasoningConcept {
  const key = `upper-cervical-${slug}`;
  const entries = pins.entries.filter(e => e.key === key);
  if (entries.length !== 2 ||
      !entries.some(e => e.identity.laterality === 'left') ||
      !entries.some(e => e.identity.laterality === 'right') ||
      entries.some(e => e.identity.sources.length !== 1 || e.identity.sourceTree !== 'isa'))
    throw new Error(`Missing exact paired single-file source identities: ${key}`);
  return {
    key, region: 'spine', sourceRegions: entries[0].identity.regions, sourceTree: 'isa',
    bindings: entries.map(({ identity }) => ({
      fma: identity.fmaId,
      side: identity.laterality as 'left' | 'right',
      file: identity.sources[0].file,
    })),
    prompt, explanation: explanation + limitation, references: [reference],
    distractors: slugs.filter(other => other !== slug).map(other => `upper-cervical-${other}`),
    readiness: 'draft', revision: 1,
  };
}

// Original questions about usual attachments and actions, not observed motion.
export const upperCervicalReasoningConcepts: readonly ReasoningConcept[] = [
  concept('rectus-capitis-posterior-minor',
    'Which paired muscle links the posterior tubercle of C1 to the medial part of the inferior nuchal line and contributes to head extension?',
    'Rectus capitis posterior minor runs from the posterior tubercle of the atlas to the medial inferior nuchal line. Its listed action is head extension.',
    backReference),
  concept('obliquus-capitis-superior',
    'Which paired C1-to-occiput muscle arises from the atlas transverse process, extends the head, and helps form the suboccipital triangle?',
    'Obliquus capitis superior attaches from the atlas transverse process to the occipital bone above the inferior nuchal line. It is an extending muscle and a boundary of the suboccipital triangle.',
    backReference),
  concept('rectus-capitis-anterior',
    'Which paired muscle runs from the lateral mass of C1 to the basilar occiput and is associated with head flexion?',
    'Rectus capitis anterior links the atlas lateral mass to the basilar part of the occipital bone. Its listed action is head flexion, unlike the posterior extending muscles here.',
    headNeckReference),
  concept('rectus-capitis-lateralis',
    'Which paired muscle links the C1 transverse process to the occiput anterolateral to the foramen magnum and laterally bends the head?',
    'Rectus capitis lateralis has those C1 and occipital attachments. Its listed action is head lateral bending rather than the anterior flexion of rectus capitis anterior.',
    headNeckReference),
];
