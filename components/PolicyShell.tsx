import Link from "next/link";
import type { ReactNode } from "react";

export function PolicyShell({ title, summary, children }: { title: string; summary: string; children: ReactNode }) {
  return <main className="inner-page policy-page"><section className="policy-hero"><p className="eyebrow"><span /> Draft for controlled pilot review</p><h1>{title}</h1><p>{summary}</p><div className="policy-status"><b>Not yet approved for public launch</b><span>Legal entity, contacts, jurisdictional wording and effective date require accountable approval.</span></div></section><article className="policy-content">{children}</article><nav className="policy-nav" aria-label="Policy pages"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/acceptable-use">Acceptable use</Link><Link href="/accessibility">Accessibility</Link><Link href="/trust">Trust centre</Link></nav></main>;
}
