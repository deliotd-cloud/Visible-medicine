import { parseClinicalStatusPage, type ClinicalStatusItem } from './clinical-review-status';

export const clinicalChangeReasons = ['source-or-teaching', 'other-review-material', 'viewer-only', 'unavailable'] as const;
export type ClinicalChangeReason = (typeof clinicalChangeReasons)[number];
export type ClinicalPriorityItem = ClinicalStatusItem & {
  geometryReason: ClinicalChangeReason | null;
  teachingReason: ClinicalChangeReason | null;
};

/** Exact private transport. The legacy status parser remains the authority for statuses. */
export function parseClinicalPriorityPage(value: unknown, keys: readonly string[]): ClinicalPriorityItem[] {
  const exact = (value: unknown, names: readonly string[]) => {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        Object.getPrototypeOf(value) !== Object.prototype ||
        Object.keys(value).length !== names.length ||
        names.some(name => !Object.hasOwn(value, name))) throw Error('Invalid review priority response');
  };
  exact(value, ['schema', 'scope', 'items']);
  const page = value as Record<string, unknown>;
  if (page.schema !== 'vm-clinical-priority-1' || !Array.isArray(page.items))
    throw Error('Invalid review priority schema');
  const items = page.items;
  for (const item of items) exact(item, ['key', 'geometry', 'teaching', 'geometryReason', 'teachingReason']);
  if (new Set(keys).size !== keys.length ||
      new Set(items.map(item => item.key)).size !== items.length)
    throw Error('Duplicate review priority selection');
  const statuses = parseClinicalStatusPage({ scope: page.scope, items: items.map(item => ({
    key: item.key, geometry: item.geometry, teaching: item.teaching,
  })) }, keys);
  return statuses.map((status, index) => {
    const row = items[index] as ClinicalPriorityItem;
    for (const track of ['geometry', 'teaching'] as const) {
      const reason = row[`${track}Reason`];
      if (status[track] !== 're-review' ? reason !== null :
          reason !== null && !clinicalChangeReasons.some(value => value === reason))
        throw Error('Invalid review priority reason');
    }
    return { ...status, geometryReason: row.geometryReason, teachingReason: row.teachingReason };
  });
}
