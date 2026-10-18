"use client";

import { FormEvent, ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { StudioCourse, StudioRelease, StudioWorkbook } from "@/lib/education-platform";
import { STUDIO_COURSE_TEMPLATES } from "@/lib/studio-templates";
import { moveStudioReleaseItem, normalizeStudioReleaseOrder, studioSelectedReleaseOrder } from "../lib/studio-release-order.ts";
import { registerStudioNavigationGuard } from "../lib/studio-navigation-guard.ts";
import { studioDraftBoundaryKey, studioDraftScopedKey, type StudioDraftScope } from "../lib/studio-draft-scope.ts";
import { parseStudioMutationContext, requiresStudioMutationContext, StudioMutationContextError, StudioUncertainSaveError, verifyStudioMutationContext } from "../lib/studio-mutation-context.ts";

async function postStudio(payload: Record<string, unknown>, expectedContext?: StudioDraftScope, isCurrent:()=>boolean=()=>true) {
  const guarded=requiresStudioMutationContext(payload.action)||expectedContext!==undefined;
  const context=guarded?parseStudioMutationContext(expectedContext):null;
  async function verify(mayHaveCommitted=false){if(guarded)try{await verifyStudioMutationContext(context);if(!isCurrent())throw new StudioMutationContextError('unavailable');}catch(error){if(error instanceof StudioMutationContextError)error.mayHaveCommitted ||= mayHaveCommitted;throw error;}}
  if(guarded)await verify();
  let response:Response;
  try{response = await fetch("/api/studio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(guarded?{...payload,expectedStudioContext:context}:payload) });}
  catch(error){if(guarded){await verify(true);throw new StudioUncertainSaveError();}throw error;}
  let body: unknown;
  try { body = await response.json(); } catch { body = null; }
  // A request may commit for A before another tab signs in as B. Compare again
  // before accepting any outcome into the mounted form, navigation or cleanup.
  if(guarded)await verify(true);
  const result = body !== null && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : null;
  if (!response.ok) {
    if(guarded&&(result?.code==='STUDIO_CONTEXT_CHANGED'||result?.code==='STUDIO_CONTEXT_UNAVAILABLE'))throw new StudioMutationContextError(result.code==='STUDIO_CONTEXT_CHANGED'?'changed':'unavailable');
    // A timeout or server failure may be returned after the write committed.
    if(guarded&&(response.status===408||response.status>=500))throw new StudioUncertainSaveError();
    const error = new Error(typeof result?.error === "string" && result.error ? result.error : "Studio could not complete this action.") as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  const idFields: Record<string, string | null> = {
    "create-course": "courseId", "update-course": "courseId", "create-course-from-template": "courseId", "duplicate-course": "courseId",
    "create-workbook": "workbookId", "duplicate-workbook": "workbookId", "create-cohort": "cohortId",
    "save-release": "releaseId", "create-invitation": "invitationCode", "assign-cohort-workbook": null,
    "submit-release": null, "review-release": null, "publish-release": null,
  };
  const action = typeof payload.action === "string" ? payload.action : "";
  const idField = idFields[action];
  const id = idField && result?.[idField];
  const validId = typeof id === "string" && id.length > 0 && id.length <= 200 && id.trim() === id && !/[\u0000-\u001f\u007f]/.test(id);
  if (!Object.hasOwn(idFields, action) || result?.ok !== true || result?.action !== action || (result !== null && Object.hasOwn(result, "error")) ||
      (idField && !validId) || (action === "update-course" && id !== payload.courseId) ||
      (action === "save-release" && payload.releaseId && id !== payload.releaseId) ||
      (action === "create-invitation" && !/^ELV-[A-F0-9]{12}$/.test(String(id)))) {
    // An uncertain response is not permission to discard a draft or retry a
    // non-idempotent creation automatically. Keep the input for reconciliation.
    throw guarded?new StudioUncertainSaveError():new Error("Studio could not confirm this save. Your input is unchanged. Check the saved item before trying again.");
  }
  return result;
}

function lockStudioDraft<T>(key:string,action:()=>T):Promise<T>{
  if(typeof navigator==='undefined'||!navigator.locks)return Promise.reject(new Error('Safe cross-tab draft storage is unavailable'));
  return navigator.locks.request(`visible-medicine:studio-draft:${key}`,action);
}

export type StudioDraftRecoveryState='none'|'recovered'|'attention';
function ActionForm({ children, onSubmit, submitLabel, draftKey, recoveryScope, reconcileHref="/studio/courses", draftRevision, onValuesChange, onDraftRecoveryChange }: { children: ReactNode; onSubmit: (form: FormData, isCurrent: () => boolean) => Promise<void>; submitLabel: string; draftKey?: string; recoveryScope?: StudioDraftScope; reconcileHref?: string; draftRevision?: string; onValuesChange?: (values: FormData, recovered?: Record<string,string|string[]>) => void; onDraftRecoveryChange?: (state:StudioDraftRecoveryState)=>void }) {
  const scopedDraftKey = draftKey ? studioDraftScopedKey(recoveryScope, draftKey) : null;
  const contextProtected = !!draftKey || recoveryScope !== undefined;
  const formRef = useRef<HTMLFormElement>(null);
  const valuesChanged = useRef(onValuesChange);
  const recoveryChanged = useRef(onDraftRecoveryChange);
  const recoveryEpoch = useRef(0);
  const revision = useRef(0);
  const submitting = useRef(false);
  const active = useRef(true);
  const contextReady=useRef(!contextProtected),contextSequence=useRef(0),contextRetired=useRef(false);
  const pendingRecovery=useRef<(()=>void)|null>(null);
  const [contextStatus,setContextStatus]=useState(contextProtected?'checking':'ready');
  const contextRetry=useRef<(()=>void)|null>(null),contextUnavailable=useRef(false),reconciliationRequired=useRef(false);
  const [reconciliationNeeded,setReconciliationNeeded]=useState(false);
  const draftStorage = useRef<{key:string|null;values:Map<string,string|null>;writable:boolean;cleanupKeys:Set<string>}>({key:scopedDraftKey,values:new Map(),writable:false,cleanupKeys:new Set()});
  // This also invalidates callbacks from an old scope before effects run.
  if (draftStorage.current.key !== scopedDraftKey) {
    draftStorage.current={key:scopedDraftKey,values:new Map(),writable:false,cleanupKeys:new Set()};
    recoveryEpoch.current++;
    revision.current++;
    contextReady.current=!contextProtected;contextSequence.current++;contextRetired.current=false;pendingRecovery.current=null;
    contextUnavailable.current=false;reconciliationRequired.current=false;contextRetry.current=null;
  }
  // Layout cleanup runs in the unmount commit. A resolved POST can otherwise
  // navigate before passive cleanup has retired the old form.
  useLayoutEffect(()=>{
    active.current=true;
    return()=>{
      active.current=false;
      contextReady.current=false;contextSequence.current++;pendingRecovery.current=null;
      contextRetry.current=null;
      recoveryEpoch.current++;
      revision.current++;
      draftStorage.current={key:null,values:new Map(),writable:false,cleanupKeys:new Set()};
    };
  },[]);
  useEffect(() => { valuesChanged.current = onValuesChange; }, [onValuesChange]);
  useEffect(() => { recoveryChanged.current = onDraftRecoveryChange; }, [onDraftRecoveryChange]);
  const [busy, setBusy] = useState(false); const [dirty, setDirty] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const [draftStored, setDraftStored] = useState(false);
  const navigationState = useRef({dirty:false,draftStored:false});
  function markDirty(value:boolean) {navigationState.current.dirty=value;setDirty(value);}
  function markDraftStored(value:boolean) {navigationState.current.draftStored=value;setDraftStored(value);}
  useLayoutEffect(() => registerStudioNavigationGuard(document, () => active.current && navigationState.current.dirty && !navigationState.current.draftStored), []);
  const [storageNotice, setStorageNotice] = useState("");
  function retireContext(){
    if(!active.current||contextRetired.current)return;
    contextRetired.current=true;contextReady.current=false;contextSequence.current++;pendingRecovery.current=null;
    // Keep mount/dirty protection alive until actual unmount. Retirement blocks
    // admission; it must not silently make DOM-only input discardable.
    recoveryEpoch.current++;revision.current++;
    draftStorage.current={key:scopedDraftKey,values:new Map(),writable:false,cleanupKeys:new Set()};
    submitting.current=false;setBusy(false);setMessage('');setError(new StudioMutationContextError().message);setContextStatus('retired');
    recoveryChanged.current?.('attention');
  }
  function holdUnavailable(mayHaveCommitted=false){
    if(!active.current||contextRetired.current)return;
    contextUnavailable.current=true;contextReady.current=false;contextSequence.current++;
    recoveryEpoch.current++;revision.current++;
    if(mayHaveCommitted){reconciliationRequired.current=true;setReconciliationNeeded(true);}
    // Retain this form's snapshot, DOM input and dirty warnings. Only a fresh
    // same-scope comparison can admit recovery/writes again; no automatic POST.
    setContextStatus('unavailable');setMessage('');setError(new StudioMutationContextError('unavailable').message);
    recoveryChanged.current?.('attention');
  }
  function acknowledgeReconciliation(){
    if(!active.current||contextRetired.current||!contextReady.current||submitting.current)return;
    if(!window.confirm('Check the saved item in Studio first. If it exists, open it instead of repeating a creation. Continue only after reconciling the previous save. This acknowledgement does not verify its outcome.'))return;
    reconciliationRequired.current=false;setReconciliationNeeded(false);setError('');setMessage('Ready for a new submission after your check.');
  }
  useEffect(() => {
    if (!contextProtected || !formRef.current) return;
    if (draftKey && !scopedDraftKey) {
      setStorageNotice("Device-local draft storage is unavailable without a complete signed-in Studio context. Keep this page open until you save to Studio.");
      recoveryChanged.current?.('attention');
      retireContext();
      return;
    }
    let disposed=false,restored=false,recoveryCleanup:(()=>void)|undefined;
    function recover(){
    const form=formRef.current;if(!form||!scopedDraftKey||!active.current||!contextReady.current)return;
    const snapshot={key:scopedDraftKey,values:new Map<string,string|null>(),writable:false,cleanupKeys:new Set<string>()};
    draftStorage.current=snapshot;
    const recoveryToken=++recoveryEpoch.current;
    recoveryChanged.current?.('none');
    try {
      const primary=`visible-medicine-studio-draft:${scopedDraftKey}`;
      snapshot.values.set(primary,localStorage.getItem(primary));
      const raw = snapshot.values.get(primary) ?? null;
      if (raw === null) {snapshot.writable=true;return;}
      const saved = JSON.parse(raw) as Record<string, string | string[]>;
      if (!saved || typeof saved !== "object" || Array.isArray(saved) || Object.values(saved).some((value) => typeof value !== "string" && !(Array.isArray(value) && value.every((item) => typeof item === "string")))) throw new Error("Invalid local draft");
    const controls=Array.from(form.elements).filter((element)=>
      (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) && !!element.name) as (HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement)[];
      const names=new Set(controls.map(element=>element.name));
      // Validate the complete retained shape before changing a live field. A
      // partial/foreign form must not be announced as recovered or overwritten.
      if(!Object.keys(saved).length||Object.keys(saved).some(name=>!names.has(name))||controls.some(element=>
        Object.hasOwn(saved,element.name)&&Array.isArray(saved[element.name])&&!(element instanceof HTMLInputElement&&element.type==='checkbox'))) throw new Error('Incompatible local draft');
      for (const element of controls) {
        if (!Object.hasOwn(saved,element.name)) continue;
        const value = saved[element.name];
        if (element instanceof HTMLInputElement && element.type === "checkbox") element.checked = Array.isArray(value) ? value.includes(element.value) : value === element.value || value === "true";
        else if (!Array.isArray(value)) element.value = value;
      }
      snapshot.writable=true;
      snapshot.cleanupKeys.add(primary);
      revision.current += 1;
      markDirty(true); markDraftStored(true);
      // Bind recovered material before another event can submit it. Deferring
      // this callback would briefly attach old text to today's server revision.
      valuesChanged.current?.(new FormData(form), saved);
      const recoveredNotice = window.setTimeout(() => {
        if(!active.current||!contextReady.current||draftStorage.current!==snapshot||recoveryEpoch.current!==recoveryToken)return;
        setMessage("Recovered an unsent device-local draft. Save it to Studio when ready.");
        recoveryChanged.current?.('recovered');
      }, 0);
      return () => window.clearTimeout(recoveredNotice);
    } catch {
      setStorageNotice("The device-local draft could not be recovered. It has not been deleted; keep any new work open until you save to Studio.");
      if(recoveryChanged.current){
        const attentionNotice=window.setTimeout(()=>{if(active.current&&contextReady.current&&draftStorage.current===snapshot&&recoveryEpoch.current===recoveryToken)recoveryChanged.current?.('attention');},0);
        return()=>window.clearTimeout(attentionNotice);
      }
    }
    }
    const probe=(explicit=false)=>{
      if(disposed||contextRetired.current||!active.current)return;
      const token=++contextSequence.current;contextReady.current=false;setContextStatus('checking');
      void verifyStudioMutationContext(recoveryScope).then(()=>{
        if(disposed||!active.current||contextRetired.current||token!==contextSequence.current)return;
        if(contextUnavailable.current&&!explicit){setContextStatus('unavailable');return;}
        if(draftKey&&!restored){restored=true;pendingRecovery.current=()=>{recoveryCleanup=recover();};}
        if(contextUnavailable.current){contextUnavailable.current=false;setError('');setMessage(reconciliationRequired.current?'The previous save may have completed. Review the saved item before allowing a new submission.':'');}
        setReconciliationNeeded(reconciliationRequired.current);
        contextReady.current=true;setContextStatus('ready');
      },error=>{if(!disposed&&active.current&&token===contextSequence.current){if(error instanceof StudioMutationContextError&&error.reason==='changed')retireContext();else holdUnavailable(submitting.current);}});
    };
    const retry=()=>probe(true),background=()=>probe(false),visible=()=>{if(document.visibilityState!=='hidden')background();};
    contextRetry.current=retry;
    background();window.addEventListener('focus',background);window.addEventListener('pageshow',background);document.addEventListener('visibilitychange',visible);
    return()=>{disposed=true;contextReady.current=false;contextSequence.current++;pendingRecovery.current=null;if(contextRetry.current===retry)contextRetry.current=null;recoveryCleanup?.();window.removeEventListener('focus',background);window.removeEventListener('pageshow',background);document.removeEventListener('visibilitychange',visible);};
  }, [contextProtected,draftKey,scopedDraftKey]);
  useEffect(()=>{
    // Run after the verified-ready fieldset has committed as enabled. FormData
    // would omit its fields if recovery ran in the verification continuation.
    if(contextStatus==='ready'&&active.current&&contextReady.current&&pendingRecovery.current){const recover=pendingRecovery.current;pendingRecovery.current=null;recover();}
  },[contextStatus,scopedDraftKey]);
  useEffect(()=>{
    if(!scopedDraftKey)return;
    const changed=(event:StorageEvent)=>{
      if(!active.current||contextRetired.current||event.storageArea!==localStorage||event.key!==null&&!draftStorage.current.values.has(event.key))return;
      markDraftStored(false);
      setStorageNotice('This device-local draft changed in another tab. Your input here is unchanged; keep it open and save to Studio before leaving. Another tab’s draft will not be replaced automatically.');
    };
    window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);
  },[scopedDraftKey]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { if (!active.current) return; event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const previousDraftRevision = useRef({key:scopedDraftKey,value:draftRevision});
  // A reorder button changes DOM order rather than an input value. Snapshot only
  // after React commits it, so FormData and recovery keep the visible sequence.
  useEffect(() => {
    const previous=previousDraftRevision.current;
    previousDraftRevision.current={key:scopedDraftKey,value:draftRevision};
    if(previous.key===scopedDraftKey&&previous.value!==draftRevision)preserveDraft();
  }, [scopedDraftKey,draftRevision]);
  function preserveDraft() {
    if(!active.current||contextRetired.current||contextProtected&&!contextReady.current)return;
    revision.current += 1;
    const editingRevision=revision.current,snapshot=draftStorage.current;
    markDirty(true);
    setMessage("");
    if (formRef.current) valuesChanged.current?.(new FormData(formRef.current));
    if (!scopedDraftKey || !formRef.current) return;
    const values: Record<string, string | string[]> = {};
    const form = new FormData(formRef.current);
    for (const key of new Set([...form.keys()])) { const entries = form.getAll(key).map(String); values[key] = entries.length > 1 ? entries : entries[0] ?? ""; }
    for (const checkbox of Array.from(formRef.current.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))) if (!checkbox.checked && !(checkbox.name in values)) values[checkbox.name] = "false";
    markDraftStored(false);
    void lockStudioDraft(scopedDraftKey,()=>{
      if(!active.current||!contextReady.current||revision.current!==editingRevision||draftStorage.current!==snapshot)return;
      if(!snapshot.writable){
        markDraftStored(false);setStorageNotice('An existing device-local draft could not be safely recovered and has been kept. Your current input is only in this open form; save it to Studio before leaving.');return;
      }
      const key=`visible-medicine-studio-draft:${scopedDraftKey}`,current=localStorage.getItem(key);
      if(snapshot.key!==scopedDraftKey||current!==null&&(!snapshot.values.has(key)||current!==snapshot.values.get(key))||current===null&&snapshot.values.get(key)!=null){
        markDraftStored(false);setStorageNotice('This device-local draft changed in another tab. Your input here is unchanged; keep it open and save to Studio before leaving. Another tab’s draft will not be replaced automatically.');return;
      }
      const raw=JSON.stringify(values);localStorage.setItem(key,raw);
      if(localStorage.getItem(key)!==raw)throw new Error('Draft storage did not retain the current input');
      snapshot.values.set(key,raw);
      snapshot.cleanupKeys.add(key);
      markDraftStored(true); setStorageNotice("");
    }).catch(()=>{
      if(revision.current!==editingRevision||draftStorage.current!==snapshot)return;
      markDraftStored(false);
      setStorageNotice("Device-local draft storage is unavailable. Your current input is still here; save to Studio before leaving this page.");
    });
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current||!active.current||contextRetired.current||reconciliationRequired.current||contextProtected&&(!contextReady.current||pendingRecovery.current!==null)) return;
    const submitted = new FormData(event.currentTarget), submittedRevision = revision.current;
    const submittedContextSequence=contextSequence.current;
    // Keep this session's snapshot object: a queued same-revision draft write
    // may finish before cleanup acquires the lock. Other tabs never update it.
    const submittedStorage=draftStorage.current;
    submitting.current = true; setBusy(true); setMessage(""); setError("");
    const isCurrent=()=>active.current&&!contextRetired.current&&draftStorage.current===submittedStorage&&(!contextProtected||contextReady.current)&&contextSequence.current===submittedContextSequence;
    const finishPending=()=>{if(active.current&&draftStorage.current===submittedStorage){submitting.current=false;setBusy(false);}};
    try { await onSubmit(submitted, isCurrent); }
    catch (caught) {
      if(!active.current||draftStorage.current!==submittedStorage)return;
      if(caught instanceof StudioMutationContextError){finishPending();if(caught.reason==='changed')retireContext();else holdUnavailable(caught.mayHaveCommitted);return;}
      if(!isCurrent()){finishPending();return;}
      if(caught instanceof StudioUncertainSaveError){reconciliationRequired.current=true;setReconciliationNeeded(true);}
      setError(caught instanceof Error ? caught.message : "Studio could not complete this action.");
      submitting.current = false; setBusy(false); return;
    }
    if(!isCurrent()){finishPending();return;}
    if (revision.current === submittedRevision) {
      let cleanupFailed = false,conflictingDraft=false;
      if (scopedDraftKey) try {await lockStudioDraft(scopedDraftKey,()=>{
        // Successful create actions may already have navigated away. Cleanup
        // may still retire their captured bytes, but must not update a new form.
        if(!isCurrent()||revision.current!==submittedRevision)return;
        for (const prefix of ["visible-medicine"]) {
          try {
          const key=`${prefix}-studio-draft:${scopedDraftKey}`,current=localStorage.getItem(key);
          if(current===null){submittedStorage.values.set(key,null);continue;}
          if(!submittedStorage.cleanupKeys.has(key)||!submittedStorage.values.has(key)||current!==submittedStorage.values.get(key)){conflictingDraft=true;continue;}
          localStorage.removeItem(key);submittedStorage.values.set(key,null);
          } catch { cleanupFailed = true; }
        }
      });}catch{cleanupFailed=true;}
      if(draftStorage.current!==submittedStorage)return;
      if(!isCurrent()){finishPending();return;}
      if(revision.current===submittedRevision){
        markDirty(false); markDraftStored(false);
        recoveryEpoch.current++;
        recoveryChanged.current?.(conflictingDraft||cleanupFailed?'attention':'none');
        setStorageNotice(conflictingDraft ? 'Saved to Studio. A different device-local draft was kept because it could not be safely compared. Check its source and the saved Studio version before submitting again.' : cleanupFailed ? "Saved to Studio, but the old device-local draft could not be cleared and may reappear after a reload. Do not submit it again without checking the saved version." : "");
        setMessage("Saved successfully.");
      }else {
        // The accepted save may have advanced hidden comparison fields. Carry
        // those into a newer queued draft without clearing its unsent edits.
        preserveDraft();
        setMessage("The submitted version was saved. Newer changes are still unsent; save again when ready.");
      }
    } else {
      if(draftStorage.current!==submittedStorage)return;
      preserveDraft();
      setMessage("The submitted version was saved. Newer changes are still unsent; save again when ready.");
    }
    submitting.current = false; setBusy(false);
  }
  return <form className="studio-form" ref={formRef} onChange={preserveDraft} onSubmit={submit}>
    <fieldset className="studio-form-fields" disabled={busy||contextStatus!=='ready'} hidden={contextStatus==='checking'||contextStatus==='retired'}>{children}</fieldset>
    {contextStatus==='checking'&&<p role="status">Checking this page’s signed-in Studio context…</p>}
    {draftKey&&<small className="draft-safety">{dirty?(draftStored?"Unsubmitted changes saved on this device only.":"Unsubmitted changes are not saved on this device. Keep this page open until you save to Studio."):"No unsaved changes."}</small>}
    {storageNotice&&<p className="studio-form-message" role="status">{storageNotice}</p>}
    {(message||error)&&<p className={`studio-form-message ${error?"error":""}`} role={error?"alert":"status"}>{error||message}</p>}
    {contextStatus==='unavailable'&&<button type="button" onClick={()=>contextRetry.current?.()}>Retry context check</button>}
    {reconciliationNeeded&&contextStatus!=='retired'&&<div role="group" aria-label="Reconcile uncertain save">
      <p>The previous save may have completed. Revalidating this page does not confirm its outcome.</p>
      <a href={reconcileHref} target="_blank" rel="noopener noreferrer">Review saved items</a>
      <button type="button" disabled={busy||contextStatus!=='ready'} onClick={acknowledgeReconciliation}>I checked the saved item</button>
    </div>}
    {contextStatus==='retired'?<button type="button" onClick={()=>window.location.reload()}>Reload Studio</button>:<button disabled={busy||contextStatus!=='ready'||reconciliationNeeded}>{busy?"Working…":submitLabel}</button>}
  </form>;
}

export function CreateCourseForm({ recoveryScope }: { recoveryScope: StudioDraftScope }) {
  const router = useRouter();
  return <ActionForm key={studioDraftBoundaryKey(recoveryScope,"new-course")} recoveryScope={recoveryScope} draftKey="new-course" submitLabel="Create course and add content" onSubmit={async (form, isCurrent) => { const result = await postStudio({ action: "create-course", title: form.get("title"), code: form.get("code"), description: form.get("description") }, recoveryScope, isCurrent); if (!isCurrent()) return; router.push(`/studio/courses/${encodeURIComponent(String(result.courseId))}`); router.refresh(); }}><label><span>Course title</span><input name="title" required /></label><label><span>Short description</span><textarea name="description" required minLength={20} /><small>At least 20 characters describing what learners will learn.</small></label><details><summary>Optional course code</summary><label><span>Course code</span><input name="code" placeholder="Generated automatically if left blank" /></label></details></ActionForm>;
}

export function EditCourseDetailsForm({ course, recoveryScope, onDraftRecoveryChange }: { course: StudioCourse; recoveryScope: StudioDraftScope; onDraftRecoveryChange?: (state:StudioDraftRecoveryState)=>void }) {
  const router = useRouter();
  // Props can refresh while a recovered draft is open. Keep the original
  // comparison defaults stable so React cannot replace a recovered baseline.
  const [baseline, setBaseline] = useState(() => ({ title: course.title, description: course.description }));
  const [details, setDetails] = useState(() => ({ title: course.title, description: course.description }));
  const [rebaseRevision, setRebaseRevision] = useState(0);
  const expectedTitle = useRef<HTMLInputElement>(null);
  const expectedDescription = useRef<HTMLInputElement>(null);
  const savedDetailsChanged = course.title !== baseline.title || course.description !== baseline.description;
  return <ActionForm key={studioDraftBoundaryKey(recoveryScope,`course-details:${course.id}`)} recoveryScope={recoveryScope} draftKey={`course-details:${course.id}`} draftRevision={String(rebaseRevision)} submitLabel="Save course details" onDraftRecoveryChange={onDraftRecoveryChange} onValuesChange={(_form, recovered) => {
    if (typeof recovered?.expectedTitle === "string" && typeof recovered.expectedDescription === "string") {
      setBaseline({ title: recovered.expectedTitle, description: recovered.expectedDescription });
    }
    if (typeof recovered?.title === "string" && typeof recovered.description === "string") {
      setDetails({ title: recovered.title, description: recovered.description });
    }
  }} onSubmit={async (form, isCurrent) => {
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    try {
      await postStudio({ action: "update-course", courseId: course.id, title, description,
        expectedTitle: form.get("expectedTitle"), expectedDescription: form.get("expectedDescription") }, recoveryScope, isCurrent);
    } catch (error) {
      if (isCurrent() && (error as Error & { status?: number }).status === 409) router.refresh();
      throw error;
    }
    // Advance the comparison only after Studio accepted this exact edit. The
    // inputs remain part of future device-local drafts and subsequent saves.
    if (!isCurrent()) return;
    if (expectedTitle.current) expectedTitle.current.value = title;
    if (expectedDescription.current) expectedDescription.current.value = description;
    setBaseline({ title, description });
    setDetails({ title, description });
    router.refresh();
  }}>
    <input ref={expectedTitle} type="hidden" name="expectedTitle" defaultValue={baseline.title} />
    <input ref={expectedDescription} type="hidden" name="expectedDescription" defaultValue={baseline.description} />
    <label><span>Course title</span><input name="title" defaultValue={details.title} required minLength={4} maxLength={160} /></label>
    <label><span>Short description</span><textarea name="description" defaultValue={details.description} required minLength={20} maxLength={1200} /></label>
    {savedDetailsChanged && <div role="group" aria-label="Compare saved course details"><p>Studio now has different saved course details. Your draft remains in the fields above.</p><p><strong>Saved title:</strong> {course.title}</p><p><strong>Saved description:</strong> {course.description}</p><button type="button" onClick={() => {
      if (!window.confirm("Use these currently saved course details as the comparison for your draft? Your draft text will stay in place. The next save will apply it to this version.")) return;
      if (expectedTitle.current) expectedTitle.current.value = course.title;
      if (expectedDescription.current) expectedDescription.current.value = course.description;
      setBaseline({ title: course.title, description: course.description });
      setRebaseRevision(value => value + 1);
    }}>Keep my edits using this saved version</button></div>}
    <p className="form-help">Course details only; release snapshots unchanged.</p>
  </ActionForm>;
}

export function CreateCourseFromTemplateForm({ recoveryScope }: { recoveryScope: StudioDraftScope }) {
  const router = useRouter();
  return <ActionForm key={studioDraftBoundaryKey(recoveryScope,"new-course-template")} recoveryScope={recoveryScope} submitLabel="Create templated course" draftKey="new-course-template" onSubmit={async (form, isCurrent) => { const result = await postStudio({ action: "create-course-from-template", templateId: form.get("templateId"), title: form.get("title"), code: form.get("code"), description: form.get("description") }, recoveryScope, isCurrent); if (!isCurrent()) return; router.push(`/studio/courses/${encodeURIComponent(String(result.courseId))}`); router.refresh(); }}>
    <label><span>Teaching pattern</span><select name="templateId">{STUDIO_COURSE_TEMPLATES.map((template) => <option value={template.id} key={template.id}>{template.name}</option>)}</select></label>
    <div className="two-fields"><label><span>Course title</span><input name="title" required /></label><label><span>Course code</span><input name="code" placeholder="RAD-101" /></label></div>
    <label><span>Educational description</span><textarea name="description" required minLength={20} /></label>
    <p className="form-help">Templates create empty workbook shells only. Cases, media and learner records are never copied automatically.</p>
  </ActionForm>;
}

function useStudioDuplicate(sourceId: string, action: "duplicate-course" | "duplicate-workbook", recoveryScope: StudioDraftScope) {
  const router = useRouter();
  const [, repaint] = useState(0), [error, setError] = useState("");
  const scopeKey = JSON.stringify([recoveryScope?.actorId, recoveryScope?.organizationId]);
  const current = useRef({sourceId, scopeKey});
  const lifecycle = useRef({epoch: 0, mounted: true, setup: false});
  const pending = useRef<{visit: object} | null>(null), completed = useRef<object | null>(null), feedback = useRef<object | null>(null);
  const status = useRef<'checking'|'ready'|'unavailable'|'retired'>('checking');
  const reconciliation = useRef(false), probeSequence = useRef(0);
  if (current.current.sourceId !== sourceId || current.current.scopeKey !== scopeKey) {
    if (current.current.scopeKey !== scopeKey) status.current = 'retired';
    else if (status.current !== 'retired') status.current = 'checking';
    current.current = {sourceId, scopeKey};
    probeSequence.current++;
    pending.current = null;
    completed.current = null;
    reconciliation.current = false;
  }
  const visit = current.current, epoch = lifecycle.current.epoch;
  const isCurrent = () => current.current === visit && lifecycle.current.mounted && lifecycle.current.epoch === epoch;
  const live = () => isCurrent() && status.current !== 'retired';
  function retire() {
    if (!live()) return;
    status.current = 'retired'; probeSequence.current++; pending.current = null;
    feedback.current = visit; setError(new StudioMutationContextError().message); repaint(value => value + 1);
  }
  function unavailable(mayHaveCommitted = false) {
    if (!live()) return;
    status.current = 'unavailable'; probeSequence.current++;
    if (mayHaveCommitted) reconciliation.current = true;
    feedback.current = visit; setError(new StudioMutationContextError('unavailable').message); repaint(value => value + 1);
  }
  function check(explicit = false) {
    if (!live() || status.current === 'unavailable' && !explicit) return;
    const token = ++probeSequence.current;
    status.current = 'checking'; repaint(value => value + 1);
    void verifyStudioMutationContext(recoveryScope).then(() => {
      if (!live() || token !== probeSequence.current) return;
      status.current = 'ready';
      feedback.current = visit;
      setError(reconciliation.current ? 'The previous duplication may have completed. Review saved items before allowing another request.' : '');
      repaint(value => value + 1);
    }, caught => {
      if (!live() || token !== probeSequence.current) return;
      if (caught instanceof StudioMutationContextError && caught.reason === 'changed') retire();
      else unavailable(!!pending.current);
    });
  }
  useLayoutEffect(() => {
    if (lifecycle.current.setup) repaint(value => value + 1);
    lifecycle.current.setup = true;
    lifecycle.current.mounted = true;
    return () => { lifecycle.current.mounted = false; lifecycle.current.epoch++; probeSequence.current++; };
  }, []);
  useEffect(() => {
    check();
    const background = () => check();
    const visible = () => { if (document.visibilityState !== 'hidden') check(); };
    window.addEventListener('focus', background); window.addEventListener('pageshow', background); document.addEventListener('visibilitychange', visible);
    return () => {
      probeSequence.current++;
      window.removeEventListener('focus', background); window.removeEventListener('pageshow', background); document.removeEventListener('visibilitychange', visible);
    };
  }, [sourceId, scopeKey, epoch]);
  async function duplicate() {
    if (!live() || status.current !== 'ready' || reconciliation.current || pending.current || completed.current === visit) return;
    const request = {visit};
    pending.current = request; feedback.current = visit; repaint(value => value + 1); setError("");
    try {
      const key = action === "duplicate-course" ? "courseId" : "workbookId";
      const result = await postStudio({action, [key]: sourceId}, recoveryScope, () => live() && status.current === 'ready');
      if (!live() || status.current !== 'ready') return;
      completed.current = visit;
      router.push(`/studio/${action === "duplicate-course" ? "courses" : "workbooks"}/${encodeURIComponent(String(result[key]))}`); router.refresh();
    } catch (caught) {
      if (!live()) return;
      if (caught instanceof StudioMutationContextError) {
        if (caught.reason === 'changed') retire(); else unavailable(caught.mayHaveCommitted);
      } else {
        if (caught instanceof StudioUncertainSaveError) reconciliation.current = true;
        feedback.current = visit; setError(caught instanceof Error ? caught.message : "The structure could not be duplicated.");
      }
    } finally {
      if (pending.current === request) {
        pending.current = null;
        if (live()) repaint(value => value + 1);
      }
    }
  }
  function acknowledge() {
    if (!live() || status.current !== 'ready' || !reconciliation.current || pending.current) return;
    if (!window.confirm('Check the saved item in Studio first. If the copy exists, open it instead of repeating duplication. Continue only after reconciling the previous request. This acknowledgement does not verify its outcome.')) return;
    reconciliation.current = false; setError(''); repaint(value => value + 1);
  }
  return {duplicate, check: () => check(true), acknowledge, status: status.current, reconcile: reconciliation.current,
    busy: pending.current?.visit === visit, completed: completed.current === visit, error: feedback.current === visit ? error : ""};
}

export function DuplicateCourseButton({ courseId, recoveryScope }: { courseId: string; recoveryScope: StudioDraftScope }) {
  const {duplicate, check, acknowledge, status, reconcile, busy, completed, error} = useStudioDuplicate(courseId, "duplicate-course", recoveryScope);
  return <div className="inline-action"><button disabled={busy || completed || status !== 'ready' || reconcile} onClick={() => void duplicate()}>{completed ? "Opening copy…" : busy ? "Duplicating…" : "Duplicate course structure"}</button>{status === 'checking' && <p role="status">Checking this page’s signed-in Studio context…</p>}{error && <p role="alert">{error}</p>}{status === 'unavailable' && <button type="button" onClick={check}>Retry context check</button>}{status === 'retired' && <button type="button" onClick={() => window.location.reload()}>Reload Studio</button>}{reconcile && status !== 'retired' && <div role="group" aria-label="Reconcile uncertain duplication"><p>The duplication may have completed. A context check does not confirm its outcome.</p><a href="/studio/courses" target="_blank" rel="noopener noreferrer">Review saved items</a><button type="button" disabled={status !== 'ready' || busy} onClick={acknowledge}>I checked the saved item</button></div>}</div>;
}

export function DuplicateWorkbookButton({ workbookId, recoveryScope }: { workbookId: string; recoveryScope: StudioDraftScope }) {
  const {duplicate, check, acknowledge, status, reconcile, busy, completed, error} = useStudioDuplicate(workbookId, "duplicate-workbook", recoveryScope);
  return <div className="inline-action"><button disabled={busy || completed || status !== 'ready' || reconcile} title="Copies the workbook structure without learner attempts or publication history" onClick={() => void duplicate()}>{completed ? "Opening copy…" : busy ? "Duplicating…" : "Duplicate structure only"}</button>{status === 'checking' && <p role="status">Checking this page’s signed-in Studio context…</p>}{error && <p role="alert">{error}</p>}{status === 'unavailable' && <button type="button" onClick={check}>Retry context check</button>}{status === 'retired' && <button type="button" onClick={() => window.location.reload()}>Reload Studio</button>}{reconcile && status !== 'retired' && <div role="group" aria-label="Reconcile uncertain duplication"><p>The duplication may have completed. A context check does not confirm its outcome.</p><a href="/studio/courses" target="_blank" rel="noopener noreferrer">Review saved items</a><button type="button" disabled={status !== 'ready' || busy} onClick={acknowledge}>I checked the saved item</button></div>}</div>;
}

export function CreateWorkbookForm({ course, recoveryScope }: { course: StudioCourse; recoveryScope: StudioDraftScope }) {
  const router = useRouter();
  const [mode, setMode] = useState("teaching");
  return <ActionForm key={studioDraftBoundaryKey(recoveryScope,`new-workbook:${course.id}`)} recoveryScope={recoveryScope} draftKey={`new-workbook:${course.id}`} onValuesChange={(form) => setMode(String(form.get("mode") ?? "teaching"))} submitLabel="Add and open editor" onSubmit={async (form, isCurrent) => { const result = await postStudio({ action: "create-workbook", courseId: course.id, title: form.get("title"), mode: form.get("mode"), durationMinutes: Number(form.get("durationMinutes")) }, recoveryScope, isCurrent); if (!isCurrent()) return; router.push(`/studio/workbooks/${encodeURIComponent(String(result.workbookId))}/builder`); router.refresh(); }}><label><span>Content title</span><input name="title" required /></label><label><span>Content type</span><select name="mode"><option value="teaching">Imaging teaching — cases, slides and Atlas references</option><option value="lecture">Lecture / presentation — no imaging case required</option><option value="assessment">Case-based quiz / exam</option></select></label><label hidden={mode !== "assessment"}><span>Assessment duration (minutes)</span><input name="durationMinutes" type="number" min="10" max="480" defaultValue="60" disabled={mode !== "assessment"} required={mode === "assessment"} /></label><p className="form-help">{mode === "lecture" ? "Creates a private lecture draft. Add your slides in the editor; no placeholder case is needed." : "Creates a private draft. Add cleared cases and content in the editor."}</p></ActionForm>;
}

export function ReleaseDraftForm({ course, workbooks, release, recoveryScope }: { course: StudioCourse; workbooks: StudioWorkbook[]; release?: StudioRelease; recoveryScope: StudioDraftScope }) {
  const router = useRouter();
  // A refreshed RSC prop is not the version that produced these open fields.
  // Persist the comparison with device-local input, never silently rebase it.
  const [baseline, setBaseline] = useState(() => ({courseId: course.id, releaseId: release?.id ?? "", version: release ? String(release.version) : "new"}));
  const draftKey = useRef(`release:${release?.id ?? course.id}`).current;
  const expectedCourseId = useRef<HTMLInputElement>(null), expectedReleaseId = useRef<HTMLInputElement>(null), expectedVersion = useRef<HTMLInputElement>(null);
  const [rebaseRevision, setRebaseRevision] = useState(0);
  function bind(next: typeof baseline) {
    if (expectedCourseId.current) expectedCourseId.current.value = next.courseId;
    if (expectedReleaseId.current) expectedReleaseId.current.value = next.releaseId;
    if (expectedVersion.current) expectedVersion.current.value = next.version;
    setBaseline(next);
  }
  const matchingIdentity = baseline.courseId === course.id && baseline.releaseId === (release?.id ?? "");
  const editable = !release || ["draft", "changes-requested"].includes(release.status);
  const validVersion = baseline.releaseId ? /^[1-9]\d*$/.test(baseline.version) && Number.isSafeInteger(Number(baseline.version)) : baseline.version === "new";
  const savedDraftChanged = !matchingIdentity || !validVersion || (release ? baseline.version !== String(release.version) : baseline.version !== "new") || !editable;
  const canRebase = matchingIdentity && editable && (release
    ? Number.isSafeInteger(release.version) && release.version > 0 && (!validVersion || release.version >= Number(baseline.version))
    : !validVersion);
  const [access, setAccess] = useState(release?.accessModel ?? "invitation");
  const [outcomesError, setOutcomesError] = useState("");
  const [outcomesFocusAttempt, setOutcomesFocusAttempt] = useState(0);
  const outcomesRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!outcomesError || outcomesFocusAttempt === 0) return;
    let frame: number;
    let attempts = 0;
    const focusWhenEnabled = () => {
      const field = outcomesRef.current;
      if (field && !field.matches(":disabled")) { field.focus(); return; }
      if (++attempts < 8) frame = window.requestAnimationFrame(focusWhenEnabled);
    };
    frame = window.requestAnimationFrame(focusWhenEnabled);
    return () => window.cancelAnimationFrame(frame);
  }, [outcomesError, outcomesFocusAttempt]);
  const availableIds=workbooks.map(workbook=>workbook.id);
  const [selectedIds,setSelectedIds]=useState(studioSelectedReleaseOrder(release?.workbookIds??[],availableIds));
  const orderedIds=normalizeStudioReleaseOrder(availableIds,selectedIds);
  return <ActionForm key={studioDraftBoundaryKey(recoveryScope,draftKey)} recoveryScope={recoveryScope} draftKey={draftKey} draftRevision={JSON.stringify([selectedIds,rebaseRevision])} onValuesChange={(form,recovered) => {
    if (recovered) {
      // Older local drafts have no trustworthy version. Keep their contents,
      // but require comparison rather than assuming the current server version.
      bind({courseId: typeof recovered.expectedCourseId === "string" ? recovered.expectedCourseId : course.id,
        releaseId: typeof recovered.expectedReleaseId === "string" ? recovered.expectedReleaseId : release?.id ?? "",
        version: typeof recovered.expectedVersion === "string" ? recovered.expectedVersion : ""});
    }
    setAccess(String(form.get("accessModel") ?? "invitation"));
    const restored=recovered?.workbookIds;
    const requested=restored===undefined?form.getAll('workbookIds').map(String):Array.isArray(restored)?restored:[restored];
    const next=studioSelectedReleaseOrder(requested,availableIds);
    setSelectedIds(previous=>previous.length===next.length&&previous.every((id,index)=>id===next[index])?previous:next);
  }} submitLabel={release ? "Save release draft" : "Create release draft"} onSubmit={async (form, isCurrent) => {
    const courseId = form.get("expectedCourseId"), releaseId = form.get("expectedReleaseId"), version = form.get("expectedVersion");
    const valid = typeof version === "string" && (releaseId ? /^[1-9]\d*$/.test(version) && Number.isSafeInteger(Number(version)) : version === "new");
    if (courseId !== course.id || typeof releaseId !== "string" || releaseId !== (release?.id ?? "") || !valid || !editable) throw new Error("Compare this draft with the saved release before saving. Your input has been kept.");
    const lines = String(form.get("outcomes") ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const outcomes = [...new Set(lines)];
    const outcomesValidationError = outcomes.length < 2 ? "Add at least two distinct learning outcomes, one per line."
      : lines.some((line) => line.length > 180) ? "Keep each learning outcome within 180 characters."
      : outcomes.length > 8 ? "Use no more than eight distinct learning outcomes." : "";
    if (outcomesValidationError) {
      const error = outcomesValidationError;
      setOutcomesError(error);
      setOutcomesFocusAttempt((attempt) => attempt + 1);
      throw new Error(error);
    }
    setOutcomesError("");
    try {
      const result = await postStudio({ action: "save-release", releaseId: releaseId || undefined, expectedVersion: releaseId ? Number(version) : undefined, courseId: course.id, title: form.get("title"), slug: form.get("slug"), summary: form.get("summary"), level: form.get("level"), duration: form.get("duration"), outcomes, publisherName: form.get("publisherName"), publisherKind: form.get("publisherKind"), visibility: form.get("visibility"), accessModel: form.get("accessModel"), priceMinor: Math.round(Number(form.get("price")) * 100), currency: form.get("currency"), enrolmentOpen: form.get("enrolmentOpen") === "on", workbookIds: form.getAll("workbookIds") }, recoveryScope, isCurrent);
      if (!isCurrent()) return;
      bind({courseId: course.id, releaseId: releaseId || String(result.releaseId), version: releaseId ? String(Number(version) + 1) : "1"});
    } catch (error) {
      if (isCurrent() && (error as Error & {status?: number}).status === 409) router.refresh();
      throw error;
    }
    if (isCurrent()) router.refresh(); }}>
    <input ref={expectedCourseId} type="hidden" name="expectedCourseId" defaultValue={baseline.courseId} />
    <input ref={expectedReleaseId} type="hidden" name="expectedReleaseId" defaultValue={baseline.releaseId} />
    <input ref={expectedVersion} type="hidden" name="expectedVersion" defaultValue={baseline.version} />
    {savedDraftChanged && <div role="group" aria-label="Compare saved release draft"><p role="status">The saved release or its editing context has changed. Your draft remains below; compare before saving.</p>
      {matchingIdentity && release ? <details><summary>Compare with saved version {release.version}</summary><dl>
        <dt>Title / address</dt><dd>{release.title} · {release.slug}</dd><dt>Summary</dt><dd>{release.summary}</dd>
        <dt>Level / duration</dt><dd>{release.level} · {release.duration}</dd><dt>Learning outcomes</dt><dd><ol>{release.outcomes.map((outcome,index)=><li key={index}>{outcome}</li>)}</ol></dd>
        <dt>Content in learner order</dt><dd><ol>{release.workbookIds.map(id=><li key={id}>{workbooks.find(item=>item.id===id)?.title ?? id}</li>)}</ol></dd>
        <dt>Publisher / label</dt><dd>{release.publisher} · {release.publisherKind}</dd><dt>Visibility / access</dt><dd>{release.visibility} · {release.accessModel}</dd>
        <dt>Price / currency</dt><dd>{release.priceMinor / 100} {release.currency}</dd><dt>Enrolment / status</dt><dd>{release.enrolmentOpen ? "Open" : "Closed"} · {release.status}</dd>
      </dl></details> : matchingIdentity && !release ? <p>No release is saved in this context. Compare the course title ({course.title}) and description ({course.description}) with your draft before creating a new private release.</p> : <p>This draft belongs to a different or unavailable release context. Copy any edits you need before reopening the correct release.</p>}
      {canRebase && <button type="button" onClick={() => {
        if (!window.confirm(release ? `Use saved release version ${release.version} as the comparison for your draft? Keep your edits; your next save will replace this version's editable fields and content order.` : "Keep this recovered draft and create a new private release for this course? This will not publish it.")) return;
        bind({courseId: course.id, releaseId: release?.id ?? "", version: release ? String(release.version) : "new"});
        setRebaseRevision(value=>value+1);
      }}>Keep my edits using this saved version</button>}
    </div>}
    <label><span>Catalogue title</span><input name="title" defaultValue={release?.title ?? course.title} required /></label><details><summary>Page address</summary><label><span>URL slug</span><input name="slug" defaultValue={release?.slug ?? (course.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "course")} required /></label></details>
    <label><span>Course summary</span><textarea name="summary" defaultValue={release?.summary ?? course.description} minLength={30} required /></label>
    <div className="two-fields"><label><span>Level</span><input name="level" defaultValue={release?.level ?? "Intermediate"} /></label><label><span>Duration</span><input name="duration" defaultValue={release?.duration ?? "Self-paced"} /></label></div>
    <label><span>Learning outcomes · one per line</span><textarea ref={outcomesRef} name="outcomes" defaultValue={release?.outcomes.join("\n") ?? ""} required aria-invalid={outcomesError ? true : undefined} aria-describedby={outcomesError ? "release-outcomes-help release-outcomes-error" : "release-outcomes-help"} onChange={() => setOutcomesError("")} /><small id="release-outcomes-help">Add 2–8 distinct outcomes, up to 180 characters each.</small>{outcomesError && <small id="release-outcomes-error" role="alert">{outcomesError}</small>}</label>
    <fieldset><legend>Release content &amp; learner order</legend><p>Select content, then move selected items into the order learners should follow. Saving a draft does not publish it.</p>
      <p role="status">{selectedIds.length?`${selectedIds.length} selected · learner order shown below.`:'No content selected. You can save an empty draft, but select content before submitting for review.'}</p>
      {orderedIds.map(id=>{const workbook=workbooks.find(item=>item.id===id)!;const position=selectedIds.indexOf(id);return <div key={id}>
        <label className="studio-check"><input type="checkbox" name="workbookIds" value={id} checked={position!==-1} onChange={()=>{}} /><span><b>{position!==-1?`${position+1}. `:''}{workbook.title}</b>{workbook.mode === "lecture" ? "Lecture / presentation" : `${workbook.mode} · ${workbook.caseCount} cases`} · {workbook.status}</span></label>
        {position!==-1&&<div role="group" aria-label={`Order ${workbook.title}`}><button type="button" aria-label={`Move ${workbook.title} up`} disabled={position===0} onClick={()=>setSelectedIds(previous=>moveStudioReleaseItem(previous,id,'up'))}>Move up</button><button type="button" aria-label={`Move ${workbook.title} down`} disabled={position===selectedIds.length-1} onClick={()=>setSelectedIds(previous=>moveStudioReleaseItem(previous,id,'down'))}>Move down</button></div>}
      </div>;})}
    </fieldset>
    <div className="three-fields"><label><span>Publisher</span><input name="publisherName" defaultValue={release?.publisher ?? ""} placeholder="Institution name" /></label><label><span>Publisher label</span><select name="publisherKind" defaultValue={release?.publisherKind ?? "institution"}><option value="institution">Institution</option><option value="official">Visible Medicine official</option></select></label><label><span>Visibility</span><select name="visibility" defaultValue={release?.visibility ?? "private"}><option value="private">Private</option><option value="unlisted">Unlisted</option><option value="public">Public catalogue</option></select></label></div>
    <label><span>Access</span><select name="accessModel" defaultValue={release?.accessModel ?? "invitation"}><option value="free">Free self-enrolment</option><option value="invitation">Invitation</option><option value="institution">Institution membership</option><option value="paid">Paid</option></select></label><div className="two-fields" hidden={access !== "paid"}><label><span>Price</span><input name="price" type="number" min="0" step="0.01" defaultValue={(release?.priceMinor ?? 0) / 100} disabled={access !== "paid"} /></label><label><span>Currency</span><input name="currency" maxLength={3} defaultValue={release?.currency ?? "GBP"} disabled={access !== "paid"} /></label></div>
    <label className="studio-check"><input name="enrolmentOpen" type="checkbox" defaultChecked={release?.enrolmentOpen ?? true} /><span><b>Open enrolment</b>Allow the configured access route once this release is published.</span></label>
  </ActionForm>;
}

export function ReleaseWorkflowActions({ release, canPublish, recoveryScope }: { release: StudioRelease; canPublish: boolean; recoveryScope: StudioDraftScope }) {
  const { materialRevision, approvalCurrent } = release;
  const router = useRouter();
  const [, setBusy] = useState(false), [message, setMessage] = useState(""), [error, setError] = useState("");
  const [notes, setNotes] = useState(""), [decision, setDecision] = useState("approved");
  const [notesBinding, setNotesBinding] = useState<object | null>(null);
  const [notesGeneration, setNotesGeneration] = useState(0);
  const [, setLifecycleRender] = useState(0);
  const scopeKey = JSON.stringify([recoveryScope?.actorId, recoveryScope?.organizationId]);
  const binding = JSON.stringify([release.id, release.version, release.status, materialRevision, canPublish, approvalCurrent]);
  const current = useRef({binding, scopeKey});
  const lifecycle = useRef({epoch: 0, mounted: true, setup: false});
  const pending = useRef<{visit: object} | null>(null), completed = useRef<object | null>(null);
  const feedback = useRef<object | null>(null);
  const status = useRef<'checking'|'ready'|'unavailable'|'retired'>('checking');
  const reconciliation = useRef(false), probeSequence = useRef(0);
  if (current.current.binding !== binding || current.current.scopeKey !== scopeKey) {
    if (current.current.scopeKey !== scopeKey) status.current = 'retired';
    else if (status.current !== 'retired') status.current = 'checking';
    current.current = {binding, scopeKey};
    probeSequence.current++;
    pending.current = null;
    completed.current = null;
    reconciliation.current = false;
  }
  const visit = current.current;
  const renderEpoch = lifecycle.current.epoch;
  const isCurrent = () => current.current === visit && lifecycle.current.mounted && lifecycle.current.epoch === renderEpoch;
  const live = () => isCurrent() && status.current !== 'retired';
  function retire() {
    if (!live()) return;
    status.current = 'retired'; probeSequence.current++; pending.current = null;
    feedback.current = visit; setError(new StudioMutationContextError().message);
    setLifecycleRender(value => value + 1);
  }
  function unavailable(mayHaveCommitted = false) {
    if (!live()) return;
    status.current = 'unavailable'; probeSequence.current++;
    if (mayHaveCommitted) reconciliation.current = true;
    feedback.current = visit; setError(new StudioMutationContextError('unavailable').message);
    setLifecycleRender(value => value + 1);
  }
  function check(explicit = false) {
    if (!live() || status.current === 'unavailable' && !explicit) return;
    const token = ++probeSequence.current;
    status.current = 'checking'; setLifecycleRender(value => value + 1);
    void verifyStudioMutationContext(recoveryScope).then(() => {
      if (!live() || token !== probeSequence.current) return;
      status.current = 'ready'; feedback.current = visit;
      setError(reconciliation.current ? 'The previous release action may have completed. Review the release before allowing another action.' : '');
      setLifecycleRender(value => value + 1);
    }, caught => {
      if (!live() || token !== probeSequence.current) return;
      if (caught instanceof StudioMutationContextError && caught.reason === 'changed') retire();
      else unavailable(!!pending.current);
    });
  }
  useLayoutEffect(() => {
    if (lifecycle.current.setup) setLifecycleRender(value => value + 1);
    lifecycle.current.setup = true;
    lifecycle.current.mounted = true;
    return () => { lifecycle.current.mounted = false; lifecycle.current.epoch++; probeSequence.current++; };
  }, []);
  useEffect(() => {
    check();
    const background = () => check();
    const visible = () => { if (document.visibilityState !== 'hidden') check(); };
    window.addEventListener('focus', background); window.addEventListener('pageshow', background); document.addEventListener('visibilitychange', visible);
    return () => {
      probeSequence.current++;
      window.removeEventListener('focus', background); window.removeEventListener('pageshow', background); document.removeEventListener('visibilitychange', visible);
    };
  }, [binding, scopeKey, renderEpoch]);
  const hasNotes = notes.length > 0;
  const notesRef = useRef(notes), generationRef = useRef(notesGeneration);
  notesRef.current = notes;
  generationRef.current = notesGeneration;
  useEffect(() => registerStudioNavigationGuard(document, () => notesRef.current.length > 0), []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!notesRef.current.length) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  const bindingValid = Number.isSafeInteger(release.version) && release.version > 0 &&
    typeof materialRevision === "string" && /^[a-f0-9]{64}$/.test(materialRevision);
  const notesStale = hasNotes && notesBinding !== null && notesBinding !== visit;
  const locked = pending.current?.visit === visit || completed.current === visit;
  const reviewable = release.status === "in-review" || release.status === "approved" && approvalCurrent === false;
  function changeNotes(value: string) {
    if (!live()) return;
    if (!hasNotes && value.length) setNotesBinding(visit);
    setNotes(value);
    notesRef.current = value;
    generationRef.current++;
    setNotesGeneration(generationRef.current);
  }
  function restartReview() {
    if (!live() || !notesStale) return;
    if (!window.confirm("Discard the unsent notes from the previous release context and start a review for this version?")) return;
    if (!live()) return;
    changeNotes("");
    setNotesBinding(null);
    setDecision("approved");
    setError("");
  }
  async function act(action: "submit-release" | "review-release" | "publish-release", success: string, review?: { decision: string; notes: string }) {
    if (!live() || status.current !== 'ready' || reconciliation.current || !bindingValid || pending.current?.visit === visit || completed.current === visit || notesStale) return;
    if (action === 'submit-release' && release.status !== 'draft' && release.status !== 'changes-requested') return;
    if (action === "review-release" && (!reviewable || !review || !["approved", "changes-requested"].includes(review.decision) || review.notes.trim().length < 10 || review.notes.length > 2000)) {
      feedback.current = visit;
      setError("Enter 10–2000 characters of review evidence and choose a decision."); return;
    }
    if (action === "publish-release" && !(release.status === "approved" && approvalCurrent === true && canPublish)) return;
    const sentGeneration = generationRef.current;
    const request = {visit};
    pending.current = request;
    feedback.current = visit;
    setBusy(true); setError(""); setMessage("");
    try {
      await postStudio({ action, releaseId: release.id, expectedVersion: release.version,
        expectedStatus: release.status, expectedMaterialRevision: materialRevision,
        ...(review ? { decision: review.decision, notes: review.notes } : {}) }, recoveryScope,
        () => live() && status.current === 'ready');
      if (!live() || status.current !== 'ready') return;
      completed.current = visit;
      if (action === "review-release" && generationRef.current === sentGeneration) {
        setNotes(""); notesRef.current = ""; setNotesBinding(null);
      }
      setMessage(action === "review-release" && generationRef.current !== sentGeneration
        ? `${success} Newer notes remain unsent; review the refreshed release before using them.` : success);
      router.refresh();
    } catch (caught) {
      if (!live()) return;
      if (caught instanceof StudioMutationContextError) {
        if (caught.reason === 'changed') retire(); else unavailable(caught.mayHaveCommitted);
      } else {
        if (caught instanceof StudioUncertainSaveError) reconciliation.current = true;
        feedback.current = visit;
        setError(caught instanceof Error ? caught.message : "The workflow action failed.");
      }
    } finally {
      if (pending.current === request) {
        pending.current = null;
        // Effect replay may retire the response but keep this exact visit's
        // lock visible. Repaint its unlock, never another visit's feedback.
        if (current.current === visit && lifecycle.current.mounted) setBusy(false);
      }
    }
  }
  function acknowledge() {
    if (!live() || status.current !== 'ready' || !reconciliation.current || pending.current) return;
    if (!window.confirm('Review the release and its current version in Studio first. If the action completed, do not repeat it. Continue only after reconciling the previous request. This acknowledgement does not verify its outcome.')) return;
    if (!live()) return;
    reconciliation.current = false; setError(''); setLifecycleRender(value => value + 1);
  }
  const activeError = feedback.current === visit ? error : "";
  const activeMessage = feedback.current === visit ? message : "";
  const disabled = locked || status.current !== 'ready' || reconciliation.current || !bindingValid || notesStale;
  return <div className="release-workflow-actions">
    {!bindingValid && <p role="alert" className="error">Release version or material revision is unavailable. Refresh this page before continuing.</p>}
    {status.current === 'checking' && <p role="status">Checking this page’s signed-in Studio context…</p>}
    {status.current === 'unavailable' && <button type="button" onClick={() => check(true)}>Retry context check</button>}
    {status.current === 'retired' && <button type="button" onClick={() => window.location.reload()}>Reload Studio</button>}
    {status.current !== 'retired' && notesStale && <p role="alert" className="error">These unsent review notes belong to a previous release version or access context. Copy them if needed, then restart review for this version.</p>}
    {status.current !== 'retired' && notesStale && !reviewable && <label><span>Unsent notes from previous release context</span><textarea value={notes} readOnly aria-label="Unsent notes from previous release context" /></label>}
    {status.current !== 'retired' && notesStale && <button type="button" onClick={restartReview}>Restart review for this version</button>}
    {status.current !== 'retired' && new Set(["draft", "changes-requested"]).has(release.status) && <button type="button" disabled={disabled} onClick={() => void act("submit-release", "Release submitted for independent review.")}>Submit for review</button>}
    {status.current !== 'retired' && reviewable && <details open={notesStale ? true : undefined}><summary>{release.status === "approved" ? "Record independent re-review" : "Record independent review"}</summary><form onSubmit={(event) => { event.preventDefault(); void act("review-release", "Review decision recorded.", { decision, notes }); }}><label><span>Review decision</span><select name="decision" value={decision} disabled={disabled} onChange={event => { if (live()) setDecision(event.target.value); }}><option value="approved">Approve</option><option value="changes-requested">Request changes</option></select></label><label><span>Review evidence and decision notes</span><textarea name="notes" value={notes} onChange={event => changeNotes(event.target.value)} maxLength={2000} required minLength={10} aria-invalid={!!activeError} placeholder="Review evidence and decision" /></label><button disabled={disabled}>Record review</button></form></details>}
    {status.current !== 'retired' && release.status === "approved" && <button type="button" disabled={disabled || !approvalCurrent || !canPublish} onClick={() => void act("publish-release", "Course release published.")}>Publish approved release</button>}
    {reconciliation.current && status.current !== 'retired' && <div role="group" aria-label="Reconcile uncertain release action"><p>The release action may have completed. A context check does not confirm its outcome.</p><a href="/studio/publishing" target="_blank" rel="noopener noreferrer">Review release state</a><button type="button" disabled={status.current !== 'ready' || !!pending.current} onClick={acknowledge}>I checked the release</button></div>}
    {(activeMessage || activeError) && <p className={activeError ? "error" : ""} role={activeError ? "alert" : "status"}>{activeError || activeMessage}</p>}
  </div>;
}

export function InvitationForm({ releaseId, recoveryScope }: { releaseId: string; recoveryScope: StudioDraftScope }) {
  return <InvitationFormForScope key={studioDraftBoundaryKey(recoveryScope,`invitation:${releaseId}`)} releaseId={releaseId} recoveryScope={recoveryScope} />;
}

function InvitationFormForScope({ releaseId, recoveryScope }: { releaseId: string; recoveryScope: StudioDraftScope }) {
  const [code, setCode] = useState("");
  return <ActionForm recoveryScope={recoveryScope} reconcileHref="/studio/publishing" submitLabel="Create invitation" onSubmit={async (form, isCurrent) => { const result = await postStudio({ action: "create-invitation", releaseId, label: form.get("label"), maxUses: Number(form.get("maxUses")), validDays: Number(form.get("validDays")) }, recoveryScope, isCurrent); if(isCurrent())setCode(String(result.invitationCode)); }}><label><span>Invitation label</span><input name="label" placeholder="Autumn 2026 cohort" /></label><div className="two-fields"><label><span>Maximum uses</span><input name="maxUses" type="number" min="1" max="1000" defaultValue="25" /></label><label><span>Valid for days</span><input name="validDays" type="number" min="1" max="365" defaultValue="30" /></label></div>{code && <div className="invitation-code"><span>Copy now · shown once</span><b>{code}</b><small>/join/{code}</small></div>}</ActionForm>;
}

export function CreateCohortForm({ courses, recoveryScope }: { courses: StudioCourse[]; recoveryScope: StudioDraftScope }) {
  const router = useRouter();
  return <ActionForm key={studioDraftBoundaryKey(recoveryScope,"new-cohort")} recoveryScope={recoveryScope} reconcileHref="/studio/cohorts" submitLabel="Create cohort" onSubmit={async (form, isCurrent) => { await postStudio({ action: "create-cohort", courseId: form.get("courseId"), title: form.get("title"), code: form.get("code") }, recoveryScope, isCurrent); if(isCurrent())router.refresh(); }}><label><span>Course</span><select name="courseId">{courses.map((course) => <option value={course.id} key={course.id}>{course.code} · {course.title}</option>)}</select></label><div className="two-fields"><label><span>Cohort title</span><input name="title" required /></label><label><span>Cohort code</span><input name="code" placeholder="AUT-26" required /></label></div></ActionForm>;
}

export function AssignCohortWorkbookForm({ cohortId, workbooks, recoveryScope }: { cohortId: string; workbooks: StudioWorkbook[]; recoveryScope: StudioDraftScope }) {
  const router = useRouter();
  return <ActionForm key={studioDraftBoundaryKey(recoveryScope,`assign-cohort:${cohortId}`)} recoveryScope={recoveryScope} reconcileHref="/studio/cohorts" submitLabel="Assign workbook" onSubmit={async (form, isCurrent) => { await postStudio({ action: "assign-cohort-workbook", cohortId, workbookId: form.get("workbookId") }, recoveryScope, isCurrent); if(isCurrent())router.refresh(); }}><label><span>Published workbook</span><select name="workbookId">{workbooks.filter((workbook) => workbook.status === "published").map((workbook) => <option value={workbook.id} key={workbook.id}>{workbook.title}</option>)}</select></label></ActionForm>;
}
