import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(new URL('../package.json', import.meta.url));
const { build } = require('esbuild');
const expected = { actorId: 'edu:actor-a', organizationId: 'org-a' };
const invitation = { id: 'invite-one', label: 'Synthetic cohort', status: 'active', uses: 2, maxUses: 12, createdAt: '2026-10-17T12:00:00.000Z', expiresAt: '2026-11-17T12:00:00.000Z' };
const page = { releaseId: 'release-one', checkedAt: '2026-10-17T13:00:00.000Z', invitations: [invitation], nextCursor: null };
class EducationPlatformError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
class InstitutionOperationsError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
let state;
const seams = {
  EducationPlatformError, InstitutionOperationsError,
  async getChatGPTUser() { state.events.push('auth'); return state.subject ? { userId: state.subject, email: 'synthetic@example.invalid', displayName: 'Synthetic' } : null; },
  async enforceRateLimit(...args) { state.events.push('rate'); state.rates.push(args); if (state.rateError) throw state.rateError; },
  async getStudioInvitations(auth, releaseId, cursor) {
    state.events.push('list'); state.calls.push({ method: 'list', actor: auth.userId, releaseId, cursor });
    if (state.domainError) throw state.domainError;
    if (!releaseId || cursor && (!cursor.createdAt || !cursor.id || Number.isNaN(Date.parse(cursor.createdAt)))) throw new EducationPlatformError('Choose a valid invitation ledger page.', 422);
    return page;
  },
  async revokeStudioInvitation(auth, input) {
    state.events.push('revoke'); state.calls.push({ method: 'revoke', actor: auth.userId, input });
    if (state.domainError) throw state.domainError;
    return invitation.id;
  },
  env: { DB: { withSession(bookmark) {
    assert.equal(bookmark, 'first-primary'); state.primary++;
    return { prepare(sql) {
      assert.match(sql, /organization_memberships/); assert.match(sql, /m\.status='active'/);
      assert.match(sql, /ORDER BY o\.created_at LIMIT 1/);
      return { bind(actor) {
        assert.equal(actor, `edu:${state.subject}`);
        return { async first() { state.reads++; if (state.dbError) throw Error('PRIVATE_DATABASE_ERROR'); return state.organization ? { id: state.organization } : null; } };
      } };
    } };
  } } }
};
const names = { provider: ['getChatGPTUser'], platform: ['EducationPlatformError', 'getStudioInvitations', 'revokeStudioInvitation'], operations: ['InstitutionOperationsError', 'enforceRateLimit'], cloudflare: ['env'] };
const bundle = await build({ entryPoints: [root + 'app/api/studio-invitations/route.ts'], bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent', plugins: [{ name: 'actual-route-synthetic-external-boundaries', setup(b) {
  b.onResolve({ filter: /^synthetic-seams$/ }, () => ({ path: 'synthetic-seams', external: true }));
  b.onResolve({ filter: /^(?:@\/|cloudflare:workers)/ }, args => {
    const seam = args.path === '@/app/chatgpt-auth' ? 'provider' : args.path === '@/lib/education-platform' ? 'platform' : args.path === '@/lib/institution-operations' ? 'operations' : args.path === 'cloudflare:workers' ? 'cloudflare' : null;
    return seam ? { path: seam, namespace: 'seam' } : { path: path.join(root, args.path.slice(2) + '.ts') };
  });
  b.onLoad({ filter: /.*/, namespace: 'seam' }, args => ({ contents: `import s from 'synthetic-seams';${names[args.path].map(name => `export const ${name}=s.${name};`).join('')}`, loader: 'js' }));
} }] });
const module = { exports: {} };
new Function('module', 'exports', 'require', bundle.outputFiles[0].text)(module, module.exports, name => { assert.equal(name, 'synthetic-seams'); return seams; });
const route = module.exports;
const reset = (changes = {}) => state = { subject: 'actor-a', organization: 'org-a', events: [], calls: [], rates: [], primary: 0, reads: 0, ...changes };
const get = (query = 'releaseId=release-one', context = expected) => route.GET(new Request(`https://synthetic.invalid/api/studio-invitations?${query}`, { headers: context === null ? {} : { 'X-Studio-Mutation-Context': typeof context === 'string' ? context : JSON.stringify(context) } }));
const payload = (changes = {}) => ({ action: 'revoke-course-invitation', releaseId: page.releaseId, invitationId: invitation.id, expectedCreatedAt: invitation.createdAt, expectedStudioContext: expected, ...changes });
const post = (body = payload(), options = {}) => route.POST(new Request('https://synthetic.invalid/api/studio-invitations', { method: 'POST', headers: { origin: 'https://synthetic.invalid', 'content-type': 'application/json', ...options.headers }, body: options.raw ?? JSON.stringify(body) }));
const safe = async (response, status) => { assert.equal(response.status, status); assert.equal(response.headers.get('cache-control'), 'private, no-store'); const body = await response.json(); assert(!JSON.stringify(body).includes('PRIVATE_DATABASE_ERROR')); assert(!JSON.stringify(body).includes('ELV-SECRET')); assert(!JSON.stringify(body).includes('code_hash')); return body; };

test('GET returns exact metadata receipt, no secret material, and dispatches trusted actor', async () => {
  reset(); const body = await safe(await get(), 200);
  assert.deepEqual(body, { ok: true, action: 'list-course-invitations', ...page });
  assert.deepEqual(state.calls, [{ method: 'list', actor: expected.actorId, releaseId: page.releaseId, cursor: undefined }]);
  assert.deepEqual(state.rates, [[expected.actorId, 'studio-invitations-read', 90, 60]]);
  assert.equal(state.reads, 1);
});
test('GET passes an exact cursor and rejects duplicate, unknown, or incomplete query parameters', async () => {
  reset(); const cursor = `releaseId=release-one&beforeCreatedAt=${encodeURIComponent(invitation.createdAt)}&beforeId=${invitation.id}`;
  await safe(await get(cursor), 200);
  assert.deepEqual(state.calls[0].cursor, { createdAt: invitation.createdAt, id: invitation.id });
  for (const [query, domainCalled] of [['releaseId=a&releaseId=b', false], ['releaseId=release-one&beforeId=a&beforeId=b', false], ['releaseId=release-one&beforeCreatedAt=a&beforeCreatedAt=b', false], ['releaseId=release-one&extra=x', false], ['releaseId=release-one&beforeId=x', true], ['releaseId=release-one&beforeCreatedAt=invalid&beforeId=x', true]]) {
    reset(); const body = await safe(await get(query), 422); assert.equal(typeof body.error, 'string'); assert.equal(state.calls.length, domainCalled ? 1 : 0);
  }
});
test('POST returns exact revocation receipt and passes the hosted actor and input', async () => {
  reset(); const input = payload(); const body = await safe(await post(input), 200);
  assert.deepEqual(body, { ok: true, action: 'revoke-course-invitation', invitationId: invitation.id, status: 'revoked' });
  assert.deepEqual(state.calls, [{ method: 'revoke', actor: expected.actorId, input }]);
  assert.deepEqual(state.rates, [[expected.actorId, 'studio-write', 45, 60]]);
});
test('signed-out GET and POST stop before scope read and domain dispatch', async () => {
  reset({ subject: null }); await safe(await get(), 401); await safe(await post(), 401);
  assert.equal(state.reads, 0); assert.deepEqual(state.calls, []); assert.deepEqual(state.rates, []);
});
test('malformed, missing, stale actor, and stale organization context fail closed without leaking identity', async () => {
  for (const context of [null, 'not-json', 'x'.repeat(2049), {}, { actorId: 'edu:actor-b', organizationId: 'org-a' }, { actorId: 'edu:actor-a', organizationId: 'org-b' }]) {
    reset(); const response = await get('releaseId=release-one', context); const body = await safe(response, 409);
    assert.equal(body.code, 'STUDIO_CONTEXT_CHANGED'); assert(!JSON.stringify(body).includes('actor-a')); assert(!JSON.stringify(body).includes('org-a'));
    assert.deepEqual(state.calls, []); assert.deepEqual(state.rates, []);
    reset(); const postBody = await safe(await post(payload({ expectedStudioContext: context })), 409);
    assert.equal(postBody.code, 'STUDIO_CONTEXT_CHANGED'); assert.deepEqual(state.calls, []);
  }
  for (const organization of ['org-b', null]) { reset({ organization }); assert.equal((await safe(await get(), 409)).code, 'STUDIO_CONTEXT_CHANGED'); assert.deepEqual(state.calls, []); reset({ organization }); assert.equal((await safe(await post(), 409)).code, 'STUDIO_CONTEXT_CHANGED'); assert.deepEqual(state.calls, []); }
});
test('unavailable primary context read returns 503 without domain dispatch or private diagnostics', async () => {
  reset({ dbError: true }); assert.equal((await safe(await get(), 503)).code, 'STUDIO_CONTEXT_UNAVAILABLE'); assert.deepEqual(state.calls, []);
  reset({ dbError: true }); assert.equal((await safe(await post(), 503)).code, 'STUDIO_CONTEXT_UNAVAILABLE'); assert.deepEqual(state.calls, []);
});
test('POST enforces same origin, JSON object, streamed byte limit, and known action before dispatch', async () => {
  for (const [options, status] of [[{ headers: { origin: 'https://other.invalid' } }, 403], [{ headers: { 'sec-fetch-site': 'cross-site' } }, 403], [{ headers: { 'content-type': 'text/plain' } }, 415], [{ raw: 'not-json' }, 422], [{ raw: '[]' }, 422], [{ raw: '"scalar"' }, 422], [{ headers: { 'content-length': '8001' } }, 413], [{ raw: JSON.stringify(payload({ padding: 'x'.repeat(8000) })) }, 413]]) {
    reset(); await safe(await post(payload(), options), status); assert.deepEqual(state.calls, []); assert.equal(state.reads, 0);
  }
  reset(); await safe(await post(payload({ action: 'other' })), 404); assert.deepEqual(state.calls, []); assert.equal(state.reads, 1);
});
test('rate refusal and domain authorization refusal preserve status and no-store', async () => {
  reset({ rateError: new InstitutionOperationsError('Too many requests.', 429) }); await safe(await get(), 429); assert.deepEqual(state.calls, []);
  reset({ rateError: new InstitutionOperationsError('Too many requests.', 429) }); await safe(await post(), 429); assert.deepEqual(state.calls, []);
  reset({ domainError: new EducationPlatformError('Staff authority refused.', 403) }); await safe(await get(), 403);
  reset({ domainError: new EducationPlatformError('Staff authority refused.', 403) }); await safe(await post(), 403);
});
test('unexpected domain failure returns redacted 500 and no secret code', async () => {
  const original = console.error; console.error = () => {};
  try { reset({ domainError: Error('ELV-SECRET private token') }); const body = await safe(await get(), 500); assert.equal(body.error, 'The invitation ledger is unavailable. Refresh it before continuing.'); }
  finally { console.error = original; }
});
