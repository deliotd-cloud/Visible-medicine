import pins from '../content/intracranial-arterial-us-pins.json' with {type: 'json'};
import {intracranialArterialUsFacts, intracranialArterialUsLimitations, intracranialArterialUsNote} from '../content/intracranial-arterial-us';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Family = keyof typeof intracranialArterialUsFacts;
const families: Readonly<Record<Family, readonly string[]>> = {
  aca: ['FMA50029', 'FMA50030'],
  acom: ['FMA50169'],
  pca: ['FMA50584', 'FMA50585'],
  pcom: ['FMA50085', 'FMA50086'],
  mca: ['FMA50082'],
};
const bindings = new Map(pins.entries.flatMap(entry => {
  const family = entry.family as Family;
  return Object.hasOwn(families, family) && families[family].includes(entry.identity.fmaId)
    ? [[entry.identity.id, {signature: sourceCanonical(entry.identity), family}] as const]
    : [];
}));

/** Source-bound teaching context, never a patient Doppler observation. */
export function intracranialArterialUsLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ultrasound') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const fact = intracranialArterialUsFacts[binding.family];
  return {
    readiness: 'draft', title: `${s.name} · Ultrasound orientation · draft`, body: fact.body,
    bullets: [
      ...fact.bullets,
      `Retained source: ${s.fmaId} · ${s.laterality} · ${s.sources.length} source file${s.sources.length === 1 ? '' : 's'}.`,
      `Source limit: ${s.coverageNote}`,
      ...intracranialArterialUsLimitations,
    ],
    citations: [...fact.references], note: intracranialArterialUsNote,
  };
}
