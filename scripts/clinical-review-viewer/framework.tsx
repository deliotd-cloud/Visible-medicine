import { lazy, Suspense, type ComponentType, type ReactNode, type AnchorHTMLAttributes, type ImgHTMLAttributes } from 'react';
import { reviewModelHref } from '../../lib/clinical-review-links';
export function Link({ href, children, prefetch, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { children?: ReactNode; prefetch?: boolean }) {
  void prefetch;
  const model = typeof href === 'string' && (href === '/' || href.startsWith('/?') || href.startsWith('/regions/') || href.startsWith('/specimens/') || href.startsWith('/shoulder'));
  return <a {...props} href={model ? reviewModelHref(href!) : href} target="_top">{children}</a>;
}
export function Image({ priority, unoptimized, fill, ...props }: ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean; unoptimized?: boolean; fill?: boolean }) {
  void priority; void unoptimized; void fill;
  return <img {...props} />;
}
export function dynamic<P extends object>(loader: () => Promise<ComponentType<P> | { default: ComponentType<P> }>) {
  const Loaded = lazy(async () => { const result = await loader(); return typeof result === 'function' ? { default: result } : result; });
  return function Dynamic(props: P) { return <Suspense fallback={<p role="status">Loading anatomy…</p>}><Loaded {...props} /></Suspense>; };
}
