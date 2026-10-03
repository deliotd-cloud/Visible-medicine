import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative } from 'node:path';
import { build } from 'esbuild';
import test from 'node:test';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const baseline = '209238512f8950f9c182caac5a2696107fd3427a';
const root = process.cwd();
const cache = new Map();
const old = path => {
  if (!cache.has(path)) cache.set(path, execFileSync('git', ['show', `${baseline}:${path}`], { maxBuffer: 32e6, windowsHide: true }));
  return cache.get(path);
};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const entry = "export * from './atlas-review/lib/plantar-arterial-mri';export * from './atlas-review/content/plantar-arterial-mri';export {bodyLesson,bodyContent} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';export {structures} from './atlas-review/app/anatomy-data';export {dissectionProfiles} from './atlas-review/app/dissection-data';export {regionalTours} from './atlas-review/lib/regional-tours';export {reasoningConcepts} from './atlas-review/lib/reasoning-questions';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';";

async function load(previous = false) {
  const paths = new Set(['atlas-review/app/body-content.ts', 'atlas-review/content/body-review-display-pins.json', 'atlas-review/content/body-renderer-revision.json']);
  const result = await build({
    stdin: { contents: entry, resolveDir: root, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node',
    plugins: previous ? [{ name: 'exact-before-plantar-arterial-mri', setup(api) {
      api.onLoad({ filter: /.*/ }, args => {
        const path = relative(root, args.path).replaceAll('\\', '/');
        if (!paths.has(path)) return;
        return { contents: old(path).toString(), loader: path.endsWith('.json') ? 'json' : 'ts', resolveDir: dirname(args.path) };
      });
    } }] : [],
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('actual-current plantar arterial MRI and protected Review import',async()=>{
const now = await load(), before = await load(true);
const pins = JSON.parse(readFileSync('atlas-review/content/plantar-arterial-mri-pins.json'));
assert.equal(pins.baseline, 'e6168496a8a59927164fc84c9297583d8ae01339');
const catalogSource = JSON.parse(readFileSync('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
const catalog = now.bodyDisplayCatalog(catalogSource);
const targets = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
assert.equal(catalog.structures.length, 1104);
assert.equal(pins.entries.length, 10);
assert.equal(targets.size, 10);
assert.deepEqual([...new Set(pins.entries.map(entry => entry.family))].sort(), ['arch', 'deep', 'lateral', 'medial', 'superficial']);
for (const family of ['arch', 'deep', 'lateral', 'medial', 'superficial'])
  assert.deepEqual(pins.entries.filter(entry => entry.family === family).map(entry => entry.identity.laterality).sort(), ['left', 'right']);
assert.deepEqual(catalog, before.bodyDisplayCatalog(JSON.parse(old('atlas-review/public/models/bodyparts3d/full-body/catalog.json'))));
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
  if (targets.has(s.id) && tab === 'mri') {
    assert.equal(prior.readiness, 'pending', `${s.id}:${tab}`);
    assert.equal(lesson.readiness, 'draft', `${s.id}:${tab}`);
    assert.deepEqual(lesson, now.plantarArterialMriLesson(s, tab));
    const { readiness, ...section } = lesson;
    assert.deepEqual(now.bodyContent(s, tab), section);
    row.topics[tab] = prior;
    changed++;
  } else {
    assert.deepEqual(lesson, prior, `${s.id}:${tab}`);
    preserved++;
  }
}
assert.equal(changed, 10);
assert.equal(preserved, 9926);
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
  assert.equal(s.region, 'foot');
  assert.deepEqual(before.bodyLesson(s, 'mri'), entry.previous);
  for (const path of leaves(s)) {
    assert.equal(now.plantarArterialMriLesson(mutate(s, path), 'mri'), undefined, `${s.id}:mri:${path.join('.')}`);
    mutations++;
  }
  for (const edit of [
    copy => { copy.sources = []; },
    copy => { copy.sources.push(structuredClone(copy.sources[0])); },
    copy => { copy.unexpected = true; },
    copy => { copy.regions.unshift('foreign'); },
  ]) {
    const copy = structuredClone(s); edit(copy);
    assert.equal(now.plantarArterialMriLesson(copy, 'mri'), undefined);
    mutations++;
  }
  for (const tab of now.contentTabs.filter(tab => tab !== 'mri'))
    assert.equal(now.plantarArterialMriLesson(s, tab), undefined);
  const detached = now.plantarArterialMriLesson(s, 'mri'), original = structuredClone(detached);
  detached.bullets.push('foreign'); detached.citations.push('foreign');
  assert.deepEqual(now.plantarArterialMriLesson(s, 'mri'), original);
  assert.equal(original.bullets[0], now.plantarArterialMriLandmarks[entry.family]);
  assert.equal(original.body, now.plantarArterialMriContext);
  assert.match(original.note, /revision-bound radiologist sign-off/i);
  assert.match(original.note, /access remain independent/i);
  for (const citation of original.citations) assert.equal(new URL(citation).protocol, 'https:');

  const current = await now.bodyReviewMaterial(s.id), prior = await before.bodyReviewMaterial(s.id);
  assert(await now.parseBodyReviewResponse(current, s.id));
  assert.equal(current.approval, false);
  assert.deepEqual(current.source, prior.source);
  assert.deepEqual(current.reasoning, prior.reasoning);
  assert.deepEqual(current.guidedTours, prior.guidedTours);
  assert.deepEqual(current.topics.find(topic => topic.tab === 'mri'), { tab: 'mri', ...original });
  for (const edit of [
    packet => { packet.topics.find(topic => topic.tab === 'mri').body += ' foreign'; },
    packet => { packet.topics.find(topic => topic.tab === 'mri').readiness = 'approved'; },
    packet => { packet.topics.find(topic => topic.tab === 'mri').citations = ['https://foreign.example']; },
    packet => { packet.source.structure.sources = []; },
    packet => { packet.topics.splice(packet.topics.findIndex(topic => topic.tab === 'mri'), 1); },
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
    method: 'POST', headers: { origin: 'https://atlas.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_PLANTAR_ARTERIAL_MRI' },
    body: JSON.stringify(packet),
  }), { prepare() { storageCalls++; throw Error('Stale submission reached storage'); } });
  assert.equal(response.status, 409);
  stale++;
}
for (const s of catalog.structures) {
  if (!targets.has(s.id)) assert.equal(now.plantarArterialMriLesson(s, 'mri'), undefined);
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
assert.equal(worksheets, 10);
assert.equal(malformed, 50);
assert.equal(stale, 10);
assert.equal(storageCalls, 0);
for (const bundle of pins.bundles) {
  const path = 'public/atlas-runtime/head-neck' + bundle.url.split('?')[0], bytes = readFileSync(path);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(sha(bytes), bundle.sha256);
  assert.deepEqual(bytes, old(path));
}
for (const path of [
  'atlas-review/app/body-explorer.tsx', 'atlas-review/app/regional-guided-learning.tsx', 'atlas-review/app/whole-body-guided-learning.tsx',
  'atlas-review/lib/tour-camera.ts', 'atlas-review/lib/regional-tours.ts', 'atlas-review/lib/reasoning-questions.ts', 'atlas-review/app/anatomy-data.ts',
  'atlas-review/app/dissection-data.ts', 'atlas-review/lib/body-display-catalog.ts', 'atlas-review/lib/imaging-sync.ts', 'atlas-review/lib/didanix-atlas-adapter.ts',
  'atlas-review/lib/independent-study-links.ts',   'LICENSES/THIRD_PARTY_NOTICES.md', 'package.json', 'package-lock.json',
]) assert.equal(readFileSync(path, 'utf8').replaceAll('\r\n', '\n'), old(path).toString().replaceAll('\r\n', '\n'), path);
assert.equal(execFileSync('git', ['diff', '--name-only', baseline, '--', 'public/atlas-runtime/**/models/**'], { encoding: 'utf8' }).trim(), '');
assert.deepEqual(now.plantarArterialMriReferences, {
  anatomy: 'https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html',
  arch: 'https://pubmed.ncbi.nlm.nih.gov/11694970/',
  deep: 'https://pubmed.ncbi.nlm.nih.gov/9787393/',
  comparative: 'https://pubmed.ncbi.nlm.nih.gov/7696797/',
  pitfalls: 'https://pubmed.ncbi.nlm.nih.gov/7489621/',
  unenhanced: 'https://pubmed.ncbi.nlm.nih.gov/24758556/',
});
for (const url of Object.values(now.plantarArterialMriReferences)) assert.equal(new URL(url).protocol, 'https:');
assert.equal(typeof now.plantarArterialMriContext, 'string');
assert.deepEqual(Object.keys(now.plantarArterialMriStudies).sort(), ['comparison', 'flow', 'unenhanced']);
const landmarkWords = Object.values(now.plantarArterialMriLandmarks).join(' ').trim().split(/\s+/).length;
assert(landmarkWords <= 200);
for (const [tab, pending] of [['function', 3], ['pathology', 5], ['clinical', 5]])
  assert.equal(catalog.structures.filter(s => now.bodyLesson(s, tab).readiness === 'pending').length, pending, `${tab} source holds remain`);
const readinessCounts = Object.fromEntries(['mri', 'ultrasound'].map(tab => [tab, Object.fromEntries(['draft', 'pending'].map(readiness =>
  [readiness, catalog.structures.filter(s => now.bodyLesson(s, tab).readiness === readiness).length]))]));
assert.deepEqual(readinessCounts, { mri: { draft: 991, pending: 113 }, ultrasound: { draft: 672, pending: 432 } });
const oldMriDrafts = catalog.structures.filter(s => before.bodyLesson(s, 'mri').readiness === 'draft');
assert.equal(oldMriDrafts.length, 981);
for (const s of oldMriDrafts) assert.deepEqual(now.bodyLesson(s, 'mri'), before.bodyLesson(s, 'mri'));
const shoulderPins = JSON.parse(old('atlas-review/content/shoulder-arterial-imaging-pins.json'));
assert.equal(shoulderPins.entries.length, 6);
for (const entry of shoulderPins.entries) for (const tab of ['mri', 'ultrasound']) {
  const s = catalog.structures.find(item => item.id === entry.identity.id);
  assert.equal(before.bodyLesson(s, tab).readiness, 'draft');
  assert.deepEqual(now.bodyLesson(s, tab), before.bodyLesson(s, tab));
}
const report = { baseline, sourceTargets: 10, newMriPlacements: 10,
  changedTopicPlacements: changed, otherTopicPlacementsPreserved: preserved,
  changedTeachingWorksheets: worksheets, preservedTeachingWorksheets: 1094,
  mutatedSourceRefusals: mutations, malformedPacketsRefused: malformed,
  staleRefusalsBeforeStorage: stale, storageCalls, landmarkWords, readinessCounts,
  earlierShoulderDraftPlacementsPreserved: 12, allEarlierReasoningAndToursPreserved: true,
  geometryAndUiUnchanged: true, clinicalApproval: false, browserAcceptance: false };

console.log(JSON.stringify(report));

const revision='67dd759d40e0c775620964d90e85de659f15d6cf';
const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
assert.equal(review.revision,revision);assert.equal(review.files.length,1015);
assert.deepEqual(review.packages,JSON.parse(old('atlas-review/manifest.json')).packages);
assert(!review.files.some(f=>f.path==='content/learning-resources.v1.json'));
assert.deepEqual(review.files.filter(f=>!JSON.parse(old('atlas-review/manifest.json')).files.some(p=>p.path===f.path)).map(f=>f.path).sort(),['content/plantar-arterial-mri-pins.json','content/plantar-arterial-mri.ts','lib/plantar-arterial-mri.ts']);
for(const f of review.files)assert.equal(sha(readFileSync('atlas-review/'+f.path)),f.importedSha256);
const inventory=JSON.parse(readFileSync('lib/atlas-model-inventory.json'));assert.equal(inventory.models.length,137);assert.deepEqual(inventory.models,JSON.parse(old('lib/atlas-model-inventory.json')).models);
for(const name of ['head-neck','shoulder','female-pelvis','lower-limb','review']){
 const base=name==='review'?'public/atlas-review-viewer/':'public/atlas-runtime/'+name+'/',manifest=JSON.parse(readFileSync(base+'manifest.json')),prior=JSON.parse(old(base+'manifest.json'));
 assert.equal(manifest.sourceCommit,review.revision);for(const f of manifest.files)assert.equal(sha(readFileSync(base+f.path)),f.sha256);
 if(name==='review'){assert.equal(manifest.personalRecordsIncluded,false);assert.equal(manifest.mode,'production');assert.equal(manifest.websiteIntegrationSha256,review.websiteIntegrationSha256);}else{
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(manifest[flag],false);
  assert.deepEqual(manifest.imagingConnection,prior.imagingConnection);assert.deepEqual(manifest.files.filter(f=>f.path.startsWith('models/')),prior.files.filter(f=>f.path.startsWith('models/')));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json'));assert.equal(inputs.length,{'head-neck':988,shoulder:661,'female-pelvis':111,'lower-limb':100}[name]);
  for(const path of ['bundled-dependencies.json','BUNDLED_NOTICES.txt'])assert.equal(readFileSync(base+path,'utf8').replaceAll('\r\n','\n'),old(base+path).toString().replaceAll('\r\n','\n'));
 }
 if(!['head-neck','review'].includes(name))continue;
 const code=emittedTeaching(base,manifest.files,true);
 for(const text of [...Object.values(now.plantarArterialMriLandmarks),now.plantarArterialMriContext,...Object.values(now.plantarArterialMriStudies)])assert(code.includes(text)||code.includes(JSON.stringify(text).slice(1,-1)),text);
 for(const id of targets.keys())assert(code.includes(id),id);for(const url of Object.values(now.plantarArterialMriReferences))assert(code.includes(url),url);
}
assert.equal(mutations,370);assert.equal(malformed,50);assert.equal(stale,10);assert.equal(worksheets,10);
for(const path of ['lib/atlas-delivery-access.ts','lib/lecture-repository.ts','atlas-review/lib/atlas-practice.ts','atlas-review/lib/learning-resources.ts'])assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),old(path).toString().replaceAll('\r\n','\n'),path);
const source='C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim(),revision);
assert.deepEqual(readFileSync(source+'/content/learning-resources.v1.json'),execFileSync('git',['show','e6168496a8a59927164fc84c9297583d8ae01339:content/learning-resources.v1.json'],{cwd:source,maxBuffer:32e6,windowsHide:true}));

});
