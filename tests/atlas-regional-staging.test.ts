import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
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
const coronary = json('atlas-model-staging-coronary-20260924');
const sha = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');

test('regional staging preserves immutable candidates after explicit administrator-review runtime integration', async () => {
  const before = JSON.stringify(active);
  assert.equal(candidate.purpose, 'administrator-staging-only');
  assert.equal(candidate.atlasSource, 'a5baf03bb274e2e6f3dfe078603a0b9988b1f400');
  assert.equal(candidate.candidateManifestSha256, 'bc8b31c36b3533bb996d7c4feccc84991e268f81cf7f7bebb4f7ed59ea06218e');
  assert.equal(candidate.proposedInventorySha256, 'a74532b7b64b61221f14ddefb02c267296376397c19da5553772996fdcaebba4');
  assert.equal(candidate.activeInventorySha256, '9f686f1a2c9909bba2b46b1b76805aa8168287c4aa4d0f420e942b3fb7c90e2c');
  // Teaching/UI companions can advance without rewriting the immutable staging receipt.
  assert.equal(sha(readFileSync('lib/atlas-model-inventory.json', 'utf8')), '307725070b615c9a8f4c09c251574de6a90289a289723abbef21a0833e052d9f');
  const beforeCoronary=active.models.filter((m: AtlasStoredModel)=>m.sha256!==coronary.models[0].sha256);
  const priorActiveModels=beforeCoronary.filter((m: AtlasStoredModel)=>m.sha256!==celiac.models[0].sha256);
  const pelvicAlias = '/atlas-runtime/female-pelvis/models/hra-renal/kidneys.glb';
  const renal = active.models.find((m: AtlasStoredModel) => m.paths.includes(pelvicAlias));
  assert.equal(renal.sha256, 'bd5d2affb912f135c8c8da7e7892fbc906ebae017ed7042e900646c2b6332cfc');
  assert.equal(renal.bytes, 3557552);
  assert.equal(active.models.flatMap((m: AtlasStoredModel) => m.paths).filter((p: string) => p === pelvicAlias).length, 1);
  const previousModels = priorActiveModels.map((m: AtlasStoredModel) => ({...m, paths:m.paths.filter(p => p !== pelvicAlias)}));
  assert.equal(sha(JSON.stringify(previousModels)), '5047d0652bcadd1772f60e2928ae53e228d9359d99488056e39777c4a7cdedb6', 'Removing exactly the new alias reproduces every previously verified model identity, byte count and path');
  assert.equal(sha(JSON.stringify(priorActiveModels)), '972cd41676713abf3aa458055783ce95bcfac41596bf5ec411911f9a1717aa10');
  assert.equal(sha(readFileSync('public/atlas-runtime/head-neck/manifest.json', 'utf8')), 'cee184c035509d8bcf61953f02e507118aee961351af888c713a316f36d52454');
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
  const previousExpected = atlasStagingModels(existing, celiac.models);
  const expected = atlasStagingModels(previousExpected, coronary.models);
  assert.deepEqual(celiac, {
    purpose: 'administrator-staging-only',
    atlasSource: '3305cb9a28206db86e7f9b0171323d88a3cfa01b',
    candidateManifestSha256: 'aeba9e5d13de4e1ee1d27d11a74c5090b990865b14eae657707b2b104c99eb61',
    activeInventorySha256: '77f5958918eeea3535517e4f9b49c06b35540b3f810223732ded8e299710f7c0',
    proposedInventorySha256: '23385abb9c34947b4118efa3106eea53e3f955c3fa163feae7f2484550dfb0ed',
    models: [{sha256:'4f431242839c255ae2320b4004c537a4c2defb7d0cd7b51fdea60f7ba3c09e8f',bytes:5604,paths:['/atlas-runtime/head-neck/models/bodyparts3d/celiac-display/celiac-display.glb']}],
  });
  assert.deepEqual(coronary, {
    purpose:'administrator-staging-only',
    atlasSource:'201f8c9d075c1eda29e1dd93e94b458a44563d62',
    websiteCandidate:'fbe9963e793007d2f06d31ac21ce6df61da7e4fa',
    candidateManifestSha256:'a39c8b154e77da5170a7669d9c68532a65ffea2b3b242962a7775a38fbead784',
    activeInventorySha256:'85167c7ff6ee2742392caa4e6ea13aa620c9184d39f316f28e6bfd60ff9e2bd0',
    models:[{sha256:'4dbd938c5cde865a0f7f66957ec3304965530a5b7744d93a85e95531ce827b12',bytes:40996,
      paths:['/atlas-runtime/head-neck/models/bodyparts3d/coronary-venous/coronary-venous.glb']}],
  });
  assert.equal(sha(execFileSync('git',['show',`${coronary.websiteCandidate}:public/atlas-runtime/head-neck/manifest.json`])),coronary.candidateManifestSha256);
  const coronaryBytes=execFileSync('git',['show',`${coronary.websiteCandidate}:public${coronary.models[0].paths[0]}`]);
  assert.equal(coronaryBytes.length,coronary.models[0].bytes);
  assert.equal(sha(coronaryBytes),coronary.models[0].sha256);
  const bridge=JSON.parse(execFileSync('git',['show','67c7437f399d6cdfaec27d575619f151dcedc53a:lib/atlas-model-inventory.json']).toString());
  assert.equal(sha(JSON.stringify(bridge,null,2)+'\n'),coronary.activeInventorySha256);
  assert.deepEqual(beforeCoronary,bridge.models,'Every bridge object and path remains unchanged');
  assert.throws(()=>resolveAtlasDeliveryModel(new URL(coronary.models[0].paths[0],'https://atlas.test'),bridge.models),
    'Historical staging bridge did not activate the viewer path');
  assert.deepEqual(resolveAtlasDeliveryModel(new URL(coronary.models[0].paths[0],'https://atlas.test'),active.models),coronary.models[0],
    'Explicit reviewed integration, not staging registration, activates the model path');
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
    './atlas-model-staging-coronary-20260924.json': coronary,
    './atlas-model-staging-registry': { atlasStagingModels },
  };
  new Function('require', 'exports', source)((name: string) => {
    assert(Object.hasOwn(imports, name), `Unexpected registry import: ${name}`);
    return imports[name];
  }, exports);
  assert.deepEqual(exports.atlasRegisteredStagingModels, expected);
  assert.equal(expected.length, 136);
  assert.equal(expected.flatMap(m => m.paths).length, 143);
  assert.equal(active.models.length, 136);
  assert.deepEqual(existing, active.models.map((m: AtlasStoredModel) => ({...m, paths:[...m.paths].sort()})), 'Every previous object remains active after explicit coronary integration');
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
