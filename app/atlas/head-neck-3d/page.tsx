import type {Metadata} from 'next';
import Link from 'next/link';
import {AtlasRegionNavigation} from '../../../components/AtlasRegionNavigation';
import regionalManifest from '../../../public/atlas-runtime/head-neck/manifest.json';
import '../shoulder-3d/shoulder-module.css';

export const metadata:Metadata={title:'Head and neck 3D anatomy — private pilot',description:'Regional anatomy and nested eye, brain, ventricular and vessel dissection with draft teaching.',robots:{index:false,follow:false}};
export default function HeadNeckModulePage(){
  return <main className="shoulder-module-page">
    <header className="shoulder-module-bar">
      <Link href="/atlas" aria-label="Back to anatomy atlas">← Atlas</Link>
      <h1>Head &amp; neck anatomy</h1><span>Private pilot · Review pending</span>
      <Link className="atlas-intended-use-link" href="/intended-use">Education &amp; research only</Link>
      <a href="/atlas-runtime/head-neck/index.html" target="_blank" rel="noopener noreferrer">Open full screen ↗</a>
    </header>
    <AtlasRegionNavigation modality="3d" selected="head-neck"/>
    <iframe className="shoulder-module-frame" src="/atlas-runtime/head-neck/index.html" title="Interactive head and neck: explore, dissect and practise" referrerPolicy="same-origin" allowFullScreen/>
    <details className="shoulder-module-notes">
      <summary>Coverage, sources &amp; imaging links</summary>
      <p>{regionalManifest.structures} regional selections and {regionalManifest.nestedSelections} nested selections across eye layers, ventricular spaces, cerebral regions, brainstem and cerebellum, visual pathway, cricothyroid and cranial artery source parts. Rotate, select, isolate, dissect, change separation style and practise identification. These counts do not imply complete anatomy.</p>
      <p>Geometry and teaching remain pending radiologist review. Partial vessels and nerves are not a validated continuous network; numbered source parts are not named clinical segments. This is reference anatomy, not patient-specific anatomy.</p>
      <p>No scan or spatial registration is connected. CT, MRI, X-ray and ultrasound will use Didanix Education after source mapping, release and access checks; lecture access remains separate.</p>
      <p><a href="/atlas-runtime/head-neck/models/bodyparts3d/credits.html" target="_blank" rel="noopener noreferrer">Source, changes &amp; commercial licence</a> · <a href="/atlas-runtime/head-neck/BUNDLED_NOTICES.txt" target="_blank" rel="noopener noreferrer">Software licences</a></p>
    </details>
  </main>;
}
