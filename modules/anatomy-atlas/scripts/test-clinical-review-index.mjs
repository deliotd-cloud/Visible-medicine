import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from './workspace-test-build.mjs';
import bindings from '../content/nested-review-bindings.json' with { type: 'json' };

const built = await build({ stdin: { resolveDir: process.cwd(), contents: `
export * from './lib/clinical-review-index';
export * from './lib/clinical-review-pilot';
export {structures} from './app/anatomy-data';
export {bodyReviewSummaries} from './lib/body-review-material';
export {nestedReviewRows} from './lib/nested-review-material';
export {specimenReviewRows} from './lib/specimen-review-material';
` }, bundle: true, write: false, platform: 'node', format: 'esm' });
const api = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
const { clinicalReviewEntries: entries, clinicalReviewScopes: scopes, findClinicalReviewEntries: find, clinicalReviewHref: href } = api;

test('all public rows are represented once with exact scoped links', () => {
  const counts = { shoulder: api.structures.length, body: api.bodyReviewSummaries.length,
    nested: api.nestedReviewRows.reduce((n, r) => n + r.surfaces.length, 0),
    specimens: api.specimenReviewRows.reduce((n, r) => n + r.surfaces.length, 0) };
  assert.equal(entries.length, Object.values(counts).reduce((a, b) => a + b, 0));
  assert.equal(new Set(entries.map(e => e.key)).size, entries.length);
  assert.deepEqual(scopes.map(s => s.id), Object.keys(counts));
  for (const s of scopes) { assert.equal(entries.filter(e => e.scope === s.id).length, counts[s.id]); assert(s.label && s.description); }
  for (const e of entries) {
    assert(e.key.startsWith(e.scope + ':')); assert(e.name && e.context && e.id && e.laterality);
    const url = new URL(e.href, 'https://synthetic.invalid'); assert.equal(url.origin, 'https://synthetic.invalid');
    assert.equal(url.searchParams.get('structure'), e.id);
    assert.equal(url.pathname, scopes.find(s => s.id === e.scope).href);
    if (e.scope === 'nested') {
      const row = api.nestedReviewRows.find(r => r.parentId === url.searchParams.get('parent') && r.study === url.searchParams.get('study'));
      assert(row.surfaces.some(s => s.id === e.id && s.laterality === e.laterality));
      const group = bindings.groups.find(g => g.key === row.key);
      assert.equal(url.searchParams.get('source'), group.selections.find(s => s.id === e.id).sourceToken);
    } else if (e.scope === 'specimens') {
      const row = api.specimenReviewRows.find(r => r.key === url.searchParams.get('specimen'));
      assert(row.surfaces.some(s => s.id === e.id && s.laterality === e.laterality)); assert(e.context.includes(row.name));
    } else {
      const rows = e.scope === 'shoulder' ? api.structures : api.bodyReviewSummaries;
      assert.equal(rows.find(s => s.id === e.id).laterality, e.laterality);
    }
  }
  console.log(JSON.stringify({ publicEntries: entries.length, counts }));
});
test('case-insensitive AND search spans names, identifiers, FMA, context and laterality', () => {
  for (const scope of scopes) {
    const first = entries.find(e => e.scope === scope.id);
    const result = find({ q: first.id.toUpperCase() + ' ' + first.laterality.toUpperCase(), scope: scope.id });
    assert(result.entries.some(e => e.key === first.key)); assert(result.entries.every(e => e.scope === scope.id));
  }
  const body = api.bodyReviewSummaries.find(s => s.fmaId);
  assert(find({ q: body.fmaId, scope: 'body' }).entries.some(e => e.id === body.id));
  assert.equal(find({ q: 'utterly-absent-synthetic-token' }).total, 0);
  assert.equal(find({ q: 'utterly-absent-synthetic-token' }).pageCount, 1);
  const shared = api.structures.find(s => api.bodyReviewSummaries.some(b => b.id === s.id));
  if (shared) assert.deepEqual(find({ q: shared.id }).entries.filter(e => ['body', 'shoulder'].includes(e.scope)).map(e => e.scope), ['shoulder', 'body']);
});
test('pagination is human one-based, clamped, deterministic and complete', () => {
  const first = find(); assert.equal(first.pageSize, 12); assert.equal(first.page, 1); assert.equal(first.entries.length, 12);
  const collected = [];
  for (let p = 1; p <= first.pageCount; p++) collected.push(...find({ page: String(p) }).entries.map(e => e.key));
  assert.deepEqual(collected, entries.map(e => e.key));
  assert.equal(find({ page: Number.MAX_SAFE_INTEGER }).page, first.pageCount);
  for (const bad of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '0', '-1', '1.5', '1e2', ['2'], {}, null]) assert.equal(find({ page: bad }).page, 1);
  const copy = find(); copy.entries[0].name = 'foreign'; assert.notEqual(find().entries[0].name, 'foreign');
});

test('starter sample preserves exact scope, batch order and current links without duplicating the catalogue', () => {
  const result = find({ scope: 'pilot', page: '99' });
  assert.equal(result.total, 11); assert.equal(result.page, 1); assert.equal(result.pageCount, 1);
  assert.deepEqual(result.entries.map(e => e.scope), [...Array(9).fill('body'), 'nested', 'nested']);
  assert.deepEqual(result.entries.slice(0, 9).map(e => e.id), api.reviewPilotRoots.map(r => r[1]));
  assert.deepEqual(result.entries.slice(9).map(e => e.id), api.reviewPilotNested.map(r => r[3]));
  for (const e of result.entries) assert.deepEqual(e, entries.find(row => row.key === e.key));
  assert.equal(find({scope:'pilot',q:'left femur'}).total,1);
  assert.equal(find({scope:'pilot',q:'Achilles'}).total,0);
  assert.equal(href({scope:'pilot',page:99}),'/review/overview?scope=pilot');
  assert.equal(href({scope:'pilot',q:'left femur'}),'/review/overview?q=left+femur&scope=pilot');
  const key = result.entries[0].key;
  assert.throws(()=>api.resolveReviewPilot(entries.filter(e=>e.key!==key)),/Starter review identity/);
  assert.throws(()=>api.resolveReviewPilot([...entries,result.entries[0]]),/Starter review identity/);
  // A refreshed source token is read from the live catalogue, never the old JSON snapshot.
  const nested = result.entries[9];
  const refreshed = api.resolveReviewPilot(entries.map(e=>e.key===nested.key?{...e,href:e.href+'&test=current'}:e));
  assert.equal(refreshed[9].href,nested.href+'&test=current');
  assert(!('approval' in result));
});

test('familiar anatomy names retain exact source, scope and side rather than merging models', () => {
  const tendons = api.bodyReviewSummaries.filter(s => ['FMA258847','FMA264844'].includes(s.fmaId));
  assert.equal(tendons.length,2);
  for (const q of ['Achilles','Achilles tendon','ACHILLÉS TENDON','Achilles’ tendon']) {
    assert.deepEqual(find({q,scope:'body'}).entries.map(e=>e.id).sort(),tendons.map(s=>s.id).sort());
  }
  for (const side of ['left','right']) {
    const result=find({q:side+' Achilles',scope:'body'});
    assert.equal(result.total,1); assert.equal(result.entries[0].laterality,side);
    assert.equal(new URL(result.entries[0].href,'https://synthetic.invalid').searchParams.get('structure'),tendons.find(s=>s.laterality===side).id);
  }
  const all=find({q:'Achilles'});
  assert.equal(all.entries.filter(e=>e.scope==='body').length,2);
  assert(all.entries.some(e=>e.scope==='specimens'));
  assert.equal(new Set(all.entries.map(e=>e.key)).size,all.total);
  assert.equal(find({q:'Achilles',scope:'nested'}).total,0);
  assert.equal(find({q:'Achilles rupture',scope:'body'}).total,0);
  assert.equal(find({q:'shoulder blade',scope:'shoulder'}).entries[0].name,'Scapula');
  assert.equal(find({q:'collarbone',scope:'body'}).total,2);
  assert.equal(find({q:'CN IV',scope:'body'}).total,2);
  assert(find({q:'CN IV',scope:'body'}).entries.every(e=>e.name.toLowerCase().includes('trochlear')));
});
test('query params discard nonstrings and canonically encode hostile text', () => {
  for (const bad of [[], ['name'], {}, null, 4, true]) { assert.equal(find({ q: bad }).q, ''); assert.equal(find({ scope: bad }).scope, 'all'); }
  assert.equal(find({ scope: 'unknown' }).scope, 'all'); assert.equal(find({ q: '  ' + 'a'.repeat(200) + '  ' }).q.length, 160);
  assert.equal(href(), '/review/overview');
  const hostile = '<script> /?&=#" 日本語';
  const url = new URL(href({ q: '  ' + hostile + '  ', scope: 'nested', page: 2 }), 'https://synthetic.invalid');
  assert.equal(url.pathname, '/review/overview'); assert.equal(url.searchParams.get('q'), hostile); assert.equal(url.searchParams.get('scope'), 'nested');
  assert.equal(url.hash, ''); assert.equal(url.searchParams.get('page'), null, 'empty search clamps to page one');
  const paged = new URL(href({ scope: 'body', page: 2 }), 'https://synthetic.invalid'); assert.equal(paged.searchParams.get('page'), '2');
  assert.equal(href({ q: [], scope: {}, page: ['2'] }), '/review/overview');
});
test('missing or mismatched nested bindings fail closed rather than omit rows', async () => {
  for (const mutate of [b => b.groups.pop(), b => b.groups[0].selections.pop(),
    b => { b.groups[0].parent.id = 'foreign'; }, b => { b.groups[0].selections[0].sourceToken = 'invalid'; }]) {
    const bad = structuredClone(bindings); mutate(bad); let overridden = 0;
    const result = await build({ stdin: { resolveDir: process.cwd(), contents: "export * from './lib/clinical-review-index';" },
      bundle: true, write: false, platform: 'node', format: 'esm', plugins: [{ name: 'synthetic-binding-mismatch', setup(builder) {
        builder.onLoad({ filter: /nested-review-bindings\.json$/, namespace: 'workspace-test' }, () => {
          overridden++; return { contents: JSON.stringify(bad), loader: 'json' };
        });
      } }] });
    assert.equal(overridden, 1);
    await assert.rejects(import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')), /Nested review|nested review/);
  }
});
