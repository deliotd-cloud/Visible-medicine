'use client';

import {useEffect,useRef,useState} from 'react';
import {clinicalReviewFetch,getClinicalReviewContext} from '../lib/clinical-review-fetch';
import {blankHeadTeachingDraft,headTeachingDraftStale,validateHeadTeachingDraft,type HeadTeachingDraft,type HeadTeachingDraftContext,type SavedHeadTeachingDraft} from '../lib/head-teaching-review-contract';
import {confirmHeadTeachingSave,parseHeadTeachingHistory,HeadTeachingSourceChangedError} from '../lib/head-teaching-review-client';
import {headTeachingWorkingCopy,downloadHeadWorkingCopy} from '../lib/head-review-working-copy';
import './head-teaching-review-notes.css';
import {NotesConsiderations,exactReviewChecks} from './GroupedReviewConfirmation';
import {createReviewDraftAutosave,mayAutosaveDraft,reviewDraftStamp,reviewerFromAuthorizedHistory,rememberReviewerForContext,reviewerForContext} from '../lib/review-draft-autosave';
import {registerClinicalReviewNavigationGuard} from '../lib/clinical-review-navigation-guard';
import {createRecoveryRecord,updateRecoveryRecord,detachRecoveryRecord,reattachRecoveryRecord,claimRecoveryRecord,clearRecoveryRecord,type RecoverySnapshot} from '../lib/head-teaching-review-recovery';

async function checkedResponse(response:Response){
  const value:unknown=await response.json();
  if(!response.ok)throw Error(value&&typeof value==='object'&&'error'in value&&typeof value.error==='string'?value.error:'Request failed. Keep your edits.');
  return value;
}
/** Private corrections only. Checklist completion never confers approval. */
export function HeadTeachingReviewNotes({context}:{context:HeadTeachingDraftContext}){
  const clinical=context.packetId==='head-brainstem-clinical',ventricular=context.packetId==='head-ventricular-clinical',cerebellar=context.packetId==='head-cerebellar-clinical',deepGrey=context.packetId==='head-deep-grey-clinical',lobar=context.packetId==='head-lobar-clinical',hippocampal=context.packetId==='head-hippocampal-clinical';
  const mriClinical=context.packetId==='head-mri-only-clinical',mriQuestions=context.packetId==='head-mri-anatomy-checks';
  const endpoint=clinical?'/api/atlas-review/head-brainstem-clinical':ventricular?'/api/atlas-review/head-ventricular-clinical':cerebellar?'/api/atlas-review/head-cerebellar-clinical':deepGrey?'/api/atlas-review/head-deep-grey-clinical':lobar?'/api/atlas-review/head-lobar-clinical':hippocampal?'/api/atlas-review/head-hippocampal-clinical':mriClinical?'/api/atlas-review/head-mri-only-clinical':mriQuestions?'/api/atlas-review/head-mri-anatomy-checks':'/api/atlas-review/head-learning';
  const headingId=clinical?'brainstem-clinical-notes-title':ventricular?'ventricular-clinical-notes-title':cerebellar?'cerebellar-clinical-notes-title':deepGrey?'deep-grey-clinical-notes-title':lobar?'lobar-clinical-notes-title':hippocampal?'hippocampal-clinical-notes-title':mriClinical?'mri-only-clinical-notes-title':mriQuestions?'mri-anatomy-checks-notes-title':'head-review-notes-title';
  const [draft,setDraft]=useState(()=>blankHeadTeachingDraft(context));
  const [history,setHistory]=useState<SavedHeadTeachingDraft[]>([]);
  const [nextBefore,setNextBefore]=useState<number|null>(null);
  const [version,setVersion]=useState(0),[latest,setLatest]=useState(0);
  const [loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false),[uncertain,setUncertain]=useState(false);
  const [reloadRequired,setReloadRequired]=useState(false);
  const [message,setMessage]=useState('Loading your private saved history…'),[error,setError]=useState(false);
  const [discard,setDiscard]=useState(false);
  const [downloadMessage,setDownloadMessage]=useState('');
  const [recoveredNeedsReview,setRecoveredNeedsReview]=useState(false),[recoveryFull,setRecoveryFull]=useState(false);
  const active=useRef(true),inFlight=useRef(false),hasLoaded=useRef(false);
  const baseline=useRef(blankHeadTeachingDraft(context)),dirtyRef=useRef(false);
  const draftRef=useRef(blankHeadTeachingDraft(context));
  const snapshotRef=useRef<RecoverySnapshot>({draft:draftRef.current,baseline:baseline.current,baseVersion:0,dirty:false,uncertain:false,reloadRequired:false,writeInFlight:false});
  const identityRef=useRef<string|null>(null),recordRef=useRef<{id:number;generation:number}|null>(null);
  const editSequence=useRef(0);
  const autosave=useRef(createReviewDraftAutosave()),autosaveStamp=useRef(''),autosaveAllowed=useRef(false);
  const sourceKey=reviewDraftStamp(context,0,null),sourceAtMount=useRef(sourceKey);
  const latestSource=useRef(sourceKey);latestSource.current=sourceKey;
  const contextAtMount=useRef<HeadTeachingDraftContext>(JSON.parse(JSON.stringify(context)));
  useEffect(()=>{
    active.current=true;
    if(recordRef.current){const next=reattachRecoveryRecord(recordRef.current.id,recordRef.current.generation);if(next)recordRef.current.generation=next;}
    return()=>{
      autosave.current.cancel();active.current=false;
      const record=recordRef.current;
      if(record){const next=detachRecoveryRecord(record.id,record.generation,snapshotRef.current.writeInFlight);if(next)record.generation=next;}
    };
  },[]);
  function preserve(change:Partial<RecoverySnapshot>){
    snapshotRef.current={...snapshotRef.current,...change};
    if(!snapshotRef.current.dirty&&!snapshotRef.current.writeInFlight)return;
    const identity=identityRef.current;
    if(!identity)return;
    let record=recordRef.current;
    if(!record){if(sourceKey!==sourceAtMount.current)return;record=createRecoveryRecord(contextAtMount.current,identity,snapshotRef.current);if(!record){setRecoveryFull(true);return;}recordRef.current=record;}
    else {const next=updateRecoveryRecord(record.id,record.generation,snapshotRef.current);if(next)record.generation=next;}
  }
  function clearPreserved(){
    const record=recordRef.current;
    if(record&&clearRecoveryRecord(record.id,record.generation))recordRef.current=null;
    setRecoveryFull(false);
  }
  useEffect(()=>{
    if(!dirty)return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
    window.addEventListener('beforeunload',warn);
    const unregister=registerClinicalReviewNavigationGuard(document,()=>true);
    return()=>{window.removeEventListener('beforeunload',warn);unregister();};
  },[dirty]);
  const status=(text:string,failed=false)=>{setMessage(text);setError(failed);};
  useEffect(()=>{if(sourceKey!==sourceAtMount.current){autosave.current.cancel();setReloadRequired(true);preserve({reloadRequired:true});}},[sourceKey]);
  function downloadWorkingCopy(){
    try{
      downloadHeadWorkingCopy(headTeachingWorkingCopy(context,draft,{baseVersion:loaded?version:null,unsavedChanges:dirty,saveUncertain:uncertain||busy,reloadRequired}));
      setDownloadMessage('Working-copy download requested. Confirm the file was saved and keep it private. Your edits and server-save status are unchanged.');
    }catch{setDownloadMessage('Download could not be started. Keep this page open and copy your notes before leaving.');}
  }
  async function load(before?:number){
    autosave.current.cancel();
    if(inFlight.current)return;
    inFlight.current=true;setBusy(true);
    try{
      const response=await clinicalReviewFetch(endpoint+(before?'?before='+before:''),{cache:'no-store'});
      if([401,403,409].includes(response.status)&&active.current){setReloadRequired(true);preserve({reloadRequired:true});}
      const value=parseHeadTeachingHistory(await checkedResponse(response),context,before);
      if(!active.current)return;
      if(latestSource.current!==sourceAtMount.current){setReloadRequired(true);preserve({reloadRequired:true});status('The packet source changed while history was loading. Reload before reviewing.',true);return;}
      const returnedIdentity=response.headers.get('X-Clinical-Review-Context');
      if(identityRef.current&&returnedIdentity!==identityRef.current){setReloadRequired(true);preserve({reloadRequired:true});status('The private session changed. Download a working copy and reload before reviewing.',true);return;}
      setHistory(previous=>before?[...previous,...value.history]:value.history);setNextBefore(value.nextBefore);
      if(!before){
        const newest=value.history[0]?.version??0;
        setLatest(newest);setLoaded(true);
        // Reloading history must not silently rebase or discard an open draft.
        if(!hasLoaded.current){setVersion(newest);snapshotRef.current.baseVersion=newest;hasLoaded.current=true;
          if(returnedIdentity){
            identityRef.current=returnedIdentity;
            const recovered=sourceKey===sourceAtMount.current?claimRecoveryRecord(contextAtMount.current,returnedIdentity):null;
            if(recovered){
              recordRef.current={id:recovered.id,generation:recovered.generation};
              const copy=recovered.snapshot;
              snapshotRef.current={...copy,uncertain:copy.uncertain||copy.writeInFlight};
              draftRef.current=copy.draft;baseline.current=copy.baseline;
              dirtyRef.current=copy.dirty;setDraft(copy.draft);setDirty(copy.dirty);
              setVersion(copy.baseVersion);setUncertain(copy.uncertain||copy.writeInFlight);
              if(copy.reloadRequired)setReloadRequired(true);
              setRecoveredNeedsReview(true);
              status(copy.baseVersion!==newest||copy.uncertain||copy.writeInFlight||copy.reloadRequired?'Recovered unsaved notes. Saving is locked: compare saved history and download a working copy before resolving the draft.':'Recovered unsaved notes. Review them, then explicitly save or discard. Automatic saving is paused.');
              return;
            }
          }
          const current=value.history[0],profile=returnedIdentity?reviewerFromAuthorizedHistory(current?.draft??null,!!current&&!headTeachingDraftStale(current,context),dirtyRef.current):null;if(profile)rememberReviewerForContext(returnedIdentity,profile);const remembered=returnedIdentity?(profile??reviewerForContext(returnedIdentity)):null;if(remembered&&!dirtyRef.current){const next={...draftRef.current,reviewer:draftRef.current.reviewer||remembered.reviewer,qualification:draftRef.current.qualification||remembered.qualification};draftRef.current=next;snapshotRef.current.draft=next;setDraft(next);}}
        status(!returnedIdentity?'History loaded, but the private session could not be verified for in-page recovery. Download a working copy before leaving.':dirtyRef.current?'History refreshed; your unsaved edits are unchanged. Compare the latest entry before discarding or starting again.':newest?'History loaded. Load a current saved draft below, or start a fresh draft.':'No saved notes yet. Your first save will create version 1.');
      }
    }catch(caught){if(active.current){setUncertain(true);preserve({uncertain:true});if(caught instanceof HeadTeachingSourceChangedError){setReloadRequired(true);preserve({reloadRequired:true});}status(caught instanceof Error?caught.message:'History unavailable. Keep your edits.',true);}}
    finally{inFlight.current=false;if(active.current)setBusy(false);}
  }
  useEffect(()=>{void load();},[]); // Initial account-bound GET; never retries a write.
  function edit(change:Partial<HeadTeachingDraft>){
    autosave.current.cancel();
    const next={...draftRef.current,...change};draftRef.current=next;editSequence.current++;
    setDraft(next);dirtyRef.current=true;setDirty(true);setDiscard(false);preserve({draft:next,dirty:true});
  }
  function replace(record?:SavedHeadTeachingDraft){
    autosave.current.cancel();
    if(dirtyRef.current||busy||!loaded||reloadRequired||record&&headTeachingDraftStale(record,context))return;
    const next=record?validateHeadTeachingDraft(record.draft,context):blankHeadTeachingDraft(context);
    draftRef.current=next;setDraft(next);baseline.current=next;setVersion(latest);setUncertain(false);setRecoveredNeedsReview(false);
    snapshotRef.current={draft:next,baseline:next,baseVersion:latest,dirty:false,uncertain:false,reloadRequired:false,writeInFlight:false};
    status(record?`Loaded version ${record.version} for editing against latest version ${latest}. Saving creates a new entry.`:'Started a fresh draft for the current packet. Previous history is preserved.');
  }
  async function save(automatic=false){
    autosave.current.cancel();
    if(sourceKey!==sourceAtMount.current)return;
    if(automatic&&(recoveredNeedsReview||!dirtyRef.current||draftRef.current.status!=='draft'))return;
    if(inFlight.current||!loaded||uncertain||reloadRequired||version!==latest)return;
    let validated:HeadTeachingDraft;
    try{validated=validateHeadTeachingDraft(draftRef.current,context);}catch(caught){status(caught instanceof Error?caught.message:'Check your draft.',true);return;}
    inFlight.current=true;setBusy(true);preserve({writeInFlight:true});
    const saveRecord=recordRef.current?{...recordRef.current}:null;
    const saveSequence=editSequence.current;
    try{
      const response=await clinicalReviewFetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({catalogScope:context.catalogScope,packetId:context.packetId,packetRevision:context.packetRevision,headRevision:context.headRevision,checklistVersion:context.checklistVersion,expectedVersion:version,draft:validated})});
      if([401,403].includes(response.status)&&active.current){setReloadRequired(true);preserve({reloadRequired:true});}
      const saved=confirmHeadTeachingSave(await checkedResponse(response),context,version,validated);
      if(!active.current)return;
      if(saveSequence!==editSequence.current||saveRecord&&(!recordRef.current||recordRef.current.id!==saveRecord.id||recordRef.current.generation!==saveRecord.generation)){
        setUncertain(true);preserve({uncertain:true,writeInFlight:false});status('A newer edit exists after this save began. Compare saved history before saving again.',true);return;
      }
      rememberReviewerForContext(getClinicalReviewContext(),saved.draft);
      setHistory(previous=>[saved,...previous]);setVersion(saved.version);setLatest(saved.version);draftRef.current=saved.draft;setDraft(saved.draft);baseline.current=saved.draft;
      dirtyRef.current=false;setDirty(false);setDiscard(false);setUncertain(false);setRecoveredNeedsReview(false);clearPreserved();snapshotRef.current={draft:saved.draft,baseline:saved.draft,baseVersion:saved.version,dirty:false,uncertain:false,reloadRequired:false,writeInFlight:false};status(`Saved private version ${saved.version}. This is not clinical sign-off or publication.`);
    }catch(caught){if(active.current){setUncertain(true);preserve({uncertain:true,writeInFlight:false});status(caught instanceof Error?caught.message:'Save could not be confirmed. Keep your edits and compare history.',true);}}
    finally{inFlight.current=false;if(active.current)setBusy(false);}
  }
  const autoStamp=reviewDraftStamp(context,version,draft);
  autosaveStamp.current=autoStamp;
  const autoReady=mayAutosaveDraft({status:draft.status,attested:false,dirty,loaded,currentHistory:version===latest&&sourceKey===sourceAtMount.current,busy,uncertain,reloadRequired});
  autosaveAllowed.current=autoReady&&!discard&&!recoveredNeedsReview;
  useEffect(()=>{
    if(!autoReady||discard||recoveredNeedsReview)return()=>autosave.current.cancel();
    autosave.current.schedule(autoStamp,expected=>active.current&&autosaveAllowed.current&&autosaveStamp.current===expected&&!inFlight.current,()=>{void save(true);});
    return()=>autosave.current.cancel();
  },[autoStamp,autoReady,discard,recoveredNeedsReview]);
  return <section className="head-review-notes" aria-labelledby={headingId}>
    <h2 id={headingId}>{clinical?'Private brainstem clinical notes & corrections':ventricular?'Private ventricular clinical notes & corrections':cerebellar?'Private cerebellar clinical notes & corrections':deepGrey?'Private deep-grey clinical notes & corrections':lobar?'Private cerebral-lobe clinical notes & corrections':hippocampal?'Private hippocampal clinical notes & corrections':mriClinical?'Private MRI-only clinical notes & corrections':mriQuestions?'Private MRI-only anatomy check corrections':'Private review notes & corrections'}</h2>
    {clinical&&<p>Separate clinical packet · midbrain, pons and medulla. These corrections are not part of the original anatomy-notes history.</p>}
    {ventricular&&<p>Clinical packet · lateral, third and fourth ventricles. Corrections are saved with the ventricular packet revision.</p>}
    {cerebellar&&<p>Clinical packet · left/right cerebellar hemispheres and vermis. MRI vermis coverage is partial; no exact matching 3D part or patient-space registration is claimed. Corrections are saved with this independent clinical revision.</p>}
    {deepGrey&&<p>Clinical packet · paired caudate, putamen, globus pallidus and thalamus. Corrections use this independent clinical revision, not the original anatomy or other clinical histories. CT/MRI and reference 3D comparison is semantic, not patient-space registration.</p>}
    {lobar&&<p>Independent clinical packet · paired frontal, parietal, temporal and occipital lobes. Corrections stay with this clinical revision and its eight concepts, separate from anatomy and other clinical histories. CT/MRI and reference 3D comparison is semantic, not patient-space registration.</p>}
    {hippocampal&&<p>Independent clinical packet · left and right hippocampus. Corrections stay with this clinical revision and its two concepts, separate from original anatomy teaching and other clinical histories. CT/MRI and the existing 3D Atlas are separate, unregistered subjects; the saved masks cannot establish sclerosis, epileptogenicity, memory performance, subfield boundaries or volumetry.</p>}
    {mriClinical&&<p>Independent clinical packet · pituitary and corpus callosum. These corrections stay with this clinical revision, separate from MRI teaching, anatomy questions and other clinical histories. No exact CT counterpart is mapped; MRI and the existing 3D Atlas are separate, unregistered subjects.</p>}
    {mriQuestions&&<p>Independent question packet · paired amygdalae, corpus callosum and pituitary. Corrections bind the questions and their complete MRI teaching source, separate from teaching and clinical histories. This is not an exam response or score. No exact CT counterpart or patient-space registration is claimed.</p>}
    <p>Saved only for your signed-in account and institution. These notes do not approve, publish or modify the teaching packet or masks. Name and qualification are self-reported, not verified credentials. Do not enter patient data.</p>
    <p className="head-review-message" role={error?'alert':'status'} aria-live="polite">{message}</p>
    {recoveredNeedsReview&&<p role="status">Recovered unsaved work is held only while this page document remains open. Review it before an explicit save. A full reload or tab close cannot recover this copy.</p>}
    {recoveryFull&&<p role="alert">In-memory recovery is full. Download this working copy now and confirm the file was saved before leaving this page.</p>}
    <form onSubmit={event=>{event.preventDefault();void save();}}>
      <fieldset disabled={busy||!loaded}>
        <legend>Current packet · {context.conceptIds.length} linked concepts</legend>
        <div className="head-review-fields">
          <label>Reviewer name (self-reported)<input value={draft.reviewer} maxLength={160} onChange={event=>edit({reviewer:event.target.value})}/></label>
          <label>Qualification (self-reported)<input value={draft.qualification} maxLength={160} onChange={event=>edit({qualification:event.target.value})}/></label>
          <label>Status<select value={draft.status} onChange={event=>edit({status:event.target.value as HeadTeachingDraft['status']})}><option value="draft">Draft notes</option><option value="changes-required">Corrections requested</option></select></label>
          <label>Review scope<textarea value={draft.scope} rows={2} maxLength={1000} placeholder={mriClinical||mriQuestions?'Concept IDs and the MRI/existing 3D aspects inspected':cerebellar?'Concept IDs and the CT/MRI teaching inspected':'Concept IDs and the CT/MRI/3D aspects inspected'} onChange={event=>edit({scope:event.target.value})}/></label>
        </div>
        <NotesConsiderations criteria={context.checklist} checked={context.checklist.every(check=>draft.checks[check.id]===true)} onChange={considered=>edit({checks:exactReviewChecks(context.checklist,considered)})}/>
        <label className="head-review-notes-field">Notes / requested corrections<textarea value={draft.notes} rows={5} maxLength={8000} placeholder="Describe the structure, source and exact correction. Corrections requested need at least 10 characters." onChange={event=>edit({notes:event.target.value})}/></label>
        <div className="head-review-actions"><button type="submit" disabled={uncertain||reloadRequired||version!==latest}>Save private {draft.status==='changes-required'?'correction request':'draft'}</button><span>{dirty?'Unsaved edits':`Editing from version ${version}`} · packet {context.packetRevision.slice(0,12)}</span></div>
      </fieldset>
    </form>
    {downloadMessage&&<p role="status" aria-live="polite">{downloadMessage}</p>}
    <div className="head-review-actions">
      <button type="button" onClick={downloadWorkingCopy}>Download working copy</button>
      <button type="button" disabled={busy} onClick={()=>void load()}>Refresh saved history</button>
      <button type="button" disabled={busy||!loaded||dirty||reloadRequired} onClick={()=>replace()}>Start fresh draft</button>
      {dirty&&<button type="button" disabled={busy} onClick={()=>{autosave.current.cancel();setDiscard(true);}}>Discard unsaved edits…</button>}
    </div>
    {discard&&<div className="head-review-discard"><p>Discard only the unsaved form edits? Saved history will not be deleted. Copy any text you want to keep first.</p><button type="button" disabled={busy} onClick={()=>{clearPreserved();draftRef.current=baseline.current;setDraft(baseline.current);dirtyRef.current=false;setDirty(false);setDiscard(false);setRecoveredNeedsReview(false);snapshotRef.current={...snapshotRef.current,draft:baseline.current,dirty:false,uncertain,reloadRequired,writeInFlight:false};status('Unsaved edits discarded. Refresh history, then explicitly load a saved draft or start fresh.');}}>Confirm discard</button> <button type="button" onClick={()=>setDiscard(false)}>Keep editing</button></div>}
    {uncertain&&<p>Saving is locked until you compare saved history and explicitly load a current entry or start fresh. If the account, institution or packet changed, copy your notes and reload this page.</p>}
    {reloadRequired&&<p role="alert">The source or authorized session changed. Copy any unsaved notes, then reload this page. Loading old history cannot unlock saving.</p>}
    <details className="head-review-history"><summary>Saved history · {history.length} loaded {dirty?'· preserve unsaved edits before loading':''}</summary>
      {history.length===0?<p>No history loaded.</p>:<ol>{history.map(record=>{
        const stale=headTeachingDraftStale(record,context);
        return <li key={record.version}><div className="head-review-actions"><strong>Version {record.version} · {record.draft.status==='changes-required'?'Corrections requested':'Draft'}</strong><time dateTime={record.savedAt}>{record.savedAt}</time><span>{stale?'Historical source — cannot resume':'Current packet'}</span>{!stale&&<button type="button" disabled={busy||dirty||reloadRequired} onClick={()=>replace(record)}>Load version {record.version}</button>}</div><p>{record.draft.reviewer||'No self-reported name'} · {record.draft.qualification||'No qualification supplied'}</p><p className="head-review-preserve">{record.draft.scope}</p><p className="head-review-preserve">{record.draft.notes||'No notes supplied.'}</p><details><summary>Exact saved revision &amp; checklist</summary><pre>{JSON.stringify(record,null,2)}</pre></details></li>;
      })}</ol>}
      {nextBefore!==null&&<button type="button" disabled={busy} onClick={()=>void load(nextBefore)}>Load older history</button>}
    </details>
  </section>;
}
