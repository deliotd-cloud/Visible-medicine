import { isAtlasModelAssetRequest } from '../lib/atlas-static-boundary.ts';

/** Vite must transform development JS/CSS before the application Worker runs.
 * Production still invokes the Worker for every asset. In development this
 * first middleware protects model URLs before Vite's public-file middleware.
 * https://developers.cloudflare.com/workers/vite-plugin/reference/static-assets/
 */
export function atlasWorkerFirst(command) {
  if (command === 'build') return true;
  if (command === 'serve') return false;
  throw new Error('Unknown Atlas build command');
}

export function createDevelopmentModelGuard(modelPaths, privateReferencePaths = []) {
  const raw = new Set(modelPaths);
  if (!raw.size || raw.size !== modelPaths.length || modelPaths.some(path =>
    !/^\/atlas-runtime\/(?:shoulder|female-pelvis|lower-limb|head-neck)\/models\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.glb$/.test(path)))
    throw new Error('Exact registered Atlas model paths are required');
  const api = new Set(modelPaths.map(path => path.replace('/atlas-runtime/', '/api/atlas-delivery/')));
  const references = new Set(privateReferencePaths);
  if (references.size !== privateReferencePaths.length || privateReferencePaths.some(path =>
    !/^\/api\/atlas-delivery\/references\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-f0-9]{64}\/models\/[a-z0-9]+(?:-[a-z0-9]+)*\/(?:reference\.glb|catalog\.json)$/.test(path)))
    throw new Error('Exact private reference API paths are required');
  return (request, response, next) => {
    let url;
    try { url = new URL(request.url ?? '/', 'http://127.0.0.1'); }
    catch { return refuse(); }
    if (!isAtlasModelAssetRequest(url)) return next();
    // Keep the original query and method: the existing API must authenticate,
    // validate v/ranges/conditions and perform every storage check itself.
    if (raw.has(url.pathname)) {
      request.url = url.pathname.replace('/atlas-runtime/', '/api/atlas-delivery/') + url.search;
      return next();
    }
    if (api.has(url.pathname) || references.has(url.pathname)) return next();
    return refuse();
    function refuse() {
      response.statusCode = 404;
      response.setHeader('Cache-Control', 'private, no-store');
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.end();
    }
  };
}

/** @returns {import('vite').Plugin} */
export function localAtlasDevelopmentPlugin(modelPaths, privateReferencePaths = []) {
  const guard = createDevelopmentModelGuard(modelPaths, privateReferencePaths);
  return {
    name: 'vm-protected-atlas-development-assets',
    apply: 'serve',
    enforce: 'pre',
    configureServer(server) { server.middlewares.use(guard); },
  };
}
