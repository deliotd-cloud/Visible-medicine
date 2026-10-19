import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {HeadAtlasLearningLibrary} from '../../../components/HeadAtlasLearningLibrary';
import {RegionalLearningCatalogue} from '../../../components/RegionalLearningCatalogue';
import {regionalLearningCatalogue} from '../../../lib/regional-learning-catalogue';
import {atlasBodyRegions} from '../../../lib/atlas-navigation';
import {parseHeadLearningDiscovery} from '../../../lib/head-learning-discovery';
import '../head-neck-3d/head-learning.css';
import './guided-learning.css';

export const metadata:Metadata={title:'Guided anatomy learning',description:'Search regional 3D anatomy tours and linked head sequences in CT, MRI and the existing 3D Atlas.',robots:{index:false,follow:false}};

export default async function GuidedLearningCatalogue({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const filter=parseHeadLearningDiscovery(await searchParams);
  if(!filter)notFound();
  return <main className="atlas-hub atlas-guided-hub">
    <header className="atlas-hub-heading">
      <Link href="/atlas">← Atlas modalities</Link>
      <p className="eyebrow">Visible Medicine Atlas</p><h1>Guided learning.</h1>
      <p>Find a regional 3D tour or a linked head anatomy sequence. Each keeps its own source, review status and available views.</p>
    </header>
    <details className="atlas-guided-regions" open={filter.view==='3D'}>
      <summary>Regional and whole-body 3D tours</summary>
      {(filter.view==='all'||filter.view==='3D')&&<RegionalLearningCatalogue key={JSON.stringify(filter)} catalogue={regionalLearningCatalogue()} initialQuery={filter.query}/>}
      <details><summary>Browse regions directly</summary>
      <p>Open a region, then choose <strong>Guided learning</strong> in the atlas. Choose a tour and press Start; camera movement begins only when you ask. These 3D tours do not imply mapped CT, MRI, X-ray or ultrasound counterparts.</p>
      <nav aria-label="Open a region for 3D guided learning"><ul>{atlasBodyRegions.map(region=><li key={region.id}><Link href={region.href} prefetch={false}>{region.label}<span aria-hidden="true"> ↗</span></Link></li>)}</ul></nav>
      </details>
    </details>
    <div className="head-atlas-learning-library atlas-guided-head-library">
      <HeadAtlasLearningLibrary key={JSON.stringify(filter)} initialView={filter.view} initialQuery={filter.query} compact/>
    </div>
    <p className="atlas-guided-access">Scan sources remain local. Opening this catalogue does not load scans, unlock imaging or paid lectures, or change review decisions. Each destination retains its own access checks.</p>
  </main>;
}
