import type { BodyCatalog } from '../app/body-types';
import type { DissectionAction } from '../app/dissection-data';
import pins from '../content/foot-joint-pins.json';
import {
  footBoneFmas,
  footJoints,
  type FootBone,
} from '../content/foot-joints';

const canonical = (value: unknown): string =>
  Array.isArray(value)
    ? `[${value.map(canonical).join(',')}]`
    : value && typeof value === 'object'
      ? `{${Object.keys(value)
          .sort()
          .map(
            (k) =>
              `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`,
          )
          .join(',')}}`
      : JSON.stringify(value);
const records = new Map(pins.entries.map((s) => [s.id, canonical(s)]));
const concepts = new Map<string, FootBone>(
  Object.entries(footBoneFmas).flatMap(([key, ids]) =>
    ids.map((id) => [id, key as FootBone]),
  ),
);
const inRegion = (s: { regions: string[] }, region: string) =>
  region === 'whole-body' || s.regions.includes(region);
export function footJointSourceValid(catalog: BodyCatalog) {
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
export function footJointNeighbours(
  catalog: BodyCatalog,
  region: string,
  side: string,
  selectedId: string,
  exam = false,
) {
  if (
    exam ||
    !['both', 'left', 'right'].includes(side) ||
    !footJointSourceValid(catalog) ||
    (region !== 'whole-body' && !catalog.regions.some((r) => r.id === region))
  )
    return null;
  const selected = catalog.structures.find((s) => s.id === selectedId);
  const concept = selected && concepts.get(selected.fmaId);
  if (
    !selected ||
    !concept ||
    !records.has(selected.id) ||
    !inRegion(selected, region) ||
    (side !== 'both' && selected.laterality !== side)
  )
    return null;
  const rows = footJoints
    .filter((j) => j.a === concept || j.b === concept)
    .flatMap((j) => {
      const other = j.a === concept ? j.b : j.a;
      return catalog.structures
        .filter(
          (s) =>
            records.has(s.id) &&
            concepts.get(s.fmaId) === other &&
            s.laterality === selected.laterality,
        )
        .map((structure) => ({
          ...j,
          structure,
          availableHere: inRegion(structure, region),
        }));
    });
  return { selected, concept, rows };
}
/** One undoable removal/layer step; never moves bones or manufactures a contact surface. */
export function footJointPlan(
  catalog: BodyCatalog,
  region: string,
  side: string,
  selectedId: string,
  exam = false,
): { action: DissectionAction; selectedId: string; label: string } | null {
  const info = footJointNeighbours(catalog, region, side, selectedId, exam);
  if (!info) return null;
  const keepConcepts = new Set<FootBone>([info.concept]);
  for (const row of info.rows)
    if (row.kind !== 'variable')
      keepConcepts.add(row.a === info.concept ? row.b : row.a);
  // Retain both counterparts for subsequent normal laterality switching. Never include variants automatically.
  const keep = new Set(
    pins.entries
      .filter((s) => keepConcepts.has(concepts.get(s.fmaId)!))
      .map((s) => s.id),
  );
  return {
    action: {
      type: 'load-view',
      hiddenIds: catalog.structures
        .filter((s) => inRegion(s, region) && !keep.has(s.id))
        .map((s) => s.id),
    },
    selectedId: selectedId,
    label: info.selected.name,
  };
}
