import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { verifyAtlasModelDownload } from '../lib/atlas-model-download.ts';
const bytes = readFileSync('public/atlas-runtime/shoulder/models/bodyparts3d/shoulder-right.glb');
const model = { sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length };
const headers = { 'content-type': 'model/gltf-binary', 'content-length': String(bytes.length), etag: `"${model.sha256}"` };

test('download checker hashes the full actual model rather than trusting headers', async () => {
  assert.deepEqual(await verifyAtlasModelDownload(new Response(bytes, { headers }), model), model);
  const corrupted = Buffer.from(bytes); corrupted[corrupted.length - 1] ^= 1;
  await assert.rejects(() => verifyAtlasModelDownload(new Response(corrupted, { headers }), model), /fingerprint/);
});
test('download checker rejects wrong metadata, partial replies and invalid registered limits', async () => {
  for (const patch of [{ etag: '"wrong"' }, { 'content-type': 'text/html' }, { 'content-length': '0' }, { 'content-length': '' }]) {
    await assert.rejects(() => verifyAtlasModelDownload(new Response(bytes, { headers: { ...headers, ...patch } }), model));
  }
  for (const status of [206, 401, 403, 404, 500]) await assert.rejects(() => verifyAtlasModelDownload(new Response(bytes, { headers, status }), model));
  for (const size of [0, -1, NaN, Infinity, 1.1, 33 * 1024 * 1024]) await assert.rejects(() => verifyAtlasModelDownload(new Response(bytes, { headers }), { ...model, bytes: size }));
});
test('actual stream limits reject truncation, oversize and invalid GLB headers', async () => {
  await assert.rejects(() => verifyAtlasModelDownload(new Response(bytes.subarray(0, 13), { headers }), model), /incomplete/);
  await assert.rejects(() => verifyAtlasModelDownload(new Response(Buffer.concat([bytes, Buffer.from([0])]), { headers }), model), /exceeds/);
  for (const offset of [0, 4, 8]) {
    const invalid = Buffer.from(bytes); invalid[offset] ^= 1;
    await assert.rejects(() => verifyAtlasModelDownload(new Response(invalid, { headers }), model), /GLB header/);
  }
});
test('proxy streaming metadata never substitutes for actual bytes and SHA-256', async () => {
  const variants: Record<string, string>[] = [
    { 'content-type': 'model/gltf-binary' },
    { 'content-type': 'application/octet-stream', etag: `W/"${model.sha256}"` },
  ];
  for (const metadata of variants) {
    assert.deepEqual(await verifyAtlasModelDownload(new Response(bytes, { headers: metadata }), model), model);
    await assert.rejects(() => verifyAtlasModelDownload(new Response(bytes.subarray(0, 13), { headers: metadata }), model), /incomplete/);
    await assert.rejects(() => verifyAtlasModelDownload(new Response(Buffer.concat([bytes, Buffer.from([0])]), { headers: metadata }), model), /exceeds/);
    const corrupted = Buffer.from(bytes); corrupted[corrupted.length - 1] ^= 1;
    await assert.rejects(() => verifyAtlasModelDownload(new Response(corrupted, { headers: metadata }), model), /fingerprint/);
  }
});
test('cancellation before and during a stalled stream terminates verification', async () => {
  const before = new AbortController(); before.abort();
  await assert.rejects(() => verifyAtlasModelDownload(new Response(bytes, { headers }), model, before.signal), /cancelled/);
  const active = new AbortController(); let cancelled = false;
  const response = new Response(new ReadableStream({ start(controller) { controller.enqueue(bytes.subarray(0, 12)); }, cancel() { cancelled = true; } }), { headers });
  const result = verifyAtlasModelDownload(response, model, active.signal);
  active.abort();
  await assert.rejects(result, /cancelled/); assert.equal(cancelled, true);
});
