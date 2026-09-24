import pins from '../content/limb-vascular-study-pins.json' with { type: 'json' };
import { limbVascularStudySets } from '../content/limb-vascular-studies.ts';
import { sourceCanonical } from './body-source-additions.ts';
import type { BodyCatalog } from '../app/body-types';
import { genicularStudyReady } from './genicular-study.ts';
import { poplitealVesselStudyReady } from './popliteal-vessel-study.ts';
import { deferentDuctStudyReady } from './deferent-ducts.ts';
import { armVascularStudyReady } from './arm-vascular-studies.ts';
import { inferiorEpigastricStudyReady } from './inferior-epigastric-vessels.ts';
import { pelvicVeinStudyReady } from './pelvic-veins.ts';
import { limbicLandmarkStudyReady } from './limbic-landmarks.ts';
import { cubitalStudyReady } from './cubital-studies.ts';
import { portalHepaticStudyReady } from './portal-hepatic-study.ts';
import { handIntrinsicStudyReady } from './hand-intrinsic-studies.ts';
import { lowerNeckStudyReady } from './lower-neck-study.ts';
import { forearmSuperficialVeinStudyReady } from './forearm-superficial-veins.ts';

/** Guard only this family; existing study families retain their own admissions. */
export function limbVascularStudyReady(
  catalog: BodyCatalog | null,
  region: string,
  recipeId: string | null,
) {
  if (!forearmSuperficialVeinStudyReady(catalog, region, recipeId)) return false;
  if (!lowerNeckStudyReady(catalog, region, recipeId)) return false;
  if (!handIntrinsicStudyReady(catalog, region, recipeId)) return false;
  if (!inferiorEpigastricStudyReady(catalog, region, recipeId)) return false;
  if (!cubitalStudyReady(catalog, region, recipeId)) return false;
  if (!portalHepaticStudyReady(catalog, region, recipeId)) return false;
  if (!pelvicVeinStudyReady(catalog, region, recipeId)) return false;
  if (!limbicLandmarkStudyReady(catalog, region, recipeId)) return false;
  if (!armVascularStudyReady(catalog, region, recipeId)) return false;
  if (!genicularStudyReady(catalog, region, recipeId)) return false;
  if (!poplitealVesselStudyReady(catalog, region, recipeId)) return false;
  if (!deferentDuctStudyReady(catalog, region, recipeId)) return false;
  const study = limbVascularStudySets.find((s) => s.id === recipeId);
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
  for (const pin of pins.bundles.filter((b) =>
    records.some((s) => s.bundle === b.id),
  )) {
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
