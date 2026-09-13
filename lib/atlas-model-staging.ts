import activeInventory from './atlas-model-inventory.json';
import candidateInventory from './atlas-model-staging-candidate.json';
import { atlasStagingModels } from './atlas-model-staging-registry';

// Candidate catalogue copied exactly from this saved, audited website revision.
// It grants admin staging only, not clinical approval or active Atlas delivery.
export const ATLAS_STAGING_CANDIDATE = {
  sourceCommit: '1268adcd49339e5766142b9c34aec156e0167db3',
  inventorySha256: 'd64267746511da4c2052827c06fe98cdd82edbf1c82bc66e35d05c56584c210e',
} as const;

export const atlasRegisteredStagingModels = atlasStagingModels(activeInventory.models, candidateInventory.models);
