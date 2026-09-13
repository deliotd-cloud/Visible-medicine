import { AtlasModelError, ATLAS_MODEL_MAX_BYTES, type AtlasStoredModel } from './atlas-model-storage.ts';

/** Compile-time registered assets only; never accept a manifest from an upload. */
export function atlasStagingModels(active: readonly AtlasStoredModel[], candidate: readonly AtlasStoredModel[]): AtlasStoredModel[] {
  const models = new Map<string, AtlasStoredModel>();
  for (const inventory of [active, candidate]) {
    const hashes = new Set<string>();
    const paths = new Set<string>();
    for (const model of inventory) {
      if (!/^[a-f0-9]{64}$/.test(model.sha256) || hashes.has(model.sha256)
        || !Number.isSafeInteger(model.bytes) || model.bytes < 12 || model.bytes > ATLAS_MODEL_MAX_BYTES
        || !Array.isArray(model.paths) || model.paths.length === 0) {
        throw new AtlasModelError('The registered staging inventory is invalid.', 503);
      }
      hashes.add(model.sha256);
      for (const path of model.paths) {
        if (!/^\/atlas-runtime\/(shoulder|female-pelvis|lower-limb|head-neck)\/models\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.glb$/.test(path) || paths.has(path)) {
          throw new AtlasModelError('The registered staging path is invalid or ambiguous.', 503);
        }
        paths.add(path);
      }
      const existing = models.get(model.sha256);
      if (existing && existing.bytes !== model.bytes) throw new AtlasModelError('Registered model sizes disagree.', 503);
      models.set(model.sha256, { sha256: model.sha256, bytes: model.bytes, paths: [...new Set([...(existing?.paths ?? []), ...model.paths])].sort() });
    }
  }
  // New bytes may be staged for an existing path, but only the independent
  // active inventory resolves delivery. Never write back to either input.
  return [...models.values()].sort((a, b) => a.sha256.localeCompare(b.sha256));
}

export function atlasStagingCheckModels(mode: 'upload' | 'check' | 'download' | 'delivery', staging: readonly AtlasStoredModel[], active: readonly AtlasStoredModel[]) {
  return mode === 'delivery' ? active : staging;
}
