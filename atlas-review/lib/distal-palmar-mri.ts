import pins from '../content/distal-palmar-mri-pins.json' with {type:'json'};
import {distalPalmarMriTopics,distalPalmarMriReference,type DistalPalmarGroup} from '../content/distal-palmar-mri';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(e=>[e.identity.id,{identity:sourceCanonical(e.identity),group:e.group as DistalPalmarGroup}]));
export function distalPalmarMriLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(tab!=='mri')return undefined;
 const binding=bindings.get(s.id);if(!binding||sourceCanonical(s)!==binding.identity)return undefined;
 const topic=distalPalmarMriTopics[binding.group];
 return {readiness:'draft',title:`${s.name} · MR angiographic orientation · draft`,body:topic.body,
  bullets:[topic.scope,'Reference geometry does not establish patency, flow, collateral adequacy, branch continuity or scan registration.'],
  note:'Introductory, source-bound teaching for revision-bound radiologist review. Specialised angiography is not routine MRI. No images, acquisition protocol, procedural clearance or clinical approval. Atlas, imaging-case and paid-lecture access remain independent.',
  citations:[distalPalmarMriReference]};
}
