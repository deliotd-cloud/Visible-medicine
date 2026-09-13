import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound,redirect} from 'next/navigation';
import {AtlasRegionNavigation} from '../../../components/AtlasRegionNavigation';
import {selectedBodyRegion} from '../../../lib/atlas-navigation';
import '../shoulder-3d/shoulder-module.css';

export const metadata:Metadata={title:'3D anatomy atlas',description:'Explore whole-body and regional anatomy with source-based dissection and contextual teaching.',robots:{index:false,follow:false}};
export default async function ThreeDAtlas({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const params=await searchParams;
  const region=selectedBodyRegion(params.region);
  if(!region)notFound();
  if(!region.href.startsWith('/atlas/3d'))redirect(region.href);
  const source=`/atlas-runtime/head-neck/index.html?region=${region.id}`;
  return <main className="shoulder-module-page">
    <header className="shoulder-module-bar">
      <Link href="/atlas" aria-label="Back to anatomy atlas">← Atlas</Link>
      <h1>{region.label}</h1><span>Private pilot · Review pending</span>
      <a href={source} target="_blank" rel="noopener noreferrer">Open full screen ↗</a>
    </header>
    <AtlasRegionNavigation modality="3d" selected={region.id}/>
    <iframe key={region.id} className="shoulder-module-frame" src={source} title={`${region.label} 3D anatomy: explore, dissect and practise`} referrerPolicy="same-origin" allowFullScreen/>
    <details className="shoulder-module-notes">
      <summary>Coverage, sources &amp; imaging links</summary>
      <p>{region.structures.toLocaleString('en-GB')} source selections in this view. Rotate, search, isolate, remove layers or choose a separation mechanism. Counts describe retained source selections, not complete human anatomy; held or missing structures are not invented.</p>
      <p>Detailed reference specimens retain separate source coordinate frames. They are not registered to the main body or a patient scan. All teaching and anatomical accuracy await revision-bound clinical review.</p>
      <p>Future cleared imaging uses Didanix Education/light. No scan or spatial registration is connected; Atlas access does not grant access to separately paid lectures.</p>
      <p>BodyParts3D v4 and HRA: CC BY 4.0; independent BodyParts3D v3 back/abdominal-wall assets and specimen-data adaptations: CC BY-SA 2.1 Japan; Universiti Malaya lower-limb models: CC0. Original licensed reuse rights and source notices are retained.</p>
      <p><a href="/atlas-runtime/head-neck/models/bodyparts3d/credits.html" target="_blank" rel="noopener noreferrer">Source, changes &amp; commercial licences</a> · <a href="/atlas-runtime/head-neck/BUNDLED_NOTICES.txt" target="_blank" rel="noopener noreferrer">Software licences</a></p>
    </details>
  </main>;
}
