import pins from '../content/cardiac-venous-tour-pins.json' with {type: 'json'};
import {cardiacVenousUltrasoundTopics} from '../content/cardiac-venous-ultrasound';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected = {'great-cardiac-vein': 'FMA4707', 'middle-cardiac-vein': 'FMA4713'} as const;
type Topic = keyof typeof expected;
const bindings = new Map(Object.entries(expected).map(([topic, fma]) => {
  const id = `vm:anatomy:body:thorax:unspecified:vessel:${topic}`;
  const matches = pins.entries.filter(s => s.id === id && s.fmaId === fma &&
    s.laterality === 'unspecified' && s.region === 'thorax' &&
    s.system === 'vessels' && s.category === 'vessel');
  if (matches.length !== 1) throw Error(`Expected one exact cardiac venous identity: ${topic}`);
  const identity = matches[0];
  return [id, {signature: sourceCanonical(identity), topic: topic as Topic,
    limitation: identity.coverageNote}] as const;
}));

/** Anatomical reference only; no acquired echocardiogram or physiological flow. */
export function cardiacVenousUltrasoundLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ultrasound') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = cardiacVenousUltrasoundTopics[binding.topic];
  return {
    readiness: 'draft', title: `${s.name} · ${topic.title} · draft`, body: topic.body,
    bullets: [
      ...topic.bullets,
      ...(binding.limitation ? [binding.limitation] : []),
      'Compare the assembled anatomical course and surrounding structures, then verify the vessel on the acquired study. Screen position, model colour and unspecified source laterality are not patient-side or Doppler-direction markers.',
      'This static external surface supplies no insonation plane, spectral trace, lumen measurement, blood-flow simulation or patient-space registration. Explode separation is a teaching layout, not physiological motion.',
    ],
    citations: [...topic.citations],
    note: 'Original source-bound educational draft; revision-bound radiologist review pending. No acquired echocardiogram, publisher figure, patient scan, procedural guidance, clinical approval or patient-space registration is supplied. Atlas, Education case and paid-lecture access remain independent.',
  };
}
