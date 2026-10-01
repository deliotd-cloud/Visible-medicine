import type {Metadata} from 'next';
import Link from 'next/link';
import {AtlasRegionNavigation} from '../../../components/AtlasRegionNavigation';
import '../shoulder-3d/shoulder-module.css';

export const metadata:Metadata={title:'Abdomen 3D anatomy — private pilot',description:'Abdominal dissection, hepatic and renal relationships, and separate abdominal-wall and kidney specimens.',robots:{index:false,follow:false}};
export default function AbdomenModulePage(){
  return <main className="shoulder-module-page">
    <header className="shoulder-module-bar">
      <Link href="/atlas" aria-label="Back to anatomy atlas">← Atlas</Link>
      <h1>Abdominal anatomy</h1><span>Private pilot · Review pending</span>
      <Link className="atlas-intended-use-link" href="/intended-use">Education &amp; research only</Link>
      <a href="/atlas-runtime/head-neck/index.html?region=abdomen" target="_blank" rel="noopener noreferrer">Open full screen ↗</a>
    </header>
    <AtlasRegionNavigation modality="3d" selected="abdomen"/>
    <iframe className="shoulder-module-frame" src="/atlas-runtime/head-neck/index.html?region=abdomen" title="Interactive abdomen: explore, dissect and practise" referrerPolicy="same-origin" allowFullScreen/>
    <details className="shoulder-module-notes">
      <summary>Coverage, sources &amp; imaging links</summary>
      <p>106 regional selections and 16 nested liver/biliary, pancreatic or renal selections, with their supplied relationship context. Use the existing tools to dissect, isolate and change separation style. Counts describe source selections, not complete anatomy.</p>
      <p>The abdominal-wall specimen has 29 surfaces in seven study views; the kidney reference has 82 admitted surfaces in nine views. They open separately and are not registered to the main body or to each other. Three defective kidney surfaces remain withheld; missing tissue is not normal anatomy.</p>
      <p>No scan or spatial registration is connected. Imaging notes are drafts for radiologist review. Future imaging uses Didanix Education after mapping, release and access checks; lecture access remains separate.</p>
      <p>BodyParts3D v4 and HRA kidneys use CC BY 4.0. The separate BodyParts3D v3 abdominal-wall assets and adaptations use CC BY-SA 2.1 Japan. Attribution and licensed reuse rights remain available; subscriptions must not restrict those rights.</p>
      <p><a href="/atlas-runtime/head-neck/models/bodyparts3d/credits.html" target="_blank" rel="noopener noreferrer">Source, changes &amp; commercial licences</a> · <a href="/atlas-runtime/head-neck/BUNDLED_NOTICES.txt" target="_blank" rel="noopener noreferrer">Software licences</a></p>
    </details>
  </main>;
}
