import { authorizeClinicalReview } from '@/lib/clinical-review-server';
import manifest from '@/lib/foot-comparison-manifest.json';

export const dynamic='force-dynamic';
export const metadata={title:'Held foot source specimen · Clinical Review',robots:{index:false,follow:false}};
export default async function FootComparisonPage(){
  try{await authorizeClinicalReview();}catch{return <p role="alert">Open Clinical Review with an authorized administrator account to view this comparison.</p>;}
  return <main><nav className="review-model-bar" aria-label="Comparison navigation"><a href="/workspace/atlas-review/source-comparisons">← Source comparisons</a><strong>Foot interossei source specimen</strong><span>Held · Inspection only · {manifest.revision.slice(0,12)}</span></nav>
    <iframe className="review-model-frame" title="Held foot interossei v3 source specimen, compact and detail" src={'/api/atlas-review/source-comparisons/foot/index.html?revision='+manifest.revision+'&detail=99'} />
    <p className="review-account-scope">Original v3 groups FMA74140 and FMA74141 with ten matched metatarsals. Compact and detail specimens are separate. Small fragments and duplicate faces remain. No individual muscle segmentation, source-to-v4 or patient registration, Atlas admission, or clinical approval is implied. Source assets retain CC BY-SA 2.1 Japan rights.</p>
  </main>;
}
