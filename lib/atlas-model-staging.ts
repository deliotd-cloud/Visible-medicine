import activeInventory from './atlas-model-inventory.json';
import candidateInventory from './atlas-model-staging-candidate.json';
import { atlasStagingModels } from './atlas-model-staging-registry';

// Candidate catalogue copied exactly from this saved, audited website revision.
// It grants admin staging only, not clinical approval or active Atlas delivery.
export const ATLAS_STAGING_CANDIDATE = {
  sourceCommit: 'ec4aa5c4c0168258d15f968c1905189755a4cb5e',
  inventorySha256: '376093665a82d5f5add5c537599bd51cf399eb80729768062a2c4f19c3b0f833',
} as const;

export const atlasRegisteredStagingModels = atlasStagingModels(activeInventory.models, candidateInventory.models);
