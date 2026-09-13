import Link from 'next/link';
import {atlasModalities} from '../lib/atlas-navigation';

/** One source of destinations, images and availability for home and Atlas. */
export function AtlasModalityCards({headingLevel=2}:{headingLevel?:2|3}){
  const Heading=headingLevel===3?'h3':'h2';
  return <div className="atlas-modality-grid" aria-label="Choose an atlas modality">
    {atlasModalities.map(modality=><Link className="atlas-modality-card" href={modality.href} key={modality.id}>
      <div className={`atlas-modality-image atlas-modality-image-${modality.id}`}><img src={modality.image} alt={modality.alt} width={640} height={440} loading="lazy"/><span>{modality.label}</span></div>
      <div className="atlas-modality-copy"><span className="atlas-availability">{modality.status}</span><Heading>{modality.title}<span aria-hidden="true">↗</span></Heading><p>{modality.description}</p><small>{modality.caption}</small></div>
    </Link>)}
  </div>;
}
export function AtlasImageNotes(){
  return <details className="atlas-hub-notes"><summary>Image sources &amp; availability</summary><p>Tiles preview each modality, not a complete or clinically approved atlas. The CT viewer is an illustrative demonstration. MRI, ultrasound and X-ray modules are in preparation; no private patient studies are published here.</p><p><a href="/media/atlas/NOTICES.md">Image credits, source links and licences</a>. Imaging-case and lecture access will remain separate from Atlas access.</p></details>;
}
