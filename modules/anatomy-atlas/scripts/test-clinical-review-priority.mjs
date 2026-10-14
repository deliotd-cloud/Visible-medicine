import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { build } from './workspace-test-build.mjs';

const built = await build({ stdin: { contents: `
  export * from './lib/clinical-review-queue';
  export * from './lib/clinical-review-priority';
  export * from './lib/clinical-review-index';
  export * from './lib/review-change-reason';
  export * from './lib/body-review-context';
  export * from './lib/nested-review-material';
  export * from './lib/specimen-review-material';
  export * from './lib/specimen-links';
`, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const api = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
const sqlite = new DatabaseSync(':memory:');
for (const name of ['0000_shoulder_review_events', '0001_body_review_events', '0002_specimen_review_events', '0003_nested_review_events'])
  sqlite.exec(await readFile('drizzle/' + name + '.sql', 'utf8'));
const queries = [];
const db = { prepare(sql) { assert.match(sql.trimStart(), /^SELECT\b/); return { bind(...values) { return {
  async all() { queries.push([sql, values]); return { results: sqlite.prepare(sql).all(...values) }; },
}; } }; } };
const request = (query = '', user = 'synthetic-reviewer') => new Request('https://atlas.test/api/review-overview' + query,
  { headers: user ? { 'oai-authenticated-user-id': user } : {} });
const digest = (value, canonical = false) => createHash('sha256').update(canonical
  ? api.canonicalSpecimenValue(JSON.parse(JSON.stringify(value))) : JSON.stringify(value)).digest('hex');
const sortedReads = reads => reads.map(read => JSON.stringify(read)).sort();
const change = hash => (hash[0] === 'a' ? 'b' : 'a') + hash.slice(1);
const saved = (kind, context, track = 'geometry') => ({
  eventSchema: `vm-${kind}-review-event-1`, catalogScope: context.catalogScope,
  structureId: context.structureId, ...(kind === 'nested' ? { nestedKey: context.nestedKey, sourceFrame: context.sourceFrame } : {}),
  ...(kind === 'specimen' ? { specimenKey: context.specimenKey, sourceFrame: context.sourceFrame } : {}),
  track, revisionHash: context.revisions[track], checklistVersion: context.checklistVersion,
  checklist: structuredClone(context.checklists[track]),
  material: Object.fromEntries(['sourceHash', 'teachingHash', 'rendererHash', 'materialHash', 'teachingTabs']
    .map(key => [key, structuredClone(context[key])])),
});
const body = await api.bodyReviewContext(api.findClinicalReviewEntries({ scope: 'body' }).entries[0].id);
const nestedEntry = api.findClinicalReviewEntries({ scope: 'nested' }).entries[0];
const specimenEntry = api.findClinicalReviewEntries({ scope: 'specimens' }).entries[0];
const nested = (await api.nestedReviewMaterial(JSON.parse(nestedEntry.key.slice(7))[0], nestedEntry.id)).context;
const specimen = (await api.specimenReviewMaterial(JSON.parse(specimenEntry.key.slice(10))[0], specimenEntry.id)).context;
function insertHistory(kind, context, revision, version) {
  const record = { ...revision, version, savedAt: '2026-10-14T10:00:00.000Z', reviewedAt: null,
    status: 'draft', reviewer: 'PRIVATE SYNTHETIC REVIEWER', qualification: '', scope: '',
    notes: 'PRIVATE SYNTHETIC NOTE', evidence: [], issues: [], attested: false,
    checks: Object.fromEntries(context.checklists.geometry.map(check => [check.id, false])) };
  const table = kind === 'body' ? 'body_review_events' : `${kind}_review_events`;
  if (kind === 'body') sqlite.prepare(`INSERT INTO ${table} VALUES(?,?,?,?,?,?)`).run('synthetic-reviewer',
    context.structureId, 'geometry', version, JSON.stringify(record), record.savedAt);
  else sqlite.prepare(`INSERT INTO ${table} VALUES(?,?,?,?,?,?,?)`).run('synthetic-reviewer',
    kind === 'nested' ? context.nestedKey : context.specimenKey, context.structureId,
    'geometry', version, JSON.stringify(record), record.savedAt);
}

for (const [kind, context] of [['body', body], ['nested', nested], ['specimen', specimen]]) {
  test(`${kind}: only consistent scoped historical renderer revision earns viewer-only`, async () => {
    const old = saved(kind, context);
    const oldRenderer = change(context.rendererHash);
    old.material.rendererHash = oldRenderer;
    if (kind === 'body') {
      old.revisionHash = digest({ catalogScope: context.catalogScope, structureId: context.structureId,
        checklistVersion: context.checklistVersion, source: context.sourceHash, renderer: oldRenderer,
        checks: context.checklists.geometry });
    } else {
      const identity = { catalogScope: context.catalogScope,
        [kind === 'nested' ? 'nestedKey' : 'specimenKey']: context[kind === 'nested' ? 'nestedKey' : 'specimenKey'],
        sourceFrame: context.sourceFrame, structureId: context.structureId, checklistVersion: context.checklistVersion };
      old.revisionHash = digest({ identity, sourceHash: context.sourceHash, renderer: oldRenderer,
        checklist: context.checklists.geometry }, true);
      old.material.materialHash = digest({ identity, sourceHash: context.sourceHash,
        teachingHash: context.teachingHash, renderer: oldRenderer, checklist: context.checklists }, true);
    }
    assert.equal(await api.reviewChangeReason(kind, old, context, 'geometry'), 'viewer-only');
    for (const patch of [r => { r.revisionHash = change(r.revisionHash); },
      r => { r.material.materialHash = change(r.material.materialHash); },
      r => { r.structureId = 'foreign'; }, r => { r.material = null; }]) {
      const corrupt = structuredClone(old); patch(corrupt);
      assert.notEqual(await api.reviewChangeReason(kind, corrupt, context, 'geometry'), 'viewer-only');
    }
    const source = structuredClone(old); source.material.sourceHash = change(context.sourceHash);
    assert.equal(await api.reviewChangeReason(kind, source, context, 'geometry'), 'source-or-teaching');
    const teaching = structuredClone(old); teaching.material.teachingHash = change(context.teachingHash);
    assert.equal(await api.reviewChangeReason(kind, teaching, context, 'geometry'), 'source-or-teaching');
    const checklist = structuredClone(old); checklist.checklist[0].label += ' historical';
    assert.equal(await api.reviewChangeReason(kind, checklist, context, 'geometry'), 'other-review-material');
    assert.equal(await api.reviewChangeReason(kind, saved(kind, context), context, 'geometry'), 'unavailable');
    assert.equal(await api.reviewChangeReason(kind, saved(kind, context, 'teaching'), context, 'teaching'), 'unavailable');
  });
}

test('exact priority wire rejects identities, extra keys, malformed reasons and inherited enum names', () => {
  const good = { schema: 'vm-clinical-priority-1', scope: 'private-to-signed-in-user',
    items: [{ key: 'a', geometry: 're-review', teaching: 'not-started',
      geometryReason: 'viewer-only', teachingReason: null }] };
  assert.equal(api.parseClinicalPriorityPage(good, ['a'])[0].geometryReason, 'viewer-only');
  assert.throws(() => api.parseClinicalPriorityPage(good, ['a', 'a']));
  for (const bad of [null, { ...good, extra: true }, { ...good, schema: 'bad' },
    { ...good, items: [] }, { ...good, items: [...good.items, ...good.items] },
    { ...good, items: [{ ...good.items[0], key: 'b' }] },
    { ...good, items: [{ ...good.items[0], extra: true }] },
    { ...good, items: [{ ...good.items[0], geometryReason: 'toString' }] },
    { ...good, items: [{ ...good.items[0], teachingReason: 'viewer-only' }] },
    { ...good, items: [{ ...good.items[0], geometry: 'toString' }] }])
    assert.throws(() => api.parseClinicalPriorityPage(bad, ['a']));
});

test('opt-in and default share exact statuses, auth, query and bounded private SELECT reads', async () => {
  for (const query of ['?scope=shoulder', '?scope=body', '?scope=nested', '?scope=specimens']) {
    queries.length = 0;
    const legacy = await api.getClinicalReviewQueue(request(query), db);
    const firstReads = queries.splice(0);
    const priority = await api.getClinicalReviewQueueWithReasons(request(query), db);
    const secondReads = queries.splice(0);
    assert.equal(legacy.status, 200); assert.equal(priority.status, 200);
    assert.deepEqual(sortedReads(secondReads), sortedReads(firstReads));
    const left = (await legacy.json()).items;
    const raw = await priority.json();
    const right = api.parseClinicalPriorityPage(raw, left.map(item => item.key));
    assert.deepEqual(right.map(({ key, geometry, teaching }) => ({ key, geometry, teaching })), left);
    assert(right.every(row => row.geometryReason === null && row.teachingReason === null));
    assert.equal(priority.headers.get('cache-control'), 'private, no-store');
    assert(secondReads.every(([, values]) => values[0] === 'synthetic-reviewer'));
  }
  for (const req of [request('', ''), request('?user=foreign'), request('?scope=body&scope=body')]) {
    const count = queries.length;
    assert.equal((await api.getClinicalReviewQueueWithReasons(req, db)).status,
      (await api.getClinicalReviewQueue(req, db)).status);
    assert.equal(queries.length, count);
  }
  assert.equal((await api.getClinicalReviewQueueWithReasons(request(), undefined)).status, 503);
  const broken = { prepare() { throw Error('PRIVATE DATABASE DETAIL'); } };
  const failed = await (await api.getClinicalReviewQueueWithReasons(request('?scope=body'), broken)).json();
  assert(failed.items.every(row => row.geometry === 'unavailable' && row.geometryReason === null));
  assert(!JSON.stringify(failed).includes('PRIVATE DATABASE DETAIL'));
});
test('stored historical renderers preserve status projection and isolate private histories', async () => {
  for (const [kind, scope, context, entry] of [
    ['body', 'body', body, api.findClinicalReviewEntries({ scope: 'body' }).entries[0]],
    ['nested', 'nested', nested, nestedEntry],
    ['specimen', 'specimens', specimen, specimenEntry],
  ]) {
    const old = saved(kind, context), renderer = change(context.rendererHash);
    old.material.rendererHash = renderer;
    if (kind === 'body') old.revisionHash = digest({ catalogScope: context.catalogScope,
      structureId: context.structureId, checklistVersion: context.checklistVersion,
      source: context.sourceHash, renderer, checks: context.checklists.geometry });
    else {
      const identity = { catalogScope: context.catalogScope,
        [kind === 'nested' ? 'nestedKey' : 'specimenKey']: context[kind === 'nested' ? 'nestedKey' : 'specimenKey'],
        sourceFrame: context.sourceFrame, structureId: context.structureId, checklistVersion: context.checklistVersion };
      old.revisionHash = digest({ identity, sourceHash: context.sourceHash, renderer,
        checklist: context.checklists.geometry }, true);
      old.material.materialHash = digest({ identity, sourceHash: context.sourceHash,
        teachingHash: context.teachingHash, renderer, checklist: context.checklists }, true);
    }
    insertHistory(kind, context, old, 1);
    const query = '?scope=' + scope;
    queries.length = 0;
    const legacy = await (await api.getClinicalReviewQueue(request(query), db)).json();
    const firstReads = queries.splice(0);
    const priority = await (await api.getClinicalReviewQueueWithReasons(request(query), db)).json();
    const secondReads = queries.splice(0);
    assert.deepEqual(sortedReads(secondReads), sortedReads(firstReads));
    assert.deepEqual(priority.items.map(({ key, geometry, teaching }) => ({ key, geometry, teaching })), legacy.items);
    const row = priority.items.find(item => item.key === entry.key);
    assert.equal(row.geometry, 're-review'); assert.equal(row.geometryReason, 'viewer-only');
    assert.equal(row.teachingReason, null);
    assert(!JSON.stringify(priority).includes('PRIVATE SYNTHETIC'));
    const other = await (await api.getClinicalReviewQueueWithReasons(request(query, 'other-user'), db)).json();
    assert.equal(other.items.find(item => item.key === entry.key).geometry, 'not-started');
    const forged = structuredClone(old); forged.revisionHash = change(forged.revisionHash);
    insertHistory(kind, context, forged, 2);
    const latest = await (await api.getClinicalReviewQueueWithReasons(request(query), db)).json();
    const latestRow = latest.items.find(item => item.key === entry.key);
    assert.equal(latestRow.geometry, 're-review');
    assert.notEqual(latestRow.geometryReason, 'viewer-only');
  }
});
test.after(() => sqlite.close());
