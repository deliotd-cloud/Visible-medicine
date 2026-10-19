import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handleFractureRequest, fractureContext, boundedBody, FractureError, type FracturePrincipal } from '../lib/fracture-workbooks.ts';
import { sha } from '../lib/fracture-package.mjs';

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF9sAAAAASUVORK5CYII=';
const qid = 'q_aaaaaaaaaaaaaaaa';
async function fixture() {
  const payload = { schema: 'vm-fracture-local-review-v1', contentRevision: 'a'.repeat(64), clinicalStatus: 'pending', privacyStatus: 'pending', reuseStatus: 'pending', cases: [{ id: 'case_aaaaaaaaaaaaaaaa', images: [{ id: 'image_aaaaaaaaaaaaaaaa', mime: 'image/png', sha256: await sha(Buffer.from(png, 'base64')), base64: png, view: 'Frontal', laterality: null }], questions: [{ id: qid, prompt: 'Describe this synthetic test image.', maxMarks: 1, answer: 'Synthetic fixture.', rationale: null }] }] };
  return JSON.stringify({ payload, sha256: await sha(new TextEncoder().encode(JSON.stringify(payload))) });
}
function setup() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../drizzle/0009_complex_bloodscream.sql', import.meta.url), 'utf8'));
  const session = { prepare(sql: string) { let values: (string | number | null)[] = []; return { bind(...input: (string | number | null)[]) { values = input; return this; }, async first() { return db.prepare(sql).get(...values) || null; }, async all() { return { results: db.prepare(sql).all(...values) }; }, async run() { return db.prepare(sql).run(...values); } }; } } as unknown as D1DatabaseSession;
  const bytes = new Map<string, Uint8Array>();
  const bucket = { async put(key: string, value: string | Uint8Array) { bytes.set(key, typeof value === 'string' ? new TextEncoder().encode(value) : value); }, async delete(keys: string[]) { keys.forEach(k => bytes.delete(k)); }, async get(key: string) { const value = bytes.get(key); return value ? { size: value.length, body: value, arrayBuffer: async () => Uint8Array.from(value).buffer, text: async () => new TextDecoder().decode(value) } : null; } } as unknown as R2Bucket;
  const principal = { userId: 'reviewer-a', organizationId: 'institution-a', storageKey: 'reviewer-a/institution-a', session };
  const call = (request: Request, p: FracturePrincipal = principal) => handleFractureRequest(request, p, bucket);
  const read = (id?: string, p?: FracturePrincipal) => call(new Request(`https://example.test/api/education/fracture-workbooks${id ? `?id=${id}` : ''}`), p);
  const upload = async (raw?: string, extra: Record<string, string> = {}) => call(new Request('https://example.test/api/education/fracture-workbooks', { method: 'POST', headers: { 'X-Fracture-Context': await fractureContext(principal), 'X-Fracture-Clearance': 'private-review-privacy-and-reuse-confirmed', 'X-Workbook-Title': 'Synthetic test', ...extra }, body: raw ?? await fixture() }));
  const answer = async (id: string, response: string, expectedRevision: number, questionId = qid) => call(new Request(`https://example.test/api/education/fracture-workbooks?id=${id}`, { method: 'POST', headers: { 'X-Fracture-Context': await fractureContext(principal) }, body: JSON.stringify({ questionId, response, expectedRevision }) }));
  return { db, bytes, principal, call, read, upload, answer };
}
test('private import persists real bytes, grouped questions and a revision-bound upload attestation', async () => {
  const s = setup(); const response = await s.upload(); assert.equal(response.status, 201);
  const { workbook } = await response.json() as { workbook: { id: string } };
  const detail = await (await s.read(workbook.id)).json() as { workbook: { cases: Array<{ images: Record<string, unknown>[]; questions: { id: string }[] }> } };
  assert.equal(detail.workbook.cases[0].questions[0].id, qid);
  assert.equal('base64' in detail.workbook.cases[0].images[0], false);
  const media = await s.call(new Request(`https://example.test/api/education/fracture-workbooks?id=${workbook.id}&image=image_aaaaaaaaaaaaaaaa`));
  assert.equal(media.headers.get('Cache-Control'), 'private, no-store');
  assert.deepEqual(Buffer.from(await media.arrayBuffer()), Buffer.from(png, 'base64'));
  const row = s.db.prepare('SELECT clearance_json FROM fracture_review_workbooks').get()!;
  assert.equal(JSON.parse(String(row.clearance_json)).clinicalApproval, false);
  assert.equal((await s.upload()).status, 200);
  assert.equal(s.bytes.size, 2); s.db.close();
});
test('missing clearance, wrong write context and malformed packages fail before storage', async () => {
  const s = setup();
  for (const [raw, headers, status] of [[undefined, { 'X-Fracture-Clearance': '' }, 422], [undefined, { 'X-Fracture-Context': 'other-user' }, 409], ['{}', {}, 422]] as const)
    await assert.rejects(s.upload(raw, headers), (e: unknown) => e instanceof FractureError && e.status === status);
  assert.equal(s.bytes.size, 0); s.db.close();
});

test('two-mark review format survives storage; submitted response reloads; imported keys cannot claim approval', async()=>{
  const envelope=JSON.parse(await fixture());
  const c=envelope.payload.cases[0];
  c.assessment={format:'fracture-two-mark-v1',status:'pending',fracturePresent:true,acceptedBoneAnswers:[]};
  c.questions[0].maxMarks=2;
  const encode=async()=>JSON.stringify({...envelope,sha256:await sha(new TextEncoder().encode(JSON.stringify(envelope.payload)))});
  const s=setup();
  const {workbook}=await (await s.upload(await encode())).json() as {workbook:{id:string}};
  const response=JSON.stringify({choice:'yes',bone:'radius',submitted:true});
  assert.equal((await s.answer(workbook.id,response,0)).status,200);
  const detail=await (await s.read(workbook.id)).json() as {workbook:{cases:{assessment:unknown}[];answers:{response:string}[]}};
  assert.deepEqual(detail.workbook.cases[0].assessment,c.assessment);
  assert.equal(detail.workbook.answers[0].response,response);
  c.assessment.status='reviewed';
  await assert.rejects(s.upload(await encode()),(e:unknown)=>e instanceof FractureError&&e.status===422);
  c.assessment.status='pending';c.assessment.fracturePresent=null;
  await assert.rejects(s.upload(await encode()),(e:unknown)=>e instanceof FractureError&&e.status===422);
  s.db.close();
});
test('another reviewer or institution cannot enumerate or read workbook images and questions', async () => {
  const s = setup(); const { workbook } = await (await s.upload()).json() as { workbook: { id: string } };
  for (const p of [{ ...s.principal, userId: 'reviewer-b' }, { ...s.principal, organizationId: 'institution-b' }]) {
    assert.deepEqual((await (await s.read(undefined, p)).json() as { workbooks: unknown[] }).workbooks, []);
    await assert.rejects(s.read(workbook.id, p), (e: unknown) => e instanceof FractureError && e.status === 404);
    await assert.rejects(s.call(new Request(`https://example.test/api/education/fracture-workbooks?id=${workbook.id}&image=image_aaaaaaaaaaaaaaaa`), p), (e: unknown) => e instanceof FractureError && e.status === 404);
  }
  s.db.close();
});
test('answer revisions survive reload, lost-response retry is idempotent, stale tabs cannot overwrite', async () => {
  const s = setup(); const { workbook } = await (await s.upload()).json() as { workbook: { id: string } };
  assert.equal((await s.answer(workbook.id, 'First', 0)).status, 200);
  assert.equal((await s.answer(workbook.id, 'First', 0)).status, 200);
  assert.equal((await s.answer(workbook.id, 'Second', 1)).status, 200);
  assert.equal((await s.answer(workbook.id, 'Stale overwrite', 1)).status, 409);
  const detail = await (await s.read(workbook.id)).json() as { workbook: { answers: { response: string; revision: number }[] } };
  assert.equal(detail.workbook.answers[0].response, 'Second'); assert.equal(detail.workbook.answers[0].revision, 2);
  await assert.rejects(s.answer(workbook.id, 'Other question', 0, 'q_bbbbbbbbbbbbbbbb'), (e: unknown) => e instanceof FractureError && e.status === 422);
  s.db.close();
});
test('damaged manifest and unknown image fail closed', async () => {
  const s = setup(); const { workbook } = await (await s.upload()).json() as { workbook: { id: string } };
  await assert.rejects(s.call(new Request(`https://example.test/api/education/fracture-workbooks?id=${workbook.id}&image=../../other`)), (e: unknown) => e instanceof FractureError && e.status === 404);
  const imageKey = [...s.bytes.keys()].find(k => k.endsWith('.png'))!; s.bytes.set(imageKey, new Uint8Array(40));
  await assert.rejects(s.call(new Request(`https://example.test/api/education/fracture-workbooks?id=${workbook.id}&image=image_aaaaaaaaaaaaaaaa`)), (e: unknown) => e instanceof FractureError && e.status === 503);
  s.bytes.set(imageKey, new Uint8Array(8 * 1024 * 1024 + 1));
  await assert.rejects(s.call(new Request(`https://example.test/api/education/fracture-workbooks?id=${workbook.id}&image=image_aaaaaaaaaaaaaaaa`)), (e: unknown) => e instanceof FractureError && e.status === 503);
  const key = [...s.bytes.keys()].find(k => k.endsWith('manifest.json'))!; s.bytes.set(key, new TextEncoder().encode('{}'));
  await assert.rejects(s.read(workbook.id), (e: unknown) => e instanceof FractureError && e.status === 503); s.db.close();
});
test('request limit is enforced on streamed bytes without trusting Content-Length', async () => {
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(9)); controller.enqueue(new Uint8Array(9)); controller.close(); } });
  await assert.rejects(boundedBody(new Request('https://example.test', { method: 'POST', body: stream, duplex: 'half' } as RequestInit), 10), (e: unknown) => e instanceof FractureError && e.status === 413);
});

test('actual Worker route enforces sign-in, active administrator membership and revocation', { timeout: 60000 }, async () => {
  const { build } = await import('esbuild');
  const { Miniflare, Log, LogLevel, convertV4MiniflareOptions } = await import('miniflare');
  const { resolve } = await import('node:path');
  const bundle = await build({ stdin: { contents: `import * as route from './app/api/education/fracture-workbooks/route'; export default { async fetch(request) { globalThis.__fractureHeaders=request.headers; return route[request.method](request); }};`, resolveDir: process.cwd(), sourcefile: 'fracture-route-fixture.ts' }, bundle: true, write: false, format: 'esm', platform: 'neutral', target: 'es2022', external: ['cloudflare:workers'], plugins: [{ name: 'test-headers', setup(b) { b.onResolve({ filter: /^next\/(headers|navigation)$/ }, args => ({ path: args.path, namespace: 'fixture' })); b.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: args.path === 'next/headers' ? 'export async function headers(){return globalThis.__fractureHeaders}' : 'export function redirect(){throw Error("Unexpected redirect")}' })); } }] });
  const mf = new Miniflare(convertV4MiniflareOptions({ modules: [{ type: 'ESModule', path: resolve('.local/fracture-route-test.mjs'), contents: bundle.outputFiles[0].text }], compatibilityDate: '2026-08-23', d1Databases: ['DB'], r2Buckets: ['FILES'], log: new Log(LogLevel.NONE) }));
  try {
    const db = await mf.getD1Database('DB');
    for (const sql of [
      'CREATE TABLE users (id TEXT PRIMARY KEY, external_subject TEXT, roles TEXT)',
      'CREATE TABLE account_security_profiles (user_id TEXT PRIMARY KEY, status TEXT)',
      'CREATE TABLE organizations (id TEXT PRIMARY KEY, status TEXT, created_at TEXT)',
      'CREATE TABLE organization_memberships (organization_id TEXT, user_id TEXT, role TEXT, status TEXT)',
      ...readFileSync(new URL('../drizzle/0009_complex_bloodscream.sql', import.meta.url), 'utf8').split('--> statement-breakpoint').filter(s => s.trim()),
    ]) await db.prepare(sql).run();
    await db.prepare("INSERT INTO organizations VALUES ('org','active','2026-09-28')").run();
    for (const [who, roles, member] of [['admin','administrator','owner'],['learner','learner','learner'],['instructor','instructor','administrator'],['no-membership','administrator','learner']]) {
      await db.prepare('INSERT INTO users VALUES (?,?,?)').bind('edu:' + who, 'sites:' + who, roles).run();
      await db.prepare('INSERT INTO account_security_profiles VALUES (?,?)').bind('edu:' + who, 'active').run();
      await db.prepare('INSERT INTO organization_memberships VALUES (?,?,?,?)').bind('org', 'edu:' + who, member, 'active').run();
    }
    const call = (who?: string, suffix = '', body?: string, extra = {}) => mf.dispatchFetch('https://review.test/api/education/fracture-workbooks' + suffix, { method: body ? 'POST' : 'GET', headers: { ...(who ? { 'oai-authenticated-user-id': who, 'oai-authenticated-user-email': who + '@test.invalid' } : {}), ...extra }, ...(body ? { body } : {}) });
    assert.equal((await call()).status, 401);
    for (const who of ['learner', 'instructor', 'no-membership', 'unknown']) assert.equal((await call(who)).status, 403);
    const prior = await call('admin'); assert.equal(prior.status, 200);
    const context = prior.headers.get('X-Fracture-Context')!;
    assert.equal((await call('admin', '', await fixture())).status, 409);
    const imported = await call('admin', '', await fixture(), { 'X-Fracture-Context': context, 'X-Fracture-Clearance': 'private-review-privacy-and-reuse-confirmed', 'X-Workbook-Title': 'Synthetic route test' });
    assert.equal(imported.status, 201, await imported.clone().text());
    const body = await imported.json() as { workbook: { id: string } };
    const suffix = '?id=' + body.workbook.id + '&image=image_aaaaaaaaaaaaaaaa';
    assert.equal((await call('admin', suffix)).status, 200);
    await db.prepare("UPDATE organization_memberships SET status='revoked' WHERE user_id='edu:admin'").run();
    assert.equal((await call('admin', suffix)).status, 403);
    assert.equal((await call('admin')).status, 403);
  } finally { await mf.dispose(); }
});
