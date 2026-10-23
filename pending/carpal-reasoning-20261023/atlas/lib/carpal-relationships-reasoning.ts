import pins from '../content/carpal-relationships-reasoning-pins.json' with { type: 'json' };
import type { BodyStructure } from '../app/body-types';
import { sourceCanonical } from './body-source-additions';
import type { ReasoningConcept } from './reasoning-questions';

const identities = new Map(pins.entries.map(({ key, identity }) =>
  [`${key}:${identity.id}`, sourceCanonical(identity)] as const));

/** Full displayed source record, not a name/FMA-only or mirrored admission. */
export function carpalRelationshipsReasoningSourceMatches(s: BodyStructure, key: string): boolean {
  const expected = identities.get(`${key}:${s.id}`);
  return expected !== undefined && sourceCanonical(s) === expected;
}

const slugs = ['scaphoid', 'lunate', 'triquetrum', 'pisiform'] as const;
type Slug = typeof slugs[number];
const texas = {
  title: 'Texas Tech University Health Sciences Center El Paso · upper-limb bones',
  url: 'https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html',
};
const utah = {
  title: 'University of Utah Digital Dissector · wrist and hand osteology',
  url: 'https://anatomy.med.utah.edu/diganat/anatomy_tutorials/digital_dissector/index.php?add=/wrist_hand&lab=29&menu=29+WristHand&selectsize=Large&textsize=Small',
};
const limitation = ' These are reference-anatomy relationships, not patient-specific measurements or validated joint motion. Named meshes do not establish cartilage, tendon continuity or scan visibility. Revision-bound radiologist review remains pending.';

function concept(slug: Slug, prompt: string, explanation: string,
  reference: ReasoningConcept['references'][number]): ReasoningConcept {
  const key = `carpal-relationships-${slug}`;
  const entries = pins.entries.filter(e => e.key === key);
  if (entries.length !== 2 ||
      !entries.some(e => e.identity.laterality === 'left') ||
      !entries.some(e => e.identity.laterality === 'right') ||
      entries.some(e => e.identity.region !== 'hand' ||
        JSON.stringify(e.identity.regions) !== JSON.stringify(['hand']) ||
        e.identity.system !== 'skeleton' || e.identity.category !== 'bone' ||
        e.identity.sourceTree !== 'isa' || e.identity.bundle !== 'hand-skeleton' ||
        e.identity.sources.length !== 1))
    throw new Error(`Invalid paired carpal source identities: ${key}`);
  return {
    key, sourceTissue: 'bone', region: 'hand', sourceRegions: ['hand'], sourceTree: 'isa',
    bindings: entries.map(({ identity }) => ({
      fma: identity.fmaId,
      side: identity.laterality as 'left' | 'right',
      file: identity.sources[0].file,
    })),
    prompt, explanation: explanation + limitation,
    references: [reference],
    distractors: slugs.filter(other => other !== slug).map(other => `carpal-relationships-${other}`),
    readiness: 'draft', revision: 1,
  };
}

// Original prompts over eight existing source bones, not publisher questions.
// The catalogue's "triquetral" display name is retained; triquetrum is a synonym.
export const carpalRelationshipsReasoningConcepts: readonly ReasoningConcept[] = [
  concept('scaphoid',
    'Which proximal-row carpal is boat-shaped and has a tubercle on its palmar surface toward the thumb?',
    'The scaphoid has a palm-facing tubercle on its radial side. The lunate has a crescent outline, whereas the triquetrum is three-sided and the pisiform is a sesamoid.',
    utah),
  concept('lunate',
    'Which proximal-row carpal lies between scaphoid and triquetrum and receives the capitate head in its concavity?',
    'Lunate occupies this intermediate position. Its distal concavity accommodates the head of capitate, rather than being the separate palmar sesamoid.',
    texas),
  concept('triquetrum',
    'Which proximal-row bone is immediately deep to the pisiform on the ulnar side of the wrist?',
    'The pisiform sits palmar to and articulates with the triquetrum. This palmar-deep relationship differs from the scaphoid-lunate order across the proximal row.',
    texas),
  concept('pisiform',
    'Which carpal is a sesamoid within the flexor carpi ulnaris tendon and contacts the triquetrum?',
    'Pisiform is incorporated into that tendon and meets the triquetrum. It should not be mistaken for the triquetrum simply because the two are adjacent.',
    utah),
];
