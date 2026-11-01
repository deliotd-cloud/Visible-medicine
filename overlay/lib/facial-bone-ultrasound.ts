import pins from '../content/facial-bone-ultrasound-pins.json' with {type: 'json'};
import {facialBoneUltrasoundTopics as topics, facialBoneUltrasoundReferences as references, facialBoneUltrasoundNote as note} from '../content/facial-bone-ultrasound.ts';
import {sourceCanonical} from './body-source-additions.ts';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), family: entry.family as keyof typeof topics,
}]));
/** A whole-record source match is required; names, sides and FMA identifiers alone are insufficient. */
export function facialBoneUltrasoundLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ultrasound') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = topics[binding.family];
  return {readiness: 'draft', title: s.name + ' · Ultrasound surface orientation · draft',
    body: topic.body, bullets: [...topic.bullets],
    citations: topic.references.map(key => references[key]), note};
}
