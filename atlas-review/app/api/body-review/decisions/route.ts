import { env } from 'cloudflare:workers';
import { getBodyDecisions, postBodyDecision } from '@/atlas-review/lib/body-review-api';

export const dynamic = 'force-dynamic';
export const GET = (request: Request) => getBodyDecisions(request, env.DB.withSession('first-primary') as unknown as D1Database);
export const POST = (request: Request) => postBodyDecision(request, env.DB.withSession('first-primary') as unknown as D1Database);
