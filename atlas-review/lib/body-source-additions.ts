import type { BodyCatalog, BodyStructure } from '../app/body-types';
import { validBodyPresentationParts } from './body-presentation-parts.ts';

export const sourceCanonical = (v: unknown): string =>
  Array.isArray(v)
    ? `[${v.map(sourceCanonical).join(',')}]`
    : v && typeof v === 'object'
      ? `{${Object.keys(v)
          .sort()
          .map(
            (k) =>
              `${JSON.stringify(k)}:${sourceCanonical((v as Record<string, unknown>)[k])}`,
          )
          .join(',')}}`
      : JSON.stringify(v);
export type BodySourceAddition = Pick<
  BodyCatalog,
  'sourceVersion' | 'license' | 'coordinateSystem' | 'structures' | 'bundles'
> & { contextRecords: BodyStructure[]; contextBundles: BodyCatalog['bundles'] };

/** Whole-record atomic admission; never a FMA-only or name-only geometry substitution. */
export function applyBodySourceAddition(
  catalog: BodyCatalog,
  source: BodySourceAddition,
): BodyCatalog {
  const touched =
    catalog.structures.some((s) =>
      [...source.contextRecords, ...source.structures].some(
        (p) => p.id === s.id || p.fmaId === s.fmaId,
      ),
    ) || catalog.bundles.some((b) => source.bundles.some((p) => p.id === b.id));
  if (!touched) return catalog;
  const reject = () => {
    throw new Error(
      'Additional anatomy source binding changed; review required',
    );
  };
  if (!source.structures.every(validBodyPresentationParts)) reject();
  if (
    catalog.sourceVersion !== source.sourceVersion ||
    catalog.license !== source.license ||
    sourceCanonical(catalog.coordinateSystem) !==
      sourceCanonical(source.coordinateSystem)
  )
    reject();
  for (const record of source.contextRecords) {
    const matches = catalog.structures.filter(
      (s) => s.id === record.id || s.fmaId === record.fmaId,
    );
    if (
      matches.length !== 1 ||
      sourceCanonical(matches[0]) !== sourceCanonical(record)
    )
      reject();
  }
  for (const bundle of source.contextBundles) {
    const matches = catalog.bundles.filter((b) => b.id === bundle.id);
    if (
      matches.length !== 1 ||
      sourceCanonical(matches[0]) !== sourceCanonical(bundle)
    )
      reject();
  }
  const existing = catalog.structures.filter(
    (s) =>
      source.structures.some((p) => p.id === s.id || p.fmaId === s.fmaId) ||
      source.bundles.some((b) => b.id === s.bundle),
  );
  const bundles = catalog.bundles.filter((b) =>
    source.bundles.some(
      (p) => p.id === b.id || p.url.split('?')[0] === b.url.split('?')[0],
    ),
  );
  if (existing.length || bundles.length) {
    if (
      existing.length !== source.structures.length ||
      bundles.length !== source.bundles.length
    )
      reject();
    for (const record of source.structures) {
      const matches = existing.filter((s) => s.id === record.id);
      if (
        matches.length !== 1 ||
        sourceCanonical(matches[0]) !== sourceCanonical(record)
      )
        reject();
    }
    for (const bundle of source.bundles) {
      const matches = bundles.filter((b) => b.id === bundle.id);
      if (
        matches.length !== 1 ||
        sourceCanonical(matches[0]) !== sourceCanonical(bundle)
      )
        reject();
    }
    return catalog;
  }
  // Inputs are retained JSON: detach nested arrays without requiring a browser-specific global.
  return {
    ...catalog,
    structures: [
      ...catalog.structures,
      ...JSON.parse(JSON.stringify(source.structures)),
    ],
    bundles: [
      ...catalog.bundles,
      ...JSON.parse(JSON.stringify(source.bundles)),
    ],
  };
}
