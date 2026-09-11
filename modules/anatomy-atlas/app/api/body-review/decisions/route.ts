import { env } from 'cloudflare:workers';
import { getBodyDecisions, postBodyDecision } from '@/lib/body-review-api';

export const dynamic = 'force-dynamic';
export const GET = (request: Request) => getBodyDecisions(request, env.DB);
export const POST = (request: Request) => postBodyDecision(request, env.DB);
