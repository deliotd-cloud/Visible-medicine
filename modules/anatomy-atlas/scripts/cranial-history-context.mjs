// Test-only composition of newer editorial branches before the older cranial
// snapshots. Each adapter checks its own immutable records and live lessons.
import {authoringBeforeThoracoabdominalOrganXray} from './thoracoabdominal-organ-xray-history.mjs';
import {authoringBeforeSpineUltrasound} from './spine-ultrasound-history.mjs';
import {beforeLacrimalDrainageImaging} from './lacrimal-drainage-imaging-history.mjs';
import {preShortCiliaryAuthoring} from './short-ciliary-history.mjs';
import {preAnteriorCardiacVeinAuthoring} from './anterior-cardiac-vein-history.mjs';
import {beforeForearmVenousImaging} from './forearm-venous-imaging-history.mjs';
import {preLiverAnatomyCoverage} from './liver-anatomy-coverage-history.mjs';

export function shortCiliaryHistoryContext(api,catalog){
  api=authoringBeforeThoracoabdominalOrganXray({api,catalog}).api;
  api=authoringBeforeSpineUltrasound({api,catalog});
  api=beforeLacrimalDrainageImaging(api);
  api=beforeForearmVenousImaging(api);
  api=preLiverAnatomyCoverage(api,catalog);
  return preAnteriorCardiacVeinAuthoring(api,catalog);
}
export function cranialHistoryContext(api,catalog){
  return preShortCiliaryAuthoring(shortCiliaryHistoryContext(api,catalog),catalog);
}
