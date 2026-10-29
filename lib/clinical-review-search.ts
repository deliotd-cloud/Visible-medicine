// Search is for display labels only. Do not use these aliases for anatomical IDs,
// review revisions, decisions, or access scopes.
function reviewSearchText(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/['\u2019\u02bc]/g, '')
    .replace(/\bfma\s*(\d+)/g, 'fma $1')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function reviewSearchTerms(value: string): string[] {
  const normalized = reviewSearchText(value);
  return normalized ? normalized.split(/\s+/) : [];
}

type SearchItem = { title: string; scopeLabel: string; trackLabel: string };
type CachedLabel = SearchItem & { normalized: string };

export function createReviewSearchMatcher(): (item: SearchItem, terms: string[]) => boolean {
  const labels = new WeakMap<SearchItem, CachedLabel>();
  return (item, terms) => {
    let cached = labels.get(item);
    if (!cached || cached.title !== item.title || cached.scopeLabel !== item.scopeLabel || cached.trackLabel !== item.trackLabel) {
      cached = {
        title: item.title,
        scopeLabel: item.scopeLabel,
        trackLabel: item.trackLabel,
        normalized: reviewSearchText(`${item.title} ${item.scopeLabel} ${item.trackLabel}`),
      };
      labels.set(item, cached);
    }
    const label = cached.normalized;
    return terms.every(term => label.includes(term));
  };
}
