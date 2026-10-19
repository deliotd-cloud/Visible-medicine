import type { BodyStructure } from '../app/body-types';
import type { DissectionAction } from '../app/dissection-data';
import { vesselKind, type VesselKind } from './anatomy-vessels';

export const vesselVisibilityLabels: Record<VesselKind, string> = {
  artery: 'Arteries', vein: 'Veins', unclassified: 'Other vessels',
};
export function vesselVisibilityGroups(structures: BodyStructure[], visibleIds: string[]) {
  const visible = new Set(visibleIds);
  return (['artery', 'vein', 'unclassified'] as const).map((kind) => {
    const items = structures.filter(s => s.system === 'vessels' && vesselKind(s) === kind);
    const shown = items.filter(s => visible.has(s.id)).length;
    return { kind, label: vesselVisibilityLabels[kind], total: items.length, shown };
  }).filter(group => group.total > 0);
}

/** Local visibility only. Caller supplies the already admitted region/side scope. */
export function vesselVisibilityAction(
  structures: BodyStructure[], visibleIds: string[], kind: VesselKind,
  show: boolean, disabled: boolean,
): DissectionAction | null {
  if (disabled || typeof show !== 'boolean' || !Object.hasOwn(vesselVisibilityLabels, kind)) return null;
  const visible = new Set(visibleIds);
  const ids = [...new Set(structures.filter(s =>
    s.system === 'vessels' && vesselKind(s) === kind && visible.has(s.id) !== show,
  ).map(s => s.id))];
  return ids.length ? { type: show ? 'restore-many' : 'remove-many', ids } : null;
}
