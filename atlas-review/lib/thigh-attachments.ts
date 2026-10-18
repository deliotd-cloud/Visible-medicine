import pins from '../content/thigh-attachment-pins.json' with { type: 'json' };
import {
  thighAttachments,
  thighAttachmentBones,
  thighAttachmentReference,
} from '../content/thigh-attachments';
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
/** Ordinary bony relationships only. Neither a footprint nor a tendon/ligament reconstruction. */
export function thighAttachmentInfo(
  catalog: BodyCatalog,
  region: string,
  side: string,
  selectedId: string,
  exam = false,
) {
  if (
    exam ||
    !['both', 'left', 'right'].includes(side) ||
    !['thigh', 'whole-body'].includes(region)
  )
    return null;
  const selected = catalog.structures.find((s) => s.id === selectedId);
  const relationship =
    selected && thighAttachments.find((a) => a.fmas.includes(selected.fmaId));
  if (
    !selected ||
    !relationship ||
    !records.has(selected.id) ||
    !inRegion(selected, region) ||
    (side !== 'both' && selected.laterality !== side) ||
    !sourceValid(catalog)
  )
    return null;
  const index = selected.laterality === 'right' ? 0 : 1;
  const rows = relationship.endpoints.map((endpoint) => {
    const structure = catalog.structures.find(
      (s) =>
        records.has(s.id) &&
        s.fmaId === thighAttachmentBones[endpoint.bone][index],
    )!;
    return {
      ...endpoint,
      structure,
      availableHere: inRegion(structure, region),
    };
  });
  return {
    selected,
    relationship,
    rows,
    completeHere: rows.every((r) => r.availableHere),
    reference: thighAttachmentReference,
    note: relationship.note,
  };
}
export function thighAttachmentPlan(
  ...args: Parameters<typeof thighAttachmentInfo>
): {
  action: DissectionAction;
  selectedId: string;
  completeHere: boolean;
} | null {
  const info = thighAttachmentInfo(...args);
  if (!info) return null;
  const [catalog, region] = args;
  // Retain homologues so the existing side switch works without rebuilding the study.
  const fmas = new Set<string>([
    ...info.relationship.fmas,
    ...info.relationship.endpoints.flatMap((e) => thighAttachmentBones[e.bone]),
  ]);
  const keep = new Set(
    pins.entries.filter((s) => fmas.has(s.fmaId)).map((s) => s.id),
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
