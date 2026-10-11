import pins from '../content/thoracic-branch-imaging-pins.json' with {type: 'json'};
import {thoracicWallArterialXrayTopics} from '../content/thoracic-wall-arterial-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected = {
  'right-internal-thoracic-artery': 'FMA3969',
  'left-internal-thoracic-artery': 'FMA4068',
  'right-musculophrenic-artery': 'FMA10692',
  'left-musculophrenic-artery': 'FMA4077',
  'right-superior-epigastric-artery': 'FMA3988',
  'left-superior-epigastric-artery': 'FMA4083',
} as const;
type Topic = keyof typeof thoracicWallArterialXrayTopics;
const entries = pins.entries.filter(e => Object.hasOwn(expected, e.group));
if (entries.length !== 6 || new Set(entries.map(e => e.identity.id)).size !== 6 ||
    Object.entries(expected).some(([group, fma]) =>
      entries.filter(e => e.group === group && e.identity.fmaId === fma &&
        e.identity.region === 'thorax' && e.identity.system === 'vessels' &&
        e.identity.laterality === group.split('-')[0]).length !== 1))
  throw Error('Expected six exact thoracic wall arterial source identities');
const bindings = new Map(entries.map(e => [e.identity.id, {
  signature: sourceCanonical(e.identity),
  topic: e.group.replace(/^(left|right)-/, '') as Topic,
  anatomy: e.anatomy,
}]));

/** Source-bound orientation only; never a patient projection or graft model. */
export function thoracicWallArterialXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = thoracicWallArterialXrayTopics[binding.topic];
  const limitation = binding.anatomy.bullets?.find(b => !b.startsWith('Source identity:'));
  return {
    readiness: 'draft', title: `${s.name} · ${topic.title} · draft`, body: topic.body,
    bullets: [
      ...topic.bullets,
      ...(limitation ? [limitation] : []),
      'Plain chest radiography does not trace these small arterial lumens. Contrast catheter angiography and DSA use X-rays; CT angiography and MR angiography are different examinations. No acquired image is supplied here.',
      `The selected atlas segment is ${s.laterality}-sided. Confirm the patient side and projection from the acquired study, not its screen position or the rotated model.`,
      'Reassemble before comparing relationships. Surface ends, calibre, colour and separation do not establish continuous branches, flow, a patient measurement or spatial registration.',
    ],
    citations: [...new Set(topic.citations)],
    note: 'Original source-bound educational draft; revision-bound radiologist review pending. No acquired angiogram, publisher image, patient scan, procedural route, graft validation, clinical approval or patient-space registration is included. Atlas, Education case and paid-lecture access remain independent.',
  };
}
