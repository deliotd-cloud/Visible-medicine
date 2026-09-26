import pins from '../content/central-vessel-imaging-pins.json' with {type:'json'};
import {hilarVesselXrayTopics, hilarVesselXrayShared, hilarVesselXrayReferences} from '../content/hilar-vessel-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings = new Map(pins.entries.flatMap(({identity}) => {
  if (!Object.hasOwn(hilarVesselXrayTopics, identity.fmaId)) return [];
  const topic = hilarVesselXrayTopics[identity.fmaId as keyof typeof hilarVesselXrayTopics];
  return [[identity.id, {signature: sourceCanonical(identity), topic}] as const];
}));

/** Whole pinned source identity, including side and geometry provenance. */
export function hilarVesselXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  return {
    readiness: 'draft', title: `${s.name} · Hilar vessel X-ray orientation · draft`,
    body: binding.topic.body,
    bullets: [binding.topic.cue, ...hilarVesselXrayShared],
    citations: [...new Set([...binding.topic.references, hilarVesselXrayReferences.hilarVessels])],
    note: 'Anatomy/radiology review pending for this source revision; radiologist sign-off must bind the reviewed revision and scope. No imaging study loaded or linked. This is orientation teaching, not patient diagnosis or treatment guidance. Case, Atlas and paid-lecture access remain independent.',
  };
}
