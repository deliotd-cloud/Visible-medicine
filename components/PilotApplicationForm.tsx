"use client";

import { FormEvent, useState } from "react";

export function PilotApplicationForm() {
  const [busy, setBusy] = useState(false); const [result, setResult] = useState<{ id: string; status: string } | null>(null); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setResult(null);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/institutions/pilot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
      const body = await response.json() as { id?: string; status?: string; error?: string };
      if (!response.ok || !body.id) throw new Error(body.error ?? "The pilot brief could not be recorded.");
      setResult({ id: body.id, status: body.status ?? "submitted" }); event.currentTarget.reset();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The pilot brief could not be recorded."); }
    finally { setBusy(false); }
  }
  if (result) return <div className="pilot-application-success" role="status"><span>Brief recorded</span><h2>Your controlled-pilot request is ready for review.</h2><p>Reference <b>{result.id.slice(0, 8).toUpperCase()}</b>. No contract, account activation, email or payment has been created.</p><button onClick={() => setResult(null)}>Submit another brief</button></div>;
  return <form className="pilot-application-form" onSubmit={submit}><div className="two-fields"><label><span>Organisation</span><input name="organizationName" required /></label><label><span>Jurisdiction</span><input name="jurisdiction" placeholder="United Kingdom" required /></label></div><div className="two-fields"><label><span>Contact name</span><input name="contactName" required /></label><label><span>Contact email</span><input name="contactEmail" type="email" required /></label></div><div className="two-fields"><label><span>Active learner band</span><select name="learnerBand" defaultValue="up-to-100"><option value="up-to-50">Up to 50</option><option value="up-to-100">Up to 100</option><option value="up-to-250">Up to 250</option><option value="up-to-500">Up to 500</option><option value="500-plus">More than 500</option></select></label><label><span>Educator/admin band</span><select name="educatorBand" defaultValue="up-to-10"><option value="up-to-5">Up to 5</option><option value="up-to-10">Up to 10</option><option value="up-to-25">Up to 25</option><option value="25-plus">More than 25</option></select></label></div><label><span>Proposed content scope</span><textarea name="contentScope" minLength={20} placeholder="For example: normal CT head anatomy and two private teaching workbooks using publication-cleared images." required /></label><label><span>Pilot goals and success measures</span><textarea name="goals" minLength={20} placeholder="What should learners, educators and the institution be able to demonstrate by the end of the pilot?" required /></label><label><span>Identity, LMS, accessibility or support needs</span><textarea name="supportNeeds" placeholder="Configuration only at this stage—do not include credentials or patient information." /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? "Recording brief…" : "Record controlled-pilot brief"}<span>→</span></button><small>No services are activated and no payment is taken.</small></form>;
}
