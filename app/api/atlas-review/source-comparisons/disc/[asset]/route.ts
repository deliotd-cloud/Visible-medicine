import 'server-only';
import {runClinicalReview} from '@/lib/clinical-review-server';
import {deliverDiscComparison} from '@/lib/disc-comparison-delivery';
import packet from '@/lib/disc-comparison-manifest.json';
import {discComparisonAssets} from '@/.local/disc-review/assets';

export const dynamic = 'force-dynamic';
export function GET(request: Request) {
  return runClinicalReview(request,authenticated=>deliverDiscComparison(authenticated,packet,discComparisonAssets));
}
export const HEAD = GET;
