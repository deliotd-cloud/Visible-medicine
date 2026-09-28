import { structures } from '../../app/anatomy-data.ts';

/** Relocate only this module's shoulder-review route; never grant review access. */
export function shoulderWebsiteReviewHref(href?: string): string | null {
  if (!href || href.length > 2048 || !(href === '/review' || href.startsWith('/review?'))) return null;
  const url = new URL(href, 'https://atlas.invalid');
  const candidates = url.searchParams.getAll('structure');
  const selected = candidates.length === 1 && structures.some(s => s.id === candidates[0]) ? candidates[0] : null;
  const path = '/workspace/atlas-review/shoulder';
  return selected ? `${path}?${new URLSearchParams({structure:selected})}` : path;
}
