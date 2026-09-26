import pins from '../content/forearm-superficial-vein-runtime-pins.json' with { type: 'json' };
import { forearmSuperficialVeinStudy } from '../content/forearm-superficial-vein-study.ts';
import { sourceCanonical } from './body-source-additions.ts';
import type { BodyCatalog } from '../app/body-types';

/** Refuse a changed or partial source before entering this optional study. */
export function forearmSuperficialVeinStudyReady(
  catalog: BodyCatalog | null,
  region: string,
  recipeId: string | null,
) {
  if (recipeId !== forearmSuperficialVeinStudy.id) return true;
  if (
    !catalog ||
    !forearmSuperficialVeinStudy.regions.includes(region) ||
    catalog.sourceVersion !== pins.sourceVersion ||
    catalog.license !== pins.license ||
    sourceCanonical(catalog.coordinateSystem) !== sourceCanonical(pins.coordinateSystem)
  ) return false;
  const wanted = new Set([
    ...forearmSuperficialVeinStudy.targetFmaIds,
    ...forearmSuperficialVeinStudy.context.flatMap(rule => rule.fmaIds ?? []),
  ]);
  if (
    wanted.size !== pins.entries.length ||
    new Set(pins.entries.map(entry => entry.fmaId)).size !== wanted.size ||
    !pins.entries.every(entry => wanted.has(entry.fmaId))
  ) return false;
  for (const pin of pins.entries) {
    const matches = catalog.structures.filter(s => s.id === pin.id || s.fmaId === pin.fmaId);
    if (matches.length !== 1 || sourceCanonical(matches[0]) !== sourceCanonical(pin)) return false;
  }
  const bundleIds = new Set(pins.entries.map(entry => entry.bundle));
  if (
    bundleIds.size !== pins.bundles.length ||
    new Set(pins.bundles.map(bundle => bundle.id)).size !== bundleIds.size ||
    !pins.bundles.every(bundle => bundleIds.has(bundle.id))
  ) return false;
  for (const pin of pins.bundles) {
    const matches = catalog.bundles.filter(b => b.id === pin.id || b.url.split('?')[0] === pin.url.split('?')[0]);
    if (matches.length !== 1 || sourceCanonical(matches[0]) !== sourceCanonical(pin)) return false;
  }
  return true;
}
