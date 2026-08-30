import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Studio",
  description: "Create, publish and deliver secure radiology or pathology teaching through Visible Medicine Studio.",
};

export default function StudioPage() {
  return (
    <main className="inner-page studio-page">
      <section className="page-hero studio-page-hero">
        <p className="eyebrow"><span /> Visible Medicine Studio</p>
        <h1>Your cases.<br />Your course.<br />A purpose-built viewer.</h1>
        <p>Create private radiology or pathology workbooks, teach them live, assess learners and deliver the experience through Visible Medicine.</p>
        <div className="hero-actions studio-hero-actions">
          <Link className="primary-button" href="/studio/workspace">Open Studio workspace <span>→</span></Link>
          <a className="text-button" href="#studio-access">Plan an institutional pilot</a>
        </div>
      </section>

      <section className="studio-flow">
        <div><span>01</span><h2>Prepare</h2><p>Authorised staff place teaching media into quarantine. Content stays private until de-identification, rights and publication review pass.</p></div>
        <div><span>02</span><h2>Compose</h2><p>Organise Course → Module → Workbook → Case, then add questions, saved scenes, polls, presentations and marking rubrics.</p></div>
        <div><span>03</span><h2>Deliver</h2><p>Host a private institutional course, publish an approved Visible Medicine course or embed a signed learner experience in an authorised website.</p></div>
        <div><span>04</span><h2>Review</h2><p>Track participation, mark submitted work and preserve the exact content and viewer state used by each attempt.</p></div>
      </section>

      <section className="studio-capabilities">
        <div><p className="section-index">Authoring</p><h2>Imaging-native course construction.</h2><p>Build radiology and pathology teaching around cases, saved viewer states and structured educational content instead of flattened screenshots.</p></div>
        <div className="capability-list">
          {[
            ["Viewer scenes", "Window, level, slice, layout and annotations"],
            ["Assessment", "Question banks, timed attempts and immutable submissions"],
            ["Live teaching", "Follow-me presentation, polls and shared scenes"],
            ["Governance", "Review, moderation, audit and controlled publication"],
          ].map(([title, description], index) => <article key={title}><span>0{index + 1}</span><b>{title}</b><p>{description}</p></article>)}
        </div>
      </section>

      <section className="delivery-modes">
        <p className="section-index">Three delivery modes</p>
        <article><b>Hosted</b><p>A first-party course within Visible Medicine.</p></article>
        <article><b>Embedded</b><p>A signed, origin-restricted learner experience inside an approved external site.</p></article>
        <article><b>LMS</b><p>A later LTI 1.3 pathway for compatible institutional learning platforms.</p></article>
      </section>

      <section className="studio-boundary" id="studio-access">
        <div><p className="section-index">Governed course release</p><h2>Start with verified educators and bounded cohorts.</h2><p>Private, unlisted and public releases use explicit audience and access settings. Public catalogue publication requires a separate education reviewer and administrator release.</p></div>
        <div className="studio-cta-stack"><Link className="primary-button" href="/studio/workspace">Open Studio workspace <span>→</span></Link><Link className="outline-button" href="/institutions#pilot-path">Plan a pilot <span>→</span></Link><Link className="outline-button" href="/pricing">View plans <span>→</span></Link></div>
      </section>
    </main>
  );
}
