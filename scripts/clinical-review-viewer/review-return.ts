const home = '/workspace/atlas-review';
const queryKeys: Record<string,readonly string[]> = {
  [home]: [],
  [home+'/body']: ['structure'],
  [home+'/shoulder']: ['structure'],
  [home+'/nested']: ['parent','study','structure','source'],
  [home+'/specimens']: ['specimen','structure'],
};
/** The host computes an exact worksheet link. Standalone or foreign embeds can
 * only fall back to Clinical Review, never supply an arbitrary return URL. */
export function reviewReturnDestination(href: string | null, origin: string): string {
  if (!href || href.length > 2048) return home;
  try {
    const url = new URL(href,origin);
    if (url.origin !== origin || !Object.hasOwn(queryKeys,url.pathname)) return home;
    for (const [key,value] of url.searchParams) {
      if (!queryKeys[url.pathname].includes(key) || url.searchParams.getAll(key).length !== 1 || value.length > 256) return home;
    }
    return url.pathname + url.search;
  } catch { return home; }
}
export function closeReviewModel() {
  let href: string | null = null;
  try { href = window.parent.document.querySelector<HTMLAnchorElement>('a[data-review-return]')?.href ?? null; }
  catch { /* Cross-origin or standalone viewer: no trusted host worksheet. */ }
  window.top!.location.href = reviewReturnDestination(href,window.location.origin);
}
