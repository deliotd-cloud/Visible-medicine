import {env} from 'cloudflare:workers';
import {runClinicalReview} from '@/lib/clinical-review-server';
import {getClinicalReviewInbox} from '@/lib/clinical-review-inbox';
export const dynamic='force-dynamic';
export const GET=(request:Request)=>runClinicalReview(request,adapted=>getClinicalReviewInbox(adapted,env.DB.withSession('first-primary')));
