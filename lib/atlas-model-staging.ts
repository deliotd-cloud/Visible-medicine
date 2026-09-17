import activeInventory from './atlas-model-inventory.json';
import candidateInventory from './atlas-model-staging-candidate.json';
import regionalCandidate from './atlas-model-staging-regional-20260917.json';
import { atlasStagingModels } from './atlas-model-staging-registry';

// Candidate catalogue copied exactly from this saved, audited website revision.
// It grants admin staging only, not clinical approval or active Atlas delivery.
export const ATLAS_STAGING_CANDIDATE = {
  sourceCommit: '554054e4791f5f7f5e11c2e5c38431873140d017',
  inventorySha256: '091481333b4d5a89fc1a3d05f38db397d125e8009280100b0c69c72e61a79b4b',
} as const;

// Preserve the historical catalogue; this addition registers two exact new
// objects for staff upload only. Active delivery never imports this registry.
export const atlasRegisteredStagingModels = atlasStagingModels(
  atlasStagingModels(activeInventory.models, candidateInventory.models),
  regionalCandidate.models,
);
