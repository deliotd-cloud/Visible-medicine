import {authorizeClinicalReview} from '@/lib/clinical-review-server';
import packet from '@/lib/disc-comparison-manifest.json';

export const dynamic = 'force-dynamic';
export const metadata = {title:'Unresolved disc · Clinical Review',robots:{index:false,follow:false}};
export default async function DiscComparisonPage() {
  try { await authorizeClinicalReview(); }
  catch { return <p role="alert">Open Clinical Review with an authorized administrator account to view this comparison.</p>; }
  return <main>
    <nav className="review-model-bar" aria-label="Comparison navigation">
      <a href="/workspace/atlas-review/source-comparisons">Source comparisons</a>
      <strong>Unresolved disc source</strong>
      <span>Held · Unassigned level · Report {packet.reportSha256.slice(0,12)}</span>
    </nav>
    <iframe className="review-model-frame" title="Held disc source with optional original vertebral context"
      src={'/api/atlas-review/source-comparisons/disc/index.html?revision='+packet.reportSha256}/>
    <p className="review-account-scope">Inspect the original extent and boundaries, then export a draft note. No level or clinical approval is assigned; FJ3211 remains excluded from learner anatomy. No patient imaging is included.</p>
  </main>;
}
