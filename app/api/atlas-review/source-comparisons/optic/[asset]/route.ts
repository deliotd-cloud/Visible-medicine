import 'server-only';
import { runClinicalReview } from '@/lib/clinical-review-server';
import { deliverOpticComparison } from '@/lib/optic-comparison-delivery';
import packet from '@/lib/optic-comparison-manifest.json';
import { opticComparisonAssets } from '@/.local/optic-review/assets';

export const dynamic = 'force-dynamic';
export function GET(request: Request) {
  return runClinicalReview(request, authenticated => deliverOpticComparison(authenticated, packet, opticComparisonAssets));
}
export const HEAD = GET;
