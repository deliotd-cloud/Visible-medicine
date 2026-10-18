import { atlasModelKey } from './atlas-model-storage.ts';
import {
  candidateObjectKey,
  resolveCandidate,
  safeCandidatePath,
  type ClinicalReviewCandidateFile,
} from './clinical-review-candidate.ts';

const headers = () => new Headers({
  'Cache-Control': 'private, no-store',
  Vary: 'Cookie',
  'X-Content-Type-Options': 'nosniff',
  'Cross-Origin-Resource-Policy': 'same-origin',
});

function failure(status: number, message: string): Response {
  const responseHeaders = headers();
  responseHeaders.set('Content-Type', 'application/json');
  return new Response(JSON.stringify({ error: message }), { status, headers: responseHeaders });
}

function verifiedObject(object: R2Object, file: ClinicalReviewCandidateFile, key: string): boolean {
  const digest = object.checksums.sha256;
  const hex = digest && Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return object.key === key && object.size === file.bytes && hex === file.sha256;
}

function rangeFor(value: string, size: number): { offset: number; length: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2])) return null;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix < 1) return null;
    const length = Math.min(size, suffix);
    return { offset: size - length, length };
  }
  const offset = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(requestedEnd) ||
    offset >= size || requestedEnd < offset) return null;
  return { offset, length: Math.min(requestedEnd, size - 1) - offset + 1 };
}

/** Reauthorize every request, including missing paths, HEAD, ranges and 304s. */
export async function handleCandidateAsset(
  request: Request,
  candidateId: string,
  path: string,
  candidates: readonly unknown[],
  bucket: Pick<R2Bucket, 'head' | 'get'>,
  authorize: () => Promise<void>,
): Promise<Response> {
  try {
    await authorize();
  } catch (error) {
    const status = error && typeof error === 'object' && 'status' in error &&
      [401, 403, 409, 503].includes(Number(error.status)) ? Number(error.status) : 503;
    return failure(status, 'Candidate access is unavailable.');
  }
  try {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const response = failure(405, 'Use GET or HEAD.');
      response.headers.set('Allow', 'GET, HEAD');
      return response;
    }
    if (!safeCandidatePath(path)) return failure(404, 'Candidate asset was not found.');
    const candidate = await resolveCandidate(candidates, candidateId);
    if (!candidate) return failure(404, 'Candidate was not found.');
    const file = candidate.files.find(entry => entry.path === path);
    if (!file) return failure(404, 'Candidate asset was not found.');
    const key = file.storage === 'atlas-model' ? atlasModelKey(file.sha256) : candidateObjectKey(file.sha256);
    const metadata = await bucket.head(key);
    if (!metadata || !verifiedObject(metadata, file, key)) return failure(503, 'Candidate asset could not be verified.');
    const resultHeaders = headers();
    const etag = `"${file.sha256}"`;
    resultHeaders.set('ETag', etag);
    resultHeaders.set('Content-Type', file.contentType);
    resultHeaders.set('Accept-Ranges', 'bytes');
    if ((request.headers.get('if-none-match') ?? '').split(',').some(value =>
      value.trim() === '*' || value.trim().replace(/^W\//, '') === etag))
      return new Response(null, { status: 304, headers: resultHeaders });
    let range: { offset: number; length: number } | undefined;
    const requestedRange = request.headers.get('range');
    if (request.method === 'GET' && requestedRange &&
      (!request.headers.has('if-range') || request.headers.get('if-range') === etag)) {
      range = rangeFor(requestedRange, file.bytes) ?? undefined;
      if (!range) {
        const response = failure(416, 'Invalid candidate asset range.');
        response.headers.set('Content-Range', `bytes */${file.bytes}`);
        return response;
      }
    }
    resultHeaders.set('Content-Length', String(range?.length ?? file.bytes));
    if (request.method === 'HEAD') return new Response(null, { headers: resultHeaders });
    const object = await bucket.get(key, range ? { range } : undefined);
    if (!object || !verifiedObject(object, file, key)) {
      await object?.body?.cancel();
      return failure(503, 'Candidate asset could not be verified.');
    }
    if (range) resultHeaders.set('Content-Range', `bytes ${range.offset}-${range.offset + range.length - 1}/${file.bytes}`);
    return new Response(object.body, { status: range ? 206 : 200, headers: resultHeaders });
  } catch {
    return failure(503, 'Candidate delivery is unavailable.');
  }
}
