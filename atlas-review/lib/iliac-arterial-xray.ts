import pins from '../content/iliac-arterial-imaging-pins.json' with {type: 'json'};
import {iliacArterialXrayTopics} from '../content/iliac-arterial-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected = {common: ['FMA14765', 'FMA14766'], external: ['FMA18806', 'FMA18807'], internal: ['FMA18809', 'FMA18810']} as const;
type Group = keyof typeof expected;
if (pins.entries.length !== 6 || new Set(pins.entries.map(e => e.identity.id)).size !== 6 ||
    Object.entries(expected).some(([group, fmas]) => fmas.some(fma =>
      pins.entries.filter(e => e.group === group && e.identity.fmaId === fma).length !== 1)))
  throw Error('Expected six exact common, external and internal iliac source identities');
const bindings = new Map(pins.entries.map(({identity, group}) => [identity.id, {
  signature: sourceCanonical(identity), group: group as Group,
}]));

/** Source-bound teaching, never an acquired angiogram or patient transform. */
export function iliacArterialXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = iliacArterialXrayTopics[binding.group];
  return {
    readiness: 'draft', title: `${s.name} · ${topic.title} · draft`, body: topic.body,
    bullets: [
      'This section concerns contrast X-ray angiography, not a routine pelvic radiograph. CT angiography and MR angiography are separate examinations; use their own teaching tabs.',
      ...topic.bullets,
      'Reassemble the model to compare gross relationships. Rotation, separation, colour and surface calibre do not reproduce an acquired projection, vessel lumen, flow or disease measurement.',
    ],
    citations: [...topic.citations],
    note: 'Original source-bound educational draft; revision-bound radiologist review pending. No angiogram, publisher image, patient scan, procedural instructions or clinical approval is included. No patient-space registration is supplied. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
