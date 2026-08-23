import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Teach with Didanix", description: "Create and host radiology or pathology courses through Didanix Education." };

export default function TeachPage() {
  return (
    <main className="inner-page teach-page">
      <section className="page-hero teach-page-hero"><p className="eyebrow"><span /> Didanix Education Studio</p><h1>Your cases.<br />Your course.<br />A purpose-built viewer.</h1><p>Create private radiology or pathology workbooks, teach them live, assess learners and eventually embed the experience in an approved external website.</p><a className="primary-button" href="#studio-access">Request Studio access <span>→</span></a></section>
      <section className="studio-flow">
        <div><span>01</span><h2>Prepare</h2><p>Authorised staff ingest teaching media into quarantine. Nothing reaches learners until content safety and publication review pass.</p></div>
        <div><span>02</span><h2>Compose</h2><p>Organise Course → Module → Workbook → Case, then add questions, saved scenes, polls, presentations and marking rubrics.</p></div>
        <div><span>03</span><h2>Deliver</h2><p>Host the course on Didanix Atlas, launch it privately for an institution or embed an approved learner experience into another website.</p></div>
        <div><span>04</span><h2>Review</h2><p>Track participation, mark submitted work and preserve the exact content and viewer state used by every attempt.</p></div>
      </section>
      <section className="delivery-modes"><p className="section-index">Three delivery modes</p><article><b>Hosted</b><p>A first-party course page within the Atlas website.</p></article><article><b>Embedded</b><p>A signed, origin-restricted viewer inside an approved external site.</p></article><article><b>LMS</b><p>A later LTI 1.3 pathway for compatible learning platforms.</p></article></section>
      <section className="studio-boundary" id="studio-access"><div><p className="section-index">Private beta</p><h2>Start with verified educators and institutions.</h2><p>Open public course publishing is intentionally deferred. Early publishers require verified ownership, publication rights and an accountable content-review process.</p></div><Link className="outline-button" href="/institutions#pilot-path">Plan a pilot <span>→</span></Link></section>
    </main>
  );
}
