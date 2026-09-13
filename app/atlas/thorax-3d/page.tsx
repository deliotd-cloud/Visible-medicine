import type {Metadata} from 'next';
import Link from 'next/link';
import '../shoulder-3d/shoulder-module.css';

export const metadata:Metadata={title:'Thorax 3D anatomy — private pilot',description:'Chest-wall dissection, cardiac chamber spaces and lung branch groups with draft imaging teaching.',robots:{index:false,follow:false}};
export default function ThoraxModulePage(){
  return <main className="shoulder-module-page">
    <header className="shoulder-module-bar">
      <Link href="/atlas" aria-label="Back to anatomy atlas">← Atlas</Link>
      <h1>Thorax anatomy</h1><span>Private pilot · Review pending</span>
      <a href="/atlas-runtime/head-neck/index.html?region=thorax" target="_blank" rel="noopener noreferrer">Open full screen ↗</a>
    </header>
    <iframe className="shoulder-module-frame" src="/atlas-runtime/head-neck/index.html?region=thorax" title="Interactive thorax: explore, dissect and practise" referrerPolicy="same-origin" allowFullScreen/>
    <details className="shoulder-module-notes">
      <summary>Coverage, sources &amp; imaging links</summary>
      <p>157 regional selections and nine nested cardiac chamber or pulmonary branch-group selections. Explore chest-wall layers, isolate structures, change separation style and open deeper heart or lung studies. Counts describe supplied source selections, not complete anatomy.</p>
      <p>CT, MRI, X-ray and ultrasound orientation notes remain drafts for radiologist review. Missing nerves and partial vessels are not a complete continuous network; chamber spaces are not chamber walls.</p>
      <p>No scan or spatial registration is connected. Future imaging uses Didanix Education after mapping, release and access checks; lecture access remains separate.</p>
      <p><a href="/atlas-runtime/head-neck/models/bodyparts3d/credits.html" target="_blank" rel="noopener noreferrer">Source, changes &amp; commercial licence</a> · <a href="/atlas-runtime/head-neck/BUNDLED_NOTICES.txt" target="_blank" rel="noopener noreferrer">Software licences</a></p>
    </details>
  </main>;
}
