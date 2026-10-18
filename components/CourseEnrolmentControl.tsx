"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { INVITATION_SELF_ENROLMENT_ENABLED, INVITATION_SELF_ENROLMENT_HOLD_MESSAGE } from "@/lib/course-enrolment-policy";

type Props = { releaseId: string; slug: string; accessModel: string; enrolled: boolean; firstWorkbookId: string | null; signedIn: boolean; profileComplete?: boolean; enrolmentOpen: boolean; invitationCode?: string };

export function CourseEnrolmentControl({ releaseId, slug, accessModel, enrolled, firstWorkbookId, signedIn, profileComplete = false, enrolmentOpen, invitationCode: initialInvitationCode = "" }: Props) {
  const binding = JSON.stringify([releaseId, slug, accessModel, enrolled, firstWorkbookId, signedIn, profileComplete, enrolmentOpen, initialInvitationCode]);
  const [codeDraft, setCodeDraft] = useState({binding, value: initialInvitationCode});
  const invitationCode = codeDraft.binding === binding ? codeDraft.value : initialInvitationCode;
  const [, repaint] = useState(0);
  const [error, setError] = useState("");
  const current = useRef({binding});
  const lifecycle = useRef({epoch: 0, mounted: true, setup: false});
  const pending = useRef<{visit: object} | null>(null), completed = useRef<{visit: object; href: string} | null>(null), feedback = useRef<object | null>(null);
  if (current.current.binding !== binding) { current.current = {binding}; pending.current = null; completed.current = null; }
  const visit = current.current, epoch = lifecycle.current.epoch;
  const isCurrent = () => current.current === visit && lifecycle.current.mounted && lifecycle.current.epoch === epoch;
  useEffect(() => {
    if (lifecycle.current.setup) { lifecycle.current.epoch++; repaint(value => value + 1); }
    lifecycle.current.setup = true; lifecycle.current.mounted = true;
    return () => { lifecycle.current.mounted = false; lifecycle.current.epoch++; };
  }, []);
  const busy = pending.current?.visit === visit;
  const activeError = feedback.current === visit ? error : "";
  const confirmedHref = completed.current?.visit === visit ? completed.current.href : null;
  const learningHref = firstWorkbookId ? `/learn/${slug}/${encodeURIComponent(firstWorkbookId)}` : "/my-learning";
  if (enrolled || confirmedHref) return <div className="course-enrolment-control"><Link className="primary-button" href={confirmedHref ?? learningHref}>Continue course <span>→</span></Link><small>Available in My Learning</small></div>;
  if (accessModel === "invitation" && !INVITATION_SELF_ENROLMENT_ENABLED) return <div className="course-enrolment-control"><button className="primary-button" disabled>Invitation enrolment unavailable</button><small>{INVITATION_SELF_ENROLMENT_HOLD_MESSAGE}</small></div>;
  if (!signedIn) return <div className="course-enrolment-control"><Link className="primary-button" href={`/join?course=${encodeURIComponent(slug)}`}>Create learner profile <span>→</span></Link><small>Sign in, complete your education profile and enrol.</small></div>;
  if (!profileComplete) return <div className="course-enrolment-control"><Link className="primary-button" href={`/onboarding?returnTo=${encodeURIComponent(`/courses/${slug}`)}`}>Complete learner profile <span>→</span></Link><small>Review your profile, education terms and privacy notice before enrolling.</small></div>;
  if (!enrolmentOpen) return <div className="course-enrolment-control"><button className="primary-button" disabled>Enrolment closed</button></div>;
  if (accessModel === "paid") return <div className="course-enrolment-control"><button className="primary-button" disabled>Checkout coming after private evaluation</button><small>No payment will be taken on this preview.</small></div>;
  const validTarget = /^[a-z0-9-]{1,80}$/.test(slug) && releaseId.length > 0 && releaseId.length <= 120 && releaseId.trim() === releaseId && !/[\u0000-\u001f\u007f]/.test(releaseId);
  if (!validTarget || !new Set(["free", "institution", "invitation"]).has(accessModel)) return <div className="course-enrolment-control"><button className="primary-button" disabled>Enrolment unavailable</button><small>Refresh this course before trying again.</small></div>;

  async function enrol() {
    if (!isCurrent() || pending.current || completed.current?.visit === visit || !validTarget || enrolled || !signedIn || !profileComplete || !enrolmentOpen ||
        !new Set(["free", "institution", "invitation"]).has(accessModel) ||
        (accessModel === "invitation" && (!INVITATION_SELF_ENROLMENT_ENABLED || !invitationCode.trim()))) return;
    const request = {visit};
    pending.current = request; feedback.current = visit; repaint(value => value + 1); setError("");
    try {
      const response = await fetch("/api/learner/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "enrol", releaseId, invitationCode }) });
      let body: unknown;
      try { body = await response.json(); } catch { body = null; }
      if (!isCurrent()) return;
      const result = body !== null && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : null;
      if (!response.ok) throw new Error(typeof result?.error === "string" && result.error ? result.error : "You could not be enrolled in this course.");
      const record = result?.enrolment;
      const enrolment = record !== null && typeof record === "object" && !Array.isArray(record) ? record as Record<string, unknown> : null;
      const workbookId = enrolment?.workbookId;
      if (!result || Object.hasOwn(result, "error") || !enrolment || Object.hasOwn(enrolment, "error") || enrolment.slug !== slug || !/^[a-z0-9-]{1,80}$/.test(slug) ||
          !(workbookId === null || (typeof workbookId === "string" && workbookId.length > 0 && workbookId.length <= 200 && workbookId !== "." && workbookId !== ".." && workbookId.trim() === workbookId && !/[\u0000-\u001f\u007f]/.test(workbookId)))) {
        throw new Error("Your enrolment could not be confirmed. Check My Learning before trying again.");
      }
      const href = workbookId === null ? "/my-learning" : `/learn/${slug}/${encodeURIComponent(String(workbookId))}`;
      completed.current = {visit, href};
      window.location.assign(href);
    } catch (caught) { if (isCurrent()) setError(caught instanceof Error ? caught.message : "You could not be enrolled in this course."); }
    finally {
      if (pending.current === request) {
        pending.current = null;
        if (current.current === visit && lifecycle.current.mounted) repaint(value => value + 1);
      }
    }
  }

  return <div className="course-enrolment-control">
    {accessModel === "invitation" && <label><span>Invitation code</span><input value={invitationCode} disabled={busy} onChange={(event) => { if (isCurrent() && !pending.current) setCodeDraft({binding, value: event.target.value}); }} placeholder="ELV-…" /></label>}
    <button className="primary-button" disabled={busy || !new Set(["free", "institution", "invitation"]).has(accessModel) || (accessModel === "invitation" && !invitationCode.trim())} onClick={() => void enrol()}>{busy ? "Enrolling…" : accessModel === "institution" ? "Join with institution access" : accessModel === "invitation" ? "Accept invitation" : "Enrol for free"}<span>→</span></button>
    {activeError && <p className="form-error" role="alert">{activeError}</p>}
  </div>;
}
