'use client';

import {useEffect,useLayoutEffect,useRef,useState,type SyntheticEvent} from 'react';
import {clinicalReviewFetch} from '../lib/clinical-review-fetch';
import {blankProstateDecision,validateProstateDecision,parseProstateReviewEvent,parseProstateReviewHistory,sameProstateReviewContext,type ProstateReviewContext} from '../lib/prostate-review-contract';
import './prostate-review-notes.css';
import {registerClinicalReviewNavigationGuard} from '../lib/clinical-review-navigation-guard';

const endpoint='/api/atlas-review/prostate';
type Decision=ReturnType<typeof blankProstateDecision>;
type Event=ReturnType<typeof parseProstateReviewEvent>;
type Page=ReturnType<typeof parseProstateReviewHistory>;
type Mode='first'|'refresh'|'older';
type ErrorBody={error?:unknown;code?:unknown};
async function responseBody(response:Response):Promise<unknown>{try{return await response.json();}catch{return {};}}
function errorText(value:unknown,fallback:string){return value&&typeof value==='object'&&typeof (value as ErrorBody).error==='string'?(value as ErrorBody).error as string:fallback;}
function urlFor(context:ProstateReviewContext){const query=new URLSearchParams({revision:context.contentRevision});return `${endpoint}?${query}`;}
function distinct(events:Event[]){const found=new Set<string>();return events.filter(event=>{const key=`${event.context.contentRevision}:${event.version}`;if(found.has(key))return false;found.add(key);return true;});}
function downloadNotes(notes:string){const blob=new Blob([notes],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='prostate-working-notes.txt';document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);}

/** Private, revision-bound prostate review. No patient or publication approval. */
export function ProstateReviewNotes({context,externallyRetired=false}:{context:ProstateReviewContext;externallyRetired?:boolean}){
 const [owner,setOwner]=useState(context),[open,setOpen]=useState(false),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false);
 const [decision,setDecision]=useState<Decision>(()=>blankProstateDecision());
 const [history,setHistory]=useState<Event[]>([]),[nextBefore,setNextBefore]=useState<number|null>(null);
 const [latest,setLatest]=useState(0),[base,setBase]=useState<number|null>(null);
 const [dirty,setDirty]=useState(false),[uncertain,setUncertain]=useState(false),[retired,setRetired]=useState(externallyRetired),[compare,setCompare]=useState(false),[comparisonReady,setComparisonReady]=useState(false);
 const [message,setMessage]=useState('Open to read private saved history.'),[error,setError]=useState(false),[exportMessage,setExportMessage]=useState('');
 const mounted=useRef(false),epoch=useRef(0),active=useRef(false),controller=useRef<AbortController|null>(null),requestKind=useRef<'read'|'save'|null>(null);
 const ownerRef=useRef(owner),contextRef=useRef(context),decisionRef=useRef(decision),dirtyRef=useRef(false),uncertainRef=useRef(false),retiredRef=useRef(externallyRetired),externalRef=useRef(externallyRetired),openRef=useRef(false);
 const latestRef=useRef(0),baseRef=useRef<number|null>(null),loadedRef=useRef(false),historyRef=useRef<Event[]>([]),compareRef=useRef(false),comparisonReadyRef=useRef(false);
 const current=sameProstateReviewContext(owner,context);
 const live=()=>mounted.current&&sameProstateReviewContext(owner,ownerRef.current)&&sameProstateReviewContext(context,contextRef.current);
 const gate=()=>live()&&openRef.current&&!externalRef.current&&sameProstateReviewContext(ownerRef.current,contextRef.current);
 const status=(text:string,failed=false)=>{setMessage(text);setError(failed);};
 const markDirty=(value:boolean)=>{dirtyRef.current=value;setDirty(value);};
 const markUncertain=(value:boolean)=>{uncertainRef.current=value;setUncertain(value);};
 const markRetired=(value:boolean)=>{const next=value||externalRef.current;retiredRef.current=next;setRetired(next);};
 const markCompare=(value:boolean)=>{compareRef.current=value;setCompare(value);};
 const markComparisonReady=(value:boolean)=>{comparisonReadyRef.current=value;setComparisonReady(value);};
 const setOwnedDecision=(value:Decision)=>{decisionRef.current=value;setDecision(value);};
 const setOwnedBase=(value:number|null)=>{baseRef.current=value;setBase(value);};
 const setOwnedLatest=(value:number)=>{latestRef.current=value;setLatest(value);};
 const cancel=()=>{epoch.current++;controller.current?.abort();controller.current=null;active.current=false;requestKind.current=null;setBusy(false);};
 useEffect(()=>{mounted.current=true;if(requestKind.current===null)setBusy(false);return()=>{mounted.current=false;epoch.current++;controller.current?.abort();controller.current=null;active.current=false;requestKind.current=null;};},[]);
 useLayoutEffect(()=>{if(sameProstateReviewContext(contextRef.current,context))return;contextRef.current=context;if(requestKind.current==='save')markUncertain(true);cancel();markComparisonReady(false);},[context]);
 useLayoutEffect(()=>{if(!externallyRetired||externalRef.current)return;externalRef.current=true;if(requestKind.current==='save')markUncertain(true);cancel();markRetired(true);markComparisonReady(false);status('The prostate source changed. This working copy is retained for export; review saving is retired.');},[externallyRetired]);
 useEffect(()=>{if(!(dirty||uncertain||busy))return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);const unregister=registerClinicalReviewNavigationGuard(document,()=>true);return()=>{window.removeEventListener('beforeunload',warn);unregister();};},[dirty,uncertain,busy]);
 async function read(mode:Mode,before?:number){
  if(!gate()||active.current||retiredRef.current)return;
  
  markComparisonReady(false);const ticket=++epoch.current,owned=ownerRef.current,abort=new AbortController();controller.current=abort;active.current=true;requestKind.current='read';setBusy(true);
  const valid=()=>ticket===epoch.current&&!abort.signal.aborted&&mounted.current&&openRef.current&&sameProstateReviewContext(owned,ownerRef.current)&&sameProstateReviewContext(owned,contextRef.current);
  try{
   const headers:Record<string,string>={};if(before!==undefined)headers['X-Prostate-Review-Before']=String(before);
   const response=await clinicalReviewFetch(urlFor(owned),{cache:'no-store',headers,signal:abort.signal});if(!valid())return;
   const value=await responseBody(response);if(!valid())return;
   if(response.status===401||response.status===403||response.status===409){markRetired(true);throw Error('The prostate source or authorized account changed. Export your notes and reload this page.');}
   if(!response.ok)throw Error(errorText(value,'History unavailable. Your edits are retained.'));
   const parsed:Page=parseProstateReviewHistory(value,owned,before);if(!valid())return;
   if(mode==='older'){
    const merged=distinct([...historyRef.current,...parsed.history]);historyRef.current=merged;setHistory(merged);setNextBefore(parsed.nextBefore);status('Older saved history loaded. Your working notes are unchanged.');
   }else{
    historyRef.current=distinct(parsed.history);setHistory(historyRef.current);setNextBefore(parsed.nextBefore);loadedRef.current=true;setLoaded(true);setOwnedLatest(parsed.latestVersion);
    if(baseRef.current===null&&!dirtyRef.current&&!uncertainRef.current)setOwnedBase(parsed.latestVersion);
    const needsCompare=dirtyRef.current||uncertainRef.current||baseRef.current!==null&&baseRef.current!==parsed.latestVersion;
    markCompare(needsCompare);markComparisonReady(true);
    status(needsCompare?'Latest history loaded. Compare your retained edits before choosing a new base.':`History loaded. Latest version ${parsed.latestVersion}.`);
   }
  }catch(caught){if(valid())status(caught instanceof Error?caught.message:'History unavailable. Your edits are retained.',true);}
  finally{if(ticket===epoch.current){active.current=false;controller.current=null;requestKind.current=null;if(mounted.current)setBusy(false);}}
 }
 function toggle(event:SyntheticEvent<HTMLDetailsElement>){if(!live()||(externalRef.current&&!externallyRetired))return;const next=event.currentTarget.open;openRef.current=next;setOpen(next);if(!next){if(requestKind.current==='save')markUncertain(true);cancel();return;}if(!loadedRef.current&&!active.current&&!retiredRef.current)void read('first');}
 function edit(change:Partial<Decision>){if(!gate()||retiredRef.current||active.current)return;setOwnedDecision({...decisionRef.current,...change,...('attested'in change?{}:{attested:false})});markDirty(true);}
 function exportCopy(){if(!live())return;try{downloadNotes(decisionRef.current.notes);setExportMessage('Notes-only text download requested. Decisions, attestation and version are not included. Keep the file private.');}catch{setExportMessage('Download could not start. Copy your notes before leaving.');}}
 function restoreLatest(fromComparison:boolean){
  if(!gate()||retiredRef.current||active.current||!loadedRef.current||latestRef.current<1||dirtyRef.current)return;
  if(fromComparison?(!compareRef.current||!comparisonReadyRef.current):(uncertainRef.current||compareRef.current))return;
  const newest=historyRef.current[0];
  const exact=!!newest&&newest.version===latestRef.current&&sameProstateReviewContext(newest.context,ownerRef.current);
  setOwnedDecision(exact?{...newest.decision,attested:false}:blankProstateDecision());
  setOwnedBase(latestRef.current);markDirty(false);markUncertain(false);markCompare(false);markComparisonReady(false);
  status(exact?`Loaded version ${latestRef.current} for this exact wording. Review it and attest again before recording approval.`:'Latest saved entry belongs to a prior revision. A fresh review is required for this wording.');
 }
 function keepEdits(){if(!gate()||retiredRef.current||active.current||!loadedRef.current||!compareRef.current||!comparisonReadyRef.current||!dirtyRef.current&&!uncertainRef.current)return;setOwnedDecision({...decisionRef.current,attested:false});setOwnedBase(latestRef.current);markUncertain(false);markCompare(false);markComparisonReady(false);status(`Your edits are retained against latest version ${latestRef.current}. Review them before saving.`);}
 function startNew(){if(!gate()||retiredRef.current||active.current||!loadedRef.current||dirtyRef.current||uncertainRef.current||compareRef.current)return;setOwnedDecision(blankProstateDecision());setOwnedBase(latestRef.current);status('Fresh prostate review started against the latest saved version.');}
 function discard(){if(!live()||active.current)return;if(!sameProstateReviewContext(ownerRef.current,contextRef.current)){cancel();ownerRef.current=contextRef.current;setOwner(contextRef.current);setOwnedDecision(blankProstateDecision());historyRef.current=[];setHistory([]);setNextBefore(null);loadedRef.current=false;setLoaded(false);setOwnedLatest(0);setOwnedBase(null);markDirty(false);markUncertain(false);markRetired(false);markCompare(false);markComparisonReady(false);openRef.current=false;setOpen(false);status(retiredRef.current?'Previous copy discarded. This page remains retired; navigate to the current prostate page to review again.':'Previous snapshot discarded. Open this panel to load the new snapshot history.');return;}setOwnedDecision(blankProstateDecision());markDirty(false);status(retiredRef.current?'Working text discarded. This page remains retired.':'Working text discarded. Refresh history if a save was unconfirmed.');}
 async function save(){
  
  if(!gate()||!loadedRef.current||active.current||retiredRef.current||uncertainRef.current||compareRef.current||baseRef.current===null||baseRef.current!==latestRef.current)return;
  let validated:Decision;try{validated=validateProstateDecision(decisionRef.current);}catch(caught){status(caught instanceof Error?caught.message:'Review the decision and checks.',true);return;}
  const owned=ownerRef.current,expected=baseRef.current,ticket=++epoch.current,abort=new AbortController();controller.current=abort;active.current=true;requestKind.current='save';setBusy(true);markComparisonReady(false);markUncertain(true);
  const valid=()=>ticket===epoch.current&&!abort.signal.aborted&&mounted.current&&openRef.current&&sameProstateReviewContext(owned,ownerRef.current)&&sameProstateReviewContext(owned,contextRef.current);
  try{
   const response=await clinicalReviewFetch(urlFor(owned),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({context:owned,expectedVersion:expected,decision:validated}),signal:abort.signal});if(!valid())return;
   const value=await responseBody(response);if(!valid())return;
   if(response.status===401||response.status===403){markRetired(true);throw Error('The authorized account changed. Export your notes and reload this page.');}
   if(response.status===409){if(value&&typeof value==='object'&&(value as ErrorBody).code==='version-conflict'){markCompare(true);markComparisonReady(false);throw Error('Saved history changed. Refresh and compare your retained edits before saving.');}markRetired(true);throw Error('The prostate source or authorized account changed. Export your notes and reload this page.');}
   if(!response.ok)throw Error(errorText(value,'Save could not be confirmed. Keep your edits and compare history.'));
   const event=parseProstateReviewEvent(value&&typeof value==='object'&&'review'in value?(value as {review:unknown}).review:value);
   if(!valid()||!sameProstateReviewContext(event.context,owned)||event.version!==expected+1||JSON.stringify(event.decision)!==JSON.stringify(validated))throw Error('Save response did not match this exact review. Refresh history before saving again.');
   historyRef.current=distinct([event,...historyRef.current]);setHistory(historyRef.current);setOwnedLatest(event.version);setOwnedBase(event.version);setOwnedDecision(event.decision);markDirty(false);markUncertain(false);markCompare(false);markComparisonReady(false);
   status('Private prostate review recorded. These decisions apply only to the displayed model and teaching revision.');
  }catch(caught){if(valid())status(caught instanceof Error?caught.message:'Save could not be confirmed. Keep your edits and compare history.',true);}
  finally{if(ticket===epoch.current){active.current=false;controller.current=null;requestKind.current=null;if(mounted.current)setBusy(false);}}
 }
 const disabled=retired||externalRef.current||externallyRetired;
 return <details className="prostate-notes" onToggle={toggle} open={open}>
  <summary>Your review {uncertain?'· save unconfirmed':dirty?'· unsaved edits':''}</summary>
  <div className="prostate-notes__body">
   <details><summary>Review identity</summary><p>Exact review revision: <code>{owner.contentRevision}</code>. Saved only for your signed-in account and institution.</p></details>
   <p className="prostate-notes__limit">Record model and teaching decisions independently. These personal decisions do not approve any MRI segmentation, patient registration, publication or clinical use.</p>
   {!current&&<p role="alert">The prostate context changed. Previous notes remain read-only. Export them, then explicitly discard to open the new context.</p>}
   {disabled&&<p role="alert">This source or authorized session is no longer current. Saving is retired. Export your notes and reload this page.</p>}
   <p role={error?'alert':'status'} aria-live="polite">{message}</p>
   <form onSubmit={event=>{event.preventDefault();void save();}}><fieldset disabled={!current||disabled||busy||!loaded}>
    <legend>Review this exact model and teaching</legend>
    {(['geometry','teaching'] as const).map(track=><label key={track}>{track==='geometry'?'Model geometry':'Anatomy and MRI teaching'}<select value={decision[track]} onChange={event=>edit({[track]:event.target.value as Decision['geometry']})}><option value="not-reviewed">Not reviewed</option><option value="changes-required">Changes required</option><option value="approved">Approved for this schematic</option></select></label>)}
    <label>Notes or corrections <textarea value={decision.notes} maxLength={6000} rows={4} onChange={event=>edit({notes:event.target.value})} placeholder="If changes are required, describe them in at least 10 characters. Do not include patient details."/></label>
    {(decision.geometry==='approved'||decision.teaching==='approved')&&<label className="prostate-notes__attest"><input type="checkbox" checked={decision.attested} onChange={event=>edit({attested:event.target.checked})}/>I have reviewed every criterion for the sections I marked approved, for this exact schematic and teaching revision.</label>}
    <details><summary>Review criteria</summary><p>Model: inspect all four regions, shapes, boundaries, urethral channel, basal/mid-gland/apical views and left/right orientation.</p><p>Teaching: check all four anatomy and MRI-recognition notes, references, questions, answers and limitations.</p></details>
    <button type="submit" disabled={uncertain||compare||base===null||base!==latest}>Save review</button>
   </fieldset></form>
   <div className="prostate-notes__actions"><button type="button" onClick={exportCopy}>Export notes only (.txt)</button><button type="button" disabled={!current||disabled||busy} onClick={()=>void read('refresh')}>Refresh saved history</button>{current&&!disabled&&loaded&&latest>0&&!busy&&!dirty&&!uncertain&&!compare&&<button type="button" onClick={()=>restoreLatest(false)}>Restore latest saved review</button>}{!dirty&&!uncertain&&!compare&&<button type="button" disabled={!current||disabled||busy||!loaded} onClick={startNew}>Start fresh</button>}{(dirty||uncertain||!current)&&<button type="button" disabled={busy} onClick={discard}>Discard working copy</button>}</div>
   {exportMessage&&<p role="status">{exportMessage}</p>}
   {compare&&current&&!disabled&&<div className="prostate-notes__compare"><p>{comparisonReady?'Compare your retained wording with the latest saved entry below.':'Refresh current saved history before comparing your retained edits.'} Refresh does not change your working copy.</p><button type="button" disabled={busy||!comparisonReady||!dirty&&!uncertain} onClick={keepEdits}>Keep my edits against latest version {latest}</button>{!dirty&&<button type="button" disabled={busy||!comparisonReady} onClick={()=>restoreLatest(true)}>Use latest history without edits</button>}</div>}
   {uncertain&&<p>A save outcome is unconfirmed. Refresh history and compare before choosing a new base.</p>}
   <details><summary>Saved history · {history.length} loaded</summary>{history.length===0?<p>No saved entries loaded.</p>:<ol>{history.map(event=><li key={`${event.context.contentRevision}:${event.version}`}><strong>Version {event.version} · Model: {event.decision.geometry} · Teaching: {event.decision.teaching}</strong> <time dateTime={event.savedAt}>{event.savedAt}</time>{!sameProstateReviewContext(event.context,owner)&&<p>Prior revision — needs re-review for current wording. This record does not approve the current revision.</p>}<p className="prostate-notes__preserve">{event.decision.notes||'No notes supplied.'}</p><details><summary>Decisions and exact saved revision</summary><pre>{JSON.stringify(event,null,2)}</pre></details></li>)}</ol>}{nextBefore!==null&&<button type="button" disabled={!current||disabled||busy} onClick={()=>void read('older',nextBefore)}>Load older history</button>}</details>
  </div>
 </details>;
}
