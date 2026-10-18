/** Same-origin, revision-bound semantic root selection for leg and thigh. */
import {BODY_FOCUS_PROTOCOL,parseBodyFocusCommand,validBodySelection} from './body-focus-command';

export type BodyRegion='leg'|'thigh';
export const bodyRegion=(value:unknown):value is BodyRegion=>value==='leg'||value==='thigh';
export type BodySelection={kind:'root';id:string;source:string;laterality:string};
export type BodySelectionState=
  |{status:'selected';selection:BodySelection}
  |{status:'empty'}
  |{status:'blocked';reason:'practice'|'guided'|'unavailable'};
export const BODY_SELECTION_PROTOCOL='vm-body-semantic-selection';
const unavailable:BodySelectionState={status:'blocked',reason:'unavailable'};
const exactKeys=(value:object,keys:readonly string[])=>
  Object.getOwnPropertySymbols(value).length===0&&
  Object.getOwnPropertyNames(value).sort().join('|')===[...keys].sort().join('|');
const record=(value:unknown):value is Record<string,unknown>=>
  !!value&&typeof value==='object'&&!Array.isArray(value);
const validState=(value:unknown):value is BodySelectionState=>{
  if(!record(value))return false;
  if(value.status==='selected')return exactKeys(value,['status','selection'])&&validBodySelection(value.selection);
  if(value.status==='empty')return exactKeys(value,['status']);
  return value.status==='blocked'&&exactKeys(value,['status','reason'])&&
    (value.reason==='practice'||value.reason==='guided'||value.reason==='unavailable');
};
const safeState=(value:unknown):BodySelectionState=>{
  if(!validState(value))return unavailable;
  if(value.status==='selected')return {status:'selected',selection:{...value.selection}};
  return value.status==='blocked'?{status:'blocked',reason:value.reason}:{status:'empty'};
};
export function bodySelectionRequest(value:unknown,revision:string,region:BodyRegion):
  value is {type:string;version:1;revision:string;region:BodyRegion;session:string}{
  return /^[a-f0-9]{40}$/.test(revision)&&bodyRegion(region)&&record(value)&&
    exactKeys(value,['type','version','revision','region','session'])&&
    value.type===BODY_SELECTION_PROTOCOL+'-request'&&value.version===1&&
    value.revision===revision&&value.region===region&&
    typeof value.session==='string'&&/^[a-zA-Z0-9_-]{16,80}$/.test(value.session);
}

/** The provider supplies current catalog/scope checks in its focus callback. */
export function createBodySelectionState(changed:()=>void){
  let state:BodySelectionState=unavailable;
  let rootFocus:((target:BodySelection)=>boolean)|undefined;
  return {
    root(value:BodySelectionState,focus?:(target:BodySelection)=>boolean){
      state=safeState(value);rootFocus=focus;changed();
    },
    current():BodySelectionState{return safeState(state);},
    focus(target:BodySelection):boolean{
      return validBodySelection(target)&&state.status!=='blocked'&&!!rootFocus?.(target);
    },
  };
}
type ChannelWindow=Pick<Window,'parent'|'location'|'addEventListener'|'removeEventListener'>;
export function connectBodySelectionChannel(win:ChannelWindow,revision:string,region:BodyRegion,
  read:()=>BodySelectionState,focus?:(target:BodySelection)=>boolean){
  let session:string|null=null,sequence=0,queued=false,closed=false,unavailableReported=false,lastCommand=0;
  const enabled=/^[a-f0-9]{40}$/.test(revision)&&bodyRegion(region)&&
    win.parent!==win&&/^https?:\/\//.test(win.location.origin);
  const ready=()=>win.parent.postMessage({type:BODY_SELECTION_PROTOCOL+'-ready',version:1,revision,region},win.location.origin);
  const publish=()=>{
    if(!enabled||closed||queued)return;
    queued=true;
    queueMicrotask(()=>{
      queued=false;if(closed||!session)return;
      const state=safeState(read());
      const unavailableNow=state.status==='blocked'&&state.reason==='unavailable';
      if(unavailableReported&&!unavailableNow){
        session=null;sequence=0;lastCommand=0;unavailableReported=false;ready();return;
      }
      unavailableReported=unavailableNow;
      win.parent.postMessage({type:BODY_SELECTION_PROTOCOL,version:1,revision,region,
        session,sequence:++sequence,...state},win.location.origin);
    });
  };
  const receive=(event:MessageEvent)=>{
    if(!enabled||closed||event.source!==win.parent||event.origin!==win.location.origin)return;
    if(bodySelectionRequest(event.data,revision,region)){
      if(session!==event.data.session){session=event.data.session;sequence=0;lastCommand=0;unavailableReported=false;}
      publish();return;
    }
    if(!session)return;
    const command=parseBodyFocusCommand(event.data,revision,region,session,lastCommand);
    if(!command)return;
    lastCommand=command.command;
    const accepted=safeState(read()).status!=='blocked'&&!!focus?.(command.target);
    win.parent.postMessage({type:BODY_FOCUS_PROTOCOL+'-result',version:1,revision,region,
      session,command:command.command,status:accepted?'accepted':'refused'},win.location.origin);
    publish();
  };
  if(enabled){win.addEventListener('message',receive as EventListener);ready();}
  return {publish,close(){
    if(closed)return;
    if(enabled&&session)win.parent.postMessage({type:BODY_SELECTION_PROTOCOL,version:1,revision,region,
      session,sequence:++sequence,...unavailable},win.location.origin);
    closed=true;if(enabled)win.removeEventListener('message',receive as EventListener);
  }};
}
