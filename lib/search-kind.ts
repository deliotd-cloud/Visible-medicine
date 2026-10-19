export const searchKinds = [
  {value: 'all', label: 'All'},
  {value: 'anatomy', label: 'Anatomy'},
  {value: 'atlas', label: 'Atlas'},
  {value: 'courses', label: 'Courses'},
  {value: 'cases', label: 'Cases'},
  {value: 'workbooks', label: 'Workbooks'},
] as const;

export type SearchKind = (typeof searchKinds)[number]['value'];

export function parseSearchKind(value: unknown): SearchKind {
  return typeof value === 'string' && searchKinds.some(item => item.value === value)
    ? value as SearchKind : 'all';
}

export function normalizeSearchQuery(value: unknown): string {
  return typeof value === 'string' ? value.normalize('NFKC').trim().slice(0, 80) : '';
}

export function searchKindHref(query: string, kind: SearchKind): string {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (kind !== 'all') params.set('kind', kind);
  return `/search${params.size ? `?${params}` : ''}`;
}

export function filterSearchKind<T extends {kind: string}>(items: readonly T[], kind: SearchKind): T[] {
  if (kind === 'all') return [...items];
  const labels: Record<Exclude<SearchKind, 'all'>, readonly string[]> = {
    anatomy: ['Anatomy concept', 'Structure'],
    atlas: ['Atlas'],
    courses: ['Course'],
    cases: ['Case'],
    workbooks: ['Workbook'],
  };
  return items.filter(item => labels[kind].includes(item.kind));
}
