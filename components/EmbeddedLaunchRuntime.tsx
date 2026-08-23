"use client";

import { useEffect, useState } from "react";

type Session = { resourceType: string; resourceId: string; audience: string; origin: string; evaluation: boolean; intendedUse: string };

export function EmbeddedLaunchRuntime({ token }: { token: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    function receive(event: MessageEvent) {
      if (!event.data || event.data.type !== "ELIVION_EDUCATION_LAUNCH") return;
      void fetch("/api/embed/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, parentOrigin: event.origin }) }).then(async (response) => {
        const result = await response.json() as { session?: Session; error?: string };
        if (!response.ok || !result.session) throw new Error(result.error ?? "Launch validation failed.");
        setSession(result.session); setError("");
        if (event.source && "postMessage" in event.source) event.source.postMessage({ type: "ELIVION_EDUCATION_ACCEPTED", resource: result.session.resourceId }, { targetOrigin: event.origin });
      }).catch((caught) => setError(caught instanceof Error ? caught.message : "Launch validation failed."));
    }
    window.addEventListener("message", receive);
    if (window.parent !== window) window.parent.postMessage({ type: "ELIVION_EDUCATION_READY" }, "*");
    return () => window.removeEventListener("message", receive);
  }, [token]);

  if (!token) return <div className="embed-runtime-state"><h1>Launch token required</h1><p>Open this route through an approved institution launch.</p></div>;
  if (error) return <div className="embed-runtime-state error"><h1>Launch blocked</h1><p>{error}</p><small>For education and research only.</small></div>;
  if (!session) return <div className="embed-runtime-state"><span className="embed-pulse" /><h1>Waiting for the approved host</h1><p>The course remains locked until the parent site completes the origin-bound handshake.</p><small>Signed launch · five-minute expiry · education/research only</small></div>;
  return <div className="embed-runtime-state accepted"><span>Elivion Education embedded session</span><h1>{session.resourceId}</h1><p>{session.resourceType} · {session.audience}</p><a href={`/learn?${session.resourceType === "workbook" ? "workbook" : "source"}=${encodeURIComponent(session.resourceId)}`}>Open governed learning runtime →</a><small>{session.evaluation ? "Evaluation launch" : "Institution launch"} · no diagnostic use</small></div>;
}
