import raw from '../public/models/bodyparts3d/pulmonary/airway-context.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import {
  pulmonaryFor,
  pulmonaryViewCatalog,
  pulmonaryReferences,
} from './pulmonary';

export const pulmonaryAirwaySource = raw as unknown as {
  parents: BodyStructure[];
  structures: BodyStructure[];
  bundles: BodyCatalog['bundles'];
  bindings: { parentId: string; contextIds: string[] }[];
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
export function pulmonaryAirwayFor(parent: BodyStructure | null) {
  if (!parent || !pulmonaryFor(parent).length) return [];
  const binding = pulmonaryAirwaySource.bindings.filter(
    (b) => b.parentId === parent.id,
  );
  const pinned = pulmonaryAirwaySource.parents.filter(
    (p) => p.id === parent.id,
  );
  if (
    binding.length !== 1 ||
    pinned.length !== 1 ||
    canonical(parent) !== canonical(pinned[0])
  )
    return [];
  const context = binding[0].contextIds.map((id) =>
    pulmonaryAirwaySource.structures.filter((s) => s.id === id),
  );
  if (
    context.length !== 2 ||
    new Set(binding[0].contextIds).size !== 2 ||
    context.some((s) => s.length !== 1)
  )
    return [];
  const structures = context.map((s) => s[0]);
  if (
    !structures.some((s) => s.fmaId === 'FMA7394') ||
    structures.filter((s) => s.laterality === parent.laterality).length !== 1
  )
    return [];
  return structures;
}
/** The default and separated views remain the original per-lung scope. */
export function pulmonaryContextViewCatalog(
  parent: BodyStructure | null,
  show = false,
) {
  const base = pulmonaryViewCatalog(parent),
    context = show ? pulmonaryAirwayFor(parent) : [];
  return {
    ...base,
    structures: [...base.structures, ...context],
    contextIds: context.map((s) => s.id),
    bundles: [
      ...base.bundles,
      ...pulmonaryAirwaySource.bundles.filter((b) =>
        context.some((s) => s.bundle === b.id),
      ),
    ],
  };
}
export const pulmonaryAirwayReference = pulmonaryReferences[1];
export function pulmonaryAirwayColour(s: BodyStructure) {
  return s.fmaId === 'FMA7394' ? '#8a9fa2' : '#b5927e';
}
