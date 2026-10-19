import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { Miniflare, Log, LogLevel, convertV4MiniflareOptions } from 'miniflare';
import { candidateDigest, candidateObjectKey } from '../lib/clinical-review-candidate.ts';
import { handleCandidateAsset } from '../lib/clinical-review-candidate-delivery.ts';

const utf8 = text => new TextEncoder().encode(text);
const sha = data => createHash('sha256').update(data).digest('hex');

async function makeCandidate(label, html) {
  const contents = [
    ['index.html', html],
    ['viewer/index.html', `<html>${label} viewer</html>`],
    ['worksheet.json', JSON.stringify({ label })],
  ];
  const files = contents.map(([path, text]) => {
    const data = utf8(text);
    return { path, sha256: sha(data), bytes: data.byteLength,
      contentType: path.endsWith('.json') ? 'application/json' : 'text/html', storage: 'candidate' };
  });
  const material = {
    schema: 'visible-medicine.clinical-review-candidate/1', kind: 'root-body-inspection',
    label, createdAt: '2026-10-18T12:00:00.000Z', atlasRevision: 'a'.repeat(40),
    reviewRevision: 'b'.repeat(64), rendererRevision: 'c'.repeat(64), decisionMode: 'inspection-only',
    selections: [{ structureId: 'vm:anatomy:body:test', structureName: 'Test', region: 'whole-body',
      materialHash: 'd'.repeat(64), sourceHash: 'e'.repeat(64), teachingHash: 'f'.repeat(64) }], files,
  };
  return { candidate: { ...material, id: await candidateDigest(material) }, contents };
}

test('ephemeral workerd R2 preserves candidate-specific bytes and private range semantics', async () => {
  const mf = new Miniflare(convertV4MiniflareOptions({ modules: [
    { type: 'ESModule', path: resolve('tests/candidate-r2-fixture.mjs'),
      contents: 'export default { fetch() { return new Response("test"); } };' },
  ], compatibilityDate: '2026-08-23', r2Buckets: ['FILES'], log: new Log(LogLevel.NONE) }));
  try {
    const bucket = await mf.getR2Bucket('FILES');
    const old = await makeCandidate('Old', '<html>old</html>');
    const next = await makeCandidate('New', '<html>new</html>');
    for (const entry of [old, next]) for (const [path, text] of entry.contents) {
      const file = entry.candidate.files.find(item => item.path === path);
      await bucket.put(candidateObjectKey(file.sha256), utf8(text), { sha256: file.sha256 });
    }
    const registry = [old.candidate, next.candidate];
    let authorized = 0;
    const authorize = async () => { authorized++; };
    const request = new Request('https://review.example/index.html');
    const oldResponse = await handleCandidateAsset(request, old.candidate.id, 'index.html', registry, bucket, authorize);
    const newResponse = await handleCandidateAsset(request, next.candidate.id, 'index.html', registry, bucket, authorize);
    assert.equal(oldResponse.status, 200);
    assert.equal(newResponse.status, 200);
    assert.equal(await oldResponse.text(), '<html>old</html>');
    assert.equal(await newResponse.text(), '<html>new</html>');
    const partial = await handleCandidateAsset(new Request(request.url, { headers: { Range: 'bytes=0-5' } }),
      old.candidate.id, 'index.html', registry, bucket, authorize);
    assert.equal(partial.status, 206);
    assert.equal(await partial.text(), '<html>');
    const unchanged = await handleCandidateAsset(new Request(request.url, { headers: { 'If-None-Match': `"${old.candidate.files[0].sha256}"` } }),
      old.candidate.id, 'index.html', registry, bucket, authorize);
    assert.equal(unchanged.status, 304);
    assert.equal(authorized, 4);
    assert.equal(unchanged.headers.get('cache-control'), 'private, no-store');
    assert.equal((await bucket.head(candidateObjectKey(old.candidate.files[0].sha256)))?.size, old.candidate.files[0].bytes);
  } finally {
    await mf.dispose();
  }
});
