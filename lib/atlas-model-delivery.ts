import { AtlasModelError, atlasModelFailure, handleAtlasModel, type AtlasStoredModel } from './atlas-model-storage.ts';

const originalPrefix = '/atlas-runtime/';
const apiPrefix = '/api/atlas-delivery/';
const modelPath = /^\/atlas-runtime\/(shoulder|female-pelvis|lower-limb|head-neck)\/models\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.glb$/;

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
    // Authentication remains before every conditional/range read. The shared
    // storage implementation checks the exact key, R2 checksum and size again.
    const response = await handleAtlasModel(request, model.sha256, [model], bucket, async () => undefined);
    response.headers.set('X-Atlas-Delivery', 'registered-storage-v1');
    return response;
  } catch (error) { return atlasModelFailure(error); }
}
