const atlasDocuments = new Set([
  '/atlas-runtime/shoulder/index.html',
  '/atlas-runtime/female-pelvis/index.html',
  '/atlas-runtime/lower-limb/index.html',
  '/atlas-runtime/head-neck/index.html',
]);

/** Only the contained anatomy documents need the bundled mesh decoder's WASM.
 * This does not enable JavaScript eval or add any remote script source. */
export function contentSecurityPolicy(pathname: string): string {
  const wasm = atlasDocuments.has(pathname) ? " 'wasm-unsafe-eval'" : '';
  return `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self' 'unsafe-inline'${wasm}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss:; worker-src 'self' blob:`;
}
