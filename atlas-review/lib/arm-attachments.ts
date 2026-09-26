import pins from '../content/arm-attachment-pins.json' with { type: 'json' };
import { armAttachments, attachmentBones } from '../content/arm-attachments';
import type { BodyCatalog } from '../app/body-types';
import type { DissectionAction } from '../app/dissection-data';

const canonical = (v: unknown): string =>
  Array.isArray(v)
    ? `[${v.map(canonical).join(',')}]`
    : v && typeof v === 'object'
      ? `{${Object.keys(v)
          .sort()
          .map(
            (k) =>
              `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`,
          )
          .join(',')}}`
      : JSON.stringify(v);
const records = new Map(pins.entries.map((s) => [s.id, canonical(s)]));
const inRegion = (s: { regions: string[] }, region: string) =>
  region === 'whole-body' || s.regions.includes(region);
function sourceValid(catalog: BodyCatalog) {
  if (
    catalog.sourceVersion !== pins.sourceVersion ||
    catalog.license !== pins.license ||
    canonical(catalog.coordinateSystem) !== canonical(pins.coordinateSystem)
  )
    return false;
  const actual = catalog.structures.filter((s) => records.has(s.id));
  return (
    actual.length === records.size &&
    new Set(actual.map((s) => s.id)).size === records.size &&
    actual.every((s) => canonical(s) === records.get(s.id)) &&
    pins.bundles.every((b) => {
      const matches = catalog.bundles.filter((x) => x.id === b.id);
      return matches.length === 1 && canonical(matches[0]) === canonical(b);
    })
  );
}
/** Explicit sided relationships, never inferred from mesh proximity or labels. */
export function armAttachmentInfo(
  catalog: BodyCatalog,
  region: string,
  side: string,
  selectedId: string,
  exam = false,
) {
  if (exam || !['both', 'left', 'right'].includes(side)) return null;
  const selected = catalog.structures.find((s) => s.id === selectedId);
  const relationship =
    selected && armAttachments.find((a) => a.fmas.includes(selected.fmaId));
  if (
    !selected ||
    !relationship ||
    !records.has(selected.id) ||
    !inRegion(selected, region) ||
    (side !== 'both' && selected.laterality !== side) ||
    !['whole-body', 'shoulder-arm'].includes(region) ||
    !sourceValid(catalog)
  )
    return null;
  const sideIndex = selected.laterality === 'right' ? 0 : 1;
  const rows = (['proximal', 'distal'] as const).map((role) => {
    const { bone, site } = relationship[role];
    const structure = catalog.structures.find(
      (s) => records.has(s.id) && s.fmaId === attachmentBones[bone][sideIndex],
    )!;
    return {
      role,
      site,
      structure,
      availableHere: inRegion(structure, region),
    };
  });
  return {
    selected,
    relationship,
    rows,
    completeHere: rows.every((r) => r.availableHere),
  };
}
export function armAttachmentPlan(
  ...args: Parameters<typeof armAttachmentInfo>
): {
  action: DissectionAction;
  selectedId: string;
  completeHere: boolean;
} | null {
  const info = armAttachmentInfo(...args);
  if (!info) return null;
  const [catalog, region] = args;
  // Keep both homologues; the existing Left/Right switch supplies the final sided filter.
  const keepFmas = new Set<string>([
    ...info.relationship.fmas,
    ...attachmentBones[info.relationship.proximal.bone],
    ...attachmentBones[info.relationship.distal.bone],
  ]);
  const keep = new Set(
    pins.entries.filter((s) => keepFmas.has(s.fmaId)).map((s) => s.id),
  );
  return {
    action: {
      type: 'load-view',
      hiddenIds: catalog.structures
        .filter((s) => inRegion(s, region) && !keep.has(s.id))
        .map((s) => s.id),
    },
    selectedId: info.selected.id,
    completeHere: info.completeHere,
  };
}
