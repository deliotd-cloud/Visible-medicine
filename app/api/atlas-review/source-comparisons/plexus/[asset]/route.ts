import 'server-only';
import {runClinicalReview} from '@/lib/clinical-review-server';
import {deliverPlexusReview} from '@/lib/plexus-review-delivery';
import packet from '@/lib/plexus-review-manifest.json';
import {plexusReviewAssets} from '@/.local/plexus-review/assets';
export const dynamic='force-dynamic';
export function GET(request:Request){return runClinicalReview(request,authenticated=>deliverPlexusReview(authenticated,packet,plexusReviewAssets));}
export const HEAD=GET;
