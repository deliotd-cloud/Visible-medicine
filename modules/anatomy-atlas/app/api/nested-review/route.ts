import { env } from 'cloudflare:workers';
import { getNestedReviews, postNestedReview } from '@/lib/nested-review-api';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) => getNestedReviews(request, env.DB);
export const POST = (request: Request) => postNestedReview(request, env.DB);
