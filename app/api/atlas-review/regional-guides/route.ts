import {env} from 'cloudflare:workers';
import {runClinicalReview} from '@/lib/clinical-review-server';
import {getRegionalGuideReviews,postRegionalGuideReview} from '@/lib/regional-guide-review-api';
export const dynamic='force-dynamic';
export const GET=(request:Request)=>runClinicalReview(request,guarded=>getRegionalGuideReviews(guarded,env.DB?.withSession('first-primary')));
export const POST=(request:Request)=>runClinicalReview(request,guarded=>postRegionalGuideReview(guarded,env.DB?.withSession('first-primary')));
