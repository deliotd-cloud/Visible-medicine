'use client';
import {useEffect,useRef,useState} from 'react';
import {clinicalReviewFetch} from '../lib/clinical-review-fetch';
import {blankCtBoneTeachingDecision,ctBoneTeachingDecisionStale,validateCtBoneTeachingDecision,type CtBoneTeachingDecision,type CtBoneTeachingDecisionContext,type SavedCtBoneTeachingDecision} from '../lib/head-ct-bone-teaching-decision-contract';
import {confirmCtBoneTeachingSave,ctBoneTeachingSavePayload,parseCtBoneTeachingHistory,CtBoneTeachingSourceChangedError} from '../lib/head-ct-bone-teaching-decision-client';
import {ctBoneTeachingWorkingCopy,downloadCtBoneTeachingWorkingCopy} from '../lib/head-ct-bone-teaching-working-copy';
import './head-teaching-review-notes.css';

const endpoint='/api/atlas-review/head-ct-bone-teaching';
const stateLabel=(status:CtBoneTeachingDecision['status'])=>status==='accepted-teaching'?'Educational teaching accepted':status==='changes-required'?'Corrections requested':'Draft';
async function checkedResponse(response:Response){
  const value:unknown=await response.json();
  if(!response.ok)throw Error(value&&typeof value==='object'&&'error'in value&&typeof value.error==='string'?value.error:'Request failed. Keep your edits.');
  return value;
}
export function HeadCtBoneTeachingDecisionForm({context}:{context:CtBoneTeachingDecisionContext}){
  const [draft,setDraft]=useState(()=>blankCtBoneTeachingDecision(context)),[history,setHistory]=useState<SavedCtBoneTeachingDecision[]>([]),[nextBefore,setNextBefore]=useState<number|null>(null);
  const [version,setVersion]=useState(0),[latest,setLatest]=useState(0),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false);
  const [uncertain,setUncertain]=useState(false),[reloadRequired,setReloadRequired]=useState(false),[historyReady,setHistoryReady]=useState(false),[discard,setDiscard]=useState(false);
  const [message,setMessage]=useState('Loading your private teaching history…'),[error,setError]=useState(false),[downloadMessage,setDownloadMessage]=useState('');
  const active=useRef(true),inFlight=useRef(false),hasLoaded=useRef(false),generation=useRef(0),confirmedHistory=useRef(false),dirtyRef=useRef(false),baseline=useRef(blankCtBoneTeachingDecision(context));
  const titleId='ct-teaching-decision-title-'+context.conceptId;
  const heading=useRef<HTMLHeadingElement>(null);
  const alive=(ticket:number)=>active.current&&ticket===generation.current;
  useEffect(()=>{active.current=true;return()=>{active.current=false;generation.current++;inFlight.current=false;};},[]);
  useEffect(()=>{heading.current?.focus();},[]);
  useEffect(()=>{if(!dirty)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
  const status=(text:string,failed=false)=>{setMessage(text);setError(failed);};
  const ready=(value:boolean)=>{confirmedHistory.current=value;setHistoryReady(value);};
  async function load(before?:number){
    if(inFlight.current)return;const ticket=generation.current;inFlight.current=true;setBusy(true);if(before===undefined)ready(false);
    try{
      const params=new URLSearchParams({concept:context.conceptId});if(before!==undefined)params.set('before',String(before));
      const response=await clinicalReviewFetch(endpoint+'?'+params,{cache:'no-store'});if(!alive(ticket))return;
      if([401,403,409].includes(response.status))setReloadRequired(true);
      const value=parseCtBoneTeachingHistory(await checkedResponse(response),context,before);if(!alive(ticket))return;
      setHistory(previous=>before===undefined?value.history:[...previous,...value.history]);setNextBefore(value.nextBefore);
      if(before===undefined){const newest=value.history[0]?.version??0;setLatest(newest);setLoaded(true);ready(true);
        if(!hasLoaded.current){setVersion(newest);hasLoaded.current=true;setUncertain(false);}
        status(dirtyRef.current?'History refreshed; unsaved edits are unchanged. Compare before discarding or starting again.':newest?'History loaded. Explicitly load a current entry or start a fresh draft.':'No saved decision yet. Your first save creates version 1.');}
    }catch(caught){if(alive(ticket)){ready(false);setUncertain(true);if(caught instanceof CtBoneTeachingSourceChangedError)setReloadRequired(true);status(caught instanceof Error?caught.message:'History unavailable. Keep your edits.',true);}}
    finally{if(alive(ticket)){inFlight.current=false;setBusy(false);}}
  }
  useEffect(()=>{void load();},[]); // GET only. POST is explicit, with no automatic retry.
  function edit(change:Partial<CtBoneTeachingDecision>){
    // Any edit invalidates a previous acceptance attestation until explicitly rechecked.
    setDraft(previous=>({...previous,...change,attested:change.attested===true}));dirtyRef.current=true;setDirty(true);setDiscard(false);
  }
  function replace(record?:SavedCtBoneTeachingDecision){
    if(dirtyRef.current||busy||!loaded||reloadRequired||!confirmedHistory.current||record&&ctBoneTeachingDecisionStale(record,context))return;
    // Loading an old accepted entry never silently re-attests it.
    const next=record?{...validateCtBoneTeachingDecision(record.decision,context),attested:false}:blankCtBoneTeachingDecision(context);
    setDraft(next);baseline.current=next;setVersion(latest);setUncertain(false);
    status(record?`Loaded version ${record.version} against latest version ${latest}. Acceptance must be attested again before saving.`:'Started a fresh draft. Saved history is preserved.');
  }
  async function save(){
    if(inFlight.current||!loaded||uncertain||reloadRequired||!confirmedHistory.current||version!==latest)return;
    let payload;try{payload=ctBoneTeachingSavePayload(context,version,draft);}catch(caught){status(caught instanceof Error?caught.message:'Check your review.',true);return;}
    const ticket=generation.current;inFlight.current=true;setBusy(true);ready(false);
    try{
      const response=await clinicalReviewFetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!alive(ticket))return;
      if([401,403].includes(response.status))setReloadRequired(true);
      const saved=confirmCtBoneTeachingSave(await checkedResponse(response),context,version,payload.decision);if(!alive(ticket))return;
      setHistory(previous=>[saved,...previous]);setVersion(saved.version);setLatest(saved.version);setDraft(saved.decision);baseline.current=saved.decision;
      dirtyRef.current=false;setDirty(false);setDiscard(false);setUncertain(false);ready(true);status(`Saved private teaching version ${saved.version}. ${stateLabel(saved.decision.status)}; no clinical or publication approval.`);
    }catch(caught){if(alive(ticket)){setUncertain(true);status(caught instanceof Error?caught.message:'Save unconfirmed. Preserve edits and compare history.',true);}}
    finally{if(alive(ticket)){inFlight.current=false;setBusy(false);}}
  }
  function downloadWorkingCopy(){
    try{downloadCtBoneTeachingWorkingCopy(ctBoneTeachingWorkingCopy(context,draft,{baseVersion:loaded?version:null,unsavedChanges:dirty,saveUncertain:uncertain||busy,reloadRequired}));setDownloadMessage('Working-copy download requested. Confirm the file was saved and keep it private. Server-save status is unchanged.');}
    catch{setDownloadMessage('Download could not be started. Keep this page open and copy your notes before leaving.');}
  }
  return <section className="head-review-notes" aria-labelledby={titleId}>
    <h3 id={titleId} ref={heading} tabIndex={-1}>Private CT teaching review</h3>
    <p>For <code>{context.conceptId}</code> only, saved to your account and institution. Teaching acceptance does not approve geometry, diagnosis, comparisons, guided learning, publication or patient-space registration. Credentials are self-reported. Do not enter patient data.</p>
    <p className="head-review-message" role={error?'alert':'status'} aria-live="polite">{message}</p>
    <form onSubmit={event=>{event.preventDefault();void save();}}>
      <fieldset disabled={busy||!loaded}><legend>Review this teaching</legend>
        <div className="head-review-fields">
          <label>Reviewer name (self-reported)<input value={draft.reviewer} maxLength={160} onChange={e=>edit({reviewer:e.target.value})}/></label>
          <label>Qualification (self-reported)<input value={draft.qualification} maxLength={160} onChange={e=>edit({qualification:e.target.value})}/></label>
          <label>Status<select value={draft.status} onChange={e=>edit({status:e.target.value as CtBoneTeachingDecision['status']})}><option value="draft">Draft notes</option><option value="changes-required">Corrections requested</option><option value="accepted-teaching">Accept educational teaching only</option></select></label>
        </div>
        <details open={draft.status==='accepted-teaching'}><summary>Teaching checks</summary><div className="head-review-checks">{context.checklist.map(check=><label key={check.id}><input type="checkbox" checked={draft.checks[check.id]} onChange={e=>edit({checks:{...draft.checks,[check.id]:e.target.checked}})}/><span>{check.label}</span></label>)}</div></details>
        <label className="head-review-notes-field">Notes / requested corrections<textarea value={draft.notes} rows={4} maxLength={8000} placeholder="Describe the exact correction; correction requests need at least 10 characters." onChange={e=>edit({notes:e.target.value})}/></label>
        {draft.status==='accepted-teaching'&&<div className="head-review-checks"><label><input type="checkbox" checked={draft.attested} onChange={e=>edit({attested:e.target.checked})}/><span>{context.attestation}</span></label></div>}
        <div className="head-review-actions"><button type="submit" disabled={uncertain||reloadRequired||!historyReady||version!==latest}>Save private {draft.status==='changes-required'?'correction request':draft.status==='accepted-teaching'?'teaching decision':'draft'}</button><span>{dirty?'Unsaved edits':`Editing from version ${version}`}</span></div>
      </fieldset>
    </form>
    <details><summary>Exact review revisions</summary><dl><dt>Head source</dt><dd><code>{context.headRevision}</code></dd><dt>Comparison</dt><dd><code>{context.comparisonRevision}</code></dd><dt>Teaching</dt><dd><code>{context.teachingRevision}</code></dd><dt>Checklist</dt><dd>{context.checklistVersion}</dd></dl></details>
    {downloadMessage&&<p role="status" aria-live="polite">{downloadMessage}</p>}
    <div className="head-review-actions"><button type="button" onClick={downloadWorkingCopy}>Download working copy</button><button type="button" disabled={busy} onClick={()=>void load()}>Refresh saved history</button><button type="button" disabled={busy||!loaded||dirty||reloadRequired||!historyReady} onClick={()=>replace()}>Start fresh draft</button>{dirty&&<button type="button" disabled={busy} onClick={()=>setDiscard(true)}>Discard unsaved edits…</button>}</div>
    {discard&&<div className="head-review-discard"><p>Discard only unsaved form edits? Saved history stays intact. Copy any text you want to keep first.</p><button type="button" disabled={busy} onClick={()=>{setDraft(baseline.current);dirtyRef.current=false;setDirty(false);setDiscard(false);status('Unsaved edits discarded. Refresh history, then explicitly load an entry or start fresh.');}}>Confirm discard</button> <button type="button" onClick={()=>setDiscard(false)}>Keep editing</button></div>}
    {uncertain&&<p>Saving is locked. Refresh and compare history, preserve your text, then explicitly load a current entry or start fresh. Failed saves are never retried automatically.</p>}
    {reloadRequired&&<p role="alert">The source or authorized session changed. Export unsaved notes, then reload. Refreshing history cannot unlock saving.</p>}
    <details className="head-review-history"><summary>Saved history · {history.length} loaded</summary>
      {history.length===0?<p>No history loaded.</p>:<ol>{history.map(record=>{const stale=ctBoneTeachingDecisionStale(record,context);return <li key={record.version}>
        <div className="head-review-actions"><strong>Version {record.version} · {stateLabel(record.decision.status)}</strong><time dateTime={record.savedAt}>{record.savedAt}</time><span>{stale?'Historical source — cannot resume':record.version===latest?'Latest saved version':'Superseded version'}</span>{!stale&&<button type="button" disabled={busy||dirty||reloadRequired||!historyReady} onClick={()=>replace(record)}>Load version {record.version}</button>}</div>
        <p>{record.decision.reviewer||'No self-reported name'} · {record.decision.qualification||'No qualification supplied'}</p><p className="head-review-preserve">{record.decision.notes||'No notes supplied.'}</p><details><summary>Exact saved evidence</summary><pre>{JSON.stringify(record,null,2)}</pre></details>
      </li>;})}</ol>}{nextBefore!==null&&<button type="button" disabled={busy} onClick={()=>void load(nextBefore)}>Load older history</button>}
    </details>
  </section>;
}
