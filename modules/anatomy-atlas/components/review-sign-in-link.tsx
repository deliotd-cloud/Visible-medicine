/* oxlint-disable next/no-html-link-for-pages -- Sites dispatch owns sign-in; use top-level, non-prefetched navigation. */
export type ReviewSignInTarget =
  | { scope: 'shoulder' | 'body'; structure: string | null }
  | { scope: 'nested'; parent: string; study: string; structure: string; source: string }
  | { scope: 'specimens'; specimen: string; structure: string };

/** Fixed local routes only. No return URL, user identity, draft or approval is
 * accepted from the caller; the destination revalidates its source selection. */
export function reviewSignInHref(target: ReviewSignInTarget): string {
  let path: string;
  const params = new URLSearchParams();
  switch (target.scope) {
    case 'shoulder': path = '/review'; break;
    case 'body': path = '/review/body'; break;
    case 'nested':
      path = '/review/nested';
      params.set('parent', target.parent);
      params.set('study', target.study);
      params.set('source', target.source);
      break;
    case 'specimens':
      path = '/review/specimens';
      params.set('specimen', target.specimen);
      break;
    default: throw new Error('Unknown review scope');
  }
  if (target.structure) params.set('structure', target.structure);
  const query = params.toString();
  return '/signin-with-chatgpt?' + new URLSearchParams({ return_to: path + (query ? '?' + query : '') });
}

export function ReviewSignInLink({ target, children = 'Sign in to save reviews' }: {
  target: ReviewSignInTarget; children?: React.ReactNode;
}) {
  return <a href={reviewSignInHref(target)} target="_top">{children}</a>;
}
