import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from './pre-plantar-arterial-mri-history.mjs';
import { createHash } from 'node:crypto';
import { dirname, relative } from 'node:path';
import { build } from './pre-plantar-arterial-mri-history.mjs';

const baseline = '6c86bc8b1aa7a7418f21f890858b0217194aff4e';
const root = process.cwd();
const cache = new Map();
const old = path => {
  if (!cache.has(path)) cache.set(path, execFileSync('git', ['show', `${baseline}:${path}`], { maxBuffer: 32e6, windowsHide: true }));
  return cache.get(path);
};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const entry = "export * from './lib/shoulder-arterial-imaging';export * from './content/shoulder-arterial-imaging';export {bodyLesson,bodyContent} from './app/body-content';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {regionalTours} from './lib/regional-tours';export {reasoningConcepts} from './lib/reasoning-questions';export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export * from './lib/body-review-api';export * from './lib/body-review-decisions';";

async function load(previous = false) {
  const paths = new Set(['app/body-content.ts', 'content/body-review-display-pins.json', 'content/body-renderer-revision.json']);
  const result = await build({
    stdin: { contents: entry, resolveDir: root, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node',
    plugins: previous ? [{ name: 'exact-before-shoulder-arterial-imaging', setup(api) {
      api.onLoad({ filter: /.*/, namespace: 'workspace-test' }, args => {
        const path = relative(root, args.path).replaceAll('\\', '/');
        if (!paths.has(path)) return;
        return { contents: old(path).toString(), loader: path.endsWith('.json') ? 'json' : 'ts', resolveDir: dirname(args.path) };
      });
    } }] : [],
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

const now = await load(), before = await load(true);
const pins = JSON.parse(readFileSync('content/shoulder-arterial-imaging-pins.json'));
assert.equal(pins.baseline, baseline);
const catalogSource = JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json'));
const catalog = now.bodyDisplayCatalog(catalogSource);
const targets = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
const tabs = ['mri', 'ultrasound'];
assert.equal(catalog.structures.length, 1104);
assert.equal(pins.entries.length, 6);
assert.equal(targets.size, 6);
assert.deepEqual([...new Set(pins.entries.map(entry => entry.family))].sort(), ['anterior-circumflex-humeral', 'subscapular', 'thoracodorsal']);
assert.deepEqual(pins.entries.map(entry => entry.identity.laterality).sort(), ['left', 'left', 'left', 'right', 'right', 'right']);
assert.deepEqual(catalog, before.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json'))));
assert.deepEqual(now.structures, before.structures);
assert.deepEqual(now.dissectionProfiles, before.dissectionProfiles);
assert.deepEqual(now.regionalTours, before.regionalTours);
assert.deepEqual(now.reasoningConcepts, before.reasoningConcepts);

const snapshot = api => ({
  catalog,
  body: catalog.structures.map(s => ({ id: s.id, topics: Object.fromEntries(api.contentTabs.map(tab => [tab, api.bodyLesson(s, tab)])) })),
  shoulder: api.structures,
  recipes: api.dissectionProfiles,
});
assert.equal(sha(JSON.stringify(snapshot(before))), pins.beforeAllTeachingSnapshotHash);
const recovered = snapshot(now);
let changed = 0, preserved = 0, mutations = 0, malformed = 0, stale = 0, worksheets = 0, storageCalls = 0;
for (const row of recovered.body) for (const tab of now.contentTabs) {
  const s = catalog.structures.find(item => item.id === row.id);
  const prior = before.bodyLesson(s, tab), lesson = now.bodyLesson(s, tab);
  if (targets.has(s.id) && tabs.includes(tab)) {
    assert.equal(prior.readiness, 'pending', `${s.id}:${tab}`);
    assert.equal(lesson.readiness, 'draft', `${s.id}:${tab}`);
    assert.deepEqual(lesson, now.shoulderArterialImagingLesson(s, tab));
    const { readiness, ...section } = lesson;
    assert.deepEqual(now.bodyContent(s, tab), section);
    row.topics[tab] = prior;
    changed++;
  } else {
    assert.deepEqual(lesson, prior, `${s.id}:${tab}`);
    preserved++;
  }
}
assert.equal(changed, 12);
assert.equal(preserved, 9924);
assert.equal(sha(JSON.stringify(recovered)), pins.beforeAllTeachingSnapshotHash);

function leaves(value, path = []) {
  return value === null || typeof value !== 'object' ? [path] : Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
}
function mutate(value, path) {
  const copy = structuredClone(value);
  let parent = copy;
  for (const key of path.slice(0, -1)) parent = parent[key];
  const key = path.at(-1), prior = parent[key];
  parent[key] = typeof prior === 'string' ? prior + '-foreign' : typeof prior === 'number' ? prior + 0.01 : prior === null ? 'foreign' : !prior;
  return copy;
}

for (const entry of pins.entries) {
  const s = catalog.structures.find(item => item.id === entry.identity.id);
  assert.deepEqual(s, entry.identity);
  assert.equal(s.sourceTree, 'isa');
  assert.equal(s.system, 'vessels');
  assert.equal(s.region, 'shoulder-arm');
  for (const tab of tabs) assert.deepEqual(before.bodyLesson(s, tab), entry.previous[tab]);
  for (const path of leaves(s)) {
    for (const tab of tabs) assert.equal(now.shoulderArterialImagingLesson(mutate(s, path), tab), undefined, `${s.id}:${tab}:${path.join('.')}`);
    mutations += tabs.length;
  }
  for (const edit of [
    copy => { copy.sources = []; },
    copy => { copy.sources.push(structuredClone(copy.sources[0])); },
    copy => { copy.unexpected = true; },
    copy => { copy.regions.unshift('foreign'); },
  ]) {
    const copy = structuredClone(s); edit(copy);
    for (const tab of tabs) assert.equal(now.shoulderArterialImagingLesson(copy, tab), undefined);
    mutations += tabs.length;
  }
  for (const tab of now.contentTabs.filter(tab => !tabs.includes(tab))) assert.equal(now.shoulderArterialImagingLesson(s, tab), undefined);
  for (const tab of tabs) {
    const detached = now.shoulderArterialImagingLesson(s, tab), original = structuredClone(detached);
    detached.bullets.push('foreign'); detached.citations.push('foreign');
    assert.deepEqual(now.shoulderArterialImagingLesson(s, tab), original);
    assert.equal(original.bullets[0], now.shoulderArterialImagingLandmarks[entry.family]);
    assert.equal(original.body, now.shoulderArterialImagingContext[tab]);
    assert.match(original.note, /revision-bound radiologist/i);
    assert.match(original.note, /access remain independent/i);
    for (const citation of original.citations) assert.equal(new URL(citation).protocol, 'https:');
  }
  const current = await now.bodyReviewMaterial(s.id), prior = await before.bodyReviewMaterial(s.id);
  assert(await now.parseBodyReviewResponse(current, s.id));
  assert.equal(current.approval, false);
  assert.deepEqual(current.source, prior.source);
  assert.deepEqual(current.reasoning, prior.reasoning);
  assert.deepEqual(current.guidedTours, prior.guidedTours);
  for (const tab of tabs) {
    assert.deepEqual(current.topics.find(topic => topic.tab === tab), { tab, ...now.shoulderArterialImagingLesson(s, tab) });
    for (const edit of [
      packet => { packet.topics.find(topic => topic.tab === tab).body += ' foreign'; },
      packet => { packet.topics.find(topic => topic.tab === tab).readiness = 'approved'; },
      packet => { packet.topics.find(topic => topic.tab === tab).citations = ['https://foreign.example']; },
      packet => { packet.source.structure.sources = []; },
      packet => { packet.topics.splice(packet.topics.findIndex(topic => topic.tab === tab), 1); },
    ]) {
      const packet = structuredClone(current); edit(packet);
      assert.equal(await now.parseBodyReviewResponse(packet, s.id), null);
      malformed++;
    }
  }
  const oldContext = await before.bodyReviewContext(s.id), newContext = await now.bodyReviewContext(s.id);
  assert.equal(oldContext.sourceHash, newContext.sourceHash);
  assert.notEqual(oldContext.revisions.teaching, newContext.revisions.teaching);
  assert.equal(newContext.revisions.imaging, null);
  const packet = { catalogScope: oldContext.catalogScope, structureId: s.id, track: 'teaching', expectedVersion: 0,
    materialHash: oldContext.materialHash, revisionHash: oldContext.revisions.teaching,
    checklistVersion: oldContext.checklistVersion, draft: now.blankBodyReview(oldContext, 'teaching') };
  const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
    method: 'POST', headers: { origin: 'https://atlas.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_SHOULDER_ARTERIAL_IMAGING' },
    body: JSON.stringify(packet),
  }), { prepare() { storageCalls++; throw Error('Stale submission reached storage'); } });
  assert.equal(response.status, 409);
  stale++;
}
for (const s of catalog.structures) {
  if (!targets.has(s.id)) for (const tab of tabs) assert.equal(now.shoulderArterialImagingLesson(s, tab), undefined);
  const prior = await before.bodyReviewMaterial(s.id), current = await now.bodyReviewMaterial(s.id);
  assert.deepEqual(prior.source, current.source);
  assert.deepEqual(prior.reasoning, current.reasoning);
  assert.deepEqual(prior.guidedTours, current.guidedTours);
  assert.equal(current.approval, false);
  if (targets.has(s.id)) {
    assert.notEqual(prior.fingerprints.teaching, current.fingerprints.teaching);
    worksheets++;
  } else {
    assert.deepEqual(prior.topics, current.topics);
    assert.equal(prior.fingerprints.teaching, current.fingerprints.teaching);
  }
}
assert.equal(worksheets, 6);
assert.equal(malformed, 60);
assert.equal(stale, 6);
assert.equal(storageCalls, 0);
for (const bundle of pins.bundles) {
  const path = 'public' + bundle.url.split('?')[0], bytes = readFileSync(path);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(sha(bytes), bundle.sha256);
  assert.deepEqual(bytes, old(path));
}
for (const path of [
  'app/body-explorer.tsx', 'app/regional-guided-learning.tsx', 'app/whole-body-guided-learning.tsx',
  'lib/tour-camera.ts', 'lib/regional-tours.ts', 'lib/reasoning-questions.ts', 'app/anatomy-data.ts',
  'app/dissection-data.ts', 'lib/body-display-catalog.ts', 'lib/imaging-sync.ts', 'lib/didanix-atlas-adapter.ts',
  'lib/independent-study-links.ts', 'content/learning-resources.v1.json', 'package.json', 'package-lock.json',
  'LICENSES/THIRD_PARTY_NOTICES.md',
]) assert.equal(readFileSync(path, 'utf8').replaceAll('\r\n', '\n'), old(path).toString().replaceAll('\r\n', '\n'), path);
assert.equal(execFileSync('git', ['diff', '--name-only', baseline, '--', 'public/models'], { encoding: 'utf8' }).trim(), '');
const landmarkWords = Object.values(now.shoulderArterialImagingLandmarks).join(' ').trim().split(/\s+/).length;
assert(landmarkWords <= 200);
for (const url of Object.values(now.shoulderArterialImagingReferences).flat()) assert.equal(new URL(url).protocol, 'https:');
for (const [tab, pending] of [['function', 3], ['pathology', 5], ['clinical', 5]])
  assert.equal(catalog.structures.filter(s => now.bodyLesson(s, tab).readiness === 'pending').length, pending, `${tab} source holds remain`);
const report = { testedTeachingEpoch:'e6168496a8a59927164fc84c9297583d8ae01339',historicalMilestone:true,actualCurrentTeachingTest:'scripts/test-plantar-arterial-mri.mjs',baseline,sourceTargets: 6, newMriPlacements: 6, newUltrasoundPlacements: 6,
  changedTopicPlacements: changed, otherTopicPlacementsPreserved: preserved,
  changedTeachingWorksheets: worksheets, preservedTeachingWorksheets: 1098,
  mutatedSourceRefusals: mutations, malformedPacketsRefused: malformed,
  staleRefusalsBeforeStorage: stale, storageCalls, landmarkWords,
  allEarlierReasoningAndToursPreserved: true, geometryAndUiUnchanged: true,
  clinicalApproval: false, browserAcceptance: false };
writeFileSync('docs/shoulder-arterial-imaging-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
