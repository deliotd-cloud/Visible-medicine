import { lazy, Suspense, type AnchorHTMLAttributes, type ComponentType, type ImgHTMLAttributes } from 'react';
import { regionalStudyDeliveryUrl } from '../../lib/model-delivery';
import { regionalModules,regionalHostHref } from './regions';
export const assetBase = '/atlas-runtime/head-neck';

// Only navigation is relocated. Anatomical IDs, bundle hashes and coordinate frames stay canonical.
export function Link({href,children,prefetch:_prefetch,...props}: AnchorHTMLAttributes<HTMLAnchorElement> & {prefetch?:boolean}) {
  const localRegion=href?.startsWith('/?')?'whole-body':Object.keys(regionalModules).find(region=>region!=='whole-body'&&(href===`/regions/${region}`||href?.startsWith(`/regions/${region}?`)));
  // Whole-body continuation updates the host heading/region bar as well as the
  // model. The host relays only bounded study fields; the module validates them.
  if (localRegion==='whole-body' && href)
    return <a {...props} href={'/atlas/3d'+href.slice(1)} target="_top">{children}</a>;
  // Plain region navigation retains established host URLs.
  if (localRegion && href===`/regions/${localRegion}`)
    return <a {...props} href={regionalHostHref(localRegion)!} target="_top">{children}</a>;
  if (localRegion && href) {
    // Validate the canonical route, then carry the source-bound query through
    // the host's bounded transport. Navigating only the frame leaves its banner
    // and region bar describing the previous anatomy.
    const delivered=regionalStudyDeliveryUrl(href,localRegion,assetBase);
    const query=new URLSearchParams(delivered.split('?')[1]);
    query.set('region',localRegion);
    return <a {...props} href={'/atlas/3d?'+query.toString()} target="_top">{children}</a>;
  }
  if (href === '/' || href === '/shoulder')
    return <a {...props} href={href === '/' ? '/atlas' : '/atlas/shoulder-3d'} target="_top">{children}</a>;
  if (href?.startsWith('/regions/'))
    return <a {...props} href={new URL(href,'https://visible-medicine-shoulder-atlas.deliotd.chatgpt.site').href} target="_blank" rel="noopener noreferrer" title="Open the independent Atlas in a new tab">{children}</a>;
  return <a {...props} href={href}>{children}</a>;
}
export function Image({src,priority:_priority,unoptimized:_unoptimized,fill:_fill,...props}:ImgHTMLAttributes<HTMLImageElement> & {priority?:boolean;unoptimized?:boolean;fill?:boolean}) {
  return <img {...props} src={typeof src === 'string' && src.startsWith('/brand/') ? assetBase + src : src}/>;
}
export function dynamic<P extends object>(loader:()=>Promise<ComponentType<P>|{default:ComponentType<P>}>) {
  // next/dynamic accepts both a named-component promise and an imported module.
  // BodyScene uses the former; the actual nested dissection studies use the latter.
  const Loaded=lazy(async()=>{const loaded=await loader();return typeof loaded==='function'?{default:loaded}:loaded;});
  return function Dynamic(props:P) { return <Suspense fallback={<p role="status">Loading anatomy…</p>}><Loaded {...props}/></Suspense>; };
}
