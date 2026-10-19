import {useEffect,useState} from 'react';
import {clinicalReviewFetch} from '../../lib/clinical-review-fetch';
import {canonicalCandidateJson} from '../../lib/clinical-review-candidate';
import {parseFrozenDecisionPage,parseFrozenReviewEvent,validateFrozenReviewEvent,makeFrozenReviewEvent,type FrozenDecisionPage} from '../../lib/frozen-review-contract';
import {blankBodyReview,bodyApprovalProblems,bodyReviewTracks,validateBodyReviewDraft,type BodyReviewDraft,type BodyReviewTrack} from '../../atlas-review/lib/body-review-decisions';
import './decisions.css';

type Drafts=Record<BodyReviewTrack,BodyReviewDraft>;
const titles={geometry:'3D anatomy',teaching:'Teaching copy',imaging:'Imaging'};
const clearFlags=()=>({geometry:false,teaching:false,imaging:false});
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const errorText=(value:unknown)=>value&&typeof value==='object'&&'error'in value&&typeof value.error==='string'?value.error:'Private review could not be confirmed.';
function initialDrafts(page:FrozenDecisionPage):Drafts{
 return Object.fromEntries(bodyReviewTracks.map(track=>{const saved=page.reviews.find(e=>e.review.track===track)?.review;const draft=saved?validateBodyReviewDraft(saved,page.context.checklists[track]):blankBodyReview(page.context,track);return [track,{...draft,attested:false}];})) as Drafts;
}
async function read(candidateId:string,id:string,track:BodyReviewTrack,before?:number,signal?:AbortSignal){
 const query=new URLSearchParams({structureId:id,track,...(before?{before:String(before)}:{})});
 const response=await clinicalReviewFetch(`/api/atlas-review/candidates/${candidateId}/decisions?${query}`,{cache:'no-store',signal});
 const raw=await response.json();if(!response.ok)throw Error(errorText(raw));
 const page=await parseFrozenDecisionPage(raw,candidateId,id);if(page.track!==track||before&&page.history.some(e=>e.review.version>=before))throw Error('Saved history cursor changed. Keep your draft.');return page;
}
export function FrozenDecisionEditor({candidateId,id,materialHash,onDirty}:{candidateId:string;id:string;materialHash:string;onDirty:(value:boolean)=>void}){
 const [page,setPage]=useState<FrozenDecisionPage|null>(null),[history,setHistory]=useState<FrozenDecisionPage|null>(null),[drafts,setDrafts]=useState<Drafts|null>(null);
 const [track,setTrack]=useState<BodyReviewTrack>('geometry'),[dirty,setDirty]=useState(clearFlags),[busy,setBusy]=useState(false),[needsRefresh,setNeedsRefresh]=useState(false),[compare,setCompare]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const anyDirty=bodyReviewTracks.some(t=>dirty[t]);
 useEffect(()=>{const abort=new AbortController();setError('');read(candidateId,id,'geometry',undefined,abort.signal).then(value=>{
  if(abort.signal.aborted)return;if(value.context.materialHash!==materialHash)throw Error('Worksheet differs from this review candidate.');setPage(value);setHistory(value);setDrafts(initialDrafts(value));
 }).catch(e=>{if(!abort.signal.aborted)setError(e instanceof Error?e.message:'Saved reviews unavailable.');});return()=>abort.abort();},[candidateId,id,materialHash]);
 useEffect(()=>{onDirty(anyDirty||busy);return()=>onDirty(false);},[anyDirty,busy,onDirty]);
 useEffect(()=>{const guard=(event:BeforeUnloadEvent)=>{if(anyDirty||busy){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard);},[anyDirty,busy]);
 function change(patch:Partial<BodyReviewDraft>){if(!drafts||busy)return;setDrafts({...drafts,[track]:{...drafts[track],attested:false,...patch}});setDirty({...dirty,[track]:true});setMessage('');}
 async function refresh(){setBusy(true);setError('');try{const value=await read(candidateId,id,track);if(value.context.materialHash!==materialHash)throw Error('Saved worksheet identity changed.');setPage(value);setHistory(value);setNeedsRefresh(false);if(anyDirty){setCompare(true);setMessage('Saved records refreshed. Compare them with your retained draft before continuing.');}else{setDrafts(initialDrafts(value));setCompare(false);}}catch(e){setNeedsRefresh(true);setError(e instanceof Error?e.message:'Refresh failed. Your draft is retained.');}finally{setBusy(false);}}
 function retainAfterComparison(){if(!page||!drafts)return;const next={...drafts};for(const t of bodyReviewTracks){const saved=page.reviews.find(e=>e.review.track===t)?.review;const old=next[t];next[t]={...old,status:old.status==='approved'?'draft':old.status,attested:false,checks:Object.fromEntries(page.context.checklists[t].map(c=>[c.id,false])),issues:[...old.issues,...(saved?.issues??[]).filter(issue=>!old.issues.some(i=>i.id===issue.id))]};}setDrafts(next);setCompare(false);setDirty({geometry:true,teaching:true,imaging:true});setMessage('Written draft retained. Checklists and attestations were reset; saved issues remain.');}
 async function showHistory(before?:number){setBusy(true);setError('');try{const value=await read(candidateId,id,track,before);if(page&&value.reviews.some(event=>event.review.version!==(page.reviews.find(old=>old.review.track===event.review.track)?.review.version??0))){setNeedsRefresh(true);setMessage('Another save exists. Refresh and compare your retained draft before saving.');}setHistory(value);}catch(e){setError(e instanceof Error?e.message:'History unavailable.');}finally{setBusy(false);}}
 async function save(){
  if(!page||!drafts||busy||needsRefresh||compare||!dirty[track])return;
  const context=page.context,previous=page.reviews.find(e=>e.review.track===track),expected=previous?.review.version??0;
  let submitted:BodyReviewDraft;try{submitted=validateBodyReviewDraft(drafts[track],context.checklists[track]);const problems=submitted.status==='approved'?bodyApprovalProblems(submitted,context,track):[];if(problems.length)throw Error(problems.join(' '));}catch(e){setError(e instanceof Error?e.message:'Invalid review.');return;}
  setBusy(true);setError('');setMessage('');
  let uncertain=true;
  try{
   const response=await clinicalReviewFetch(`/api/atlas-review/candidates/${candidateId}/decisions`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({schema:'vm-frozen-body-review-save-1',candidateId,structureId:id,track,expectedVersion:expected,contextHash:context.contextHash,revisionHash:context.revisions[track],materialHash:context.materialHash,draft:submitted})});
   const data=await response.json();
   if(!response.ok){uncertain=![400,413,415,422].includes(response.status);throw Error(errorText(data));}
   if(!record(data)||Object.keys(data).sort().join(',')!=='candidateId,contextHash,event,schema'||data.schema!=='vm-frozen-body-review-saved-1'||data.candidateId!==candidateId||data.contextHash!==context.contextHash)throw Error('Save acknowledgement differs. Keep your draft and refresh history.');
   const event=validateFrozenReviewEvent(parseFrozenReviewEvent(data.event),context,track);
   if(event.review.version!==expected+1||canonicalCandidateJson(event)!==canonicalCandidateJson(makeFrozenReviewEvent(submitted,context,track,expected+1,event.review.savedAt)))throw Error('Saved content differs from the submitted draft. Refresh history before another save.');
   setPage({...page,reviews:[...page.reviews.filter(e=>e.review.track!==track),event]});
   setDrafts({...drafts,[track]:{...validateBodyReviewDraft(event.review,context.checklists[track]),attested:false}});setDirty({...dirty,[track]:false});setNeedsRefresh(false);
   // History is reloaded explicitly: do not manufacture a page by mixing a new
   // event with an older cursor or a different track's snapshot.
   setHistory(null);
   setMessage(`Saved version ${event.review.version}. ${event.review.status==='approved'?'Personal approval recorded for this exact candidate only.':'Private review recorded.'}`);
  }catch(e){if(uncertain)setNeedsRefresh(true);setError(e instanceof Error?e.message:'Save was not confirmed. Keep your draft; refresh and compare before retrying.');}finally{setBusy(false);}
 }
 function exportDraft(){if(!drafts)return;const url=URL.createObjectURL(new Blob([JSON.stringify({schema:'vm-frozen-local-draft-export-1',candidateId,structureId:id,drafts,warning:'Private working copy, not an importable approval or publication authorization.'},null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='visible-medicine-private-review-draft.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 const draft=drafts?.[track],latest=page?.reviews.find(e=>e.review.track===track),problems=page&&draft&&draft.status==='approved'?bodyApprovalProblems(draft,page.context,track):[];
 return <section className="frozen-decision" aria-label="Private candidate decision">
  <h2>Record your review</h2><p>Personal record within your authorized institution. Applies only to this saved structure and candidate—not to later versions, learner release, institution sign-off or patient-space registration.</p>
  {error&&<p role="alert" className="notice">{error} Your written draft has not been discarded.</p>}{message&&<p role="status">{message}</p>}
  <div className="decision-actions"><button type="button" onClick={()=>void refresh()} disabled={busy}>Refresh saved records</button>{drafts&&<button type="button" onClick={exportDraft}>Export local draft</button>}</div>
  {!page||!draft?<p role="status">{error?'Load saved records to start.':'Loading private review records…'}</p>:<>
   <nav aria-label="Review track" className="decision-actions">{bodyReviewTracks.map(t=><button type="button" key={t} aria-pressed={t===track} disabled={busy} onClick={()=>{setTrack(t);setError('');setMessage('');}}>{titles[t]}{dirty[t]?' · unsaved':''}</button>)}</nav>
   <p>Saved: {latest?(latest.review.status==='approved'?'Approval recorded':latest.review.status==='changes-required'?'Changes required':'Draft')+` · version ${latest.review.version}`:'Not started'} · {titles[track]}</p>
   <details><summary>Exact candidate decision scope</summary><p>Candidate <code>{candidateId}</code></p><p>Material <code>{page.context.materialHash}</code></p><p>Saved renderer <code>{page.context.rendererHash}</code></p><p>Track <code>{page.context.revisions[track]??'No imaging approval revision'}</code></p></details>
   {page.context.blockers[track].length>0&&<div className="notice"><strong>Approval unavailable for this track</strong><ul>{page.context.blockers[track].map(item=><li key={item}>{item}</li>)}</ul><p>You may still save draft notes or required corrections.</p></div>}
   {compare&&<div className="notice"><p>Compare the refreshed saved record with your local draft. Nothing is saved by keeping a draft.</p><details><summary>Compare saved and local content</summary><pre>{JSON.stringify({saved:latest?.review??null,local:draft},null,2)}</pre></details><button type="button" onClick={retainAfterComparison} disabled={busy}>Keep written draft after comparison; reset checks</button></div>}
   <fieldset disabled={busy}><legend>{titles[track]} review</legend>
    <label>Decision <select value={draft.status} onChange={e=>change({status:e.target.value as BodyReviewDraft['status']})}><option value="draft">Draft</option><option value="changes-required">Changes required</option><option value="approved" disabled={!!page.context.blockers[track].length||!page.context.revisions[track]}>Approve this exact scope</option></select></label>
    <div className="decision-fields"><label>Reviewer name<input maxLength={200} value={draft.reviewer} onChange={e=>change({reviewer:e.target.value})}/></label><label>Professional role / qualification<input maxLength={200} value={draft.qualification} onChange={e=>change({qualification:e.target.value})}/></label></div>
    <label>Exact scope reviewed<textarea value={draft.scope} maxLength={2000} onChange={e=>change({scope:e.target.value})}/></label>
    <label>Notes / corrections<textarea value={draft.notes} maxLength={6000} onChange={e=>change({notes:e.target.value})}/></label>
    <fieldset><legend>Inspection checklist</legend>{page.context.checklists[track].map(check=><label className="check" key={check.id}><input type="checkbox" checked={draft.checks[check.id]===true} onChange={e=>change({checks:{...draft.checks,[check.id]:e.target.checked}})}/><span>{check.label}</span></label>)}</fieldset>
    <h3>Supporting evidence</h3>{draft.evidence.map((reference,index)=><section className="decision-evidence" key={index}><label>Reference title<input maxLength={200} value={reference.title} onChange={e=>change({evidence:draft.evidence.map((r,i)=>i===index?{...r,title:e.target.value}:r)})}/></label><label>HTTPS source URL<input type="url" maxLength={2000} value={reference.url} onChange={e=>change({evidence:draft.evidence.map((r,i)=>i===index?{...r,url:e.target.value}:r)})}/></label><label>Evidence note<textarea maxLength={2000} value={reference.note} onChange={e=>change({evidence:draft.evidence.map((r,i)=>i===index?{...r,note:e.target.value}:r)})}/></label><button type="button" onClick={()=>change({evidence:draft.evidence.filter((_,i)=>i!==index)})}>Remove reference</button></section>)}
    <button type="button" disabled={draft.evidence.length>=12} onClick={()=>change({evidence:[...draft.evidence,{title:'',url:'',note:''}]})}>Add evidence reference</button>
    <h3>Issues to track</h3>{draft.issues.map(issue=><section className="decision-evidence" key={issue.id}><label>Issue title<input maxLength={300} value={issue.title} onChange={e=>change({issues:draft.issues.map(i=>i.id===issue.id?{...i,title:e.target.value}:i)})}/></label><label>Severity<select value={issue.severity} onChange={e=>change({issues:draft.issues.map(i=>i.id===issue.id?{...i,severity:e.target.value as 'blocker'|'major'|'minor'}:i)})}><option value="blocker">Blocker</option><option value="major">Major</option><option value="minor">Minor</option></select></label><label className="check"><input type="checkbox" checked={issue.resolved} onChange={e=>change({issues:draft.issues.map(i=>i.id===issue.id?{...i,resolved:e.target.checked}:i)})}/>Resolved</label><label>Resolution explanation<textarea maxLength={2000} value={issue.resolution} onChange={e=>change({issues:draft.issues.map(i=>i.id===issue.id?{...i,resolution:e.target.value}:i)})}/></label>{!latest?.review.issues.some(i=>i.id===issue.id)&&<button type="button" onClick={()=>change({issues:draft.issues.filter(i=>i.id!==issue.id)})}>Remove unsaved issue</button>}</section>)}
    <button type="button" disabled={draft.issues.length>=20} onClick={()=>change({issues:[...draft.issues,{id:'issue-'+crypto.randomUUID(),title:'',severity:'major',resolved:false,resolution:''}]})}>Add issue</button>
    <label className="check attestation"><input type="checkbox" checked={draft.attested} onChange={e=>change({attested:e.target.checked})}/><span>I personally inspected the exact saved anatomy and teaching for the stated scope. This is not institution sign-off, public-release permission or imaging registration.</span></label>
   </fieldset>
   {problems.length>0&&<ul aria-label="Approval requirements">{problems.map(problem=><li key={problem}>{problem}</li>)}</ul>}
   <button type="button" className="save-review" disabled={busy||needsRefresh||compare||!dirty[track]||problems.length>0} onClick={()=>void save()}>{busy?'Saving or refreshing…':draft.status==='approved'?'Record personal approval':'Save private review'}</button>
   <details><summary>Saved history · {titles[track]}</summary><button type="button" disabled={busy} onClick={()=>void showHistory()}>Show newest history</button>{history?.track===track&&<><ol>{history.history.map(event=><li key={event.review.version}><strong>Version {event.review.version} · {event.review.status}</strong><p>{event.review.savedAt} · {event.review.reviewer||'Reviewer not supplied'}</p><details><summary>Recorded scope, notes and evidence</summary><pre>{JSON.stringify(event.review,null,2)}</pre></details></li>)}</ol>{!history.history.length&&<p>No saved records for this exact candidate and track.</p>}{history.nextBefore&&<button type="button" disabled={busy} onClick={()=>void showHistory(history.nextBefore!)}>Older history</button>}</>}</details>
  </>}
 </section>;
}
