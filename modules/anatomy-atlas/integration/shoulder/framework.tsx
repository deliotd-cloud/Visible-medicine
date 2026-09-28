import { lazy, Suspense, type AnchorHTMLAttributes, type ComponentType, type ImgHTMLAttributes } from 'react';
import { shoulderWebsiteReviewHref } from './navigation';

// Navigation leaves the embedded document; review authentication stays with its owner.
export function Link({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const review = shoulderWebsiteReviewHref(href);
  if (review) return <a {...props} href={review} target="_top">{children}</a>;
  const url = href?.startsWith('/') ? new URL(href, 'https://visible-medicine-shoulder-atlas.deliotd.chatgpt.site').href : href;
  return <a {...props} href={url} target="_blank" rel="noopener noreferrer">{children}</a>;
}
export function Image({ priority: _priority, unoptimized: _unoptimized, fill: _fill, ...props }: ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean; unoptimized?: boolean; fill?: boolean }) {
  return <img {...props} />;
}
export function dynamic<P extends object>(loader: () => Promise<ComponentType<P>>) {
  const Loaded = lazy(async () => ({ default: await loader() }));
  return function Dynamic(props: P) { return <Suspense fallback={<p role="status">Loading shoulder…</p>}><Loaded {...props} /></Suspense>; };
}
