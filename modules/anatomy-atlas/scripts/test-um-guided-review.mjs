import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {dirname} from 'node:path';
import {build} from './workspace-test-build.mjs';
const baseline = 'f636891cdcee10aeca20ae684cb04c183fa7600e';
const oldFile = path => execFileSync('git', ['show', baseline + ':' + path], {encoding: 'utf8', maxBuffer: 32e6});
async function load(previous = false) {
  const built = await build({stdin: {contents: "export * from './lib/specimen-review-material'; export * from './lib/specimen-review'; export * from './lib/specimen-review-api'; export {limbDefinitions} from './lib/um-limb-studies'; export {umLimbGuidedDissection} from './lib/um-limb-guided-dissection';", resolveDir: process.cwd(), loader: 'ts'},
    bundle: true, write: false, platform: 'node', format: 'esm', plugins: previous ? [{name: 'before-um-guides', setup(api) {
      for (const path of ['lib/specimen-review-material.ts', 'content/body-renderer-revision.json'])
        api.onLoad({filter: new RegExp(path.replaceAll('/', '[\\\\/]') + '$')}, args => ({contents: oldFile(path), loader: path.endsWith('.json') ? 'json' : 'ts', resolveDir: dirname(args.path)}));
    }}] : []});
  return import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
}
const current = await load(), previous = await load(true);
const unreachableStorage = new Proxy({}, {get() {throw Error('Stale guided request reached storage');}});
const scopes = Object.fromEntries(Object.values(current.limbDefinitions).map(d => [d.key, d]));
let contexts = 0, changed = 0, unchanged = 0, rejected = 0, pending = 0, held = 0;
for (const row of current.specimenReviewRows) for (const surface of row.surfaces) {
  const label = row.key + '/' + surface.id;
  const before = await previous.specimenReviewMaterial(row.key, surface.id);
  const after = await current.specimenReviewMaterial(row.key, surface.id);
  assert(before && after, label); contexts++;
  assert.deepEqual(after.source, before.source, label + ': source packet');
  assert.equal(after.context.sourceHash, before.context.sourceHash, label);
  assert.equal(after.atlasLink, before.atlasLink); assert.equal(after.atlasPath, before.atlasPath);
  assert.deepEqual(after.context.blockers, before.context.blockers, label + ': original holds');
  assert.equal(after.context.revisions.imaging, null);
  pending += after.teaching.topics.filter(t => t.body === null).length;
  if (!scopes[row.key]) {
    unchanged++; assert.deepEqual(after.teaching, before.teaching, label);
    assert.equal(after.context.teachingHash, before.context.teachingHash);
    assert.deepEqual(after.context.checklists, before.context.checklists); continue;
  }
  changed++;
  assert.equal(before.teaching.guidedDissection, undefined);
  const guide = current.umLimbGuidedDissection(scopes[row.key]);
  assert.deepEqual(after.teaching.guidedDissection, guide);
  assert(guide.steps.some(step => step.ids.includes(surface.id)));
  const retained = structuredClone(after.teaching); delete retained.guidedDissection;
  assert.deepEqual(retained, before.teaching, label + ': all original teaching retained');
  assert.notEqual(after.context.teachingHash, before.context.teachingHash);
  assert.notEqual(after.context.revisions.teaching, before.context.revisions.teaching);
  const checks = structuredClone(after.context.checklists);
  assert.equal(checks.teaching.at(-1).id, 'guided-dissection'); checks.teaching.pop();
  assert.deepEqual(checks, before.context.checklists);
  assert(after.context.teachingTabs.includes('guided-dissection'));
  if (!after.teaching.lesson.extended) {
    held++; assert.deepEqual(after.teaching.lesson, before.teaching.lesson);
    assert(after.context.blockers.teaching.length > 0, 'Grouped identity hold persists');
  }
  const draft = current.blankSpecimenReview(after.context, 'teaching');
  assert.equal(draft.status, 'draft'); assert.equal(draft.attested, false);
  assert.equal(draft.checks['guided-dissection'], false);
  assert(current.specimenApprovalProblems({...draft, reviewer: 'Synthetic', qualification: 'Synthetic', scope: 'Synthetic', attested: true, evidence: ['https://example.test']}, after.context, 'teaching').includes('Complete every checklist item.'));
  for (const patch of [{revisionHash: before.context.revisions.teaching}, {materialHash: before.context.materialHash}, {sourceFrame: 'foreign-frame'}]) {
    const response = await current.postSpecimenReview(new Request('https://atlas.test/api/review/specimens', {
      method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_UM_GUIDE'},
      body: JSON.stringify({catalogScope: after.context.catalogScope, specimenKey: row.key, structureId: surface.id, sourceFrame: after.context.sourceFrame,
        materialHash: after.context.materialHash, revisionHash: after.context.revisions.teaching, checklistVersion: after.context.checklistVersion, track: 'teaching', expectedVersion: 0, draft, ...patch}),
    }), unreachableStorage);
    assert.equal(response.status, 409); rejected++;
  }
  const copy = structuredClone(after); copy.teaching.guidedDissection.steps[0].caption = 'changed';
  assert.deepEqual(await current.specimenReviewMaterial(row.key, surface.id), after, label + ': detached packet');
}
assert.equal(contexts, 356); assert.equal(changed, 154); assert.equal(unchanged, 202);
assert.equal(rejected, 462); assert.equal(held, 4); assert.equal(pending, 24);
console.log(JSON.stringify({baseline, unchangedSourceContexts: contexts, changedGuidedContexts: changed, unchangedTeachingContexts: unchanged, rejectedStalePackets: rejected, groupedIdentityHolds: held, pending, clinicalApproved: false}));
