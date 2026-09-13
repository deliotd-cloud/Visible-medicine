/** Delivery location only: never rewrite the catalogue or its anatomical/source identity. */
export function modelDeliveryUrl(url: string, assetBase = ''): string {
  if (!assetBase) return url;
  if (!/^\/atlas-runtime\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(assetBase) ||
      !/^\/models\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+(?:\?v=[a-f0-9]{12}(?:[a-f0-9]{52})?)?$/.test(url)) {
    throw new Error('Invalid same-origin model delivery path');
  }
  return assetBase + url;
}

/** Relocate a generated regional study URL, retaining its exact source-bound query. */
export function regionalStudyDeliveryUrl(url: string, region: string, assetBase = ''): string {
  if (!assetBase) return url;
  modelDeliveryUrl('/models/catalog.json', assetBase); // Same strict local-base rule.
  if (!/^[a-z]+(?:-[a-z]+)*$/.test(region) ||
      !(url === `/regions/${region}` || url.startsWith(`/regions/${region}?`))) {
    throw new Error('Study link is outside the contained region');
  }
  return `${assetBase}/index.html${url.slice(`/regions/${region}`.length)}`;
}
