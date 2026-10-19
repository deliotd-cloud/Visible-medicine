import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import test from 'node:test';
import { emittedTeaching } from './atlas-emitted-teaching.ts';
import { epochImportPlugin, epochReadFileSync, spinalEpochBytes, spinalWebsiteEpoch } from './atlas-foot-prior-epoch.mjs';

const websiteBaseline = 'd6c37e4df4065fb832bf89b3a1a825de0d3033ff';
const previousSourceRevision = '67dd759d40e0c775620964d90e85de659f15d6cf';
const atlasSource = 'C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
const root = process.cwd();
const readFileSync = epochReadFileSync(spinalWebsiteEpoch);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const oldCache = new Map();
function old(path) {
  assert(!path.includes('..') && !path.startsWith('/') && !path.includes('\\'));
  if (!oldCache.has(path)) oldCache.set(path, execFileSync('git', ['show', `${websiteBaseline}:${path}`], {
    maxBuffer: 32e6, windowsHide: true, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
  }));
  return oldCache.get(path);
}
function sourceAt(revision, path) {
  assert(!path.includes('..') && !path.startsWith('/') && !path.includes('\\'));
  return execFileSync('git', ['show', `${revision}:${path}`], {
    cwd: atlasSource, maxBuffer: 32e6, windowsHide: true,
    env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
  });
}
const spinalExports = "export * from './atlas-review/lib/spinal-bone-ultrasound';export * from './atlas-review/content/spinal-bone-ultrasound';";
const commonEntry = "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';export {structures} from './atlas-review/app/anatomy-data';export {dissectionProfiles} from './atlas-review/app/dissection-data';export {regionalTours} from './atlas-review/lib/regional-tours';export {reasoningConcepts} from './atlas-review/lib/reasoning-questions';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';";

async function load(previous = false) {
  const result = await build({
    stdin: { contents: (previous ? '' : spinalExports) + commonEntry, resolveDir: root, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node',
    plugins: [epochImportPlugin(previous ? websiteBaseline : spinalWebsiteEpoch)],
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

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

test('saved spinal bone ultrasound and protected Review import before foot drafts', async () => {
  const now = await load(), beforeWebsite = await load(true);
  const pins = JSON.parse(readFileSync('atlas-review/content/spinal-bone-ultrasound-pins.json'));
  assert.equal(pins.baseline, 'a7ed1304b8ae3972dc5add5b1bb3ed8a35f671ce');
  const sourceCatalog = JSON.parse(readFileSync('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  const catalog = now.bodyDisplayCatalog(sourceCatalog);
  assert.equal(catalog.structures.length, 1104);
  assert.deepEqual(catalog, beforeWebsite.bodyDisplayCatalog(JSON.parse(old('atlas-review/public/models/bodyparts3d/full-body/catalog.json'))));
  assert.deepEqual(now.structures, beforeWebsite.structures);
  assert.deepEqual(now.dissectionProfiles, beforeWebsite.dissectionProfiles);
  assert.deepEqual(now.regionalTours, beforeWebsite.regionalTours);
  assert.deepEqual(now.reasoningConcepts, beforeWebsite.reasoningConcepts);
  assert.equal(pins.sourceVersion, sourceCatalog.sourceVersion);
  assert.equal(pins.license, sourceCatalog.license);
  assert.deepEqual(pins.coordinateSystem, sourceCatalog.coordinateSystem);
  assert.equal(pins.entries.length, 13);
  const targets = new Map(pins.entries.map(item => [item.identity.id, item]));
  assert.equal(targets.size, 13);
  assert.deepEqual(pins.entries.map(item => item.level).sort(), [...Array.from({ length: 10 }, (_, i) => `T${i + 2}`), 'L2', 'L3', 'L4'].sort());
  for (const item of pins.entries) {
    assert.equal(item.family, item.level.startsWith('T') ? 'thoracic' : 'lumbar');
    assert.equal(item.identity.system, 'skeleton');
    assert.equal(item.identity.category, 'bone');
    assert.equal(item.identity.region, 'spine');
    assert.equal(item.identity.laterality, 'midline');
    assert.deepEqual(catalog.structures.find(s => s.id === item.identity.id), item.identity);
  }

  const snapshot = api => ({
    catalog,
    body: catalog.structures.map(s => ({ id: s.id, topics: Object.fromEntries(api.contentTabs.map(tab => [tab, api.bodyLesson(s, tab)])) })),
    shoulder: api.structures,
    recipes: api.dissectionProfiles,
  });
  const baselineSnapshot = snapshot(beforeWebsite);
  assert.equal(sha(JSON.stringify(baselineSnapshot)), pins.beforeAllTeachingSnapshotHash);
  const recovered = snapshot(now);
  const previousBody = new Map(baselineSnapshot.body.map(row => [row.id, row.topics]));
  let preserved = 0;
  for (const row of recovered.body) for (const tab of now.contentTabs) {
    if (targets.has(row.id) && tab === 'ultrasound') {
      row.topics[tab] = targets.get(row.id).previous;
    } else {
      assert.deepEqual(row.topics[tab], previousBody.get(row.id)[tab], `${row.id}:${tab}`);
      preserved++;
    }
  }
  assert.equal(preserved, 9923);
  assert.deepEqual(recovered, baselineSnapshot);
  assert.equal(sha(JSON.stringify(recovered)), pins.beforeAllTeachingSnapshotHash,
    'Exactly the thirteen pinned lessons changed from the imported website baseline');

  let changed = 0, mutations = 0, malformed = 0, stale = 0, worksheets = 0, storageCalls = 0;
  for (const item of pins.entries) {
    const s = catalog.structures.find(row => row.id === item.identity.id);
    const prior = beforeWebsite.bodyLesson(s, 'ultrasound');
    assert.deepEqual(prior, item.previous, `${s.id}: prior website lesson`);
    assert.equal(prior.readiness, 'pending');
    const lesson = now.bodyLesson(s, 'ultrasound');
    assert.equal(lesson.readiness, 'draft');
    assert.deepEqual(lesson, now.spinalBoneUltrasoundLesson(s, 'ultrasound'));
    const { readiness, ...section } = lesson;
    assert.deepEqual(now.bodyContent(s, 'ultrasound'), section);
    changed++;
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
    const detached = now.spinalBoneUltrasoundLesson(s, 'ultrasound'), original = structuredClone(detached);
    assert.equal(original.body, now.spinalBoneUltrasoundTeaching[item.family].body);
    assert.deepEqual(original.bullets, [...now.spinalBoneUltrasoundTeaching[item.family].bullets]);
    assert.match(original.note, /revision-bound radiologist sign-off pending/i);
    assert.match(original.body + original.bullets.join(' '), /shadow/i);
    assert.match(original.body + original.bullets.join(' '), /interlaminar/i);
    assert.match(original.body + original.bullets.join(' '), /marrow/i);
    for (const citation of original.citations) assert.equal(new URL(citation).protocol, 'https:');
    detached.bullets.push('foreign'); detached.citations.push('https://foreign.example');
    assert.deepEqual(now.spinalBoneUltrasoundLesson(s, 'ultrasound'), original);

    const current = await now.bodyReviewMaterial(s.id), priorMaterial = await beforeWebsite.bodyReviewMaterial(s.id);
    assert(await now.parseBodyReviewResponse(current, s.id));
    assert.equal(current.approval, false);
    assert.deepEqual(current.source, priorMaterial.source);
    assert.deepEqual(current.reasoning, priorMaterial.reasoning);
    assert.deepEqual(current.guidedTours, priorMaterial.guidedTours);
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
    const oldContext = await beforeWebsite.bodyReviewContext(s.id), newContext = await now.bodyReviewContext(s.id);
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
  assert.equal(changed, 13);
  assert.equal(mutations, 494);
  assert.equal(malformed, 65);
  assert.equal(stale, 13);
  assert.equal(storageCalls, 0);
  for (const s of catalog.structures) {
    if (!targets.has(s.id)) assert.equal(now.spinalBoneUltrasoundLesson(s, 'ultrasound'), undefined);
    const prior = await beforeWebsite.bodyReviewMaterial(s.id), current = await now.bodyReviewMaterial(s.id);
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

  // The older pins are source evidence, not a transitive production import.
  const earlierBytes = sourceAt(pins.baseline, 'content/spine-ultrasound-pins.json');
  assert.equal(sha(readFileSync(atlasSource + '/content/spine-ultrasound-pins.json')), sha(earlierBytes));
  const earlier = JSON.parse(earlierBytes);
  const earlierIds = new Set(earlier.entries.map(entry => entry.id));
  assert.equal(earlierIds.size, 15);
  for (const s of catalog.structures.filter(s => earlierIds.has(s.id))) {
    assert(!targets.has(s.id));
    assert.equal(now.bodyLesson(s, 'ultrasound').readiness, 'draft');
    assert.deepEqual(now.bodyLesson(s, 'ultrasound'), beforeWebsite.bodyLesson(s, 'ultrasound'));
  }
  for (const [tab, pending] of [['function', 3], ['pathology', 5], ['clinical', 5]])
    assert.equal(catalog.structures.filter(s => now.bodyLesson(s, tab).readiness === 'pending').length, pending);
  assert.deepEqual(now.spinalBoneUltrasoundReferences, {
    thoracicSonoanatomy: 'https://pubmed.ncbi.nlm.nih.gov/22354105/',
    trunkNerveTracking: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5222601/',
    lumbarSonoanatomy: 'https://pubmed.ncbi.nlm.nih.gov/22010025/',
    vertebralVariants: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7713870/',
  });

  const sourceBundles = new Map(sourceCatalog.bundles.map(bundle => [bundle.id, bundle]));
  assert.deepEqual(pins.bundles.map(bundle => bundle.id).sort(), [...new Set(pins.entries.map(item => item.identity.bundle))].sort());
  for (const bundle of pins.bundles) {
    assert.deepEqual(bundle, sourceBundles.get(bundle.id));
    const runtimePath = 'public/atlas-runtime/head-neck' + bundle.url.split('?')[0];
    const bytes = readFileSync(runtimePath);
    assert.equal(bytes.length, bundle.bytes);
    assert.equal(sha(bytes), bundle.sha256);
    assert.deepEqual(bytes, old(runtimePath));
  }
  for (const path of [
    'atlas-review/app/body-explorer.tsx', 'atlas-review/app/regional-guided-learning.tsx', 'atlas-review/app/whole-body-guided-learning.tsx',
    'atlas-review/lib/tour-camera.ts', 'atlas-review/lib/regional-tours.ts', 'atlas-review/lib/reasoning-questions.ts',
    'atlas-review/app/anatomy-data.ts', 'atlas-review/app/dissection-data.ts', 'atlas-review/lib/body-display-catalog.ts',
    'atlas-review/lib/imaging-sync.ts', 'atlas-review/lib/didanix-atlas-adapter.ts', 'atlas-review/lib/independent-study-links.ts',
  ]) assert.equal(readFileSync(path, 'utf8').replaceAll('\r\n', '\n'), old(path).toString().replaceAll('\r\n', '\n'), path);

  const review = JSON.parse(readFileSync('atlas-review/manifest.json'));
  assert.notEqual(review.revision, previousSourceRevision);
  assert(review.files.some(f => f.path === 'lib/spinal-bone-ultrasound.ts'));
  assert(review.files.some(f => f.path === 'content/spinal-bone-ultrasound.ts'));
  assert(review.files.some(f => f.path === 'content/spinal-bone-ultrasound-pins.json'));
  assert(!review.files.some(f => f.path === 'content/learning-resources.v1.json'));
  for (const file of review.files) assert.equal(sha(readFileSync('atlas-review/' + file.path)), file.importedSha256, file.path);
  const runtimes = ['head-neck', 'shoulder', 'female-pelvis', 'lower-limb'];
  const spinalInputs = ['app/body-content.ts', 'lib/spinal-bone-ultrasound.ts', 'content/spinal-bone-ultrasound.ts', 'content/spinal-bone-ultrasound-pins.json'];
  const spinalFiles = new Map(review.files.map(file => [file.path, file]));
  for (const name of runtimes) {
    const base = `public/atlas-runtime/${name}/`;
    const manifest = JSON.parse(readFileSync(base + 'manifest.json'));
    assert.equal(manifest.sourceCommit, review.revision);
    for (const flag of ['patientDataIncluded', 'clinicalApproved', 'standaloneReviewConnection']) assert.equal(manifest[flag], false);
    for (const file of manifest.files) assert.equal(sha(readFileSync(base + file.path)), file.sha256, `${name}:${file.path}`);
    const prior = JSON.parse(old(base + 'manifest.json'));
    assert.deepEqual(manifest.files.filter(f => f.path.startsWith('models/')), prior.files.filter(f => f.path.startsWith('models/')));
    const sourceInputs = JSON.parse(readFileSync(base + 'source-inputs.json'));
    const inputMap = new Map(sourceInputs.map(file => [file.path, file.sha256]));
    if (name === 'female-pelvis' || name === 'lower-limb') {
      for (const path of spinalInputs) assert(!inputMap.has(path), `${name}: unexpected spinal input ${path}`);
      continue;
    }
    for (const path of spinalInputs) {
      const imported = spinalFiles.get(path);
      assert(imported, `${path}: Review import`);
      assert.equal(inputMap.get(path), imported.sourceSha256, `${name}: ${path} source input`);
    }
    // The shoulder pilot renders only its shoulder structures. Its build
    // inventory includes body teaching, but that chunk is not an entry-reachable
    // spinal learning surface. The shared head-neck module serves all regions.
    if (name === 'shoulder') continue;
    const code = emittedTeaching(base, manifest.files, true, spinalEpochBytes);
    for (const item of pins.entries) {
      const lesson = now.spinalBoneUltrasoundLesson(item.identity, 'ultrasound');
      // The title is built from the selected name at runtime; assert its emitted
      // template suffix, with the complete title checked by the API above.
      for (const text of [item.identity.id, ' · ultrasound orientation · draft', lesson.body, ...lesson.bullets, lesson.note, ...lesson.citations])
        assert(code.includes(text) || code.includes(JSON.stringify(text).slice(1, -1)), `${name}: emitted ${item.level}: ${text.slice(0, 40)}`);
    }
  }
  const reviewBase = 'public/atlas-review-viewer/';
  const reviewManifest = JSON.parse(readFileSync(reviewBase + 'manifest.json'));
  assert.equal(reviewManifest.sourceCommit, review.revision);
  assert.equal(reviewManifest.personalRecordsIncluded, false);
  assert.equal(reviewManifest.mode, 'production');
  assert.equal(reviewManifest.websiteIntegrationSha256, review.websiteIntegrationSha256);
  for (const file of reviewManifest.files) assert.equal(sha(readFileSync(reviewBase + file.path)), file.sha256, `review:${file.path}`);
  const reviewCode = emittedTeaching(reviewBase, reviewManifest.files, true, spinalEpochBytes);
  for (const item of pins.entries) {
    const lesson = now.spinalBoneUltrasoundLesson(item.identity, 'ultrasound');
    for (const text of [item.identity.id, ' · ultrasound orientation · draft', lesson.body, ...lesson.bullets, lesson.note, ...lesson.citations])
      assert(reviewCode.includes(text) || reviewCode.includes(JSON.stringify(text).slice(1, -1)), `review: emitted ${item.level}: ${text.slice(0, 40)}`);
  }
  console.log(JSON.stringify({ websiteBaseline, websiteEpoch: spinalWebsiteEpoch, historicalMilestone: true, sourceRevision: review.revision, targets: changed, preservedTopicPlacements: preserved, changedTeachingWorksheets: worksheets, mutatedSourceRefusals: mutations,
    malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale, storageCalls, earlierSpineDrafts: earlierIds.size,
    verifiedRuntimes: runtimes, clinicalApproval: false, browserAcceptance: false }));
});
