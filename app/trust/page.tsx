import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Trust centre", description: "Visible Medicine intended use, content governance, privacy, accessibility and clinical separation." };

const controls = [
  ["Intended use", "Education and non-clinical research only. No diagnosis, reporting, patient care or treatment decisions."],
  ["Content provenance", "Every publishable resource retains source, rights, de-identification, version and review evidence."],
  ["Identity and tenancy", "Education identities, organisation roles and entitlements are separate from all clinical Didanix identities."],
  ["Assessment integrity", "Published assessments use immutable manifests, server-authoritative timing, auditable submissions and controlled result release."],
  ["Accessibility", "The learning runtime includes text sizing, contrast, target-size, reduced-motion and keyboard support; formal independent WCAG 2.2 AA assurance and quantified Core Web Vitals remain release gates."],
  ["Corrections and withdrawal", "Published education content requires accountable correction, supersession and urgent-withdrawal procedures before public release."],
];

export default function TrustPage() {
  return <main className="inner-page trust-page"><section className="page-hero trust-page-hero"><p className="eyebrow"><span /> Trust centre</p><h1>Education with an explicit boundary.</h1><p>How Visible Medicine separates teaching from clinical care and turns medical-content publication into a governed process.</p></section><section className="trust-grid">{controls.map(([title, body], index) => <article key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{body}</p></article>)}</section><section className="clinical-separation"><div><p className="section-index">Separate product systems</p><h2>Visible Medicine is not Didanix PACS.</h2></div><p>No patient worklist, clinical archive, diagnostic reporting, clinical identity, clinical entitlement or clinical release process is exposed through this platform.</p></section><section className="trust-actions"><Link className="primary-button" href="/research">Research framework <span>→</span></Link><Link className="outline-button" href="/institutions">Institution controls <span>→</span></Link></section></main>;
}
