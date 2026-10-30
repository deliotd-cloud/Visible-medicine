import type { Metadata } from 'next';
import Link from 'next/link';
import { previewCredits, viewerNoticeLinks } from '../../lib/source-credits';
import './source-credits.css';

export const metadata: Metadata = { title: 'Source credits', description: 'Anatomy, preview-image, viewer-software and font credits, with links to the retained source notices.' };

export default function SourceCreditsPage() {
  return <main className="inner-page source-credits-page">
    <header className="source-credits-heading"><p className="eyebrow">Sources &amp; notices</p>
      <h1>Source credits</h1><p>A single place to find the credits behind the atlas and its presentation. Individual viewers and lessons retain their source-specific notices.</p>
    </header>
    <div className="source-credits-sections">
      <details open><summary>Anatomy and 3D models</summary>
        <p>BodyParts3D, © The Database Center for Life Science, is credited under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Our selected surfaces and illustrations include documented display adaptations; the source institution does not endorse this product.</p>
        <p><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html">BodyParts3D source terms</a> · <a href="/atlas-runtime/shoulder/models/bodyparts3d/credits.html">Shoulder model and adaptation credits</a></p>
        <p>Other anatomical sources retain their own licences, grouping and specimen limits. The following notices belong to their respective viewers, not a blanket licence for every asset:</p>
        <ul>{viewerNoticeLinks.map(item => <li key={item.base}><a href={`${item.base}/LICENSES/THIRD_PARTY_NOTICES.md`}>{item.label} source notices</a></li>)}</ul>
      </details>
      <details><summary>Modality preview images</summary>
        <p>The five preview images are independent references, not registered views of one patient and not the private interactive imaging studies.</p>
        <dl>{previewCredits.map(item => <div key={item.modality}><dt>{item.modality} · {item.licence}</dt>
          <dd>{item.credit}. <a href={item.source}>Original source</a><p>{item.context}</p></dd></div>)}</dl>
        <p><a href="/media/atlas/NOTICES.md">Full image credits, exact sources and changes</a> · <a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0 terms</a></p>
      </details>
      <details><summary>Website and viewer software</summary>
        <p>The website uses React 19.2.8 and React DOM 19.2.8, Copyright Meta Platforms, Inc. and affiliates, under the MIT licence. <a href="/licenses/native-website-react-LICENSE.txt">Read the complete licence</a>.</p>
        <p>Exact package versions and licence texts are retained with each generated viewer. Keep those notices with any redistribution; this index does not replace them.</p>
        <ul>{viewerNoticeLinks.map(item => <li key={item.base}><a href={`${item.base}/BUNDLED_NOTICES.txt`}>{item.label} bundled software notices</a> · <a href={`${item.base}/bundled-dependencies.json`}>Package versions</a></li>)}</ul>
      </details>
      <details><summary>Typography</summary>
        <p>Geist Mono, Copyright 2024 The Geist Project Authors, is supplied under the SIL Open Font License 1.1. <a href="/licenses/geist-mono-OFL.txt">Read the complete font licence</a>.</p>
        <p>Other text uses system fallback fonts; operating-system fonts are not bundled by this page.</p>
      </details>
      <details><summary>Teaching references and private imaging</summary>
        <p>Lesson citations identify factual reading sources. They do not grant permission to copy a publisher’s images, prose or datasets. Educational drafts remain subject to their separate, revision-bound clinical review.</p>
        <p>Owner-supplied CT/MRI scans, masks and annotations are separate controlled resources. They are not covered by the preview-image or software licences above. Atlas, imaging-case and lecture access remain independent; no access or reuse permission is granted here.</p>
      </details>
    </div>
    <p className="source-credits-boundary">This is an index to selected retained notices, not an exhaustive rights clearance, clinical approval or guarantee of future hosting costs.</p>
    <nav className="source-credits-back" aria-label="More about Visible Medicine"><Link href="/atlas">Explore the atlas</Link><Link href="/trust">Trust centre</Link></nav>
  </main>;
}
