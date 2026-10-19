"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { registerLearningDraftGuard } from "../lib/learning-draft-navigation.ts";

type Portfolio = {
  notes: Array<{ id: string; resourceType: string; resourceId: string; title: string; body: string; updatedAt: string }>;
  reviews: Array<{ id: string; resourceType: string; resourceId: string; title: string; prompt: string; dueAt: string; intervalDays: number; status: string; updatedAt: string }>;
  completions: Array<{ id: string; courseSlug: string; courseTitle: string; percentComplete: number; completedAt: string; status: string; certificateCode: string | null; certificateTitle: string | null; issuedAt: string | null; revokedAt: string | null }>;
};

type LearningResource = { resourceType: "atlas" | "course" | "case" | "workbook"; resourceId: string; label: string };

function confirmedPortfolio(value: unknown): value is Portfolio {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  const strings = (row: unknown, keys: string[]): row is Record<string, unknown> =>
    !!row && typeof row === "object" && !Array.isArray(row) && keys.every(key => typeof (row as Record<string, unknown>)[key] === "string");
  return Array.isArray(data.notes) && data.notes.every(row => strings(row, ["id", "resourceType", "resourceId", "title", "body", "updatedAt"])) &&
    Array.isArray(data.reviews) && data.reviews.every(row => strings(row, ["id", "resourceType", "resourceId", "title", "prompt", "dueAt", "status", "updatedAt"]) && Number.isFinite(row.intervalDays)) &&
    Array.isArray(data.completions) && data.completions.every(row => strings(row, ["id", "courseSlug", "courseTitle", "completedAt", "status"]) && Number.isFinite(row.percentComplete) &&
      ["certificateCode", "certificateTitle", "issuedAt", "revokedAt"].every(key => row[key] === null || typeof row[key] === "string"));
}

function date(value: string) { return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }

export function LearnerPortfolio({ initialPortfolio, resources }: { initialPortfolio: Portfolio; resources: LearningResource[] }) {
  const [portfolio, setPortfolio] = useState(initialPortfolio);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const saving = useRef(false);
  const draftRoot = useRef<HTMLElement | null>(null);
  const draftGuard = useRef<ReturnType<typeof registerLearningDraftGuard> | null>(null);

  useEffect(() => {
    const guard = registerLearningDraftGuard(window, () => {
    if (saving.current) return true;
    // Read mounted forms at the point of navigation; closed disclosures retain
    // drafts, and neither form text nor private records go into browser storage.
    for (const form of draftRoot.current?.querySelectorAll<HTMLFormElement>("form.portfolio-form") ?? []) {
      const fields = Object.fromEntries(new FormData(form));
      if ([fields.title, fields.body, fields.prompt].some(value => typeof value === "string" && value.length > 0)) return true;
    }
    return false;
    });
    draftGuard.current = guard;
    return () => { guard(); draftGuard.current = null; };
  }, []);

  async function post(payload: Record<string, unknown>, success: string) {
    // State alone cannot prevent a second submit before React commits a render.
    if (saving.current) return false;
    saving.current = true;
    draftGuard.current?.refresh();
    setBusy(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/learner/portfolio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as Portfolio & { error?: string };
      if (!response.ok) throw new Error(result?.error ?? "The learning record could not be updated.");
      if (!confirmedPortfolio(result)) {
        throw new Error("The save response could not be confirmed. Your draft has been kept. Check your learning record before retrying.");
      }
      setPortfolio(result); setMessage(success);
      return true;
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The learning record could not be updated."); return false; }
    finally { saving.current = false; draftGuard.current?.refresh(); setBusy(false); }
  }

  function valuesWithResource(fields: Record<string, FormDataEntryValue>) {
    const values = { ...fields };
    const [resourceType, ...resourceIdParts] = String(values.resource ?? "atlas::ct-head").split("::");
    delete values.resource;
    return { ...values, resourceType, resourceId: resourceIdParts.join("::") };
  }

  async function saveDraft(form: HTMLFormElement, action: "save-note" | "schedule-review", success: string) {
    const fields = Object.fromEntries(new FormData(form));
    const submitted = JSON.stringify(fields);
    if (!await post({ action, ...valuesWithResource(fields) }, success)) return;
    if (JSON.stringify(Object.fromEntries(new FormData(form))) === submitted) form.reset();
    else setMessage(`${success} Newer edits are still unsaved.`);
    draftGuard.current?.refresh();
  }

  function addNote(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void saveDraft(event.currentTarget, "save-note", "Private education note saved."); }
  function addReview(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void saveDraft(event.currentTarget, "schedule-review", "Review item added to your learning queue."); }

  return <section className="portfolio-section" id="learning-record" ref={draftRoot}>
    <header><div><p className="section-index">Learning record</p><h2>Notes, revision & completion</h2><p>Education only. Keep patient names, identifiers and clinical details out of notes and recall prompts.</p></div><div className="portfolio-counts"><span><b>{portfolio.notes.length}</b> notes</span><span><b>{portfolio.reviews.length}</b> reviews</span><span><b>{portfolio.completions.length}</b> completions</span></div></header>
    {(message || error) && <p className={`portfolio-message ${error ? "error" : ""}`} role={error ? "alert" : "status"}>{error || message}</p>}
    <div className="portfolio-grid">
      <div className="portfolio-column"><h3 id="notes">Private notes</h3><details className="portfolio-compose"><summary>Write a note</summary><form onSubmit={addNote} className="portfolio-form">
        <label><span>Learning resource</span><select name="resource" defaultValue={`${resources[0]?.resourceType ?? "atlas"}::${resources[0]?.resourceId ?? "ct-head"}`}>{resources.map((resource) => <option value={`${resource.resourceType}::${resource.resourceId}`} key={`${resource.resourceType}:${resource.resourceId}`}>{resource.label}</option>)}</select></label>
        <label><span>Note title</span><input name="title" required /></label><label><span>Private note</span><textarea name="body" required placeholder="Educational observations only—never patient identifiers." /></label><button disabled={busy}>Save private note</button>
      </form></details><div className="portfolio-list">{portfolio.notes.map((note) => <article key={note.id}><span>{note.resourceType} · {note.resourceId}</span><h4>{note.title}</h4><p>{note.body}</p><small>Updated {date(note.updatedAt)} · private</small></article>)}{!portfolio.notes.length && <p className="empty-control">No private notes yet.</p>}</div></div>
      <div className="portfolio-column"><h3 id="revision">Spaced revision queue</h3><details className="portfolio-compose"><summary>Schedule revision</summary><form onSubmit={addReview} className="portfolio-form">
        <label><span>Learning resource</span><select name="resource" defaultValue={`${resources[0]?.resourceType ?? "atlas"}::${resources[0]?.resourceId ?? "ct-head"}`}>{resources.map((resource) => <option value={`${resource.resourceType}::${resource.resourceId}`} key={`${resource.resourceType}:${resource.resourceId}`}>{resource.label}</option>)}</select></label>
        <label><span>Review title</span><input name="title" required /></label><label><span>Recall prompt</span><textarea name="prompt" required /></label><label><span>First interval</span><select name="intervalDays" defaultValue="7"><option value="1">Tomorrow</option><option value="3">3 days</option><option value="7">1 week</option><option value="14">2 weeks</option><option value="30">1 month</option></select></label><button disabled={busy}>Schedule review</button>
      </form></details><div className="portfolio-list review-list">{portfolio.reviews.map((review) => <article key={review.id}><span>Due {date(review.dueAt)} · {review.resourceType}</span><h4>{review.title}</h4><p>{review.prompt}</p><button disabled={busy} onClick={() => void post({ action: "complete-review", reviewId: review.id }, "Review completed; the next interval was doubled.")}>Reviewed today →</button></article>)}{!portfolio.reviews.length && <p className="empty-control">No review items scheduled.</p>}</div></div>
      <div className="portfolio-column completion-column"><h3 id="completions">Completion records</h3><div className="portfolio-list">{portfolio.completions.map((completion) => <article className="completion-card" key={completion.id}><span>Completed {date(completion.completedAt)}</span><h4>{completion.courseTitle}</h4><p>100% platform completion recorded. This is not a clinical qualification or competency credential.</p>{completion.certificateCode && !completion.revokedAt ? <a href={`/certificates/${completion.certificateCode}`}>View completion record →</a> : <small>No active certificate</small>}</article>)}{!portfolio.completions.length && <p className="empty-control">Complete an eligible course to generate a verifiable education-only record.</p>}</div></div>
    </div>
  </section>;
}
