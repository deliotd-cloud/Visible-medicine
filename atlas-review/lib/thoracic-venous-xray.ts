import cardiacPins from '../content/cardiac-venous-tour-pins.json' with {type: 'json'};
import centralPins from '../content/central-vessel-imaging-pins.json' with {type: 'json'};
import internalPins from '../content/internal-thoracic-imaging-pins.json' with {type: 'json'};
import {thoracicVenousXrayTopics} from '../content/thoracic-venous-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected = {
  'anterior-cardiac-vein': ['FMA76767', 'unspecified'],
  'great-cardiac-vein': ['FMA4707', 'unspecified'],
  'middle-cardiac-vein': ['FMA4713', 'unspecified'],
  'hemiazygos-vein': ['FMA4944', 'midline'],
  'right-internal-thoracic-vein': ['FMA4758', 'right'],
} as const;
type Topic = keyof typeof expected;
const candidates = [
  ...cardiacPins.entries,
  ...centralPins.entries.map(e => e.identity),
  ...internalPins.entries.map(e => e.identity),
];
const bindings = new Map(Object.entries(expected).map(([topic, [fma, side]]) => {
  const id = `vm:anatomy:body:thorax:${side}:vessel:${topic}`;
  const matches = candidates.filter(s => s.id === id && s.fmaId === fma &&
    s.laterality === side && s.region === 'thorax' && s.system === 'vessels' &&
    s.category === 'vessel');
  if (matches.length !== 1) throw Error(`Expected one exact thoracic venous identity: ${topic}`);
  const identity = matches[0];
  return [id, {signature: sourceCanonical(identity), topic: topic as Topic,
    limitation: identity.coverageNote}] as const;
}));

/** Reference orientation only: no acquired angiogram or catheter simulation. */
export function thoracicVenousXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = thoracicVenousXrayTopics[binding.topic];
  return {
    readiness: 'draft', title: `${s.name} · ${topic.title} · draft`, body: topic.body,
    bullets: [
      ...topic.bullets,
      ...(binding.limitation ? [binding.limitation] : []),
      'Contrast venography uses X-rays to depict opacified veins. CT venography and MR venography are separate examinations; plain radiography does not trace a complete venous lumen. No acquired image is supplied here.',
      'Check patient side, projection and contrast phase on the acquired study. Unspecified or midline source fields are not patient-side markers; atlas screen position does not establish laterality.',
      'Reassemble before comparing relationships. Source components, calibre, colour and explode separation do not prove patent connections, blood flow, patient measurements or spatial registration.',
    ],
    citations: [...new Set([...topic.citations, 'https://www.radiologyinfo.org/en/info/venography'])],
    note: 'Original source-bound educational draft; revision-bound radiologist review pending. No acquired image, publisher media, patient scan, procedural route, clinical approval or patient-space registration is included. Atlas, Education case and paid-lecture access remain independent.',
  };
}
