import type { Metadata } from "next";
import { atlasModules } from "../../lib/catalog";

export const metadata: Metadata = { title: "Anatomy atlas", description: "Explore radiological anatomy modules by body region and modality." };

export default function AtlasCatalogue() {
  return (
    <main className="inner-page">
      <section className="page-hero atlas-page-hero">
        <p className="eyebrow"><span /> Interactive imaging atlas</p>
        <h1>Anatomy in context,<br />slice by slice.</h1>
        <p>Search, filter and practise directly on curated CT and MRI studies. Each public module is versioned and reviewed before release.</p>
      </section>
      <section className="catalogue-controls" aria-label="Atlas filters">
        <span>{atlasModules.length} modules</span>
        <div><button type="button" className="active">All regions</button><button type="button">CT</button><button type="button">MRI</button></div>
      </section>
      <section className="catalogue-list">
        {atlasModules.map((module, index) => (
          <a href={`/atlas/${module.slug}`} className="catalogue-item" key={module.slug}>
            <div className={`catalogue-scan catalogue-scan-${index + 1}`} aria-hidden="true"><i /><i /></div>
            <div className="catalogue-number">0{index + 1}</div>
            <div className="catalogue-copy">
              <span>{module.modality} · {module.orientation}</span><h2>{module.title}</h2><p>{module.description}</p>
              <div>{module.systems.map((system) => <small key={system}>{system}</small>)}</div>
            </div>
            <div className="catalogue-meta"><span>{module.structures} structures</span><span>{module.images} images</span><b>{module.status === "available" ? "Open module ↗" : "Preview ↗"}</b></div>
          </a>
        ))}
      </section>
    </main>
  );
}
