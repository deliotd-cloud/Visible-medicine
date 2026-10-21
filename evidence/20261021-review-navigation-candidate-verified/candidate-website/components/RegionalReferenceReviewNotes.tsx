'use client';

import {useEffect,useLayoutEffect,useRef,useState,type SyntheticEvent} from 'react';
import {clinicalReviewFetch} from '../lib/clinical-review-fetch';
import {blankRegionalReferenceDraft,regionalReferenceDraftChecks,sameRegionalReferenceDraftContext,validateRegionalReferenceDraft,type RegionalReferenceDraft,type RegionalReferenceDraftContext,type RegionalReferenceDraftEvent} from '../lib/regional-reference-draft-contract';
import {confirmRegionalReferenceDraftSave,downloadRegionalReferenceWorkingCopy,parseRegionalReferenceDraftHistory,regionalReferenceDraftHeaders,regionalReferenceWorkingCopy,RegionalReferenceSourceChangedError} from '../lib/regional-reference-draft-client';
import './regional-reference-review-notes.css';
import {NotesConsiderations,exactReviewChecks} from './GroupedReviewConfirmation';
import {createReviewDraftAutosave,mayAutosaveDraft,reviewDraftStamp} from '../lib/review-draft-autosave';
import {registerClinicalReviewNavigationGuard} from '../lib/clinical-review-navigation-guard';

const endpoint='/api/atlas-review/reference-learning';
type ReadMode='first'|'refresh'|'older';
type ResponseBody={error?:unknown;code?:unknown};
async function body(response:Response):Promise<unknown>{try{return await response.json();}catch{return {};}}
function errorText(value:unknown,fallback:string){return value&&typeof value==='object'&&typeof (value as ResponseBody).error==='string'?(value as ResponseBody).error as string:fallback;}

/** Private authoring for one immutable public reference-teaching snapshot. */
export function RegionalReferenceReviewNotes({context}:{context:RegionalReferenceDraftContext}){
 const [owner,setOwner]=useState(context);
 const [open,setOpen]=useState(false),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false);
 const [draft,setDraft]=useState<RegionalReferenceDraft>(()=>blankRegionalReferenceDraft());
 const [history,setHistory]=useState<RegionalReferenceDraftEvent[]>([]),[nextBefore,setNextBefore]=useState<number|null>(null);
 const [latest,setLatest]=useState(0),[base,setBase]=useState<number|null>(null);
 const [dirty,setDirty]=useState(false),[uncertain,setUncertain]=useState(false),[retired,setRetired]=useState(false),[compare,setCompare]=useState(false),[comparisonReady,setComparisonReady]=useState(false);
 const [message,setMessage]=useState('Open to read private saved history.'),[error,setError]=useState(false),[downloadMessage,setDownloadMessage]=useState('');
 const [discard,setDiscard]=useState(false),[discardToken,setDiscardToken]=useState(0);
 const mounted=useRef(false),epoch=useRef(0),inFlight=useRef(false),requestKind=useRef<'read'|'save'|null>(null),replayedPending=useRef(false);
 const ownerRef=useRef(owner),contextRef=useRef(context),draftRef=useRef(draft),dirtyRef=useRef(false),uncertainRef=useRef(false),retiredRef=useRef(false),openRef=useRef(false),compareRef=useRef(false),comparisonReadyRef=useRef(false);
 const latestRef=useRef(0),baseRef=useRef<number|null>(null),loadedRef=useRef(false),historyRef=useRef<RegionalReferenceDraftEvent[]>([]);
 const discardSequence=useRef(0),discardOpen=useRef(false),discardIdentity=useRef<{token:number;owner:RegionalReferenceDraftContext;incoming:RegionalReferenceDraftContext;draft:RegionalReferenceDraft}|null>(null);
 const autosave=useRef(createReviewDraftAutosave()),autosaveStamp=useRef(''),autosaveAllowed=useRef(false);
 const current=sameRegionalReferenceDraftContext(owner,context);
 const handlerCurrent=()=>mounted.current&&sameRegionalReferenceDraftContext(owner,ownerRef.current)&&sameRegionalReferenceDraftContext(context,contextRef.current);
 const sameLive=()=>sameRegionalReferenceDraftContext(ownerRef.current,contextRef.current);
 const gate=()=>handlerCurrent()&&openRef.current&&sameLive();
 const status=(value:string,failed=false)=>{setMessage(value);setError(failed);};
 const markUncertain=(value:boolean)=>{uncertainRef.current=value;setUncertain(value);};
 const markRetired=(value:boolean)=>{retiredRef.current=value;setRetired(value);};
 const markDirty=(value:boolean)=>{dirtyRef.current=value;setDirty(value);};
 const markCompare=(value:boolean)=>{compareRef.current=value;setCompare(value);};
 const markComparisonReady=(value:boolean)=>{comparisonReadyRef.current=value;setComparisonReady(value);};
 const setOwnedDraft=(value:RegionalReferenceDraft)=>{draftRef.current=value;setDraft(value);};
 const setOwnedBase=(value:number|null)=>{baseRef.current=value;setBase(value);};
 const setOwnedLatest=(value:number)=>{latestRef.current=value;setLatest(value);};
 const dismissDiscard=()=>{discardSequence.current++;discardOpen.current=false;discardIdentity.current=null;setDiscard(false);};
 function requestDiscard(){
  autosave.current.cancel();
  if(!handlerCurrent()||inFlight.current)return;
  const token=++discardSequence.current;discardOpen.current=true;discardIdentity.current={token,owner:ownerRef.current,incoming:contextRef.current,draft:draftRef.current};setDiscardToken(token);setDiscard(true);
 }
 useEffect(()=>{mounted.current=true;if(replayedPending.current){replayedPending.current=false;setBusy(false);markComparisonReady(false);}return()=>{autosave.current.cancel();mounted.current=false;epoch.current++;replayedPending.current=inFlight.current;inFlight.current=false;requestKind.current=null;};},[]);
 useLayoutEffect(()=>{
  if(sameRegionalReferenceDraftContext(contextRef.current,context))return;
  autosave.current.cancel();
  contextRef.current=context;epoch.current++;inFlight.current=false;requestKind.current=null;
  markComparisonReady(false);setBusy(false);dismissDiscard();
  // A prior POST may have committed. Its unconfirmed outcome remains attached to the held copy.
 },[context]);
 useEffect(()=>{if(!(dirty||uncertain||busy))return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);const unregister=registerClinicalReviewNavigationGuard(document,()=>true);return()=>{window.removeEventListener('beforeunload',warn);unregister();};},[dirty,uncertain,busy]);
 async function read(mode:ReadMode,before?:number){
  autosave.current.cancel();
  if(!gate()||inFlight.current||retiredRef.current)return;
  markComparisonReady(false);
  const ticket=++epoch.current;inFlight.current=true;requestKind.current='read';setBusy(true);
  const owned=ownerRef.current;
  const valid=()=>ticket===epoch.current&&mounted.current&&openRef.current&&sameRegionalReferenceDraftContext(owned,ownerRef.current)&&sameRegionalReferenceDraftContext(owned,contextRef.current);
  try{
   const response=await clinicalReviewFetch(endpoint,{cache:'no-store',headers:regionalReferenceDraftHeaders(owned,before)});
   if(!valid())return;
   const value=await body(response);
   if(!valid())return;
   if(response.status===401||response.status===403||response.status===409){markRetired(true);throw Error('The source or authorized account changed. Export your notes and reload this page.');}
   if(!response.ok)throw Error(errorText(value,'History unavailable. Keep your edits.'));
   const parsed=parseRegionalReferenceDraftHistory(value,owned,before);
   if(!valid())return;
   if(mode==='older'){
    const merged=[...historyRef.current,...parsed.history];historyRef.current=merged;setHistory(merged);setNextBefore(parsed.nextBefore);
    status('Older saved history loaded. Your current notes are unchanged.');
   }else{
    historyRef.current=parsed.history;setHistory(parsed.history);setNextBefore(parsed.nextBefore);
    loadedRef.current=true;setLoaded(true);setOwnedLatest(parsed.latestVersion);
    if(baseRef.current===null&&!dirtyRef.current&&!uncertainRef.current)setOwnedBase(parsed.latestVersion);
    markCompare(dirtyRef.current||uncertainRef.current||baseRef.current!==parsed.latestVersion);markComparisonReady(true);
    status(dirtyRef.current||uncertainRef.current?'Latest history loaded. Compare it with your retained edits before choosing a new base.':`History loaded. Latest version ${parsed.latestVersion}.`);
   }
  }catch(caught){if(valid()){
   if(caught instanceof RegionalReferenceSourceChangedError)markRetired(true);
   status(caught instanceof Error?caught.message:'History unavailable. Keep your edits.',true);
  }}finally{if(ticket===epoch.current){inFlight.current=false;requestKind.current=null;if(mounted.current)setBusy(false);}}
 }
 function toggle(event:SyntheticEvent<HTMLDetailsElement>){
  if(!handlerCurrent())return;
  const next=event.currentTarget.open;openRef.current=next;setOpen(next);
  if(!next){autosave.current.cancel();if(requestKind.current==='save')markUncertain(true);epoch.current++;inFlight.current=false;requestKind.current=null;setBusy(false);dismissDiscard();return;}
  if(!loadedRef.current&&!inFlight.current&&!retiredRef.current)void read('first');
 }
 function edit(change:Partial<RegionalReferenceDraft>){
  autosave.current.cancel();
  if(!gate()||retiredRef.current||inFlight.current)return;
  setOwnedDraft({...draftRef.current,...change});markDirty(true);dismissDiscard();
 }
 function exportCopy(){
  if(!handlerCurrent())return;
  try{downloadRegionalReferenceWorkingCopy(regionalReferenceWorkingCopy(ownerRef.current,draftRef.current,{baseVersion:baseRef.current,unsavedChanges:dirtyRef.current,saveUncertain:uncertainRef.current||inFlight.current}));setDownloadMessage('Working-copy download requested. Confirm the file was saved and keep it private.');}
  catch{setDownloadMessage('Download could not start. Keep this page open and copy the notes before leaving.');}
 }
 function choose(record?:RegionalReferenceDraftEvent){
  autosave.current.cancel();
  if(!gate()||retiredRef.current||inFlight.current||!loadedRef.current||dirtyRef.current||uncertainRef.current||compareRef.current||record&&!sameRegionalReferenceDraftContext(record.context,ownerRef.current))return;
  const next=record?validateRegionalReferenceDraft(record.draft):blankRegionalReferenceDraft();setOwnedDraft(next);setOwnedBase(latestRef.current);markDirty(false);markUncertain(false);
  status(record?`Loaded version ${record.version} against latest version ${latestRef.current}. Saving creates a new entry.`:'Fresh draft started against the latest saved version.');
 }
 function keepEdits(){
  if(!gate()||retiredRef.current||inFlight.current||!loadedRef.current||!compareRef.current||!comparisonReadyRef.current||!dirtyRef.current&&!uncertainRef.current)return;
  setOwnedBase(latestRef.current);markUncertain(false);markCompare(false);
  status(`Your edits are retained against latest version ${latestRef.current}. Review them before saving.`);
 }
 function confirmDiscard(token:number){
  const identity=discardIdentity.current;
  if(!handlerCurrent()||inFlight.current||!discardOpen.current||!identity||token!==discardSequence.current||identity.token!==token||identity.draft!==draftRef.current||!sameRegionalReferenceDraftContext(identity.owner,ownerRef.current)||!sameRegionalReferenceDraftContext(identity.incoming,contextRef.current))return;
  dismissDiscard();
  const same=sameLive();
  if(!same){epoch.current++;ownerRef.current=contextRef.current;setOwner(contextRef.current);setOwnedDraft(blankRegionalReferenceDraft());historyRef.current=[];setHistory([]);setNextBefore(null);loadedRef.current=false;setLoaded(false);setOwnedBase(null);setOwnedLatest(0);markDirty(false);markUncertain(false);markRetired(false);markCompare(false);markComparisonReady(false);openRef.current=false;setOpen(false);}
  else{setOwnedDraft(blankRegionalReferenceDraft());markDirty(false);if(!uncertainRef.current&&!compareRef.current)setOwnedBase(latestRef.current);}
  status(same?'Working text discarded. If a save was unconfirmed, refresh history and compare before saving.':'Previous snapshot discarded. Open this panel to load the new snapshot history.');
 }
 function useLatestWithoutEdits(){
  if(!gate()||retiredRef.current||inFlight.current||!loadedRef.current||!compareRef.current||!comparisonReadyRef.current||dirtyRef.current)return;
  markUncertain(false);markCompare(false);markComparisonReady(false);setOwnedBase(latestRef.current);
  status(`Using fresh history at version ${latestRef.current}.`);
 }
 async function save(automatic=false){
  autosave.current.cancel();
  if(automatic&&(!dirtyRef.current||draftRef.current.status!=='draft'))return;
  if(!handlerCurrent()||!gate()||!loadedRef.current||inFlight.current||retiredRef.current||uncertainRef.current||compareRef.current||baseRef.current===null||baseRef.current!==latestRef.current)return;
  let validated:RegionalReferenceDraft;try{validated=validateRegionalReferenceDraft(draftRef.current);}catch(caught){status(caught instanceof Error?caught.message:'Check your notes.',true);return;}
  const owned=ownerRef.current,expected=baseRef.current,ticket=++epoch.current;
  inFlight.current=true;requestKind.current='save';setBusy(true);markComparisonReady(false);markUncertain(true); // The request may commit even if its response is lost.
  const valid=()=>ticket===epoch.current&&mounted.current&&openRef.current&&sameRegionalReferenceDraftContext(owned,ownerRef.current)&&sameRegionalReferenceDraftContext(owned,contextRef.current);
  try{
   const response=await clinicalReviewFetch(endpoint,{method:'POST',headers:{...regionalReferenceDraftHeaders(owned),'Content-Type':'application/json'},body:JSON.stringify({context:owned,expectedVersion:expected,draft:validated})});
   if(!valid())return;
   const value=await body(response);if(!valid())return;
   if(response.status===401||response.status===403){markRetired(true);throw Error('The authorized account changed. Export your notes and reload this page.');}
   if(response.status===409){
    const detail=errorText(value,'The source or authorized account changed. Export your edits and reload this page.');
    if(value&&typeof value==='object'&&(value as ResponseBody).code==='version-conflict'){markCompare(true);markComparisonReady(false);throw Error('Saved history changed. Refresh it and explicitly compare your retained edits before saving.');}
    markRetired(true);throw Error(detail);
   }
   if(!response.ok)throw Error(errorText(value,'Save could not be confirmed. Keep your edits and compare history.'));
   const saved=confirmRegionalReferenceDraftSave(value,owned,expected,validated);
   if(!valid())return;
   historyRef.current=[saved,...historyRef.current];setHistory(historyRef.current);setOwnedLatest(saved.version);setOwnedBase(saved.version);setOwnedDraft(saved.draft);markDirty(false);markUncertain(false);markCompare(false);markComparisonReady(false);
   status(`Saved private version ${saved.version}. This is not clinical sign-off or publication.`);
  }catch(caught){if(valid())status(caught instanceof Error?caught.message:'Save could not be confirmed. Keep your edits and compare history.',true);}
  finally{if(ticket===epoch.current){inFlight.current=false;requestKind.current=null;if(mounted.current)setBusy(false);}}
 }
 const autoStamp=reviewDraftStamp(owner,base??-1,draft);
 autosaveStamp.current=autoStamp;
 const autoReady=mayAutosaveDraft({status:draft.status,attested:false,dirty,loaded,currentHistory:current&&open&&base!==null&&base===latest&&!compare&&!retired&&!discard,busy,uncertain,reloadRequired:!current||retired});
 autosaveAllowed.current=autoReady;
 useEffect(()=>{
  if(!autoReady)return()=>autosave.current.cancel();
  autosave.current.schedule(autoStamp,expected=>gate()&&autosaveAllowed.current&&autosaveStamp.current===expected&&!inFlight.current&&baseRef.current===latestRef.current,()=>{void save(true);});
  return()=>autosave.current.cancel();
 },[autoStamp,autoReady]);
 return <details className="regional-reference-notes" onToggle={toggle} open={open}>
  <summary>Private correction notes <span>{dirty?'· unsaved edits':uncertain?'· save unconfirmed':''}</span></summary>
  <div className="regional-reference-notes__body">
   <p>Exact reference teaching draft · {owner.target.label} · {owner.target.relation}. Saved only for your signed-in account and institution. No patient data. Notes and checks do not approve teaching, clinical use, publication, MRI correspondence or registration.</p>
   {!current&&<p role="alert">This reference snapshot changed. The previous notes are held read-only. Export them or explicitly discard before starting on the new snapshot.</p>}
   {retired&&<p role="alert">This source or authorized session is no longer current. Saving is retired. Export your notes and reload this page.</p>}
   <p role={error?'alert':'status'} aria-live="polite">{message}</p>
   <form onSubmit={event=>{event.preventDefault();void save();}}>
    <fieldset disabled={!current||retired||busy||!loaded}>
     <legend>Current private working notes</legend>
     <label>Status <select value={draft.status} onChange={event=>edit({status:event.target.value as RegionalReferenceDraft['status']})}><option value="draft">Draft notes</option><option value="changes-required">Corrections requested</option></select></label>
     <label>Notes / requested corrections <textarea value={draft.notes} maxLength={6000} rows={5} placeholder="Describe the exact teaching correction. A correction request needs at least 10 characters." onChange={event=>edit({notes:event.target.value})}/></label>
     <NotesConsiderations criteria={regionalReferenceDraftChecks} checked={regionalReferenceDraftChecks.every(check=>draft.checks[check.id]===true)} onChange={considered=>edit({checks:exactReviewChecks(regionalReferenceDraftChecks,considered)})}/>
     <button type="submit" disabled={uncertain||compare||base===null||base!==latest}>Save private draft</button>
    </fieldset>
   </form>
   <div className="regional-reference-notes__actions"><button type="button" onClick={exportCopy}>Export working copy</button><button type="button" disabled={!current||retired||busy} onClick={()=>void read('refresh')}>Refresh saved history</button>{!dirty&&!uncertain&&!compare&&<button type="button" disabled={!current||retired||busy||!loaded} onClick={()=>choose()}>Start fresh</button>}{(dirty||uncertain||!current)&&<button type="button" disabled={busy} onClick={requestDiscard}>Discard edits…</button>}</div>
   {downloadMessage&&<p role="status">{downloadMessage}</p>}
   {discard&&<div className="regional-reference-notes__confirm"><p>Discard this working copy? Saved history stays intact. Export or copy any notes you need first.</p><button type="button" disabled={busy} onClick={()=>confirmDiscard(discardToken)}>Confirm discard</button><button type="button" onClick={dismissDiscard}>Keep notes</button></div>}
   {compare&&current&&!retired&&<div className="regional-reference-notes__confirm"><p>{comparisonReady?'Compare your retained text with the latest saved entry below.':'Refresh current saved history before comparing your retained edits.'} History refresh never changes your notes or base version.</p><button type="button" disabled={busy||!loaded||!comparisonReady||!dirty&&!uncertain} onClick={keepEdits}>Keep my edits against latest version {latest}</button>{!dirty&&<button type="button" disabled={busy||!comparisonReady} onClick={useLatestWithoutEdits}>Use latest history without edits</button>}</div>}
   {uncertain&&<p>Save outcome is unconfirmed. Refresh history and compare it before choosing a new base. A lost response may have followed a successful save.</p>}
   <details><summary>Saved history · {history.length} loaded</summary>{history.length===0?<p>No saved entries loaded.</p>:<ol>{history.map(record=><li key={record.version}><strong>Version {record.version} · {record.draft.status==='changes-required'?'Corrections requested':'Draft'}</strong> <time dateTime={record.savedAt}>{record.savedAt}</time><p className="regional-reference-notes__preserve">{record.draft.notes||'No notes supplied.'}</p><button type="button" disabled={!current||retired||busy||dirty||uncertain||compare} onClick={()=>choose(record)}>Load saved version {record.version}</button><details><summary>Saved checks and exact revision</summary><pre>{JSON.stringify(record,null,2)}</pre></details></li>)}</ol>}{nextBefore!==null&&<button type="button" disabled={!current||retired||busy} onClick={()=>void read('older',nextBefore)}>Load older history</button>}</details>
  </div>
 </details>;
}
