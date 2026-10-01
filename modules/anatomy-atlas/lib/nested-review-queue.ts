import bindings from '../content/nested-review-bindings.json';
import type { nestedReviewRows } from './nested-review-material';

/** Search is a navigation preference, never a review identity or permission. */
export function nestedReviewQuery(value: unknown): string {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 160)
    : '';
}
export function nestedReviewNavigationTrack(value: unknown): 'geometry' | 'teaching' {
  return value === 'teaching' ? 'teaching' : 'geometry';
}

export function nestedReviewQueue(
  rows: typeof nestedReviewRows,
  key: string,
  query: unknown,
  selected: { nestedKey: string; structureId: string } | null,
  track: unknown = 'geometry',
) {
  const group = rows.find(row => row.key === key);
  const pin = bindings.groups.find(row => row.key === key);
  const q = nestedReviewQuery(query);
  // Unknown/mismatched scopes cannot acquire a neighbour link.
  if (!group || !pin || pin.parent.id !== group.parentId || pin.study !== group.study)
    return { entries: [], index: -1, previous: null, next: null, query: q };
  const entries = group.surfaces.filter(surface =>
    `${surface.name} ${surface.id} ${surface.laterality}`.toLowerCase().includes(q.toLowerCase()),
  ).flatMap(surface => {
    const binding = pin.selections.find(item => item.id === surface.id);
    if (!binding || !/^[a-f0-9]{64}$/.test(binding.sourceToken)) return [];
    let href = `/review/nested?parent=${encodeURIComponent(group.parentId)}&study=${encodeURIComponent(group.study)}&structure=${encodeURIComponent(surface.id)}&source=${binding.sourceToken}`;
    if (q) href += '&q=' + encodeURIComponent(q);
    if (nestedReviewNavigationTrack(track) === 'teaching') href += '&t=teaching';
    return [{ ...surface, href }];
  });
  const index = selected?.nestedKey === key
    ? entries.findIndex(entry => entry.id === selected.structureId) : -1;
  return { entries, index, query: q,
    previous: index > 0 ? entries[index - 1] : null,
    next: index >= 0 && index < entries.length - 1 ? entries[index + 1] : null };
}
