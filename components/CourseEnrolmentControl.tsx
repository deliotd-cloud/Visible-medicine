"use client";

import Link from "next/link";
import { useState } from "react";

type Props = { releaseId: string; slug: string; accessModel: string; enrolled: boolean; firstWorkbookId: string | null; signedIn: boolean; enrolmentOpen: boolean; invitationCode?: string };

export function CourseEnrolmentControl({ releaseId, slug, accessModel, enrolled, firstWorkbookId, signedIn, enrolmentOpen, invitationCode: initialInvitationCode = "" }: Props) {
  const [invitationCode, setInvitationCode] = useState(initialInvitationCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const learningHref = firstWorkbookId ? `/learn/${slug}/${encodeURIComponent(firstWorkbookId)}` : "/my-learning";
  if (enrolled) return <div className="course-enrolment-control"><Link className="primary-button" href={learningHref}>Continue course <span>→</span></Link><small>Available in My Learning</small></div>;
  if (!signedIn) return <div className="course-enrolment-control"><Link className="primary-button" href={`/join?course=${encodeURIComponent(slug)}`}>Create learner profile <span>→</span></Link><small>Sign in, complete your education profile and enrol.</small></div>;
  if (!enrolmentOpen) return <div className="course-enrolment-control"><button className="primary-button" disabled>Enrolment closed</button></div>;
  if (accessModel === "paid") return <div className="course-enrolment-control"><button className="primary-button" disabled>Checkout coming after private evaluation</button><small>No payment will be taken on this preview.</small></div>;

  async function enrol() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/learner/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "enrol", releaseId, invitationCode }) });
      const result = await response.json() as { error?: string; enrolment?: { slug: string; workbookId: string | null } };
      if (!response.ok) throw new Error(result.error ?? "You could not be enrolled in this course.");
      window.location.assign(result.enrolment?.workbookId ? `/learn/${result.enrolment.slug}/${encodeURIComponent(result.enrolment.workbookId)}` : "/my-learning");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "You could not be enrolled in this course."); }
    finally { setBusy(false); }
  }

  return <div className="course-enrolment-control">
    {accessModel === "invitation" && <label><span>Invitation code</span><input value={invitationCode} onChange={(event) => setInvitationCode(event.target.value)} placeholder="ELV-…" /></label>}
    <button className="primary-button" disabled={busy || (accessModel === "invitation" && !invitationCode.trim())} onClick={() => void enrol()}>{busy ? "Enrolling…" : accessModel === "institution" ? "Join with institution access" : accessModel === "invitation" ? "Accept invitation" : "Enrol for free"}<span>→</span></button>
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>;
}
