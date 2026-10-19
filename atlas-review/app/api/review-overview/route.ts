import { env } from 'cloudflare:workers';
import { getClinicalReviewQueue } from '@/atlas-review/lib/clinical-review-queue';

export const dynamic = 'force-dynamic';
export const GET = (request: Request) => getClinicalReviewQueue(request, env.DB.withSession('first-primary') as unknown as D1Database);
