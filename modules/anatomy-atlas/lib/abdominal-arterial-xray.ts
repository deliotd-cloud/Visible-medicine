import pins from '../content/central-vessel-imaging-pins.json' with {type: 'json'};
import {abdominalArterialXrayTopics} from '../content/abdominal-arterial-xray';
import {sourceCanonical} from './body-source-additions';
import {celiacTeachingIdentity} from './body-display-catalog';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected = {
  'abdominal-aorta': 'FMA3789', celiac: 'FMA50737',
  sma: 'FMA14749', ima: 'FMA14750',
} as const;
type Group = keyof typeof expected;
const entries = pins.entries.filter(e => Object.hasOwn(expected, e.group));
if (entries.length !== 4 || new Set(entries.map(e => e.identity.id)).size !== 4 ||
    Object.entries(expected).some(([group, fma]) =>
      entries.filter(e => e.group === group && e.identity.fmaId === fma &&
        e.identity.region === 'abdomen' && e.identity.system === 'vessels').length !== 1))
  throw Error('Expected four exact abdominal arterial source identities');
const bindings = new Map(entries.map(e => [e.identity.id, {
  signature: sourceCanonical(e.identity), group: e.group as Group,
  anatomy: e.anatomy,
}]));

/** Source-bound orientation only; no acquired image or patient transform. */
export function abdominalArterialXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(celiacTeachingIdentity(s)) !== binding.signature) return undefined;
  const topic = abdominalArterialXrayTopics[binding.group];
  const limitation = binding.anatomy.bullets?.find(b => !b.startsWith('Source identity:'));
  return {
    readiness: 'draft', title: `${s.name} · ${topic.title} · draft`, body: topic.body,
    bullets: [
      binding.anatomy.body,
      ...topic.bullets,
      ...(limitation ? [limitation] : []),
      'Contrast catheter angiography uses X-rays; plain abdominal radiography, CT angiography and MR angiography are different examinations. This model supplies none of those images.',
      'Reassemble the model before comparing broad relationships. Its colour, rotation, separation and surface calibre do not reproduce a patient projection, lumen, flow or disease measurement.',
    ],
    citations: [...new Set([...(binding.anatomy.citations ?? []), ...topic.citations])],
    note: 'Original source-bound educational draft; revision-bound radiologist review pending. No acquired angiogram, publisher image, patient scan, procedural route, clinical approval or patient-space registration is included. Atlas, Education case and paid-lecture access remain independent.',
  };
}
