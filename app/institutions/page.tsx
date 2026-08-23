import type { Metadata } from "next";

export const metadata: Metadata = { title: "Institutions", description: "Atlas access and secure imaging education for universities, hospitals and professional organisations." };

export default function InstitutionsPage() {
  return (
    <main className="inner-page institutions-page">
      <section className="page-hero institution-page-hero"><p className="eyebrow"><span /> Universities · hospitals · societies</p><h1>One place to explore anatomy and deliver imaging education.</h1><p>Combine reviewed first-party atlas access with private institutional courses powered by Didanix Education.</p><a className="primary-button" href="#pilot-path">See the pilot path <span>↓</span></a></section>
      <section className="institution-offer">
        <div><p className="section-index">For learners</p><h2>Atlas and courses</h2><ul><li>Reviewed anatomy modules</li><li>Guided official courses</li><li>Private institutional workbooks</li><li>Saved progress and bookmarks</li></ul></div>
        <div><p className="section-index">For educators</p><h2>Didanix Education</h2><ul><li>Radiology and pathology cases</li><li>Workbook and assessment authoring</li><li>Live teaching and polls</li><li>Marking and moderation workflows</li></ul></div>
        <div><p className="section-index">For organisations</p><h2>Governed access</h2><ul><li>Explicit organisation boundaries</li><li>Private course catalogues</li><li>Role and enrolment management</li><li>Usage and learning analytics</li></ul></div>
      </section>
      <section className="separation-diagram"><div><small>First-party destination</small><b>Didanix Atlas</b><span>Reviewed anatomy · Official courses</span></div><i>+</i><div><small>Teaching platform</small><b>Didanix Education</b><span>Institution courses · Assessments</span></div><i>≠</i><div><small>Clinical future</small><b>Didanix PACS</b><span>Separate identity · data · release</span></div></section>
      <section className="pilot-steps" id="pilot-path"><p className="section-index">Pilot path</p>{["Agree users, jurisdiction and content scope", "Configure identity and organisation roles", "Validate publication-cleared teaching media", "Run a bounded learner and educator pilot", "Review accessibility, security and outcomes"].map((step, index) => <div key={step}><span>0{index + 1}</span><b>{step}</b></div>)}</section>
    </main>
  );
}
