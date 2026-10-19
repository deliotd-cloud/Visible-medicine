import {authorizeClinicalReview} from '@/lib/clinical-review-server';
import {RegionalMriReviewViewer} from '@/components/RegionalMriReviewViewer';
import {regionalMriReviewSource} from '@/lib/regional-mri-review-source';
import {regionalMri3dCatalogue} from '@/lib/regional-mri-3d-catalogue';
import {regionalMriReviewContext} from '@/lib/regional-mri-review-context';

export const dynamic='force-dynamic';
export const metadata={title:'Regional MRI inspection · Clinical Review',robots:{index:false,follow:false}};
export default async function RegionalMriReviewPage(){
  try{await authorizeClinicalReview();}
  catch{return <p role="alert">Open Clinical Review with an authorized administrator account to inspect regional MRI sources.</p>;}
  const source=regionalMriReviewSource();
  const context=source?await regionalMriReviewContext(source):null;
  const comparisons=source?await regionalMri3dCatalogue(source):null;
  return <main className="review-workspace">
    <p><a href="/workspace/clinical-review-inbox">← Clinical Review inbox</a></p>
    <h1>Regional MRI inspection</h1>
    <p>Private Education source inspection, not learner publication or clinical sign-off. The existing CT/MRI head atlases are unchanged.</p>
    <p>{source?'Choose the prepared education-package folder on your computer. Data is read locally, not uploaded. Source-scoped acceptance and provisional inspection are not website sign-off; native binary contours do not inherit the saved smooth-contour appearance.':'A separately verified regional export must be bound in local preview configuration before opening data.'}</p>
    {source&&<details><summary>Independent review context · {context?'ready':'not configured'}</summary>
      {context?<><p>{context.series.length} source sequences · {context.series.reduce((n,s)=>n+s.annotations.length,0)} annotation entries independently bound to the manifest revision.</p>
        <p>Context revision: <code>{context.projectionRevision}</code></p><p>Source identity and review scope only. Private correction drafts are separate from clinical sign-off, source mask changes and publication.</p></>:
        <p>Private visual inspection remains available. Independently verified server annotation context is required before saved correction history can be added.</p>}
    </details>}
    <RegionalMriReviewViewer source={source} comparisons={comparisons} correctionProjectionRevision={context?.projectionRevision??null}/>
  </main>;
}
