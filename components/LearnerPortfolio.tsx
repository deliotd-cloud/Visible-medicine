"use client";

import { FormEvent, useState } from "react";

type Portfolio = {
  notes: Array<{ id: string; resourceType: string; resourceId: string; title: string; body: string; updatedAt: string }>;
  reviews: Array<{ id: string; resourceType: string; resourceId: string; title: string; prompt: string; dueAt: string; intervalDays: number; status: string; updatedAt: string }>;
  completions: Array<{ id: string; courseSlug: string; courseTitle: string; percentComplete: number; completedAt: string; status: string; certificateCode: string | null; certificateTitle: string | null; issuedAt: string | null; revokedAt: string | null }>;
};

function date(value: string) { return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }

export function LearnerPortfolio({ initialPortfolio }: { initialPortfolio: Portfolio }) {
  const [portfolio, setPortfolio] = useState(initialPortfolio);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function post(payload: Record<string, unknown>, success: string) {
    setBusy(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/learner/portfolio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as Portfolio & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "The learning record could not be updated.");
      setPortfolio(result); setMessage(success);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The learning record could not be updated."); }
    finally { setBusy(false); }
  }

  function addNote(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form)); void post({ action: "save-note", ...values }, "Private education note saved.").then(() => form.reset()); }
  function addReview(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form)); void post({ action: "schedule-review", ...values }, "Review item added to your learning queue.").then(() => form.reset()); }

  return <section className="portfolio-section">
    <header><div><p className="section-index">Learning record</p><h2>Notes, review & completion</h2><p>Your private education notes, spaced-review queue and completion evidence. Patient identifiers are blocked.</p></div><div className="portfolio-counts"><span><b>{portfolio.notes.length}</b> notes</span><span><b>{portfolio.reviews.length}</b> reviews</span><span><b>{portfolio.completions.length}</b> completions</span></div></header>
    {(message || error) && <p className={`portfolio-message ${error ? "error" : ""}`} role={error ? "alert" : "status"}>{error || message}</p>}
    <div className="portfolio-grid">
      <div className="portfolio-column"><h3>Private notes</h3><form onSubmit={addNote} className="portfolio-form">
        <div className="two-fields"><label><span>Resource type</span><select name="resourceType" defaultValue="atlas"><option value="atlas">Atlas</option><option value="course">Course</option><option value="case">Case</option><option value="workbook">Workbook</option></select></label><label><span>Resource ID</span><input name="resourceId" placeholder="ct-head" required /></label></div>
        <label><span>Note title</span><input name="title" required /></label><label><span>Private note</span><textarea name="body" required placeholder="Educational observations only—never patient identifiers." /></label><button disabled={busy}>Save private note</button>
      </form><div className="portfolio-list">{portfolio.notes.map((note) => <article key={note.id}><span>{note.resourceType} · {note.resourceId}</span><h4>{note.title}</h4><p>{note.body}</p><small>Updated {date(note.updatedAt)} · private</small></article>)}{!portfolio.notes.length && <p className="empty-control">No private notes yet.</p>}</div></div>
      <div className="portfolio-column"><h3>Spaced review queue</h3><form onSubmit={addReview} className="portfolio-form">
        <div className="two-fields"><label><span>Resource type</span><select name="resourceType" defaultValue="atlas"><option value="atlas">Atlas</option><option value="course">Course</option><option value="case">Case</option><option value="workbook">Workbook</option></select></label><label><span>Resource ID</span><input name="resourceId" placeholder="ct-head" required /></label></div>
        <label><span>Review title</span><input name="title" required /></label><label><span>Recall prompt</span><textarea name="prompt" required /></label><label><span>First interval</span><select name="intervalDays" defaultValue="7"><option value="1">Tomorrow</option><option value="3">3 days</option><option value="7">1 week</option><option value="14">2 weeks</option><option value="30">1 month</option></select></label><button disabled={busy}>Schedule review</button>
      </form><div className="portfolio-list review-list">{portfolio.reviews.map((review) => <article key={review.id}><span>Due {date(review.dueAt)} · {review.resourceType}</span><h4>{review.title}</h4><p>{review.prompt}</p><button disabled={busy} onClick={() => void post({ action: "complete-review", reviewId: review.id }, "Review completed; the next interval was doubled.")}>Reviewed today →</button></article>)}{!portfolio.reviews.length && <p className="empty-control">No review items scheduled.</p>}</div></div>
      <div className="portfolio-column completion-column"><h3>Completion records</h3><div className="portfolio-list">{portfolio.completions.map((completion) => <article className="completion-card" key={completion.id}><span>Completed {date(completion.completedAt)}</span><h4>{completion.courseTitle}</h4><p>100% platform completion recorded. This is not a clinical qualification or competency credential.</p>{completion.certificateCode && !completion.revokedAt ? <a href={`/certificates/${completion.certificateCode}`}>View completion record →</a> : <small>No active certificate</small>}</article>)}{!portfolio.completions.length && <p className="empty-control">Complete an eligible course to generate a verifiable education-only record.</p>}</div></div>
    </div>
  </section>;
}
