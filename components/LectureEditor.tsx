"use client";

import { useEffect, useMemo, useState } from "react";
import type { LectureSlide } from "@/lib/lecture-content";
import type { LectureStudioView } from "@/lib/lecture-repository";
import { LecturePlayer } from "./LecturePlayer";
import "./lecture-editor.css";

type Panel = "content" | "preview" | "review";
type Notice = { kind: "error" | "status"; text: string } | null;

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
  return Boolean(slide.title.trim() && slide.title.trim().length <= 160 && slide.body.trim() && slide.body.trim().length <= 5_000 && referenceIsValid(slide.referenceUrl.trim()));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseStudioView(value: unknown): LectureStudioView {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string" || typeof value.version !== "number" || !Number.isSafeInteger(value.version) || typeof value.status !== "string" || typeof value.courseId !== "string" || typeof value.courseTitle !== "string" || typeof value.canEdit !== "boolean" || typeof value.canReview !== "boolean" || typeof value.canPublish !== "boolean" || !Array.isArray(value.slides) || !Array.isArray(value.reviews)) throw new Error("The lecture service returned an invalid response.");
  const slidesValid = value.slides.every((slide) => isRecord(slide) && typeof slide.id === "string" && typeof slide.title === "string" && typeof slide.body === "string" && typeof slide.referenceUrl === "string");
  const reviewsValid = value.reviews.every((review) => isRecord(review) && typeof review.reviewerName === "string" && typeof review.decision === "string" && typeof review.comment === "string" && typeof review.version === "number" && typeof review.createdAt === "string");
  const publishedValid = value.published === null || (isRecord(value.published) && typeof value.published.version === "number" && typeof value.published.integrityHash === "string" && typeof value.published.publishedAt === "string");
  if (!slidesValid || !reviewsValid || !publishedValid) throw new Error("The lecture service returned an invalid response.");
  return value as unknown as LectureStudioView;
}

async function readResult(response: Response): Promise<LectureStudioView> {
  const body: unknown = await response.json();
  if (!response.ok) throw new Error(isRecord(body) && typeof body.error === "string" ? body.error : "The lecture request could not be completed.");
  return parseStudioView(body);
}

export function LectureEditor({ initial, courseOutline }: { initial: LectureStudioView; courseOutline: Array<{ id: string; title: string }> }) {
  const [view, setView] = useState(initial);
  const [title, setTitle] = useState(initial.title);
  const [slides, setSlides] = useState<LectureSlide[]>(initial.slides);
  const [selectedId, setSelectedId] = useState(initial.slides[0]?.id ?? "");
  const [panel, setPanel] = useState<Panel>("content");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [savedSignature, setSavedSignature] = useState(() => draftSignature(initial.title, initial.slides));
  const [reviewDecision, setReviewDecision] = useState<"approved" | "changes-requested">("approved");
  const [reviewComment, setReviewComment] = useState("");
  const signature = draftSignature(title, slides);
  const dirty = signature !== savedSignature;
  const readOnly = view.status === "published" || !view.canEdit;
  const selectedIndex = Math.max(0, slides.findIndex((slide) => slide.id === selectedId));
  const selected = slides[selectedIndex];
  const normalizedSlides = slides.map((slide) => ({ ...slide, title: slide.title.trim(), body: slide.body.trim(), referenceUrl: slide.referenceUrl.trim() }));
  const validDraft = title.trim().length >= 4 && title.trim().length <= 160 && slides.length <= 80 && normalizedSlides.every((slide) => slide.title.length <= 160 && slide.body.length <= 5_000 && referenceIsValid(slide.referenceUrl));
  const incompleteDraft = slides.some((slide) => !slide.title.trim() || !slide.body.trim());
  const readyForReview = Boolean(title.trim().length >= 4 && title.trim().length <= 160 && slides.length && slides.length <= 80 && slides.every(isComplete));
  const reviewGuidance = view.status === "published"
    ? "This immutable published revision is available for learner playback."
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

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    const guardLinks = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || event.ctrlKey || event.metaKey || event.shiftKey || (link.hash && link.pathname === location.pathname)) return;
      if (!window.confirm("You have unsaved lecture changes. Leave without saving?")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", guardLinks, true);
    return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("click", guardLinks, true); };
  }, [dirty]);

  function accept(next: LectureStudioView, message: string) {
    setView(next); setTitle(next.title); setSlides(next.slides);
    setSelectedId((current) => next.slides.some((slide) => slide.id === current) ? current : next.slides[0]?.id ?? "");
    setSavedSignature(draftSignature(next.title, next.slides)); setNotice({ kind: "status", text: message });
  }

  async function post(action: "save" | "request-review" | "review" | "publish", extra: Record<string, unknown> = {}) {
    setBusy(true); setNotice(null);
    try {
      const payload: Record<string, unknown> = { action, id: view.id, expectedVersion: view.version, ...extra };
      if (action === "save") Object.assign(payload, {
        title: title.trim(),
        slides: normalizedSlides,
      });
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      accept(await readResult(response), action === "save" ? "Lecture draft saved." : action === "request-review" ? "Lecture sent for independent review." : action === "review" ? "Review decision recorded." : "Approved lecture published.");
      if (action === "review") setReviewComment("");
    } catch (caught) {
      setNotice({ kind: "error", text: caught instanceof Error ? caught.message : "The lecture request could not be completed." });
    } finally { setBusy(false); }
  }

  async function reload() {
    if (dirty && !window.confirm("Discard your unsaved lecture changes and reload the saved version?")) return;
    setBusy(true); setNotice(null);
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      accept(await readResult(response), "Saved lecture reloaded.");
    } catch (caught) { setNotice({ kind: "error", text: caught instanceof Error ? caught.message : "The saved lecture could not be reloaded." }); }
    finally { setBusy(false); }
  }

  function updateSelected(patch: Partial<LectureSlide>) {
    if (!selected) return;
    setSlides((current) => current.map((slide) => slide.id === selected.id ? { ...slide, ...patch } : slide));
  }

  function addSlide() {
    const slide = freshSlide(); setSlides((current) => [...current, slide]); setSelectedId(slide.id); setPanel("content");
  }

  function removeSlide(id: string) {
    const slide = slides.find((item) => item.id === id);
    if (!slide) return;
    const meaningful = Boolean(slide.title.trim() || slide.body.trim() || slide.referenceUrl.trim());
    if (meaningful && !window.confirm(`Remove “${slide.title.trim() || "Untitled slide"}”? This discards its unsaved content.`)) return;
    const index = slides.findIndex((item) => item.id === id);
    const next = slides.filter((item) => item.id !== id);
    setSlides(next); setSelectedId(next[Math.min(index, next.length - 1)]?.id ?? "");
  }

  function moveSlide(offset: -1 | 1) {
    if (!selected) return;
    const target = selectedIndex + offset;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides]; [next[selectedIndex], next[target]] = [next[target], next[selectedIndex]]; setSlides(next);
  }

  const courseItems = useMemo(() => courseOutline, [courseOutline]);
  return <section className="lecture-editor" data-editor-panel={panel}>
    <header className="lecture-editor-toolbar">
      <nav aria-label="Lecture editor panels">{(["content", "preview", "review"] as const).map((item) => <button type="button" key={item} aria-current={panel === item ? "page" : undefined} onClick={() => setPanel(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}</nav>
      <span role="status">{dirty ? "Unsaved changes" : `Saved version ${view.version}`}</span>
      <button type="button" className="lecture-primary-action" disabled={busy || readOnly || !dirty || !validDraft} title={!validDraft ? "Check the lecture title, text limits and source addresses before saving" : undefined} onClick={() => void post("save")}>{busy ? "Working…" : "Save"}</button>
    </header>
    <fieldset className="lecture-editor-busy" disabled={busy}>
      <div className="lecture-editor-grid">
        <aside className="lecture-course-outline" aria-label="Course lesson outline"><h2>{view.courseTitle}</h2><p>Course outline</p><ol>{courseItems.map((item) => <li key={item.id}><a href={`/studio/workbooks/${encodeURIComponent(item.id)}/builder`} aria-current={item.id === view.id ? "page" : undefined}>{item.title}</a></li>)}</ol></aside>
        <aside className="lecture-slide-outline" aria-label="Slide outline"><header><div><h2>Slides</h2><small>{slides.length} total</small></div>{!readOnly && <button type="button" onClick={addSlide} disabled={slides.length >= 80}>Add</button>}</header>{slides.length ? <ol>{slides.map((slide, index) => <li key={slide.id}><button type="button" aria-current={slide.id === selectedId ? "step" : undefined} onClick={() => { setSelectedId(slide.id); setPanel("content"); }}><span>{index + 1}</span>{slide.title || "Untitled slide"}</button></li>)}</ol> : <p className="lecture-empty-note">Start with an empty draft or add the first slide.</p>}</aside>
        <section className="lecture-editor-main" aria-label="Selected lecture content">
          {view.published && <div className="lecture-published-state"><b>Published version {view.published.version}</b><span>{view.published.integrityHash}</span><small>{new Date(view.published.publishedAt).toLocaleString()}</small></div>}
          {panel === "content" && <div className="lecture-content-panel">
            <details className="lecture-details"><summary>Details</summary><label><span>Lecture title</span><input value={title} minLength={4} maxLength={160} aria-invalid={(title.trim().length < 4 || title.trim().length > 160) || undefined} onChange={(event) => setTitle(event.target.value)} disabled={readOnly} /></label></details>
            {incompleteDraft && <p className="lecture-draft-note">Incomplete slides can be saved as a draft. Add a title and content to every slide before requesting review.</p>}
            {selected ? <article className="lecture-slide-form"><header><div><small>Slide {selectedIndex + 1}</small><h2>{selected.title || "Untitled slide"}</h2></div>{!readOnly && <div><button type="button" onClick={() => moveSlide(-1)} disabled={selectedIndex === 0}>Move up</button><button type="button" onClick={() => moveSlide(1)} disabled={selectedIndex === slides.length - 1}>Move down</button><button type="button" className="lecture-danger" onClick={() => removeSlide(selected.id)}>Remove</button></div>}</header><label><span>Slide title</span><input value={selected.title} maxLength={160} onChange={(event) => updateSelected({ title: event.target.value })} disabled={readOnly} /></label><label><span>Content</span><textarea rows={12} value={selected.body} maxLength={5_000} onChange={(event) => updateSelected({ body: event.target.value })} disabled={readOnly} /></label><details><summary>Advanced · source reference</summary><label><span>Optional HTTPS source</span><input type="url" inputMode="url" placeholder="https://…" value={selected.referenceUrl} maxLength={1_000} onChange={(event) => updateSelected({ referenceUrl: event.target.value })} disabled={readOnly} aria-invalid={!referenceIsValid(selected.referenceUrl.trim()) || undefined} /></label>{!referenceIsValid(selected.referenceUrl.trim()) && <p className="lecture-field-error">Use a complete HTTPS address without embedded credentials.</p>}</details></article> : <div className="lecture-editor-empty"><h2>No slides yet</h2><p>A draft may remain empty. Add a complete slide before requesting review.</p>{!readOnly && <button type="button" onClick={addSlide}>Add first slide</button>}</div>}
          </div>}
          {panel === "preview" && <LecturePlayer title={title || "Untitled lecture"} slides={slides} version={view.status === "published" && !dirty ? view.version : undefined} />}
          {panel === "review" && <div className="lecture-review-panel"><header><p className="eyebrow">Revision-bound review</p><h2>{view.status.replaceAll("-", " ")}</h2><p>{reviewGuidance}</p></header><div className="lecture-review-actions">{view.canEdit && view.status !== "published" && <button type="button" disabled={dirty || !readyForReview} title={dirty ? "Save your changes before requesting review" : undefined} onClick={() => void post("request-review")}>Request review</button>}{view.canReview && view.status !== "published" && <form onSubmit={(event) => { event.preventDefault(); void post("review", { decision: reviewDecision, comment: reviewComment }); }}><label><span>Decision</span><select value={reviewDecision} onChange={(event) => setReviewDecision(event.target.value as typeof reviewDecision)}><option value="approved">Approve</option><option value="changes-requested">Request changes</option></select></label><label><span>Review comment</span><textarea required minLength={10} maxLength={2_000} value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} /></label><button>Record review</button></form>}{view.canPublish && view.status !== "published" && <button type="button" onClick={() => void post("publish")}>Publish approved version</button>}</div><ol className="lecture-review-history">{view.reviews.map((review, index) => <li key={`${review.createdAt}-${index}`}><b>{review.decision.replaceAll("-", " ")} · version {review.version}</b><span>{review.reviewerName} · {new Date(review.createdAt).toLocaleString()}</span><p>{review.comment}</p></li>)}</ol></div>}
        </section>
      </div>
    </fieldset>
    <footer className="lecture-editor-feedback"><button type="button" disabled={busy} onClick={() => void reload()}>Reload saved version</button>{notice && <p role={notice.kind === "error" ? "alert" : "status"} className={`lecture-feedback-${notice.kind}`}>{notice.text}</p>}</footer>
  </section>;
}
