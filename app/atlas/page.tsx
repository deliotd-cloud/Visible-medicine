import type { Metadata } from "next";
import { atlasModules } from "../../lib/catalog";

export const metadata: Metadata = { title: "Anatomy atlas", description: "Explore radiological anatomy modules by body region and modality." };

export default async function AtlasCatalogue({ searchParams }: { searchParams: Promise<{ modality?: string }> }) {
  const requested = (await searchParams).modality;
  const modality = ['3D', 'CT', 'MRI'].includes(requested ?? '') ? requested : undefined;
  const modules = atlasModules.filter(module => !modality || module.modality === modality);
  return (
    <main className="inner-page">
      <section className="page-hero atlas-page-hero">
        <p className="eyebrow"><span /> Interactive imaging atlas</p>
        <h1>Anatomy in context,<br />slice by slice.</h1>
        <p>Explore 3D anatomy alongside cross-sectional imaging modules. Private previews remain separate from clinically reviewed releases.</p>
      </section>
      <section className="catalogue-controls" aria-label="Atlas filters">
        <span>{modules.length} modules</span>
        <div role="group" aria-label="Filter by modality">{[undefined, '3D', 'CT', 'MRI'].map(value => <a key={value ?? 'all'} className={modality === value ? 'active' : undefined} aria-current={modality === value ? 'page' : undefined} href={value ? `/atlas?modality=${value}` : '/atlas'}>{value ?? 'All modalities'}</a>)}</div>
      </section>
      <section className="catalogue-list">
        {modules.map((module, index) => (
          <a href={`/atlas/${module.slug}`} className="catalogue-item" key={module.slug}>
            <div className={`catalogue-scan catalogue-scan-${index + 1}`} aria-hidden="true"><i /><i /><span>{module.region}</span></div>
            <div className="catalogue-number">0{index + 1}</div>
            <div className="catalogue-copy">
              <span>{module.modality} · {module.orientation}</span><h2>{module.title}</h2><p>{module.description}</p>
              <div>{module.systems.map((system) => <small key={system}>{system}</small>)}</div>
            </div>
              <div className="catalogue-meta"><span className={`module-status ${module.status}`}>{module.slug === 'shoulder-3d' ? 'Private 3D pilot' : module.status === "available" ? "Available preview" : "Planned"}</span><span>{module.structures} structures</span><span>{module.modality === '3D' ? 'Interactive dissection' : `${module.images} images`}</span><b>{module.status === "available" ? "Open module ↗" : "View roadmap ↗"}</b></div>
          </a>
        ))}
      </section>
    </main>
  );
}
