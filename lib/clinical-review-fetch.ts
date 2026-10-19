'use client';

// Per-document identity continuity, never an authorization grant. The server
// independently authenticates and checks institution membership on every call.
let context: string | null = null;
export async function clinicalReviewFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (context) headers.set('X-Clinical-Review-Context', context);
  const response = await fetch(input, { ...init, headers });
  const received = response.headers.get('X-Clinical-Review-Context');
  if (response.ok && received) {
    if (context && received !== context) return Response.json({ error: 'Your account or institution changed. Keep or export your edits, then reload Clinical Review before saving.' }, { status: 409 });
    context = received;
  }
  return response;
}
