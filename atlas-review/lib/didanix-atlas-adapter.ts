import type { createImagingBridge, SelectionResult } from './imaging-sync';
import type { createLearningRegistry, LearningLocator, LearningMatch, RepresentationScope } from './learning-resources';

type Registry = ReturnType<typeof createLearningRegistry>;
type Bridge = ReturnType<typeof createImagingBridge>;
type ImagingMatch = LearningMatch & { anchor: Exclude<LearningMatch['anchor'], {type:'slide'|'question'}> };
export type DidanixStudy = { resourceId:string; revision:number; materialSha256:string };
export type DidanixAnnotationSelection = {messageId:string; locator:unknown};
export type DidanixLinkStatus = 'disconnected'|'paused'|'unavailable'|'choice-required'|'revealed'|'selected'|'adapter-error';

/** Trusted local adapter, not an authentication boundary. No pixels, UIDs,
 * patient points, guessed transforms, URLs or lecture contents pass through it.
 * The Education viewer retains source frame/annotation -> DICOM/LPS resolution.
 */
export type DidanixEducationPort = {
  getStudy: () => DidanixStudy | null;
  canNavigate: () => boolean;
  /** Must recheck server access before reading media; honour signal and isCurrent
   * immediately before changing viewer state. Never silently open another case. */
  reveal: (match: ImagingMatch, guard: {signal:AbortSignal; isCurrent:()=>boolean}) => Promise<void>;
  /** User annotation clicks only, with stable event IDs. Do not echo programmatic reveals. */
  subscribeSelection: (listener:(event:DidanixAnnotationSelection)=>SelectionResult) => ()=>void;
  /** Emit on study change, close, revoked access and practice/exam entry. */
  subscribeContext: (listener:()=>void) => ()=>void;
};

const imaging = (match:LearningMatch):match is ImagingMatch =>
  ['ct','mri','xray','ultrasound'].includes(match.resource.kind) &&
  ['volume','projection','ultrasound'].includes(match.anchor.type);
const sameStudy = (study:DidanixStudy|null,match:LearningMatch) => !!study &&
  study.resourceId===match.resource.id && study.revision===match.resource.revision &&
  study.materialSha256===match.resource.material.sha256;

export function connectDidanixEducation({bridge,registry,viewer,scope,onStatus=()=>{}}:{
  bridge:Bridge; registry:Registry; viewer:DidanixEducationPort;
  scope:RepresentationScope; onStatus?:(status:DidanixLinkStatus)=>void;
}) {
  let disposed=false,enabled=false,generation=0,flight:AbortController|null=null;
  let choices:LearningLocator[]=[];
  let destination:'atlas'|'viewer'='viewer';
  const report=(status:DidanixLinkStatus)=>{ try { onStatus(status); } catch { /* Status UI cannot interrupt the viewer. */ } };
  const cancel=()=>{generation++; flight?.abort(); flight=null; choices=[];};
  const allowed=()=>{try{return !disposed && enabled && viewer.canNavigate()===true;}catch{return false;}};
  const resolve=(locator:unknown):ImagingMatch|null=>{
    if(!allowed()) return null;
    const result=registry.resolve(locator);
    if(result.status!=='ready'||!imaging(result.match)||result.match.link.anatomy.scope!==scope) return null;
    try {return sameStudy(viewer.getStudy(),result.match)?result.match:null;}catch{return null;}
  };
  async function reveal(locator:unknown) {
    cancel(); const match=resolve(locator);
    if(!match){report(allowed()?'unavailable':'paused');return false;}
    const controller=new AbortController(),token=generation; flight=controller;
    const isCurrent=()=>!controller.signal.aborted && generation===token && resolve(match.locator)!==null;
    try {
      await viewer.reveal(structuredClone(match),{signal:controller.signal,isCurrent});
      if(!isCurrent()) return false;
      report('revealed');return true;
    }catch{if(isCurrent()) report('adapter-error');return false;}
    finally{if(flight===controller)flight=null;}
  }
  // Registration notifies bridge subscribers synchronously; one may unmount
  // the source view before registerAdapter has returned its handle.
  let pauseBridge=()=>{};
  const registered=bridge.registerAdapter({id:'vm-didanix-education',label:'Didanix Education',modality:'multimodal',
    onAtlasDetached:()=>{cancel();enabled=false;pauseBridge();report('paused');},
    onAtlasSelection:selection=>{
      cancel();
      if(!allowed()){report('paused');return;}
      const matches=registry.related(scope,selection.structureId)
        .filter(imaging).filter(m=>resolve(m.locator)!==null)
        .filter(m=>JSON.stringify([...m.link.anatomy.sources].sort((a,b)=>a.file.localeCompare(b.file)))===JSON.stringify([...selection.anatomy.sources].sort((a,b)=>a.file.localeCompare(b.file))));
      // A component/broader/related annotation never masquerades as an exact label.
      if(matches.length===1 && matches[0].link.relation==='exact') { void reveal(matches[0].locator); return; }
      choices=matches.map(m=>m.locator);
      destination='viewer';
      report(choices.length?'choice-required':'unavailable');
    },
  });
  pauseBridge=()=>registered.pause();
  let stopSelection=()=>{},stopContext=()=>{};
  try {
    stopSelection=viewer.subscribeSelection(event=>{
      if(!event || typeof event.messageId!=='string' || !/^[A-Za-z0-9:._-]{1,220}$/.test(event.messageId)) return {messageId:null,status:'invalid'};
      cancel();const match=resolve(event.locator);
      if(!match){report(allowed()?'unavailable':'paused');return {messageId:null,status:'paused'};}
      if(match.link.relation!=='exact'){choices=[match.locator];destination='atlas';report('choice-required');return {messageId:event.messageId,status:'choice-required'};}
      const result=registered.selectStructure({version:1,origin:'imaging',messageId:event.messageId,structureId:match.link.anatomy.structureId});
      report(result.status==='selected'?'selected':result.status==='choice-required'?'choice-required':'paused');return result;
    });
    stopContext=viewer.subscribeContext(()=>{cancel();enabled=false;registered.pause();report('paused');});
  } catch(error) { try{stopSelection();}finally{registered.dispose();}throw error; }
  report('paused');
  return {
    setEnabled(value:boolean){cancel();enabled=value===true && !disposed;if(!enabled)registered.pause();report('paused');},
    /** Re-resolve current rights and revision; return copies, never stale cached matches. */
    choices(){return choices.map(resolve).filter((m):m is ImagingMatch=>m!==null).map(m=>({match:structuredClone(m),destination}));},
    choose(locator:unknown){
      const match=resolve(locator);
      if(!match||!choices.some(c=>JSON.stringify(c)===JSON.stringify(match.locator))) return Promise.resolve(false);
      if(destination==='atlas') {
        cancel();
        const result=registered.selectStructure({version:1,origin:'imaging',messageId:crypto.randomUUID(),structureId:match.link.anatomy.structureId});
        report(result.status==='selected'?'selected':'paused');return Promise.resolve(result.status==='selected');
      }
      return reveal(match.locator);
    },
    dispose(){if(disposed)return;disposed=true;enabled=false;cancel();try{stopSelection();}finally{try{stopContext();}finally{registered.dispose();report('disconnected');}}},
  };
}
