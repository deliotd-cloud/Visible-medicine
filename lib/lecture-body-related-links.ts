import {createLectureBodyReference,resolveLectureBodyReference,type LectureBodyReference} from './lecture-body-reference.ts';
export const BODY_RELATED_LECTURE_PAGE_SIZE=16;
export type BodyRelatedLectureRequest={reference:LectureBodyReference;offset:number};
export function bodyRelatedLectureHref(value:unknown,offset=0):string|null{
  const body=resolveLectureBodyReference(value);
  if(!body||!Number.isSafeInteger(offset)||offset<0||offset>1_000_000||offset%BODY_RELATED_LECTURE_PAGE_SIZE)return null;
  const ref=createLectureBodyReference(body.structureId);if(!ref)return null;
  const params=new URLSearchParams({structure:ref.structureId,region:ref.region,side:ref.side,source:ref.sourceSha256,atlasRevision:ref.atlasRevision});
  if(offset)params.set('offset',String(offset));
  return '/learn/related-structure?'+params.toString();
}
export function parseBodyRelatedLectureRequest(params:Record<string,string|string[]|undefined>):BodyRelatedLectureRequest|null{
  const id=params.structure;
  if(typeof id!=='string')return null;
  const ref=createLectureBodyReference(id);if(!ref)return null;
  if(params.region!==ref.region||params.side!==ref.side||params.source!==ref.sourceSha256||params.atlasRevision!==ref.atlasRevision)return null;
  if(params.offset!==undefined&&(typeof params.offset!=='string'||!/^(0|[1-9][0-9]{0,6})$/.test(params.offset)))return null;
  const offset=params.offset===undefined?0:Number(params.offset);
  return bodyRelatedLectureHref(ref,offset)?{reference:ref,offset}:null;
}
