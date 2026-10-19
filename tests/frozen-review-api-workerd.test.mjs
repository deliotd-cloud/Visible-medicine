import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const { Miniflare, convertV4MiniflareOptions } = require('miniflare');
const root = fileURLToPath(new URL('../', import.meta.url));
const built = await build({ stdin: { contents: `
  export * from './lib/frozen-review-api.ts';
  export * from './lib/frozen-review-contract.ts';
  export * from './lib/clinical-review-candidate.ts';
  export { blankBodyReview } from './atlas-review/lib/body-review-decisions.ts';`,
  resolveDir: root, loader: 'ts' }, bundle: true, write: false, format: 'esm',
  platform: 'browser', logLevel: 'silent' });
const api = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
const migration = readFileSync(new URL('../drizzle/0010_keen_ultron.sql', import.meta.url), 'utf8');
const h = char => char.repeat(64);
const structureId = 'vm:anatomy:body:synthetic';
const principal = (account = 'a', institution = 'one') =>
  JSON.stringify(['vm-website-personal-review-1', `edu:${account}`, institution]);

async function candidate(label = 'Synthetic frozen review', personal = true) {
  const material = {
    schema: personal ? 'visible-medicine.clinical-review-candidate/2' : 'visible-medicine.clinical-review-candidate/1',
    kind: personal ? 'root-body-review' : 'root-body-inspection', label,
    createdAt: '2026-10-18T12:00:00.000Z', atlasRevision: 'a'.repeat(40),
    reviewRevision: h('b'), rendererRevision: h('c'),
    decisionMode: personal ? 'personal-review' : 'inspection-only',
    selections: [{ structureId, structureName: 'Synthetic structure', region: 'whole-body',
      materialHash: h('d'), sourceHash: h('e'), teachingHash: h('f'),
      ...(personal ? { review: { checklistVersion: 'frozen-1',
        checklists: { geometry: [{ id: 'shape', label: 'Check synthetic shape.' }],
          teaching: [{ id: 'text', label: 'Check synthetic text.' }],
          imaging: [{ id: 'scan', label: 'Check synthetic image.' }] },
        blockers: { geometry: [], teaching: [], imaging: [] }, teachingTabs: ['anatomy'] } } : {}) }],
    files: [
      { path: 'index.html', sha256: h('1'), bytes: 4, contentType: 'text/html', storage: 'candidate' },
      { path: 'viewer/index.html', sha256: h('2'), bytes: 4, contentType: 'text/html', storage: 'candidate' },
      { path: 'worksheet.json', sha256: h('3'), bytes: 4, contentType: 'application/json', storage: 'candidate' },
    ],
    ...(personal ? { supersedes: null } : {}),
  };
  return { ...material, id: await api.candidateDigest(material) };
}

async function ephemeralD1(label, migrate = true) {
  const mf = new Miniflare({ ...convertV4MiniflareOptions({ name: label, modules: true,
    script: 'export default { fetch() { return new Response("synthetic"); } };',
    compatibilityDate: '2026-08-23', host: '127.0.0.1', port: 0,
    d1Databases: { DB: label }, d1Persist: false }), telemetry: { enabled: false } });
  const db = await mf.getD1Database('DB');
  if (migrate) await db.prepare(migration.trim()).run();
  return { db, close: () => mf.dispose() };
}

function getRequest(item, { user = principal(), query = `?structureId=${encodeURIComponent(structureId)}&track=geometry`,
  headers = {} } = {}) {
  return new Request(`https://review.test/api/frozen/${item.id}${query}`,
    { headers: { 'oai-authenticated-user-id': user, ...headers } });
}
function postRequest(item, body, { user = principal(), headers = {}, raw } = {}) {
  return new Request(`https://review.test/api/frozen/${item.id}`, { method: 'POST',
    headers: { 'oai-authenticated-user-id': user, origin: 'https://review.test',
      'content-type': 'application/json', ...headers },
    body: raw ?? JSON.stringify(body) });
}
function saveBody(item, context, expectedVersion, draft = api.blankBodyReview(context, 'geometry')) {
  return { schema: 'vm-frozen-body-review-save-1', candidateId: item.id, structureId,
    track: 'geometry', expectedVersion, contextHash: context.contextHash,
    revisionHash: context.revisions.geometry, materialHash: context.materialHash, draft };
}
async function get(db, item, options) {
  return api.getFrozenDecisions(getRequest(item, options), item.id, [item], db);
}
async function post(db, item, body, options) {
  return api.postFrozenDecision(postRequest(item, body, options), item.id, [item], db);
}
async function expectStatus(response, status) {
  assert.equal(response.status, status, await response.clone().text());
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  return response.json();
}

test('API saves exact frozen revision/version, enforces issues, conflicts, isolation and GET paging',
  { timeout: 30000 }, async () => {
    const { db, close } = await ephemeralD1('synthetic-frozen-api-main');
    try {
      const first = await candidate('Synthetic first');
      const second = await candidate('Synthetic second');
      const context = await api.frozenReviewContext(first, structureId);
      const otherContext = await api.frozenReviewContext(second, structureId);
      const draft = api.blankBodyReview(context, 'geometry');
      const initial = { ...draft, issues: [{ id: 'issue-1', title: 'Synthetic concern',
        severity: 'major', resolved: false, resolution: '' }] };
      const saved = await expectStatus(await post(db, first, saveBody(first, context, 0, initial)), 201);
      assert.equal(saved.schema, 'vm-frozen-body-review-saved-1');
      assert.equal(saved.event.candidateId, first.id);
      assert.equal(saved.event.contextHash, context.contextHash);
      assert.equal(saved.event.review.version, 1);
      assert.equal(saved.event.review.revisionHash, context.revisions.geometry);
      assert.equal(saved.event.review.material.materialHash, context.materialHash);
      assert.equal(saved.event.review.issues[0].id, 'issue-1');
      await expectStatus(await post(db, first, saveBody(first, context, 0)), 409);
      await expectStatus(await post(db, first, saveBody(first, context, 1, draft)), 422);
      const resolved = { ...draft, issues: [{ ...initial.issues[0], resolved: true,
        resolution: 'Corrected in synthetic review.' }] };
      const correction = await expectStatus(await post(db, first, saveBody(first, context, 1, resolved)), 201);
      assert.equal(correction.event.review.version, 2);
      assert.equal(correction.event.review.issues[0].resolved, true);
      const one = await expectStatus(await get(db, first), 200);
      assert.equal(one.scope, 'private-to-signed-in-account-and-institution');
      assert.deepEqual(one.reviews.map(event => event.review.version), [2]);
      assert.deepEqual(one.history.map(event => event.review.version), [2, 1]);
      assert.equal(one.nextBefore, null);
      assert.deepEqual((await expectStatus(await get(db, first,
        { user: principal('b', 'one') }), 200)).reviews, []);
      assert.deepEqual((await expectStatus(await get(db, first,
        { user: principal('a', 'two') }), 200)).reviews, []);
      assert.deepEqual((await expectStatus(await get(db, second), 200)).reviews, []);
      await expectStatus(await post(db, second, saveBody(second, otherContext, 0)), 201);
      assert.equal((await expectStatus(await get(db, second), 200)).reviews[0].review.version, 1);
      assert.equal((await expectStatus(await get(db, first), 200)).reviews[0].review.version, 2);
      for (let expected = 2; expected < 22; expected++)
        await expectStatus(await post(db, first, saveBody(first, context, expected, resolved)), 201);
      const page = await expectStatus(await get(db, first), 200);
      assert.equal(page.history.length, 20);
      assert.equal(page.history[0].review.version, 22);
      assert.equal(page.history.at(-1).review.version, 3);
      assert.equal(page.nextBefore, 3);
      const next = await expectStatus(await get(db, first, { query: `?structureId=${encodeURIComponent(structureId)}&track=geometry&before=3` }), 200);
      assert.deepEqual(next.history.map(event => event.review.version), [2, 1]);
      assert.equal(next.reviews[0].review.version, 22);
      assert.equal(next.nextBefore, null);
    } finally { await close(); }
  });

test('API rejects inspection candidate, absent header, malformed requests and stale hashes',
  { timeout: 30000 }, async () => {
    const { db, close } = await ephemeralD1('synthetic-frozen-api-rejections');
    try {
      const item = await candidate();
      const old = await candidate('Immutable inspection', false);
      const context = await api.frozenReviewContext(item, structureId);
      const valid = saveBody(item, context, 0);
      await expectStatus(await get(db, old), 409);
      await expectStatus(await post(db, old, { ...valid, candidateId: old.id }), 409);
      await expectStatus(await get(db, item, { user: '' }), 401);
      await expectStatus(await post(db, item, valid, { user: '' }), 401);
      await expectStatus(await get(db, item, { query: `?structureId=${structureId}&track=geometry&track=geometry` }), 400);
      await expectStatus(await get(db, item, { query: `?structureId=${structureId}&track=geometry&before=0` }), 400);
      await expectStatus(await post(db, item, valid, { headers: { origin: 'https://other.test' } }), 403);
      await expectStatus(await post(db, item, valid, { headers: { 'sec-fetch-site': 'cross-site' } }), 403);
      await expectStatus(await post(db, item, valid, { headers: { 'content-type': 'text/plain' } }), 415);
      await expectStatus(await post(db, item, valid, { raw: '{' }), 400);
      await expectStatus(await post(db, item, valid, { raw: 'x'.repeat(32001) }), 413);
      for (const bad of [
        { ...valid, contextHash: h('0') },
        { ...valid, revisionHash: h('0') },
        { ...valid, materialHash: h('0') },
      ]) await expectStatus(await post(db, item, bad), 409);
      assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM atlas_candidate_review_events').first()).n, 0);
    } finally { await close(); }
  });

test('API returns 503 when binding or migration is absent, without creating schema',
  { timeout: 30000 }, async () => {
    const item = await candidate();
    const context = await api.frozenReviewContext(item, structureId);
    await expectStatus(await get(undefined, item), 503);
    await expectStatus(await post(undefined, item, saveBody(item, context, 0)), 503);
    const { db, close } = await ephemeralD1('synthetic-frozen-api-no-schema', false);
    try {
      await expectStatus(await get(db, item), 503);
      await expectStatus(await post(db, item, saveBody(item, context, 0)), 503);
      assert.equal(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table'
        AND name='atlas_candidate_review_events'`).first(), null);
    } finally { await close(); }
  });
