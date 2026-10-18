import {env} from 'cloudflare:workers';
import {runClinicalReview} from '@/lib/clinical-review-server';
import {getHeadMriDrafts,postHeadMriDraft} from '@/lib/head-mri-review-draft-api';
import {HEAD_MANIFEST_SHA256} from '@/lib/head-atlas-import';

export const dynamic='force-dynamic';
export async function GET(request:Request){return runClinicalReview(request,guarded=>getHeadMriDrafts(guarded,env.DB?.withSession('first-primary'),HEAD_MANIFEST_SHA256));}
export async function POST(request:Request){return runClinicalReview(request,guarded=>postHeadMriDraft(guarded,env.DB?.withSession('first-primary'),HEAD_MANIFEST_SHA256));}
