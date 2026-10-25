"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { LectureSlide } from "@/lib/lecture-content";
import {validateLectureSlides} from '../lib/lecture-content.ts';
import {createLectureAnatomyReference,resolveLectureAnatomyReference,lectureAnatomyOptions} from '../lib/lecture-anatomy-reference.ts';
import {lectureSlideAnatomyReferences,MAX_LECTURE_ANATOMY_REFERENCES} from '../lib/lecture-anatomy-collection.ts';
import {lectureAnatomyTextMatches} from '../lib/lecture-anatomy-text-matches.ts';
import {createLectureBodyReference,resolveLectureBodyReference,lectureSlideBodyReferences,lectureBodyOptions,lectureBodyRegions} from '../lib/lecture-body-reference.ts';
import type { LectureStudioView } from "@/lib/lecture-repository";
import {parseStudioMutationContext,StudioMutationContextError,verifyStudioMutationContext,type StudioMutationContext} from '../lib/studio-mutation-context.ts';
import { LecturePlayer } from "./LecturePlayer";
import { WorkbookRetirement } from "./WorkbookRetirement";
import { WorkbookCorrection } from "./WorkbookCorrection";
import { WorkbookCorrectionLineage, createWorkbookCorrectionLineageContext } from "./WorkbookCorrectionLineage";
import { lectureSavePresentation } from "./lecture-save-presentation";
import { registerLearningDraftGuard } from "../lib/learning-draft-navigation.ts";
import "./lecture-editor.css";

type Panel = "content" | "preview" | "review";
type Notice = { kind: "error" | "status"; text: string } | null;
class UncertainLectureMutation extends Error {
  readonly safeMessage?:string;
  constructor(cause?:unknown){
    super('Studio could not confirm whether this lecture action completed. Keep your local edits and check the saved lecture before another submission.');
    // Display only these fixed local diagnostics, never JSON-parser fragments,
    // arbitrary rejection messages, or unverified content from a service reply.
    if(cause instanceof Error&&[
      'The lecture service returned an invalid response.',
      'The lecture service returned a different lecture or course. Your local changes have been kept.',
    ].includes(cause.message))this.safeMessage=cause.message;
  }
}

function freshSlide(): LectureSlide {
  return { id: crypto.randomUUID(), title: "", body: "", referenceUrl: "" };
}

function draftSignature(title: string, slides: LectureSlide[]) {
  return JSON.stringify({ title, slides });
}

function referenceIsValid(value: string) {
  if (!value) return true;
  if (value.length > 1_000) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
}

function isComplete(slide: LectureSlide) {
  return Boolean(slide.title.trim() && slide.title.trim().length <= 160 && slide.body.trim() && slide.body.trim().length <= 5_000 && referenceIsValid(slide.referenceUrl.trim())&&lectureSlideAnatomyReferences(slide).every(reference=>resolveLectureAnatomyReference(reference))&&lectureSlideBodyReferences(slide).every(reference=>resolveLectureBodyReference(reference)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseStudioView(value: unknown): LectureStudioView {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string" || typeof value.version !== "number" || !Number.isSafeInteger(value.version) || typeof value.status !== "string" || typeof value.courseId !== "string" || typeof value.courseTitle !== "string" || typeof value.canEdit !== "boolean" || typeof value.canReview !== "boolean" || typeof value.canPublish !== "boolean" || !Array.isArray(value.slides) || !Array.isArray(value.reviews)) throw new Error("The lecture service returned an invalid response.");
  let slidesValid=false;
  if(value.canReopenAnatomy!==undefined&&typeof value.canReopenAnatomy!=='boolean')throw new Error("The lecture service returned an invalid response.");
  try{validateLectureSlides(value.slides,{allowEmpty:true,allowIncomplete:true});slidesValid=true;}catch{/* Keep local edits on an invalid service response. */}
  const reviewsValid = value.reviews.every((review) => isRecord(review) && typeof review.reviewerName === "string" && typeof review.decision === "string" && typeof review.comment === "string" && typeof review.version === "number" && typeof review.createdAt === "string");
  const publishedValid = value.published === null || (isRecord(value.published) && typeof value.published.version === "number" && typeof value.published.integrityHash === "string" && typeof value.published.publishedAt === "string");
  if (!slidesValid || !reviewsValid || !publishedValid) throw new Error("The lecture service returned an invalid response.");
  return value as unknown as LectureStudioView;
}

async function readResult(response: Response, expected: Pick<LectureStudioView, "id" | "courseId">): Promise<LectureStudioView> {
  const body: unknown = await response.json();
  if (!response.ok) {
    if(isRecord(body)&&body.code==='STUDIO_CONTEXT_CHANGED')throw new StudioMutationContextError('changed');
    if(isRecord(body)&&body.code==='STUDIO_CONTEXT_UNAVAILABLE')throw new StudioMutationContextError('unavailable');
    throw new Error(isRecord(body) && typeof body.error === "string" ? body.error : "The lecture request could not be completed.");
  }
  const next = parseStudioView(body);
  if (next.id !== expected.id || next.courseId !== expected.courseId) throw new Error("The lecture service returned a different lecture or course. Your local changes have been kept.");
  return next;
}

export function LectureEditor({ initial, courseOutline, authorityKey = "", expectedStudioContext }: { initial: LectureStudioView; courseOutline: Array<{ id: string; title: string }>; authorityKey?:string; expectedStudioContext:StudioMutationContext }) {
  const [lineageContext] = useState(createWorkbookCorrectionLineageContext);
  const [view, setView] = useState(initial);
  const [title, setTitle] = useState(initial.title);
  const [slides, setSlides] = useState<LectureSlide[]>(initial.slides);
  const [selectedId, setSelectedId] = useState(initial.slides[0]?.id ?? "");
  const [panel, setPanel] = useState<Panel>("content");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [savedSignature, setSavedSignature] = useState(() => draftSignature(initial.title, initial.slides));
  const draftState=useRef({title,slides,savedSignature});
  draftState.current={title,slides,savedSignature};
  const draftGuard=useRef<ReturnType<typeof registerLearningDraftGuard>|null>(null);
  const editorRoot=useRef<HTMLElement|null>(null);
  const [reviewDecision, setReviewDecision] = useState<"approved" | "changes-requested">("approved");
  const [reviewComment, setReviewComment] = useState("");
  const requestState = useRef({ active: false, pending: false, generation: 0, lineageOperation:null as symbol|null });
  const recheckState=useRef({pending:false,generation:0});
  const openingContext=useRef(parseStudioMutationContext(expectedStudioContext));
  const openingAuthorityKey=useRef(authorityKey);
  const [contextHold,setContextHold]=useState<{reason:'changed'|'unavailable';uncertain:boolean}|null>(null);
  const [rechecking,setRechecking]=useState(false);
  const contextHoldRef=useRef<{reason:'changed'|'unavailable';uncertain:boolean}|null>(null);
  const sameOpeningContext=()=>{
    const current=parseStudioMutationContext(expectedStudioContext),opening=openingContext.current;
    return !!current&&!!opening&&current.actorId===opening.actorId&&current.organizationId===opening.organizationId&&authorityKey===openingAuthorityKey.current;
  };
  const holdContext=(reason:'changed'|'unavailable',uncertain:boolean)=>{
    const next={reason,uncertain};contextHoldRef.current=next;setContextHold(next);
  };
  const signature = draftSignature(title, slides);
  const dirty = signature !== savedSignature;
  const contextBlocked=!!contextHold||!sameOpeningContext();
  const readOnly = view.status === "published" || !view.canEdit;
  const selectedIndex = Math.max(0, slides.findIndex((slide) => slide.id === selectedId));
  const selected = slides[selectedIndex];
  const anatomyEditState=useRef({selected,readOnly});
  anatomyEditState.current={selected,readOnly};
  const anatomyOptions=lectureAnatomyOptions();
  const selectedReferences=selected?lectureSlideAnatomyReferences(selected):[];
  const selectedBodyReferences=selected?lectureSlideBodyReferences(selected):[];
  const [bodySearch,setBodySearch]=useState(''),[bodyRegion,setBodyRegion]=useState('all');
  const bodyOptions=useMemo(()=>lectureBodyOptions(bodySearch,bodyRegion),[bodySearch,bodyRegion]);
  const selectedAnatomy=resolveLectureAnatomyReference(selectedReferences[0]);
  const anatomyMatches=useMemo(()=>selected&&!readOnly?lectureAnatomyTextMatches(selected.title,selected.body):{matches:[],total:0},[selected?.title,selected?.body,readOnly]);
  const staleAnatomy=slides.some(slide=>lectureSlideAnatomyReferences(slide).some(reference=>!resolveLectureAnatomyReference(reference))||lectureSlideBodyReferences(slide).some(reference=>!resolveLectureBodyReference(reference)));
  const normalizedSlides = slides.map((slide) => ({ ...slide, title: slide.title.trim(), body: slide.body.trim(), referenceUrl: slide.referenceUrl.trim() }));
  let validEnvelope=false;
  try{validateLectureSlides(normalizedSlides,{allowEmpty:true,allowIncomplete:true});validEnvelope=true;}catch{/* Do not submit malformed or oversized link collections. */}
  const validDraft = title.trim().length >= 4 && title.trim().length <= 160 && validEnvelope;
  const incompleteDraft = slides.some((slide) => !slide.title.trim() || !slide.body.trim());
  const readyForReview = Boolean(validDraft && slides.length && slides.every(isComplete));
  const reviewGuidance = view.status === "published"
    ? "This immutable published revision is available for learner playback."
    : ["archived","withdrawn"].includes(view.status)
      ? "This revision is retired. Its published manifest and review history are preserved; it is not available for new learner access."
    : staleAnatomy
      ? "Reselect or remove outdated anatomy links before requesting review. Submitted lectures must first be reopened; this discards their prior approval for publication."
    : view.status === "approved"
      ? "This exact revision has independent approval and is ready for authorized publication."
      : view.status === "in-review"
        ? (view.canReview ? "Review this exact submitted revision and record an evidence-based decision." : "This exact revision is awaiting independent review; editing remains locked.")
        : !readyForReview
          ? "Add a lecture title and at least one slide. Every slide must have both a title and content before review."
          : dirty
            ? "Save the current changes before requesting independent review."
            : view.status === "changes-requested"
              ? "This revised lecture is ready to be resubmitted for independent review."
              : "This saved revision is ready to be submitted for independent review.";
  const endpoint = `/api/studio/workbooks/${encodeURIComponent(view.id)}/lecture`;

  useLayoutEffect(() => {
    const state = requestState.current;
    state.active = true;
    return () => { state.active = false; state.pending = false; state.generation += 1;
      recheckState.current.generation++;recheckState.current.pending=false;
      if(state.lineageOperation)lineageContext.finish(state.lineageOperation);state.lineageOperation=null;
      lineageContext.invalidate(); };
  }, [lineageContext]);

  useLayoutEffect(()=>{
    if(!sameOpeningContext()){
      const state=requestState.current;
      state.generation++;state.pending=false;
      recheckState.current.generation++;recheckState.current.pending=false;setRechecking(false);
      if(state.lineageOperation)lineageContext.finish(state.lineageOperation);
      state.lineageOperation=null;lineageContext.invalidate();
      setBusy(false);holdContext('changed',false);
    }
  },[authorityKey,expectedStudioContext.actorId,expectedStudioContext.organizationId]);

  function beginRequest() {
    const state = requestState.current;
    if (!state.active || state.pending || contextHoldRef.current || !sameOpeningContext()) {
      if(state.active&&!sameOpeningContext())holdContext('changed',false);
      return null;
    }
    state.lineageOperation=lineageContext.begin();
    state.pending = true;
    setBusy(true); setNotice(null);
    return state.generation;
  }

  function requestIsCurrent(generation: number) {
    return requestState.current.active && requestState.current.generation === generation && sameOpeningContext();
  }

  function finishRequest(generation: number) {
    if (!requestIsCurrent(generation)) return;
    requestState.current.pending = false;
    if(requestState.current.lineageOperation)lineageContext.finish(requestState.current.lineageOperation);
    requestState.current.lineageOperation=null;
    setBusy(false);
  }

  useLayoutEffect(() => {
    if(typeof window==='undefined'||!window.document)return;
    const guard=registerLearningDraftGuard(window,
      ()=>draftSignature(draftState.current.title,draftState.current.slides)!==draftState.current.savedSignature,
      {warning:'You have unsaved lecture changes. Leave without saving?',unloadReturnValue:'Unsaved lecture changes',
        onHistoryRejected:()=>{
          const root=editorRoot.current;
          const visible=(target:HTMLElement|null):target is HTMLElement=>
            !!target?.isConnected&&!target.hidden&&!target.hasAttribute('disabled')&&!target.matches(':disabled')&&
            !target.closest('[hidden],[inert]')&&target.getClientRects().length>0&&
            !['hidden','collapse'].includes(window.getComputedStyle(target).visibility);
          if(!visible(root))return;
          const focus=(target:HTMLElement|null)=>{
            if(!visible(target))return false;
            try{target.focus({preventScroll:true});return document.activeElement===target;}catch{return false;}
          };
          const active=document.activeElement;
          if(active instanceof HTMLElement&&root.contains(active)&&focus(active))return;
          if(focus(root.querySelector<HTMLElement>('.lecture-editor-toolbar nav button')))return;
          focus(root);
        }});
    draftGuard.current=guard;
    return()=>{guard();draftGuard.current=null;};
  },[]);
  useLayoutEffect(()=>{draftGuard.current?.refresh();},[dirty]);

  function changeTitle(value:string){draftState.current.title=value;setTitle(value);draftGuard.current?.refresh();}
  function changeSlides(update:(current:LectureSlide[])=>LectureSlide[]){
    const next=update(draftState.current.slides);
    draftState.current.slides=next;setSlides(next);draftGuard.current?.refresh();
  }

  function accept(next: LectureStudioView, message: string) {
    draftState.current={title:next.title,slides:next.slides,savedSignature:draftSignature(next.title,next.slides)};
    setView(next); setTitle(next.title); setSlides(next.slides);
    setSelectedId((current) => next.slides.some((slide) => slide.id === current) ? current : next.slides[0]?.id ?? "");
    setSavedSignature(draftSignature(next.title, next.slides)); setNotice({ kind: "status", text: message });
    draftGuard.current?.refresh();
  }

  async function post(action: "save" | "request-review" | "review" | "publish" | "reopen-anatomy", extra: Record<string, unknown> = {}) {
    const generation = beginRequest();
    if (generation === null) return;
    let dispatched=false,response:Response|undefined;
    try {
      await verifyStudioMutationContext(openingContext.current);
      if(!requestIsCurrent(generation))return;
      const payload: Record<string, unknown> = { action, id: view.id, expectedVersion: view.version, ...extra, expectedStudioContext:openingContext.current };
      if (action === "save") Object.assign(payload, {
        title: title.trim(),
        slides: normalizedSlides,
      });
      dispatched=true;
      response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!requestIsCurrent(generation)) return;
      let next:LectureStudioView|undefined,requestError:unknown;
      try{next=await readResult(response,view);}catch(error){requestError=error;}
      if(!requestIsCurrent(generation))return;
      if(requestError instanceof StudioMutationContextError)throw requestError;
      await verifyStudioMutationContext(openingContext.current);
      if (!requestIsCurrent(generation)) return;
      if(requestError){if(response.ok)throw new UncertainLectureMutation(requestError);throw requestError;}
      if(!next)throw new UncertainLectureMutation();
      accept(next, action === "save" ? "Lecture draft saved." : action === "request-review" ? "Lecture sent for independent review." : action === "review" ? "Review decision recorded." : action==='reopen-anatomy' ? "Lecture reopened as a new draft revision. Update the anatomy link, save and request fresh independent review." : "Approved lecture published.");
      if (action === "review") setReviewComment("");
    } catch (caught) {
      if (requestIsCurrent(generation)){
        if(caught instanceof StudioMutationContextError)holdContext(caught.reason,dispatched);
        else if(caught instanceof UncertainLectureMutation){
          holdContext('unavailable',true);
          if(caught.safeMessage)setNotice({kind:'error',text:caught.safeMessage});
        }
        else if(dispatched&&(!response||response.status===408||response.status>=500))holdContext('unavailable',true);
        else setNotice({ kind: "error", text: caught instanceof Error ? caught.message : "The lecture request could not be completed." });
      }
    } finally { finishRequest(generation); }
  }

  async function reload() {
    if (!requestState.current.active || requestState.current.pending || contextHoldRef.current || !sameOpeningContext()) return;
    if (dirty && !window.confirm("Discard your unsaved lecture changes and reload the saved version?")) return;
    const generation = beginRequest();
    if (generation === null) return;
    try {
      await verifyStudioMutationContext(openingContext.current);
      if(!requestIsCurrent(generation))return;
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!requestIsCurrent(generation)) return;
      const next = await readResult(response, view);
      await verifyStudioMutationContext(openingContext.current);
      if (requestIsCurrent(generation)) accept(next, "Saved lecture reloaded.");
    } catch (caught) { if (requestIsCurrent(generation)){
      if(caught instanceof StudioMutationContextError)holdContext(caught.reason,false);
      else setNotice({ kind: "error", text: caught instanceof Error ? caught.message : "The saved lecture could not be reloaded." });
    } }
    finally { finishRequest(generation); }
  }

  async function recheckContext(){
    const state=recheckState.current,hold=contextHoldRef.current;
    if(!requestState.current.active||requestState.current.pending||state.pending||!sameOpeningContext()||!hold)return;
    state.pending=true;const token=++state.generation;setRechecking(true);
    const uncertain=hold.uncertain;
    if(uncertain&&!window.confirm('Check the saved lecture in Studio first. If the previous action completed, do not repeat it. Continue only after reconciling that result?')){
      state.pending=false;setRechecking(false);return;
    }
    try{await verifyStudioMutationContext(openingContext.current);
      if(!requestState.current.active||!sameOpeningContext()||state.generation!==token||contextHoldRef.current!==hold)return;
      contextHoldRef.current=null;setContextHold(null);
      setNotice({kind:'status',text:uncertain?'Context confirmed after your saved-lecture check. Keep unsent edits until you deliberately save or reload.':'Studio context confirmed. Your local edits are unchanged.'});
    }catch(error){if(requestState.current.active&&sameOpeningContext()&&state.generation===token&&contextHoldRef.current===hold)holdContext(error instanceof StudioMutationContextError?error.reason:'unavailable',uncertain);}
    finally{if(requestState.current.active&&state.generation===token){state.pending=false;setRechecking(false);}}
  }

  function updateSelected(patch: Partial<LectureSlide>) {
    if (!selected) return;
    changeSlides((current) => current.map((slide) => slide.id === selected.id ? { ...slide, ...patch } : slide));
  }

  function editAnatomy(conceptId:string,action:'primary'|'add'|'remove'='primary'){
    if(!requestState.current.active||requestState.current.pending||readOnly||!selected||
      anatomyEditState.current.readOnly||anatomyEditState.current.selected!==selected)return;
    const reference=conceptId?createLectureAnatomyReference(conceptId):null;
    if(action!=='remove'&&conceptId&&!reference)return;
    changeSlides(current=>current.map(slide=>{
      if(slide!==selected)return slide;
      const references=lectureSlideAnatomyReferences(slide);
      let next=references;
      if(action==='remove')next=references.filter(pin=>pin.conceptId!==conceptId);
      else if(action==='add'){
        if(!reference||references.length>=MAX_LECTURE_ANATOMY_REFERENCES||references.some(pin=>pin.conceptId===conceptId))return slide;
        next=[...references,reference];
      }else{
        if(reference&&references.slice(1).some(pin=>pin.conceptId===conceptId))return slide;
        next=reference?[reference,...references.slice(1)]:[];
      }
      if(next.length+lectureSlideBodyReferences(slide).length>MAX_LECTURE_ANATOMY_REFERENCES)return slide;
      const {anatomyReference:removed,anatomyReferences:removedCollection,...rest}=slide;
      void removed;void removedCollection;
      // Keep the legacy one-pin form until an author explicitly adds another link.
      return !next.length?rest:next.length===1&&!Object.hasOwn(slide,'anatomyReferences')
        ?{...rest,anatomyReference:next[0]}:{...rest,anatomyReferences:next};
    }));
  }

  function editBodyAnatomy(value:string,action:'add'|'remove'='add'){
    if(!requestState.current.active||requestState.current.pending||readOnly||!selected||
      anatomyEditState.current.readOnly||anatomyEditState.current.selected!==selected)return;
    const reference=action==='add'?createLectureBodyReference(value):null;
    if(action==='add'&&!reference)return;
    changeSlides(current=>current.map(slide=>{
      if(slide!==selected)return slide;
      const references=lectureSlideBodyReferences(slide);
      if(action==='add'&&(references.some(pin=>pin.structureId===value)||references.length+lectureSlideAnatomyReferences(slide).length>=MAX_LECTURE_ANATOMY_REFERENCES))return slide;
      const next=action==='remove'?references.filter(pin=>JSON.stringify(pin)!==value):[...references,reference!];
      const {bodyAnatomyReferences:removed,...rest}=slide;void removed;
      return next.length?{...rest,bodyAnatomyReferences:next}:rest;
    }));
  }

  function addSlide() {
    const slide = freshSlide(); changeSlides((current) => [...current, slide]); setSelectedId(slide.id); setPanel("content");
  }

  function removeSlide(id: string) {
    const slide = slides.find((item) => item.id === id);
    if (!slide) return;
    const meaningful = Boolean(slide.title.trim() || slide.body.trim() || slide.referenceUrl.trim() || slide.anatomyReference || slide.anatomyReferences || slide.bodyAnatomyReferences);
    if (meaningful && !window.confirm(`Remove “${slide.title.trim() || "Untitled slide"}”? This discards its unsaved content.`)) return;
    const index = slides.findIndex((item) => item.id === id);
    const next = slides.filter((item) => item.id !== id);
    changeSlides(()=>next); setSelectedId(next[Math.min(index, next.length - 1)]?.id ?? "");
  }

  function moveSlide(offset: -1 | 1) {
    if (!selected) return;
    const target = selectedIndex + offset;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides]; [next[selectedIndex], next[target]] = [next[target], next[selectedIndex]]; changeSlides(()=>next);
  }

  const courseItems = useMemo(() => courseOutline, [courseOutline]);
  const savePresentation = lectureSavePresentation({
    busy,
    contextReason: contextHold?.reason ?? (contextBlocked ? 'changed' : null),
    uncertain: contextHold?.uncertain ?? false,
    dirty,
    readOnly,
    validDraft,
    savedVersion: view.version,
  });
  return <section className="lecture-editor" aria-label="Lecture editor" data-editor-panel={panel} tabIndex={-1} ref={editorRoot}>
    <WorkbookCorrectionLineage id={view.id} version={view.version} mode="lecture" status={view.status} authorityKey={authorityKey}
      contextKey={JSON.stringify([view.courseId,view.canEdit,view.canReview,view.canPublish,view.canReopenAnatomy])}
      context={lineageContext} disabled={busy} />
    <header className="lecture-editor-toolbar">
      <nav aria-label="Lecture editor panels">{(["content", "preview", "review"] as const).map((item) => <button type="button" key={item} aria-current={panel === item ? "page" : undefined} onClick={() => setPanel(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}</nav>
      <div className="lecture-save-state" data-save-state={savePresentation.state}><span role={contextBlocked ? undefined : "status"}>{savePresentation.label}{contextBlocked && dirty && <> · <span role="status">Unsaved changes</span></>}</span><small id="lecture-save-detail">{savePresentation.detail}</small></div>
      <button type="button" className="lecture-primary-action" aria-describedby="lecture-save-detail" disabled={busy || contextBlocked || readOnly || !dirty || !validDraft} title={!validDraft ? "Check the lecture title, text limits and source addresses before saving" : undefined} onClick={() => void post("save")}>{busy ? "Working…" : "Save"}</button>
    </header>
    <fieldset className="lecture-editor-busy" disabled={busy}>
      <div className="lecture-editor-grid">
        <aside className="lecture-course-outline" aria-label="Course lesson outline"><h2>{view.courseTitle}</h2><p>Course outline</p><ol>{courseItems.map((item) => <li key={item.id}><a href={`/studio/workbooks/${encodeURIComponent(item.id)}/builder`} aria-current={item.id === view.id ? "page" : undefined}>{item.title}</a></li>)}</ol></aside>
        <aside className="lecture-slide-outline" aria-label="Slide outline"><header><div><h2>Slides</h2><small>{slides.length} total</small></div>{!readOnly && <button type="button" onClick={addSlide} disabled={slides.length >= 80}>Add</button>}</header>{slides.length ? <ol>{slides.map((slide, index) => <li key={slide.id}><button type="button" aria-current={slide.id === selectedId ? "step" : undefined} onClick={() => { setSelectedId(slide.id); setPanel("content"); }}><span>{index + 1}</span>{slide.title || "Untitled slide"}</button></li>)}</ol> : <p className="lecture-empty-note">Start with an empty draft or add the first slide.</p>}</aside>
        <section className="lecture-editor-main" aria-label="Selected lecture content">
          {view.published && <div className="lecture-published-state"><b>{view.status === "published" ? "Published version" : "Historical published version"} {view.published.version}</b><span>{view.published.integrityHash}</span><small>{new Date(view.published.publishedAt).toLocaleString()}</small></div>}
          {view.canReopenAnatomy&&view.status!=='published'&&<div className="lecture-draft-note"><p>An anatomy source link has changed. Reopen this unpublished lecture to correct it; prior review stays in history but cannot approve the new revision.</p><button type="button" disabled={contextBlocked||busy} onClick={()=>{if(window.confirm('Reopen this lecture as a new draft revision? Its previous approval will no longer allow publication.'))void post('reopen-anatomy');}}>Reopen to update anatomy</button></div>}
          {panel === "content" && <div className="lecture-content-panel">
            <details className="lecture-details"><summary>Details</summary><label><span>Lecture title</span><input value={title} minLength={4} maxLength={160} aria-invalid={(title.trim().length < 4 || title.trim().length > 160) || undefined} onChange={(event) => changeTitle(event.target.value)} disabled={readOnly} /></label></details>
            {incompleteDraft && <p className="lecture-draft-note">Incomplete slides can be saved as a draft. Add a title and content to every slide before requesting review.</p>}
            {selected ? <article className="lecture-slide-form"><header><div><small>Slide {selectedIndex + 1}</small><h2>{selected.title || "Untitled slide"}</h2></div>{!readOnly && <div><button type="button" onClick={() => moveSlide(-1)} disabled={selectedIndex === 0}>Move up</button><button type="button" onClick={() => moveSlide(1)} disabled={selectedIndex === slides.length - 1}>Move down</button><button type="button" className="lecture-danger" onClick={() => removeSlide(selected.id)}>Remove</button></div>}</header><label><span>Slide title</span><input value={selected.title} maxLength={160} onChange={(event) => updateSelected({ title: event.target.value })} disabled={readOnly} /></label><label><span>Content</span><textarea rows={12} value={selected.body} maxLength={5_000} onChange={(event) => updateSelected({ body: event.target.value })} disabled={readOnly} /></label><details><summary>Advanced · source reference</summary><label><span>Optional HTTPS source</span><input type="url" inputMode="url" placeholder="https://…" value={selected.referenceUrl} maxLength={1_000} onChange={(event) => updateSelected({ referenceUrl: event.target.value })} disabled={readOnly} aria-invalid={!referenceIsValid(selected.referenceUrl.trim()) || undefined} /></label>{!referenceIsValid(selected.referenceUrl.trim()) && <p className="lecture-field-error">Use a complete HTTPS address without embedded credentials.</p>}</details>
              <details key={selected.id} className="lecture-anatomy-editor"><summary>Optional · linked anatomy{selectedReferences.length>1?` · ${selectedReferences.length} structures`:selectedAnatomy?` · ${selectedAnatomy.label}`:''}</summary>
                <label><span>Primary linked structure</span><select aria-label="Head Atlas structure" value={selectedReferences.length?(selectedAnatomy?selectedAnatomy.conceptId:'unavailable'):''} disabled={readOnly} onChange={event=>editAnatomy(event.target.value)}>
                  <option value="">{selectedBodyReferences.length?(selectedReferences.length>1?'Remove all head anatomy links':'No head anatomy link'):selectedReferences.length>1?'Remove all anatomy links':'No anatomy link'}</option>
                  {selectedReferences.length>0&&!selectedAnatomy&&<option value="unavailable" disabled>Saved link needs updating</option>}
                  {anatomyOptions.map(option=><option key={option.conceptId} value={option.conceptId} disabled={selectedReferences.slice(1).some(pin=>pin.conceptId===option.conceptId)}>{option.label}</option>)}
                </select></label>
                {selectedReferences.length>0&&<>
                  <ul className="lecture-anatomy-selected" aria-label="Linked anatomy structures">{selectedReferences.map(pin=>{
                    const resolved=resolveLectureAnatomyReference(pin);
                    const label=resolved?.label??`Unavailable: ${pin.conceptId}`;
                    return <li key={pin.conceptId}><span>{label}{resolved&&<small>{[resolved.atlasHref?'3D Atlas':null,resolved.ctHref?'CT':null,resolved.mriHref?'MRI':null].filter(Boolean).join(' · ')}</small>}</span><button type="button" disabled={readOnly} aria-label={`Remove anatomy link: ${label}`} onClick={()=>editAnatomy(pin.conceptId,'remove')}>Remove link</button></li>;
                  })}</ul>
                  <label><span>Add another structure · {selectedReferences.length+selectedBodyReferences.length}/{MAX_LECTURE_ANATOMY_REFERENCES}</span><select aria-label="Add linked anatomy structure" value="" disabled={readOnly||selectedReferences.length+selectedBodyReferences.length>=MAX_LECTURE_ANATOMY_REFERENCES} onChange={event=>editAnatomy(event.target.value,'add')}>
                    <option value="">Choose another structure…</option>
                    {anatomyOptions.filter(option=>!selectedReferences.some(pin=>pin.conceptId===option.conceptId)).map(option=><option key={option.conceptId} value={option.conceptId}>{option.label}</option>)}
                  </select></label>
                </>}
                {anatomyMatches.matches.length>0&&<div className="lecture-anatomy-matches">
                  <p>Matches in this slide’s text · choose the primary linked structure</p>
                  <ul aria-label="Anatomy text matches">{anatomyMatches.matches.map(match=><li key={match.conceptId}>
                    <button type="button" disabled={busy||readOnly||selectedReferences.some(pin=>pin.conceptId===match.conceptId)} aria-pressed={selectedReferences.some(pin=>pin.conceptId===match.conceptId)} onClick={()=>editAnatomy(match.conceptId)}>{selectedReferences.some(pin=>pin.conceptId===match.conceptId)?`Linked: ${match.label}`:`Link ${match.label}`}</button>
                  </li>)}</ul>
                  <p>Text matches are not anatomical verification. Nothing is linked automatically.{anatomyMatches.total>anatomyMatches.matches.length&&` Showing ${anatomyMatches.matches.length} of ${anatomyMatches.total} matches; the structure list above contains every current option.`}</p>
                </div>}
                <p>Link up to {MAX_LECTURE_ANATOMY_REFERENCES} structures in total per slide. The saved lecture revision includes every exact anatomy binding. Full-body 3D references are available below; acquired-image links require explicit mappings.</p>
                {selectedReferences.some(pin=>!resolveLectureAnatomyReference(pin))&&<p role="status" className="lecture-field-error">A saved link is outdated or unavailable. Reselect the primary structure, or remove the affected link and add its current binding before review.</p>}
                {selectedAnatomy&&<><p>{selectedAnatomy.label}: {[selectedAnatomy.atlasHref?'3D Atlas':null,selectedAnatomy.ctHref?'CT':null,selectedAnatomy.mriHref?'MRI':null].filter(Boolean).join(' · ')}. Preview shows the available links.</p>{!selectedAnatomy.atlasHref&&<p>No exact 3D part is mapped. This slide links to the native images only.</p>}</>}
                <p>Reference anatomy only, not patient-space synchronization. Atlas, imaging cases and paid lectures retain separate access.</p>
              </details>
              <details key={`body:${selected.id}`} className="lecture-anatomy-editor"><summary>Optional · 3D body structures{selectedBodyReferences.length?` · ${selectedBodyReferences.length} linked`:''}</summary>
                <p>Choose an exact structure and side. These links open the existing 3D Atlas; no CT/MRI or patient-space match is inferred. {selectedReferences.length+selectedBodyReferences.length}/{MAX_LECTURE_ANATOMY_REFERENCES} total anatomy links.</p>
                <label><span>Body region</span><select aria-label="3D anatomy region" value={bodyRegion} disabled={readOnly} onChange={event=>setBodyRegion(event.target.value)}><option value="all">All body regions</option>{lectureBodyRegions.map(region=><option value={region.id} key={region.id}>{region.label}</option>)}</select></label>
                <label><span>Find a 3D structure</span><input type="search" aria-label="Find a 3D structure" value={bodySearch} maxLength={80} disabled={readOnly} placeholder="e.g. left Achilles, supraspinatus…" onChange={event=>setBodySearch(event.target.value)}/></label>
                {!readOnly&&<><ul className="lecture-anatomy-selected" aria-label="3D structure search results">{bodyOptions.map(option=><li key={option.reference.structureId}><span>{option.label}<small>{option.region} · 3D reference</small></span><button type="button" disabled={selectedReferences.length+selectedBodyReferences.length>=MAX_LECTURE_ANATOMY_REFERENCES||selectedBodyReferences.some(pin=>pin.structureId===option.reference.structureId)} onClick={()=>editBodyAnatomy(option.reference.structureId)}>Link {option.label}</button></li>)}</ul><p role="status">{bodyOptions.length?`Showing ${bodyOptions.length} source-mapped results. Nothing is linked automatically.`:bodySearch||bodyRegion!=='all'?'No current structures match. Try a different name, side or region.':'Enter at least two characters, or choose a body region.'}</p></>}
                {selectedBodyReferences.length>0&&<ul className="lecture-anatomy-selected" aria-label="Linked 3D body structures">{selectedBodyReferences.map(pin=>{const resolved=resolveLectureBodyReference(pin),label=resolved?.label??pin.structureId;return <li key={JSON.stringify(pin)}><span>{label}<small>{resolved?'3D reference · source-bound':'Source unavailable · reselect or remove before review'}</small></span><button type="button" disabled={readOnly} aria-label={`Remove 3D link: ${label}`} onClick={()=>editBodyAnatomy(JSON.stringify(pin),'remove')}>Remove link</button></li>;})}</ul>}
                {selectedBodyReferences.some(pin=>!resolveLectureBodyReference(pin))&&<p role="status" className="lecture-field-error">A saved 3D source is outdated or unavailable. No replacement has been substituted. Reopen the draft if needed, then remove or reselect the exact structure.</p>}
                <p>Atlas and paid lectures keep independent access. Selecting a structure does not approve the anatomy or publish this lecture.</p>
              </details>
            </article> : <div className="lecture-editor-empty"><h2>No slides yet</h2><p>A draft may remain empty. Add a complete slide before requesting review.</p>{!readOnly && <button type="button" onClick={addSlide}>Add first slide</button>}</div>}
          </div>}
          {panel === "preview" && <LecturePlayer title={title || "Untitled lecture"} slides={slides} version={view.status === "published" && !dirty ? view.version : undefined} />}
          {panel === "review" && <div className="lecture-review-panel"><header><p className="eyebrow">Revision-bound review</p><h2>{view.status.replaceAll("-", " ")}</h2><p>{reviewGuidance}</p></header><div className="lecture-review-actions">{view.canEdit && view.status !== "published" && <button type="button" disabled={contextBlocked || dirty || !readyForReview} title={dirty ? "Save your changes before requesting review" : undefined} onClick={() => void post("request-review")}>Request review</button>}{view.canReview && view.status !== "published" && <form onSubmit={(event) => { event.preventDefault(); if(!contextBlocked)void post("review", { decision: reviewDecision, comment: reviewComment }); }}><label><span>Decision</span><select value={reviewDecision} onChange={(event) => setReviewDecision(event.target.value as typeof reviewDecision)}><option value="approved">Approve</option><option value="changes-requested">Request changes</option></select></label><label><span>Review comment</span><textarea required minLength={10} maxLength={2_000} value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} /></label><button disabled={contextBlocked}>Record review</button></form>}{view.canPublish && view.status !== "published" && <button type="button" disabled={contextBlocked} onClick={() => void post("publish")}>Publish approved version</button>}</div><ol className="lecture-review-history">{view.reviews.map((review, index) => <li key={`${review.createdAt}-${index}`}><b>{review.decision.replaceAll("-", " ")} · version {review.version}</b><span>{review.reviewerName} · {new Date(review.createdAt).toLocaleString()}</span><p>{review.comment}</p></li>)}</ol></div>}
          {panel === "review" && view.status === "published" && <WorkbookCorrection id={view.id} title={view.title} version={view.version} mode="lecture" disabled={busy} />}
          {panel === "review" && view.status === "published" && <WorkbookRetirement id={view.id} title={view.title} version={view.version} disabled={busy} onRetired={receipt => {
            lineageContext.invalidate();
            setView(previous => ({...previous,status:receipt.disposition,canEdit:false,canReview:false,canPublish:false,canReopenAnatomy:false}));
            setNotice({kind:"status",text:`Workbook ${receipt.disposition}. Published evidence and review history were preserved.`});
          }} />}
        </section>
      </div>
    </fieldset>
    <footer className="lecture-editor-feedback"><button type="button" disabled={busy||contextBlocked} onClick={() => void reload()}>Reload saved version</button>{contextBlocked&&<div role="alert"><p>{contextHold?.reason==='changed'||!sameOpeningContext()?'The signed-in Studio context changed. Keep your local edits and check the saved lecture before rechecking or reloading Studio.':'Studio context could not be confirmed. Your local edits are unchanged.'}</p>{contextHold?.uncertain&&<p>The previous lecture action may have completed. Check its saved state before another submission.</p>}{sameOpeningContext()&&<><a href={endpoint.replace('/api/studio/','/studio/').replace(/\/lecture$/,'/builder')} target="_blank" rel="noopener noreferrer">Review saved lecture</a><button type="button" disabled={rechecking} onClick={()=>void recheckContext()}>{rechecking?'Checking Studio context…':contextHold?.uncertain?'I checked the saved lecture':'Retry context check'}</button></>}</div>}{notice && <p role={notice.kind === "error" ? "alert" : "status"} className={`lecture-feedback-${notice.kind}`}>{notice.text}</p>}</footer>
  </section>;
}
