import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {Buffer} from 'node:buffer';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname, resolve, relative, extname} from 'node:path';
import {build} from 'esbuild';
import {savedReviewEpoch} from './atlas-saved-review-epoch.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const source = '88cea927d48729769b96ad8fe680b0872b7e6687';
const originalGuideChecklistLabel = "Inspect every guided step in the actual source viewer: caption, side, visible neighbours, selection and camera frame. These steps do not validate surgical planes or scan registration.";
const playbackGuideChecklistLabel = "Inspect every guided step in the actual source viewer: caption, side, visible neighbours, selection, camera frame and continuous playback timing. Check smooth arrival, reading time, pause/resume and the final hold. These steps do not validate surgical planes or scan registration.";
const depthChecklistLabel = "Review the additional compartment relationships, typical blood supply and clinical pitfall against the exact source surfaces and references. Vessels, nerves, fascial planes, perfusion and pathology are not thereby modelled or approved.";
const before = 'ebef136aa174d9b81329d917e4ef129430760ad2';
const featureWebsite = 'f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
const sourceRepo = currentAtlasDeliveryRoot();
const bytesAt = (repo: string, revision: string, path: string) => Buffer.from(execFileSync('git', ['-C', repo, 'show', `${revision}:${path}`], {encoding:null,maxBuffer: 32e6}));
const previousBytes = (path: string) => bytesAt(process.cwd(), before, path);
const featureBytes = (path: string) => bytesAt(process.cwd(), featureWebsite, path);
const featureJson = (path: string) => JSON.parse(featureBytes(path).toString('utf8'));
function featureRead(path: string): Buffer;
function featureRead(path: string, encoding: 'utf8'): string;
function featureRead(path: string, encoding?: 'utf8') { const bytes = featureBytes(path); return encoding ? bytes.toString(encoding) : bytes; }
function umNoticeSection(text: string) {
 const heading = '## UM lower-limb guided dissection (1 October 2026)\n';
 const start = text.indexOf(heading); assert(start >= 0);
 const end = text.indexOf('\n## ', start + heading.length);
 return text.slice(start, end < 0 ? text.length : end + 1);
}
function noticeSections(text: string) {
 const headings = [...text.matchAll(/^## .*$/gm)];
 const sections = new Map<string, string>();
 for (const [index, heading] of headings.entries()) {
  const title = heading[0], start = heading.index!, end = headings[index + 1]?.index ?? text.length;
  assert(!sections.has(title), 'Duplicate notice heading: ' + title);
  sections.set(title, text.slice(start, end));
 }
 return sections;
}
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
// Original admission:107b55df/43072a, before later delivery88cea, depth and playback.
const originalWebsite = '107b55dfd3511222755a7d35fc18e7058350bf4c';
const historicalEpochs = {
 before: [before, 'f636891cdcee10aeca20ae684cb04c183fa7600e', '08835bb8731f802ab82edbfd26cffa0db2720e90fef0628ec8fe38bb771b487c'],
 original: [originalWebsite, '43072a948beda597e7a62439e8c093aa76cb94a7', 'fa2b0765653d0d9d022c1c5cd72650b75a5e816b625a69942d9ecbf2ba63a709'],
 delivery: [featureWebsite, source, 'c368f353345bc0a03dbff54410f2f8ad68ebcc01142cfb0aa06d43bafb02115c'],
} as const;
async function load(epoch: 'current' | keyof typeof historicalEpochs = 'current') {
 const history = epoch === 'current' ? null : historicalEpochs[epoch];
 const saved = history ? savedReviewEpoch(history[0], history[1], history[2]) : null;
 const manifest = saved ? JSON.parse(saved.readFileSync('atlas-review/manifest.json', 'utf8')) : null;
 const result = await build({stdin: {contents: [
  "export * from './atlas-review/lib/specimen-review-material';",
  "export * from './atlas-review/lib/specimen-review';",
  "export * from './atlas-review/lib/specimen-review-api';",
  "export {limbDefinitions} from './atlas-review/lib/um-limb-studies';",
  ...(epoch === 'before' ? [] : ["export {umLimbGuidedDissection} from './atlas-review/lib/um-limb-guided-dissection';"]),
  "export {guidedDissectionAction} from './atlas-review/lib/specimen-guided-dissection';",
 ].join('\n'), resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm',
 plugins: saved ? [{name: 'complete-exact-guided-review-epoch', setup(api) {
  api.onLoad({filter: /[\\/]atlas-review[\\/]/}, args => {
   const path = relative(process.cwd(), args.path).replaceAll('\\', '/');
   const local = path.slice('atlas-review/'.length), entry = manifest.files.find((file: any) => file.path === local);
   assert(entry, path + ': manifest-admitted historical closure');
   const bytes = saved.readFileSync(path);
   assert.equal(sha(bytes), entry.importedSha256, path + ': exact historical imported bytes');
   assert.equal(sha(bytesAt(sourceRepo, manifest.revision, local)), entry.sourceSha256, path + ': exact historical committed source');
   return {contents: bytes.toString('utf8'), loader: extname(args.path) === '.json' ? 'json' : extname(args.path) === '.tsx' ? 'tsx' : 'ts', resolveDir: dirname(args.path)};
  });
 }}] : []});
 return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('five source-bound lower-limb guides ship complete captions and framing to learner and protected review', {timeout: 120000}, async () => {
 const review = featureJson('atlas-review/manifest.json'), learner = featureJson('public/atlas-runtime/head-neck/manifest.json');
 const viewer = featureJson('public/atlas-review-viewer/manifest.json'), inputs = featureJson('public/atlas-runtime/head-neck/source-inputs.json');
 assert.equal(review.revision, source); assert.equal(learner.sourceCommit, source); assert.equal(viewer.sourceCommit, source);
 assert.equal(viewer.personalRecordsIncluded, false); assert.equal(viewer.mode, 'production');
 for (const flag of ['patientDataIncluded', 'clinicalApproved', 'standaloneReviewConnection', 'imagingConnection']) assert.equal(learner[flag], false);
 const oldLearner = JSON.parse(previousBytes('public/atlas-runtime/head-neck/manifest.json').toString('utf8'));
 assert.deepEqual(learner.modelBundles, oldLearner.modelBundles);
 assert.deepEqual(learner.files.filter((f: any) => f.path.startsWith('models/')), oldLearner.files.filter((f: any) => f.path.startsWith('models/')));
 assert.deepEqual(featureJson('lib/atlas-model-inventory.json').models, JSON.parse(previousBytes('lib/atlas-model-inventory.json').toString('utf8')).models);
 assert.equal(featureJson('lib/atlas-model-inventory.json').models.length, 137);
 for (const path of ['app/um-knee-study.tsx', 'lib/specimen-guided-dissection.ts', 'lib/specimen-review-material.ts', 'lib/um-limb-guided-dissection.ts', 'lib/um-proximal-guided-dissection.ts', 'lib/um-distal-guided-dissection.ts']) {
  const entry = review.files.find((f: any) => f.path === path); assert(entry, path);
  assert.equal(entry.sourceSha256, sha(bytesAt(sourceRepo, source, path)), path);
  assert.equal(entry.importedSha256, sha(featureRead('atlas-review/' + path)), path);
  if (path === 'lib/specimen-review-material.ts') assert.equal(inputs.find((f: any) => f.path === path), undefined, 'Review-only material adapter stays outside the learner');
  else assert.equal(inputs.find((f: any) => f.path === path)?.sha256, entry.sourceSha256, path);
 }
 const bundle = learner.files.filter((f: any) => f.path.endsWith('.js')).map((f: any) => {
  const bytes = Buffer.from(featureRead('public/atlas-runtime/head-neck/' + f.path)); assert.equal(sha(bytes), f.sha256); return bytes.toString('utf8');
 }).join('\n');
 const additionalBundles: string[] = [];
 for (const module of ['public/atlas-runtime/lower-limb', 'public/atlas-review-viewer']) {
  const manifest = featureJson(module + '/manifest.json'); assert.equal(manifest.sourceCommit, source);
  additionalBundles.push(manifest.files.filter((f: any) => f.path.endsWith('.js')).map((f: any) => {
   const bytes = Buffer.from(featureRead(module + '/' + f.path)); assert.equal(sha(bytes), f.sha256); return bytes.toString('utf8');
  }).join('\n'));
  if (module.endsWith('/lower-limb')) {
   const old = JSON.parse(previousBytes(module + '/manifest.json').toString('utf8'));
   assert.deepEqual(manifest.files.filter((f: any) => f.path.startsWith('models/')), old.files.filter((f: any) => f.path.startsWith('models/')));
   for (const flag of ['patientDataIncluded', 'clinicalApproved', 'standaloneReviewConnection', 'imagingConnection']) assert.equal(manifest[flag], false);
   const inputs = featureJson(module + '/source-inputs.json');
   for (const path of ['app/um-knee-study.tsx', 'lib/um-limb-guided-dissection.ts', 'lib/um-proximal-guided-dissection.ts', 'lib/um-distal-guided-dissection.ts']) assert.equal(inputs.find((f: any) => f.path === path)?.sha256, sha(bytesAt(sourceRepo, source, path)));
  }
 }
 const current = await load('delivery'); let guides = 0, stops = 0;
 for (const definition of Object.values(current.limbDefinitions) as any[]) {
  const guide = current.umLimbGuidedDissection(definition); assert(guide); guides++;
  assert.equal(guide.specimenKey, definition.key); assert(guide.limitation.length > 0);
  assert.equal(guide.status, 'draft'); assert.equal(guide.sourceFrame, 'um-5t6tz7-v1-2:source-lps');
  for (const [index, step] of guide.steps.entries()) {
   stops++; assert(bundle.includes(step.id)); assert(bundle.includes(step.caption) || bundle.includes(JSON.stringify(step.caption).slice(1, -1)));
   for (const bundle of additionalBundles) {assert(bundle.includes(step.id)); assert(bundle.includes(step.caption) || bundle.includes(JSON.stringify(step.caption).slice(1, -1)));}
   assert(current.guidedDissectionAction(definition, guide, index));
   if (step.cameraBounds) for (const [axis, min] of step.cameraBounds.min.entries()) assert(min < step.cameraBounds.max[axis]);
  }
  const mutated = structuredClone(definition); mutated.frame = 'foreign-frame';
  assert.equal(current.umLimbGuidedDissection(mutated), null, 'Admission identity is not guessed');
 }
 assert.equal(guides, 5); assert.equal(stops, 46);
 for (const [module, manifest] of [['head-neck', learner], ['lower-limb', featureJson('public/atlas-runtime/lower-limb/manifest.json')]] as const) {
  const path = `public/atlas-runtime/${module}/LICENSES/THIRD_PARTY_NOTICES.md`;
  const bytes = featureBytes(path), notice = manifest.files.find((file: any) => file.path === 'LICENSES/THIRD_PARTY_NOTICES.md');
  assert(notice, path); assert.equal(sha(bytes), notice.sha256, path + ': exact emitted notices');
  const oldBody = previousBytes(path).toString('utf8').replaceAll('\r', '').replace(/^# Third-party notices\n\n/, '');
  assert(bytes.toString('utf8').replaceAll('\r', '').includes(oldBody), path + ': entire prior notice body retained');
  assert.match(bytes.toString('utf8'), /UM.*guided.*dissection/i);
  assert.deepEqual(bytes, featureBytes('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md'));
 }
});

test('guided teaching revisions preserve all anatomy, topics and holds; stale approval requests stop before storage', {timeout: 120000}, async () => {
 const current = await load('original'), previous = await load('before');
 const storage = new Proxy({}, {get() {throw Error('Stale guide request reached storage');}});
 const scopes = new Set((Object.values(current.limbDefinitions) as any[]).map(d => d.key));
 let contexts = 0, changed = 0, unchanged = 0, rejected = 0, held = 0, pending = 0;
 for (const row of current.specimenReviewRows) for (const surface of row.surfaces) {
  const label = `${row.key}/${surface.id}`, old = await previous.specimenReviewMaterial(row.key, surface.id), now = await current.specimenReviewMaterial(row.key, surface.id);
  assert(old && now, label); contexts++;
  assert.deepEqual(now.source, old.source); assert.equal(now.context.sourceHash, old.context.sourceHash);
  assert.equal(now.atlasLink, old.atlasLink); assert.equal(now.atlasPath, old.atlasPath);
  assert.deepEqual(now.context.blockers, old.context.blockers); assert.equal(now.context.revisions.imaging, null);
  pending += now.teaching.topics.filter((t: any) => t.body === null).length;
  if (!scopes.has(row.key)) {
   unchanged++; assert.deepEqual(now.teaching, old.teaching); assert.equal(now.context.teachingHash, old.context.teachingHash);
    assert.deepEqual(now.context.checklists, old.context.checklists); continue;
  }
  changed++; assert.equal(old.teaching.guidedDissection, undefined); assert(now.teaching.guidedDissection.steps.some((s: any) => s.ids.includes(surface.id)));
  const teaching = structuredClone(now.teaching); delete teaching.guidedDissection; assert.deepEqual(teaching, old.teaching);
  const checklist = structuredClone(now.context.checklists);
   const guideIndex = checklist.teaching.findIndex((item: any) => item.id === 'guided-dissection');
   assert(guideIndex >= 0);
   const [guideChecklist] = checklist.teaching.splice(guideIndex, 1);
   assert.equal(guideChecklist.label, originalGuideChecklistLabel);
   assert.deepEqual(checklist, old.context.checklists);
  assert.notEqual(now.context.teachingHash, old.context.teachingHash); assert.notEqual(now.context.revisions.teaching, old.context.revisions.teaching);
  if (!now.teaching.lesson.extended) {held++; assert(now.context.blockers.teaching.length > 0);}
  const draft = current.blankSpecimenReview(now.context, 'teaching'); assert.equal(draft.status, 'draft'); assert.equal(draft.attested, false); assert.equal(draft.checks['guided-dissection'], false);
  assert(current.specimenApprovalProblems({...draft, reviewer: 'Synthetic', qualification: 'Synthetic', scope: 'Synthetic', attested: true, evidence: ['https://example.test']}, now.context, 'teaching').includes('Complete every checklist item.'));
  for (const patch of [{revisionHash: old.context.revisions.teaching}, {materialHash: old.context.materialHash}, {sourceFrame: 'foreign-frame'}]) {
   const response = await current.postSpecimenReview(new Request('https://review.test/api/atlas-review/specimen-review', {method: 'POST', headers: {origin: 'https://review.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_GUIDE_REVIEW'}, body: JSON.stringify({catalogScope: now.context.catalogScope, specimenKey: row.key, structureId: surface.id, sourceFrame: now.context.sourceFrame, materialHash: now.context.materialHash, revisionHash: now.context.revisions.teaching, checklistVersion: now.context.checklistVersion, track: 'teaching', expectedVersion: 0, draft, ...patch})}), storage);
   assert.equal(response.status, 409); rejected++;
  }
  const copy = structuredClone(now); copy.teaching.guidedDissection.steps[0].caption = 'changed';
  assert.deepEqual(await current.specimenReviewMaterial(row.key, surface.id), now);
 }
 assert.deepEqual({contexts, changed, unchanged, rejected, held, pending}, {contexts: 356, changed: 154, unchanged: 202, rejected: 462, held: 4, pending: 24});
});


// Playback d819cd55 and calf/thigh/foot depth5acfa46b/d5e5641e/9fcf6007
// postdate original guided admission. Their current checklist gates remain required.
test('current guided materials require continuous playback review and draft depth review', {timeout: 120000}, async () => {
 const current = await load(), previous = await load('before'), original = await load('original');
 const scopes = new Set((Object.values(original.limbDefinitions) as any[]).map(d => d.key));
 let playbackChecklistUpdates = 0, guided = 0, depthReviews = 0, rejected = 0;
 const storage = new Proxy({}, {get() {throw Error('Stale current guide request reached storage');}});
 for (const row of original.specimenReviewRows) for (const surface of row.surfaces) {
  const old = await previous.specimenReviewMaterial(row.key, surface.id), now = await current.specimenReviewMaterial(row.key, surface.id);
  assert(old && now, `${row.key}/${surface.id}`);
  const previousChecklists = structuredClone(old.context.checklists), currentChecklists = structuredClone(now.context.checklists);
  const previousGuide = previousChecklists.teaching.find((item: any) => item.id === 'guided-dissection');
  const currentGuide = currentChecklists.teaching.find((item: any) => item.id === 'guided-dissection');
  if (!scopes.has(row.key)) {
   if (previousGuide) {
    assert.equal(previousGuide.label, originalGuideChecklistLabel);
    assert.equal(currentGuide?.label, playbackGuideChecklistLabel);
    currentGuide.label = originalGuideChecklistLabel;
    playbackChecklistUpdates++;
   }
   assert.deepEqual(currentChecklists, previousChecklists); continue;
  }
  guided++;
  const guideIndex = currentChecklists.teaching.findIndex((item: any) => item.id === 'guided-dissection');
  assert(guideIndex >= 0);
  const [guideChecklist] = currentChecklists.teaching.splice(guideIndex, 1);
  assert.equal(guideChecklist.label, playbackGuideChecklistLabel);
  const depthItems = currentChecklists.teaching.filter((item: any) => ['calf-depth', 'thigh-depth', 'foot-depth'].includes(item.id));
  assert(depthItems.length <= 1);
  if (depthItems.length) {
   const depth = depthItems[0], lessonDepth = now.teaching.lesson.depth;
   assert.equal(depth.label, depthChecklistLabel);
   assert.equal(lessonDepth?.status, 'draft');
   assert.equal(depth.id, lessonDepth.reviewScope ?? 'calf-depth');
   currentChecklists.teaching.splice(currentChecklists.teaching.findIndex((item: any) => item.id === depth.id), 1);
   depthReviews++;
  }
  assert.deepEqual(currentChecklists, old.context.checklists);
  const draft = current.blankSpecimenReview(now.context, 'teaching');
  assert.equal(draft.status, 'draft'); assert.equal(draft.attested, false); assert.equal(draft.checks['guided-dissection'], false);
  assert(current.specimenApprovalProblems({...draft, reviewer: 'Synthetic', qualification: 'Synthetic', scope: 'Synthetic', attested: true, evidence: ['https://example.test']}, now.context, 'teaching').includes('Complete every checklist item.'));
  for (const patch of [{revisionHash: old.context.revisions.teaching}, {materialHash: old.context.materialHash}, {sourceFrame: 'foreign-frame'}]) {
   const response = await current.postSpecimenReview(new Request('https://review.test/api/atlas-review/specimen-review', {method: 'POST', headers: {origin: 'https://review.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_GUIDE_REVIEW'}, body: JSON.stringify({catalogScope: now.context.catalogScope, specimenKey: row.key, structureId: surface.id, sourceFrame: now.context.sourceFrame, materialHash: now.context.materialHash, revisionHash: now.context.revisions.teaching, checklistVersion: now.context.checklistVersion, track: 'teaching', expectedVersion: 0, draft, ...patch})}), storage);
   assert.equal(response.status, 409); rejected++;
  }
 }
 assert.equal(guided, 154); assert.equal(rejected, 462);
 assert(playbackChecklistUpdates > 0); assert(depthReviews > 0);
});

test('current UM guided delivery retains exact committed source and no widened review access', () => {
 const pin = validateCurrentAtlasDelivery();
 assert.equal(pin.source, CURRENT_ATLAS_REVISION);
 const sourceRoot = currentAtlasDeliveryRoot();
 const review = json('atlas-review/manifest.json'), learner = json('public/atlas-runtime/head-neck/manifest.json');
 const viewer = json('public/atlas-review-viewer/manifest.json');
 assert.equal(review.revision, pin.source); assert.equal(learner.sourceCommit, pin.source); assert.equal(viewer.sourceCommit, pin.source);
 assert.equal(viewer.mode, 'production'); assert.equal(viewer.personalRecordsIncluded, false);
 const lowerLimbPage = readFileSync('app/atlas/lower-limb-3d/page.tsx', 'utf8');
 assert(lowerLimbPage.includes('src={source}') && lowerLimbPage.includes('`/atlas-runtime/lower-limb/index.html${suffix}`'));
 for (const flag of ['patientDataIncluded', 'clinicalApproved', 'standaloneReviewConnection', 'imagingConnection']) assert.equal(learner[flag], false);
 for (const path of ['app/um-knee-study.tsx', 'lib/specimen-guided-dissection.ts', 'lib/specimen-review-material.ts',
  'lib/um-limb-guided-dissection.ts', 'lib/um-proximal-guided-dissection.ts', 'lib/um-distal-guided-dissection.ts']) {
  const entry = review.files.find((f: any) => f.path === path); assert(entry, path);
  assert.equal(entry.sourceSha256, sha(bytesAt(sourceRoot, pin.source, path)), path + ': committed source');
  assert.equal(entry.importedSha256, sha(readFileSync('atlas-review/' + path)), path + ': imported source');
 }
 const committedNotice = bytesAt(sourceRoot, pin.source, 'LICENSES/THIRD_PARTY_NOTICES.md');
 const importedNotice = review.files.find((file: any) => file.path === 'LICENSES/THIRD_PARTY_NOTICES.md');
 assert(importedNotice);
 assert.equal(importedNotice.sourceSha256, sha(committedNotice), 'Rights notice is bound to committed current source');
 assert.equal(importedNotice.importedSha256, sha(readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md')));
 const committedSections = noticeSections(committedNotice.toString('utf8').replaceAll('\r', ''));
 for (const module of ['head-neck', 'shoulder', 'lower-limb']) {
  const base = `public/atlas-runtime/${module}/`, path = base + 'LICENSES/THIRD_PARTY_NOTICES.md';
  const manifest = json(base + 'manifest.json'), bytes = Buffer.from(readFileSync(path, {encoding: null}));
  const notice = manifest.files.find((file: any) => file.path === 'LICENSES/THIRD_PARTY_NOTICES.md');
  assert(notice, path); assert.equal(sha(bytes), notice.sha256, path + ': exact current emitted notices');
  const moduleSource = pin.runtimeSources[module];
  assert.equal(manifest.sourceCommit, moduleSource, path + ': exact module source');
  const moduleCommittedNotice = bytesAt(sourceRoot, moduleSource, 'LICENSES/THIRD_PARTY_NOTICES.md');
  // A source-only successor may keep the complete notice unchanged. Prove that
  // identity against the audited epoch before admitting the current source.
  if (moduleSource === pin.source) assert.deepEqual(moduleCommittedNotice,
   bytesAt(sourceRoot, '0d9750af66d92aa5a421b34ac6d0c8dd3e5bfd66', 'LICENSES/THIRD_PARTY_NOTICES.md'),
   path + ': complete notice unchanged since audited renderer epoch');
  const exactNoticeHashes: Record<string, string> = {
   [CURRENT_ATLAS_REVISION]: '4c0bb9993c8d89d8410cff382e8179cad3a801deecdb6b48f9b3a7b9f29b2da4',
   'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3': 'a579524e27346d034b190b3432efd63a0a27757de2f97611bd93ab1faf535f43',
   '0d9750af66d92aa5a421b34ac6d0c8dd3e5bfd66': '4c0bb9993c8d89d8410cff382e8179cad3a801deecdb6b48f9b3a7b9f29b2da4',
  };
  assert(exactNoticeHashes[moduleSource], path + ': explicit committed notice epoch');
  assert.equal(sha(bytes), exactNoticeHashes[moduleSource], path + ': exact emitted full notice hash');
  assert.deepEqual(bytes, moduleCommittedNotice, path + ': complete module committed rights notice, not a count-only admission');
  const exactFeatureSection = umNoticeSection(featureBytes(path).toString('utf8').replaceAll('\r', ''));
  const exactCurrentSection = umNoticeSection(bytes.toString('utf8').replaceAll('\r', ''));
  assert.equal(sha(Buffer.from(exactFeatureSection)), '523b998491a1d9dabc26ab63e4675a360d31094724ffe9f91b0235faa00eed86');
  assert.equal(exactCurrentSection, exactFeatureSection, path + ': UM rights section retained byte-exact');
  const earlierSections = noticeSections(featureBytes(path).toString('utf8').replaceAll('\r', ''));
  const currentSections = noticeSections(bytes.toString('utf8').replaceAll('\r', ''));
  const moduleSections = noticeSections(moduleCommittedNotice.toString('utf8').replaceAll('\r', ''));
  assert.equal(earlierSections.size, 142); assert.equal(currentSections.size, moduleSections.size);
  assert.equal(committedSections.size, 326); assert.equal(currentSections.size, moduleSource === pin.source ? 326 : 324);
  for (const [title, section] of moduleSections) assert.equal(currentSections.get(title), section, path + ': complete exact committed section ' + title);
  // Retained modules use c32's rights notice. Current native only appends cited teaching notices.
  assert.deepEqual(committedNotice.subarray(0, moduleCommittedNotice.length), moduleCommittedNotice, path + ': complete retained module notice is the native successor prefix');
  const expectedUpdates = new Map<string, [string, string]>([
   ['## Anatomical meshes', ['16d779acf19a3cffa7a6b57b9877aecf406056f7d319575be281a3bedc642823', '3ca871207662d9a1349f6283288dd22dedff7203c20adf5253623ac023d82d39']],
   ['## Spinal-bone ultrasound orientation — 3 October 2026', ['eb56d60a95bdc0fde329686d07d54ff3ec97b7cf4539f71576714ba51968e652', '1cb9eb10c64ca11b818e922d1f9cada5ca6cd1a1d018d4b07abc199812da5f35']],
  ]);
  let retained = 0, updated = 0;
  for (const [title, earlier] of earlierSections) {
   const now = currentSections.get(title); assert(now, path + ': retained notice ' + title);
   const hashes = expectedUpdates.get(title);
   if (hashes) {
    assert.equal(sha(Buffer.from(earlier)), hashes[0], title + ': saved section');
    assert.equal(sha(Buffer.from(now)), hashes[1], title + ': exact reviewed update');
    updated++;
   } else { assert.equal(now, earlier, path + ': unchanged notice ' + title); retained++; }
  }
  assert.deepEqual({retained, updated}, {retained: 140, updated: 2});
  if (moduleSource === pin.source) assert.equal(bytes.toString('utf8').replaceAll('\r', ''), readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md', 'utf8').replaceAll('\r', ''));
  for (const flag of ['patientDataIncluded', 'clinicalApproved', 'standaloneReviewConnection', 'imagingConnection']) assert.equal(manifest[flag], module === 'shoulder' && flag === 'imagingConnection' ? undefined : false, module + ': exact no-clearance flag ' + flag);
 }

});
