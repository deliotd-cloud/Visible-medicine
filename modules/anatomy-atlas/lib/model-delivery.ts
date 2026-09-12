/** Delivery location only: never rewrite the catalogue or its anatomical/source identity. */
export function modelDeliveryUrl(url: string, assetBase = ''): string {
  if (!assetBase) return url;
  if (!/^\/atlas-runtime\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(assetBase) ||
      !/^\/models\/[a-zA-Z0-9/_-]+\.[a-zA-Z0-9]+$/.test(url)) {
    throw new Error('Invalid same-origin model delivery path');
  }
  return assetBase + url;
}
