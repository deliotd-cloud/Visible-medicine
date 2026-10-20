import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { build } from './workspace-test-build.mjs';

// Inject controllable source promises at the queue's call sites. The normal
// material functions remain available in this same bundle for parity checks.
const source = await readFile('lib/clinical-review-queue.ts', 'utf8');
const injected = source
  .replace('bodyReviewContext(entry.id)',
    '(globalThis.__reviewBody ? globalThis.__reviewBody(entry.id) : bodyReviewContext(entry.id))')
  .replace('nestedReviewMaterial(sourceKey, id)',
    '(globalThis.__reviewNested ? globalThis.__reviewNested(sourceKey, id) : nestedReviewMaterial(sourceKey, id))')
  .replace('specimenReviewMaterial(sourceKey, id)',
    '(globalThis.__reviewSpecimen ? globalThis.__reviewSpecimen(sourceKey, id) : specimenReviewMaterial(sourceKey, id))');
assert.notEqual(injected, source);
const built = await build({
  stdin: { contents: `export * from './lib/clinical-review-queue'; export * from './lib/clinical-review-index';
    export * from './lib/body-review-context'; export * from './lib/nested-review-material';
    export * from './lib/specimen-review-material';`, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, platform: 'node', format: 'esm',
  plugins: [{ name: 'controlled-queue-material', setup(api) {
    api.onLoad({ filter: /[\\/]lib[\\/]clinical-review-queue\.ts$/, namespace: 'workspace-test' },
      () => ({ contents: injected, loader: 'ts', resolveDir: process.cwd() + '/lib' }));
  } }],
});
const api = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
const request = (query, user = 'synthetic-reviewer') => new Request('https://atlas.test/api/review-overview' + query,
  { headers: user ? { 'oai-authenticated-user-id': user } : {} });
const emptyDb = { prepare() { return { bind() { return { async all() { return { results: [] }; } }; } }; } };
const failedDb = { prepare() { throw Error('PRIVATE DB DETAIL'); } };
const sources = {
  body: ['__reviewBody', id => api.bodyReviewContext(id)],
  nested: ['__reviewNested', (sourceKey, id) => api.nestedReviewMaterial(sourceKey, id)],
  specimens: ['__reviewSpecimen', (sourceKey, id) => api.specimenReviewMaterial(sourceKey, id)],
};
const contextOf = (scope, material) => scope === 'body' ? material : material.context;
const queryFor = entry => '?scope=' + entry.scope + '&q=' + encodeURIComponent(entry.id);
const collect = () => {
  const captured = new Map();
  return { captured, observe(key, revisions) {
    assert(!captured.has(key), 'each selection observed exactly once');
    captured.set(key, revisions);
  } };
};

test('non-shoulder responses and reasons match; one original lookup per canonical selection and minimal cloned hashes', async () => {
  for (const scope of ['body', 'nested', 'specimens']) {
    const entry = api.findClinicalReviewEntries({ scope }).entries[0];
    const query = queryFor(entry);
    const baseline = await api.getClinicalReviewQueueWithReasons(request(query), emptyDb);
    const baselineJson = await baseline.json();
    const [hook, original] = sources[scope];
    let lookups = 0, originalContext, originalRevisions;
    globalThis[hook] = async (...args) => {
      lookups++;
      const result = await original(...args);
      const selection = scope === 'body' ? [entry.id] : JSON.parse(entry.key.slice(scope.length + 1));
      if (JSON.stringify(args) === JSON.stringify(selection)) {
        originalContext = contextOf(scope, result);
        originalRevisions = structuredClone(originalContext.revisions);
      }
      return result;
    };
    try {
      const { captured, observe } = collect();
      const response = await api.getClinicalReviewQueueWithReasons(request(query), emptyDb, observe);
      assert.equal(response.status, baseline.status);
      assert.deepEqual(await response.json(), baselineJson);
      assert.equal(lookups, baselineJson.items.length);
      assert.deepEqual([...captured.keys()], baselineJson.items.map(item => item.key));
      const hashes = await captured.get(entry.key);
      assert.deepEqual(hashes, { geometry: originalContext.revisions.geometry,
        teaching: originalContext.revisions.teaching });
      assert.deepEqual(Object.keys(hashes), ['geometry', 'teaching']);
      assert.notStrictEqual(hashes, originalContext.revisions);
      assert.deepEqual(originalContext.revisions, originalRevisions);
      assert(!JSON.stringify(hashes).includes('checklist'));
      assert(!JSON.stringify(baselineJson).includes(hashes.geometry));
    } finally { delete globalThis[hook]; }
  }
});

test('auth, invalid parameters and missing DB return before any observer callback or material lookup', async () => {
  let calls = 0;
  globalThis.__reviewBody = () => { calls++; throw Error('material called'); };
  try {
    for (const [req, db, expected] of [
      [request('?scope=body', ''), emptyDb, 401],
      [request('?scope=body&scope=body'), emptyDb, 400],
      [request('?user=foreign'), emptyDb, 400],
      [request('?scope=body'), undefined, 503],
    ]) {
      const response = await api.getClinicalReviewQueueWithReasons(req, db, () => { calls++; });
      assert.equal(response.status, expected);
    }
    assert.equal(calls, 0);
    const shoulder = await api.getClinicalReviewQueueWithReasons(request('?scope=shoulder'), emptyDb,
      () => { calls++; });
    assert.equal(shoulder.status, 200);
    assert.equal(calls, 0);
    const publicResponse = await api.getClinicalReviewQueue(request('?scope=shoulder'), emptyDb);
    assert.equal(publicResponse.status, 200);
    assert(!JSON.stringify(await publicResponse.json()).includes('revisionHash'));
  } finally { delete globalThis.__reviewBody; }
});

test('failed and pending source promises settle observer to null without changing unavailable status', async () => {
  const entry = api.findClinicalReviewEntries({ scope: 'body' }).entries[0];
  const query = queryFor(entry);
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  globalThis.__reviewBody = () => pending;
  try {
    const { captured, observe } = collect();
    const responsePromise = api.getClinicalReviewQueueWithReasons(request(query), emptyDb, observe);
    await Promise.resolve();
    assert(captured.has(entry.key));
    release(null);
    assert.equal((await captured.get(entry.key)), null);
    const response = await responsePromise;
    assert.equal((await response.json()).items.find(item => item.key === entry.key).geometry, 'unavailable');
    globalThis.__reviewBody = () => Promise.reject(Error('PRIVATE SOURCE DETAIL'));
    const failed = collect();
    const failedResponse = await api.getClinicalReviewQueueWithReasons(request(query), emptyDb, failed.observe);
    assert.equal(await failed.captured.get(entry.key), null);
    const text = await failedResponse.text();
    assert(!text.includes('PRIVATE SOURCE DETAIL'));
    assert.equal(JSON.parse(text).items.find(item => item.key === entry.key).geometry, 'unavailable');
  } finally { delete globalThis.__reviewBody; }
});

test('DB failure can complete queue before material; observer still resolves original valid hashes', async () => {
  const entry = api.findClinicalReviewEntries({ scope: 'body' }).entries[0];
  const real = await api.bodyReviewContext(entry.id);
  let release;
  globalThis.__reviewBody = () => new Promise(resolve => { release = resolve; });
  try {
    const { captured, observe } = collect();
    const response = await api.getClinicalReviewQueueWithReasons(request(queryFor(entry)), failedDb, observe);
    const data = await response.json();
    assert.equal(data.items.find(item => item.key === entry.key).geometry, 'unavailable');
    assert(captured.has(entry.key));
    release(real);
    assert.deepEqual(await captured.get(entry.key), { geometry: real.revisions.geometry,
      teaching: real.revisions.teaching });
    assert(!JSON.stringify(data).includes(real.revisions.geometry));
  } finally { delete globalThis.__reviewBody; }
});
