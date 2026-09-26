export class ReviewHttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function authenticatedReviewer(headers: Headers) {
  const id = headers.get('oai-authenticated-user-id');
  if (!id)
    throw new ReviewHttpError(
      401,
      'Sign in to access your private review workspace.',
    );
  return id;
}
export async function reviewBody(request: Request): Promise<unknown> {
  if (
    request.headers.get('origin') !== new URL(request.url).origin ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    throw new ReviewHttpError(
      403,
      'Save requests must originate from this site.',
    );
  if (
    request.headers.get('content-type')?.split(';')[0].trim() !==
    'application/json'
  )
    throw new ReviewHttpError(415, 'Expected a JSON review.');
  const reader = request.body?.getReader();
  if (!reader) throw new ReviewHttpError(400, 'Missing review.');
  const decoder = new TextDecoder();
  let size = 0,
    text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 32000) {
        await reader.cancel();
        throw new ReviewHttpError(
          413,
          'Review is too large. Shorten notes or evidence.',
        );
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new ReviewHttpError(400, 'Invalid JSON review.');
  }
}
export function reviewJson(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      Vary: 'Cookie',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
