import { env } from 'cloudflare:workers';
import { authorizeClinicalReview } from '@/lib/clinical-review-server';
import { ClinicalReviewAccessError } from '@/lib/clinical-review-access';
import { FractureError, handleFractureRequest } from '@/lib/fracture-workbooks';

export const dynamic = 'force-dynamic';
async function handle(request: Request) {
  try {
    const principal = await authorizeClinicalReview();
    if (!env.FILES) throw new FractureError(503, 'Image storage is temporarily unavailable.');
    return await handleFractureRequest(request, principal, env.FILES);
  } catch (error) {
    const known = error instanceof FractureError || error instanceof ClinicalReviewAccessError;
    if (!known) console.error(JSON.stringify({ event: 'fracture-workspace-unavailable' }));
    return Response.json({ error: known ? error.message : 'The fracture workspace is temporarily unavailable. Please retry.' }, { status: known ? error.status : 503, headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, oai-authenticated-user-id' } });
  }
}
export const GET = handle;
export const POST = handle;
