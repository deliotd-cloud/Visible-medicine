import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import { Miniflare, Log, LogLevel, convertV4MiniflareOptions } from 'miniflare';
import { modelByteRange } from '../lib/atlas-model-storage.ts';

test('registered inventory matches every module file and preserves existing delivery', () => {
  execFileSync(process.execPath, ['scripts/atlas-model-inventory.mjs', '--check']);
  const inventory = JSON.parse(readFileSync('lib/atlas-model-inventory.json', 'utf8'));
  assert.equal(inventory.learnerDelivery, 'existing-static-assets');
  assert.equal(inventory.models.length, 94);
  assert.equal(inventory.sources.reduce((sum: number, item: { modelPaths: number }) => sum + item.modelPaths, 0), 100);
});

test('single byte ranges reject ambiguity and never escape the registered size', () => {
  assert.deepEqual(modelByteRange('bytes=2-4', 10), { offset: 2, length: 3 });
  assert.deepEqual(modelByteRange('bytes=8-', 10), { offset: 8, length: 2 });
  assert.deepEqual(modelByteRange('bytes=-20', 10), { offset: 0, length: 10 });
  for (const value of ['bytes=-0', 'bytes=-', 'bytes=10-', 'bytes=4-2', 'bytes=0-1,4-5', 'bytes=9007199254740993-', 'items=0-3']) assert.throws(() => modelByteRange(value, 10));
});

test('actual Workers R2 streams, checksums, immutable writes and protected ranges', { timeout: 60_000 }, async () => {
  const bytes = readFileSync('public/atlas-runtime/shoulder/models/bodyparts3d/shoulder-right.glb');
  const sha = createHash('sha256').update(bytes).digest('hex');
  const inventory = JSON.parse(readFileSync('lib/atlas-model-inventory.json', 'utf8'));
  const largest = [...inventory.models].sort((a, b) => b.bytes - a.bytes)[0];
  const source = ts.transpileModule(readFileSync('lib/atlas-model-storage.ts', 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  // Test-only authorization fixture. Production always uses dispatch identity
  // and the database role check; no test header is imported into production.
  const worker = `import {handleAtlasModel, AtlasModelError} from './atlas-storage.mjs';\nexport default { async fetch(request, env) {
    const url = new URL(request.url);
    const authorize = async () => { if(request.headers.get('x-test-role') !== 'admin') throw new AtlasModelError('Denied', 403); };
    if (url.searchParams.has('fixture-length')) {
      const headers = new Headers(request.headers);
      headers.set('content-length', '${bytes.length}');
      request = new Request(request, { headers });
    }
    const response = await handleAtlasModel(request, url.pathname.slice(1), [{sha256:'${sha}',bytes:${bytes.length},paths:['fixture.glb']}, ${JSON.stringify(largest)}], env.FILES, authorize);
    // Test transport only: workerd can reset an unread large PUT after an early
    // response. Keep the full request and real handler/auth/result unchanged.
    // https://github.com/cloudflare/workerd/issues/918
    if (request.body && !request.bodyUsed) await request.body.pipeTo(new WritableStream());
    return response;
  }};`;
  const mf = new Miniflare(convertV4MiniflareOptions({ modules: [
    { type: 'ESModule', path: resolve('tests/atlas-storage-worker.mjs'), contents: worker },
    { type: 'ESModule', path: resolve('tests/atlas-storage.mjs'), contents: source },
  ], compatibilityDate: '2026-08-23', r2Buckets: ['FILES'], log: new Log(LogLevel.NONE) }));
  try {
    const url = `https://atlas.test/${sha}`;
    const headers = { 'x-test-role': 'admin', origin: 'https://atlas.test', 'content-type': 'model/gltf-binary' };
    const request = (method: string, extra: Record<string, string> = {}, body?: Uint8Array) => mf.dispatchFetch(url, { method, headers: { ...headers, ...(body ? { 'content-length': String(body.byteLength) } : {}), ...extra }, ...(body ? { body } : {}) });
    for (const method of ['HEAD', 'GET', 'PUT']) assert.equal((await request(method, { 'x-test-role': 'learner' }, method === 'PUT' ? bytes : undefined)).status, 403);
    assert.equal((await request('HEAD')).status, 404);
    assert.equal((await request('PUT', { origin: 'https://evil.test' }, bytes)).status, 403);
    assert.equal((await request('PUT', { origin: '' }, bytes)).status, 403);
    assert.equal((await request('PUT', { 'sec-fetch-site': 'cross-site' }, bytes)).status, 403);
    assert.equal((await request('PUT', { 'content-length': '' }, bytes)).status, 411);
    assert.equal((await request('PUT', { 'content-type': 'application/dicom' }, bytes)).status, 415);
    assert.equal((await request('PUT', { 'content-encoding': 'gzip' }, bytes)).status, 415);
    assert.equal((await request('PUT', { 'content-range': 'bytes 0-20/100' }, bytes)).status, 415);
    assert.equal((await mf.dispatchFetch('https://atlas.test/unregistered', { method: 'PUT', headers, body: bytes })).status, 404);
    const damaged = new Uint8Array(bytes); damaged[damaged.length - 1] ^= 1;
    assert.equal((await request('PUT', {}, damaged)).status, 422);
    assert.equal((await request('HEAD')).status, 404, 'bad checksum never creates an object');
    assert.equal((await request('PUT', {}, bytes.subarray(0, 40))).status, 413);
    for (const wrongLength of [bytes.subarray(0, 40), Buffer.concat([bytes, Buffer.from([0])])]) {
      const result = await mf.dispatchFetch(`${url}?fixture-length`, { method: 'PUT', headers: { ...headers, 'content-length': String(wrongLength.length) }, body: wrongLength });
      assert.equal(result.status, 422, 'actual stream bounds, independent of stated length');
      assert.equal((await request('HEAD')).status, 404);
    }
    const bucket = await mf.getR2Bucket('FILES');
    assert.equal((await bucket.list()).objects.length, 0, 'denied and invalid full-body uploads never store anything');
    const competing = await Promise.all([request('PUT', {}, bytes), request('PUT', {}, bytes)]);
    assert.deepEqual(competing.map(response => response.status).sort(), [200, 201], 'concurrent writers settle without overwrite or deadlock');
    const before = await bucket.head(`atlas-models/v1/${sha}.glb`);
    assert.ok(before);
    assert.equal((await request('PUT', {}, bytes)).status, 200);
    assert.equal((await bucket.head(`atlas-models/v1/${sha}.glb`))?.version, before.version, 'idempotent upload does not rewrite');
    const head = await request('HEAD');
    assert.equal(head.status, 200); assert.equal(head.headers.get('content-length'), String(bytes.length));
    assert.equal(head.headers.get('etag'), `"${sha}"`);
    const full = await request('GET');
    assert.deepEqual(Buffer.from(await full.arrayBuffer()), bytes);
    assert.equal(full.headers.get('cache-control'), 'private, no-store');
    for (const range of ['bytes=0-11', 'bytes=10-', 'bytes=-32']) {
      const response = await request('GET', { range });
      const expected = modelByteRange(range, bytes.length);
      assert.equal(response.status, 206);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes.subarray(expected.offset, expected.offset + expected.length));
    }
    const invalid = await request('GET', { range: `bytes=${bytes.length}-` });
    assert.equal(invalid.status, 416); assert.equal(invalid.headers.get('content-range'), `bytes */${bytes.length}`);
    assert.equal((await request('GET', { 'if-none-match': `W/"${sha}"` })).status, 304);
    assert.equal((await request('GET', { 'if-none-match': `"${sha}"`, 'x-test-role': 'learner' })).status, 403);
    assert.equal((await request('GET', { range: 'bytes=0-11', 'if-range': '"stale"' })).status, 200);
    assert.equal((await request('DELETE')).status, 405);
    const largestBytes = readFileSync(`public${largest.paths[0]}`);
    const largestUrl = `https://atlas.test/${largest.sha256}`;
    const largeUpload = await mf.dispatchFetch(largestUrl, { method: 'PUT', headers: { ...headers, 'content-length': String(largestBytes.length) }, body: largestBytes });
    assert.equal(largeUpload.status, 201, 'largest current model streams successfully');
    const largeDownload = await mf.dispatchFetch(largestUrl, { headers });
    assert.equal(createHash('sha256').update(Buffer.from(await largeDownload.arrayBuffer())).digest('hex'), largest.sha256);
    // The local test deliberately corrupts storage directly; the public route
    // has no such capability and must neither serve nor overwrite corruption.
    await bucket.put(`atlas-models/v1/${sha}.glb`, damaged);
    assert.equal((await request('GET')).status, 409);
    assert.equal((await request('PUT', {}, bytes)).status, 409);
  } finally { await mf.dispose(); }
});
