import { env } from 'cloudflare:workers';
import { getClinicalReviewQueue } from '@/lib/clinical-review-queue';

export const dynamic = 'force-dynamic';
export const GET = (request: Request) => getClinicalReviewQueue(request, env.DB);
