import runtimeManifest from '../public/atlas-runtime/head-neck/manifest.json' with {type:'json'};
import {createLectureBodyReference,resolveLectureBodyReference,type LectureBodyReference} from './lecture-body-reference';

export const ATLAS_BODY_LEARNING_PROTOCOL='vm-atlas-learning-selection';
export type AtlasBodyLearningContext={revision:string;region:string};
export type AtlasBodyLearningSelection=
  |{sequence:number;status:'selected';reference:LectureBodyReference;label:string}
  |{sequence:number;status:'empty'}
  |{sequence:number;status:'blocked';reason:'practice'|'guided'|'unavailable'};
const hash40=/^[a-f0-9]{40}$/;
const hash64=/^[a-f0-9]{64}$/;
const nonce=/^[a-zA-Z0-9_-]{16,80}$/;
const side=/^(left|right|midline|unpaired|unspecified)$/;

/** No prototype fields, symbols, accessors, or surplus fields cross this boundary. */
function record(value:unknown,keys:readonly string[]):Record<string,unknown>|null{
  try{
    if(!value||typeof value!=='object'||Array.isArray(value))return null;
    const proto=Object.getPrototypeOf(value);
    if(proto!==Object.prototype&&proto!==null)return null;
    const own=Reflect.ownKeys(value);
    if(own.length!==keys.length||own.some(key=>typeof key!=='string'||!keys.includes(key)))return null;
    const copy:Record<string,unknown>=Object.create(null);
    for(const key of keys){
      const descriptor=Object.getOwnPropertyDescriptor(value,key);
      if(!descriptor||!Object.hasOwn(descriptor,'value')||!descriptor.enumerable)return null;
      copy[key]=descriptor.value;
    }
    return copy;
  }catch{return null;}
}

/** Only the current, first-party main body module may originate learning links. */
export function atlasBodyLearningContext(src:string):AtlasBodyLearningContext|null{
  if(typeof src!=='string'||!src.startsWith('/atlas-runtime/head-neck/index.html?'))return null;
  const query=src.slice('/atlas-runtime/head-neck/index.html?'.length);
  if(!query||/[#\\\u0000-\u001f\u007f]/.test(query))return null;
  const params=new URLSearchParams(query);
  const names=[...params.keys()];
  if(names.length!==new Set(names).size||names.some(key=>!['region','study','structure','side','source'].includes(key)))return null;
  if(!params.has('region')||
    (params.has('study')&&!/^[12]$/.test(params.get('study')!))||
    (params.has('structure')&&!/^[a-zA-Z0-9:_-]{1,240}$/.test(params.get('structure')!))||
    (params.has('side')&&!/^(both|left|right)$/.test(params.get('side')!))||
    (params.has('source')&&!hash64.test(params.get('source')!)))return null;
  if(!hash40.test(runtimeManifest.sourceCommit))return null;
  const region=params.get('region');
  if(!region||!Array.isArray(runtimeManifest.regionalScopes)||
    runtimeManifest.regionalScopes.filter(scope=>scope.region===region).length!==1)return null;
  return {revision:runtimeManifest.sourceCommit,region};
}

function currentContext(context:AtlasBodyLearningContext):boolean{
  const parsed=record(context,['revision','region']);
  return !!parsed&&parsed.revision===runtimeManifest.sourceCommit&&hash40.test(runtimeManifest.sourceCommit)&&
    runtimeManifest.regionalScopes.filter(scope=>scope.region===parsed.region).length===1;
}

export function matchesAtlasBodyLearningReady(value:unknown,context:AtlasBodyLearningContext):boolean{
  if(!currentContext(context))return false;
  const ready=record(value,['type','version','revision','region']);
  return !!ready&&ready.type===ATLAS_BODY_LEARNING_PROTOCOL+'-ready'&&ready.version===1&&
    ready.revision===context.revision&&ready.region===context.region;
}

/** Caller also verifies event.origin, event.source, live frame and lifecycle. */
export function parseAtlasBodyLearningSelection(value:unknown,context:AtlasBodyLearningContext,
  session:string,afterSequence:number):AtlasBodyLearningSelection|null{
  if(!currentContext(context)||typeof session!=='string'||!nonce.test(session)||
    !Number.isSafeInteger(afterSequence)||afterSequence<0)return null;
  let status:unknown;
  try{status=value&&typeof value==='object'?Object.getOwnPropertyDescriptor(value,'status')?.value:undefined;}
  catch{return null;}
  const header=record(value,['type','version','revision','region','session','sequence','status',
    ...(status==='selected'?['selection']:status==='blocked'?['reason']:[])]);
  if(!header||header.type!==ATLAS_BODY_LEARNING_PROTOCOL||header.version!==1||
    header.revision!==context.revision||header.region!==context.region||header.session!==session||
    !Number.isSafeInteger(header.sequence)||(header.sequence as number)<=afterSequence||
    (header.sequence as number)<1)return null;
  const sequence=header.sequence as number;
  if(header.status==='empty')return {sequence,status:'empty'};
  if(header.status==='blocked')return header.reason==='practice'||header.reason==='guided'||header.reason==='unavailable'
    ?{sequence,status:'blocked',reason:header.reason}:null;
  if(header.status!=='selected')return null;
  const selected=record(header.selection,['kind','id','source','laterality']);
  if(!selected||selected.kind!=='root'||typeof selected.id!=='string'||
    !/^vm:anatomy:(?:body:)?[a-zA-Z0-9:_-]{1,220}$/.test(selected.id)||
    typeof selected.source!=='string'||!hash64.test(selected.source)||
    typeof selected.laterality!=='string'||!side.test(selected.laterality))return null;
  const lateralityTokens=selected.id.split(':').filter(token=>side.test(token));
  if(lateralityTokens.length!==1)return null;
  const idSide=lateralityTokens[0];
  if(idSide!==selected.laterality)return null;
  const scope=runtimeManifest.regionalScopes.find(item=>item.region===context.region);
  if(!scope||scope.regionalIds.filter(id=>id===selected.id).length!==1)return null;
  const reference=createLectureBodyReference(selected.id);
  if(!reference||reference.atlasRevision!==context.revision||reference.sourceSha256!==selected.source||
    reference.side!==(idSide==='left'||idSide==='right'?idSide:'both'))return null;
  const resolved=resolveLectureBodyReference(reference);
  if(!resolved)return null;
  return {sequence,status:'selected',reference:{...reference},label:resolved.label};
}
