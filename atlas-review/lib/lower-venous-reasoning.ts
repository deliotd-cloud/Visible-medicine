import pins from '../content/lower-venous-reasoning-pins.json' with { type: 'json' };
import type { BodyStructure } from '../app/body-types';
import { sourceCanonical } from './body-source-additions';
import type { ReasoningConcept } from './reasoning-questions';

const bound = new Map(pins.entries.map(({key, identity}) => [`${key}:${identity.id}`, sourceCanonical(identity)] as const));
export function lowerVenousReasoningSourceMatches(s: BodyStructure, key: string): boolean {
  const expected = bound.get(`${key}:${s.id}`);
  return expected !== undefined && sourceCanonical(s) === expected;
}
const posterior = {title: 'TTUHSC · Posterior lower-limb anatomy', url: 'https://anatomy.ttuhscep.edu/musculoskeletal_system/gluteal_tables.html'};
const medial = {title: 'TTUHSC · Anterior and medial thigh anatomy', url: 'https://anatomy.ttuhscep.edu/musculoskeletal_system/thigh_tables.html'};
const nomenclature = {title: 'Meissner et al. · Lower-extremity venous anatomy (2007; anatomy reference only)', url: 'https://med.stanford.edu/content/dam/sm/vascular/documents/endovasc/guidelines/hemodynamics_and_diagnosis_venous_disease-jvs_1207.pdf'};
const pelvic = {title: 'Dao and Le · Anatomy, Abdomen and Pelvis: Veins', url: 'https://www.ncbi.nlm.nih.gov/books/NBK554574/'};
const scope = ' No lumen, flow, reflux, compressibility, thrombosis or patient registration is established. Radiologist review pending.';
function concept(name: string, prompt: string, explanation: string, references: ReasoningConcept['references'], distractors: string[]): ReasoningConcept {
  const key = 'lower-venous-' + name;
  const entries = pins.entries.filter(e => e.key === key);
  const first = entries[0].identity;
  return {key, region: first.region as ReasoningConcept['region'], sourceTissue: 'vessel', sourceTree: 'isa', sourceRegions: first.regions,
    bindings: entries.map(({identity: s}) => ({fma: s.fmaId, side: s.laterality as 'right' | 'left',
      ...(s.sources.length === 1 ? {file: s.sources[0].file} : {files: s.sources.map(f => f.file) as [string, string, ...string[]]})})),
    prompt, explanation: explanation + scope, references, distractors: distractors.map(d => 'lower-venous-' + d), readiness: 'draft', revision: 1};
}
// Original factual teaching; no publisher illustrations, tables or question-bank text imported.
export const lowerVenousReasoningConcepts: readonly ReasoningConcept[] = [
  concept('small-saphenous-vein',
    'Which supplied superficial vein follows the posterior leg and commonly drains into the deep vein behind the knee?',
    'The small saphenous vein commonly reaches the popliteal vein. Its termination varies; the displayed surfaces do not independently delineate a junction or prove that a particular variant is present.',
    [posterior, nomenclature], ['popliteal-vein', 'great-saphenous-vein', 'femoral-vein']),
  concept('popliteal-vein',
    'Which supplied deep venous segment lies at the knee and continues proximally as the femoral vein, rather than representing superficial posterior-leg drainage?',
    'The popliteal vein is deep and continues as the femoral vein through the adductor hiatus. The small saphenous vein is superficial; their usual junction is not independently source-labelled here.',
    [posterior, medial], ['small-saphenous-vein', 'femoral-vein', 'great-saphenous-vein']),
  concept('femoral-vein',
    'Which supplied thigh vein continues the deep popliteal pathway, despite an older misleading name that included the word superficial?',
    'The femoral vein is deep. The older term superficial femoral vein can misleadingly suggest a superficial vessel such as the great saphenous vein. No separate common-femoral junction is delineated.',
    [nomenclature, medial], ['great-saphenous-vein', 'popliteal-vein', 'common-iliac-vein']),
  concept('great-saphenous-vein',
    'Which supplied superficial vein follows the medial lower limb and usually drains proximally into the femoral venous system?',
    'The great saphenous vein drains the superficial medial limb; the small saphenous follows a posterior route. The saphenofemoral junction and tributaries are not separately delineated here.',
    [medial], ['femoral-vein', 'small-saphenous-vein', 'external-iliac-vein']),
  concept('external-iliac-vein',
    'Which supplied pelvic vein continues the common femoral pathway above the inguinal ligament, before joining the internal iliac vein?',
    'The external iliac vein carries lower-limb venous return into the pelvis and joins the internal iliac vein to form the common iliac vein. The left selection preserves its four source files as one aggregate, not four independently validated tributaries.',
    [pelvic], ['common-iliac-vein', 'femoral-vein', 'great-saphenous-vein']),
  concept('common-iliac-vein',
    'Which supplied pelvic vein is normally formed by union of the external and internal iliac veins, with its opposite-side counterpart contributing to the inferior vena cava?',
    'Each common iliac vein collects external and internal iliac drainage. The right and left common iliac veins unite into the inferior vena cava. This question tests usual anatomy, not a source-proven junction, collateral pathway or compression diagnosis.',
    [pelvic], ['external-iliac-vein', 'popliteal-vein', 'small-saphenous-vein']),
];
