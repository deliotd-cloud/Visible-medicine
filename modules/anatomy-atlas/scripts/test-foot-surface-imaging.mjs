import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const baseline = '88cea927d48729769b96ad8fe680b0872b7e6687';
const hash = value => createHash('sha256')
  .update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value))
  .digest('hex');
const pins = JSON.parse(readFileSync('content/foot-surface-imaging-pins.json'));
const transition = JSON.parse(readFileSync('content/foot-surface-imaging.transition.json'));
assert.equal(hash(pins), '8dddeb76bd3578bc9c8494ffed9c0d580ebd1ff2c1e11ad6b76f77932f2fda85');
assert.equal(hash(transition), '06521330390060e0b65b6a101ebf58b26183cc1b8d11db3751eacd27ac136bee');
assert.equal(pins.baseline, baseline);
assert.equal(transition.baseline, baseline);
assert.equal(transition.sourcePinsHash, hash(pins));

const before = await exactSourceHistoryApi(baseline, 'review-security');
const result = await build({
  stdin: {
    contents: "export * from './lib/foot-surface-imaging';export * from './content/foot-surface-imaging';export {bodyLesson,bodyContent} from './app/body-content';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {regionalTours} from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export * from './lib/body-review-api';export * from './lib/body-review-decisions';",
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const now = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const old = path => execFileSync('git', ['show', `${baseline}:${path}`], {windowsHide: true, maxBuffer: 32e6});
const catalog = now.bodyDisplayCatalog(JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json')));
assert.equal(catalog.structures.length, 1104);
assert.deepEqual(catalog, before.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json'))));
for (const key of ['structures', 'dissectionProfiles', 'regionalTours']) assert.deepEqual(now[key], before[key]);
const snapshot = api => ({
  catalog,
  body: catalog.structures.map(s => ({
    id: s.id,
    topics: Object.fromEntries(api.contentTabs.map(tab => [tab, api.bodyLesson(s, tab)])),
  })),
  shoulder: api.structures,
  recipes: api.dissectionProfiles,
});
assert.equal(hash(snapshot(before)), pins.beforeAllTeachingSnapshotHash);
const reconstructed = snapshot(now);
let changed = 0, preserved = 0, refusals = 0, malformed = 0, stale = 0, storageCalls = 0, worksheets = 0;
const entries = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
assert.equal(entries.size, 8);
for (const row of reconstructed.body) for (const tab of now.contentTabs) {
  const structure = catalog.structures.find(s => s.id === row.id);
  const entry = entries.get(structure.id);
  const prior = before.bodyLesson(structure, tab);
  const current = now.bodyLesson(structure, tab);
  if (entry && Object.hasOwn(entry.previous, tab)) {
    assert.equal(prior.readiness, 'pending');
    assert.equal(current.readiness, 'draft');
    assert.deepEqual(prior, entry.previous[tab]);
    assert.deepEqual(current, now.footSurfaceImagingLesson(structure, tab));
    const {readiness, ...shown} = current;
    assert.deepEqual(now.bodyContent(structure, tab), shown);
    assert.equal(hash(current), transition.entries.find(e => e.id === structure.id && e.tab === tab).draftHash);
    row.topics[tab] = prior;
    changed++;
  } else {
    assert.deepEqual(current, prior, `${structure.id}:${tab}`);
    preserved++;
  }
}
assert.equal(changed, 8);
assert.equal(preserved, 9928);
assert.equal(transition.entries.length, 8);
assert.equal(hash(reconstructed), pins.beforeAllTeachingSnapshotHash);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key]))
    : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
for (const {identity, previous, family} of pins.entries) {
  assert.deepEqual(catalog.structures.find(s => s.id === identity.id), identity);
  for (const tab of Object.keys(previous)) {
    const draft = now.footSurfaceImagingLesson(identity, tab);
    assert.equal(draft.readiness, 'draft');
    assert.match(draft.title, /evidence & limits.*draft/i);
    assert.match(draft.note, /revision-bound radiologist/i);
    assert.match(draft.note, /independent/i);
    assert.equal(draft.body, now.footSurfaceImagingTeaching[family][tab].body);
    const clean = structuredClone(draft);
    draft.bullets.push('foreign');
    draft.citations.push('foreign');
    assert.deepEqual(now.footSurfaceImagingLesson(identity, tab), clean, 'Fresh arrays');
    for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
      const foreign = structuredClone(identity);
      const parent = at(foreign, path.slice(0, -1));
      const key = path.at(-1);
      const original = parent[key];
      parent[key] = typeof original === 'string' ? `${original}-foreign`
        : typeof original === 'number' ? original + 0.01
          : original === null ? 'foreign' : !original;
      assert.equal(now.footSurfaceImagingLesson(foreign, tab), undefined, path.join('.'));
      refusals++;
    }
    for (const path of pathsWhere(identity, Array.isArray)) {
      const foreign = structuredClone(identity);
      at(foreign, path).push('foreign');
      assert.equal(now.footSurfaceImagingLesson(foreign, tab), undefined, path.join('.'));
      refusals++;
    }
    const foreign = structuredClone(identity);
    foreign.unexpected = true;
    assert.equal(now.footSurfaceImagingLesson(foreign, tab), undefined);
    refusals++;
  }
  for (const tab of now.contentTabs.filter(tab => !Object.hasOwn(previous, tab))) {
    assert.equal(now.footSurfaceImagingLesson(identity, tab), undefined);
    if (family === 'longPlantar' && tab === 'ct') assert.equal(now.bodyLesson(identity, tab).readiness, 'pending');
  }

  const material = await now.bodyReviewMaterial(identity.id);
  assert.equal(material.approval, false);
  assert(await now.parseBodyReviewResponse(material, identity.id));
  const tab = Object.keys(previous)[0];
  for (const mutate of [
    value => { value.topics.find(topic => topic.tab === tab).body += ' foreign'; },
    value => { value.topics.find(topic => topic.tab === tab).readiness = 'approved'; },
    value => { value.topics.find(topic => topic.tab === tab).citations = ['https://foreign.example']; },
    value => { value.source.structure.sources = []; },
    value => { value.topics = value.topics.filter(topic => topic.tab !== tab); },
  ]) {
    const foreign = structuredClone(material);
    mutate(foreign);
    assert.equal(await now.parseBodyReviewResponse(foreign, identity.id), null);
    malformed++;
  }
  const prior = await before.bodyReviewContext(identity.id);
  const current = await now.bodyReviewContext(identity.id);
  assert.equal(current.sourceHash, prior.sourceHash);
  assert.notEqual(current.revisions.teaching, prior.revisions.teaching);
  assert.equal(current.revisions.imaging, null);
  const packet = {
    catalogScope: current.catalogScope,
    structureId: identity.id,
    track: 'teaching',
    expectedVersion: 0,
    materialHash: current.materialHash,
    revisionHash: current.revisions.teaching,
    checklistVersion: current.checklistVersion,
    draft: now.blankBodyReview(current, 'teaching'),
  };
  for (const hashes of [
    {materialHash: prior.materialHash, revisionHash: prior.revisions.teaching},
    {materialHash: prior.materialHash},
    {revisionHash: prior.revisions.teaching},
  ]) {
    const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST',
      headers: {
        origin: 'https://atlas.test',
        'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_FOOT_SURFACE_DRAFT',
      },
      body: JSON.stringify({...packet, ...hashes}),
    }), {prepare() { storageCalls++; throw Error('Stale decision reached storage'); }});
    assert.equal(response.status, 409);
    stale++;
  }
}
for (const structure of catalog.structures) {
  const prior = await before.bodyReviewMaterial(structure.id);
  const current = await now.bodyReviewMaterial(structure.id);
  for (const key of ['source', 'reasoning', 'guidedTours']) assert.deepEqual(current[key], prior[key]);
  assert.equal(current.approval, false);
  if (entries.has(structure.id)) {
    assert.notEqual(current.fingerprints.teaching, prior.fingerprints.teaching);
    worksheets++;
  } else {
    assert.deepEqual(current.topics, prior.topics);
    assert.equal(current.fingerprints.teaching, prior.fingerprints.teaching);
  }
}
assert.equal(worksheets, 8);
assert.equal(malformed, 40);
assert.equal(stale, 24);
assert.equal(storageCalls, 0);
for (const [family, lessons] of Object.entries(now.footSurfaceImagingTeaching)) {
  const words = Object.values(lessons).flatMap(lesson => [lesson.body, ...lesson.bullets]).join(' ').split(/\s+/).length;
  assert(words <= 180, `${family}: ${words}`);
}
for (const ref of Object.values(now.footSurfaceImagingReferences)) assert.equal(ref.licence, 'CC BY 4.0');
for (const bundle of catalog.bundles) {
  const path = `public${bundle.url.split('?')[0]}`;
  const bytes = readFileSync(path);
  assert.equal(hash(bytes), bundle.sha256);
  assert.deepEqual(bytes, old(path));
}
for (const path of [
  'package-lock.json',
  'LICENSES/dependency-license-audit.json',
  'LICENSES/BODYPARTS3D_FULL_BODY.md',
  'app/body-explorer.tsx',
  'lib/imaging-sync.ts',
  'lib/didanix-atlas-adapter.ts',
  'lib/independent-study-links.ts',
  'lib/body-review-context.ts',
  'lib/body-review-api.ts',
]) {
  assert.equal(readFileSync(path, 'utf8').replaceAll('\r\n', '\n'), old(path).toString().replaceAll('\r\n', '\n'), path);
}
console.log(JSON.stringify({
  changed, preserved, worksheets, identityRefusals: refusals, malformed, stale, storageCalls,
  bundlesUnchanged: catalog.bundles.length, clinicalApproval: false, websiteIntegrated: false,
}));
