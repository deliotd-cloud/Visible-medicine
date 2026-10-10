import pins from '../content/girdle-bone-ultrasound-pins.json' with {type: 'json'};
import {girdleBoneUltrasoundTopics, girdleBoneUltrasoundReferences, girdleBoneUltrasoundSurfaceLimit, type GirdleBoneUltrasoundGroup} from '../content/girdle-bone-ultrasound';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as GirdleBoneUltrasoundGroup,
}]));

/** Five exact retained sources only. Existing right shoulder-pilot notes stay intact. */
export function girdleBoneUltrasoundLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ultrasound') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = girdleBoneUltrasoundTopics[binding.group];
  return {
    readiness: 'draft',
    title: `${s.name} · Ultrasound surface orientation · draft`,
    body: topic.body,
    bullets: [topic.landmark, topic.limit, girdleBoneUltrasoundSurfaceLimit,
      'Set separation to zero before comparing relationships. Camera rotation is not probe motion, patient positioning or a dynamic ultrasound examination.'],
    citations: [girdleBoneUltrasoundReferences[topic.reference], girdleBoneUltrasoundReferences.limits],
    note: 'Independent revision-bound radiologist review pending. No ultrasound images or patient-space registration are supplied. Named landmarks are educational context, not independently validated mesh parts. Confirm side, region and actual image orientation in Didanix Education; Atlas, imaging-case and paid-lecture access remain independent. Reference teaching only, not diagnosis or an acquisition protocol.',
  };
}
