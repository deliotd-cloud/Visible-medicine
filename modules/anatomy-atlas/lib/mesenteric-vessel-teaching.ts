import branchPins from '../content/abdominal-branch-imaging-pins.json' with {type:'json'};
import centralPins from '../content/central-vessel-imaging-pins.json' with {type:'json'};
import {mesentericVesselTeaching} from '../content/mesenteric-vessel-teaching';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bundle='abdomen-vessels-mesenteric';
// The abdominal-branch pin predates the SMV teaching scope. Its complete
// identity is already pinned by central-vessel imaging; no new geometry pin.
const pinned=[
  ...branchPins.entries.filter(entry=>entry.identity.bundle===bundle),
  ...centralPins.entries.filter(entry=>entry.identity.fmaId==='FMA14332'&&entry.identity.bundle===bundle),
];
const bindings=new Map(pinned.map(entry=>[entry.identity.id,{
  signature:sourceCanonical(entry.identity),fmaId:entry.identity.fmaId,
}]));
const sourceLimit='These source-labelled surfaces do not prove continuous arcades, complete tributaries, lumen patency, flow, stenosis, perfusion territories, surgical planes or correspondence to a patient scan.';
const reviewNote='Original educational draft; independent anatomy and revision-bound radiologist review pending. Atlas, imaging-case and paid-lecture access remain independent.';

/** Exact retained root identities only; no parent-to-child or same-FMA fallback. */
export function mesentericVesselTeachingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='anatomy'&&tab!=='function'&&tab!=='quiz')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||s.bundle!==bundle||s.region!=='abdomen'||s.system!=='vessels'||s.category!=='vessel'||
    sourceCanonical(s)!==binding.signature)return undefined;
  const topic=mesentericVesselTeaching[binding.fmaId];
  if(!topic)return undefined;
  if(tab==='quiz')return {
    readiness:'draft',title:`${s.name} · Mesenteric quick check · draft`,
    body:topic.question,bullets:[...topic.choices],correctAnswer:topic.correctAnswer,
    explanation:topic.explanation,citations:[topic.reference],
    note:`${topic.limit} ${sourceLimit} ${reviewNote}`,
  };
  return {
    readiness:'draft',title:`${s.name} · ${tab==='anatomy'?'Course & neighbours':'Role & limits'} · draft`,
    body:topic[tab],bullets:[topic.limit,
      `Source identity: ${s.fmaId} · ${s.laterality} · ${s.sources.map(source=>source.file).join(', ')}. Names and component counts do not validate further branches.`,
      sourceLimit],citations:[topic.reference],note:reviewNote,
  };
}
