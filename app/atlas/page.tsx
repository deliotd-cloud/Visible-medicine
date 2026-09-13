import type {Metadata} from 'next';
import Link from 'next/link';
import {redirect} from 'next/navigation';
import {atlasModalities,legacyModalityHref} from '../../lib/atlas-navigation';
export const metadata:Metadata={title:'Anatomy atlas',description:'Explore Visible Medicine anatomy in 3D, CT, MRI, ultrasound and X-ray.'};
export default async function AtlasCatalogue({searchParams}:{searchParams:Promise<{modality?:string|string[]}>}){
  const destination=legacyModalityHref((await searchParams).modality);
  if(destination)redirect(destination);
  return <main className="atlas-hub">
    <header className="atlas-hub-heading"><p className="eyebrow">Visible Medicine Atlas</p><h1>Explore anatomy.</h1><p>Choose a modality, then a body region.</p></header>
    <section className="atlas-modality-grid" aria-label="Choose an atlas modality">
      {atlasModalities.map(modality=><Link className="atlas-modality-card" href={modality.href} key={modality.id}>
        <div className={`atlas-modality-image atlas-modality-image-${modality.id}`}><img src={modality.image} alt={modality.alt} width={640} height={440}/><span>{modality.label}</span></div>
        <div className="atlas-modality-copy"><span className="atlas-availability">{modality.status}</span><h2>{modality.title}<span aria-hidden="true">↗</span></h2><p>{modality.description}</p><small>{modality.caption}</small></div>
      </Link>)}
    </section>
    <details className="atlas-hub-notes"><summary>Image sources &amp; availability</summary><p>Tiles preview each modality, not a complete or clinically approved atlas. The CT viewer is an illustrative demonstration. MRI, ultrasound and X-ray modules are in preparation; no private patient studies are published here.</p><p><a href="/media/atlas/NOTICES.md">Image credits, source links and licences</a>. Imaging-case and lecture access will remain separate from Atlas access.</p></details>
  </main>;
}
