import raw from '../public/models/bodyparts3d/cranial-artery-components/catalog.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';

export type CranialArteryComponent = BodyStructure & {
  parentId: string;
  parentFmaId: string;
  role: 'source-part';
  sourceOrder: number;
  sourcePartCount: number;
};
export const cranialArteryComponentCatalog = raw as unknown as Omit<
  BodyCatalog,
  'structures'
> & {
  parents: BodyStructure[];
  parentBundles: BodyCatalog['bundles'];
  structures: CranialArteryComponent[];
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
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** Source-file identities only. An inherited parent FMA is not a child concept. */
export function cranialArteryComponentsFor(
  parent: BodyStructure | null,
): CranialArteryComponent[] {
  const pinned =
    parent &&
    cranialArteryComponentCatalog.parents.find((p) => p.id === parent.id);
  if (!parent || !pinned || canonical(parent) !== canonical(pinned)) return [];
  return copy(
    cranialArteryComponentCatalog.structures.filter(
      (s) => s.parentId === parent.id,
    ),
  );
}
export function cranialArteryComponentViewCatalog(
  parent: BodyStructure | null,
): BodyCatalog {
  const structures = cranialArteryComponentsFor(parent);
  return {
    ...copy(cranialArteryComponentCatalog),
    structures,
    bundles: copy(
      cranialArteryComponentCatalog.bundles.filter((b) =>
        structures.some((s) => s.bundle === b.id),
      ),
    ),
  };
}
export function cranialArteryParentBundleMatches(
  bundle: BodyCatalog['bundles'][number],
) {
  return cranialArteryComponentCatalog.parentBundles.some(
    (b) => canonical(b) === canonical(bundle),
  );
}
