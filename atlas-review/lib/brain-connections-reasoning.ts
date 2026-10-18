import pins from '../content/brain-connections-reasoning-pins.json' with { type: 'json' };
import type { BodyStructure } from '../app/body-types';
import { sourceCanonical } from './body-source-additions';
import type { ReasoningConcept } from './reasoning-questions';

const identities = new Map(pins.entries.map(({ key, identity }) =>
  [`${key}:${identity.id}`, sourceCanonical(identity)] as const));
export function brainConnectionsReasoningSourceMatches(s: BodyStructure, key: string): boolean {
  const expected = identities.get(`${key}:${s.id}`);
  return expected !== undefined && sourceCanonical(s) === expected;
}

const temporal = {
  title: 'UTHealth Neuroanatomy Online · medial temporal structures',
  url: 'https://nba.uth.tmc.edu/neuroanatomy/L10/Lab10p21_index.html',
};
const connections = {
  title: 'UTHealth Neuroanatomy Online · cerebral connections',
  url: 'https://nba.uth.tmc.edu/neuroanatomy/L10/Lab10p18_index.html',
};
const limit = ' Source surfaces do not trace axons or establish patient registration. Radiologist review pending.';
function concept(slug: string, prompt: string, explanation: string,
  reference: ReasoningConcept['references'][number], alternatives: string[]): ReasoningConcept {
  const key = `brain-connections-${slug}`;
  const entries = pins.entries.filter(e => e.key === key);
  if (entries.length < 1 || entries.length > 2) throw new Error(`Missing unique concept group: ${key}`);
  const first = entries[0].identity;
  return {
    key, region: 'head-neck', sourceTissue: 'neural-organ', sourceTree: 'isa',
    sourceRegions: first.regions,
    bindings: entries.map(({ identity }) => ({
      fma: identity.fmaId, side: identity.laterality as 'right' | 'left' | 'midline',
      file: identity.sources[0].file,
    })),
    prompt, explanation: explanation + limit, references: [reference],
    distractors: alternatives, readiness: 'draft', revision: 1,
  };
}

// Original draft questions about usual anatomy; meshes identify whole structures only.
export const brainConnectionsReasoningConcepts: readonly ReasoningConcept[] = [
  concept('amygdala',
    'Moving posteriorly through medial temporal coronal sections, which supplied structure is encountered before the hippocampus?',
    'The amygdala is encountered earlier in this reference sequence. Its selected surface cannot establish internal nuclei.',
    temporal, ['brain-connections-fornix', 'deep-brain-caudate', 'deep-brain-thalamus']),
  concept('fornix',
    'Which supplied structure arches below the corpus callosum as a hippocampal connection?',
    'The fornix forms that curved pathway. The selection cannot demonstrate individual fibres or circuit function.',
    connections, ['brain-connections-amygdala', 'deep-brain-caudate', 'deep-brain-thalamus']),
  concept('anterior-commissure',
    'When distinguishing the broad callosal bridge from a smaller anterior crossing, which structure interconnects the middle and inferior temporal gyri?',
    'The anterior commissure carries these temporal connections across the midline. Its surface cannot resolve fibre destinations.',
    connections, ['brain-connections-corpus-callosum']),
  concept('corpus-callosum',
    'Which supplied midline structure is the broad commissural connection between the cerebral hemispheres?',
    'The corpus callosum connects the hemispheres. Its surface cannot resolve individual interhemispheric fibres.',
    connections, ['brain-connections-anterior-commissure']),
];
