'use client';

import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {parseRegionalMriCorrectionContext,parseRegionalMriCorrectionEvent,sameRegionalMriCorrectionContext,validateRegionalMriCorrectionDraft,type RegionalMriCorrectionContext,type RegionalMriCorrectionDraft,type RegionalMriCorrectionEvent} from '../lib/regional-mri-correction-contract';
import {regionalMriWorkingCopy,readRegionalMriWorkingCopy,downloadRegionalMriWorkingCopy} from '../lib/regional-mri-working-copy';

type Props={sourceRevision:string;projectionRevision:string;sequenceId:string;annotationId:string;sourceRetired?:boolean;onDirtyChange?:(dirty:boolean)=>void};
type State={key:string;open:boolean;phase:'closed'|'loading'|'ready'|'saving'|'error'|'compare'|'identity';context:RegionalMriCorrectionContext|null;token:string|null;history:RegionalMriCorrectionEvent[];latest:number;base:number;before:number|null;draft:RegionalMriCorrectionDraft;touched:boolean;rebase:boolean;compareLoaded:boolean;message:string};
const blank=():RegionalMriCorrectionDraft=>({status:'draft',notes:'',checks:{identity:false,extent:false,sourceScope:false},attested:false});
const fresh=(key:string):State=>({key,open:false,phase:'closed',context:null,token:null,history:[],latest:0,base:0,before:null,draft:blank(),touched:false,rebase:false,compareLoaded:false,message:''});
const endpoint='/api/atlas-review/regional-mri';
const tokenPattern=/^[a-f0-9]{64}$/;
const keys=(value:unknown,expected:string[]):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===expected.length&&expected.every(key=>Object.hasOwn(value,key));
function batch(body:unknown,selection:Props,before:number|null){
 if(!keys(body,['context','history','latestVersion','nextBefore','scope'])||body.scope!=='private-to-signed-in-account-and-institution'||!Array.isArray(body.history)||body.history.length>20||!Number.isSafeInteger(body.latestVersion)||Number(body.latestVersion)<0||Number(body.latestVersion)>2147483647)throw Error('invalid');
 const context=parseRegionalMriCorrectionContext(body.context);
 if(context.sourceRevision!==selection.sourceRevision||context.projectionRevision!==selection.projectionRevision||context.sequenceId!==selection.sequenceId||context.annotation.id!==selection.annotationId)throw Error('selection');
 const history=body.history.map(parseRegionalMriCorrectionEvent);
 if(history.some((event,index)=>!sameRegionalMriCorrectionContext(event.context,context)||event.version>Number(body.latestVersion)||(before!==null&&event.version>=before)||(index>0&&event.version!==history[index-1].version-1)))throw Error('history');
 if(before===null&&(history[0]?.version??0)!==body.latestVersion)throw Error('latest');
 const next=body.nextBefore;
 if(next!==null&&(typeof next!=='number'||!Number.isSafeInteger(next)||next<1||next!==history.at(-1)?.version||history.length!==20))throw Error('cursor');
 if(next===null&&history.length===20&&history.at(-1)!.version>1)throw Error('truncated');
 return {context,history,latest:Number(body.latestVersion),before:next as number|null};
}
export function RegionalMriCorrectionPanel(props:Props){
 const key=JSON.stringify([props.sourceRevision,props.projectionRevision,props.sequenceId,props.annotationId]);
 const [stored,setStored]=useState<State>(()=>fresh(key));
 const current=useRef(stored),controller=useRef<AbortController|null>(null),authority=useRef<{key:string;token:number}|null>(null),renderNumber=useRef(0),live=useRef(false),reload=useRef<()=>void>(()=>{});
 const reportDirty=useRef(props.onDirtyChange);
 const renderToken=++renderNumber.current;
 const state=stored.key===key?stored:fresh(key);
 const publish=(next:State)=>{current.current=next;setStored(next);};
 const active=()=>!props.sourceRetired&&live.current&&authority.current?.key===key&&authority.current.token===renderToken;
 const retire=()=>{controller.current?.abort();controller.current=null;};
 useLayoutEffect(()=>{authority.current={key,token:renderToken};reportDirty.current=props.onDirtyChange;reload.current=()=>load();if(props.sourceRetired)retire();if(current.current.key!==key){retire();publish(fresh(key));}});
 useEffect(()=>{live.current=true;const now=current.current;if(now.open&&now.phase==='saving')publish({...now,phase:'compare',rebase:true,compareLoaded:false,message:'Save was interrupted. Reload history and explicitly compare your edits before saving.'});else if(now.open&&now.phase==='loading')reload.current();return()=>{live.current=false;retire();};},[]);
 useLayoutEffect(()=>{props.onDirtyChange?.(state.touched||state.rebase||state.phase==='saving');},[key,state.touched,state.rebase,state.phase,props.onDirtyChange]);
 useEffect(()=>()=>{props.onDirtyChange?.(false);},[key]);
 useEffect(()=>{if(!(state.touched||state.rebase||state.phase==='saving')||typeof window==='undefined')return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[key,state.touched,state.rebase,state.phase]);
 const headers=()=>({'X-Regional-MRI-Source':props.sourceRevision,'X-Regional-MRI-Projection':props.projectionRevision,'X-Regional-MRI-Sequence':props.sequenceId,'X-Regional-MRI-Annotation':props.annotationId});
 const load=(older=false)=>{
  if(!active())return;
  const prior=current.current;if(prior.key!==key||!prior.open||prior.phase==='saving'||older&&(prior.before===null||prior.phase!=='ready'))return;
  retire();const abort=new AbortController();controller.current=abort;
  const cursor=older?prior.before:null;
  publish({...prior,phase:'loading',message:''});
  void(async()=>{
   try{
    const response=await fetch(endpoint,{method:'GET',credentials:'same-origin',cache:'no-store',redirect:'error',signal:abort.signal,headers:{...headers(),...(cursor===null?{}:{'X-Regional-MRI-Before':String(cursor)})}});
    if(abort.signal.aborted||authority.current?.key!==key)return;
    if(response.status===401||response.status===403){publish({...current.current,open:false,phase:'identity',rebase:true,message:'Review access or account changed. Keep your edits and reopen this section after signing in.'});return;}
    if(!response.ok)throw Error('load');
    const token=response.headers.get('X-Clinical-Review-Context');
    if(!token||!tokenPattern.test(token))throw Error('token');
    if(prior.token&&token!==prior.token){publish({...current.current,open:false,phase:'identity',rebase:true,context:null,history:[],token:null,message:'Account or institution context changed. Keep your edits and reopen this section.'});return;}
    let parsed;try{parsed=batch(await response.json(),props,cursor);}catch{throw Error('invalid');}
    if(abort.signal.aborted||authority.current?.key!==key)return;
    const now=current.current;
    if(older){
     if(!now.context||!sameRegionalMriCorrectionContext(now.context,parsed.context)||parsed.history.some(event=>now.history.some(existing=>existing.version===event.version))||parsed.history.length&&parsed.history[0].version!==now.history.at(-1)!.version-1)throw Error('page');
     const changed=parsed.latest!==now.latest;
     publish({...now,phase:changed?'compare':'ready',history:[...now.history,...parsed.history],before:parsed.before,rebase:now.rebase||changed,compareLoaded:changed?false:now.compareLoaded,message:changed?'Newer saved history appeared. Reload latest history before comparing your edits.':'Older private correction history loaded.'});
    }else{
     const canSeed=!now.touched&&!now.rebase;
     publish({...now,phase:now.rebase||now.touched?'compare':'ready',context:parsed.context,token,history:parsed.history,latest:parsed.latest,base:canSeed?parsed.latest:now.base,before:parsed.before,draft:canSeed?parsed.history[0]?.draft??blank():now.draft,rebase:now.rebase||now.touched,compareLoaded:true,message:'Private correction history loaded. This is a draft, not clinical acceptance or patient registration.'});
    }
   }catch{if(!abort.signal.aborted&&authority.current?.key===key){const now=current.current;publish({...now,phase:now.rebase?'compare':'error',rebase:now.rebase||now.touched,compareLoaded:false,message:'History could not be confirmed. Keep your edits and reload history before saving.'});}}
   finally{if(controller.current===abort)controller.current=null;}
  })();
 };
 const edit=(next:RegionalMriCorrectionDraft)=>{if(!active())return;const now=current.current;if(now.key!==key||now.phase==='saving'||!now.open)return;props.onDirtyChange?.(true);publish({...now,draft:next,touched:true});};
 const save=()=>{
  if(!active())return;const prior=current.current;
  if(prior.key!==key||!prior.open||prior.phase!=='ready'||prior.rebase||!prior.context||!prior.token||!tokenPattern.test(prior.token))return;
  let draft;try{draft=validateRegionalMriCorrectionDraft(prior.draft);}catch{publish({...prior,message:'Check the draft status and notes before saving.'});return;}
  props.onDirtyChange?.(true);retire();const abort=new AbortController();controller.current=abort;publish({...prior,phase:'saving',message:'Saving private draft…'});
  void(async()=>{
   try{
    const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',redirect:'error',signal:abort.signal,headers:{...headers(),'Content-Type':'application/json','X-Clinical-Review-Context':prior.token!},body:JSON.stringify({context:prior.context,expectedVersion:prior.base,draft})});
    if(abort.signal.aborted||authority.current?.key!==key)return;
    if(response.status===401||response.status===403){publish({...current.current,open:false,phase:'identity',rebase:true,context:null,history:[],token:null,message:'Review access or account changed. Keep your edits and reopen this section.'});return;}
    if(response.status===409)throw Error('competing');
    if(response.status!==201)throw Error('uncertain');
    const token=response.headers.get('X-Clinical-Review-Context');
    if(token!==prior.token)throw Error('identity');
    const body:unknown=await response.json();if(!keys(body,['review']))throw Error('uncertain');
    const event=parseRegionalMriCorrectionEvent(body.review);
    if(!sameRegionalMriCorrectionContext(event.context,prior.context)||event.version!==prior.base+1||JSON.stringify(event.draft)!==JSON.stringify(draft))throw Error('uncertain');
    if(abort.signal.aborted||authority.current?.key!==key)return;
    const now=current.current;publish({...now,phase:'ready',latest:event.version,base:event.version,history:[event,...now.history],draft,touched:false,compareLoaded:true,message:'Private correction draft saved. No approval or publication was recorded.'});
   }catch(error){if(!abort.signal.aborted&&authority.current?.key===key){const now=current.current;const identity=error instanceof Error&&error.message==='identity';publish({...now,phase:identity?'identity':'compare',rebase:true,compareLoaded:false,open:identity?false:now.open,context:identity?null:now.context,history:identity?[]:now.history,token:identity?null:now.token,message:'Save could not be confirmed or another version was saved. Keep your edits, reload history, then explicitly compare before saving again.'});}}
   finally{if(controller.current===abort)controller.current=null;}
  })();
 };
 const downloadCopy=()=>{
  if(!live.current||authority.current?.key!==key||authority.current.token!==renderToken)return;
  const now=current.current;if(!now.context||!now.token)return;
  try{
   const copy=regionalMriWorkingCopy(now.context,now.draft,{baseVersion:now.base,unsavedChanges:now.touched,saveUncertain:now.rebase||now.phase==='saving',reloadRequired:now.rebase||!!props.sourceRetired},now.token);
   downloadRegionalMriWorkingCopy(copy);publish({...now,message:'Private working-copy download requested. Keep the file private; it is not saved history or approval.'});
  }catch{publish({...now,message:'The working copy could not be downloaded. Keep your notes here and try again.'});}
 };
 const restoreCopy=(file:File|undefined)=>{
  if(!active()||!file)return;const prior=current.current;
  if(!prior.context||!prior.token||!prior.compareLoaded||!['ready','compare'].includes(prior.phase))return;
  retire();const abort=new AbortController();controller.current=abort;
  void(async()=>{
   try{
    const copy=await readRegionalMriWorkingCopy(file,prior.context!,prior.token!,abort.signal);
    if(abort.signal.aborted||authority.current?.key!==key)return;
    const now=current.current;if(!now.context||now.token!==prior.token||!sameRegionalMriCorrectionContext(now.context,prior.context)||!['ready','compare'].includes(now.phase))return;
    if((now.touched||now.rebase)&&!window.confirm('Replace the current unfinished notes with this local working copy? No save or approval will be recorded.'))return;
    reportDirty.current?.(true);publish({...now,draft:copy.workingDraft,touched:true,rebase:true,compareLoaded:false,phase:'compare',
     message:`Local working draft restored from ${copy.createdAt}. Its recorded version is not save authority. Reload latest history and compare before saving.`});
   }catch{if(!abort.signal.aborted&&authority.current?.key===key)publish({...current.current,message:'This private working copy could not be restored for the current source and account. Existing edits were kept.'});}
   finally{if(controller.current===abort)controller.current=null;}
  })();
 };
 const toggle=(open:boolean)=>{if(!active())return;retire();const now=current.current;const uncertain=!open&&now.phase==='saving';if(uncertain)props.onDirtyChange?.(true);publish({...now,open,phase:open?'loading':'closed',history:open?now.history:[],rebase:now.rebase||uncertain,compareLoaded:open?false:now.compareLoaded,message:open?'Loading private correction history.':''});if(open)load();};
 const canEdit=!props.sourceRetired&&state.open&&!!state.context&&state.phase!=='saving'&&state.phase!=='identity';
 return <details open={state.open||!!props.sourceRetired} onToggle={event=>{if(props.sourceRetired){event.currentTarget.open=true;return;}const open=event.currentTarget.open;if(open!==current.current.open)toggle(open);}} aria-label="Private regional MRI correction draft and history">
  <summary>Private correction draft and history</summary>
  {!state.open&&state.phase==='identity'&&<p role="alert">Account or institution context changed. Reopen to check private history. Your edits remain in this panel.</p>}
  {(state.open||props.sourceRetired)&&<section aria-label="Private source correction draft"><p>For this verified MRI annotation only. Saved drafts are private to the signed-in account and institution. Checks record inspection, not clinical acceptance, patient registration, or publication. Do not enter patient identifiers or scan data.</p>
   {props.sourceRetired&&<p role="alert">Retained previous-source draft: read-only, not current review. Copy these notes before discarding the retained source.</p>}
   <p role="status" aria-live="polite">{state.message||'Private correction history has not loaded.'}</p>
   {state.phase==='identity'&&<p role="alert">Account or institution context needs a fresh opening. Your text remains here.</p>}
   {state.phase==='error'&&<p role="alert">The correction history is unavailable. Saving is disabled.</p>}
   {state.phase==='compare'&&<p role="alert">Saving is paused until you compare your edits with the latest saved history.</p>}
   {(state.phase==='compare'||state.phase==='error')&&<button type="button" disabled={props.sourceRetired} onClick={()=>load()}>Reload latest history</button>}
   {state.context&&<><p>Selected source: {state.context.sequenceLabel} · {state.context.annotation.label} · {state.context.annotation.reviewStatus}. Version {state.latest}.</p>
    <details><summary>Private working copy · keep unfinished notes</summary>
     <p>Text and source metadata only; no scans or masks. Keep downloaded files private. Restoring never saves, approves, or adopts the file's recorded version.</p>
     <button type="button" disabled={!state.token} onClick={downloadCopy}>Download private working copy</button>
     <label>Restore private working copy <input type="file" accept=".json,application/json" disabled={props.sourceRetired||!state.token||!state.compareLoaded||!['ready','compare'].includes(state.phase)}
      onChange={event=>{const file=event.currentTarget.files?.[0];event.currentTarget.value='';restoreCopy(file);}}/></label>
    </details>
    <label>Draft status <select value={state.draft.status} disabled={!canEdit} onChange={event=>edit({...state.draft,status:event.currentTarget.value as RegionalMriCorrectionDraft['status']})}><option value="draft">Draft</option><option value="changes-required">Changes required</option></select></label>
    <label>Correction notes <textarea value={state.draft.notes} maxLength={6000} readOnly={props.sourceRetired} disabled={!canEdit&&!props.sourceRetired} onChange={event=>edit({...state.draft,notes:event.currentTarget.value})}/></label>
    {([['identity','Source and annotation identity inspected'],['extent','Geometry extent inspected'],['sourceScope','Source review scope inspected']] as const).map(([field,label])=><label key={field}><input type="checkbox" checked={state.draft.checks[field]} disabled={!canEdit} onChange={event=>edit({...state.draft,checks:{...state.draft.checks,[field]:event.currentTarget.checked}})}/>{label}</label>)}
    <p>These inspection checks do not attest or approve the source.</p>
    <button type="button" disabled={props.sourceRetired||state.phase!=='ready'||state.rebase||!state.token} onClick={save}>Save private draft</button>
    {state.rebase&&state.compareLoaded&&state.phase==='compare'&&state.context&&<button type="button" disabled={props.sourceRetired} onClick={()=>{if(!active())return;const now=current.current;if(now.compareLoaded&&now.phase==='compare'&&now.token&&now.context&&((now.history[0]?.version===now.latest)||(now.latest===0&&now.history.length===0)))publish({...now,base:now.latest,rebase:false,phase:'ready',message:'Your edits are kept against the displayed latest history. Review them before saving.'});}}>Keep my edits against latest history</button>}
    <h4>Saved private drafts</h4>{state.history.length?<ol>{state.history.map(event=><li key={event.version}>Version {event.version} · {event.savedAt} · {event.draft.status}: {event.draft.notes}</li>)}</ol>:<p>No saved correction drafts for this selection.</p>}
    {state.before!==null&&<button type="button" disabled={props.sourceRetired||state.phase!=='ready'} onClick={()=>load(true)}>Load older history</button>}
   </>}
  </section>}
 </details>;
}
