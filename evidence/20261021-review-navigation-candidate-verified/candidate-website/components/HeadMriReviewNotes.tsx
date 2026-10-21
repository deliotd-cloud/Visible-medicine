'use client';

import {useEffect,useRef,useState} from 'react';
import {clinicalReviewFetch,getClinicalReviewContext} from '../lib/clinical-review-fetch';
import {blankHeadMriDraft,headMriDraftStale,validateHeadMriDraft,type HeadMriDraft,type HeadMriDraftContext,type SavedHeadMriDraft} from '../lib/head-mri-review-draft-contract';
import {confirmHeadMriSave,headMriDraftSavePayload,parseHeadMriHistory,HeadMriSourceChangedError} from '../lib/head-mri-review-draft-client';
import {headMriWorkingCopy,downloadHeadWorkingCopy} from '../lib/head-review-working-copy';
import './head-teaching-review-notes.css';
import {NotesConsiderations,exactReviewChecks} from './GroupedReviewConfirmation';
import {createReviewDraftAutosave,mayAutosaveDraft,reviewDraftStamp,reviewerFromAuthorizedHistory,rememberReviewerForContext,reviewerForContext} from '../lib/review-draft-autosave';
import {registerClinicalReviewNavigationGuard} from '../lib/clinical-review-navigation-guard';

const endpoint='/api/atlas-review/head-mri-learning';
async function checkedResponse(response:Response){
  const value:unknown=await response.json();
  if(!response.ok)throw Error(value&&typeof value==='object'&&'error'in value&&typeof value.error==='string'?value.error:'Request failed. Keep your edits.');
  return value;
}
/** MRI-only private corrections; no clinical approval or original-25 inheritance. */
export function HeadMriReviewNotes({context}:{context:HeadMriDraftContext}){
  const [draft,setDraft]=useState(()=>blankHeadMriDraft(context));
  const [history,setHistory]=useState<SavedHeadMriDraft[]>([]),[nextBefore,setNextBefore]=useState<number|null>(null);
  const [version,setVersion]=useState(0),[latest,setLatest]=useState(0);
  const [loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false),[uncertain,setUncertain]=useState(false);
  const [reloadRequired,setReloadRequired]=useState(false),[historyReady,setHistoryReady]=useState(false);
  const [message,setMessage]=useState('Loading your private MRI saved history…'),[error,setError]=useState(false),[discard,setDiscard]=useState(false);
  const [downloadMessage,setDownloadMessage]=useState('');
  const active=useRef(true),inFlight=useRef(false),hasLoaded=useRef(false),generation=useRef(0);
  const confirmedHistory=useRef(false),baseline=useRef(blankHeadMriDraft(context)),dirtyRef=useRef(false);
  const autosave=useRef(createReviewDraftAutosave()),autosaveStamp=useRef(''),autosaveAllowed=useRef(false);
  const sourceKey=reviewDraftStamp(context,0,null),sourceAtMount=useRef(sourceKey);
  const alive=(ticket:number)=>active.current&&ticket===generation.current;
  useEffect(()=>{active.current=true;return()=>{autosave.current.cancel();active.current=false;generation.current++;inFlight.current=false;};},[]);
  useEffect(()=>{
    if(!dirty)return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
    window.addEventListener('beforeunload',warn);
    const unregister=registerClinicalReviewNavigationGuard(document,()=>true);
    return()=>{window.removeEventListener('beforeunload',warn);unregister();};
  },[dirty]);
  const status=(text:string,failed=false)=>{setMessage(text);setError(failed);};
  useEffect(()=>{if(sourceKey!==sourceAtMount.current){autosave.current.cancel();setReloadRequired(true);}},[sourceKey]);
  function downloadWorkingCopy(){
    try{
      downloadHeadWorkingCopy(headMriWorkingCopy(context,draft,{baseVersion:loaded?version:null,unsavedChanges:dirty,saveUncertain:uncertain||busy,reloadRequired}));
      setDownloadMessage('Working-copy download requested. Confirm the file was saved and keep it private. Your edits and server-save status are unchanged.');
    }catch{setDownloadMessage('Download could not be started. Keep this page open and copy your notes before leaving.');}
  }
  const ready=(value:boolean)=>{confirmedHistory.current=value;setHistoryReady(value);};
  async function load(before?:number){
    autosave.current.cancel();
    if(inFlight.current)return;
    const ticket=generation.current;inFlight.current=true;setBusy(true);
    if(before===undefined)ready(false);
    try{
      const response=await clinicalReviewFetch(endpoint+(before===undefined?'':'?before='+before),{cache:'no-store'});
      if(!alive(ticket))return;
      if([401,403,409].includes(response.status))setReloadRequired(true);
      const value=parseHeadMriHistory(await checkedResponse(response),context,before);
      if(!alive(ticket))return;
      setHistory(previous=>before===undefined?value.history:[...previous,...value.history]);setNextBefore(value.nextBefore);
      if(before===undefined){
        const newest=value.history[0]?.version??0;setLatest(newest);setLoaded(true);ready(true);
        if(!hasLoaded.current){setVersion(newest);hasLoaded.current=true;setUncertain(false);
          const current=value.history[0],token=getClinicalReviewContext();const profile=reviewerFromAuthorizedHistory(current?.draft??null,!!current&&!headMriDraftStale(current,context),dirtyRef.current);if(profile)rememberReviewerForContext(token,profile);const remembered=profile??reviewerForContext(token);if(remembered&&!dirtyRef.current)setDraft(previous=>({...previous,reviewer:previous.reviewer||remembered.reviewer,qualification:previous.qualification||remembered.qualification}));}
        status(dirtyRef.current?'MRI history refreshed; your unsaved edits are unchanged. Compare history before discarding or starting again.':newest?'MRI history loaded. Explicitly load a current entry or start a fresh draft.':'No saved MRI notes yet. Your first save creates version 1.');
      }
    }catch(caught){if(alive(ticket)){ready(false);setUncertain(true);if(caught instanceof HeadMriSourceChangedError)setReloadRequired(true);status(caught instanceof Error?caught.message:'MRI history unavailable. Keep your edits.',true);}}
    finally{if(alive(ticket)){inFlight.current=false;setBusy(false);}}
  }
  useEffect(()=>{void load();},[]); // GET only; writes are explicit and never retried.
  function edit(change:Partial<HeadMriDraft>){autosave.current.cancel();setDraft(previous=>({...previous,...change}));dirtyRef.current=true;setDirty(true);setDiscard(false);}
  function replace(record?:SavedHeadMriDraft){
    autosave.current.cancel();
    if(dirtyRef.current||busy||!loaded||reloadRequired||!confirmedHistory.current||record&&headMriDraftStale(record,context))return;
    const next=record?validateHeadMriDraft(record.draft,context):blankHeadMriDraft(context);
    setDraft(next);baseline.current=next;setVersion(latest);setUncertain(false);
    status(record?`Loaded MRI version ${record.version} for editing against latest version ${latest}. A save creates a new entry.`:'Started a fresh MRI draft. Saved history is preserved.');
  }
  async function save(automatic=false){
    autosave.current.cancel();
    if(sourceKey!==sourceAtMount.current)return;
    if(automatic&&(!dirtyRef.current||draft.status!=='draft'))return;
    if(inFlight.current||!loaded||uncertain||reloadRequired||!confirmedHistory.current||version!==latest)return;
    let payload;
    try{payload=headMriDraftSavePayload(context,version,draft);}catch(caught){status(caught instanceof Error?caught.message:'Check your MRI draft.',true);return;}
    const ticket=generation.current;inFlight.current=true;setBusy(true);ready(false);
    try{
      const response=await clinicalReviewFetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(!alive(ticket))return;
      if([401,403].includes(response.status))setReloadRequired(true);
      const saved=confirmHeadMriSave(await checkedResponse(response),context,version,payload.draft);
      if(!alive(ticket))return;
      rememberReviewerForContext(getClinicalReviewContext(),saved.draft);
      setHistory(previous=>[saved,...previous]);setVersion(saved.version);setLatest(saved.version);setDraft(saved.draft);baseline.current=saved.draft;
      dirtyRef.current=false;setDirty(false);setDiscard(false);setUncertain(false);ready(true);
      status(`Saved private MRI version ${saved.version}. This is not clinical sign-off or publication.`);
    }catch(caught){if(alive(ticket)){setUncertain(true);status(caught instanceof Error?caught.message:'MRI save could not be confirmed. Keep your edits and compare history.',true);}}
    finally{if(alive(ticket)){inFlight.current=false;setBusy(false);}}
  }
  const autoStamp=reviewDraftStamp(context,version,draft);
  autosaveStamp.current=autoStamp;
  const autoReady=mayAutosaveDraft({status:draft.status,attested:false,dirty,loaded,currentHistory:historyReady&&version===latest&&sourceKey===sourceAtMount.current,busy,uncertain,reloadRequired});
  autosaveAllowed.current=autoReady&&!discard;
  useEffect(()=>{
    if(!autoReady||discard)return()=>autosave.current.cancel();
    autosave.current.schedule(autoStamp,expected=>active.current&&autosaveAllowed.current&&autosaveStamp.current===expected&&!inFlight.current,()=>{void save(true);});
    return()=>autosave.current.cancel();
  },[autoStamp,autoReady,discard]);
  return <section className="head-review-notes" aria-labelledby="head-mri-review-notes-title">
    <h2 id="head-mri-review-notes-title">Private MRI review notes &amp; corrections</h2>
    <p>Only for these four MRI-only concepts and two MRI-only guided sequences, separate from original-25 notes. Saved for your signed-in account and institution. These notes do not approve, publish or modify teaching, masks or patient-space registration. Name and qualification are self-reported, not verified credentials. Do not enter patient data.</p>
    <p className="head-review-message" role={error?'alert':'status'} aria-live="polite">{message}</p>
    <form onSubmit={event=>{event.preventDefault();void save();}}>
      <fieldset disabled={busy||!loaded}><legend>Independent MRI packet · {context.conceptIds.length} concepts</legend>
        <div className="head-review-fields">
          <label>Reviewer name (self-reported)<input value={draft.reviewer} maxLength={160} onChange={event=>edit({reviewer:event.target.value})}/></label>
          <label>Qualification (self-reported)<input value={draft.qualification} maxLength={160} onChange={event=>edit({qualification:event.target.value})}/></label>
          <label>Status<select value={draft.status} onChange={event=>edit({status:event.target.value as HeadMriDraft['status']})}><option value="draft">Draft notes</option><option value="changes-required">Corrections requested</option></select></label>
          <label>Review scope<textarea value={draft.scope} rows={2} maxLength={1000} placeholder="MRI concept IDs, mask extent, generic 3D comparison or guided steps inspected" onChange={event=>edit({scope:event.target.value})}/></label>
        </div>
        <NotesConsiderations criteria={context.checklist} checked={context.checklist.every(check=>draft.checks[check.id]===true)} onChange={considered=>edit({checks:exactReviewChecks(context.checklist,considered)})}/>
        <label className="head-review-notes-field">Notes / requested corrections<textarea value={draft.notes} rows={5} maxLength={8000} placeholder="Describe the structure, source and exact correction. Corrections requested need at least 10 characters." onChange={event=>edit({notes:event.target.value})}/></label>
        <div className="head-review-actions"><button type="submit" disabled={uncertain||reloadRequired||!historyReady||version!==latest}>Save private {draft.status==='changes-required'?'correction request':'draft'}</button><span>{dirty?'Unsaved edits':`Editing from MRI version ${version}`}</span></div>
      </fieldset>
    </form>
    <details><summary>Exact current MRI review revisions</summary><dl><dt>Head source</dt><dd><code>{context.headRevision}</code></dd><dt>Comparison</dt><dd><code>{context.comparisonRevision}</code></dd><dt>Teaching</dt><dd><code>{context.teachingRevision}</code></dd><dt>Guided learning</dt><dd><code>{context.learningRevision}</code></dd><dt>Checklist</dt><dd>{context.checklistVersion}</dd></dl></details>
    {downloadMessage&&<p role="status" aria-live="polite">{downloadMessage}</p>}
    <div className="head-review-actions">
      <button type="button" onClick={downloadWorkingCopy}>Download working copy</button>
      <button type="button" disabled={busy} onClick={()=>void load()}>Refresh saved history</button>
      <button type="button" disabled={busy||!loaded||dirty||reloadRequired||!historyReady} onClick={()=>replace()}>Start fresh draft</button>
      {dirty&&<button type="button" disabled={busy} onClick={()=>{autosave.current.cancel();setDiscard(true);}}>Discard unsaved edits…</button>}
    </div>
    {discard&&<div className="head-review-discard"><p>Discard only the unsaved MRI form edits? Saved history will not be deleted. Copy any text you want to keep first.</p><button type="button" disabled={busy} onClick={()=>{setDraft(baseline.current);dirtyRef.current=false;setDirty(false);setDiscard(false);status('Unsaved edits discarded. Refresh history, then explicitly load a saved draft or start fresh.');}}>Confirm discard</button> <button type="button" onClick={()=>setDiscard(false)}>Keep editing</button></div>}
    {uncertain&&<p>Saving is locked. Refresh and compare saved history, preserve your text, then explicitly load a current entry or start fresh. A failed save is never retried automatically.</p>}
    {reloadRequired&&<p role="alert">The source or authorized session changed. Copy any unsaved notes, then reload this page. Loading history cannot unlock saving.</p>}
    <details className="head-review-history"><summary>Saved MRI history · {history.length} loaded {dirty?'· preserve unsaved edits before loading':''}</summary>
      {history.length===0?<p>No MRI history loaded.</p>:<ol>{history.map(record=>{const stale=headMriDraftStale(record,context);return <li key={record.version}>
        <div className="head-review-actions"><strong>Version {record.version} · {record.draft.status==='changes-required'?'Corrections requested':'Draft'}</strong><time dateTime={record.savedAt}>{record.savedAt}</time><span>{stale?'Historical source — cannot resume':'Current MRI packets'}</span>{!stale&&<button type="button" disabled={busy||dirty||reloadRequired||!historyReady} onClick={()=>replace(record)}>Load version {record.version}</button>}</div>
        <p>{record.draft.reviewer||'No self-reported name'} · {record.draft.qualification||'No qualification supplied'}</p><p className="head-review-preserve">{record.draft.scope}</p><p className="head-review-preserve">{record.draft.notes||'No notes supplied.'}</p><details><summary>Exact saved revision &amp; checklist</summary><pre>{JSON.stringify(record,null,2)}</pre></details>
      </li>;})}</ol>}
      {nextBefore!==null&&<button type="button" disabled={busy} onClick={()=>void load(nextBefore)}>Load older history</button>}
    </details>
  </section>;
}
