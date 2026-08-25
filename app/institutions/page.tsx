import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Institutions", description: "Atlas access and secure imaging education for universities, hospitals and professional organisations." };

export default function InstitutionsPage() {
  return (
    <main className="inner-page institutions-page">
      <section className="page-hero institution-page-hero"><p className="eyebrow"><span /> Universities · hospitals · societies</p><h1>One place to explore anatomy and deliver imaging education.</h1><p>Combine the reviewed Elivion Atlas with private courses created and delivered through Elivion Studio.</p><div className="hero-actions"><a className="primary-button" href="#pilot-path">See the pilot path <span>↓</span></a><Link className="text-button" href="/institutions/pilot">Prepare a pilot brief</Link></div></section>
      <section className="institution-offer">
        <div><p className="section-index">For learners</p><h2>Atlas and courses</h2><ul><li>Reviewed anatomy modules</li><li>Guided official courses</li><li>Private institutional workbooks</li><li>Saved progress and bookmarks</li></ul></div>
        <div><p className="section-index">For educators</p><h2>Elivion Studio</h2><ul><li>Radiology and pathology cases</li><li>Workbook and assessment authoring</li><li>Live teaching and polls</li><li>Marking and moderation workflows</li></ul></div>
        <div><p className="section-index">For organisations</p><h2>Governed access</h2><ul><li>Explicit organisation boundaries</li><li>Private course catalogues</li><li>Role and enrolment management</li><li>Usage and learning analytics</li></ul></div>
      </section>
      <section className="separation-diagram"><div><small>Explore and learn</small><b>Atlas + Courses</b><span>Reviewed anatomy · Official learning</span></div><i>+</i><div><small>Create and deliver</small><b>Elivion Studio</b><span>Institution courses · Assessments</span></div><i>≠</i><div><small>Clinical future</small><b>Didanix PACS</b><span>Separate identity · data · release</span></div></section>
      <section className="institution-licence"><div><p className="section-index">Commercial structure</p><h2>An annual platform licence built around real usage.</h2><p>A base institutional licence can be combined with clear bands for active learners, educators, publication-cleared media storage and optional identity, LMS or support requirements.</p></div><div className="studio-cta-stack"><Link className="primary-button" href="/workspace">Open institution workspace <span>→</span></Link><Link className="outline-button" href="/pricing">View plans <span>→</span></Link></div></section>
      <section className="pilot-steps" id="pilot-path"><p className="section-index">Pilot path</p>{["Agree users, jurisdiction and content scope", "Choose a learner, educator and storage band", "Configure identity and organisation roles", "Validate publication-cleared teaching media", "Run a bounded learner and educator pilot", "Review accessibility, security, value and support load"].map((step, index) => <div key={step}><span>{String(index + 1).padStart(2, "0")}</span><b>{step}</b></div>)}<Link className="primary-button" href="/institutions/pilot">Prepare the pilot brief <span>→</span></Link></section>
    </main>
  );
}
