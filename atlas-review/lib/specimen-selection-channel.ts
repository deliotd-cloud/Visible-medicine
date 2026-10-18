/** Same-origin, source-bound semantic specimen focus. No patient-space data. */
import type { SpecimenDefinition } from './independent-specimen';
import { makeSpecimenLink, resolveSpecimenLink } from './um-limb-navigation';
import { parseSpecimenLink, specimenScopes, type SpecimenScope } from './specimen-links';
import type { DissectionView } from '../app/dissection-data';

export const SPECIMEN_SELECTION_PROTOCOL = 'vm-specimen-selection';
export const SPECIMEN_FOCUS_PROTOCOL = 'vm-specimen-focus';
export type SpecimenTarget = { scope: SpecimenScope; id: string; source: string; revision: string; laterality: string };
export type SpecimenSelectionState = { status: 'selected'; target: SpecimenTarget } | { status: 'empty' } |
  { status: 'blocked'; reason: 'practice' | 'guided' | 'unavailable' };
const unavailable: SpecimenSelectionState = { status: 'blocked', reason: 'unavailable' };
const hash = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const sessionId = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9_-]{16,80}$/.test(v);
const ownKeys = (v: object, keys: string[]) => Object.keys(v).sort().join('|') === [...keys].sort().join('|');
const validTarget = (v: unknown): v is SpecimenTarget => {
  if (!v || typeof v !== 'object' || Array.isArray(v) || !ownKeys(v, ['scope','id','source','revision','laterality'])) return false;
  const t = v as Record<string,unknown>;
  return specimenScopes.includes(t.scope as SpecimenScope) && typeof t.id === 'string' &&
    /^vm:reference:um-5t6tz7-v1-2:(?:knee|lower-limb):[a-z0-9-]{1,100}$/.test(t.id) &&
    hash(t.source) && hash(t.revision) && ['right-source-report','source-group'].includes(t.laterality as string);
};
export function specimenSelectionRequest(v: unknown): v is {type:string;version:1;session:string} {
  if (!v || typeof v !== 'object' || Array.isArray(v) || !ownKeys(v, ['type','version','session'])) return false;
  const r = v as Record<string,unknown>;
  return r.type === SPECIMEN_SELECTION_PROTOCOL+'-request' && r.version === 1 && sessionId(r.session);
}
export function parseSpecimenFocusCommand(v: unknown, revision: string, session: string, after: number):
  {command:number;target:SpecimenTarget}|null {
  if (!/^[a-f0-9]{40}$/.test(revision) || !sessionId(session) || !Number.isSafeInteger(after) || after < 0 ||
    !v || typeof v !== 'object' || Array.isArray(v) || !ownKeys(v, ['type','version','revision','session','command','target'])) return null;
  const r = v as Record<string,unknown>;
  if (r.type !== SPECIMEN_FOCUS_PROTOCOL || r.version !== 1 || r.revision !== revision || r.session !== session ||
    !Number.isSafeInteger(r.command) || (r.command as number) <= after || !validTarget(r.target)) return null;
  const target=r.target as SpecimenTarget;
  return {command:r.command as number,target:{scope:target.scope,id:target.id,source:target.source,
    revision:target.revision,laterality:target.laterality}};
}
/** Use the existing canonical URL resolver as the public identity authority. */
export function specimenTarget(definition: SpecimenDefinition, id: string, view: DissectionView): SpecimenTarget|null {
  const link = makeSpecimenLink(definition,{selectedId:id,view});
  if (!link) return null;
  const parsed = parseSpecimenLink(Object.fromEntries(new URL(link,'https://atlas.invalid').searchParams));
  const resolved = resolveSpecimenLink(parsed);
  if (parsed.status !== 'requested' || resolved.status !== 'ready' || resolved.selectedId !== id) return null;
  const surface = definition.surfaces.find(s=>s.id===id);
  if (!surface || !['right-source-report','source-group'].includes(surface.laterality)) return null;
  const target = {scope:resolved.scope,id,source:parsed.request.sourceHash,revision:parsed.request.revision,laterality:surface.laterality};
  return validTarget(target) ? target : null;
}
export function specimenChannelState(input:{practice:boolean;guided:boolean;ready:boolean;hidden:boolean;target:SpecimenTarget|null}):SpecimenSelectionState {
  if(input.practice)return {status:'blocked',reason:'practice'};
  if(input.guided)return {status:'blocked',reason:'guided'};
  if(!input.ready||input.hidden)return unavailable;
  return input.target?{status:'selected',target:input.target}:{status:'empty'};
}
/** The live guard is changed only by committed lifecycle or renderer callbacks. */
export function specimenAvailableSnapshot(state:SpecimenSelectionState,available:boolean):SpecimenSelectionState {
  return available?state:unavailable;
}
/** Retry retires the old render's asset callbacks before React commits the new attempt. */
export function createSpecimenLoadAttempt() {
  let generation=0,pending=false;
  return {
    accepts(token:number){return !pending&&token===generation;},
    retire(){generation++;pending=true;},
    commit(token:number){if(token===generation)pending=false;},
    pending(){return pending;},
  };
}
export function specimenFocusAllowed(definition:SpecimenDefinition,input:{current:SpecimenTarget|null;requested:SpecimenTarget;
  view:DissectionView;hiddenIds:readonly string[];loadedBundles:readonly string[];failedBundles:readonly string[];
  practice:boolean;guided:boolean;ready:boolean;pageHidden:boolean}):boolean {
  if(input.practice||input.guided||!input.ready||input.pageHidden||!input.current)return false;
  const target=input.requested,current=input.current;
  if(target.scope!==current.scope||target.revision!==current.revision||target.laterality!==current.laterality||
    input.hiddenIds.includes(target.id))return false;
  const canonical=specimenTarget(definition,target.id,input.view);
  if(!canonical||canonical.source!==target.source||canonical.scope!==target.scope||
    canonical.revision!==target.revision||canonical.laterality!==target.laterality)return false;
  const bundle=definition.catalog.bundles.find(b=>b.sha256===target.source);
  return !!bundle&&input.loadedBundles.includes(bundle.id)&&!input.failedBundles.includes(bundle.id);
}
type ChannelWindow = Pick<Window,'parent'|'location'|'addEventListener'|'removeEventListener'>;
export function connectSpecimenSelectionChannel(win:ChannelWindow,revision:string,read:()=>SpecimenSelectionState,
  focus:(target:SpecimenTarget)=>boolean) {
  let session:string|null=null, sequence=0, command=0, queued=false, closed=false, unavailableReported=false;
  const retired=new Set<string>();
  const enabled=/^[a-f0-9]{40}$/.test(revision)&&win.parent!==win&&/^https?:\/\//.test(win.location.origin);
  const ready=()=>win.parent.postMessage({type:SPECIMEN_SELECTION_PROTOCOL+'-ready',version:1,revision},win.location.origin);
  const publish=()=>{
    if(!enabled||closed||queued)return;
    queued=true;
    queueMicrotask(()=>{
      queued=false;if(closed||!session)return;
      const state=read(), unavailableNow=state.status==='blocked'&&state.reason==='unavailable';
      if(unavailableReported&&!unavailableNow){
        retired.add(session);
        session=null;sequence=0;command=0;unavailableReported=false;ready();return;
      }
      unavailableReported=unavailableNow;
      win.parent.postMessage({type:SPECIMEN_SELECTION_PROTOCOL,version:1,revision,session,sequence:++sequence,...state},win.location.origin);
    });
  };
  const receive=(event:MessageEvent)=>{
    if(!enabled||closed||event.source!==win.parent||event.origin!==win.location.origin)return;
    if(specimenSelectionRequest(event.data)){
      if(retired.has(event.data.session))return;
      if(session!==event.data.session){if(session)retired.add(session);session=event.data.session;sequence=0;command=0;unavailableReported=false;}
      publish();return;
    }
    if(!session)return;
    const parsed=parseSpecimenFocusCommand(event.data,revision,session,command);
    if(!parsed)return;
    command=parsed.command; // Refused commands are consumed and cannot replay after a state change.
    const accepted=read().status!=='blocked'&&focus(parsed.target);
    win.parent.postMessage({type:SPECIMEN_FOCUS_PROTOCOL+'-result',version:1,revision,session,command,status:accepted?'accepted':'refused'},win.location.origin);
    publish();
  };
  if(enabled){win.addEventListener('message',receive as EventListener);ready();}
  return {publish,close(){
    if(closed)return;
    if(enabled&&session)win.parent.postMessage({type:SPECIMEN_SELECTION_PROTOCOL,version:1,revision,session,sequence:++sequence,...unavailable},win.location.origin);
    closed=true;if(enabled)win.removeEventListener('message',receive as EventListener);
  }};
}
