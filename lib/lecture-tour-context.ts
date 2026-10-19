import {HEAD_LINK_REVISION} from './head-atlas-links.ts';
import {headLinksCurrent} from './head-link-availability.ts';
import {headLearningLinks,headLearningSequencesForModality,type HeadLearningPosition} from './head-atlas-learning.ts';

export type LectureTourContext = {kind:'none'} | {kind:'invalid'} | {
  kind:'ready';sequenceId:string;conceptId:string;headRevision:string;view:'CT'|'MRI'|'3D';
};
type Params=URLSearchParams|Record<string,string|string[]|undefined>;
const keys=['returnTour','returnStep','returnConcept','returnRevision','returnView'] as const;
const invalid:LectureTourContext={kind:'invalid'};
function record(value:unknown,names:string[]):value is Record<string,unknown>{
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))return false;
  const fields=Reflect.ownKeys(value);
  return fields.length===names.length&&fields.every(key=>typeof key==='string'&&names.includes(key)&&Object.hasOwn(Object.getOwnPropertyDescriptor(value,key)??{},'value'));
}
function destination(context:unknown){
  if(!record(context,['kind','sequenceId','conceptId','headRevision','view'])||context.kind!=='ready'||
    !headLinksCurrent()||context.headRevision!==HEAD_LINK_REVISION||typeof context.sequenceId!=='string'||
    typeof context.conceptId!=='string'||typeof context.view!=='string'||!['CT','MRI','3D'].includes(context.view))return null;
  const sequence=headLearningSequencesForModality().find(item=>item.id===context.sequenceId);
  const index=sequence?.concepts.indexOf(context.conceptId)??-1;
  if(!sequence||index<0)return null;
  const links=headLearningLinks({sequenceId:sequence.id,conceptId:context.conceptId});
  const href=context.view==='CT'?links?.ctHref:context.view==='MRI'?links?.mriHref:links?.atlasHref;
  return href?{href,label:sequence.label,step:index+1,total:sequence.concepts.length,view:context.view as 'CT'|'MRI'|'3D'}:null;
}
/** A canonical authored step, never a live model-selection or access receipt. */
export function createLectureTourContext(position:HeadLearningPosition,view:'CT'|'MRI'|'3D',revision:string):LectureTourContext{
  const context={kind:'ready' as const,sequenceId:position?.sequenceId,conceptId:position?.conceptId,headRevision:revision,view};
  return destination(context)?context as LectureTourContext:invalid;
}
export function parseLectureTourContext(params:Params):LectureTourContext{
  if(!params||typeof params!=='object'||(!(params instanceof URLSearchParams)&&
    (Array.isArray(params)||![Object.prototype,null].includes(Object.getPrototypeOf(params)))))return invalid;
  if(!(params instanceof URLSearchParams)&&keys.some(key=>Object.hasOwn(params,key)&&!Object.hasOwn(Object.getOwnPropertyDescriptor(params,key)??{},'value')))return invalid;
  const has=(key:string)=>params instanceof URLSearchParams?params.has(key):Object.hasOwn(params,key);
  if(!keys.some(has))return {kind:'none'};
  const read=(key:string)=>{const values=params instanceof URLSearchParams?params.getAll(key):params[key];
    return params instanceof URLSearchParams?Array.isArray(values)&&values.length===1?values[0]:null:typeof values==='string'?values:null;};
  const sequenceId=read('returnTour'),conceptId=read('returnConcept'),headRevision=read('returnRevision'),view=read('returnView'),step=read('returnStep');
  if(!sequenceId||!conceptId||!headRevision||!view||!step||!/^(0|[1-9]\d?)$/.test(step))return invalid;
  const context={kind:'ready' as const,sequenceId,conceptId,headRevision,view};
  const target=destination(context);
  return target&&String(target.step-1)===step?context as LectureTourContext:invalid;
}
export function lectureTourReturn(context:LectureTourContext|undefined){return destination(context);}
/** No caller-supplied return URL: construct the current authored first-party step. */
export function appendLectureTourContext(href:string,context?:LectureTourContext):string|null{
  if(typeof href!=='string'||!href.startsWith('/')||href.startsWith('//')||href.includes('\\')||/[\u0000-\u0020\u007f]/.test(href))return null;
  const url=new URL(href,'https://visible-medicine.invalid');
  if(url.origin!=='https://visible-medicine.invalid'||url.hash||
    !/^\/learn\/(?:related-anatomy|lectures\/[A-Za-z0-9_%:-]+|[a-z0-9-]+\/[A-Za-z0-9_%:-]+)$/.test(url.pathname))return null;
  try {if(url.pathname!=='/learn/related-anatomy'&&!/^[A-Za-z0-9][A-Za-z0-9:_-]{0,139}$/.test(decodeURIComponent(url.pathname.split('/').at(-1)!)))return null;} catch{return null;}
  // Preserve only the internally authored lecture/discovery parameters.
  const allowed=url.pathname==='/learn/related-anatomy'?['concept','headRevision','offset']:['lectureSlide','lectureRevision'];
  for(const key of url.searchParams.keys())if(!allowed.includes(key)||url.searchParams.getAll(key).length!==1)return null;
  if(context===undefined||record(context,['kind'])&&context.kind==='none')return href;
  const target=destination(context);
  if(!target){if(!record(context,['kind'])||context.kind!=='invalid')return null;url.searchParams.set('returnTour','invalid');return url.pathname+'?'+url.searchParams;}
  if(context.kind!=='ready')return null;
  for(const [key,value]of Object.entries({returnTour:context.sequenceId,returnStep:String(target.step-1),returnConcept:context.conceptId,returnRevision:context.headRevision,returnView:context.view}))url.searchParams.set(key,value);
  return url.pathname+'?'+url.searchParams;
}
export function lectureTourContextMatches(context:LectureTourContext,params:Params):boolean{
  const parsed=parseLectureTourContext(params);
  if(record(context,['kind'])&&context.kind==='none')return parsed.kind==='none';
  if(record(context,['kind'])&&context.kind==='invalid')return parsed.kind==='invalid';
  return !!destination(context)&&parsed.kind==='ready'&&context.sequenceId===parsed.sequenceId&&context.conceptId===parsed.conceptId&&context.headRevision===parsed.headRevision&&context.view===parsed.view;
}
