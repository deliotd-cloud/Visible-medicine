import correction from '../public/models/bodyparts3d/eye-layers/display-correction.json' with { type: 'json' };
import pancreaticCorrection from '../public/models/bodyparts3d/pancreas/display-correction.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import { addBrachialVeins } from './brachial-veins.ts';
import { addTentorium } from './tentorium.ts';

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
type DisplayCorrection = {
  original: BodyStructure;
  replacement: BodyStructure;
  bundle: BodyCatalog['bundles'][number];
  originalBundle?: BodyCatalog['bundles'][number];
  coordinateSystem: BodyCatalog['coordinateSystem'];
};
export const eyeDisplayCorrection = correction as unknown as DisplayCorrection;
export const pancreasDisplayCorrection =
  pancreaticCorrection as unknown as DisplayCorrection;
/** Teaching-copy continuity only; never reuse this for imaging or entitlement bindings. */
export function isPancreasDisplayRecord(s: BodyStructure) {
  return (
    s.id === pancreasDisplayCorrection.replacement.id &&
    canonical(s) === canonical(pancreasDisplayCorrection.replacement)
  );
}

/** Keep archived ingestion data immutable. The entire source-bound display
 * record is replaced atomically, so rendering, labels, practice, focus, saved
 * views and outgoing reference coordinates all consume the same geometry. */
export function bodyDisplayCatalog(catalog: BodyCatalog): BodyCatalog {
  return addTentorium(
    addBrachialVeins(
      [pancreasDisplayCorrection, eyeDisplayCorrection].reduce(
        applyDisplayCorrection,
        catalog,
      ),
    ),
  );
}

function applyDisplayCorrection(
  catalog: BodyCatalog,
  correction: DisplayCorrection,
): BodyCatalog {
  const { original, replacement, bundle, coordinateSystem, originalBundle } =
    correction;
  const candidates = catalog.structures.filter((s) => s.id === original.id);
  if (!candidates.length) return catalog;
  if (
    candidates.length !== 1 ||
    (original.provenance &&
      catalog.sourceVersion !== original.provenance.sourceVersion) ||
    canonical(catalog.coordinateSystem) !== canonical(coordinateSystem)
  )
    throw new Error('Display source coordinates changed; review required');
  if (originalBundle) {
    const matches = catalog.bundles.filter((b) => b.id === originalBundle.id);
    if (
      matches.length !== 1 ||
      canonical(matches[0]) !== canonical(originalBundle)
    )
      throw new Error(
        'Display original asset binding changed; review required',
      );
  }
  const record = candidates[0],
    existing = catalog.bundles.filter((b) => b.id === bundle.id);
  if (canonical(record) === canonical(replacement)) {
    if (existing.length !== 1 || canonical(existing[0]) !== canonical(bundle))
      throw new Error('Display asset binding changed');
    return catalog;
  }
  if (canonical(record) !== canonical(original) || existing.length)
    throw new Error('Display source binding changed; review required');
  return {
    ...catalog,
    structures: catalog.structures.map((s) =>
      s.id === original.id ? replacement : s,
    ),
    bundles: [...catalog.bundles, bundle],
  };
}
