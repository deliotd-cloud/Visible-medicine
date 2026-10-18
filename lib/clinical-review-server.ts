import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { clinicalReviewPrincipal, ClinicalReviewAccessError } from './clinical-review-access';

export async function authorizeClinicalReview() {
  const user = await getChatGPTUser();
  if (!user) throw new ClinicalReviewAccessError(401, 'Sign in to open Clinical Review.');
  if (!env.DB) throw new ClinicalReviewAccessError(503, 'Review storage is unavailable.');
  return clinicalReviewPrincipal(env.DB, user.userId);
}

export async function runClinicalReview(request: Request, handler: (request: Request) => Promise<Response>) {
  try {
    const principal = await authorizeClinicalReview();
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(principal.storageKey));
    const context = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    if (request.method === 'POST' && request.headers.get('X-Clinical-Review-Context') !== context)
      throw new ClinicalReviewAccessError(409, 'Your account or institution changed, or saved history has not loaded. Keep your edits and reload Clinical Review before saving.');
    const headers = new Headers(request.headers);
    // The vendored handlers see only this server-derived opaque private key.
    headers.set('oai-authenticated-user-id', principal.storageKey);
    // vinext development bridges Node and workerd Request realms. Construct
    // from the URL and stream explicitly instead of depending on instanceof.
    const response = await handler(new Request(request.url, {
      method: request.method, headers,
      ...(request.method === 'GET' || request.method === 'HEAD' ? {} : { body: request.body, duplex: 'half' }),
    } as RequestInit));
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Vary', 'Cookie, oai-authenticated-user-id');
    response.headers.set('X-Clinical-Review-Context', context);
    return response;
  } catch (error) {
    const known = error instanceof ClinicalReviewAccessError;
    if (!known) console.error(JSON.stringify({ event: 'clinical-review-unavailable', ...(import.meta.env.DEV ? { detail: String(error) } : {}) }));
    return Response.json({ error: known ? error.message : 'Clinical Review is unavailable. Your edits have not been discarded.' }, {
      status: known ? error.status : 503,
      headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie, oai-authenticated-user-id' },
    });
  }
}
