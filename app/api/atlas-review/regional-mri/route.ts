import {env} from 'cloudflare:workers';
import {runClinicalReview} from '@/lib/clinical-review-server';
import {regionalMriReviewSource} from '@/lib/regional-mri-review-source';
import {regionalMriReviewContext} from '@/lib/regional-mri-review-context';
import {getRegionalMriCorrections,postRegionalMriCorrection} from '@/lib/regional-mri-correction-api';
export const dynamic='force-dynamic';
export async function GET(request:Request){return runClinicalReview(request,async guarded=>{
 const source=regionalMriReviewSource(),context=await regionalMriReviewContext(source);
 return getRegionalMriCorrections(guarded,env.DB?.withSession('first-primary'),context);
});}
export async function POST(request:Request){return runClinicalReview(request,async guarded=>{
 const source=regionalMriReviewSource(),context=await regionalMriReviewContext(source);
 return postRegionalMriCorrection(guarded,env.DB?.withSession('first-primary'),context);
});}
