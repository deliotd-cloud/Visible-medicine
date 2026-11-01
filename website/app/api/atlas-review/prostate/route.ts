import {env} from 'cloudflare:workers';
import {runClinicalReview} from '@/lib/clinical-review-server';
import {getProstateReviews, postProstateReview} from '@/lib/prostate-review-api';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) => runClinicalReview(request, guarded => getProstateReviews(guarded, env.DB?.withSession('first-primary')));
export const POST = (request: Request) => runClinicalReview(request, guarded => postProstateReview(guarded, env.DB?.withSession('first-primary')));
