import { env } from 'cloudflare:workers';
import { getNestedReviews, postNestedReview } from '@/atlas-review/lib/nested-review-api';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) => getNestedReviews(request, env.DB.withSession('first-primary') as unknown as D1Database);
export const POST = (request: Request) => postNestedReview(request, env.DB.withSession('first-primary') as unknown as D1Database);
