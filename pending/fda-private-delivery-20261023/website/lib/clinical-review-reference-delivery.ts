import {
  privateReferenceObjectKey,
  resolvePrivateReferenceAsset,
  type PrivateReferenceFile,
} from './clinical-review-reference-registry.ts';

const baseHeaders = () => new Headers({
  'Cache-Control': 'private, no-store',
  Vary: 'Cookie',
  'X-Content-Type-Options': 'nosniff',
  'Cross-Origin-Resource-Policy': 'same-origin',
});

function failure(status: number, message: string): Response {
  const headers = baseHeaders();
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify({ error: message }), { status, headers });
}

function verifiedObject(object: R2Object, file: PrivateReferenceFile, key: string): boolean {
  const checksum = object.checksums?.sha256;
  const hex = checksum && Array.from(new Uint8Array(checksum), byte => byte.toString(16).padStart(2, '0')).join('');
  return object.key === key && object.size === file.bytes && hex === file.sha256;
}

function singleRange(value: string, size: number): { offset: number; length: number } | null {
  const match = /^bytes=((?:0|[1-9]\d*)?)-((?:0|[1-9]\d*)?)$/.exec(value);
  if (!match || (!match[1] && !match[2])) return null;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix < 1) return null;
    const length = Math.min(size, suffix);
    return { offset: size - length, length };
  }
  const offset = Number(match[1]);
  const end = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(end) || offset >= size || end < offset) return null;
  return { offset, length: Math.min(end, size - 1) - offset + 1 };
}

/** Reauthorize before every method, path, registry, conditional, or store decision. */
export async function handlePrivateReferenceDelivery(
  request: Request,
  registry: unknown,
  bucket: Pick<R2Bucket, 'head' | 'get'>,
  authorize: () => Promise<void>,
): Promise<Response> {
  try {
    await authorize();
  } catch (error) {
    const status = error && typeof error === 'object' && 'status' in error &&
      [401, 403, 409, 503].includes(Number(error.status)) ? Number(error.status) : 503;
    return failure(status, 'Private reference access is unavailable.');
  }

  try {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const response = failure(405, 'Use GET or HEAD.');
      response.headers.set('Allow', 'GET, HEAD');
      return response;
    }
    const url = new URL(request.url);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.username || url.password)
      return failure(404, 'Private reference asset was not found.');
    const resolved = resolvePrivateReferenceAsset(url, registry);
    if (!resolved) return failure(404, 'Private reference asset was not found.');
    const { file } = resolved;
    const key = privateReferenceObjectKey(file);
    const metadata = await bucket.head(key);
    if (!metadata || !verifiedObject(metadata, file, key))
      return failure(503, 'Private reference asset could not be verified.');

    const headers = baseHeaders();
    const etag = `"${file.sha256}"`;
    headers.set('ETag', etag);
    headers.set('Content-Type', file.contentType);
    headers.set('Accept-Ranges', 'bytes');
    if ((request.headers.get('if-none-match') ?? '').split(',').some(value =>
      value.trim() === '*' || value.trim().replace(/^W\//, '') === etag))
      return new Response(null, { status: 304, headers });

    let range: { offset: number; length: number } | undefined;
    const requestedRange = request.headers.get('range');
    if (request.method === 'GET' && requestedRange &&
      (!request.headers.has('if-range') || request.headers.get('if-range') === etag)) {
      range = singleRange(requestedRange, file.bytes) ?? undefined;
      if (!range) {
        const response = failure(416, 'Invalid private reference range.');
        response.headers.set('Content-Range', `bytes */${file.bytes}`);
        return response;
      }
    }
    headers.set('Content-Length', String(range?.length ?? file.bytes));
    if (request.method === 'HEAD') return new Response(null, { headers });

    const object = await bucket.get(key, range ? { range } : undefined);
    if (!object || !verifiedObject(object, file, key)) {
      await object?.body?.cancel();
      return failure(503, 'Private reference asset could not be verified.');
    }
    if (range) headers.set('Content-Range', `bytes ${range.offset}-${range.offset + range.length - 1}/${file.bytes}`);
    return new Response(object.body, { status: range ? 206 : 200, headers });
  } catch {
    return failure(503, 'Private reference delivery is unavailable.');
  }
}
