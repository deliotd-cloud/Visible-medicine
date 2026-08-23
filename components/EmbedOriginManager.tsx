"use client";

import { FormEvent, useState } from "react";

type Origin = { origin: string; status: string };

export function EmbedOriginManager({ initialOrigins, enabled }: { initialOrigins: Origin[]; enabled: boolean }) {
  const [origins, setOrigins] = useState(initialOrigins);
  const [origin, setOrigin] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/platform/embed-origins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ origin }) });
      const result = await response.json() as { origins?: Origin[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "The origin could not be saved.");
      setOrigins(result.origins ?? []); setOrigin(""); setMessage("Origin recorded for evaluation. Production activation remains gated.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "The origin could not be saved."); }
    finally { setBusy(false); }
  }

  return <div className="embed-origin-manager"><div><p className="section-index">Approved embed origins</p><h2>Control where a course may appear.</h2><p>Only exact HTTPS origins are accepted. Adding an origin records evaluation approval; it does not activate public embedding or issue a launch token.</p></div><div><form onSubmit={submit}><label htmlFor="embed-origin">Institution origin</label><div><input id="embed-origin" name="origin" type="url" inputMode="url" placeholder="https://learn.example.edu" value={origin} onChange={(event) => setOrigin(event.target.value)} disabled={!enabled || busy} required /><button type="submit" disabled={!enabled || busy}>{busy ? "Saving…" : "Record origin"}</button></div></form>{message && <p className="embed-manager-message" role="status">{message}</p>}<ul>{origins.length ? origins.map((item) => <li key={item.origin}><b>{item.origin}</b><span>{item.status}</span></li>) : <li><span>No origins recorded yet</span></li>}</ul></div></div>;
}
