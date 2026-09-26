import pins from '../content/thoracic-branch-imaging-pins.json' with {type:'json'};
import {thoracicInletXrayTopics, thoracicInletXrayShared} from '../content/thoracic-inlet-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings = new Map(pins.entries.flatMap(({identity}) => {
  if (!Object.hasOwn(thoracicInletXrayTopics, identity.fmaId)) return [];
  const topic = thoracicInletXrayTopics[identity.fmaId as keyof typeof thoracicInletXrayTopics];
  return [[identity.id, {signature: sourceCanonical(identity), topic}] as const];
}));

/** Whole pinned source identity, including side and geometry provenance. */
export function thoracicInletXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  return {
    readiness: 'draft', title: `${s.name} · Thoracic inlet X-ray orientation · draft`,
    body: binding.topic.body,
    bullets: [binding.topic.cue, ...thoracicInletXrayShared],
    citations: [...binding.topic.references],
    note: 'Anatomy/radiology review pending for this source revision; radiologist sign-off must bind the reviewed revision and scope. No imaging study loaded or linked. This is orientation teaching, not patient diagnosis, catheter placement clearance or treatment guidance. Case, Atlas and paid-lecture access remain independent.',
  };
}
