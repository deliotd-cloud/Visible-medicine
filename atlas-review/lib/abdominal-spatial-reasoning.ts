import pins from '../content/abdominal-spatial-reasoning-pins.json' with { type: 'json' };
import type { BodyStructure } from '../app/body-types';
import { sourceCanonical } from './body-source-additions';
import type { ReasoningConcept } from './reasoning-questions';

const identities = new Map(pins.entries.map(({ key, identity }) =>
  [`${key}:${identity.id}`, sourceCanonical(identity)] as const));
export function abdominalSpatialReasoningSourceMatches(s: BodyStructure, key: string): boolean {
  const expected = identities.get(`${key}:${s.id}`);
  return expected !== undefined && sourceCanonical(s) === expected;
}

const upper = {
  title: 'Texas Tech anatomy tables · duodenum, pancreas, liver and gallbladder',
  url: 'https://anatomy.ttuhscep.edu/gastrointestinal_system/duodenum_tables.html',
};
const renal = {
  title: 'Texas Tech dissector answers · kidneys and retroperitoneum',
  url: 'https://anatomy.ttuhscep.edu/gastrointestinal_system/kidney_ans.html',
};
const limit = ' This source identifies supplied gross-anatomy groups, not internal passages or a patient examination. Radiologist review pending.';
function concept(slug: string, prompt: string, explanation: string,
  reference: ReasoningConcept['references'][number], distractors: string[]): ReasoningConcept {
  const key = `abdominal-spatial-${slug}`;
  const entries = pins.entries.filter(e => e.key === key);
  if (entries.length < 1 || entries.length > 2) throw new Error(`Missing unique spatial source group: ${key}`);
  const first = entries[0].identity;
  return {
    key, region: 'abdomen', sourceTissue: 'organ', sourceTree: first.sourceTree as 'isa' | 'partof',
    sourceRegions: first.regions,
    bindings: entries.map(({ identity }) => identity.sources.length === 1
      ? { fma: identity.fmaId, side: identity.laterality as 'right' | 'left' | 'unpaired', file: identity.sources[0].file }
      : { fma: identity.fmaId, side: identity.laterality as 'right' | 'left' | 'unpaired', files: identity.sources.map(s => s.file) as [string, string, ...string[]] }),
    prompt, explanation: explanation + limit, references: [reference],
    distractors, readiness: 'draft', revision: 1,
  };
}

// Original orientation questions about usual anatomy; the pinned surfaces do not
// depict the named microscopic or internal routes, and carry no clinical approval.
export const abdominalSpatialReasoningConcepts: readonly ReasoningConcept[] = [
  concept('liver',
    'Which supplied organ has the porta hepatis on its undersurface, near the gallbladder bed?',
    'The porta hepatis belongs to the liver. The nearby gallbladder is a separate organ beneath it.',
    upper, ['abdominal-spatial-pancreas', 'abdominal-stomach', 'abdominal-gallbladder']),
  concept('pancreas',
    'Which supplied organ has its head within the C-shaped duodenum and its tail directed toward the splenic hilum?',
    'That head-to-tail relationship identifies the pancreas; the selected source surface does not resolve its ducts.',
    upper, ['abdominal-spatial-liver', 'abdominal-stomach', 'abdominal-spleen']),
  concept('kidney',
    'Which paired retroperitoneal organ has a superomedial adrenal neighbour and a renal pelvis continuing as the ureter?',
    'The kidney has this relationship. Its renal pelvis is the proximal ureter; the adrenal is a separate gland.',
    renal, ['abdominal-spatial-adrenal', 'pelvic-ureter']),
  concept('adrenal',
    'Which separate gland lies above and slightly medial to a kidney, outside the renal pelvis–ureter route?',
    'The adrenal gland lies superomedial to its kidney. It is distinct from the urinary collecting route.',
    renal, ['abdominal-spatial-kidney', 'pelvic-ureter']),
];
