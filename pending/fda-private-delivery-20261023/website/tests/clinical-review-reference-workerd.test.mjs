import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { Miniflare, Log, LogLevel, convertV4MiniflareOptions } from 'miniflare';

const website = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageRoot = resolve(website, '..', 'local-package');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const registry = JSON.parse(await readFile(resolve(packageRoot, 'registry.json'), 'utf8'));
const installed = JSON.parse(await readFile(resolve(website, 'lib/clinical-review-reference-assets.json'), 'utf8'));
const prepared = JSON.parse(await readFile(resolve(packageRoot, 'PREPARED.json'), 'utf8'));
const staged = JSON.parse(await readFile(resolve(packageRoot, 'LOCAL_STAGING.json'), 'utf8'));
const reference = registry.references[0];
const files = reference.files;
const objectKey = file => `atlas-review-references/v1/${file.sha256}`;
const url = file => `http://127.0.0.1:8787/api/atlas-delivery/references/${reference.id}/${reference.revision}/${file.path}`;
const bytesByHash = new Map();

// This Worker exists only inside the ephemeral emulator. The role selector is
// removed before either production function sees the Request. It is not an
// application authentication mechanism and cannot demonstrate signed-in routing.
const fixtureWorker = `
import { handlePrivateReferenceDelivery } from './lib/clinical-review-reference-delivery.ts';
import { clinicalReviewPrincipal } from './lib/clinical-review-access.ts';
import registry from './lib/clinical-review-reference-assets.json';
export default { async fetch(request, env) {
  const role = request.headers.get('x-fixture-role') ?? 'admin';
  const headers = new Headers(request.headers);
  headers.delete('x-fixture-role');
  const clean = new Request(request, { headers });
  const db = { withSession() { return { prepare() { return { bind() { return {
    async first() {
      if (role === 'admin') return { roles: 'administrator', organization_id: 'test-org', role: 'owner' };
      if (role === 'staff') return { roles: 'staff', organization_id: 'test-org', role: 'administrator' };
      return null;
    },
  }; } }; } }; } };
  const authorize = async () => {
    if (role !== 'admin' && role !== 'staff' && role !== 'inactive' && role !== 'none')
      throw { status: 403 };
    await clinicalReviewPrincipal(db, role === 'none' ? null : 'fixture-subject');
  };
  return handlePrivateReferenceDelivery(clean, registry, env.FILES, authorize);
} };
`;

async function dispatch(mf, target, { method = 'GET', headers = {}, role = 'admin' } = {}) {
  return mf.dispatchFetch(target, { method, headers: { 'Accept-Encoding': 'identity', ...headers, 'x-fixture-role': role } });
}

test('real workerd/R2 serves the exact local-only catalogue and GLB', async t => {
  assert.deepEqual(installed, registry);
  assert.equal(registry.schema, 'visible-medicine.private-reference-assets/1');
  assert.equal(registry.references.length, 1);
  assert.equal(reference.deployment, 'local-only');
  assert.equal(reference.clinicalApproval, false);
  assert.equal(prepared.localOnly, true);
  assert.equal(prepared.objectUpload, false);
  assert.equal(staged.localOnly, true);
  assert.equal(staged.remoteWrite, false);
  assert.deepEqual(prepared.objects.map(o => ({ path: o.path, sha256: o.sha256, bytes: o.bytes })),
    files.map(f => ({ path: f.path, sha256: f.sha256, bytes: f.bytes })));
  for (const file of files) {
    const data = await readFile(resolve(packageRoot, 'objects', file.sha256));
    assert.equal(data.length, file.bytes);
    assert.equal(sha(data), file.sha256);
    bytesByHash.set(file.sha256, data);
  }
  const catalogue = JSON.parse(bytesByHash.get(files[0].sha256).toString('utf8'));
  const glb = bytesByHash.get(files[1].sha256);
  assert.equal(glb.toString('ascii', 0, 4), 'glTF');
  assert.equal(glb.readUInt32LE(4), 2);
  assert.equal(glb.readUInt32LE(8), glb.length);
  assert.equal(reference.atlasRevision, prepared.atlasRevision);
  assert.equal(catalogue.source.commit, reference.sourceCommit);
  assert.equal(catalogue.source.file, 'Male-Shoulder.inp');
  assert.equal(catalogue.bundle.sha256, files[1].sha256);
  assert.equal(catalogue.bundle.bytes, files[1].bytes);

  const bundled = await build({
    stdin: { contents: fixtureWorker, resolveDir: website, sourcefile: 'reference-runtime-fixture.ts', loader: 'ts' },
    bundle: true, write: false, platform: 'browser', format: 'esm', target: 'es2022',
    logLevel: 'silent',
  });
  const mf = new Miniflare(convertV4MiniflareOptions({
    modules: [{ type: 'ESModule', path: resolve(website, 'tests/reference-runtime-fixture.mjs'),
      contents: bundled.outputFiles[0].text }],
    compatibilityDate: '2026-08-23', r2Buckets: ['FILES'], log: new Log(LogLevel.NONE),
  }));
  try {
    const bucket = await mf.getR2Bucket('FILES');
    for (const file of files) {
      const data = bytesByHash.get(file.sha256);
      const inserted = await bucket.put(objectKey(file), data,
        { sha256: file.sha256, onlyIf: { etagDoesNotMatch: '*' } });
      assert.ok(inserted, `first immutable write succeeded: ${file.path}`);
      const object = await bucket.head(objectKey(file));
      assert.equal(object?.size, file.bytes);
      assert.equal(Buffer.from(object.checksums.sha256).toString('hex'), file.sha256);
      const refused = await bucket.put(objectKey(file), new TextEncoder().encode('overwrite attempt'),
        { sha256: sha(new TextEncoder().encode('overwrite attempt')), onlyIf: { etagDoesNotMatch: '*' } });
      assert.equal(refused, null, `immutable write refused: ${file.path}`);
      assert.equal((await bucket.head(objectKey(file)))?.size, file.bytes);
    }

    await t.test('GET reads actual full streams, HEAD has no body', async () => {
      for (const file of files) {
        const response = await dispatch(mf, url(file));
        assert.equal(response.status, 200, file.path);
        assert.equal(response.headers.get('content-type'), file.contentType);
        assert.equal(response.headers.get('content-length'), String(file.bytes), JSON.stringify(Object.fromEntries(response.headers)));
        assert.equal(response.headers.get('etag'), `"${file.sha256}"`);
        assert.equal(response.headers.get('cache-control'), 'private, no-store');
        assert.equal(response.headers.get('vary'), 'Cookie');
        assert.equal(response.headers.get('accept-ranges'), 'bytes');
        assert.equal(response.headers.get('cross-origin-resource-policy'), 'same-origin');
        assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
        const body = Buffer.from(await response.arrayBuffer());
        assert.equal(body.length, file.bytes);
        assert.equal(sha(body), file.sha256);
        assert.deepEqual(body, bytesByHash.get(file.sha256));
        const head = await dispatch(mf, url(file), { method: 'HEAD' });
        assert.equal(head.status, 200);
        assert.equal(head.body, null);
        assert.equal(head.headers.get('content-length'), String(file.bytes));
      }
    });

    await t.test('R2 range, ETag, 304 and invalid range preserve byte identity', async () => {
      for (const file of files) {
        const original = bytesByHash.get(file.sha256);
        for (const [range, expected] of [
          ['bytes=0-31', original.subarray(0, 32)],
          ['bytes=-29', original.subarray(-29)],
          [`bytes=${file.bytes - 19}-`, original.subarray(-19)],
        ]) {
          const response = await dispatch(mf, url(file), { headers: { Range: range } });
          assert.equal(response.status, 206, `${file.path} ${range}`);
          assert.equal(response.headers.get('content-length'), String(expected.length));
          assert.equal(response.headers.get('etag'), `"${file.sha256}"`);
          assert.deepEqual(Buffer.from(await response.arrayBuffer()), expected);
        }
        const unchanged = await dispatch(mf, url(file), { headers: { 'If-None-Match': `W/"${file.sha256}"` } });
        assert.equal(unchanged.status, 304);
        assert.equal(unchanged.body, null);
        const mismatch = await dispatch(mf, url(file), { headers: { Range: 'bytes=0-1', 'If-Range': '"foreign"' } });
        assert.equal(mismatch.status, 200);
        assert.equal(sha(Buffer.from(await mismatch.arrayBuffer())), file.sha256);
        const invalid = await dispatch(mf, url(file), { headers: { Range: 'bytes=0-1,3-4' } });
        assert.equal(invalid.status, 416);
        assert.equal(invalid.headers.get('content-range'), `bytes */${file.bytes}`);
      }
    });

    await t.test('unauthorized and foreign or raw references fail closed', async () => {
      for (const role of ['none', 'staff', 'inactive']) {
        const response = await dispatch(mf, url(files[0]), { role });
        assert.equal(response.status, role === 'none' ? 401 : 403);
      }
      for (const target of [
        url(files[0]).replace('127.0.0.1', 'example.test'),
        url(files[0]) + '?alias=1',
        url(files[1]).replace(reference.revision, '0'.repeat(64)),
        'http://127.0.0.1:8787/' + objectKey(files[1]),
        'http://127.0.0.1:8787/models/fda-shoulder-draft/reference.glb',
        url(files[1]).replace('/reference.glb', '/unknown.glb'),
      ]) assert.equal((await dispatch(mf, target)).status, 404, target);
      assert.equal((await dispatch(mf, url(files[0]), { method: 'POST' })).status, 405);
      assert.equal((await dispatch(mf, url(files[0]), { role: 'staff', headers: { 'If-None-Match': `"${files[0].sha256}"` } })).status, 403);
    });

    await t.test('stale R2 checksum is refused even for HEAD and conditional GET', async () => {
      const file = files[0];
      await bucket.put(objectKey(file), new TextEncoder().encode('stale object'),
        { sha256: sha(new TextEncoder().encode('stale object')) });
      for (const options of [{}, { method: 'HEAD' }, { headers: { 'If-None-Match': `"${file.sha256}"` } }])
        assert.equal((await dispatch(mf, url(file), options)).status, 503);
      await bucket.put(objectKey(file), bytesByHash.get(file.sha256), { sha256: file.sha256 });
      assert.equal((await dispatch(mf, url(file), { method: 'HEAD' })).status, 200);
    });
  } finally {
    await mf.dispose();
  }
});
