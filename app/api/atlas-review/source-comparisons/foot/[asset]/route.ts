import 'server-only';
import { runClinicalReview } from '@/lib/clinical-review-server';
import { deliverFootComparison } from '@/lib/foot-comparison-delivery';
import manifest from '@/lib/foot-comparison-manifest.json';
import { footComparisonAssets } from '@/.local/foot-review/assets';

export const dynamic='force-dynamic';
export function GET(request:Request){return runClinicalReview(request,authenticated=>deliverFootComparison(authenticated,manifest,footComparisonAssets));}
export const HEAD=GET;
