import { authorizeClinicalReview } from '@/lib/clinical-review-server';
import packet from '@/lib/optic-comparison-manifest.json';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Held optic comparison · Clinical Review', robots: { index: false, follow: false } };
export default async function OpticComparisonPage() {
  // RSC children can render independently of their layout. Guard the page too.
  try { await authorizeClinicalReview(); }
  catch { return <p role="alert">Open Clinical Review with an authorized administrator account to view this comparison.</p>; }
  return <main>
    <nav className="review-model-bar" aria-label="Comparison navigation">
      <a href="/workspace/atlas-review">← Clinical Review</a>
      <strong>Optic nerve alternatives</strong>
      <span>Held · Draft notes only · Report {packet.reportSha256.slice(0,12)}</span>
    </nav>
    <iframe className="review-model-frame" title="Held optic nerve comparison: matched rotation and overlay"
      src={'/api/atlas-review/source-comparisons/optic/index.html?revision='+packet.reportSha256} />
    <p className="review-account-scope">Compare each anatomical side, then export your revision-bound draft note. No opinion is uploaded or applied automatically; both source holds remain. No patient imaging or registration is included.</p>
  </main>;
}
