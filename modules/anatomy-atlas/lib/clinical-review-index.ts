import { structures } from '../app/anatomy-data';
import { bodyReviewSummaries } from './body-review-material';
import { nestedReviewRows } from './nested-review-material';
import { specimenReviewRows } from './specimen-review-material';
import bindings from '../content/nested-review-bindings.json';

export type ClinicalReviewScope = 'shoulder' | 'body' | 'nested' | 'specimens';
export const clinicalReviewScopes = [
  { id: 'shoulder', label: 'Dedicated shoulder', description: 'Dedicated right-shoulder source worksheets.', href: '/review' },
  { id: 'body', label: 'Whole body', description: 'Whole-body source structure worksheets.', href: '/review/body' },
  { id: 'nested', label: 'Internal anatomy', description: 'Structures within organs, with their exact source context.', href: '/review/nested' },
  { id: 'specimens', label: 'Independent specimens', description: 'Separate source specimen and surface worksheets.', href: '/review/specimens' },
] as const;
export type ClinicalReviewEntry = {
  key: string; scope: ClinicalReviewScope; name: string; context: string;
  id: string; laterality: string; href: string;
};
const link = (path: string, params: Record<string, string>) => path + '?' + new URLSearchParams(params).toString();
const scopeOrder = (scope: ClinicalReviewScope) => clinicalReviewScopes.findIndex(s => s.id === scope);
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const nestedEntries: ClinicalReviewEntry[] = nestedReviewRows.flatMap(row => {
  const groups = bindings.groups.filter(g => g.key === row.key && g.parent.id === row.parentId && g.study === row.study);
  if (groups.length !== 1) throw Error('Nested review binding does not match public row');
  const group = groups[0];
  if (group.selections.length !== row.surfaces.length) throw Error('Nested review selections do not match public row');
  return row.surfaces.map(surface => {
    const selections = group.selections.filter(s => s.id === surface.id);
    if (selections.length !== 1 || !/^[a-f0-9]{64}$/.test(selections[0].sourceToken)) throw Error('Missing exact nested review source token');
    return { key: 'nested:' + JSON.stringify([row.key, surface.id]), scope: 'nested', name: surface.name,
      context: row.name + ' · ' + row.study, id: surface.id, laterality: surface.laterality,
      href: link('/review/nested', { parent: row.parentId, study: row.study, structure: surface.id, source: selections[0].sourceToken }) };
  });
});
if (bindings.groups.length !== nestedReviewRows.length) throw Error('Nested review groups do not match public rows');
/** Public source metadata only: no private records, status counts or approvals. */
export const clinicalReviewEntries: readonly ClinicalReviewEntry[] = [
  ...structures.map(s => ({ key: 'shoulder:' + s.id, scope: 'shoulder' as const, name: s.name,
    context: 'Dedicated shoulder · ' + s.region + ' · ' + s.system + ' · ' + (s.sourceFmaIds ?? []).join(' '),
    id: s.id, laterality: s.laterality, href: link('/review', { structure: s.id }) })),
  ...bodyReviewSummaries.map(s => ({ key: 'body:' + s.id, scope: 'body' as const, name: s.name,
    context: 'Whole body · ' + s.regions.join(' · ') + ' · ' + s.system + ' · ' + s.fmaId,
    id: s.id, laterality: s.laterality, href: link('/review/body', { structure: s.id }) })),
  ...nestedEntries,
  ...specimenReviewRows.flatMap(row => row.surfaces.map(s => ({ key: 'specimens:' + JSON.stringify([row.key, s.id]), scope: 'specimens' as const,
    name: s.name, context: row.name + ' · ' + row.key, id: s.id, laterality: s.laterality,
    href: link('/review/specimens', { specimen: row.key, structure: s.id }) }))),
].sort((a, b) => scopeOrder(a.scope) - scopeOrder(b.scope) || compare(a.name.toLowerCase(), b.name.toLowerCase()) || compare(a.key, b.key));
if (new Set(clinicalReviewEntries.map(e => e.key)).size !== clinicalReviewEntries.length) throw Error('Duplicate clinical review search key');

export type ClinicalReviewSearch = {
  q: string; scope: 'all' | ClinicalReviewScope; page: number; pageCount: number;
  total: number; entries: ClinicalReviewEntry[]; pageSize: 12;
};
export type ClinicalReviewSearchInput = { q?: unknown; scope?: unknown; page?: unknown };
function query(value: unknown) { return typeof value === 'string' ? value.trim().slice(0, 160) : ''; }
function scope(value: unknown): ClinicalReviewSearch['scope'] {
  return typeof value === 'string' && clinicalReviewScopes.some(s => s.id === value) ? value as ClinicalReviewScope : 'all';
}
function page(value: unknown) {
  const number = typeof value === 'number' ? value : typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : 1;
  return Number.isSafeInteger(number) && number > 0 ? number : 1;
}
export function findClinicalReviewEntries(input: ClinicalReviewSearchInput = {}): ClinicalReviewSearch {
  const q = query(input.q), selectedScope = scope(input.scope), tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  const found = clinicalReviewEntries.filter(e => (selectedScope === 'all' || e.scope === selectedScope)
    && tokens.every(token => [e.name, e.id, e.context, e.laterality].join(' ').toLowerCase().includes(token)));
  const pageCount = Math.max(1, Math.ceil(found.length / 12)), current = Math.min(page(input.page), pageCount);
  return { q, scope: selectedScope, page: current, pageCount, total: found.length,
    entries: found.slice((current - 1) * 12, current * 12).map(e => ({ ...e })), pageSize: 12 };
}
export function clinicalReviewHref(input: ClinicalReviewSearchInput = {}): string {
  const result = findClinicalReviewEntries(input), params = new URLSearchParams();
  if (result.q) params.set('q', result.q);
  if (result.scope !== 'all') params.set('scope', result.scope);
  if (result.page > 1) params.set('page', String(result.page));
  const suffix = params.toString();
  return '/review/overview' + (suffix ? '?' + suffix : '');
}
