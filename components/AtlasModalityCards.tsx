import Link from 'next/link';
import Image from 'next/image';
import {atlasModalities} from '../lib/atlas-navigation';

/** One source of destinations, images and availability for home and Atlas. */
export function AtlasModalityCards({headingLevel=2,layout='grid'}:{headingLevel?:2|3;layout?:'grid'|'list'}){
  const Heading=headingLevel===3?'h3':'h2';
  return <ul className={layout==='list'?'atlas-modality-list':'atlas-modality-grid'} aria-label="Choose an atlas modality">
    {atlasModalities.map(modality=><li key={modality.id}><Link className="atlas-modality-card" href={modality.href}>
      <div className={`atlas-modality-image atlas-modality-image-${modality.id}`}><Image src={modality.image} alt={modality.alt} width={640} height={440} loading="lazy" unoptimized/><span>{modality.label}</span></div>
      <div className="atlas-modality-copy"><span className="atlas-availability">{modality.status}</span><Heading>{modality.title}<span aria-hidden="true">↗</span></Heading><p>{layout==='list'?modality.overview:modality.description}</p><small>{modality.caption}</small></div>
    </Link></li>)}
  </ul>;
}
/** Independent reference images, not aligned views of one study. */
export function AtlasModalityPreview(){
  return <section className="atlas-preview homepage-atlas-preview" aria-label="Atlas modality previews">
    <div className="homepage-atlas-preview-bar"><span>Anatomy in five modalities</span><span>Explore the atlas</span></div>
    <div className="homepage-modality-mosaic">
      {atlasModalities.map(modality=><Link key={modality.id} href={modality.href} className={`homepage-modality-preview homepage-modality-preview-${modality.id}`} aria-label={`${modality.title} — ${modality.status}`}>
        <div className="homepage-modality-artwork"><Image src={modality.image} alt={modality.alt} width={640} height={440} unoptimized/></div>
        <span>{modality.label}<span aria-hidden="true">↗</span></span>
      </Link>)}
    </div>
    <div className="homepage-atlas-preview-footer"><div><strong>Whole-body 3D. Anatomy across imaging.</strong><span>3D &amp; CT demo available; other atlases in preparation.</span><a href="/media/atlas/NOTICES.md">Reference previews · image credits</a></div></div>
  </section>;
}
export function AtlasImageNotes(){
  return <details className="atlas-hub-notes"><summary>Image sources &amp; availability</summary><p>Tiles preview each modality, not a complete or clinically approved atlas. The CT viewer is an illustrative demonstration. MRI, ultrasound and X-ray modules are in preparation; no private patient studies are published here.</p><p><a href="/media/atlas/NOTICES.md">Image credits, source links and licences</a>. Imaging-case and lecture access will remain separate from Atlas access.</p></details>;
}
