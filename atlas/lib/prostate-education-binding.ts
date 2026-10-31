import type { BodyCatalog, BodyStructure } from '../app/body-types';
import { bodyDisplayCatalog } from './body-display-catalog';
import type { AnatomyLinkEntry } from './anatomy-link-registry';
import type { NestedAnatomyRepresentation } from './learning-resource-types';
import {
  PROSTATE_PARENT_ID,
  PROSTATE_PARENT_SOURCE,
  PROSTATE_ZONE_REVISION,
  prostateZones,
  prostateZonesAvailable,
} from './prostate-zones';

const digest = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const canonical = (value: unknown): string => JSON.stringify(value, (_key, item) =>
  item && !Array.isArray(item) && typeof item === 'object'
    ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
    : item);

/** A source-bound conceptual selection for the original authored package.
 * `vm-prostate-zones` and its revision identify the authored model, not source
 * voxels, scan registration, or a BodyParts3D surface/coordinate frame. */
export function prostateEducationBinding(
  catalog: BodyCatalog | undefined,
  parent: BodyStructure,
): { records: NestedAnatomyRepresentation[]; entries: AnatomyLinkEntry[] } {
  const empty = (): { records: NestedAnatomyRepresentation[]; entries: AnatomyLinkEntry[] } =>
    ({ records: [], entries: [] });
  if (!catalog || !parent) return empty();
  try {
    if (catalog.sourceVersion !== '4.0' || !digest(PROSTATE_ZONE_REVISION)) return empty();
    const current = bodyDisplayCatalog(catalog);
    const matches = current.structures.filter((item) => item.id === PROSTATE_PARENT_ID);
    if (matches.length !== 1) return empty();
    const exact = matches[0];
    if (!prostateZonesAvailable(exact) || !prostateZonesAvailable(parent) ||
      canonical(exact) !== canonical(parent)) return empty();
    const bundles = current.bundles.filter((item) => item.id === exact.bundle);
    if (bundles.length !== 1 || !digest(bundles[0].sha256) ||
      exact.sources.length !== 1 ||
      exact.sources[0].file !== PROSTATE_PARENT_SOURCE.file ||
      exact.sources[0].sha256 !== PROSTATE_PARENT_SOURCE.sha256 ||
      prostateZones.length !== 4 || new Set(prostateZones.map((zone) => zone.id)).size !== 4)
      return empty();
    const parentSources = structuredClone(exact.sources);
    const records: NestedAnatomyRepresentation[] = prostateZones.map((zone) => ({
      scope: 'nested',
      structureId: zone.id,
      sources: [{ file: 'vm-prostate-zones', sha256: PROSTATE_ZONE_REVISION }],
      nested: {
        study: 'prostate-zones',
        parentId: exact.id,
        parentSources: structuredClone(parentSources),
        parentBundleSha256: bundles[0].sha256,
        bundleSha256: PROSTATE_ZONE_REVISION,
      },
    }));
    const entries: AnatomyLinkEntry[] = prostateZones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      sources: [{ file: 'vm-prostate-zones', sha256: PROSTATE_ZONE_REVISION }],
      reference: null,
    }));
    return { records, entries };
  } catch {
    return empty();
  }
}
