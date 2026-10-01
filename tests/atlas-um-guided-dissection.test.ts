import assert from 'node:assert/strict';
import {withoutEyeCrossSectionalNotice} from './atlas-eye-notice-history.ts';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {Buffer} from 'node:buffer';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname, resolve} from 'node:path';
import {build} from 'esbuild';

const source = '31a6ae7d0a823374b97c21cd7e810070e056d352';
const before = 'ebef136aa174d9b81329d917e4ef129430760ad2';
const sourceRepo = process.env.ATLAS_SOURCE_REPO ?? resolve('..', '..', '..', '2026-09-05', 'referenced-chatgpt-conversation-this-is-an-2', 'outputs');
const bytesAt = (repo: string, revision: string, path: string) => Buffer.from(execFileSync('git', ['-C', repo, 'show', `${revision}:${path}`], {maxBuffer: 32e6}));
const previousBytes = (path: string) => bytesAt(process.cwd(), before, path);
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
async function load(previous = false) {
 const result = await build({stdin: {contents: [
  "export * from './atlas-review/lib/specimen-review-material';",
  "export * from './atlas-review/lib/specimen-review';",
  "export * from './atlas-review/lib/specimen-review-api';",
  "export {limbDefinitions} from './atlas-review/lib/um-limb-studies';",
  "export {umLimbGuidedDissection} from './atlas-review/lib/um-limb-guided-dissection';",
  "export {guidedDissectionAction} from './atlas-review/lib/specimen-guided-dissection';",
 ].join('\n'), resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm',
 plugins: previous ? [{name: 'previous-imported-um-guides', setup(api) {
  for (const path of ['lib/specimen-review-material.ts', 'content/body-renderer-revision.json'])
   api.onLoad({filter: new RegExp(path.replaceAll('/', '[\\\\/]') + '$')}, args => ({contents: previousBytes('atlas-review/' + path).toString('utf8'), loader: path.endsWith('.json') ? 'json' : 'ts', resolveDir: dirname(args.path)}));
 }}] : []});
 return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('five source-bound lower-limb guides ship complete captions and framing to learner and protected review', {timeout: 120000}, async () => {
 const review = json('atlas-review/manifest.json'), learner = json('public/atlas-runtime/head-neck/manifest.json');
 const viewer = json('public/atlas-review-viewer/manifest.json'), inputs = json('public/atlas-runtime/head-neck/source-inputs.json');
 assert.equal(review.revision, source); assert.equal(learner.sourceCommit, source); assert.equal(viewer.sourceCommit, source);
 assert.equal(viewer.personalRecordsIncluded, false); assert.equal(viewer.mode, 'production');
 for (const flag of ['patientDataIncluded', 'clinicalApproved', 'standaloneReviewConnection', 'imagingConnection']) assert.equal(learner[flag], false);
 const oldLearner = JSON.parse(previousBytes('public/atlas-runtime/head-neck/manifest.json').toString('utf8'));
 assert.deepEqual(learner.modelBundles, oldLearner.modelBundles);
 assert.deepEqual(learner.files.filter((f: any) => f.path.startsWith('models/')), oldLearner.files.filter((f: any) => f.path.startsWith('models/')));
 assert.deepEqual(json('lib/atlas-model-inventory.json').models, JSON.parse(previousBytes('lib/atlas-model-inventory.json').toString('utf8')).models);
 assert.equal(json('lib/atlas-model-inventory.json').models.length, 137);
 for (const path of ['app/um-knee-study.tsx', 'lib/specimen-guided-dissection.ts', 'lib/specimen-review-material.ts', 'lib/um-limb-guided-dissection.ts', 'lib/um-proximal-guided-dissection.ts', 'lib/um-distal-guided-dissection.ts']) {
  const entry = review.files.find((f: any) => f.path === path); assert(entry, path);
  assert.equal(entry.sourceSha256, sha(bytesAt(sourceRepo, source, path)), path);
  assert.equal(entry.importedSha256, sha(readFileSync('atlas-review/' + path)), path);
  if (path === 'lib/specimen-review-material.ts') assert.equal(inputs.find((f: any) => f.path === path), undefined, 'Review-only material adapter stays outside the learner');
  else assert.equal(inputs.find((f: any) => f.path === path)?.sha256, entry.sourceSha256, path);
 }
 const bundle = learner.files.filter((f: any) => f.path.endsWith('.js')).map((f: any) => {
  const bytes = Buffer.from(readFileSync('public/atlas-runtime/head-neck/' + f.path)); assert.equal(sha(bytes), f.sha256); return bytes.toString('utf8');
 }).join('\n');
 const additionalBundles: string[] = [];
 for (const module of ['public/atlas-runtime/lower-limb', 'public/atlas-review-viewer']) {
  const manifest = json(module + '/manifest.json'); assert.equal(manifest.sourceCommit, source);
  additionalBundles.push(manifest.files.filter((f: any) => f.path.endsWith('.js')).map((f: any) => {
   const bytes = Buffer.from(readFileSync(module + '/' + f.path)); assert.equal(sha(bytes), f.sha256); return bytes.toString('utf8');
  }).join('\n'));
  if (module.endsWith('/lower-limb')) {
   const old = JSON.parse(previousBytes(module + '/manifest.json').toString('utf8'));
   assert.deepEqual(manifest.files.filter((f: any) => f.path.startsWith('models/')), old.files.filter((f: any) => f.path.startsWith('models/')));
   for (const flag of ['patientDataIncluded', 'clinicalApproved', 'standaloneReviewConnection', 'imagingConnection']) assert.equal(manifest[flag], false);
   const inputs = json(module + '/source-inputs.json');
   for (const path of ['app/um-knee-study.tsx', 'lib/um-limb-guided-dissection.ts', 'lib/um-proximal-guided-dissection.ts', 'lib/um-distal-guided-dissection.ts']) assert.equal(inputs.find((f: any) => f.path === path)?.sha256, sha(bytesAt(sourceRepo, source, path)));
   assert(readFileSync('app/atlas/lower-limb-3d/page.tsx', 'utf8').includes('src="/atlas-runtime/lower-limb/index.html"'));
  }
 }
 const current = await load(); let guides = 0, stops = 0;
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
 for (const module of ['head-neck', 'shoulder', 'lower-limb']) {
  const path = `public/atlas-runtime/${module}/LICENSES/THIRD_PARTY_NOTICES.md`;
  const old = previousBytes(path).toString('utf8').replaceAll('\r', ''), nowRaw = readFileSync(path, 'utf8').replaceAll('\r', '');
  const now = withoutEyeCrossSectionalNotice(nowRaw);
  if (module === 'lower-limb') {
   // This separate pilot skipped earlier batches that prepended dated notices.
   // Preserve the entire old notice body, not just a list of matching headings.
   assert(old.startsWith('# Third-party notices\n\n'));
   assert(now.includes(old.slice('# Third-party notices\n\n'.length)), 'Entire previous independent-pilot notice body retained');
   assert.match(now, /UM.*guided.*dissection/i);
  } else {assert(now.startsWith(old)); assert.match(now.slice(old.length), /UM.*guided.*dissection/i);}
  assert.equal(nowRaw, readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md', 'utf8').replaceAll('\r', ''));
 }
});

test('guided teaching revisions preserve all anatomy, topics and holds; stale approval requests stop before storage', {timeout: 120000}, async () => {
 const current = await load(), previous = await load(true);
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
   unchanged++; assert.deepEqual(now.teaching, old.teaching); assert.equal(now.context.teachingHash, old.context.teachingHash); assert.deepEqual(now.context.checklists, old.context.checklists); continue;
  }
  changed++; assert.equal(old.teaching.guidedDissection, undefined); assert(now.teaching.guidedDissection.steps.some((s: any) => s.ids.includes(surface.id)));
  const teaching = structuredClone(now.teaching); delete teaching.guidedDissection; assert.deepEqual(teaching, old.teaching);
  const checklist = structuredClone(now.context.checklists); assert.equal(checklist.teaching.pop().id, 'guided-dissection'); assert.deepEqual(checklist, old.context.checklists);
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
