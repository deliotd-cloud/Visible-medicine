import Link from 'next/link';
import {AtlasRegionNavigation} from './AtlasRegionNavigation';
import {atlasModalities,selectedImagingRegion,type AtlasModalityId} from '../lib/atlas-navigation';
export function ImagingAtlasPage({modality,region}:{modality:Exclude<AtlasModalityId,'3d'>;region?:string|string[]}){
  const definition=atlasModalities.find(item=>item.id===modality)!;
  const selected=selectedImagingRegion(modality,region);
  return <main className="imaging-atlas-page">
    <header className="imaging-atlas-banner"><Link href="/atlas">← Atlas</Link><h1>{definition.title}</h1><span>In preparation</span></header>
    <AtlasRegionNavigation modality={modality} selected={selected.id}/>
    <section className="imaging-atlas-pending"><p className="eyebrow">{definition.label} · {selected.label}</p><h2>This regional atlas is in preparation.</h2><p>There is no released {definition.label} study for this region yet. Reviewed images and anatomical labels will open here through Didanix Education.</p><Link href="/atlas/3d">Explore the 3D atlas →</Link>{modality==='ct'&&<Link href="/atlas/ct-head">Open the illustrative CT head demonstration →</Link>}</section>
  </main>;
}
