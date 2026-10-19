import pins from '../content/coronary-arterial-us-pins.json' with { type: 'json' };
import { coronaryArterialXrayTopics } from '../content/coronary-arterial-xray';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const entries = pins.entries.filter(e => Object.hasOwn(coronaryArterialXrayTopics, e.identity.fmaId));
if (entries.length !== 4 || new Set(entries.map(e => e.identity.fmaId)).size !== 4)
  throw Error('Expected four exact coronary arterial source identities');
const bindings = new Map(entries.map(({ identity }) => [identity.id, {
  signature: sourceCanonical(identity), fma: identity.fmaId as keyof typeof coronaryArterialXrayTopics,
}]));

/** Anatomy teaching only: no acquisition recipe, image asset or patient mapping. */
export function coronaryArterialXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const bound = bindings.get(s.id);
  if (!bound || sourceCanonical(s) !== bound.signature) return undefined;
  const topic = coronaryArterialXrayTopics[bound.fma];
  return {
    readiness: 'draft', title: `${s.name} · ${topic.title} · draft`, body: topic.body,
    bullets: [
      'Invasive coronary angiography uses catheter-delivered contrast and X-ray images. Do not treat a routine chest X-ray as a coronary angiogram; coronary CT angiography is a different examination.',
      ...topic.bullets,
      'A two-dimensional projection can foreshorten a vessel or superimpose branches. Rotating this generic 3D model is not a patient-specific angiographic reconstruction and cannot prescribe an optimal projection.',
      'Reassemble the model before comparing gross relationships. Display gaps, colour and calibre do not establish stenosis, patency, flow or a diagnostic threshold.',
    ],
    citations: [...topic.citations],
    note: 'Original source-bound educational draft; revision-bound radiologist review pending. No acquired angiogram, publisher image, patient scan or measurement is included. No patient-space registration, procedural route or clinical approval is supplied. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
