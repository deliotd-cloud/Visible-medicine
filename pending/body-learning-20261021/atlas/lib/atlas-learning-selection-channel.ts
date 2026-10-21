/** Read-only, same-origin root identity for the host's independent learning links. */
import {regionalModules,type RegionalModule} from '../integration/head-neck/regions';

export const ATLAS_LEARNING_SELECTION_PROTOCOL='vm-atlas-learning-selection';
export type AtlasLearningRegion=RegionalModule;
export type AtlasLearningSelection={kind:'root';id:string;source:string;laterality:string};
export type AtlasLearningSelectionState=
  |{status:'selected';selection:AtlasLearningSelection}
  |{status:'empty'}
  |{status:'blocked';reason:'practice'|'guided'|'unavailable'};
const unavailable:AtlasLearningSelectionState={status:'blocked',reason:'unavailable'};
const hash40=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{40}$/.test(value);
const nonce=(value:unknown):value is string=>typeof value==='string'&&/^[a-zA-Z0-9_-]{16,80}$/.test(value);
export const atlasLearningRegion=(value:unknown):value is AtlasLearningRegion=>
  typeof value==='string'&&Object.hasOwn(regionalModules,value);

/** Inspect own data properties only; malformed objects and accessors are inert. */
function dataRecord(value:unknown,keys:readonly string[]):Record<string,unknown>|null{
  try{
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const proto=Object.getPrototypeOf(value);
  if(proto!==Object.prototype&&proto!==null)return null;
  if(Object.getOwnPropertySymbols(value).length)return null;
  const names=Object.getOwnPropertyNames(value);
  if(names.length!==keys.length||names.some(name=>!keys.includes(name)))return null;
  const result:Record<string,unknown>={};
  for(const key of keys){
    const descriptor=Object.getOwnPropertyDescriptor(value,key);
    if(!descriptor||!Object.hasOwn(descriptor,'value')||!descriptor.enumerable)return null;
    Object.defineProperty(result,key,{value:descriptor.value,enumerable:true,writable:true,configurable:true});
  }
  return result;
  }catch{return null;}
}

export function atlasLearningSelectionRequest(value:unknown,revision:string,region:AtlasLearningRegion):
  value is {type:string;version:1;revision:string;region:AtlasLearningRegion;session:string}{
  if(!hash40(revision)||!atlasLearningRegion(region))return false;
  const request=dataRecord(value,['type','version','revision','region','session']);
  return !!request&&request.type===ATLAS_LEARNING_SELECTION_PROTOCOL+'-request'&&
    request.version===1&&request.revision===revision&&request.region===region&&nonce(request.session);
}

function safeSelection(value:unknown):AtlasLearningSelection|null{
  const target=dataRecord(value,['kind','id','source','laterality']);
  if(!target||target.kind!=='root'||typeof target.id!=='string'||target.id.length>240||
    !/^vm:anatomy:[a-zA-Z0-9:_-]+$/.test(target.id)||
    typeof target.source!=='string'||!/^[a-f0-9]{64}$/.test(target.source)||
    typeof target.laterality!=='string'||
    !['left','right','midline','unpaired','unspecified'].includes(target.laterality))return null;
  return {kind:'root',id:target.id,source:target.source,laterality:target.laterality as string};
}
function safeState(value:unknown):AtlasLearningSelectionState{
  try{
  if(!value||typeof value!=='object')return unavailable;
  const status=Object.getOwnPropertyDescriptor(value,'status');
  if(!status||!Object.hasOwn(status,'value'))return unavailable;
  if(status.value==='empty')return dataRecord(value,['status'])?{status:'empty'}:unavailable;
  if(status.value==='blocked'){
    const state=dataRecord(value,['status','reason']);
    return state&&(state.reason==='practice'||state.reason==='guided'||state.reason==='unavailable')
      ? {status:'blocked',reason:state.reason}:unavailable;
  }
  if(status.value==='selected'){
    const state=dataRecord(value,['status','selection']);
    const selection=state&&safeSelection(state.selection);
    return selection?{status:'selected',selection}:unavailable;
  }
  return unavailable;
  }catch{return unavailable;}
}

export function createAtlasLearningSelectionState(changed:()=>void){
  let state:AtlasLearningSelectionState=unavailable;
  return {
    root(value:AtlasLearningSelectionState){state=safeState(value);changed();},
    current():AtlasLearningSelectionState{return safeState(state);},
  };
}

type ChannelWindow=Pick<Window,'parent'|'location'|'addEventListener'|'removeEventListener'>;
/** A source-only publisher. No incoming focus, navigation or access command exists. */
export function connectAtlasLearningSelectionChannel(win:ChannelWindow,revision:string,region:AtlasLearningRegion,
  read:()=>AtlasLearningSelectionState){
  let session:string|null=null,sequence=0,queued=false,closed=false,unavailableReported=false;
  const enabled=hash40(revision)&&atlasLearningRegion(region)&&win.parent!==win&&
    /^https?:\/\//.test(win.location.origin);
  const ready=()=>win.parent.postMessage({type:ATLAS_LEARNING_SELECTION_PROTOCOL+'-ready',version:1,revision,region},win.location.origin);
  const publish=()=>{
    if(!enabled||closed||queued||!session)return;
    queued=true;
    queueMicrotask(()=>{
      queued=false;if(closed||!session)return;
      const state=safeState(read());
      const unavailableNow=state.status==='blocked'&&state.reason==='unavailable';
      if(unavailableReported&&!unavailableNow){
        session=null;sequence=0;unavailableReported=false;ready();return;
      }
      unavailableReported=unavailableNow;
      win.parent.postMessage({type:ATLAS_LEARNING_SELECTION_PROTOCOL,version:1,revision,region,
        session,sequence:++sequence,...state},win.location.origin);
    });
  };
  const receive=(event:MessageEvent)=>{
    if(!enabled||closed||event.source!==win.parent||event.origin!==win.location.origin||
      !atlasLearningSelectionRequest(event.data,revision,region))return;
    const request=dataRecord(event.data,['type','version','revision','region','session'])!;
    if(session!==request.session){session=request.session as string;sequence=0;unavailableReported=false;}
    publish();
  };
  if(enabled){win.addEventListener('message',receive as EventListener);ready();}
  return {publish,close(){
    if(closed)return;
    if(enabled&&session)win.parent.postMessage({type:ATLAS_LEARNING_SELECTION_PROTOCOL,version:1,revision,region,
      session,sequence:++sequence,...unavailable},win.location.origin);
    closed=true;session=null;sequence=0;unavailableReported=false;
    if(enabled)win.removeEventListener('message',receive as EventListener);
  }};
}
