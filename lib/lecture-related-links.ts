import {createLectureAnatomyReference,resolveLectureAnatomyReference} from './lecture-anatomy-reference.ts';
import type {LectureSearchParams} from './lecture-slide-navigation.ts';
import {appendLectureTourContext,parseLectureTourContext,lectureTourReturn,type LectureTourContext} from './lecture-tour-context.ts';

export const RELATED_LECTURE_PAGE_SIZE=16;
export type RelatedLectureRequest={conceptId:string;headRevision:string;offset:number;tourContext?:LectureTourContext};

/** Only explicit, current anatomy pins can enter lecture discovery. */
export function relatedLectureHref(conceptId:string,headRevision:string,offset=0,tourContext?:LectureTourContext):string|null{
  if(!Number.isSafeInteger(offset)||offset<0||offset>1_000_000||offset%RELATED_LECTURE_PAGE_SIZE!==0)return null;
  const reference=createLectureAnatomyReference(conceptId);
  if(!reference||reference.headRevision!==headRevision||!resolveLectureAnatomyReference(reference))return null;
  if(tourContext&&tourContext.kind!=='none'&&(tourContext.kind!=='ready'||tourContext.conceptId!==conceptId||tourContext.headRevision!==headRevision||!lectureTourReturn(tourContext)))return null;
  const query=new URLSearchParams({concept:conceptId,headRevision});
  if(offset)query.set('offset',String(offset));
  return appendLectureTourContext(`/learn/related-anatomy?${query}`,tourContext);
}

export function parseRelatedLectureRequest(params:LectureSearchParams):RelatedLectureRequest|null{
  const conceptId=params.concept,headRevision=params.headRevision,rawOffset=params.offset;
  if(typeof conceptId!=='string'||typeof headRevision!=='string'||
    (rawOffset!==undefined&&(typeof rawOffset!=='string'||!/^(0|[1-9][0-9]{0,6})$/.test(rawOffset))))return null;
  const offset=rawOffset===undefined?0:Number(rawOffset);
  const tourContext=parseLectureTourContext(params);
  if(tourContext.kind==='invalid')return null;
  return relatedLectureHref(conceptId,headRevision,offset,tourContext)?{conceptId,headRevision,offset,...(tourContext.kind==='ready'?{tourContext}:{})}:null;
}

export function relatedLectureConcept(request:RelatedLectureRequest){
  if(!relatedLectureHref(request.conceptId,request.headRevision,request.offset,request.tourContext))return null;
  return resolveLectureAnatomyReference(createLectureAnatomyReference(request.conceptId));
}
