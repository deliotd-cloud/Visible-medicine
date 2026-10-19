"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { InvitationForm } from "./StudioForms";
import type { StudioDraftScope } from "../lib/studio-draft-scope";
import type { StudioInvitation, StudioInvitationCursor, StudioInvitationPage } from "../lib/education-platform";
import { StudioMutationContextError, verifyStudioMutationContext } from "../lib/studio-mutation-context";
import { parseStudioInvitationPage, isStudioInvitationRevocation } from "../lib/studio-invitation-response";
import { INVITATION_SELF_ENROLMENT_ENABLED, INVITATION_SELF_ENROLMENT_HOLD_MESSAGE } from "../lib/course-enrolment-policy";

type Props = { releaseId: string; recoveryScope: StudioDraftScope; canCreate: boolean };
const refreshMessage = "Refresh the ledger to check the saved invitation status before another action. One-time codes cannot be recovered here.";
const formatDate = (value: string) => new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export function CourseInvitationPanel(props: Props) {
  const [open, setOpen] = useState(false), [activated, setActivated] = useState(false);
  return <details className="release-invitation-panel" onToggle={event => {
    const next = event.currentTarget.open; setOpen(next); if (next) setActivated(true);
  }}><summary>Invitations · manage access codes</summary>
    {activated && <InvitationLedger {...props} enabled={open} />}
  </details>;
}

export function InvitationLedger({ releaseId, recoveryScope, canCreate, enabled }: Props & { enabled: boolean }) {
  const source = JSON.stringify([releaseId, recoveryScope?.actorId, recoveryScope?.organizationId]);
  const bound = useRef({ source, releaseId, recoveryScope });
  const lifecycle = useRef({ mounted: true, token: 0, retired: false, busy: false, controller: null as AbortController | null });
  const [page, setPage] = useState<StudioInvitationPage | null>(null), [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false), [retired, setRetired] = useState(false), [uncertain, setUncertain] = useState(false);
  const [message, setMessage] = useState("");
  const [cursors, setCursors] = useState<Array<StudioInvitationCursor | null>>([null]);
  const cursorRef = useRef<Array<StudioInvitationCursor | null>>([null]);
  const currentSource = useRef(source); currentSource.current = source;
  const currentEnabled = useRef(enabled); currentEnabled.current = enabled;
  const live = () => lifecycle.current.mounted && !lifecycle.current.retired && currentSource.current === bound.current.source && currentEnabled.current;
  function invalidate() { lifecycle.current.token++; lifecycle.current.controller?.abort(); lifecycle.current.controller = null; }
  function retire() {
    if (!lifecycle.current.mounted) return;
    lifecycle.current.retired = true; invalidate(); setRetired(true); setPage(null); setMessage("Studio context changed. Reload Studio to view invitations.");
  }
  function contextFailure(error: unknown) {
    if (error instanceof StudioMutationContextError && error.reason === "changed") { retire(); return; }
    setPage(null); setMessage("The invitation ledger could not be checked. Refresh it to retry.");
  }
  async function load(nextCursors = cursorRef.current) {
    if (!live() || lifecycle.current.busy) return;
    invalidate(); const token = lifecycle.current.token, controller = new AbortController(); lifecycle.current.controller = controller;
    setPage(null); setLoading(true); setMessage("");
    const valid = () => live() && token === lifecycle.current.token;
    try {
      await verifyStudioMutationContext(bound.current.recoveryScope); if (!valid()) return;
      const query = new URLSearchParams({ releaseId: bound.current.releaseId }), cursor = nextCursors.at(-1);
      if (cursor) { query.set("beforeCreatedAt", cursor.createdAt); query.set("beforeId", cursor.id); }
      const response = await fetch(`/api/studio-invitations?${query}`, { credentials: "same-origin", cache: "no-store", signal: controller.signal,
        headers: { "X-Studio-Mutation-Context": JSON.stringify(bound.current.recoveryScope) } });
      const body: unknown = await response.json();
      await verifyStudioMutationContext(bound.current.recoveryScope); if (!valid()) return;
      if (response.status === 401 || response.status === 409 && (body as { code?: string })?.code === "STUDIO_CONTEXT_CHANGED") throw new StudioMutationContextError();
      const parsed = response.ok ? parseStudioInvitationPage(body, bound.current.releaseId) : null;
      if (!parsed) throw new Error("Invalid invitation metadata response");
      cursorRef.current = nextCursors; setCursors(nextCursors); setPage(parsed); setUncertain(false);
    } catch (error) { if (valid()) contextFailure(error); }
    finally { if (valid()) setLoading(false); }
  }
  useLayoutEffect(() => {
    lifecycle.current.mounted = true;
    return () => { lifecycle.current.mounted = false; invalidate(); };
  }, []);
  useLayoutEffect(() => { if (source !== bound.current.source) retire(); }, [source]);
  useEffect(() => {
    if (enabled) void load();
    else { invalidate(); setPage(null); setLoading(false); }
    return invalidate;
  }, [enabled]);

  async function revoke(invitation: StudioInvitation) {
    if (!live() || loading || lifecycle.current.busy || uncertain || !page || invitation.status !== "active") return;
    if (!window.confirm(`Revoke “${invitation.label}”? This stops future code uses only. Existing enrolments and attempts will not change.`) || !live()) return;
    lifecycle.current.busy = true; setBusy(true); setMessage(""); invalidate(); const token = lifecycle.current.token;
    const valid = () => live() && token === lifecycle.current.token;
    let sent = false;
    try {
      await verifyStudioMutationContext(bound.current.recoveryScope); if (!valid()) return;
      sent = true;
      const response = await fetch("/api/studio-invitations", { method: "POST", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke-course-invitation", releaseId: bound.current.releaseId, invitationId: invitation.id, expectedCreatedAt: invitation.createdAt, expectedStudioContext: bound.current.recoveryScope }) });
      const body: unknown = await response.json();
      await verifyStudioMutationContext(bound.current.recoveryScope); if (!valid()) return;
      if (response.status === 401 || response.status === 409 && (body as { code?: string })?.code === "STUDIO_CONTEXT_CHANGED") throw new StudioMutationContextError();
      if (!response.ok || !isStudioInvitationRevocation(body, invitation.id)) throw new Error("Unconfirmed revocation");
      lifecycle.current.busy = false; setBusy(false); await load();
      if (live()) setMessage("Revocation confirmed. Existing enrolments and attempts are unchanged.");
    } catch (error) {
      if (!valid()) return;
      if (sent) { setUncertain(true); setPage(null); setMessage(refreshMessage); }
      if (error instanceof StudioMutationContextError && error.reason === "changed") retire();
      else if (!sent) contextFailure(error);
    } finally { if (lifecycle.current.mounted) { lifecycle.current.busy = false; setBusy(false); } }
  }
  const hidden = retired || source !== bound.current.source;
  return <section className="studio-invitation-ledger" aria-label="Course invitation ledger" aria-busy={loading || busy}>
    {!INVITATION_SELF_ENROLMENT_ENABLED && <p className="studio-quiet-state">{INVITATION_SELF_ENROLMENT_HOLD_MESSAGE}</p>}
    <p>Codes are shown once when created, never in this ledger. Revocation stops future uses only.</p>
    <div hidden={hidden || !canCreate}><details><summary>Create a new invitation</summary><InvitationForm releaseId={bound.current.releaseId} recoveryScope={bound.current.recoveryScope} /></details></div>
    {!hidden && <div className="studio-invitation-tools"><button type="button" disabled={loading || busy} onClick={() => void load([null])}>Refresh latest invitations</button>
      <span>{page ? `Page ${cursors.length} · checked ${formatDate(page.checkedAt)}` : loading ? "Checking invitations…" : "No verified ledger loaded"}</span></div>}
    {message && <p role="status">{message}</p>}
    {!hidden && page && <><ul className="studio-invitation-list">{page.invitations.map(invitation => {
      const status = invitation.status !== "active" ? invitation.status : Date.parse(invitation.expiresAt) <= Date.parse(page.checkedAt) ? "expired" : invitation.uses >= invitation.maxUses ? "fully used" : "active";
      return <li key={invitation.id}><div><b>{invitation.label}</b><span className="status-badge">{status}</span><small>{invitation.uses} / {invitation.maxUses} uses · expires {formatDate(invitation.expiresAt)}</small><small>Created {formatDate(invitation.createdAt)}</small></div>
        {invitation.status === "active" && <button type="button" disabled={busy || loading || uncertain} aria-label={`Revoke ${invitation.label}`} onClick={() => void revoke(invitation)}>Revoke</button>}</li>;
    })}</ul>{!page.invitations.length && <p>No invitations on this page.</p>}
      <nav aria-label="Invitation pages"><button type="button" disabled={busy || loading || cursors.length === 1} onClick={() => void load(cursorRef.current.slice(0, -1))}>Previous page</button>
        <button type="button" disabled={busy || loading || !page.nextCursor} onClick={() => { if (page.nextCursor) void load([...cursorRef.current, page.nextCursor]); }}>Next page</button></nav></>}
  </section>;
}
