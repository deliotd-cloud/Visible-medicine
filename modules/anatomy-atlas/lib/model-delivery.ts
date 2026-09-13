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
  const suffix=url.slice(`/regions/${region}`.length);
  if(new URLSearchParams(suffix).has('region'))throw new Error('Unexpected regional routing field');
  // Keep existing single-region links stable. Shared regional deliveries carry
  // the destination explicitly, so a thorax study cannot open the default head.
  const query=assetBase.split('/').at(-1)===region ? suffix
    : `?region=${encodeURIComponent(region)}${suffix ? '&'+suffix.slice(1) : ''}`;
  return `${assetBase}/index.html${query}`;
}

/** Keep separately licensed/source-framed specimens separate inside the host.
 * The original ref fields remain untouched for revision validation on arrival. */
export const containedIndependentSpecimens = {
  '/specimens/abdominal-wall': {region:'abdomen',key:'bp3d3-abdominal-wall',kind:'abdominal-wall'},
  '/specimens/kidneys': {region:'abdomen',key:'hra-united-female-v1.10-kidneys',kind:'kidneys'},
  '/specimens/back-layers': {region:'spine',key:'bp3d3-back-layers',kind:'back-layers'},
  '/specimens/female-pelvis': {region:'pelvis',key:'hra-united-female-v1.10-pelvis',kind:'female-pelvis'},
} as const;
export function independentStudyDeliveryUrl(url: string, assetBase = ''): string {
  if (!assetBase) return url;
  modelDeliveryUrl('/models/catalog.json', assetBase);
  const parsed = new URL(url, 'https://atlas.invalid');
  const destination=Object.hasOwn(containedIndependentSpecimens,parsed.pathname)
    ?containedIndependentSpecimens[parsed.pathname as keyof typeof containedIndependentSpecimens]:null;
  if (!url.startsWith('/') || parsed.origin !== 'https://atlas.invalid'
    || !destination
    || parsed.hash || parsed.searchParams.has('region')
    || parsed.searchParams.get('ref') !== 'independent-1'
    || parsed.searchParams.get('refSpecimen') !== destination.key) throw new Error('Unsupported contained specimen link');
  return `${assetBase}/index.html?region=${destination.region}${parsed.search ? '&' + parsed.search.slice(1) : ''}`;
}
