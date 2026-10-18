import pins from '../content/thoracic-branch-imaging-pins.json' with {type: 'json'};
import {thoracicMediastinalArterialXrayTopics} from '../content/thoracic-mediastinal-arterial-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected = {
  'brachiocephalic-artery': 'FMA3932',
  'bronchial-artery': 'FMA68109',
  'variant-bronchial-artery': 'FMA10704',
  'esophageal-artery': 'FMA4149',
  'esophageal-branches': 'FMA71537',
} as const;
type Topic = keyof typeof expected;
const entries = pins.entries.filter(e => Object.hasOwn(expected, e.group));
if (entries.length !== 5 || new Set(entries.map(e => e.identity.id)).size !== 5 ||
    Object.entries(expected).some(([group, fma]) =>
      entries.filter(e => e.group === group && e.identity.fmaId === fma &&
        e.identity.region === 'thorax' && e.identity.system === 'vessels' &&
        e.identity.category === 'vessel' && e.identity.laterality === 'midline').length !== 1))
  throw Error('Expected five exact thoracic mediastinal arterial source identities');
const bindings = new Map(entries.map(e => [e.identity.id, {
  signature: sourceCanonical(e.identity), topic: e.group as Topic, anatomy: e.anatomy,
}]));

/** Source-bound orientation only; no acquired image or procedural simulation. */
export function thoracicMediastinalArterialXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = thoracicMediastinalArterialXrayTopics[binding.topic];
  const limitation = binding.anatomy.bullets?.find(b => !b.startsWith('Source identity:'));
  return {
    readiness: 'draft', title: `${s.name} · ${topic.title} · draft`, body: topic.body,
    bullets: [
      ...topic.bullets,
      ...(limitation ? [limitation] : []),
      'Contrast catheter angiography and digital subtraction angiography (DSA) use X-rays. Plain chest radiography does not trace these arterial branching lumens; CT angiography and MR angiography are different examinations. No acquired image is supplied here.',
      'Confirm patient side, projection and contrast phase on the acquired study. Midline is the retained source classification, not a claim that every branch is central or that screen position establishes patient laterality.',
      'Reassemble before comparing relationships. Surface ends, calibre, colour and explode separation do not establish continuous branches, blood flow, a patient measurement or spatial registration.',
    ],
    citations: [...new Set(topic.citations)],
    note: 'Original source-bound educational draft; revision-bound radiologist review pending. No acquired angiogram, publisher image, patient scan, procedural route, clinical approval or patient-space registration is included. Atlas, Education case and paid-lecture access remain independent.',
  };
}
