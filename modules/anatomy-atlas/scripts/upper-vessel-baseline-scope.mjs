// Offline, exact historical scope only. Never used by the atlas or review APIs.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import record from '../content/upper-vessel-baseline-scope.json' with {type:'json'};
import {preInferiorEpigastricProfiles} from './inferior-epigastric-study-history.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function upperVesselBaselineScope(catalog,profiles) {
  assert.equal(hash(record),'7e6a8cb979532d556b4500e1744b8f1e8559422fc144ec6fe1c871fc267e8318','Changed historical scope evidence');
  assert.equal(hash(catalog),record.afterCatalogHash,'Unrecorded catalogue change requires explicit history');
  assert.equal(hash(profiles),record.afterRecipesHash,'Unrecorded recipe change requires explicit history');
  const previous={...structuredClone(catalog),
    structures:catalog.structures.filter(s=>!record.removedStructures.includes(s.id)).map(s=>structuredClone(s)),
    bundles:catalog.bundles.filter(b=>!record.removedBundles.includes(b.id)).map(b=>structuredClone(b)),
  };
  assert.equal(hash(previous),record.beforeCatalogHash,'Every historical source identity must remain exact');
  const previousProfiles=preInferiorEpigastricProfiles(profiles);
  assert.equal(hash(previousProfiles),record.beforeRecipesHash,'Every historical recipe must remain exact');
  return {catalog:previous,profiles:previousProfiles,sourceCommit:record.sourceCommit,originalWholeCurriculumHash:record.originalWholeCurriculumHash};
}
