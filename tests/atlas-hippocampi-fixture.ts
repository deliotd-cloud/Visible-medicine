import assert from 'node:assert/strict';
import type {AtlasStoredModel} from '../lib/atlas-model-storage.ts';

export const hippocampalModel = {
  sha256:'11cf97da7aa459f1181c79278b41c9c4369f8954eb5d4a00d1bc22b5cf28964e',
  bytes:38548,
  paths:['/atlas-runtime/head-neck/models/bodyparts3d/hippocampi/hippocampi.glb'],
};

/** Historical preservation assertions omit only the separately verified addition.
 * Unknown models are never filtered; wrong paths, bytes or duplicates still fail. */
export function beforeHippocampi<T extends AtlasStoredModel>(models:T[]):T[] {
  const matches=models.filter(m=>m.sha256===hippocampalModel.sha256);
  assert.equal(matches.length,1,'Exactly one admitted hippocampal bundle');
  assert.deepEqual(matches[0],hippocampalModel);
  return models.filter(m=>m.sha256!==hippocampalModel.sha256);
}
