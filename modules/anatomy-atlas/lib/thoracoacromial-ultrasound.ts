import pins from '../content/thoracoacromial-ultrasound-pins.json' with {type: 'json'};
import {thoracoacromialUltrasoundFacts, thoracoacromialUltrasoundLimitations, thoracoacromialUltrasoundReferences} from '../content/thoracoacromial-ultrasound';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Family = keyof typeof thoracoacromialUltrasoundFacts;
const bindings = new Map(pins.entries.map(entry => [entry.identity.id,
  {signature: sourceCanonical(entry.identity), family: entry.family as Family}]));

/** Six exact retained source records; no FMA, name or laterality fallback. */
export function thoracoacromialUltrasoundLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ultrasound') return undefined;
  const bound = bindings.get(structure.id);
  if (!bound || sourceCanonical(structure) !== bound.signature) return undefined;
  const fact = thoracoacromialUltrasoundFacts[bound.family];
  return {readiness: 'draft', title: `${structure.name} · Ultrasound orientation · draft`,
    body: fact.body, bullets: [fact.distinction, ...thoracoacromialUltrasoundLimitations],
    citations: [...thoracoacromialUltrasoundReferences],
    note: 'Revision-bound radiologist review pending. No acquired scan, patient registration or clinical approval is supplied. Atlas, imaging-case and lecture access remain independent.'};
}
