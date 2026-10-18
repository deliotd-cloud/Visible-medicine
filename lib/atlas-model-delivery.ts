import { AtlasModelError, atlasModelFailure, handleAtlasModel, type AtlasStoredModel } from './atlas-model-storage.ts';
import { selectAtlasEncoding } from './atlas-content-encoding.ts';

const originalPrefix = '/atlas-runtime/';
const apiPrefix = '/api/atlas-delivery/';
const modelPath = /^\/atlas-runtime\/(shoulder|female-pelvis|lower-limb|head-neck)\/models\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.glb$/;

/** Called only after registered storage validation; never buffers the model. */
export function gzipAtlasDelivery(response: Response, sha256: string): Response {
  const headers = new Headers(response.headers);
  headers.set('Content-Encoding', 'gzip');
  // Same canonical model, but not byte-identical on wire.
  headers.set('ETag', `W/"${sha256}"`);
  headers.delete('Content-Length');
  // Leave the canonical stream unchanged. Workers encodes it once on the wire
  // using Content-Encoding; the ordinary outer security wrapper stays automatic.
  // https://developers.cloudflare.com/workers/runtime-apis/response/#parameters
  return new Response(response.body, { status: response.status, headers, encodeBody: 'automatic' });
}

function clientAcceptEncoding(request: Request): string | null {
  const original = request.cf?.clientAcceptEncoding;
  return typeof original === 'string' ? original : request.headers.get('accept-encoding');
}

/** Preserve model URLs and source version queries; only the server transport changes. */
export function atlasDeliveryForwardUrl(input: URL): URL | null {
  if (!modelPath.test(input.pathname)) return null;
  const forwarded = new URL(input);
  forwarded.pathname = apiPrefix + input.pathname.slice(originalPrefix.length);
  return forwarded;
}

export function resolveAtlasDeliveryModel(input: URL, models: readonly AtlasStoredModel[]): AtlasStoredModel {
  const path = input.pathname.startsWith(apiPrefix)
    ? originalPrefix + input.pathname.slice(apiPrefix.length) : input.pathname;
  if (!modelPath.test(path)) throw new AtlasModelError('Model is not registered for this Atlas release.', 404);
  const matches = models.filter(model => model.paths.includes(path));
  if (matches.length !== 1) throw new AtlasModelError('Model is not registered for this Atlas release.', matches.length ? 503 : 404);
  const model = matches[0];
  const versions = input.searchParams.getAll('v');
  if ([...input.searchParams.keys()].some(key => key !== 'v') || versions.length > 1
    || (versions.length === 1 && (!/^(?:[a-f0-9]{12}|[a-f0-9]{64})$/.test(versions[0]) || !model.sha256.startsWith(versions[0])))) {
    throw new AtlasModelError('The model revision does not match this Atlas. Reload the module.', 409);
  }
  return model;
}

export async function handleAtlasDelivery(
  request: Request, models: readonly AtlasStoredModel[],
  bucket: Pick<R2Bucket, 'head' | 'get' | 'put'>,
  authorize: () => Promise<void>,
) {
  try {
    await authorize();
    if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD', 'Cache-Control': 'private, no-store' } });
    const model = resolveAtlasDeliveryModel(new URL(request.url), models);
    // Ranges always address the canonical, unencoded GLB bytes. Never encode
    // a range, even when a stale If-Range causes storage to return the full file.
    // Cloudflare can normalize the header to "br, gzip". The platform-owned
    // cf property preserves what this client actually accepts (including "").
    const encoding = selectAtlasEncoding(clientAcceptEncoding(request), !request.headers.has('range'));
    if (!encoding) throw new AtlasModelError('No acceptable Atlas delivery encoding is available.', 406);
    // Authentication remains before every conditional/range read. The shared
    // storage implementation checks the exact key, R2 checksum and size again.
    const response = await handleAtlasModel(request, model.sha256, [model], bucket, async () => undefined);
    response.headers.set('X-Atlas-Delivery', 'registered-storage-v1');
    response.headers.set('Vary', 'Cookie, Accept-Encoding');
    if (encoding === 'gzip' && [200, 304].includes(response.status)) {
      return gzipAtlasDelivery(response, model.sha256);
    }
    return response;
  } catch (error) {
    const response = atlasModelFailure(error);
    response.headers.set('Vary', 'Cookie, Accept-Encoding');
    // With no acceptable representation, do not attach an unencoded JSON body
    // that the runtime could reject on behalf of an identity-forbidding client.
    if (response.status === 406 || !selectAtlasEncoding(clientAcceptEncoding(request), true)) {
      response.headers.set('Content-Type', 'application/octet-stream');
      return new Response(null, { status: response.status, headers: response.headers });
    }
    return response;
  }
}
