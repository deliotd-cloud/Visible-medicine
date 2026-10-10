import pins from '../content/abdominal-vessel-reasoning-pins.json' with {type: 'json'};
import type {BodyStructure} from '../app/body-types';
import {sourceCanonical} from './body-source-additions';
import type {ReasoningConcept} from './reasoning-questions';

const bound = new Map(pins.entries.map(({key, identity}) => [`${key}:${identity.id}`, sourceCanonical(identity)] as const));
export function abdominalVesselReasoningSourceMatches(s: BodyStructure, key: string): boolean {
  const expected = bound.get(`${key}:${s.id}`);
  return expected !== undefined && sourceCanonical(s) === expected;
}

const arteries = {title: 'TTUHSC El Paso · Arteries of the abdomen', url: 'https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html'};
const hindgut = {title: 'UAMS · Arteries of the abdomen', url: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-abdomen/'};
const veins = {title: 'TTUHSC El Paso · Veins of the abdomen', url: 'https://anatomy.ttuhscep.edu/anatomytables/veins_abdomen.html'};
const limit = ' These source surfaces do not establish branch junctions, lumen continuity, flow, perfusion or patient anatomy. Radiologist review pending.';
function concept(slug: string, prompt: string, explanation: string, references: ReasoningConcept['references'], alternatives: string[]): ReasoningConcept {
  const key = `abdominal-vessel-${slug}`;
  const entries = pins.entries.filter(e => e.key === key);
  if (entries.length !== 1) throw new Error(`Missing unique pin: ${key}`);
  const identity = entries[0].identity;
  return {
    key, region: identity.region as ReasoningConcept['region'], sourceTissue: 'vessel', sourceTree: 'isa', sourceRegions: identity.regions,
    bindings: [{fma: identity.fmaId, side: identity.laterality as 'midline' | 'unspecified',
      ...(identity.sources.length === 1 ? {file: identity.sources[0].file} : {files: identity.sources.map(s => s.file) as [string, string, ...string[]]})}],
    prompt, explanation: explanation + limit, references,
    distractors: alternatives.map(s => `abdominal-vessel-${s}`), readiness: 'draft', revision: 1,
  };
}

// Original teaching prompts. Source records are selected segments, not a connected vessel graph.
export const abdominalVesselReasoningConcepts: readonly ReasoningConcept[] = [
  concept('celiac-artery',
    'Which supplied artery usually gives the left gastric, splenic and common hepatic arteries for foregut territory?',
    'The celiac artery is the usual foregut trunk. Its three named branches are described by the reference; their junctions are not independently verified by these surfaces.',
    [arteries], ['inferior-mesenteric-artery', 'hepatic-portal-vein', 'inferior-vena-cava']),
  concept('superior-mesenteric-artery',
    'Which supplied artery is associated with midgut territory, including the jejunum, ileum and proximal colon?',
    'The superior mesenteric artery is the usual midgut arterial route. The displayed record does not establish every branch or its territory in an individual.',
    [arteries], ['abdominal-aorta']),
  concept('inferior-mesenteric-artery',
    'Which supplied artery gives the usual left colic, sigmoid and superior rectal routes toward distal colonic territory?',
    'The inferior mesenteric artery serves much of the hindgut territory through those branches. Their exact junctions are not source-validated here.',
    [hindgut], ['celiac-artery', 'hepatic-portal-vein', 'inferior-vena-cava']),
  concept('hepatic-portal-vein',
    'Which supplied vein carries gut and splenic venous return toward the liver, rather than directly to the right atrium?',
    'The hepatic portal vein is usually formed by the superior mesenteric and splenic veins and enters the liver. Its junction is not established by the selected surface.',
    [veins], ['inferior-vena-cava', 'celiac-artery', 'inferior-mesenteric-artery']),
  concept('abdominal-aorta',
    'Which supplied midline arterial trunk continues from the thoracic aorta and gives the major unpaired abdominal gut arteries?',
    'The abdominal aorta is the proximal arterial source of the celiac and mesenteric arteries. Their branch origins are anatomical teaching, not individually verified surface junctions.',
    [hindgut], ['superior-mesenteric-artery']),
  concept('inferior-vena-cava',
    'Which supplied vein receives systemic return from the common iliac veins and continues toward the right atrium?',
    'The inferior vena cava is normally formed by the common iliac veins and drains to the right atrium. Portal blood instead reaches the liver first; no selected junction is verified here.',
    [veins], ['hepatic-portal-vein', 'celiac-artery', 'inferior-mesenteric-artery']),
];
