import { env } from 'cloudflare:workers';
import { getClinicalReviewQueue } from '@/atlas-review/lib/clinical-review-queue';
import { runClinicalReview } from '@/lib/clinical-review-server';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) => runClinicalReview(request, adapted => getClinicalReviewQueue(adapted, env.DB.withSession('first-primary') as unknown as D1Database));
