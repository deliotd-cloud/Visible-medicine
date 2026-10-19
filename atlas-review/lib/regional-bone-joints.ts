import type { BodyCatalog } from '../app/body-types';
import type { DissectionAction } from '../app/dissection-data';

type JointPins = {
  sourceVersion: string;
  license: string;
  coordinateSystem: unknown;
  entries: { id: string; fmaId: string }[];
  bundles: { id: string }[];
};
type JointRelation = {
  a: string;
  b: string;
  label: string;
  kind: 'synovial' | 'syndesmosis' | 'variable';
  reference: string;
};
type JointScope = {
  title: string;
  label: string;
  summary: string;
  limits: string;
};
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
const inRegion = (s: { regions: string[] }, region: string) =>
  region === 'whole-body' || s.regions.includes(region);

/** Explicit relationships among pinned selections; no inference from proximity, labels or meshes. */
export function createBoneJointExplorer(
  pins: JointPins,
  boneFmas: Record<string, readonly string[]>,
  joints: readonly JointRelation[],
  references: Record<string, { title: string; url: string }>,
  scope: JointScope,
  notes: Record<string, { text: string; reference: string }> = {},
) {
  const records = new Map(pins.entries.map((s) => [s.id, canonical(s)]));
  const concepts = new Map(
    Object.entries(boneFmas).flatMap(([key, ids]) =>
      ids.map((id) => [id, key]),
    ),
  );
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
  function neighbours(
    catalog: BodyCatalog,
    region: string,
    side: string,
    selectedId: string,
    exam = false,
  ) {
    if (exam || !['both', 'left', 'right'].includes(side)) return null;
    const selected = catalog.structures.find((s) => s.id === selectedId),
      concept = selected && concepts.get(selected.fmaId);
    if (
      !selected ||
      !concept ||
      !records.has(selected.id) ||
      !inRegion(selected, region) ||
      (side !== 'both' && selected.laterality !== side) ||
      (region !== 'whole-body' &&
        !catalog.regions.some((r) => r.id === region)) ||
      !sourceValid(catalog)
    )
      return null;
    const rows = joints
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
    return { selected, concept, rows, scope, references, note: notes[concept] };
  }
  function plan(
    catalog: BodyCatalog,
    region: string,
    side: string,
    selectedId: string,
    exam = false,
  ): {
    action: DissectionAction;
    selectedId: string;
    label: string;
    scopeLabel: string;
  } | null {
    const info = neighbours(catalog, region, side, selectedId, exam);
    if (!info) return null;
    const keepConcepts = new Set([info.concept]);
    for (const row of info.rows)
      if (row.kind !== 'variable')
        keepConcepts.add(row.a === info.concept ? row.b : row.a);
    // Both counterparts survive normal side changes. Variable facets never enter the automatic plan.
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
      selectedId,
      label: info.selected.name,
      scopeLabel: scope.label,
    };
  }
  return { sourceValid, neighbours, plan };
}
