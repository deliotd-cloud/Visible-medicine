import type { Metadata } from "next";
import { PilotApplicationForm } from "@/components/PilotApplicationForm";

export const metadata: Metadata = { title: "Plan an institutional pilot", description: "Prepare a bounded, non-live Visible Medicine institutional pilot brief.", robots: { index: false, follow: false } };

export default function InstitutionPilotPage() {
  return <main className="inner-page pilot-page"><section className="page-hero pilot-page-hero"><p className="eyebrow"><span /> Controlled institutional pilot</p><h1>Define the pilot before activating the platform.</h1><p>Record the intended learners, educators, jurisdiction, content and success measures. This creates a reviewable brief—not an account, contract, deployment or payment.</p></section><section className="pilot-page-grid"><div><p className="section-index">Pilot brief</p><h2>A bounded starting point.</h2><PilotApplicationForm /></div><aside><p className="section-index">Required before activation</p>{["Approved education identity and role mapping", "Organisation-isolation test evidence", "Publication-cleared medical media", "Privacy and accessibility review", "Support, incident and withdrawal owners", "No clinical Didanix connectivity"].map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><b>{item}</b></div>)}</aside></section></main>;
}
