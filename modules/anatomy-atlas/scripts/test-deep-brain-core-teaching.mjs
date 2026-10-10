import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {authoringBeforeFootSurfaceImaging} from './foot-surface-imaging-history.mjs';
const baseline = '398edc60a43f8d0235d9e6963c1ad56954b3fa98';
const hash = x => createHash('sha256').update(typeof x === 'string' || Buffer.isBuffer(x) ? x : JSON.stringify(x)).digest('hex');
const pins = JSON.parse(readFileSync('content/deep-brain-core-teaching-pins.json'));
const transition = JSON.parse(readFileSync('content/deep-brain-core-teaching.transition.json'));
assert.equal(hash(pins), '9a054a45f4fc1237c806bcaed6c8df54386d74a06dc78cddb5fcd25fa70ce0ef');
assert.equal(hash(transition), 'b44acdd2394354a6ded078668937a188309dc3d10e78eedd6a90818c01ee41c0');
assert.equal(transition.sourcePinsHash, hash(pins)); assert.equal(transition.baseline, baseline);
const before = await exactSourceHistoryApi(baseline, 'review-security');
const result = await build({stdin: {contents: "export * from './lib/deep-brain-core-teaching';export * from './content/deep-brain-core-teaching';export * from './lib/foot-surface-imaging';export {bodyLesson,bodyContent} from './app/body-content';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {regionalTours} from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export * from './lib/body-review-api';export * from './lib/body-review-decisions';", resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm'});
const live = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const footPins = JSON.parse(readFileSync('content/foot-surface-imaging-pins.json'));
const rawCatalog = JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json'));
const now = authoringBeforeFootSurfaceImaging({api: live, catalog: rawCatalog});
const old = path => execFileSync('git', ['show', baseline + ':' + path], {windowsHide: true, maxBuffer: 32e6});
const catalog = now.bodyDisplayCatalog(JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json')));
assert.equal(catalog.structures.length, 1104);
assert.deepEqual(catalog, before.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json'))));
for (const key of ['structures', 'dissectionProfiles', 'regionalTours']) assert.deepEqual(now[key], before[key]);
const snapshot = api => ({catalog, body: catalog.structures.map(s => ({id: s.id, topics: Object.fromEntries(api.contentTabs.map(t => [t, api.bodyLesson(s, t)]))})), shoulder: api.structures, recipes: api.dissectionProfiles});
assert.equal(hash(snapshot(before)), pins.beforeAllTeachingSnapshotHash);
const reconstructed = snapshot(now);
let changed = 0, preserved = 0, refusals = 0, malformed = 0, stale = 0, storageCalls = 0, worksheets = 0;
const entries = new Map(pins.entries.map(e => [e.identity.id, e]));
for (const row of reconstructed.body) for (const tab of now.contentTabs) {
  const s = catalog.structures.find(s => s.id === row.id), entry = entries.get(s.id);
  const prior = before.bodyLesson(s, tab), current = now.bodyLesson(s, tab);
  if (entry && Object.hasOwn(entry.previous, tab)) {
    assert.equal(prior.readiness, 'pending'); assert.equal(current.readiness, 'draft');
    assert.deepEqual(prior, entry.previous[tab]); assert.deepEqual(current, now.deepBrainCoreLesson(s, tab));
    const {readiness, ...shown} = current; assert.deepEqual(now.bodyContent(s, tab), shown);
    assert.equal(hash(current), transition.entries.find(e => e.id === s.id && e.tab === tab).draftHash);
    row.topics[tab] = prior; changed++;
  } else {assert.deepEqual(current, prior, s.id + ':' + tab); preserved++;}
}
assert.equal(changed, 10); assert.equal(preserved, 9926); assert.equal(transition.entries.length, 10);
assert.match(now.deepBrainCoreTeaching.septalSource.function.body, /animal work.*human function unresolved/);
assert.equal(hash(reconstructed), pins.beforeAllTeachingSnapshotHash);
const leaves = (v, path = []) => v === null || typeof v !== 'object' ? [path] : Object.entries(v).flatMap(([k, x]) => leaves(x, [...path, k]));
for (const {identity, previous, family} of pins.entries) {
  assert.deepEqual(catalog.structures.find(s => s.id === identity.id), identity);
  for (const tab of Object.keys(previous)) {
    const draft = now.deepBrainCoreLesson(identity, tab);
    assert.equal(draft.readiness, 'draft'); assert.match(draft.note, /revision-bound radiologist/i);
    assert.match(draft.note, /independent/i);
    assert.equal(draft.body, now.deepBrainCoreTeaching[family][tab].body);
    const clean = structuredClone(draft); draft.bullets.push('foreign'); draft.citations.push('foreign');
    assert.deepEqual(now.deepBrainCoreLesson(identity, tab), clean, 'Fresh arrays');
    for (const path of leaves(identity)) {
      const foreign = structuredClone(identity); let parent = foreign;
      for (const key of path.slice(0, -1)) parent = parent[key];
      const key = path.at(-1), original = parent[key];
      parent[key] = typeof original === 'string' ? original + '-foreign' : typeof original === 'number' ? original + 0.01 : original === null ? 'foreign' : !original;
      assert.equal(now.deepBrainCoreLesson(foreign, tab), undefined, path.join('.')); refusals++;
    }
    for (const mutate of [x => {x.unexpected = true;}, x => {x.sources = [];}, x => {x.sources.push({...x.sources[0]});}, x => {x.regions.push('foreign');}]) {
      const foreign = structuredClone(identity); mutate(foreign); assert.equal(now.deepBrainCoreLesson(foreign, tab), undefined); refusals++;
    }
  }
  for (const tab of now.contentTabs.filter(t => !Object.hasOwn(previous, t))) assert.equal(now.deepBrainCoreLesson(identity, tab), undefined);
  const material = await now.bodyReviewMaterial(identity.id); assert.equal(material.approval, false);
  assert(await now.parseBodyReviewResponse(material, identity.id));
  const tab = Object.keys(previous)[0];
  for (const mutate of [x => {x.topics.find(t => t.tab === tab).body += ' foreign';}, x => {x.topics.find(t => t.tab === tab).readiness = 'approved';}, x => {x.topics.find(t => t.tab === tab).citations = ['https://foreign.example'];}, x => {x.source.structure.sources = [];}, x => {x.topics = x.topics.filter(t => t.tab !== tab);}]) {
    const foreign = structuredClone(material); mutate(foreign); assert.equal(await now.parseBodyReviewResponse(foreign, identity.id), null); malformed++;
  }
  const prior = await before.bodyReviewContext(identity.id), current = await now.bodyReviewContext(identity.id);
  assert.equal(current.sourceHash, prior.sourceHash); assert.notEqual(current.revisions.teaching, prior.revisions.teaching);
  assert.equal(current.revisions.imaging, null);
  const packet = {catalogScope: current.catalogScope, structureId: identity.id, track: 'teaching', expectedVersion: 0,
    materialHash: current.materialHash, revisionHash: current.revisions.teaching, checklistVersion: current.checklistVersion, draft: now.blankBodyReview(current, 'teaching')};
  for (const hashes of [{materialHash: prior.materialHash, revisionHash: prior.revisions.teaching}, {materialHash: prior.materialHash}, {revisionHash: prior.revisions.teaching}]) {
    const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_DEEP_BRAIN_DRAFT'}, body: JSON.stringify({...packet, ...hashes})}), {prepare() {storageCalls++; throw Error('Stale decision reached storage');}});
    assert.equal(response.status, 409); stale++;
  }
}
for (const s of catalog.structures) {
  const prior = await before.bodyReviewMaterial(s.id), current = await now.bodyReviewMaterial(s.id);
  for (const key of ['source', 'reasoning', 'guidedTours']) assert.deepEqual(current[key], prior[key]);
  assert.equal(current.approval, false);
  if (entries.has(s.id)) {assert.notEqual(current.fingerprints.teaching, prior.fingerprints.teaching); worksheets++;}
  else {
    const foot = footPins.entries.find(e => e.identity.id === s.id);
    if (foot) {
      // Only the independently hash-verified later foot transition is allowed.
      const restored = current.topics.map(topic => {
        if (!Object.hasOwn(foot.previous, topic.tab)) return topic;
        assert.deepEqual(topic, {tab: topic.tab, ...live.footSurfaceImagingLesson(s, topic.tab)});
        assert.deepEqual(prior.topics.find(t => t.tab === topic.tab), {tab: topic.tab, ...foot.previous[topic.tab]});
        return {tab: topic.tab, ...foot.previous[topic.tab]};
      });
      assert.deepEqual(restored, prior.topics);
      assert.notEqual(current.fingerprints.teaching, prior.fingerprints.teaching);
    } else {assert.deepEqual(current.topics, prior.topics); assert.equal(current.fingerprints.teaching, prior.fingerprints.teaching);}
  }
}
assert.equal(worksheets, 4); assert.equal(malformed, 20); assert.equal(stale, 12); assert.equal(storageCalls, 0);
for (const [family, lessons] of Object.entries(now.deepBrainCoreTeaching)) {
  const words = Object.values(lessons).flatMap(l => [l.body, ...l.bullets]).join(' ').split(/\s+/).length;
  assert(words <= (family === 'fornicealCommissure' ? 300 : 190), family + ':' + words);
}
for (const ref of Object.values(now.deepBrainCoreReferences)) assert.equal(ref.licence, 'CC BY 4.0');
for (const bundle of catalog.bundles) {const path = 'public' + bundle.url.split('?')[0], bytes = readFileSync(path); assert.equal(hash(bytes), bundle.sha256); assert.deepEqual(bytes, old(path));}
for (const path of ['package-lock.json', 'LICENSES/dependency-license-audit.json', 'LICENSES/BODYPARTS3D_FULL_BODY.md', 'app/body-explorer.tsx', 'lib/imaging-sync.ts', 'lib/didanix-atlas-adapter.ts', 'lib/independent-study-links.ts', 'lib/body-review-context.ts', 'lib/body-review-api.ts']) assert.equal(readFileSync(path, 'utf8').replaceAll('\r\n', '\n'), old(path).toString().replaceAll('\r\n', '\n'), path);
console.log(JSON.stringify({changed, preserved, worksheets, identityRefusals: refusals, malformed, stale, storageCalls, bundlesUnchanged: catalog.bundles.length, clinicalApproval: false, websiteIntegrated: false}));
