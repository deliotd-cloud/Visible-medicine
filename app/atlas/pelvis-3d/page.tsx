import type {Metadata} from 'next';
import Link from 'next/link';
import {AtlasRegionNavigation} from '../../../components/AtlasRegionNavigation';
import '../shoulder-3d/shoulder-module.css';

export const metadata:Metadata={title:'Pelvis 3D anatomy — private pilot',description:'Pelvic dissection and separate female-pelvis and right lower-limb reference studies.',robots:{index:false,follow:false}};
export default function PelvisModulePage(){
  return <main className="shoulder-module-page">
    <header className="shoulder-module-bar">
      <Link href="/atlas" aria-label="Back to anatomy atlas">← Atlas</Link>
      <h1>Pelvic anatomy</h1><span>Private pilot · Review pending</span>
      <a href="/atlas-runtime/head-neck/index.html?region=pelvis" target="_blank" rel="noopener noreferrer">Open full screen ↗</a>
    </header>
    <AtlasRegionNavigation modality="3d" selected="pelvis"/>
    <iframe className="shoulder-module-frame" src="/atlas-runtime/head-neck/index.html?region=pelvis" title="Interactive pelvis: explore, dissect and practise" referrerPolicy="same-origin" allowFullScreen/>
    <details className="shoulder-module-notes">
      <summary>Coverage, sources &amp; imaging links</summary>
      <p>81 regional selections and four nested deep-femoral source parts. Use the existing dissection, search, isolation and separation tools. Source-piece counts do not mean complete pelvic anatomy.</p>
      <p>Female pelvis opens as a separate 41-surface reference with eight studies; six disputed source groups remain withheld. Hip and thigh opens the independent right lower limb, with all five scopes, 67 unique surfaces and 26 study views. These specimens are not registered to the main body or to each other.</p>
      <p>No scan or spatial registration is connected. Imaging teaching is draft. Future imaging uses Didanix Education after clearance and mapping; lecture access remains separate.</p>
      <p>BodyParts3D v4 and HRA use CC BY 4.0; the independent Universiti Malaya lower limb uses CC0 1.0. Existing source defects, grouped surfaces and missing tissue remain disclosed. No clinical approval is implied.</p>
      <p><a href="/atlas-runtime/head-neck/models/bodyparts3d/credits.html" target="_blank" rel="noopener noreferrer">Source, changes &amp; commercial licences</a> · <a href="/atlas-runtime/head-neck/BUNDLED_NOTICES.txt" target="_blank" rel="noopener noreferrer">Software licences</a></p>
    </details>
  </main>;
}
