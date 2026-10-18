/** Translate only known source routes. Exact source query identities survive;
 * external links and arbitrary return URLs are never accepted as model targets. */
export function reviewModelHref(href: string | null): string {
  if (!href || !href.startsWith('/') || href.startsWith('//')) return '/workspace/atlas-review';
  const url = new URL(href, 'https://review.invalid');
  let kind = 'body', region = 'whole-body';
  if (url.pathname === '/shoulder') kind = 'shoulder';
  else if (url.pathname === '/') { /* whole body */ }
  else if (/^\/regions\/[a-z]+(?:-[a-z]+)*$/.test(url.pathname)) region = url.pathname.slice('/regions/'.length);
  else if (['kidneys', 'female-pelvis', 'back-layers', 'abdominal-wall', 'lower-limb'].some(k => url.pathname === '/specimens/' + k)) {
    kind = url.pathname.slice('/specimens/'.length);
    region = kind === 'lower-limb' ? ({ knee: 'leg', calf: 'leg', foot: 'foot', 'hip-thigh': 'thigh', whole: 'pelvis' }[url.searchParams.get('specimenScope') ?? 'whole'] ?? 'pelvis')
      : kind === 'female-pelvis' ? 'pelvis' : kind === 'back-layers' ? 'spine' : 'abdomen';
  }
  else return '/workspace/atlas-review';
  url.searchParams.delete('kind'); url.searchParams.delete('region');
  url.searchParams.set('kind', kind); url.searchParams.set('region', region);
  return '/workspace/atlas-review/model?' + url.searchParams.toString();
}

/** Presentation-only link. Missing/unsupported material must not fall back to
 * the review home or another anatomy selection inside the worksheet. */
export function reviewModelPreviewHref(href: string | null): string | null {
  if (!href || !href.startsWith('/') || href.startsWith('//') || /[\\\u0000-\u0020]/.test(href)) return null;
  const original = new URL(href, 'https://review.invalid');
  const mapped = original.pathname === '/workspace/atlas-review/model' ? href : reviewModelHref(href);
  const url = new URL(mapped, 'https://review.invalid');
  if (url.pathname !== '/workspace/atlas-review/model') return null;
  return '/workspace/atlas-review/model/embedded' + url.search;
}
