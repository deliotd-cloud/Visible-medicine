import pins from '../content/foot-ultrasound-followup-pins.json' with {type:'json'};
import {
 footUltrasoundFollowupReferences as references,
 footUltrasoundFollowupTeaching as teaching,
 footUltrasoundFollowupReviewNote,
 halluxUltrasoundReviewNote,
 type FootUltrasoundFollowupLesson,
} from '../content/foot-ultrasound-followup';
import {toeBoneUltrasoundLesson} from './toe-bone-ultrasound';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
type Family=keyof typeof teaching|'halluxNote';
const bindings=new Map(pins.entries.map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),family:e.family as Family,tabs:Object.keys(e.previous)}]));
/** Eight new midfoot US drafts and four note-only hallux corrections, exact-source only. */
export function footUltrasoundFollowupLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 const binding=bindings.get(s.id);
 if(!binding||!binding.tabs.includes(tab)||sourceCanonical(s)!==binding.signature)return undefined;
 if(binding.family==='halluxNote'){
  const original=toeBoneUltrasoundLesson(s,tab);
  if(!original)return undefined;
  return {...original,bullets:[...(original.bullets??[])],citations:[...(original.citations??[])],note:halluxUltrasoundReviewNote};
 }
 const lessons:Partial<Record<ContentTab,FootUltrasoundFollowupLesson>>=teaching[binding.family];
 const lesson=lessons[tab];
 if(!lesson)return undefined;
 return {readiness:'draft',title:`${s.name} · ultrasound evidence & limits · draft`,body:lesson.body,bullets:[...lesson.bullets],citations:lesson.citations.map(key=>references[key].url),note:footUltrasoundFollowupReviewNote};
}
