import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { build } from './workspace-test-build.mjs';

const modules = ['clinical-review-queue', 'clinical-review-index', 'clinical-review-status', 'body-review-context',
  'review-workspace', 'body-review-decisions', 'nested-review', 'specimen-review', 'nested-review-material',
  'specimen-review-material', 'review-store', 'body-review-store', 'nested-review-store', 'specimen-review-store'];
const built = await build({ stdin: { contents: modules.map(name => `export * from './lib/${name}';`).join('\n'),
  resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const api = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
const sqlite = new DatabaseSync(':memory:');
for (const name of ['0000_shoulder_review_events', '0001_body_review_events', '0002_specimen_review_events', '0003_nested_review_events'])
  sqlite.exec(await readFile('drizzle/' + name + '.sql', 'utf8'));
const queries = [];
const db = { prepare(sql) { assert(sql.trimStart().startsWith('SELECT') || sql.trimStart().startsWith('INSERT'));
  return { bind(...values) { return {
    async all() { queries.push([sql, values]); return { results: sqlite.prepare(sql).all(...values) }; },
    async run() { return { meta: { changes: Number(sqlite.prepare(sql).run(...values).changes) } }; },
  }; } }; } };
const request = (query = '', user = 'synthetic-reviewer') => new Request('https://atlas.test/api/review-overview' + query,
  { headers: user ? { 'oai-authenticated-user-id': user } : {} });
const read = async query => {
  const response = await api.getClinicalReviewQueue(request(query), db);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const data = await response.json();
  const entries = api.findClinicalReviewEntries(Object.fromEntries(new URLSearchParams(query))).entries;
  return api.parseClinicalStatusPage(data, entries.map(e => e.key));
};
const fixtureText = { reviewer: 'SYNTHETIC PRIVATE NAME', qualification: 'Software fixture only',
  scope: 'Synthetic review test; not a clinical decision', notes: 'PRIVATE NOTE MUST NOT LEAK',
  evidence: [{ title: 'Synthetic only', url: 'https://example.com/test', note: 'PRIVATE EVIDENCE' }], attested: true };
async function fixture(entry, track = 'geometry', status = 'approved', version = 1) {
  let context, blank, sourceKey;
  if (entry.scope === 'shoulder') {
    blank = api.blankReview(entry.id, track);
    const review = { ...blank, ...fixtureText, status, structureId: entry.id, track, version,
      checks: Object.fromEntries(Object.keys(blank.checks).map(key => [key, true])), savedAt: '2026-09-26T10:00:00.000Z',
      reviewedAt: status === 'approved' ? '2026-09-26T10:00:00.000Z' : null,
      revisionHash: api.currentRevision(entry.id, track), checklistVersion: api.checklistVersion };
    return { review, append: (user, r) => api.appendReview(db, user, r, version - 1) };
  }
  if (entry.scope === 'body') { context = await api.bodyReviewContext(entry.id); blank = api.blankBodyReview(context, track); }
  else {
    [sourceKey] = JSON.parse(entry.key.slice(entry.scope.length + 1));
    context = (entry.scope === 'nested' ? await api.nestedReviewMaterial(sourceKey, entry.id)
      : await api.specimenReviewMaterial(sourceKey, entry.id)).context;
    blank = entry.scope === 'nested' ? api.blankNestedReview(context, track) : api.blankSpecimenReview(context, track);
  }
  const kind = entry.scope === 'specimens' ? 'specimen' : entry.scope;
  const review = { ...blank, ...fixtureText, status, eventSchema: `vm-${kind}-review-event-1`,
    catalogScope: context.catalogScope, structureId: entry.id, track, version,
    ...(kind === 'nested' ? { nestedKey: sourceKey, sourceFrame: context.sourceFrame } : {}),
    ...(kind === 'specimen' ? { specimenKey: sourceKey, sourceFrame: context.sourceFrame } : {}),
    checks: Object.fromEntries(context.checklists[track].map(check => [check.id, true])),
    checklist: context.checklists[track], checklistVersion: context.checklistVersion,
    revisionHash: context.revisions[track], savedAt: '2026-09-26T10:00:00.000Z',
    reviewedAt: status === 'approved' ? '2026-09-26T10:00:00.000Z' : null,
    material: Object.fromEntries(['materialHash', 'sourceHash', 'teachingHash', 'rendererHash', 'teachingTabs'].map(k => [k, context[k]])) };
  const append = { body: api.appendBodyReview, nested: api.appendNestedReview, specimen: api.appendSpecimenReview }[kind];
  return { review, append: (user, r) => append(db, user, r, version - 1) };
}

test('authentication is checked before storage; no client-selected user or duplicate parameters', async () => {
  const count = queries.length;
  assert.equal((await api.getClinicalReviewQueue(request('', ''), db)).status, 401);
  assert.equal(queries.length, count);
  for (const query of ['?user=someone-else', '?scope=body&scope=nested', '?scope=pilot&scope=body', '?page=1&page=2'])
    assert.equal((await api.getClinicalReviewQueue(request(query), db)).status, 400);
  assert.equal((await api.getClinicalReviewQueue(request(), undefined)).status, 503);
});

test('empty histories mean not started in all four exact scopes, with bounded reads', async () => {
  for (const scope of ['shoulder', 'body', 'nested', 'specimens', 'pilot']) {
    queries.length = 0;
    const rows = await read('?scope=' + scope);
    if (scope === 'pilot') { assert.equal(rows.length,11); assert.equal(rows.filter(r=>r.key.startsWith('nested:')).length,2); }
    assert(rows.length <= 12);
    assert(rows.every(row => row.geometry === 'not-started' && row.teaching === 'not-started'));
    assert(queries.length <= 24);
    assert(queries.every(([sql, values]) => sql.includes('user_id=?1') && values[0] === 'synthetic-reviewer'));
  }
});

test('actual stores supply latest decisions; revisions, private identities and track separation survive reload', async () => {
  for (const scope of ['shoulder', 'body', 'nested', 'specimens']) {
    const entry = api.findClinicalReviewEntries({ scope }).entries[0];
    const query = '?scope=' + scope;
    const first = await fixture(entry);
    assert(await first.append('synthetic-reviewer', first.review));
    assert.equal((await read(query)).find(r => r.key === entry.key).geometry, 'approval-recorded');
    const other = await api.getClinicalReviewQueue(request(query, 'other-user'), db);
    assert((await other.json()).items.every(r => r.geometry === 'not-started'));
    const teaching = await fixture(entry, 'teaching', 'draft');
    assert(await teaching.append('synthetic-reviewer', teaching.review));
    assert.equal((await read(query)).find(r => r.key === entry.key).teaching, 'in-progress');
    const corrections = await fixture(entry, 'geometry', 'changes-required', 2);
    assert(await corrections.append('synthetic-reviewer', corrections.review));
    assert.equal((await read(query)).find(r => r.key === entry.key).geometry, 'changes-required');
    const outdated = await fixture(entry, 'geometry', 'approved', 3);
    outdated.review.revisionHash = '0'.repeat(64);
    assert(await outdated.append('synthetic-reviewer', outdated.review));
    assert.equal((await read(query)).find(r => r.key === entry.key).geometry, 're-review');
    const text = await (await api.getClinicalReviewQueue(request(query), db)).text();
    for (const secret of ['SYNTHETIC PRIVATE', 'PRIVATE NOTE', 'PRIVATE EVIDENCE', 'example.com', 'reviewer', 'savedAt'])
      assert(!text.includes(secret), secret);
  }
});

test('failure and corrupt latest record never become not-started or an older approval', async () => {
  const broken = { prepare() { throw Error('PRIVATE DATABASE DETAILS'); } };
  const failed = await api.getClinicalReviewQueue(request('?scope=body'), broken);
  const data = await failed.json();
  assert(data.items.every(r => r.geometry === 'unavailable' && r.teaching === 'unavailable'));
  assert(!JSON.stringify(data).includes('PRIVATE'));
  const entry = api.findClinicalReviewEntries({ scope: 'body' }).entries[0];
  sqlite.prepare('INSERT INTO body_review_events VALUES(?,?,?,?,?,?)').run('synthetic-reviewer', entry.id, 'geometry', 4, '{}', 'synthetic');
  assert.equal((await read('?scope=body')).find(r => r.key === entry.key).geometry, 'unavailable');
});

test('client rejects mismatched scopes, keys, order, extra/missing rows and unknown states', () => {
  const good = { scope: 'private-to-signed-in-user', items: [{ key: 'a', geometry: 'not-started', teaching: 're-review' }] };
  assert.equal(api.parseClinicalStatusPage(good, ['a'])[0].teaching, 're-review');
  for (const bad of [null, {}, { ...good, scope: 'public' }, { ...good, items: [] }, { ...good, items: [...good.items, ...good.items] },
    { ...good, items: [{ ...good.items[0], key: 'b' }] }, { ...good, items: [{ ...good.items[0], geometry: 'toString' }] }])
    assert.throws(() => api.parseClinicalStatusPage(bad, ['a']));
});

test.after(() => sqlite.close());
