import { env } from 'cloudflare:workers';
import { runClinicalReview } from '@/lib/clinical-review-server';
import { getPlexusReviews, postPlexusReview } from '@/lib/plexus-review-api';

export const dynamic = 'force-dynamic';
export const GET = (request:Request) => runClinicalReview(request, inner => getPlexusReviews(inner,env.DB.withSession('first-primary')));
export const POST = (request:Request) => runClinicalReview(request, inner => postPlexusReview(inner,env.DB.withSession('first-primary')));
