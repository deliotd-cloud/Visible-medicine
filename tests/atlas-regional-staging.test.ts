import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { atlasStagingModels, atlasStagingCheckModels } from '../lib/atlas-model-staging-registry.ts';
import { resolveAtlasDeliveryModel } from '../lib/atlas-model-delivery.ts';
import type { AtlasStoredModel } from '../lib/atlas-model-storage.ts';

const json = (file: string) => JSON.parse(readFileSync(`lib/${file}.json`, 'utf8'));
const active = json('atlas-model-inventory');
const historical = json('atlas-model-staging-candidate');
const candidate = json('atlas-model-staging-regional-20260917');
const cardiac = json('atlas-model-staging-regional-20260918');
const celiac = json('atlas-model-staging-celiac-20260918');
const sha = (value: string) => createHash('sha256').update(value).digest('hex');

test('regional staging preserves immutable candidates after explicit administrator-review runtime integration', async () => {
  const before = JSON.stringify(active);
  assert.equal(candidate.purpose, 'administrator-staging-only');
  assert.equal(candidate.atlasSource, 'a5baf03bb274e2e6f3dfe078603a0b9988b1f400');
  assert.equal(candidate.candidateManifestSha256, 'bc8b31c36b3533bb996d7c4feccc84991e268f81cf7f7bebb4f7ed59ea06218e');
  assert.equal(candidate.proposedInventorySha256, 'a74532b7b64b61221f14ddefb02c267296376397c19da5553772996fdcaebba4');
  assert.equal(candidate.activeInventorySha256, '9f686f1a2c9909bba2b46b1b76805aa8168287c4aa4d0f420e942b3fb7c90e2c');
  // Teaching/UI companions can advance without rewriting the immutable staging receipt.
  assert.equal(sha(JSON.stringify(active, null, 2) + '\n'), '5930be345cb1bca0e0a8f73cad71fdeb2832eeb5bdd2216752b3ead2d56c0285');
  const priorActiveModels=active.models.filter((m: AtlasStoredModel)=>m.sha256!==celiac.models[0].sha256);
  const pelvicAlias = '/atlas-runtime/female-pelvis/models/hra-renal/kidneys.glb';
  const renal = active.models.find((m: AtlasStoredModel) => m.paths.includes(pelvicAlias));
  assert.equal(renal.sha256, 'bd5d2affb912f135c8c8da7e7892fbc906ebae017ed7042e900646c2b6332cfc');
  assert.equal(renal.bytes, 3557552);
  assert.equal(active.models.flatMap((m: AtlasStoredModel) => m.paths).filter((p: string) => p === pelvicAlias).length, 1);
  const previousModels = priorActiveModels.map((m: AtlasStoredModel) => ({...m, paths:m.paths.filter(p => p !== pelvicAlias)}));
  assert.equal(sha(JSON.stringify(previousModels)), '5047d0652bcadd1772f60e2928ae53e228d9359d99488056e39777c4a7cdedb6', 'Removing exactly the new alias reproduces every previously verified model identity, byte count and path');
  assert.equal(sha(JSON.stringify(priorActiveModels)), '972cd41676713abf3aa458055783ce95bcfac41596bf5ec411911f9a1717aa10');
  assert.equal(sha(readFileSync('public/atlas-runtime/head-neck/manifest.json', 'utf8')), '58436fd69f8e3615e29e14ab3f11f86f052cc06cdbf90e46690bc260dfd4d4f3');
  assert.deepEqual(candidate.models, [
    { sha256: 'f704a79a0fe2c9b30a93380d36ab31cb241f1ca81f701b870ff288bfb616d826', bytes: 11856, paths: ['/atlas-runtime/head-neck/models/bodyparts3d/corpus-spongiosum/corpus-spongiosum.glb'] },
    { sha256: '9272b6137e321e1ed243d0c79b8c3a022eb56f2954af2ec65dd8b06ebfe6e0a5', bytes: 65264, paths: ['/atlas-runtime/head-neck/models/bodyparts3d/short-ciliary/short-ciliary.glb'] },
  ]);
  assert.equal(cardiac.purpose, 'administrator-staging-only');
  assert.equal(cardiac.atlasSource, '6fe69ab68bd76d3648c0725eedabdba8ab778823');
  assert.equal(cardiac.candidateManifestSha256, '431654af2230c2930d9923db53593b841b48c054e1234c280fb98ce35a3cf938');
  assert.equal(cardiac.proposedInventorySha256, '9dac1e4c6f72ff816a885515ce8397d5311cf6ef48e355cffd9785e32ee5a38f');
  assert.equal(cardiac.activeInventorySha256, candidate.activeInventorySha256);
  assert.deepEqual(cardiac.models, [
    { sha256: 'ff72014e957d661a16892581db9e371482541302e4a3203ba3e84cac9f5f1928', bytes: 17252, paths: ['/atlas-runtime/head-neck/models/bodyparts3d/anterior-cardiac-vein/anterior-cardiac-vein.glb'] },
  ]);
  const prior = atlasStagingModels(atlasStagingModels(active.models, historical.models), candidate.models);
  const existing = atlasStagingModels(prior, cardiac.models);
  const expected = atlasStagingModels(existing, celiac.models);
  assert.deepEqual(celiac, {
    purpose: 'administrator-staging-only',
    atlasSource: '3305cb9a28206db86e7f9b0171323d88a3cfa01b',
    candidateManifestSha256: 'aeba9e5d13de4e1ee1d27d11a74c5090b990865b14eae657707b2b104c99eb61',
    activeInventorySha256: '77f5958918eeea3535517e4f9b49c06b35540b3f810223732ded8e299710f7c0',
    proposedInventorySha256: '23385abb9c34947b4118efa3106eea53e3f955c3fa163feae7f2484550dfb0ed',
    models: [{sha256:'4f431242839c255ae2320b4004c537a4c2defb7d0cd7b51fdea60f7ba3c09e8f',bytes:5604,paths:['/atlas-runtime/head-neck/models/bodyparts3d/celiac-display/celiac-display.glb']}],
  });
  for (const model of existing) assert.deepEqual(expected.find(m => m.sha256 === model.sha256), model);
  for (const path of celiac.models[0].paths) {
    assert.throws(() => resolveAtlasDeliveryModel(new URL(path, 'https://atlas.test'), priorActiveModels), 'Staging alone did not activate the model in the prior inventory');
    assert.equal(resolveAtlasDeliveryModel(new URL(path, 'https://atlas.test'), active.models).sha256, celiac.models[0].sha256);
  }
  for (const model of prior) assert.deepEqual(expected.find(m => m.sha256 === model.sha256), model);
  // Execute the actual registration module with only its imports supplied;
  // testing a hand-built union alone would miss broken production wiring.
  const source = ts.transpileModule(readFileSync('lib/atlas-model-staging.ts', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const exports: { atlasRegisteredStagingModels?: AtlasStoredModel[] } = {};
  const imports: Record<string, unknown> = {
    './atlas-model-inventory.json': active,
    './atlas-model-staging-candidate.json': historical,
    './atlas-model-staging-regional-20260917.json': candidate,
    './atlas-model-staging-regional-20260918.json': cardiac,
    './atlas-model-staging-celiac-20260918.json': celiac,
    './atlas-model-staging-registry': { atlasStagingModels },
  };
  new Function('require', 'exports', source)((name: string) => {
    assert(Object.hasOwn(imports, name), `Unexpected registry import: ${name}`);
    return imports[name];
  }, exports);
  assert.deepEqual(exports.atlasRegisteredStagingModels, expected);
  assert.equal(expected.length, 135);
  assert.equal(expected.flatMap(m => m.paths).length, 142);
  assert.equal(active.models.length, 135);
  assert.deepEqual(existing, active.models.map((m: AtlasStoredModel) => ({...m, paths:[...m.paths].sort()})), 'Every previous object remains active; the new correction is staging-only');
  assert.equal(candidate.models.reduce((n: number, m: AtlasStoredModel) => n + m.bytes, 0), 77120);
  for (const mode of ['upload', 'check', 'download'] as const) assert.strictEqual(atlasStagingCheckModels(mode, expected, active.models), expected);
  assert.strictEqual(atlasStagingCheckModels('delivery', expected, active.models), active.models);
  for (const model of [...candidate.models, ...cardiac.models]) for (const path of model.paths) {
    assert.equal(resolveAtlasDeliveryModel(new URL(path, 'https://atlas.test'), active.models).sha256, model.sha256);
  }
  for (const model of active.models) for (const path of model.paths) {
    assert.equal(resolveAtlasDeliveryModel(new URL(path, 'https://atlas.test'), active.models).sha256, model.sha256);
  }
  assert.equal(JSON.stringify(active), before);
  assert.match(readFileSync('lib/atlas-delivery-policy.ts', 'utf8'), /audience: 'administrator-review'/);
});
