import pins from '../content/hip-imaging-pins.json' with { type: 'json' };
import { umProximalTopicCompletion } from '../content/um-proximal-topic-completion';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const acrAcuteHip = 'https://acsearch.acr.org/docs/3082587/narrative';
const selected = new Map<string, { id: string; side: 'left' | 'right'; slug: string }>([
  ['FMA22452', { id: 'vm:anatomy:body:thigh:right:muscle:right-adductor-brevis', side: 'right', slug: 'adductor-brevis' }],
  ['FMA22454', { id: 'vm:anatomy:body:thigh:left:muscle:left-adductor-brevis', side: 'left', slug: 'adductor-brevis' }],
  ['FMA22459', { id: 'vm:anatomy:body:thigh:right:muscle:right-adductor-magnus', side: 'right', slug: 'adductor-magnus' }],
  ['FMA22460', { id: 'vm:anatomy:body:thigh:left:muscle:left-adductor-magnus', side: 'left', slug: 'adductor-magnus' }],
  ['FMA43883', { id: 'vm:anatomy:body:thigh:right:muscle:right-gracilis', side: 'right', slug: 'gracilis' }],
  ['FMA43884', { id: 'vm:anatomy:body:thigh:left:muscle:left-gracilis', side: 'left', slug: 'gracilis' }],
  ['FMA22338', { id: 'vm:anatomy:body:thigh:right:muscle:right-quadratus-femoris', side: 'right', slug: 'quadratus-femoris' }],
  ['FMA22339', { id: 'vm:anatomy:body:thigh:left:muscle:left-quadratus-femoris', side: 'left', slug: 'quadratus-femoris' }],
]);
const bindings = new Map(
  pins.entries.flatMap(({ identity }) => {
    const expected = selected.get(identity.fmaId);
    return expected && identity.id === expected.id && identity.laterality === expected.side &&
      identity.region === 'thigh' && identity.system === 'muscles' && identity.category === 'muscle'
      ? [[identity.id, { signature: sourceCanonical(identity), ...expected }] as const]
      : [];
  }),
);

/** Eight retained, exact-source thigh muscle selections; X-ray reading remains draft. */
export function hipMuscleXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const teaching = umProximalTopicCompletion[binding.slug]?.xray;
  if (!teaching?.body || !teaching.references?.length) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · X-ray relationship · draft`,
    body: teaching.body,
    bullets: [
      `Orient the ${binding.side} source-labelled reference surface to neighbouring bone. Verify the actual radiograph's side marker and projection; the model side is not a patient-side match.`,
      'A projected bony landmark does not outline this individual muscle. A normal radiograph does not establish intact muscle or tendon, nor exclude oedema or other soft-tissue injury.',
      'No acquired X-ray, detector geometry, attenuation simulation or patient registration is supplied.',
    ],
    citations: [...teaching.references, acrAcuteHip],
    note: 'Original source-bound draft for anatomical orientation only. Radiologist review is pending for this exact source and teaching revision; no clinical approval or diagnostic interpretation is implied. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
