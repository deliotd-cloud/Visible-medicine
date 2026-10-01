import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, relative } from 'node:path';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';
import {
  nestedBeforeCTOrientation, nestedCTOrientationIds, nestedCTOrientationReferenceKeys,
} from './nested-ct-orientation-history.mjs';

const base = '31a6ae7d0a823374b97c21cd7e810070e056d352';
const old = path => execFileSync('git', ['show', `${base}:${path}`], { maxBuffer: 16e6 });
const copy = value => JSON.parse(JSON.stringify(value));
const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const entry = `export * from './content/nested-teaching';
export * from './lib/nested-teaching';
export * from './lib/nested-review-material';
export * from './lib/nested-review';
export * from './lib/nested-review-api';
export { NestedTeaching } from './app/nested-teaching';`;

async function load(previous = false) {
  const result = await build({
    stdin: { contents: entry, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, platform: 'node', format: 'cjs',
    plugins: previous ? [{ name: 'exact-pre-ct-source', setup(api) {
      api.onLoad({ filter: /(?:nested-teaching\.ts|body-renderer-revision\.json)$/, namespace: 'component-test' }, args => {
        const path = relative(process.cwd(), args.path).replaceAll('\\', '/');
        if (!['content/nested-teaching.ts', 'content/body-renderer-revision.json'].includes(path)) return;
        return { contents: old(path).toString('utf8'), resolveDir: dirname(args.path),
          loader: path.endsWith('.json') ? 'json' : 'ts' };
      });
    } }] : [],
  });
  const module = { exports: {} };
  runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require,
    crypto, TextEncoder, TextDecoder, URL, URLSearchParams, structuredClone,
    Request, Response, console });
  return module.exports;
}

const api = await load(), previous = await load(true);
const restored = nestedBeforeCTOrientation(api);
assert.notEqual(restored, api, 'The five authored CT lessons must be present');
assert.deepEqual(copy(restored.nestedConcepts), copy(previous.nestedConcepts),
  'Only the five missing CT fields may change');
assert.deepEqual(copy(restored.nestedTeachingReferences), copy(previous.nestedTeachingReferences),
  'Only the four CT reference keys may change');
assert.equal(nestedBeforeCTOrientation(restored), restored);

const medicalReferenceWords = new Map(nestedCTOrientationReferenceKeys
  .filter(key => key !== 'nestedCTReuseLicense').map(key => [key, 0]));
for (const id of nestedCTOrientationIds) {
  const ct = api.nestedConcepts.find(concept => concept.id === id).imaging.ct;
  assert.equal(ct.readiness, 'draft');
  assert(ct.references.includes('nestedCTReuseLicense'));
  for (const key of ct.references.filter(key => key !== 'nestedCTReuseLicense')) {
    assert(medicalReferenceWords.has(key), `Unexpected CT reference ${key}`);
    medicalReferenceWords.set(key, medicalReferenceWords.get(key) + ct.body.trim().split(/\s+/u).length);
  }
}
for (const [key, words] of medicalReferenceWords) {
  assert(words > 0, `${key} must support a CT note`);
  assert(words <= 200, `${key} exceeds the conservative source-word budget`);
}

for (const id of nestedCTOrientationIds) {
  const altered = copy({ nestedConcepts: api.nestedConcepts,
    nestedTeachingReferences: api.nestedTeachingReferences });
  altered.nestedConcepts.find(concept => concept.id === id).imaging.ct.body += ' foreign';
  assert.throws(() => nestedBeforeCTOrientation(altered), /Unrecorded/);
}
for (const key of nestedCTOrientationReferenceKeys) {
  const altered = copy({ nestedConcepts: api.nestedConcepts,
    nestedTeachingReferences: api.nestedTeachingReferences });
  altered.nestedTeachingReferences[key].url += '?foreign=1';
  assert.throws(() => nestedBeforeCTOrientation(altered), /Unrecorded/);
}

for (const path of [
  'content/nested-teaching-bindings.v1.json', 'content/nested-review-bindings.json',
  'content/femoral-component-teaching-bindings.v1.json',
  'public/models/bodyparts3d/full-body/catalog.json',
  'lib/nested-teaching.ts', 'lib/nested-review-api.ts',
  'lib/nested-review-material.ts', 'app/nested-teaching.tsx',
]) assert.deepEqual(await readFile(path), old(path), `${path} preserved`);

const changedIds = new Set(nestedCTOrientationIds);
const storage = { prepare() { throw Error('Stale request reached storage'); } };
let contexts = 0, changed = 0, unchanged = 0, staleRejects = 0;
let rendererGeometryChanged = 0, staleGeometryRejects = 0;
let unnamedPending = 0, remainderPending = 0;
const currentRenderer = JSON.parse(await readFile('content/body-renderer-revision.json'));
const previousRenderer = JSON.parse(old('content/body-renderer-revision.json'));
const placements = new Map(nestedCTOrientationIds.map(id => [id, 0]));
for (const group of api.nestedReviewRows) for (const row of group.surfaces) {
  const packet = await api.nestedReviewMaterial(group.key, row.id);
  const before = await previous.nestedReviewMaterial(group.key, row.id);
  assert(packet && before, 'Source-bound review packet exists in both states');
  assert.deepEqual(copy(packet.source), copy(before.source));
  assert.equal(packet.context.sourceHash, before.context.sourceHash);
  assert.equal(packet.context.rendererHash, currentRenderer.sha256);
  assert.equal(before.context.rendererHash, previousRenderer.sha256);
  assert.deepEqual(copy(packet.context.blockers), copy(before.context.blockers));
  assert.equal(packet.context.revisions.imaging, null);
  assert.equal(before.context.revisions.imaging, null);
  if (packet.context.rendererHash !== before.context.rendererHash) {
    assert.notEqual(packet.context.revisions.geometry, before.context.revisions.geometry);
    assert.notEqual(packet.context.materialHash, before.context.materialHash);
    rendererGeometryChanged++;
    const c = packet.context;
    const staleGeometry = { catalogScope: c.catalogScope, nestedKey: c.nestedKey,
      sourceFrame: c.sourceFrame, structureId: c.structureId, track: 'geometry',
      expectedVersion: 0, materialHash: c.materialHash,
      revisionHash: before.context.revisions.geometry,
      checklistVersion: c.checklistVersion, draft: api.blankNestedReview(c, 'geometry') };
    const response = await api.postNestedReview(new Request('https://atlas.test/api/nested-review', {
      method: 'POST', headers: { Origin: 'https://atlas.test', 'Content-Type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_TEST_ONLY' },
      body: JSON.stringify(staleGeometry),
    }), storage);
    assert.equal(response.status, 409);
    staleGeometryRejects++;
  } else {
    assert.equal(packet.context.revisions.geometry, before.context.revisions.geometry);
  }
  contexts++;
  const concept = packet.teaching.concept;
  if (!changedIds.has(concept?.id)) {
    assert.deepEqual(copy(packet.teaching), copy(before.teaching));
    assert.equal(packet.context.teachingHash, before.context.teachingHash);
    assert.equal(packet.context.revisions.teaching, before.context.revisions.teaching);
    assert.deepEqual(copy(packet.context.teachingTabs), copy(before.context.teachingTabs));
    unchanged++;
    if (group.study === 'cranial-artery-components') {
      assert.equal(concept, null);
      assert.equal(packet.teaching.topics.find(t => t.tab === 'ct').readiness, 'pending');
      unnamedPending++;
    }
    if (group.study === 'femoral-components' && /remainder/i.test(row.name)) {
      assert.equal(packet.teaching.topics.find(t => t.tab === 'ct').readiness, 'pending');
      remainderPending++;
    }
    continue;
  }
  changed++;
  assert.equal(before.teaching.concept.imaging?.ct, undefined);
  assert.notEqual(packet.context.teachingHash, before.context.teachingHash);
  assert.notEqual(packet.context.revisions.teaching, before.context.revisions.teaching);
  assert.notEqual(packet.context.materialHash, before.context.materialHash);
  const parent = packet.source.parent, selected = packet.source.structure;
  assert.deepEqual(copy(api.nestedTeachingFor(parent, group.study, selected)), copy(concept));
  const lesson = api.nestedTopicLesson(concept, 'ct');
  assert.equal(lesson.readiness, 'draft');
  assert.match(lesson.note, /No scan access or synchronization/);
  assert(lesson.citations?.length > 0);
  assert(lesson.citations.includes('https://creativecommons.org/licenses/by/4.0/'));
  const html = renderToStaticMarkup(React.createElement(api.NestedTeaching,
    { parent, study: group.study, selected, initialTopic: 'ct' }));
  const encoded = renderToStaticMarkup(React.createElement('span', null, lesson.body)).slice(6, -7);
  assert(html.includes(encoded));
  for (const url of lesson.citations) assert(html.includes(url));
  assert.equal(packet.teaching.topics.find(t => t.tab === 'ct').body, lesson.body);
  assert(packet.context.teachingTabs.includes('ct'));
  placements.set(concept.id, placements.get(concept.id) + 1);

  for (const mutate of [s => { s.fmaId = 'FMA0'; },
    s => { s.laterality = 'unknown'; },
    s => { s.sources[0].sha256 = '0'.repeat(64); }]) {
    const foreign = copy(selected); mutate(foreign);
    assert.equal(api.nestedTeachingFor(parent, group.study, foreign), null);
  }
  for (const mutate of [p => { p.fmaId = 'FMA0'; },
    p => { p.sources[0].sha256 = '0'.repeat(64); }]) {
    const foreign = copy(parent); mutate(foreign);
    assert.equal(api.nestedTeachingFor(foreign, group.study, selected), null);
  }
  const c = packet.context, prior = before.context;
  const payload = { catalogScope: c.catalogScope, nestedKey: c.nestedKey,
    sourceFrame: c.sourceFrame, structureId: c.structureId, track: 'teaching', expectedVersion: 0,
    materialHash: c.materialHash, revisionHash: c.revisions.teaching,
    checklistVersion: c.checklistVersion, draft: api.blankNestedReview(c, 'teaching') };
  for (const delta of [{ materialHash: prior.materialHash },
    { revisionHash: prior.revisions.teaching }, { sourceFrame: 'foreign-frame' }]) {
    const response = await api.postNestedReview(new Request('https://atlas.test/api/nested-review', {
      method: 'POST', headers: { Origin: 'https://atlas.test', 'Content-Type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_TEST_ONLY' },
      body: JSON.stringify({ ...payload, ...delta }),
    }), storage);
    assert.equal(response.status, 409);
    staleRejects++;
  }
}
assert.equal(contexts, 108);
assert.equal(changed, 9);
assert.equal(unchanged, 99);
assert.equal(staleRejects, 27);
assert.equal(rendererGeometryChanged, currentRenderer.sha256 === previousRenderer.sha256 ? 0 : 108);
assert.equal(staleGeometryRejects, rendererGeometryChanged);
assert.equal(unnamedPending, 29);
assert.equal(remainderPending, 2);
assert.deepEqual(Object.fromEntries(placements), {
  'inferior-collicular-brachia': 2,
  'cerebral-superior-temporal-anterior': 2,
  'cerebral-superior-temporal-posterior': 2,
  'visual-optic-chiasm': 1,
  'visual-optic-tracts': 2,
});
console.log(JSON.stringify({ passed: true, baseline: base, CTConcepts: nestedCTOrientationIds.length,
  placements: Object.fromEntries(placements), sourceContextsUnchanged: contexts,
  teachingChanged: changed, teachingUnchanged: unchanged,
  staleRejectedBeforeStorage: staleRejects, rendererGeometryChanged,
  staleGeometryRejectedBeforeStorage: staleGeometryRejects, unnamedPending, remainderPending,
  medicalReferenceWords: Object.fromEntries(medicalReferenceWords),
  clinicalApproval: false, acquiredImages: false }));
