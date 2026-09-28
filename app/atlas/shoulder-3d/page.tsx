import type { Metadata } from 'next';
import Link from 'next/link';
import {AtlasRegionNavigation} from '../../../components/AtlasRegionNavigation';
import {shoulderModuleHref} from '../../../lib/shoulder-navigation';
import './shoulder-module.css';

export const metadata: Metadata = {
  title: 'Shoulder 3D anatomy — private pilot',
  description: 'Explore, dissect and practise with the Visible Medicine shoulder atlas.',
  robots: { index: false, follow: false },
};

export default async function ShoulderModulePage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const moduleHref = shoulderModuleHref((await searchParams).structure);
  return <main className="shoulder-module-page">
    <header className="shoulder-module-bar">
      <Link href="/atlas" aria-label="Back to anatomy atlas">← Atlas</Link>
      <h1>Shoulder anatomy</h1>
      <span>Private pilot · Review pending</span>
      <a href={moduleHref} target="_blank" rel="noopener noreferrer">Open full screen ↗</a>
    </header>
    <AtlasRegionNavigation modality="3d" selected="shoulder"/>
    <iframe className="shoulder-module-frame" src={moduleHref} title="Interactive right shoulder anatomy: explore, dissect and practise" referrerPolicy="same-origin" allowFullScreen />
    <details className="shoulder-module-notes">
      <summary>About this pilot &amp; imaging links</summary>
      <p>Nine source-based structures with rotation, isolation, layer controls, selectable explode styles, labels and identification practice. Anatomical detail and teaching remain subject to radiologist review.</p>
      <p>CT, MRI, X-ray and ultrasound will connect through Didanix Education. No scan or spatial registration is connected in this pilot. Lecture access will be checked separately from atlas access.</p>
      <p><a href="/atlas-runtime/shoulder/models/bodyparts3d/credits.html" target="_blank" rel="noopener noreferrer">BodyParts3D source and adaptations</a> · <a href="/atlas-runtime/shoulder/BUNDLED_NOTICES.txt" target="_blank" rel="noopener noreferrer">Software licences</a></p>
    </details>
  </main>;
}
