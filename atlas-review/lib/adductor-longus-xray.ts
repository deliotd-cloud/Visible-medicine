import pins from '../content/hip-imaging-pins.json' with { type: 'json' };
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const caseReport = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4397006/';
const selected = new Map<string, { id: string; side: 'left' | 'right'; file: string }>([
  ['FMA22456', { id: 'vm:anatomy:body:thigh:right:muscle:right-adductor-longus', side: 'right', file: 'FJ1402' }],
  ['FMA22457', { id: 'vm:anatomy:body:thigh:left:muscle:left-adductor-longus', side: 'left', file: 'FJ1402M' }],
]);
const bindings = new Map(
  pins.entries.flatMap(({ identity }) => {
    const expected = selected.get(identity.fmaId);
    return expected && identity.id === expected.id && identity.laterality === expected.side &&
      identity.region === 'thigh' && identity.system === 'muscles' && identity.category === 'muscle' &&
      identity.sourceTree === 'isa' && identity.sources.length === 1 &&
      identity.sources[0].file === expected.file
      ? [[identity.id, { signature: sourceCanonical(identity), side: expected.side }] as const]
      : [];
  }),
);

/** Two exact-source selections; this is an X-ray orientation draft, not a case interpretation. */
export function adductorLongusXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · X-ray relationship · draft`,
    body: 'Use the pubic bone and proximal femur as bony context for the adductor longus region on a pelvic or hip radiograph. A 2015 single-adult case report described pelvic and right-hip radiographs without osseous abnormality, while MRI showed an intramuscular adductor longus rupture without retraction. That case illustrates a normal-bone-film limitation; it does not estimate X-ray sensitivity or establish a screening rule.',
    bullets: [
      `The ${binding.side} Atlas source label identifies the model only. Check the radiograph's actual side marker and projection; the model side is not a patient-side match.`,
      'Projection does not outline this individual muscle or prove tendon continuity. Do not infer absence of soft-tissue injury from an unremarkable bony film.',
      'No acquired X-ray, attenuation simulation or patient registration is supplied.',
    ],
    citations: [caseReport],
    note: 'Original, source-bound teaching draft for anatomical orientation. Radiologist sign-off remains pending for this exact source and teaching revision; no clinical approval or diagnostic interpretation is implied. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
