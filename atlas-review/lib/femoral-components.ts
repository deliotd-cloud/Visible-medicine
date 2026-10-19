import raw from '../public/models/bodyparts3d/femoral-components/catalog.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';

export type FemoralComponent = BodyStructure & {
  parentId: string;
  role: 'lateral-circumflex' | 'remainder';
};
export const femoralComponentCatalog = raw as unknown as Omit<
  BodyCatalog,
  'structures'
> & {
  parents: BodyStructure[];
  parentBundles: BodyCatalog['bundles'];
  structures: FemoralComponent[];
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

/** Exact source partition, never a substitute for another side or parent revision. */
export function femoralComponentsFor(parent: BodyStructure | null) {
  const pinned =
    parent &&
    femoralComponentCatalog.parents.find((p) => p.id === parent.id);
  if (!parent || !pinned || canonical(parent) !== canonical(pinned))
    return [];
  return femoralComponentCatalog.structures.filter(
    (s) => s.parentId === parent.id,
  );
}
export function femoralComponentViewCatalog(
  parent: BodyStructure | null,
): BodyCatalog {
  const structures = femoralComponentsFor(parent);
  return {
    ...femoralComponentCatalog,
    structures,
    bundles: femoralComponentCatalog.bundles.filter((b) =>
      structures.some((s) => s.bundle === b.id),
    ),
  };
}
export function femoralParentBundleMatches(
  bundle: BodyCatalog['bundles'][number],
) {
  return femoralComponentCatalog.parentBundles.some(
    (b) => canonical(b) === canonical(bundle),
  );
}
export function femoralComponentPresets(parts: FemoralComponent[]) {
  return {
    all: parts.map((s) => s.id),
    lateral: parts
      .filter((s) => s.role === 'lateral-circumflex')
      .map((s) => s.id),
    remainder: parts.filter((s) => s.role === 'remainder').map((s) => s.id),
  };
}
export const femoralComponentLabel = (s: FemoralComponent) =>
  s.role === 'lateral-circumflex'
    ? 'Lateral circumflex'
    : 'Source remainder';
export const femoralComponentColour = (s: FemoralComponent) =>
  s.role === 'lateral-circumflex' ? '#be6157' : '#975349';
