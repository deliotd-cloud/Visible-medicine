import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, relative } from 'node:path';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';
import { eyeCrossSectionalScope, nestedBeforeEyeCrossSectional } from './eye-cross-sectional-history.mjs';
const base = '43072a948beda597e7a62439e8c093aa76cb94a7';
const old = path => execFileSync('git', ['show', base + ':' + path], { maxBuffer: 16e6 });
const copy = value => JSON.parse(JSON.stringify(value));
const require = createRequire(import.meta.url), React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const entry = `export * from './content/nested-teaching';
export * from './lib/nested-teaching';export * from './lib/nested-review-material';
export * from './lib/nested-review';export * from './lib/nested-review-api';
export {eyeCatalog} from './lib/eye-layers';
export {NestedTeaching} from './app/nested-teaching';`;
async function load(previous = false) {
  // Immutable eye milestone; the new live CT delta is checked independently
  // against this saved complete corpus by validate-nested-ct-orientation.mjs.
  const saved = previous ? base : '31a6ae7d0a823374b97c21cd7e810070e056d352';
  const result = await build({ stdin: { contents: entry, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, platform: 'node', format: 'cjs',
    plugins: [{ name: 'exact-saved-content', setup(api) {
      api.onLoad({ filter: /(?:nested-teaching\.ts|body-renderer-revision\.json)$/, namespace: 'component-test' }, args => {
        const path = relative(process.cwd(), args.path).replaceAll('\\', '/');
        if (!['content/nested-teaching.ts', 'content/body-renderer-revision.json'].includes(path)) return;
        return { contents: execFileSync('git', ['show', saved + ':' + path], { maxBuffer: 16e6 }).toString('utf8'), resolveDir: dirname(args.path),
          loader: path.endsWith('.json') ? 'json' : 'ts' };
      });
    } }] });
  const module = { exports: {} };
  runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require,
    crypto, TextEncoder, TextDecoder, URL, URLSearchParams, structuredClone, Request, Response, console });
  return module.exports;
}
const api = await load(), previous = await load(true);
const restored = nestedBeforeEyeCrossSectional(api);
assert.deepEqual(copy(restored.nestedConcepts), copy(previous.nestedConcepts), 'Only 12 missing topics added');
assert.deepEqual(copy(restored.nestedTeachingReferences), copy(previous.nestedTeachingReferences));
assert.equal(nestedBeforeEyeCrossSectional(restored), restored);
const altered = copy({ nestedConcepts: api.nestedConcepts, nestedTeachingReferences: api.nestedTeachingReferences });
altered.nestedConcepts.find(c => c.id === 'eye-cornea').imaging.ct.body += ' foreign';
assert.throws(() => nestedBeforeEyeCrossSectional(altered), /Unrecorded/);
for (const path of ['content/eye-imaging-teaching.ts', 'content/nested-teaching-bindings.v1.json',
  'content/nested-review-bindings.json', 'public/models/bodyparts3d/eye-layers/catalog.json',
  'public/models/bodyparts3d/full-body/catalog.json', 'lib/nested-teaching.ts',
  'lib/nested-review-api.ts', 'lib/nested-review-material.ts', 'app/nested-teaching.tsx'])
  assert.deepEqual(await readFile(path), old(path), path + ' preserved');
let contexts = 0, changed = 0, unchanged = 0, placements = 0, staleRejects = 0;
const storage = { prepare() { throw Error('Stale request reached storage'); } };
for (const group of api.nestedReviewRows) for (const row of group.surfaces) {
  const packet = await api.nestedReviewMaterial(group.key, row.id);
  const before = await previous.nestedReviewMaterial(group.key, row.id);
  assert.deepEqual(copy(packet.source), copy(before.source));
  assert.equal(packet.context.sourceHash, before.context.sourceHash);
  assert.equal(packet.context.revisions.imaging, null);
  assert.deepEqual(copy(packet.context.blockers), copy(before.context.blockers));
  const concept = packet.teaching.concept, topics = eyeCrossSectionalScope[concept?.id];
  contexts++;
  if (!topics) {
    assert.deepEqual(copy(packet.teaching), copy(before.teaching));
    assert.equal(packet.context.teachingHash, before.context.teachingHash); unchanged++; continue;
  }
  changed++;
  assert.notEqual(packet.context.teachingHash, before.context.teachingHash);
  assert.notEqual(packet.context.revisions.teaching, before.context.revisions.teaching);
  assert.notEqual(packet.context.materialHash, before.context.materialHash);
  const selected = packet.source.structure, parent = packet.source.parent;
  assert.deepEqual(copy(api.nestedTeachingFor(parent, 'eye', selected)), copy(concept));
  for (const topic of topics) {
    assert.equal(before.teaching.concept.imaging?.[topic], undefined);
    const lesson = api.nestedTopicLesson(concept, topic);
    assert.equal(lesson.readiness, 'draft');
    assert.match(lesson.note, /No scan access or synchronization/);
    assert(lesson.citations.includes('https://creativecommons.org/licenses/by/4.0/'));
    const html = renderToStaticMarkup(React.createElement(api.NestedTeaching,
      { parent, study: 'eye', selected, initialTopic: topic }));
    // React escapes apostrophes and &, so compare its actual text-node encoding.
    const encoded = renderToStaticMarkup(React.createElement('span', null, lesson.body)).slice(6, -7);
    assert(html.includes(encoded));
    for (const url of lesson.citations) assert(html.includes(url));
    assert(packet.context.teachingTabs.includes(topic)); placements++;
  }
  if (concept.id === 'eye-chamber') {
    assert.equal(selected.laterality, 'left');
    for (const topic of topics) assert.match(concept.imaging[topic].body, /left/i);
  }
  for (const mutate of [s => s.fmaId = 'FMA0', s => s.laterality = 'unknown', s => s.sources[0].sha256 = '0'.repeat(64)]) {
    const foreign = copy(selected); mutate(foreign);
    assert.equal(api.nestedTeachingFor(parent, 'eye', foreign), null);
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
        'oai-authenticated-user-id': 'SYNTHETIC_TEST_ONLY' }, body: JSON.stringify({ ...payload, ...delta }) }), storage);
    assert.equal(response.status, 409); staleRejects++;
  }
}
assert.equal(contexts, 108); assert.equal(changed, 13); assert.equal(unchanged, 95);
assert.equal(placements, 22); assert.equal(staleRejects, 39);
const emptyChamber = copy(api.eyeCatalog.structures.find(s => s.fmaId === 'FMA58082'));
assert(emptyChamber);
const chamberGroup = api.nestedReviewRows.find(g => g.study === 'eye' && g.surfaces.some(s => s.id === emptyChamber.id));
const chamberPacket = await api.nestedReviewMaterial(chamberGroup.key, emptyChamber.id);
emptyChamber.laterality = 'right';
assert.equal(api.nestedTeachingFor(chamberPacket.source.parent, 'eye', emptyChamber), null);
console.log(JSON.stringify({ passed: true, baseline: base, newNotes: 12, placements,
  sourceContextsUnchanged: contexts, teachingChanged: changed, teachingUnchanged: unchanged,
  staleRejectedBeforeStorage: staleRejects, clinicalApproval: false, acquiredImages: false }));
