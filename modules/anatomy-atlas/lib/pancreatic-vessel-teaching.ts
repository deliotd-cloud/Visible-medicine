// Intended destination: lib/pancreatic-vessel-teaching.ts
import pins from '../content/abdominal-branch-imaging-pins.json' with {type:'json'};
import {pancreaticVesselTeaching} from '../content/pancreatic-vessel-teaching';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bundle='abdomen-vessels-visceral-detail';
const bindings=new Map(pins.entries.filter(entry=>entry.identity.bundle===bundle).map(entry=>[
  entry.identity.id,{signature:sourceCanonical(entry.identity),fmaId:entry.identity.fmaId},
]));
const sourceLimit='Source-labelled segments do not prove joined anterior or posterior arcades, continuous lumen, complete tributaries, flow, stenosis, perfusion territories, surgical planes or correspondence to a patient scan.';
const reviewNote='Original educational draft; independent anatomy and revision-bound radiologist review pending. Atlas, imaging-case and paid-lecture access remain independent.';

/** Only complete pinned current root selections receive these three drafts. */
export function pancreaticVesselTeachingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='anatomy'&&tab!=='function'&&tab!=='quiz')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||s.bundle!==bundle||s.region!=='abdomen'||s.system!=='vessels'||s.category!=='vessel'||
    sourceCanonical(s)!==binding.signature)return undefined;
  const topic=pancreaticVesselTeaching[binding.fmaId];
  if(!topic)return undefined;
  if(tab==='quiz')return {
    readiness:'draft',title:`${s.name} · Pancreatic vessel quick check · draft`,
    body:topic.question,bullets:[...topic.choices],correctAnswer:topic.correctAnswer,
    explanation:topic.explanation,citations:[topic.reference,...(topic.support?[topic.support]:[])],
    note:`${topic.limit} ${sourceLimit} ${reviewNote}`,
  };
  return {
    readiness:'draft',title:`${s.name} · ${tab==='anatomy'?'Course & neighbours':'Role & limits'} · draft`,
    body:topic[tab],bullets:[topic.limit,
      `Source identity: ${s.fmaId} · ${s.laterality} · ${s.sources.map(source=>source.file).join(', ')}. File count is not a named branch count.`,
      sourceLimit],citations:[topic.reference,...(topic.support?[topic.support]:[])],note:reviewNote,
  };
}

