import {env} from 'cloudflare:workers';
import {runClinicalReview} from '@/lib/clinical-review-server';
import {getPairedDecisions,postPairedDecision} from '@/lib/head-paired-decision-api';
import {HEAD_MANIFEST_SHA256} from '@/lib/head-atlas-import';

export const dynamic='force-dynamic';
export async function GET(request:Request){return runClinicalReview(request,guarded=>getPairedDecisions(guarded,env.DB?.withSession('first-primary'),HEAD_MANIFEST_SHA256));}
export async function POST(request:Request){return runClinicalReview(request,guarded=>postPairedDecision(guarded,env.DB?.withSession('first-primary'),HEAD_MANIFEST_SHA256));}
