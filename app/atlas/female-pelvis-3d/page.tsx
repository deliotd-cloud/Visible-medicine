import type { Metadata } from 'next';
import Link from 'next/link';
import {AtlasRegionNavigation} from '../../../components/AtlasRegionNavigation';
import '../shoulder-3d/shoulder-module.css';

export const metadata: Metadata = {
  title:'Female pelvis 3D anatomy — private pilot',
  description:'Explore source-based female pelvic anatomy with regional dissection and draft teaching.',
  robots:{index:false,follow:false},
};

export default function FemalePelvisModulePage() {
  return <main className="shoulder-module-page">
    <header className="shoulder-module-bar">
      <Link href="/atlas" aria-label="Back to anatomy atlas">← Atlas</Link>
      <h1>Female pelvic anatomy</h1>
      <span>Private pilot · Review pending</span>
      <Link className="atlas-intended-use-link" href="/intended-use">Education &amp; research only</Link>
      <a href="/atlas-runtime/female-pelvis/index.html" target="_blank" rel="noopener noreferrer">Open full screen ↗</a>
    </header>
    <AtlasRegionNavigation modality="3d" selected="female-pelvis"/>
    <iframe className="shoulder-module-frame" src="/atlas-runtime/female-pelvis/index.html" title="Interactive female pelvic reference: explore, dissect and practise" referrerPolicy="same-origin" allowFullScreen />
    <details className="shoulder-module-notes">
      <summary>Coverage, sources &amp; imaging links</summary>
      <p>43 selections across 11 study views: 41 pelvic surfaces and two ureters from the same source specimen and coordinate frame, with introductory draft teaching for all 43 selections. Rotate, search, fade, set aside, separate tissues and practise identification. Imaging-topic coverage remains partial and clinical review is pending. Source boundaries and six withheld groups remain unchanged.</p>
      <p>This separate reference is not complete female anatomy: no pelvic floor or nerve network is included. No scan or spatial registration is connected. CT, MRI, X-ray and ultrasound will connect through Didanix Education only after mapping and access checks; lecture access remains separate.</p>
      <p><a href="/atlas-runtime/female-pelvis/models/hra-pelvis/NOTICE.md" target="_blank" rel="noopener noreferrer">HRA / HuBMAP pelvic model credit and CC BY 4.0 reuse terms</a> · <a href="/atlas-runtime/female-pelvis/models/hra-renal/NOTICE.md" target="_blank" rel="noopener noreferrer">Ureter source credit and reuse terms</a> · <a href="/atlas-runtime/female-pelvis/BUNDLED_NOTICES.txt" target="_blank" rel="noopener noreferrer">Software licences</a></p>
    </details>
  </main>;
}
