import type { Metadata } from "next";

export const metadata: Metadata = { title: "Research", description: "A non-clinical research framework for versioned radiological anatomy resources." };

export default function ResearchPage() {
  return (
    <main className="inner-page research-page">
      <section className="page-hero research-page-hero"><p className="eyebrow"><span /> Non-clinical research</p><h1>Make the exact atlas state reproducible.</h1><p>Research references should identify the source dataset, atlas publication and individual structure—not merely link to a page that may later change.</p></section>
      <section className="research-principles">
        <article><span>01</span><h2>Stable resources</h2><p>Published modules receive immutable version identifiers. Corrections produce a new release while previous research references remain resolvable.</p></article>
        <article><span>02</span><h2>Dataset provenance</h2><p>Source, acquisition context, licence, de-identification decision and editorial ownership stay attached to the publication record.</p></article>
        <article><span>03</span><h2>Structured citations</h2><p>Researchers can cite a module, series, image position and anatomical structure through a stable resource identifier.</p></article>
        <article><span>04</span><h2>Distinct workspaces</h2><p>Private research annotations never silently become reviewed public anatomy and cannot enter the future clinical PACS environment.</p></article>
      </section>
      <section className="citation-example"><div><p className="section-index">Example resource</p><code>atlas://ct-head/v1/series/axial/structure/caudate-nucleus</code></div><div><span>Version</span><b>v1 · immutable</b><span>Purpose</span><b>Education / non-clinical research</b><span>Data</span><b>Publication-cleared source required</b></div></section>
      <section className="research-governance"><h2>Publication remains governed.</h2><p>Real imaging cannot enter the public atlas until rights, de-identification, residual identifiability, anatomical accuracy and publication approval have been recorded. Pseudonymisation alone is not treated as permission to publish.</p><a className="outline-button" href="/institutions">Discuss a research partnership <span>→</span></a></section>
    </main>
  );
}
