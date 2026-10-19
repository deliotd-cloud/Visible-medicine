import {env} from 'cloudflare:workers';
import {runClinicalReview} from '@/lib/clinical-review-server';
import {getFacialDecisions,postFacialDecision} from '@/lib/head-ct-facial-decision-api';
import {HEAD_MANIFEST_SHA256} from '@/lib/head-atlas-import';

export const dynamic='force-dynamic';
export async function GET(request:Request){return runClinicalReview(request,guarded=>getFacialDecisions(guarded,env.DB?.withSession('first-primary'),HEAD_MANIFEST_SHA256));}
export async function POST(request:Request){return runClinicalReview(request,guarded=>postFacialDecision(guarded,env.DB?.withSession('first-primary'),HEAD_MANIFEST_SHA256));}
