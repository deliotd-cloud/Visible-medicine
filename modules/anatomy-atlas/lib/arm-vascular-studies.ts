import pins from '../content/arm-vascular-study-pins.json' with { type: 'json' };
import { armVascularStudies } from '../content/arm-vascular-studies.ts';
import { sourceCanonical } from './body-source-additions.ts';
import type { BodyCatalog } from '../app/body-types';

/** Source admission only. Never reuses a clinical approval or joins vessel ends. */
export function armVascularStudyReady(
  catalog: BodyCatalog | null,
  region: string,
  recipeId: string | null,
) {
  const study = armVascularStudies.find((s) => s.id === recipeId);
  if (!study) return true;
  if (
    !catalog ||
    !study.regions.includes(region) ||
    catalog.sourceVersion !== pins.sourceVersion ||
    catalog.license !== pins.license ||
    sourceCanonical(catalog.coordinateSystem) !==
      sourceCanonical(pins.coordinateSystem)
  )
    return false;
  const ids = new Set([
    ...study.targetFmaIds,
    ...study.context.flatMap((r) => r.fmaIds ?? []),
  ]);
  const records = pins.entries.filter((s) => ids.has(s.fmaId));
  if (records.length !== ids.size) return false;
  for (const pin of records) {
    const matches = catalog.structures.filter(
      (s) => s.id === pin.id || s.fmaId === pin.fmaId,
    );
    if (
      matches.length !== 1 ||
      sourceCanonical(matches[0]) !== sourceCanonical(pin)
    )
      return false;
  }
  const bundles = new Set(records.map((s) => s.bundle));
  const expected = pins.bundles.filter((b) => bundles.has(b.id));
  if (expected.length !== bundles.size) return false;
  for (const pin of expected) {
    const matches = catalog.bundles.filter(
      (b) => b.id === pin.id || b.url.split('?')[0] === pin.url.split('?')[0],
    );
    if (
      matches.length !== 1 ||
      sourceCanonical(matches[0]) !== sourceCanonical(pin)
    )
      return false;
  }
  return true;
}
