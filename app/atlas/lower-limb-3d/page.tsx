import type { Metadata } from 'next';
import Link from 'next/link';
import {AtlasRegionNavigation} from '../../../components/AtlasRegionNavigation';
import '../shoulder-3d/shoulder-module.css';

export const metadata: Metadata = {
  title:'Lower limb 3D anatomy — private pilot',
  description:'Explore source-based hip, thigh, knee, calf and foot dissection with draft teaching.',
  robots:{index:false,follow:false},
};
export default function LowerLimbModulePage() {
  return <main className="shoulder-module-page">
    <header className="shoulder-module-bar">
      <Link href="/atlas" aria-label="Back to anatomy atlas">← Atlas</Link>
      <h1>Lower-limb anatomy</h1><span>Private pilot · Review pending</span>
      <a href="/atlas-runtime/lower-limb/index.html" target="_blank" rel="noopener noreferrer">Open full screen ↗</a>
    </header>
    <AtlasRegionNavigation modality="3d" selected="lower-limb"/>
    <iframe className="shoulder-module-frame" src="/atlas-runtime/lower-limb/index.html" title="Interactive right lower limb: choose a region, dissect and practise" referrerPolicy="same-origin" allowFullScreen />
    <details className="shoulder-module-notes">
      <summary>Coverage, sources &amp; imaging links</summary>
      <p>67 source surfaces across hip &amp; thigh, knee, calf, foot and an optional whole-limb view, with 26 study choices. Rotate, search, fade, set aside, separate tissues and practise identification. Regional views load only their required model groups.</p>
      <p>All 67 selections have introductory draft teaching; 65 have clinical and pathology drafts. Imaging-topic coverage is partial. Motor-supply teaching does not imply nerve meshes: nerves, vessels and many small tissues are absent. Grouped bones remain grouped. Clinical review is pending.</p>
      <p>This independent right-limb reference is not registered to the body atlas. No scan or spatial registration is connected. CT, MRI, X-ray and ultrasound will use Didanix Education after mapping and access checks; lecture access remains separate.</p>
      <p><a href="/atlas-runtime/lower-limb/MODEL_NOTICE.md" target="_blank" rel="noopener noreferrer">Universiti Malaya source, changes &amp; CC0 terms</a> · <a href="/atlas-runtime/lower-limb/BUNDLED_NOTICES.txt" target="_blank" rel="noopener noreferrer">Software licences</a></p>
    </details>
  </main>;
}
