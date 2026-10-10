// Test-only composition of newer editorial branches before the older cranial
// snapshots. Each adapter checks its own immutable records and live lessons.
import {authoringBeforeThoracoabdominalOrganXray} from './thoracoabdominal-organ-xray-history.mjs';
import {authoringBeforeSpineUltrasound} from './spine-ultrasound-history.mjs';
import {authoringBeforeSpinalBoneUltrasound} from './spinal-bone-ultrasound-history.mjs';
import {authoringBeforeHyoidEpiglottisUltrasound} from './hyoid-epiglottis-ultrasound-history.mjs';
import {authoringBeforeCranialBoneXray} from './cranial-bone-xray-history.mjs';
import {authoringBeforeSuprascapularVesselUltrasound} from './suprascapular-vessel-ultrasound-history.mjs';
import {authoringBeforeDeepBrainCore} from './deep-brain-core-teaching-history.mjs';
import {authoringBeforeFootSurfaceImaging} from './foot-surface-imaging-history.mjs';
import {beforeLacrimalDrainageImaging} from './lacrimal-drainage-imaging-history.mjs';
import {preShortCiliaryAuthoring} from './short-ciliary-history.mjs';
import {preAnteriorCardiacVeinAuthoring} from './anterior-cardiac-vein-history.mjs';
import {beforeForearmVenousImaging} from './forearm-venous-imaging-history.mjs';
import {preLiverAnatomyCoverage} from './liver-anatomy-coverage-history.mjs';

export function shortCiliaryHistoryContext(api,catalog){
  api=authoringBeforeFootSurfaceImaging({api,catalog});
  api=authoringBeforeDeepBrainCore({api,catalog});
  api=authoringBeforeSuprascapularVesselUltrasound({api,catalog});
  api=authoringBeforeCranialBoneXray({api,catalog});
  api=authoringBeforeHyoidEpiglottisUltrasound({api,catalog});
  api=authoringBeforeSpinalBoneUltrasound({api,catalog});
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
