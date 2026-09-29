import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import ts from 'typescript';
import { Miniflare, Log, LogLevel, convertV4MiniflareOptions } from 'miniflare';
import { atlasStagingModels, atlasStagingCheckModels } from '../lib/atlas-model-staging-registry.ts';
import { resolveAtlasDeliveryModel } from '../lib/atlas-model-delivery.ts';
import type { AtlasStoredModel } from '../lib/atlas-model-storage.ts';

const sourceCommit = '554054e4791f5f7f5e11c2e5c38431873140d017';
const source = (path: string, commit = sourceCommit) => execFileSync('git', ['cat-file', 'blob', `${commit}:${path}`], { maxBuffer: 40 * 1024 * 1024 });
const sha = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
const previous: { models: AtlasStoredModel[] } = JSON.parse(source('lib/atlas-model-inventory.json', '64f7156427972050307d24a6253049b4f5f11970').toString());
const candidate: { models: AtlasStoredModel[] } = JSON.parse(readFileSync('lib/atlas-model-staging-candidate.json', 'utf8'));
const active: { models: AtlasStoredModel[] } = JSON.parse(readFileSync('lib/atlas-model-inventory.json', 'utf8'));
const added = candidate.models.filter(m => !previous.models.some(p => p.sha256 === m.sha256));

test('staging candidate is an exact saved source inventory, not an active release or scan manifest', () => {
  assert.equal(sha(JSON.stringify(candidate, null, 2) + '\n'), '091481333b4d5a89fc1a3d05f38db397d125e8009280100b0c69c72e61a79b4b');
  assert.deepEqual(candidate, JSON.parse(source('lib/atlas-model-inventory.json').toString()));
  assert.equal(previous.models.length, 80); assert.equal(candidate.models.length, 94); assert.equal(added.length, 14);
  assert.equal(added.reduce((n,m) => n + m.bytes, 0), 14198676);
  const binding = readFileSync('lib/atlas-model-staging.ts', 'utf8');
  assert.ok(binding.includes(sourceCommit)); assert.ok(binding.includes(sha(JSON.stringify(candidate, null, 2) + '\n')));
  for (const path of ['app/api/atlas-delivery/[...asset]/route.ts', 'worker/index.ts', 'lib/atlas-delivery-policy.ts', 'scripts/prepare-atlas-delivery.mjs']) {
    assert.doesNotMatch(readFileSync(path, 'utf8'), /atlas-model-staging|atlasRegisteredStagingModels/, 'staging registration never authorizes active delivery');
  }
  assert.match(readFileSync('app/api/atlas-models/[sha256]/route.ts', 'utf8'), /atlasRegisteredStagingModels, env\.FILES, authorizeAtlasModelStaging/);
  assert.match(readFileSync('app/workspace/atlas-models/page.tsx', 'utf8'), /models=\{atlasRegisteredStagingModels\} deliveryModels=\{inventory\.models\}/);
});

test('staging deduplicates immutable objects without mutating or promoting the active inventory', () => {
  const before = JSON.stringify(previous);
  const staging = atlasStagingModels(previous.models, candidate.models);
  assert.equal(staging.length, 94);
  assert.equal(atlasStagingModels(active.models, candidate.models).length, 137, 'current expansion retains the historical candidate and active objects');
  for (const model of previous.models) {
    const current = active.models.find(m => m.sha256 === model.sha256);
    assert(current); assert.equal(current.bytes, model.bytes);
    for (const path of model.paths) assert(current.paths.includes(path), 'all prior delivery paths remain');
  }
  for (const mode of ['check', 'download', 'upload'] as const) assert.strictEqual(atlasStagingCheckModels(mode, staging, previous.models), staging);
  assert.strictEqual(atlasStagingCheckModels('delivery', staging, previous.models), previous.models);
  for (const model of added) for (const path of model.paths) assert.throws(() => resolveAtlasDeliveryModel(new URL(path, 'https://atlas.test'), previous.models));
  for (const model of previous.models) for (const path of model.paths) assert.equal(resolveAtlasDeliveryModel(new URL(`${path}?v=${model.sha256}`, 'https://atlas.test'), previous.models).sha256, model.sha256);
  assert.equal(JSON.stringify(previous), before);
  const original = previous.models[0];
  const replacement = { ...original, sha256: 'a'.repeat(64), bytes: 12 };
  const union = atlasStagingModels([original], [replacement]);
  assert.equal(union.length, 2, 'a later revision can stage without replacing the old object');
  assert.equal(resolveAtlasDeliveryModel(new URL(original.paths[0], 'https://atlas.test'), [original]).sha256, original.sha256);
  for (const bad of [
    { ...original, sha256: 'not-a-hash' }, { ...original, bytes: 0 }, { ...original, bytes: 32 * 1024 * 1024 + 1 },
    { ...original, paths: [] }, { ...original, paths: [original.paths[0], original.paths[0]] },
    ...['https://other.test/a.glb', '/atlas-runtime/head-neck/models/../scan.glb', '/private/case.dcm', `${original.paths[0]}?v=other`].map(path => ({ ...original, paths: [path] })),
  ]) assert.throws(() => atlasStagingModels([], [bad]));
  assert.throws(() => atlasStagingModels([], [original, original]));
  assert.throws(() => atlasStagingModels([original], [{ ...original, bytes: original.bytes + 4 }]));
});

test('all 14 added GLBs stage in real local R2 but remain unavailable through the active 80-model delivery', { timeout: 60_000 }, async () => {
  const staging = atlasStagingModels(previous.models, candidate.models);
  const transpile = (path: string) => ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const worker = `import {handleAtlasModel, AtlasModelError} from './atlas-model-storage.ts';
    import {handleAtlasDelivery} from './atlas-model-delivery.ts';
    export default { async fetch(request, env) {
      const url = new URL(request.url);
      const authorize = async () => { if (request.headers.get('x-test-role') !== 'admin') throw new AtlasModelError('Denied', 403); };
      const response = await (url.pathname.startsWith('/stage/')
        ? handleAtlasModel(request, url.pathname.slice(7), ${JSON.stringify(staging)}, env.FILES, authorize)
        : handleAtlasDelivery(request, ${JSON.stringify(previous.models)}, env.FILES, authorize));
      // Test transport only: consume an unused fixture body after the actual
      // handler decides. Keep full-size denial and all storage assertions.
      // https://github.com/cloudflare/workerd/issues/918
      if (request.body && !request.bodyUsed) await request.body.pipeTo(new WritableStream());
      return response;
    }};`;
  const mf = new Miniflare(convertV4MiniflareOptions({ modules: [
    { type: 'ESModule', path: resolve('tests/staging-registry-worker.mjs'), contents: worker },
    ...['storage', 'delivery'].map(name => ({ type: 'ESModule' as const, path: resolve(`tests/atlas-model-${name}.ts`), contents: transpile(`lib/atlas-model-${name}.ts`) })),
  ], compatibilityDate: '2026-08-23', r2Buckets: ['FILES'], log: new Log(LogLevel.NONE) }));
  try {
    const admin = { 'x-test-role': 'admin', origin: 'https://atlas.test', 'content-type': 'model/gltf-binary' };
    const existing = previous.models[0];
    const existingBytes = source('public' + existing.paths[0]);
    assert.equal((await mf.dispatchFetch(`https://atlas.test/stage/${existing.sha256}`, { method: 'PUT', headers: { ...admin, 'content-length': String(existingBytes.length) }, body: existingBytes })).status, 201);
    for (const model of added) {
      const bytes = source('public' + model.paths[0]);
      assert.equal(bytes.length, model.bytes); assert.equal(sha(bytes), model.sha256);
      const stageUrl = `https://atlas.test/stage/${model.sha256}`;
      const deliveryUrl = 'https://atlas.test' + model.paths[0];
      assert.equal((await mf.dispatchFetch(stageUrl, { method: 'PUT', headers: { ...admin, 'x-test-role': 'learner', 'content-length': String(bytes.length) }, body: bytes })).status, 403);
      assert.equal((await mf.dispatchFetch(stageUrl, { method: 'PUT', headers: { ...admin, 'content-length': String(bytes.length) }, body: bytes })).status, 201);
      const head = await mf.dispatchFetch(stageUrl, { method: 'HEAD', headers: admin });
      assert.equal(head.status, 200); assert.equal(head.headers.get('etag'), `"${model.sha256}"`);
      const download = await mf.dispatchFetch(stageUrl, { headers: admin });
      assert.equal(sha(new Uint8Array(await download.arrayBuffer())), model.sha256);
      const range = await mf.dispatchFetch(stageUrl, { headers: { ...admin, range: 'bytes=0-11' } });
      assert.equal(range.status, 206); assert.deepEqual(Buffer.from(await range.arrayBuffer()), bytes.subarray(0, 12));
      assert.equal((await mf.dispatchFetch(stageUrl, { headers: { ...admin, 'if-none-match': `"${model.sha256}"` } })).status, 304);
      for (const method of ['GET', 'HEAD']) {
        assert.equal((await mf.dispatchFetch(stageUrl, { method })).status, 403);
        assert.equal((await mf.dispatchFetch(deliveryUrl, { method, headers: admin })).status, 404, 'stored is not activated');
      }
    }
    const stillActive = await mf.dispatchFetch('https://atlas.test' + existing.paths[0], { headers: admin });
    assert.equal(stillActive.status, 200); assert.equal(stillActive.headers.get('x-atlas-delivery'), 'registered-storage-v1');
    assert.equal(sha(new Uint8Array(await stillActive.arrayBuffer())), existing.sha256);
    const bucket = await mf.getR2Bucket('FILES');
    assert.equal((await bucket.list()).objects.length, 15, 'only the fixture active model and exact 14 candidates were stored locally');
  } finally { await mf.dispose(); }
});
