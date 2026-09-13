import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import { Miniflare, Log, LogLevel, convertV4MiniflareOptions } from 'miniflare';
import { atlasDeliveryForwardUrl, resolveAtlasDeliveryModel } from '../lib/atlas-model-delivery.ts';
import { ATLAS_DELIVERY_POLICY } from '../lib/atlas-delivery-policy.ts';
import { verifyAtlasDelivery } from '../lib/atlas-delivery-check.ts';
const inventoryBytes = readFileSync('lib/atlas-model-inventory.json');
const inventory = JSON.parse(inventoryBytes.toString());

test('delivery policy binds the complete inventory and retains private draft review', () => {
  assert.equal(ATLAS_DELIVERY_POLICY.audience, 'administrator-review');
  assert.equal(ATLAS_DELIVERY_POLICY.manifestRevision, createHash('sha256').update(inventoryBytes).digest('hex'));
  assert.equal('approvedRevision' in ATLAS_DELIVERY_POLICY, false);
});

test('all registered original model paths retain full or short revisions without accepting stale geometry', () => {
  for (const model of inventory.models) for (const path of model.paths) {
    for (const query of ['', `?v=${model.sha256}`, `?v=${model.sha256.slice(0, 12)}`]) {
      const url = new URL(path + query, 'https://atlas.test');
      const forwarded = atlasDeliveryForwardUrl(url);
      assert.ok(forwarded); assert.equal(forwarded.origin, url.origin); assert.equal(forwarded.search, query);
      assert.equal(resolveAtlasDeliveryModel(url, inventory.models).sha256, model.sha256);
      assert.equal(resolveAtlasDeliveryModel(forwarded, inventory.models).sha256, model.sha256);
    }
    for (const query of ['?v=bad', '?v=' + '0'.repeat(64), '?v=' + model.sha256 + '&v=' + model.sha256, '?token=x', '?v=']) {
      assert.throws(() => resolveAtlasDeliveryModel(new URL(path + query, 'https://atlas.test'), inventory.models));
    }
  }
  for (const path of ['/atlas-runtime/head-neck/index.html', '/atlas-runtime/head-neck/models/bodyparts3d/credits.html', '/media/splash/glide-v8.mp4', '/atlas-runtime/head-neck/models/%2E%2E/secrets.glb', '/models/unregistered.glb']) {
    assert.equal(atlasDeliveryForwardUrl(new URL(path, 'https://atlas.test')), null);
    assert.throws(() => resolveAtlasDeliveryModel(new URL(path, 'https://atlas.test'), inventory.models));
  }
  assert.throws(() => resolveAtlasDeliveryModel(new URL(inventory.models[0].paths[0], 'https://atlas.test'), [inventory.models[0], inventory.models[0]]));
});

test('actual D1/R2 access is read-only, revision-bound and independent of lecture rights', { timeout: 60000 }, async () => {
  const model = inventory.models.find((m: { paths: string[] }) => m.paths[0].includes('/shoulder/'));
  const bytes = readFileSync('public' + model.paths[0]);
  const modules = ['atlas-model-storage', 'atlas-model-delivery', 'atlas-delivery-access'].map(name => ({
    type: 'ESModule' as const, path: resolve(`lib/${name}.ts`),
    contents: ts.transpileModule(readFileSync(`lib/${name}.ts`, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText,
  }));
  // These headers exist only in this in-memory test worker. The production
  // route uses getChatGPTUser and a server-owned policy, never test identity.
  const worker = `import { handleAtlasDelivery } from '../lib/atlas-model-delivery.ts';
    import { authorizeAtlasDelivery } from '../lib/atlas-delivery-access.ts';
    export default { async fetch(request, env) {
      const audience = request.headers.get('x-fixture-audience') || 'administrator-review';
      const policy = { audience, manifestRevision: '${ATLAS_DELIVERY_POLICY.manifestRevision}',
        approvedRevision: request.headers.get('x-fixture-approval') || undefined };
      return handleAtlasDelivery(request, [${JSON.stringify(model)}], env.FILES,
        () => authorizeAtlasDelivery(env.DB, request.headers.get('x-fixture-subject'), policy, new Date('2026-09-13T12:00:00.000Z')));
    }};`;
  const mf = new Miniflare(convertV4MiniflareOptions({ modules: [{ type: 'ESModule', path: resolve('tests/atlas-delivery-worker.mjs'), contents: worker }, ...modules],
    compatibilityDate: '2026-08-23', d1Databases: ['DB'], r2Buckets: ['FILES'], log: new Log(LogLevel.NONE) }));
  try {
    const db = await mf.getD1Database('DB'), bucket = await mf.getR2Bucket('FILES');
    // Bounded fixture columns match the existing schema; no production DDL runs.
    for (const sql of [
      'CREATE TABLE users (id TEXT PRIMARY KEY, external_subject TEXT NOT NULL, roles TEXT NOT NULL)',
      'CREATE TABLE account_security_profiles (user_id TEXT PRIMARY KEY, status TEXT NOT NULL)',
      'CREATE TABLE organizations (id TEXT PRIMARY KEY, status TEXT NOT NULL)',
      'CREATE TABLE organization_memberships (organization_id TEXT, user_id TEXT, status TEXT, PRIMARY KEY(organization_id,user_id))',
      'CREATE TABLE organization_entitlements (organization_id TEXT PRIMARY KEY, atlas_access INTEGER, studio_access INTEGER, status TEXT, valid_until TEXT)',
      'CREATE TABLE enrolments (user_id TEXT, course_id TEXT, status TEXT)',
    ]) await db.prepare(sql).run();
    for (const [id, roles] of [['admin', 'administrator'], ['learner', 'learner'], ['lecture-only', 'learner'], ['wrong-subject', 'administrator']]) {
      await db.prepare('INSERT INTO users VALUES (?, ?, ?)').bind(`edu:${id}`, id === 'wrong-subject' ? 'sites:someone-else' : `sites:${id}`, roles).run();
      await db.prepare('INSERT INTO account_security_profiles VALUES (?, ?)').bind(`edu:${id}`, 'active').run();
    }
    await db.prepare("INSERT INTO organizations VALUES ('org', 'active')").run();
    await db.prepare("INSERT INTO organization_entitlements VALUES ('org',1,0,'active',NULL)").run();
    await db.prepare("INSERT INTO organization_memberships VALUES ('org','edu:learner','active')").run();
    await db.prepare("INSERT INTO enrolments VALUES ('edu:lecture-only','paid-lecture','active')").run();
    await bucket.put(`atlas-models/v1/${model.sha256}.glb`, bytes, { sha256: model.sha256 });
    const url = `https://atlas.test${model.paths[0].replace('/atlas-runtime/', '/api/atlas-delivery/')}?v=${model.sha256}`;
    const call = (subject: string, method = 'GET', headers: Record<string, string> = {}) => mf.dispatchFetch(url, { method, headers: { ...(subject ? { 'x-fixture-subject': subject } : {}), ...headers } });
    const learnerHeaders = { 'x-fixture-audience': 'reviewed-learner', 'x-fixture-approval': ATLAS_DELIVERY_POLICY.manifestRevision };
    for (const subject of ['', 'unknown', 'wrong-subject', 'learner', 'lecture-only']) assert.equal((await call(subject, 'HEAD')).status, subject ? 403 : 401);
    assert.equal((await call('admin', 'HEAD')).status, 200);
    const browserRequest: typeof fetch = async (input, init) => {
      const headers = new Headers(init?.headers);
      headers.set('x-fixture-subject', 'admin');
      const response = await mf.dispatchFetch(new URL(String(input), 'https://atlas.test').href, { method: init?.method, headers: Object.fromEntries(headers) });
      return new Response(init?.method === 'HEAD' || response.status === 304 ? null : await response.arrayBuffer(), { status: response.status, headers: Object.fromEntries(response.headers) });
    };
    assert.equal((await verifyAtlasDelivery(model, new AbortController().signal, browserRequest)).sha256, model.sha256);
    await assert.rejects(verifyAtlasDelivery(model, new AbortController().signal, async () => new Response(null, {status:403})), /protected storage route/);
    assert.equal((await call('admin', 'PUT')).status, 405);
    assert.equal((await call('learner', 'HEAD', { 'x-fixture-audience': 'reviewed-learner' })).status, 403);
    assert.equal((await call('learner', 'HEAD', { ...learnerHeaders, 'x-fixture-approval': '0'.repeat(64) })).status, 403);
    assert.equal((await call('lecture-only', 'HEAD', learnerHeaders)).status, 403, 'Paid lecture enrolment does not grant Atlas access');
    const full = await call('learner', 'GET', learnerHeaders);
    assert.equal(full.status, 200); assert.deepEqual(Buffer.from(await full.arrayBuffer()), bytes);
    assert.equal(full.headers.get('cache-control'), 'private, no-store');
    assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM enrolments WHERE user_id='edu:learner'").first<{n:number}>())?.n, 0, 'Atlas delivery never grants a lecture');
    const range = await call('learner', 'GET', { ...learnerHeaders, range: 'bytes=0-11' });
    assert.equal(range.status, 206); assert.deepEqual(Buffer.from(await range.arrayBuffer()), bytes.subarray(0,12));
    assert.equal((await call('learner', 'GET', { ...learnerHeaders, 'if-none-match': `"${model.sha256}"` })).status, 304);
    for (const expiry of ['2026-09-13T12:00:00.000Z', '2026-09-12T00:00:00.000Z', 'not-a-date', 'now', '2026-99-99T00:00:00.000Z']) {
      await db.prepare("UPDATE organization_entitlements SET valid_until=? WHERE organization_id='org'").bind(expiry).run();
      assert.equal((await call('learner', 'HEAD', learnerHeaders)).status, 403);
    }
    await db.prepare("UPDATE organization_entitlements SET valid_until='2026-09-14T00:00:00.000Z' WHERE organization_id='org'").run();
    assert.equal((await call('learner', 'HEAD', learnerHeaders)).status, 200);
    for (const [table,column,denied,allowed,where] of [
      ['organization_entitlements','status','revoked','active',"organization_id='org'"],
      ['organization_entitlements','atlas_access',0,1,"organization_id='org'"],
      ['organization_memberships','status','revoked','active',"user_id='edu:learner'"],
      ['organizations','status','suspended','active',"id='org'"],
      ['account_security_profiles','status','deactivated','active',"user_id='edu:learner'"],
    ] as const) {
      await db.prepare(`UPDATE ${table} SET ${column}=? WHERE ${where}`).bind(denied).run();
      const readVariants: Record<string,string>[] = [{}, {range:'bytes=0-11'}, {'if-none-match':`"${model.sha256}"`}];
      for (const extra of readVariants) {
        assert.equal((await call('learner','GET',{...learnerHeaders,...extra})).status,403);
      }
      assert.equal((await db.prepare(`SELECT ${column} AS value FROM ${table} WHERE ${where}`).first())?.value, denied, 'Reading never reactivates access');
      await db.prepare(`UPDATE ${table} SET ${column}=? WHERE ${where}`).bind(allowed).run();
    }
    await db.prepare("UPDATE account_security_profiles SET status='restricted' WHERE user_id='edu:admin'").run();
    assert.equal((await call('admin','HEAD')).status,403);
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM users').first<{n:number}>())?.n,4,'No implicit provisioning');
  } finally { await mf.dispose(); }
});
