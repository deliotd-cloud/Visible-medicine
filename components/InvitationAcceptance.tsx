"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InvitationAcceptance({ token, organizationName, role, emailMatches }: { token: string; organizationName: string; role: string; emailMatches: boolean }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function accept() { setBusy(true); setError(""); try { const response = await fetch("/api/platform/people/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }); const result = await response.json() as { error?: string }; if (!response.ok) throw new Error(result.error ?? "The invitation could not be accepted."); router.push("/my-learning"); router.refresh(); } catch (caught) { setError(caught instanceof Error ? caught.message : "The invitation could not be accepted."); } finally { setBusy(false); } }
  return <section className="invitation-acceptance"><span>Institution invitation</span><h1>{organizationName}</h1><p>You have been invited with the education role <b>{role}</b>.</p>{emailMatches ? <button className="primary-button" disabled={busy} onClick={() => void accept()}>{busy ? "Accepting…" : "Accept institution invitation"}<span>→</span></button> : <p className="form-error">Sign in with the email address named on the invitation.</p>}{error && <p className="form-error" role="alert">{error}</p>}<small>This grants education-platform access only. It provides no clinical Didanix identity or patient-data access.</small></section>;
}
