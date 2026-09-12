import type { BodyCatalog, BodyStructure } from '../app/body-types';
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
export type ArterialRelationKind =
  | 'branch'
  | 'continuation'
  | 'confluence'
  | 'via-unmodelled'
  | 'via-grouped'
  | 'anastomosis'
  | 'variant';
export type ArterialDefinitions = Record<
  string,
  { fmaIds: readonly string[]; context: string; contextFmaIds?: readonly string[]; note: string }
>;
type SourcePins = {
  sourceVersion: string;
  license: string;
  coordinateSystem: unknown;
  bundles: { id: string }[];
  entries: { id: string; fmaId: string; system: string; regions: string[] }[];
};
export type ArterialNeighbour = {
  structure: BodyStructure;
  direction: 'upstream' | 'downstream' | 'communication' | 'alternative';
  kind: ArterialRelationKind;
  note: string;
  availableHere: boolean;
};
export function createArterialExplorer(
  pins: SourcePins,
  arterialConcepts: ArterialDefinitions,
  arterialRelations: readonly {
    from: string;
    to: string;
    kind: ArterialRelationKind;
    note: string;
  }[],
  arterialReferences: Record<string, string>,
  territory: string,
  pairing: 'same-side' | 'explicit-concept' = 'same-side',
) {
  const pinnedById = new Map(pins.entries.map((s) => [s.id, canonical(s)]));
  const byFma = new Map<string, string>(
    Object.entries(arterialConcepts).flatMap(([key, c]) =>
      c.fmaIds.map((fma) => [fma, key as string] as const),
    ),
  );
  function sourceValid(catalog: BodyCatalog) {
    if (
      catalog.sourceVersion !== pins.sourceVersion ||
      catalog.license !== pins.license ||
      canonical(catalog.coordinateSystem) !== canonical(pins.coordinateSystem)
    )
      return false;
    const actual = catalog.structures.filter((s) => pinnedById.has(s.id));
    if (
      actual.length !== pins.entries.length ||
      new Set(actual.map((s) => s.id)).size !== actual.length ||
      actual.some((s) => canonical(s) !== pinnedById.get(s.id))
    )
      return false;
    for (const bundle of pins.bundles) {
      const matches = catalog.bundles.filter((b) => b.id === bundle.id);
      if (matches.length !== 1 || canonical(matches[0]) !== canonical(bundle))
        return false;
    }
    return true;
  }
  const inRegion = (s: BodyStructure, region: string) =>
    region === 'whole-body' || s.regions.includes(region);
  const inSide = (s: BodyStructure, side: string) =>
    side === 'both' ||
    s.laterality === side ||
    ['midline', 'unpaired', 'unspecified'].includes(s.laterality);
  /** Typical anatomical relationships, never inferred from mesh proximity or lumen continuity. */
  function neighbours(
    catalog: BodyCatalog,
    region: string,
    side: string,
    selectedId: string,
    exam = false,
  ) {
    if (
      exam ||
      !['both', 'right', 'left'].includes(side) ||
      !sourceValid(catalog)
    )
      return null;
    if (
      region !== 'whole-body' &&
      !catalog.regions.some((r) => r.id === region)
    )
      return null;
    const selected = catalog.structures.find((s) => s.id === selectedId),
      concept = selected && byFma.get(selected.fmaId);
    if (
      !selected ||
      !concept ||
      !pinnedById.has(selected.id) ||
      !inRegion(selected, region) ||
      !inSide(selected, side)
    )
      return null;
    const rows: ArterialNeighbour[] = [];
    for (const relation of arterialRelations) {
      if (relation.from !== concept && relation.to !== concept) continue;
      const outgoing = relation.from === concept,
        other = outgoing ? relation.to : relation.from;
      for (const structure of catalog.structures) {
        if (
          byFma.get(structure.fmaId) !== other ||
          !pinnedById.has(structure.id)
        )
          continue;
        // A midline inflow can reach both sides; paired vessels never cross sides.
        if (
          !inSide(structure, side) ||
          (pairing === 'same-side' &&
            selected.laterality !== 'midline' &&
            structure.laterality !== 'midline' &&
            selected.laterality !== structure.laterality)
        )
          continue;
        rows.push({
          structure,
          direction:
            relation.kind === 'variant'
              ? 'alternative'
              : relation.kind === 'anastomosis'
                ? 'communication'
                : outgoing
                  ? 'downstream'
                  : 'upstream',
          kind: relation.kind,
          note: relation.note,
          availableHere: inRegion(structure, region),
        });
      }
    }
    return {
      selected,
      concept,
      territory,
      note: arterialConcepts[concept].note,
      rows,
      references: Object.values(arterialReferences),
    };
  }

  /** One reversible visibility step. Source bones provide regional orientation only. */
  function plan(
    catalog: BodyCatalog,
    region: string,
    side: string,
    selectedId: string,
    exam = false,
  ): { action: DissectionAction; selectedId: string; label: string } | null {
    const info = neighbours(catalog, region, side, selectedId, exam);
    if (!info) return null;
    const concepts = new Set<string>([info.concept]);
    for (const r of arterialRelations) {
      if (r.from === info.concept) concepts.add(r.to);
      if (r.to === info.concept) concepts.add(r.from);
    }
    // Keep both counterparts so the normal side filter can be changed without losing this set.
    const keep = new Set(
      pins.entries
        .filter(
          (s) =>
            (s.system === 'skeleton' &&
              (arterialConcepts[info.concept].contextFmaIds
                ? arterialConcepts[info.concept].contextFmaIds!.includes(s.fmaId)
                : s.regions.includes(arterialConcepts[info.concept].context))) ||
            concepts.has(byFma.get(s.fmaId)!),
        )
        .map((s) => s.id),
    );
    return {
      action: {
        type: 'load-view',
        hiddenIds: catalog.structures
          .filter((s) => inRegion(s, region) && !keep.has(s.id))
          .map((s) => s.id),
      },
      selectedId: info.selected.id,
      label: info.selected.name,
    };
  }
  return { neighbours, plan };
}
