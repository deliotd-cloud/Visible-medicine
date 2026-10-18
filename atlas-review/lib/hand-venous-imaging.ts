import pins from '../content/hand-venous-imaging-pins.json' with {type:'json'};
import {handVenousImagingReferences as references,handVenousImagingTopics as topics} from '../content/hand-venous-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
type Group=keyof typeof topics;
const bindings=new Map(pins.entries.map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),group:e.group as Group}]));
/** Exact admitted sources only, without promoting compound parts or held veins. */
export function handVenousImagingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(tab!=='ct'&&tab!=='mri')return undefined;
 const bound=bindings.get(s.id);if(!bound||sourceCanonical(s)!==bound.signature)return undefined;
 const topic=topics[bound.group];
 return{
  readiness:'draft',title:`${s.name} · ${tab.toUpperCase()} venous orientation · draft`,body:topic[tab],
  bullets:[topic.landmark,`Retained source: ${s.fmaId} · ${s.laterality} · ${s.sources.length} recorded component${s.sources.length===1?'':'s'}.`,
   topic.limit,'Assess spatial relationships with separation at zero. Explode and cutaway are teaching views, not acquired sections or angiograms.'],
  citations:[references.imaging,...(tab==='mri'?[references.mri]:[]),...(bound.group==='dorsal-hand-venous-detail'?[references.anatomy]:[])],
  note:'Original source-bound educational draft; revision-bound radiologist review pending. No scan, patient contour, vessel registration, diagnostic protocol, thrombosis or malformation is supplied. Atlas, case and paid-lecture access remain independent.',
 };
}
