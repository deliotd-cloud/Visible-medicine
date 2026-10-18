// Staging only: the learner Atlas continues to use its existing static assets.
// No private scans, arbitrary keys, external URLs, deletion or overwrite API.
export type AtlasStoredModel = { sha256: string; bytes: number; paths: readonly string[] };
export class AtlasModelError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}
export const ATLAS_MODEL_MAX_BYTES = 32 * 1024 * 1024;
export const atlasModelKey = (sha256: string) => `atlas-models/v1/${sha256}.glb`;
const baseHeaders = () => new Headers({
  'Cache-Control': 'private, no-store', 'Vary': 'Cookie',
  'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin',
});
export function atlasModelFailure(error: unknown) {
  const status = error instanceof AtlasModelError ? error.status : 503;
  if (!(error instanceof AtlasModelError)) console.error(JSON.stringify({ event: 'atlas-model-storage-unavailable' }));
  return Response.json({ error: error instanceof AtlasModelError ? error.message : 'Model storage is unavailable. Existing Atlas delivery is unchanged.' }, { status, headers: baseHeaders() });
}
function verifyObject(object: R2Object, model: AtlasStoredModel) {
  const digest = object.checksums.sha256;
  const hex = digest ? Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('') : '';
  if (object.key !== atlasModelKey(model.sha256) || object.size !== model.bytes || hex !== model.sha256) {
    throw new AtlasModelError('Stored model does not match this release. No overwrite was attempted.', 409);
  }
}
export function modelByteRange(value: string, bytes: number): { offset: number; length: number } {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2])) throw new AtlasModelError('Unsupported byte range.', 416);
  const first = Number(match[1]), last = Number(match[2]);
  if (!Number.isSafeInteger(first) || !Number.isSafeInteger(last)) throw new AtlasModelError('Invalid byte range.', 416);
  if (!match[1]) {
    if (last === 0) throw new AtlasModelError('Invalid byte range.', 416);
    const length = Math.min(last, bytes);
    return { offset: bytes - length, length };
  }
  const end = match[2] ? Math.min(last, bytes - 1) : bytes - 1;
  if (first >= bytes || end < first) throw new AtlasModelError('Byte range is outside this model.', 416);
  return { offset: first, length: end - first + 1 };
}

export async function handleAtlasModel(
  request: Request,
  sha256: string,
  models: readonly AtlasStoredModel[],
  bucket: Pick<R2Bucket, 'head' | 'get' | 'put'>,
  authorize: () => Promise<void>,
): Promise<Response> {
  try {
    // Every request, including HEAD/conditional reads, must recheck permission.
    await authorize();
    if (!['GET', 'HEAD', 'PUT'].includes(request.method)) return new Response(null, { status: 405, headers: { ...Object.fromEntries(baseHeaders()), Allow: 'GET, HEAD, PUT' } });
    const model = /^[a-f0-9]{64}$/.test(sha256) ? models.find(model => model.sha256 === sha256) : undefined;
    if (!model || !Number.isSafeInteger(model.bytes) || model.bytes < 12 || model.bytes > ATLAS_MODEL_MAX_BYTES) throw new AtlasModelError('Model is not registered for this release.', 404);
    const key = atlasModelKey(sha256);
    if (request.method === 'PUT') {
      if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') throw new AtlasModelError('Use the model upload page on this website.', 403);
      if (!['model/gltf-binary', 'application/octet-stream'].includes(request.headers.get('content-type') ?? '') || request.headers.has('content-encoding') || request.headers.has('content-range')) throw new AtlasModelError('Upload one complete, unencoded GLB file.', 415);
      const length = request.headers.get('content-length');
      if (!length || !/^\d+$/.test(length)) throw new AtlasModelError('A file with a known byte length is required.', 411);
      if (Number(length) !== model.bytes || !request.body) throw new AtlasModelError('File length does not match this release.', 413);
      const existing = await bucket.head(key);
      if (existing) {
        verifyObject(existing, model);
        return Response.json({ sha256, bytes: model.bytes, status: 'already-stored' }, { headers: baseHeaders() });
      }
      // FixedLengthStream rejects both short and oversized streams. R2 validates
      // SHA-256 over the received bytes; a client-supplied checksum is not trusted.
      const stream = new FixedLengthStream(model.bytes);
      const abort = new AbortController();
      const transfer = request.body.pipeTo(stream.writable, { signal: abort.signal });
      const write = bucket.put(key, stream.readable, {
        onlyIf: { etagDoesNotMatch: '*' }, sha256,
        storageClass: 'Standard', httpMetadata: { contentType: 'model/gltf-binary' },
        customMetadata: { purpose: 'licensed-atlas-model', sha256 },
      }).finally(() => abort.abort());
      // Settle both sides even when a concurrent immutable upload wins or fails.
      const [result, transferred] = await Promise.allSettled([write, transfer]);
      if (result.status === 'rejected') throw new AtlasModelError('Upload was not accepted. Check the file and storage availability; no release was activated.', 422);
      if (result.value && transferred.status === 'rejected') throw new AtlasModelError('The upload stream did not finish correctly. Verify storage before retrying.', 409);
      const stored = result.value ?? await bucket.head(key);
      if (!stored) throw new AtlasModelError('Model storage could not confirm the upload.', 503);
      verifyObject(stored, model);
      return Response.json({ sha256, bytes: model.bytes, status: result.value ? 'stored' : 'already-stored' }, { status: result.value ? 201 : 200, headers: baseHeaders() });
    }

    const metadata = await bucket.head(key);
    if (!metadata) throw new AtlasModelError('Model has not been staged.', 404);
    verifyObject(metadata, model);
    const headers = baseHeaders();
    const etag = `"${sha256}"`;
    headers.set('ETag', etag);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Content-Type', 'model/gltf-binary');
    if ((request.headers.get('if-none-match') ?? '').split(',').some(value => value.trim() === '*' || value.trim().replace(/^W\//, '') === etag)) return new Response(null, { status: 304, headers });
    let range: ReturnType<typeof modelByteRange> | undefined;
    const requestedRange = request.headers.get('range');
    const ifRange = request.headers.get('if-range');
    if (request.method === 'GET' && requestedRange && (!ifRange || ifRange === etag)) {
      try { range = modelByteRange(requestedRange, model.bytes); }
      catch (error) { const response = atlasModelFailure(error); response.headers.set('Content-Range', `bytes */${model.bytes}`); return response; }
    }
    headers.set('Content-Length', String(range?.length ?? model.bytes));
    if (request.method === 'HEAD') return new Response(null, { headers });
    const object = await bucket.get(key, range ? { range } : undefined);
    if (!object) throw new AtlasModelError('Model became unavailable. Retry verification.', 503);
    verifyObject(object, model);
    if (range) headers.set('Content-Range', `bytes ${range.offset}-${range.offset + range.length - 1}/${model.bytes}`);
    return new Response(object.body, { status: range ? 206 : 200, headers });
  } catch (error) { return atlasModelFailure(error); }
}
