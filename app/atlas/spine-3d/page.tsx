import type {Metadata} from 'next';
import Link from 'next/link';
import {AtlasRegionNavigation} from '../../../components/AtlasRegionNavigation';
import '../shoulder-3d/shoulder-module.css';

export const metadata:Metadata={title:'Spine and back 3D anatomy — private pilot',description:'Source-based spine dissection and independent back-muscle layer studies.',robots:{index:false,follow:false}};
export default function SpineModulePage(){
  return <main className="shoulder-module-page">
    <header className="shoulder-module-bar">
      <Link href="/atlas" aria-label="Back to anatomy atlas">← Atlas</Link>
      <h1>Spine &amp; back</h1><span>Private pilot · Review pending</span>
      <a href="/atlas-runtime/head-neck/index.html?region=spine" target="_blank" rel="noopener noreferrer">Open full screen ↗</a>
    </header>
    <AtlasRegionNavigation modality="3d" selected="spine"/>
    <iframe className="shoulder-module-frame" src="/atlas-runtime/head-neck/index.html?region=spine" title="Interactive spine and back: explore, dissect and practise" referrerPolicy="same-origin" allowFullScreen/>
    <details className="shoulder-module-notes">
      <summary>Coverage, sources &amp; imaging links</summary>
      <p>115 source selections in the regional view. The separate back-layer reference retains 48 surfaces: 14 muscles and 34 bones, with eight study views. Dissect, isolate, search or choose a separation mechanism without changing the original anatomy.</p>
      <p>The back specimen is not registered to the main body. Source fragments and edge contacts remain visible; no complete deep-back muscle stack, nerve network, attachment map or operative plane is claimed.</p>
      <p>No scan or spatial registration is connected. Imaging teaching is draft. Future imaging uses Didanix Education after clearance and mapping; lecture access remains separate.</p>
      <p>BodyParts3D v4 uses CC BY 4.0. Separate BodyParts3D v3 back assets and specimen-data adaptations use CC BY-SA 2.1 Japan. Recipients retain those licensed reuse rights. Clinical review remains pending.</p>
      <p><a href="/atlas-runtime/head-neck/models/bodyparts3d/credits.html" target="_blank" rel="noopener noreferrer">Source, changes &amp; commercial licences</a> · <a href="/atlas-runtime/head-neck/BUNDLED_NOTICES.txt" target="_blank" rel="noopener noreferrer">Software licences</a></p>
    </details>
  </main>;
}
