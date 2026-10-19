import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { link, mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { localHeadAtlasPlugin } from '../scripts/local-head-atlas-plugin.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fixture = Buffer.from([1, 2, 3, 4]);
let root;
let expectedHash;
let server;
let base;

function manifest(assetHash = sha(fixture)) {
  return {
    schema_version: 'visible-medicine.head-browser/1', version: '1.0.2',
    byte_order: 'little', source_studies_are_distinct: true,
    studies: {
      CT: { image: { file: 'ct/image.raw', sha256: assetHash }, entries: [] },
      MRI: { image: { file: 'mri/image.raw', sha256: assetHash }, entries: [] },
    },
  };
}
async function saveManifest(value) {
  const bytes = Buffer.from(JSON.stringify(value));
  await writeFile(path.join(root, 'manifest.json'), bytes);
  return sha(bytes);
}
async function start(plugin) {
  let middleware;
  const vite = { middlewares: { use(fn) { middleware = fn; } }, httpServer: undefined };
  plugin.configureServer(vite);
  const http = createServer((req, res) => {
    if (!middleware) { res.statusCode = 404; return res.end(); }
    middleware(req, res, () => { res.statusCode = 404; res.end(); });
  });
  vite.httpServer = http;
  await new Promise(resolve => http.listen(0, '127.0.0.1', resolve));
  return { http, url: `http://127.0.0.1:${http.address().port}` };
}
async function request(route, options = {}) {
  return fetch(`${base}${route}`, {
    headers: { 'X-Visible-Medicine-Local': '1', ...options.headers },
    method: options.method ?? 'GET',
  });
}
const assetRoute = '/__vm-local-head/asset?path=ct%2Fimage.raw';

before(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'vm-local-head-test-'));
  await mkdir(path.join(root, 'ct'));
  await mkdir(path.join(root, 'mri'));
  await writeFile(path.join(root, 'ct', 'image.raw'), fixture);
  await writeFile(path.join(root, 'mri', 'image.raw'), fixture);
  expectedHash = await saveManifest(manifest());
  ({ http: server, url: base } = await start(localHeadAtlasPlugin({ root, expectedHash })));
});
after(async () => {
  await new Promise(resolve => server?.close(resolve));
  if (root) await rm(root, { recursive: true, force: true });
});

test('disabled plugin installs no transport', async () => {
  const disabled = await start(localHeadAtlasPlugin({ expectedHash }));
  try {
    const response = await fetch(`${disabled.url}/__vm-local-head/manifest.json`);
    assert.equal(response.status, 404);
  } finally { await new Promise(resolve => disabled.http.close(resolve)); }
});

test('forces loopback Vite binding and refuses public host', () => {
  const plugin = localHeadAtlasPlugin({ root, expectedHash });
  assert.deepEqual(plugin.config({}), { server: { host: '127.0.0.1' } });
  assert.throws(() => plugin.config({ server: { host: '0.0.0.0' } }), /loopback/);
  assert.throws(() => plugin.config({ server: { host: true } }), /loopback/);
});

test('serves only pinned manifest and listed checked asset', async () => {
  const m = await request('/__vm-local-head/manifest.json');
  assert.equal(m.status, 200);
  assert.equal(m.headers.get('x-visible-medicine-local'), '1');
  assert.equal(m.headers.get('cache-control'), 'no-store');
  assert.equal(m.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(sha(Buffer.from(await m.arrayBuffer())), expectedHash);
  const a = await request(assetRoute);
  assert.equal(a.status, 200);
  assert.equal(a.headers.get('x-visible-medicine-local'), '1');
  assert.deepEqual(Buffer.from(await a.arrayBuffer()), fixture);
});

test('rejects missing client header, wrong method, origin and fetch site', async () => {
  const route = '/__vm-local-head/manifest.json';
  assert.equal((await fetch(`${base}${route}`)).status, 403);
  assert.equal((await request(route, { method: 'POST' })).status, 405);
  assert.equal((await request(route, { headers: { Origin: 'http://example.test' } })).status, 403);
  assert.equal((await request(route, { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
  assert.equal((await request(route, { headers: { 'Sec-Fetch-Site': 'none' } })).status, 403);
});

test('rejects traversal, encoded tricks and unlisted files', async () => {
  await writeFile(path.join(root, 'secret.txt'), 'synthetic');
  for (const query of ['..%2Fsecret.txt', '%252e%252e%252Fsecret.txt', 'secret.txt', 'ct%5Cimage.raw', 'ct%2Fimage.raw&path=secret.txt']) {
    assert.equal((await request(`/__vm-local-head/asset?path=${query}`)).status, 404, query);
  }
});

test('rejects changed manifest and wrong asset checksum', async () => {
  await saveManifest(manifest('0'.repeat(64)));
  assert.equal((await request(assetRoute)).status, 404);
  await saveManifest(manifest());
  await writeFile(path.join(root, 'ct', 'image.raw'), Buffer.from([9, 9, 9]));
  assert.equal((await request(assetRoute)).status, 404);
  await writeFile(path.join(root, 'ct', 'image.raw'), fixture);
});

test('rejects linked assets', async t => {
  const linked = path.join(root, 'ct', 'linked.raw');
  try { await symlink(path.join(root, 'ct', 'image.raw'), linked); }
  catch (error) { if (error.code === 'EPERM') return t.skip('symlink privilege unavailable'); throw error; }
  const old = manifest();
  old.studies.CT.image.file = 'ct/linked.raw';
  const linkHash = await saveManifest(old);
  const alternate = await start(localHeadAtlasPlugin({ root, expectedHash: linkHash }));
  try {
    assert.equal((await fetch(`${alternate.url}/__vm-local-head/asset?path=ct%2Flinked.raw`, { headers: { 'X-Visible-Medicine-Local': '1' } })).status, 404);
  } finally { await new Promise(resolve => alternate.http.close(resolve)); await saveManifest(manifest()); }
});

test('rejects hardlinked asset', async () => {
  const linked = path.join(root, 'ct', 'hardlinked.raw');
  await link(path.join(root, 'ct', 'image.raw'), linked);
  const old = manifest();
  old.studies.CT.image.file = 'ct/hardlinked.raw';
  const linkHash = await saveManifest(old);
  const alternate = await start(localHeadAtlasPlugin({ root, expectedHash: linkHash }));
  try {
    assert.equal((await fetch(`${alternate.url}/__vm-local-head/asset?path=ct%2Fhardlinked.raw`, { headers: { 'X-Visible-Medicine-Local': '1' } })).status, 404);
  } finally { await new Promise(resolve => alternate.http.close(resolve)); await saveManifest(manifest()); }
});

test('rejects invalid root', async () => {
  const invalid = await start(localHeadAtlasPlugin({ root: path.join(root, 'ct', 'image.raw'), expectedHash }));
  try { assert.equal((await fetch(`${invalid.url}/__vm-local-head/manifest.json`, { headers: { 'X-Visible-Medicine-Local': '1' } })).status, 404); }
  finally { await new Promise(resolve => invalid.http.close(resolve)); }
});
