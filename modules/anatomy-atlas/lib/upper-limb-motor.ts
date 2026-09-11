import pins from '../content/upper-limb-motor-pins.json' with { type: 'json' };
import {
  upperLimbMotorBindings,
  upperLimbMotorNerves,
  upperLimbMotorReferences,
  upperLimbMotorRegions,
  type UpperLimbMotorKey,
} from '../content/upper-limb-motor';
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
const regionSupported = (region: string) =>
  (upperLimbMotorRegions as readonly string[]).includes(region);
const byId = new Map(pins.entries.map((s) => [s.id, canonical(s)]));
const bundleById = new Map(pins.bundles.map((b) => [b.id, canonical(b)]));
const sameSide = (s: BodyStructure, side: string) =>
  side === 'both' ||
  s.laterality === side ||
  ['midline', 'unpaired', 'unspecified'].includes(s.laterality);

/** Bind the actual model/frame and complete regional muscle/bone membership.
 * Other organs/vessels are hidden, not interpreted. No whole-body or foreign
 * specimen fallback; unrelated regional changes do not silently rebind targets. */
function sourceScope(
  catalog: BodyCatalog,
  region: string,
): BodyStructure[] | null {
  if (
    !regionSupported(region) ||
    catalog.sourceVersion !== pins.sourceVersion ||
    catalog.license !== pins.license ||
    canonical(catalog.coordinateSystem) !== canonical(pins.coordinateSystem)
  )
    return null;
  const expected = pins.entries.filter((s) => s.regions.includes(region));
  const expectedIds = new Set(expected.map((s) => s.id));
  const entries = catalog.structures.filter(
    (s) =>
      s.regions.includes(region) && ['muscles', 'skeleton'].includes(s.system),
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
  // Duplicate target IDs outside the regional membership must not be selectable.
  if (
    catalog.structures.filter((s) => expectedIds.has(s.id)).length !==
    expected.length
  )
    return null;
  return entries;
}
export function upperLimbMotorGroups(
  catalog: BodyCatalog,
  region: string,
  side = 'both',
) {
  if (!['both', 'right', 'left'].includes(side)) return [];
  const entries = sourceScope(catalog, region);
  if (!entries) return [];
  return (Object.keys(upperLimbMotorNerves) as UpperLimbMotorKey[])
    .map((key) => {
      const definition = upperLimbMotorNerves[key];
      return {
        key,
        label: definition.label,
        note: definition.note,
        references: definition.references.map(
          (k) => upperLimbMotorReferences[k],
        ),
        targets: entries
          .filter((s) => s.system === 'muscles' && sameSide(s, side))
          .flatMap((structure) =>
            upperLimbMotorBindings
              .filter((b) => b.fmaId === structure.fmaId && b.nerve === key)
              .map((supply) => ({ structure, supply: { ...supply } })),
          ),
      };
    })
    .filter((g) => g.targets.length);
}
export function upperLimbMotorPlan(
  catalog: BodyCatalog,
  region: string,
  side: string,
  key: string,
  exam = false,
): { action: DissectionAction; selectedId: string; label: string } | null {
  if (exam) return null;
  const visible = upperLimbMotorGroups(catalog, region, side).find(
    (g) => g.key === key,
  );
  if (!visible) return null;
  // Store both-sided membership: existing side filters then keep the same nerve
  // group when changing Left/Right, rather than revealing unrelated muscles.
  const group = upperLimbMotorGroups(catalog, region, 'both').find(
    (g) => g.key === key,
  )!;
  const keep = new Set(group.targets.map((t) => t.structure.id));
  for (const s of sourceScope(catalog, region)!)
    if (s.system === 'skeleton') keep.add(s.id);
  return {
    action: {
      type: 'load-view',
      hiddenIds: catalog.structures
        .filter((s) => s.regions.includes(region) && !keep.has(s.id))
        .map((s) => s.id),
    },
    selectedId: visible.targets[0].structure.id,
    label: visible.label,
  };
}
