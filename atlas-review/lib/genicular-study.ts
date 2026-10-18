import pins from '../content/genicular-study-pins.json' with { type: 'json' };
import { genicularStudy } from '../content/genicular-study.ts';
import { sourceCanonical } from './body-source-additions.ts';
import type { BodyCatalog, BodyStructure } from '../app/body-types';

/** Exact-source admission for this study only; never a clinical approval. */
export function genicularStudyReady(catalog: BodyCatalog | null, region: string, recipeId: string | null) {
  if (recipeId !== genicularStudy.id) return true;
  if (!catalog || !genicularStudy.regions.includes(region) ||
      catalog.sourceVersion !== pins.sourceVersion || catalog.license !== pins.license ||
      sourceCanonical(catalog.coordinateSystem) !== sourceCanonical(pins.coordinateSystem)) return false;
  for (const pin of pins.entries) {
    const matches = catalog.structures.filter((s) => s.id === pin.id || s.fmaId === pin.fmaId);
    if (matches.length !== 1 || sourceCanonical(matches[0]) !== sourceCanonical(pin)) return false;
  }
  for (const pin of pins.bundles) {
    const matches = catalog.bundles.filter((b) => b.id === pin.id || b.url.split('?')[0] === pin.url.split('?')[0]);
    if (matches.length !== 1 || sourceCanonical(matches[0]) !== sourceCanonical(pin)) return false;
  }
  return true;
}

/** Display-only ROI includes the full supplied artery and popliteus envelopes.
 * Bones stay whole; no camera coordinate is an anatomical or imaging landmark.
 * Use pinned anchors, even after hiding tissue, to keep the view steady.
 */
export function genicularStudyBounds({ catalog, region, recipeId, structures, visibleIds, enabled }: {
  catalog: BodyCatalog | null; region: string; recipeId: string | null;
  structures: BodyStructure[]; visibleIds: string[]; enabled: boolean;
}) {
  if (!enabled || recipeId !== genicularStudy.id || !visibleIds.length ||
      !genicularStudyReady(catalog, region, recipeId)) return null;
  const allowed = new Set(pins.entries.map((s) => s.id));
  const visible = structures.filter((s) => visibleIds.includes(s.id));
  if (new Set(visibleIds).size !== visibleIds.length || visible.length !== visibleIds.length ||
      visible.some((s) => !allowed.has(s.id))) return null;
  const sides = new Set(visible.map((s) => s.laterality));
  if ([...sides].some((side) => side !== 'left' && side !== 'right')) return null;
  const anchors = pins.entries.filter((s) => s.system !== 'skeleton' && sides.has(s.laterality as BodyStructure['laterality']));
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const s of anchors) for (let axis = 0; axis < 3; axis++) {
    min[axis] = Math.min(min[axis], s.bounds.min[axis]);
    max[axis] = Math.max(max[axis], s.bounds.max[axis]);
  }
  const margin = Math.max(...max.map((v, axis) => v - min[axis])) * 0.15;
  if (!Number.isFinite(margin) || margin <= 0) return null;
  return { min: min.map((v) => v - margin), max: max.map((v) => v + margin) };
}
