import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { DissectionAction } from '../app/dissection-data';

export type MotorPins = Pick<
  BodyCatalog,
  'sourceVersion' | 'license' | 'coordinateSystem' | 'bundles'
> & { entries: BodyStructure[] };
type MotorBinding = {
  fmaId: string;
  nerve: string;
  part?: string;
  caveat?: string;
};
export type RegionalMotorGroup = {
  key: string;
  label: string;
  note: string;
  references: string[];
  targets: { structure: BodyStructure; supply: MotorBinding }[];
};
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
const sameSide = (s: BodyStructure, side: string) =>
  side === 'both' ||
  s.laterality === side ||
  ['midline', 'unpaired', 'unspecified'].includes(s.laterality);

/** One shared source/visibility contract; relationships stay separately authored for each anatomical scope. */
export function createRegionalMotorStudy(definition: {
  pins: MotorPins;
  regions: readonly string[];
  bindings: readonly MotorBinding[];
  nerves: Record<
    string,
    { label: string; note: string; references: readonly string[] }
  >;
  references: Record<string, string>;
  /** Explicit display alias; validation still uses the pinned source region. */
  wholeBodyAlias?: { name: 'whole-body'; sourceRegion: string };
}) {
  const { pins, regions, bindings, nerves, references, wholeBodyAlias } = definition;
  const byId = new Map(pins.entries.map((s) => [s.id, canonical(s)]));
  const bundleById = new Map(pins.bundles.map((b) => [b.id, canonical(b)]));
  function sourceScope(
    catalog: BodyCatalog,
    region: string,
  ): BodyStructure[] | null {
    const sourceRegion = region === wholeBodyAlias?.name ? wholeBodyAlias.sourceRegion : region;
    if (
      !sourceRegion || !regions.includes(sourceRegion) ||
      catalog.sourceVersion !== pins.sourceVersion ||
      catalog.license !== pins.license ||
      canonical(catalog.coordinateSystem) !== canonical(pins.coordinateSystem)
    )
      return null;
    const expected = pins.entries.filter((s) => s.regions.includes(sourceRegion));
    const expectedIds = new Set(expected.map((s) => s.id));
    const entries = catalog.structures.filter(
      (s) =>
        s.regions.includes(sourceRegion) &&
        ['muscles', 'skeleton'].includes(s.system),
    );
    if (
      entries.length !== expected.length ||
      new Set(entries.map((s) => s.id)).size !== expected.length ||
      entries.some(
        (s) => !expectedIds.has(s.id) || canonical(s) !== byId.get(s.id),
      )
    )
      return null;
    for (const id of new Set(entries.map((s) => s.bundle))) {
      const matches = catalog.bundles.filter((b) => b.id === id);
      if (matches.length !== 1 || canonical(matches[0]) !== bundleById.get(id))
        return null;
    }
    // Reject duplicate IDs even when the duplicate claims to belong elsewhere.
    if (
      catalog.structures.filter((s) => expectedIds.has(s.id)).length !==
      expected.length
    )
      return null;
    return entries;
  }
  function groups(
    catalog: BodyCatalog,
    region: string,
    side = 'both',
  ): RegionalMotorGroup[] {
    if (!['both', 'right', 'left'].includes(side)) return [];
    const entries = sourceScope(catalog, region);
    if (!entries) return [];
    return Object.entries(nerves)
      .map(([key, nerve]) => ({
        key,
        label: nerve.label,
        note: nerve.note,
        references: nerve.references.map((k) => references[k]),
        targets: entries
          .filter((s) => s.system === 'muscles' && sameSide(s, side))
          .flatMap((structure) =>
            bindings
              .filter((b) => b.fmaId === structure.fmaId && b.nerve === key)
              .map((supply) => ({ structure, supply: { ...supply } })),
          ),
      }))
      .filter((group) => group.targets.length);
  }
  function plan(
    catalog: BodyCatalog,
    region: string,
    side: string,
    key: string,
    exam = false,
  ): { action: DissectionAction; selectedId: string; label: string } | null {
    if (exam) return null;
    const visible = groups(catalog, region, side).find((g) => g.key === key);
    if (!visible) return null;
    // Retain both sides in the mask so the existing side switch remains reversible.
    const group = groups(catalog, region, 'both').find((g) => g.key === key)!;
    const keep = new Set(group.targets.map((t) => t.structure.id));
    for (const s of sourceScope(catalog, region)!)
      if (s.system === 'skeleton') keep.add(s.id);
    return {
      action: {
        type: 'load-view',
        hiddenIds: catalog.structures
          .filter((s) => (region === wholeBodyAlias?.name || s.regions.includes(region)) && !keep.has(s.id))
          .map((s) => s.id),
      },
      selectedId: visible.targets[0].structure.id,
      label: visible.label,
    };
  }
  return { groups, plan };
}
