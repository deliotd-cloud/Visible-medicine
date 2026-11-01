import pins from '../content/airway-membrane-ultrasound-pins.json' with {type: 'json'};
import {airwayMembraneUltrasoundTopics as topics, airwayMembraneUltrasoundReferences as references, airwayMembraneUltrasoundNote as note} from '../content/airway-membrane-ultrasound.ts';
import {sourceCanonical} from './body-source-additions.ts';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), family: entry.family as keyof typeof topics,
}]));

/** Complete source identity is required, including side, geometry and review state. */
export function airwayMembraneUltrasoundLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ultrasound') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = topics[binding.family];
  return {readiness: 'draft', title: s.name + ' · Ultrasound membrane orientation · draft',
    body: topic.body, bullets: [...topic.bullets],
    citations: topic.references.map(key => references[key]), note};
}
