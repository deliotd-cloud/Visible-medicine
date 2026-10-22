/** Same-origin semantic navigation only. No images, coordinates, access or approval. */
import {parseHeadFocusCommand,HEAD_FOCUS_PROTOCOL,type HeadFocusTarget} from './head-focus-command';
export type HeadSelection =
  | {kind:'root';id:string;source:string;laterality:string}
  | {kind:'nested';id:string;source:string;laterality:string;parentId:string;parentSource:string;study:string};
export type HeadSelectionState =
  | {status:'selected';selection:HeadSelection}
  | {status:'empty'}
  | {status:'blocked';reason:'practice'|'guided'|'unavailable'|'sign-in'|'access-denied'};
export type HeadRootState={nested:boolean;state:HeadSelectionState};
export const HEAD_SELECTION_PROTOCOL='vm-head-semantic-selection';
const unavailable:HeadSelectionState={status:'blocked',reason:'unavailable'};
const ownKeys=(v:object,keys:string[])=>Object.keys(v).sort().join('|')===keys.sort().join('|');
export function headSelectionRequest(value:unknown):value is {type:string;version:1;session:string}{
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const v=value as Record<string,unknown>;
  return ownKeys(v,['type','version','session'])&&v.type===HEAD_SELECTION_PROTOCOL+'-request'&&v.version===1&&
    typeof v.session==='string'&&/^[a-zA-Z0-9_-]{16,80}$/.test(v.session);
}
/** Root gates override nested owners; inactive/disappearing children cannot leak a stale focus. */
export function createHeadSelectionState(changed:()=>void){
  let root:HeadRootState={nested:false,state:unavailable};
  let rootFocus:((target:HeadFocusTarget)=>boolean)|undefined;
  const children=new Map<object,HeadSelectionState>();
  const childFocus=new Map<object,(target:HeadFocusTarget)=>boolean>();
  return {
    root(value:HeadRootState,focus?:(target:HeadFocusTarget)=>boolean){root=value;rootFocus=focus;changed();},
    nested(owner:object,value:HeadSelectionState,focus?:(target:HeadFocusTarget)=>boolean){children.set(owner,value);if(focus)childFocus.set(owner,focus);else childFocus.delete(owner);changed();},
    remove(owner:object){children.delete(owner);childFocus.delete(owner);changed();},
    focus(target:HeadFocusTarget):boolean{
      if(root.state.status==='blocked')return false;
      if(!root.nested)return target.kind==='root'&&!!rootFocus?.(target);
      if(target.kind!=='nested'||children.size!==1)return false;
      const [owner,state]=[...children.entries()][0];
      if(state.status==='blocked')return false;
      return !!childFocus.get(owner)?.(target);
    },
    current():HeadSelectionState{
      if(root.state.status==='blocked')return root.state;
      if(!root.nested)return root.state;
      return children.size===1?[...children.values()][0]:unavailable;
    },
  };
}
type ChannelWindow=Pick<Window,'parent'|'location'|'addEventListener'|'removeEventListener'>;
export function connectHeadSelectionChannel(win:ChannelWindow,revision:string,read:()=>HeadSelectionState,focus?:(target:HeadFocusTarget)=>boolean){
  let session:string|null=null,sequence=0,queued=false,closed=false;
  let reportedResourceReason:'unavailable'|'sign-in'|'access-denied'|null=null;
  let lastCommand=0;
  const enabled=/^[a-f0-9]{40}$/.test(revision)&&win.parent!==win&&/^https?:\/\//.test(win.location.origin);
  const publish=()=>{
    if(!enabled||closed||queued)return;queued=true;
    // Coalesce React child/parent layout effects into the final, gated state.
    queueMicrotask(()=>{
      queued=false;if(closed||!session)return;
      const state=read();
      const resourceReason=state.status==='blocked'&&
        (state.reason==='unavailable'||state.reason==='sign-in'||state.reason==='access-denied')
        ? state.reason : null;
      if(reportedResourceReason){
        if(reportedResourceReason===resourceReason)return;
        // The host revoked this resource-blocked session. A recovery or changed
        // resource cause needs a fresh request before any state is published.
        session=null;sequence=0;lastCommand=0;reportedResourceReason=null;
        win.parent.postMessage({type:HEAD_SELECTION_PROTOCOL+'-ready',version:1,revision},win.location.origin);
        return;
      }
      reportedResourceReason=resourceReason;
      win.parent.postMessage({type:HEAD_SELECTION_PROTOCOL,version:1,revision,session,sequence:++sequence,...state},win.location.origin);
    });
  };
  const receive=(event:MessageEvent)=>{
    if(!enabled||closed||event.source!==win.parent||event.origin!==win.location.origin)return;
    if(headSelectionRequest(event.data)){
      if(reportedResourceReason&&session===event.data.session)return;
      if(session!==event.data.session){session=event.data.session;sequence=0;lastCommand=0;reportedResourceReason=null;}
      publish();return;
    }
    if(!session||reportedResourceReason)return;
    const command=parseHeadFocusCommand(event.data,revision,session,lastCommand);
    if(!command)return;
    lastCommand=command.command;
    // Refused commands are consumed too: a later state change must not replay them.
    const accepted=read().status!=='blocked'&&!!focus?.(command.target);
    win.parent.postMessage({type:HEAD_FOCUS_PROTOCOL+'-result',version:1,revision,session,command:command.command,status:accepted?'accepted':'refused'},win.location.origin);
    publish();
  };
  if(enabled){
    win.addEventListener('message',receive as EventListener);
    win.parent.postMessage({type:HEAD_SELECTION_PROTOCOL+'-ready',version:1,revision},win.location.origin);
  }
  return {publish,close(){
    if(closed)return;
    if(enabled&&session&&!reportedResourceReason)win.parent.postMessage({type:HEAD_SELECTION_PROTOCOL,version:1,revision,session,sequence:++sequence,...unavailable},win.location.origin);
    closed=true;if(enabled)win.removeEventListener('message',receive as EventListener);
  }};
}
