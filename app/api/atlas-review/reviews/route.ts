import * as source from '@/atlas-review/app/api/reviews/route';
import { runClinicalReview } from '@/lib/clinical-review-server';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) => runClinicalReview(request, source.GET);
export const POST = (request: Request) => runClinicalReview(request, source.POST);
