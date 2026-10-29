import {authorizeClinicalReview} from '@/lib/clinical-review-server';
import {ClinicalReviewAreas} from '@/components/ClinicalReviewAreas';

export const dynamic = 'force-dynamic';
export const metadata = {title:'Source comparisons · Clinical Review',robots:{index:false,follow:false}};
export default async function SourceComparisonsPage() {
  try { await authorizeClinicalReview(); }
  catch { return <p role="alert">Open Clinical Review with an authorized administrator account to view source comparisons.</p>; }
  return <><ClinicalReviewAreas current="source-comparisons" /><main className="review-workspace">
    <h1>Source comparisons</h1>
    <p>Inspect held source geometry before deciding its identity or extent. Draft notes do not approve anatomy.</p>
    <ul>
      <li><a href="/workspace/atlas-review/source-comparisons/plexus">Original brachial plexus schematic</a><p>Inspect 35 named parts and 38 typical connections. Separate revision-bound topology and presentation reviews; not a spatial nerve mesh or learner admission.</p></li>
      <li><a href="/workspace/atlas-review/source-comparisons/optic">Optic nerve alternatives</a><p>Compare original right and left candidates in matched views or overlay.</p></li>
      <li><a href="/workspace/atlas-review/source-comparisons/disc">Unresolved disc</a><p>Compare two generic source definitions with optional vertebral context. Named level remains unassigned.</p></li>
      <li><a href="/workspace/atlas-review/source-comparisons/foot">Foot interossei source specimen</a><p>Inspect two held version-3 muscle groups beside ten source-matched metatarsals at compact or detail resolution. Original specimens and CC BY-SA 2.1 Japan notices are downloadable; no Atlas admission or individual segmentation.</p></li>
    </ul>
    <h2>Teaching drafts</h2>
    <p><a href="/workspace/atlas-review/head-learning">Head learning · anatomy and comparisons</a> — source-backed teaching and separately scoped CT/MRI/3D evidence, including cerebellar CT/MRI-only comparisons. Inspect exact revisions and save private notes, corrections or supported semantic comparison decisions. These do not approve geometry, clinical use or publication.</p>
  </main></>;
}
