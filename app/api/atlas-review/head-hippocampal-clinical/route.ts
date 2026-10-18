import {env} from 'cloudflare:workers';
import {runClinicalReview} from '@/lib/clinical-review-server';
import {getHeadTeachingDrafts,postHeadTeachingDraft} from '@/lib/head-teaching-review-api';
import {HEAD_MANIFEST_SHA256} from '@/lib/head-atlas-import';

export const dynamic='force-dynamic';
export async function GET(request:Request){return runClinicalReview(request,guarded=>getHeadTeachingDrafts(guarded,env.DB?.withSession('first-primary'),HEAD_MANIFEST_SHA256,'hippocampal-clinical'));}
export async function POST(request:Request){return runClinicalReview(request,guarded=>postHeadTeachingDraft(guarded,env.DB?.withSession('first-primary'),HEAD_MANIFEST_SHA256,'hippocampal-clinical'));}
