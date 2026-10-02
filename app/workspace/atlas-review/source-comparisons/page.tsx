import {authorizeClinicalReview} from '@/lib/clinical-review-server';

export const dynamic = 'force-dynamic';
export const metadata = {title:'Source comparisons · Clinical Review',robots:{index:false,follow:false}};
export default async function SourceComparisonsPage() {
  try { await authorizeClinicalReview(); }
  catch { return <p role="alert">Open Clinical Review with an authorized administrator account to view source comparisons.</p>; }
  return <main className="review-workspace">
    <h1>Source comparisons</h1>
    <p>Inspect held source geometry before deciding its identity or extent. Draft notes do not approve anatomy.</p>
    <ul>
      <li><a href="/workspace/atlas-review/source-comparisons/optic">Optic nerve alternatives</a><p>Compare original right and left candidates in matched views or overlay.</p></li>
      <li><a href="/workspace/atlas-review/source-comparisons/disc">Unresolved disc</a><p>Compare two generic source definitions with optional vertebral context. Named level remains unassigned.</p></li>
    </ul>
  </main>;
}
