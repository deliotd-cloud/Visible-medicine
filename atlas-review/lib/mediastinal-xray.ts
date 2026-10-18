import pins from '../content/central-vessel-imaging-pins.json' with {type:'json'};
import {mediastinalXrayTopics, mediastinalXrayShared, mediastinalXrayGeneralReference} from '../content/mediastinal-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings = new Map(pins.entries.flatMap(({identity}) => {
  if (!Object.hasOwn(mediastinalXrayTopics, identity.fmaId)) return [];
  const topic = mediastinalXrayTopics[identity.fmaId as keyof typeof mediastinalXrayTopics];
  return [[identity.id, {signature: sourceCanonical(identity), topic}] as const];
}));

/** Retained source identities only: not name matches or acquired patient anatomy. */
export function mediastinalXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  return {
    readiness: 'draft', title: `${s.name} · Chest X-ray orientation · draft`,
    body: binding.topic.body, bullets: [binding.topic.cue, ...mediastinalXrayShared],
    citations: [...binding.topic.references, mediastinalXrayGeneralReference],
    note: 'Anatomy/radiology review pending for this source revision. No imaging study loaded or linked. This is orientation teaching, not a patient diagnosis, device-position check or treatment recommendation. Case, Atlas and paid-lecture access remain independent.',
  };
}
