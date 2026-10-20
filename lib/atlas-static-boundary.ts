/** Model-like aliases must never fall through to the public static-asset server. */
export function isAtlasModelAssetRequest(input: URL): boolean {
  let path = input.pathname;
  for (let pass = 0; pass < 8; pass++) {
    if (path.toLowerCase().includes('.glb')) return true;
    try {
      const decoded = decodeURIComponent(path);
      if (decoded === path) return false;
      path = decoded;
    } catch {
      return false; // Malformed escapes cannot name a registered static file.
    }
  }
  // Noncanonical, multiply escaped paths have no public-asset fallback.
  return true;
}

/** Keep Cloudflare's own default-document redirects and their exact query. */
export function isAtlasRuntimeStaticRequest(input: URL, method: string): boolean {
  return (method === 'GET' || method === 'HEAD')
    && input.pathname.startsWith('/atlas-runtime/')
    && !isAtlasModelAssetRequest(input);
}

/** Framework chunks and styles are public; they are not application/API routes. */
export function isFrameworkStaticRequest(input: URL, method: string): boolean {
  return (method === 'GET' || method === 'HEAD')
    && input.pathname.startsWith('/_next/static/')
    && !isAtlasModelAssetRequest(input);
}
