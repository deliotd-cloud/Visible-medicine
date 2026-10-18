import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { contentSecurityPolicy } from '../lib/content-security-policy.ts';

const previous = "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss:; worker-src 'self' blob:";

test('only the four exact anatomy documents allow the bundled WebAssembly decoder', () => {
  for (const name of ['shoulder', 'female-pelvis', 'lower-limb', 'head-neck']) {
    const policy = contentSecurityPolicy(`/atlas-runtime/${name}/index.html`);
    assert.equal(policy.replace(" 'wasm-unsafe-eval'", ''), previous);
    assert.equal((policy.match(/'wasm-unsafe-eval'/g) ?? []).length, 1);
    assert.ok(!policy.includes("'unsafe-eval'"));
  }
});
test('home, learner, staff, API, assets and lookalike paths retain the exact existing policy', () => {
  for (const path of ['/', '/atlas/head-neck-3d', '/learn', '/studio', '/api/app', '/splash-preview',
    '/atlas-runtime/unknown/index.html', '/atlas-runtime/head-neck/', '/atlas-runtime/head-neck/index.html/more',
    '/atlas-runtime/head-neck/INDEX.HTML', '/atlas-runtime/head-neck/models/source.glb',
    '/atlas-runtime/%68ead-neck/index.html', '//atlas-runtime/head-neck/index.html',
    '/atlas-runtime/head-neck/index.html?unparsed=1']) assert.equal(contentSecurityPolicy(path), previous);
});
test('the production Worker applies the scoped policy to the parsed pathname and keeps streaming', async () => {
  const worker = await readFile(new URL('../worker/index.ts', import.meta.url), 'utf8');
  assert.ok(worker.includes('headers.set("Content-Security-Policy", contentSecurityPolicy(url.pathname))'));
  assert.ok(worker.includes('return new Response(response.body,'));
  assert.ok(worker.includes('if (response.status === 101) return response;'));
});
