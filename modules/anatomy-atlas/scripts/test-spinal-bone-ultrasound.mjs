import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, relative } from 'node:path';
import { build } from './workspace-test-build.mjs';

const baseline = 'a7ed1304b8ae3972dc5add5b1bb3ed8a35f671ce';
// Replay the completed teaching epoch. The newer hyoid/epiglottis live suite
// independently proves every existing spinal draft and Review topic unchanged.
const milestone = 'e7355245ac0d5f92a7a76c6fb2c42f917c3675c3';
const root = process.cwd();
const cache = new Map();
const old = path => {
  if (!cache.has(path)) cache.set(path, execFileSync('git', ['show', `${baseline}:${path}`], { maxBuffer: 32e6, windowsHide: true }));
  return cache.get(path);
};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const entry = "export * from './lib/spinal-bone-ultrasound';export * from './content/spinal-bone-ultrasound';export {bodyLesson,bodyContent} from './app/body-content';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {regionalTours} from './lib/regional-tours';export {reasoningConcepts} from './lib/reasoning-questions';export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export * from './lib/body-review-api';export * from './lib/body-review-decisions';";

async function load(previous = false) {
  const paths = new Set(['app/body-content.ts', 'content/body-review-display-pins.json', 'content/body-renderer-revision.json']);
  const result = await build({
    stdin: { contents: entry, resolveDir: root, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node',
    plugins: [{ name: 'exact-spinal-bone-ultrasound-epoch', setup(api) {
      api.onLoad({ filter: /.*/, namespace: 'workspace-test' }, args => {
        const path = relative(root, args.path).replaceAll('\\', '/');
        if (!paths.has(path)) return;
        const contents = previous ? old(path).toString() : execFileSync('git', ['show', `${milestone}:${path}`], {encoding:'utf8',maxBuffer:32e6,windowsHide:true});
        return { contents, loader: path.endsWith('.json') ? 'json' : 'ts', resolveDir: dirname(args.path) };
      });
    } }],
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

const now = await load(), before = await load(true);
const pins = JSON.parse(readFileSync('content/spinal-bone-ultrasound-pins.json'));
assert.equal(pins.baseline, baseline);
const sourceCatalog = JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json'));
const previousCatalog = JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json'));
const catalog = now.bodyDisplayCatalog(sourceCatalog);
assert.deepEqual(catalog, before.bodyDisplayCatalog(previousCatalog));
assert.equal(catalog.structures.length, 1104);
assert.equal(pins.sourceVersion, sourceCatalog.sourceVersion);
assert.equal(pins.license, sourceCatalog.license);
assert.deepEqual(pins.coordinateSystem, sourceCatalog.coordinateSystem);
assert.equal(pins.entries.length, 13);
const targets = new Map(pins.entries.map(item => [item.identity.id, item]));
assert.equal(targets.size, 13);
const expectedLevels = [...Array.from({ length: 10 }, (_, i) => `T${i + 2}`), 'L2', 'L3', 'L4'];
assert.deepEqual(pins.entries.map(item => item.level).sort(), expectedLevels.sort());
for (const item of pins.entries) {
  assert.equal(item.family, item.level.startsWith('T') ? 'thoracic' : 'lumbar');
  assert.equal(item.identity.system, 'skeleton');
  assert.equal(item.identity.category, 'bone');
  assert.equal(item.identity.region, 'spine');
  assert.equal(item.identity.laterality, 'midline');
  assert.deepEqual(catalog.structures.find(s => s.id === item.identity.id), item.identity);
}
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
  if (targets.has(s.id) && tab === 'ultrasound') {
    assert.deepEqual(prior, targets.get(s.id).previous, `${s.id}:pinned previous`);
    assert.equal(prior.readiness, 'pending', `${s.id}:${tab}`);
    assert.equal(lesson.readiness, 'draft', `${s.id}:${tab}`);
    assert.deepEqual(lesson, now.spinalBoneUltrasoundLesson(s, tab));
    const { readiness, ...section } = lesson;
    assert.deepEqual(now.bodyContent(s, tab), section);
    row.topics[tab] = prior;
    changed++;
  } else {
    assert.deepEqual(lesson, prior, `${s.id}:${tab}`);
    preserved++;
  }
}
assert.equal(changed, 13);
assert.equal(preserved, 9923);
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

for (const item of pins.entries) {
  const s = catalog.structures.find(row => row.id === item.identity.id);
  for (const path of leaves(s)) {
    assert.equal(now.spinalBoneUltrasoundLesson(mutate(s, path), 'ultrasound'), undefined, `${s.id}:${path.join('.')}`);
    mutations++;
  }
  for (const edit of [
    copy => { copy.sources = []; },
    copy => { copy.sources.push(structuredClone(copy.sources[0])); },
    copy => { copy.unexpected = true; },
    copy => { copy.regions.unshift('foreign'); },
  ]) {
    const copy = structuredClone(s); edit(copy);
    assert.equal(now.spinalBoneUltrasoundLesson(copy, 'ultrasound'), undefined);
    mutations++;
  }
  for (const tab of now.contentTabs.filter(tab => tab !== 'ultrasound'))
    assert.equal(now.spinalBoneUltrasoundLesson(s, tab), undefined);
  const lesson = now.spinalBoneUltrasoundLesson(s, 'ultrasound'), original = structuredClone(lesson);
  assert.equal(original.body, now.spinalBoneUltrasoundTeaching[item.family].body);
  assert.deepEqual(original.bullets, [...now.spinalBoneUltrasoundTeaching[item.family].bullets]);
  assert.match(original.note, /revision-bound radiologist sign-off pending/i);
  assert.match(original.body + original.bullets.join(' '), /shadow/i);
  assert.match(original.body + original.bullets.join(' '), /interlaminar/i);
  assert.match(original.body + original.bullets.join(' '), /marrow/i);
  for (const citation of original.citations) assert.equal(new URL(citation).protocol, 'https:');
  lesson.bullets.push('foreign'); lesson.citations.push('https://foreign.example');
  assert.deepEqual(now.spinalBoneUltrasoundLesson(s, 'ultrasound'), original);

  const current = await now.bodyReviewMaterial(s.id), prior = await before.bodyReviewMaterial(s.id);
  assert(await now.parseBodyReviewResponse(current, s.id));
  assert.equal(current.approval, false);
  assert.deepEqual(current.source, prior.source);
  assert.deepEqual(current.reasoning, prior.reasoning);
  assert.deepEqual(current.guidedTours, prior.guidedTours);
  assert.deepEqual(current.topics.find(topic => topic.tab === 'ultrasound'), { tab: 'ultrasound', ...original });
  for (const edit of [
    packet => { packet.topics.find(topic => topic.tab === 'ultrasound').body += ' foreign'; },
    packet => { packet.topics.find(topic => topic.tab === 'ultrasound').readiness = 'approved'; },
    packet => { packet.topics.find(topic => topic.tab === 'ultrasound').citations = ['https://foreign.example']; },
    packet => { packet.source.structure.sources = []; },
    packet => { packet.topics.splice(packet.topics.findIndex(topic => topic.tab === 'ultrasound'), 1); },
  ]) {
    const packet = structuredClone(current); edit(packet);
    assert.equal(await now.parseBodyReviewResponse(packet, s.id), null);
    malformed++;
  }
  const oldContext = await before.bodyReviewContext(s.id), newContext = await now.bodyReviewContext(s.id);
  assert.equal(oldContext.sourceHash, newContext.sourceHash);
  assert.notEqual(oldContext.revisions.teaching, newContext.revisions.teaching);
  assert.equal(newContext.revisions.imaging, null);
  const packet = { catalogScope: oldContext.catalogScope, structureId: s.id, track: 'teaching', expectedVersion: 0,
    materialHash: oldContext.materialHash, revisionHash: oldContext.revisions.teaching,
    checklistVersion: oldContext.checklistVersion, draft: now.blankBodyReview(oldContext, 'teaching') };
  const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
    method: 'POST', headers: { origin: 'https://atlas.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_SPINAL_BONE_ULTRASOUND' },
    body: JSON.stringify(packet),
  }), { prepare() { storageCalls++; throw Error('Stale submission reached storage'); } });
  assert.equal(response.status, 409);
  stale++;
}
for (const s of catalog.structures) {
  if (!targets.has(s.id)) assert.equal(now.spinalBoneUltrasoundLesson(s, 'ultrasound'), undefined);
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
assert.equal(worksheets, 13);
assert.equal(malformed, 65);
assert.equal(stale, 13);
assert.equal(storageCalls, 0);
const olderSpineUltrasoundPins=JSON.parse(readFileSync('content/spine-ultrasound-pins.json'));
const olderSpineUltrasoundIds=new Set(olderSpineUltrasoundPins.entries.map(entry=>entry.id));
assert.equal(olderSpineUltrasoundIds.size,15);
assert.equal(catalog.structures.filter(s=>s.region === 'spine' && before.bodyLesson(s,'ultrasound').readiness === 'draft').length,79,
  'Baseline includes other spine-system drafts, not only the fifteen pinned spine ultrasound additions');
const existingSpineUltrasound = catalog.structures.filter(s =>olderSpineUltrasoundIds.has(s.id));
assert.equal(existingSpineUltrasound.length, 15);
for (const s of existingSpineUltrasound) {
  assert.equal(before.bodyLesson(s,'ultrasound').readiness,'draft');
  assert(!targets.has(s.id));
  assert.deepEqual(now.bodyLesson(s, 'ultrasound'), before.bodyLesson(s, 'ultrasound'));
}
for (const tab of ['ct', 'mri', 'xray']) for (const s of catalog.structures)
  assert.deepEqual(now.bodyLesson(s, tab), before.bodyLesson(s, tab));
for (const [tab, pending] of [['function', 3], ['pathology', 5], ['clinical', 5]])
  assert.equal(catalog.structures.filter(s => now.bodyLesson(s, tab).readiness === 'pending').length, pending, `${tab} source holds remain`);

const sourceBundles = new Map(sourceCatalog.bundles.map(bundle => [bundle.id, bundle]));
assert.deepEqual(pins.bundles.map(bundle => bundle.id).sort(), [...new Set(pins.entries.map(item => item.identity.bundle))].sort());
for (const bundle of pins.bundles) {
  assert.deepEqual(bundle, sourceBundles.get(bundle.id));
  const path = 'public' + bundle.url.split('?')[0], bytes = readFileSync(path);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(sha(bytes), bundle.sha256);
  assert.deepEqual(bytes, old(path));
}
for (const path of [
  'app/body-explorer.tsx', 'app/regional-guided-learning.tsx', 'app/whole-body-guided-learning.tsx',
  'lib/tour-camera.ts', 'lib/regional-tours.ts', 'lib/reasoning-questions.ts', 'app/anatomy-data.ts',
  'app/dissection-data.ts', 'lib/body-display-catalog.ts', 'lib/imaging-sync.ts', 'lib/didanix-atlas-adapter.ts',
  'lib/independent-study-links.ts', 'content/learning-resources.v1.json', 'package-lock.json',
]) assert.equal(readFileSync(path, 'utf8').replaceAll('\r\n', '\n'), old(path).toString().replaceAll('\r\n', '\n'), path);
assert.equal(execFileSync('git', ['diff', '--name-only', baseline, '--', 'public/models'], { encoding: 'utf8' }).trim(), '');
assert.deepEqual(now.spinalBoneUltrasoundReferences, {
  thoracicSonoanatomy: 'https://pubmed.ncbi.nlm.nih.gov/22354105/',
  trunkNerveTracking: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5222601/',
  lumbarSonoanatomy: 'https://pubmed.ncbi.nlm.nih.gov/22010025/',
  vertebralVariants: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7713870/',
});
const report = { baseline, historicalMilestone: milestone, sourceTargets: 13, newUltrasoundPlacements: changed,
  otherTopicPlacementsPreserved: preserved, changedTeachingWorksheets: worksheets,
  preservedTeachingWorksheets: 1091, mutatedSourceRefusals: mutations,
  malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale, storageCalls,
  earlierSpineUltrasoundDraftsPreserved: existingSpineUltrasound.length,
  geometryAndUiUnchanged: true, clinicalApproval: false, browserAcceptance: false };
console.log(JSON.stringify(report));
