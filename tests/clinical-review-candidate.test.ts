import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import {
  candidateDigest, candidateObjectKey, safeCandidatePath, validateCandidate,
  type ClinicalReviewCandidate,
} from '../lib/clinical-review-candidate.ts';
import { handleCandidateAsset } from '../lib/clinical-review-candidate-delivery.ts';
import { atlasModelKey } from '../lib/atlas-model-storage.ts';

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const bytes = (text: string) => new TextEncoder().encode(text);
const payloads = new Map<string, Uint8Array>();

async function candidate(label: string, html: string): Promise<ClinicalReviewCandidate> {
  const viewer = `<html>${label} viewer</html>`;
  const worksheet = JSON.stringify({ label });
  const entries = [
    ['index.html', html], ['viewer/index.html', viewer], ['worksheet.json', worksheet],
    ['models/head-neck/models/shape.glb', `glTF ${label}`],
  ] as const;
  const files = entries.map(([path, content]) => {
    const sha256 = hash(content);
    payloads.set(path.endsWith('.glb') ? atlasModelKey(sha256) : candidateObjectKey(sha256), bytes(content));
    return { path, sha256, bytes: bytes(content).byteLength,
      contentType: path.endsWith('.glb') ? 'model/gltf-binary' : path.endsWith('.json') ? 'application/json' : 'text/html',
      storage: path.endsWith('.glb') ? 'atlas-model' : 'candidate' } as const;
  });
  const material = {
    schema: 'visible-medicine.clinical-review-candidate/1' as const,
    kind: 'root-body-inspection' as const,
    label, createdAt: '2026-10-18T12:00:00.000Z', atlasRevision: 'a'.repeat(40),
    reviewRevision: 'b'.repeat(64), rendererRevision: 'c'.repeat(64),
    decisionMode: 'inspection-only' as const,
    selections: [{ structureId: 'vm:anatomy:body:test', structureName: 'Test', region: 'whole-body',
      materialHash: 'd'.repeat(64), sourceHash: 'e'.repeat(64), teachingHash: 'f'.repeat(64) }],
    files,
  };
  return { ...material, id: await candidateDigest(material) };
}

function bucket(overrides: { key?: string; size?: number; sha256?: string } = {}) {
  const calls: string[] = [];
  const object = (key: string, data: Uint8Array, content = data) => ({
    key: overrides.key ?? key, size: overrides.size ?? data.byteLength,
    checksums: { sha256: Uint8Array.from(Buffer.from(overrides.sha256 ?? createHash('sha256').update(data).digest('hex'), 'hex')).buffer },
    body: new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(content); controller.close(); } }),
  });
  const api = {
    async head(key: string) { calls.push(`head:${key}`); const data = payloads.get(key); return data ? object(key, data) : null; },
    async get(key: string, options?: { range?: {offset: number;length: number} }) {
      calls.push(`get:${key}`); const data = payloads.get(key);
      if (!data) return null;
      const range = options?.range;
      return object(key, data, range ? data.slice(range.offset, range.offset + range.length) : data);
    },
  };
  return { api: api as unknown as Pick<R2Bucket, 'head' | 'get'>, calls };
}

test('old and new candidates retain separate content under the same path', async () => {
  const old = await candidate('Old', '<html>old</html>');
  const next = await candidate('New', '<html>new</html>');
  const store = bucket();
  let authorizations = 0;
  const authorize = async () => { authorizations++; };
  const request = new Request('https://review.example/candidates/index.html');
  const older = await handleCandidateAsset(request, old.id, 'index.html', [old,next], store.api, authorize);
  const newer = await handleCandidateAsset(request, next.id, 'index.html', [old,next], store.api, authorize);
  assert.equal(await older.text(), '<html>old</html>');
  assert.equal(await newer.text(), '<html>new</html>');
  assert.equal(authorizations, 2);
  assert.equal(older.headers.get('cache-control'), 'private, no-store');
});

test('mutation, duplicate and traversal are rejected even with a recomputed ID', async () => {
  const original = await candidate('Base', '<html>base</html>');
  await assert.rejects(validateCandidate({ ...original, label: 'Changed' }), /digest/);
  await assert.rejects(validateCandidate({ ...original, unexpected: true }), /fields/);
  const duplicate = { ...original, files: [...original.files, original.files[0]] };
  const { id: discardedDuplicate, ...duplicateMaterial } = duplicate;
  await assert.rejects(validateCandidate({ ...duplicate, id: await candidateDigest(duplicateMaterial) }), /entrypoints/);
  const traversal = { ...original, files: original.files.map(file => file.path === 'index.html' ? { ...file, path: 'viewer/../index.html' } : file) };
  const { id: discardedTraversal, ...traversalMaterial } = traversal;
  await assert.rejects(validateCandidate({ ...traversal, id: await candidateDigest(traversalMaterial) }), /files/);
  const selection = { ...original, selections: [...original.selections, original.selections[0]] };
  const { id: discardedSelection, ...selectionMaterial } = selection;
  await assert.rejects(validateCandidate({ ...selection, id: await candidateDigest(selectionMaterial) }), /selections/);
});

test('MIME allowlist rejects null and unknown extensions; safe multi-dot files and Markdown work', async () => {
  const original = await candidate('Files', '<html>files</html>');
  const fixture = (path: string, contentType: unknown) => ({
    ...original, files: [...original.files, {
      path, sha256: 'a'.repeat(64), bytes: 5, contentType, storage: 'candidate' as const,
    }],
  });
  for (const contentType of [null, 'application/octet-stream']) {
    const value = fixture('assets/evil.bin', contentType);
    const { id: ignored, ...material } = value;
    await assert.rejects(validateCandidate({ ...value, id: await candidateDigest(material as Omit<ClinicalReviewCandidate,'id'>) }), /type or storage/);
  }
  assert.equal(safeCandidatePath('assets/specimen-data.ts.txt'), true);
  assert.equal(safeCandidatePath('viewer/assets/notes.md'), true);
  const textFile = fixture('assets/specimen-data.ts.txt', 'text/plain');
  const withMarkdown = { ...textFile, files: [...textFile.files, {
    path: 'viewer/assets/notes.md', sha256: 'b'.repeat(64), bytes: 5,
    contentType: 'text/plain', storage: 'candidate' as const,
  }] };
  const { id: ignored, ...material } = withMarkdown;
  await validateCandidate({ ...withMarkdown, id: await candidateDigest(material as Omit<ClinicalReviewCandidate,'id'>) });
  await assert.rejects(validateCandidate({ ...original, id: 17 }), /identity/);
});

test('authorization precedes unknown, conditional and HEAD reads', async () => {
  const old = await candidate('Private', '<html>private</html>');
  const store = bucket();
  let authorized = false;
  const deny = async () => { throw { status: 403 }; };
  const unknown = await handleCandidateAsset(new Request('https://review.example/nope'), old.id, 'missing.html', [old], store.api, deny);
  assert.equal(unknown.status, 403);
  assert.equal(store.calls.length, 0);
  const authorize = async () => { authorized = true; };
  const head = await handleCandidateAsset(new Request('https://review.example/index.html', { method: 'HEAD' }), old.id, 'index.html', [old], store.api, authorize);
  assert.equal(head.status, 200);
  assert.equal(head.body, null);
  assert.equal(authorized, true);
  authorized = false;
  const conditional = await handleCandidateAsset(new Request('https://review.example/index.html', { headers: { 'If-None-Match': `"${old.files[0].sha256}"` } }), old.id, 'index.html', [old], store.api, authorize);
  assert.equal(conditional.status, 304);
  assert.equal(authorized, true);
  assert.equal(store.calls.filter(call => call.startsWith('get:')).length, 0);
});

test('wrong object key, size or checksum fail closed; ranges do not switch candidates', async () => {
  const old = await candidate('Bytes', '<html>bytes</html>');
  for (const override of [{ key: 'wrong' }, { size: 999 }, { sha256: '0'.repeat(64) }]) {
    const result = await handleCandidateAsset(new Request('https://review.example/index.html'), old.id, 'index.html', [old], bucket(override).api, async () => {});
    assert.equal(result.status, 503);
  }
  const result = await handleCandidateAsset(new Request('https://review.example/index.html', { headers: { Range: 'bytes=0-5' } }), old.id, 'index.html', [old], bucket().api, async () => {});
  assert.equal(result.status, 206);
  assert.equal(await result.text(), '<html>');
  const absent = await handleCandidateAsset(new Request('https://review.example/index.html'), '0'.repeat(64), 'index.html', [old], bucket().api, async () => {});
  assert.equal(absent.status, 404);
});
