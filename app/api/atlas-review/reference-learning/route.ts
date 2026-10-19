import {env} from 'cloudflare:workers';
import {runClinicalReview} from '@/lib/clinical-review-server';
import {regionalMriReviewSource} from '@/lib/regional-mri-review-source';
import {buildRegionalMri3dCatalogue} from '@/lib/regional-mri-3d-catalogue';
import {getRegionalReferenceDrafts,postRegionalReferenceDraft} from '@/lib/regional-reference-draft-api';
export const dynamic='force-dynamic';
export async function GET(request:Request){return runClinicalReview(request,async guarded=>{
 const source=regionalMriReviewSource(),catalogue=source?await buildRegionalMri3dCatalogue(source):null;
 return getRegionalReferenceDrafts(guarded,env.DB?.withSession('first-primary'),catalogue);
});}
export async function POST(request:Request){return runClinicalReview(request,async guarded=>{
 const source=regionalMriReviewSource(),catalogue=source?await buildRegionalMri3dCatalogue(source):null;
 return postRegionalReferenceDraft(guarded,env.DB?.withSession('first-primary'),catalogue);
});}
