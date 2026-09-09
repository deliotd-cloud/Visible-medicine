import correction from '../public/models/bodyparts3d/eye-layers/display-correction.json';
import type { BodyCatalog, BodyStructure } from '../app/body-types';

const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`,
      )
      .join(',')}}`;
  return JSON.stringify(value);
};
export const eyeDisplayCorrection = correction as unknown as {
  original: BodyStructure;
  replacement: BodyStructure;
  bundle: BodyCatalog['bundles'][number];
  coordinateSystem: BodyCatalog['coordinateSystem'];
};

/** Keep archived ingestion data immutable. The entire source-bound display
 * record is replaced atomically, so rendering, labels, practice, focus, saved
 * views and outgoing reference coordinates all consume the same geometry. */
export function bodyDisplayCatalog(catalog: BodyCatalog): BodyCatalog {
  const { original, replacement, bundle, coordinateSystem } =
    eyeDisplayCorrection;
  const candidates = catalog.structures.filter((s) => s.id === original.id);
  if (!candidates.length) return catalog;
  if (
    candidates.length !== 1 ||
    canonical(catalog.coordinateSystem) !== canonical(coordinateSystem)
  )
    throw new Error('Eye display source coordinates changed; review required');
  const record = candidates[0],
    existing = catalog.bundles.filter((b) => b.id === bundle.id);
  if (canonical(record) === canonical(replacement)) {
    if (existing.length !== 1 || canonical(existing[0]) !== canonical(bundle))
      throw new Error('Eye display asset binding changed');
    return catalog;
  }
  if (canonical(record) !== canonical(original) || existing.length)
    throw new Error('Eye display source binding changed; review required');
  return {
    ...catalog,
    structures: catalog.structures.map((s) =>
      s.id === original.id ? replacement : s,
    ),
    bundles: [...catalog.bundles, bundle],
  };
}
