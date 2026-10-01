import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { build } from './workspace-test-build.mjs';

const baseline = 'e88e43b4c0c0aa5d2fa48c2ee5fc0b86c9519abe';
// Retain the delivered pelvic-only delta. The wall/back test separately checks
// current teaching against this milestone across all independent review rows.
const milestone = 'a023f47064b2987c5593d9a7884c7e1937afe001';
const oldFile = (path, revision = baseline) => execFileSync('git', ['show', `${revision}:${path}`], { encoding: 'utf8', maxBuffer: 10_000_000 });
const contents = "export * from './lib/specimen-review-material'; export * from './lib/specimen-review'; export * from './lib/specimen-review-api'; export * from './lib/specimen-review-client'; export * from './lib/hra-pelvic-guided-dissection'; export * from './lib/hra-pelvis'; export * from './lib/independent-specimen'; export * from './lib/specimen-guided-dissection';";
async function load(previous = false) {
  const result = await build({ stdin: { contents, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node',
    plugins: [{ name: 'exact-pelvic-guide-milestone', setup(api) {
      api.onLoad({ filter: /[\\/]lib[\\/]specimen-review-material\.ts$/ }, args => ({ contents: oldFile('lib/specimen-review-material.ts', previous ? baseline : milestone), loader: 'ts', resolveDir: dirname(args.path) }));
      if (previous) api.onLoad({ filter: /[\\/]content[\\/]body-renderer-revision\.json$/ }, () => ({ contents: oldFile('content/body-renderer-revision.json'), loader: 'json' }));
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}
const current = await load(), previous = await load(true);
const guide = current.hraPelvicGuidedDissection(current.hraPelvisDefinition);
const touched = new Set(guide.steps.flatMap(step => step.ids));
let contexts = 0, changed = 0, rejectedStale = 0;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
for (const group of current.specimenReviewRows) for (const row of group.surfaces) {
  const before = await previous.specimenReviewMaterial(group.key, row.id);
  const after = await current.specimenReviewMaterial(group.key, row.id);
  contexts++;
  assert.deepEqual(after.source, before.source, 'Original source, studies and held geometry remain exact');
  assert.equal(after.context.sourceHash, before.context.sourceHash);
  const participates = group.key === guide.specimenKey && touched.has(row.id);
  if (!participates) {
    assert.deepEqual(after.teaching, before.teaching);
    assert.equal(after.context.teachingHash, before.context.teachingHash);
    assert.deepEqual(after.context.teachingTabs, before.context.teachingTabs);
    continue;
  }
  changed++;
  assert.deepEqual(after.teaching.guidedDissection, guide);
  assert.deepEqual(after.teaching.topics, before.teaching.topics);
  assert.notEqual(after.context.teachingHash, before.context.teachingHash);
  assert.notEqual(after.context.revisions.teaching, before.context.revisions.teaching);
  assert(after.context.teachingTabs.includes('guided-dissection'));
  assert(after.context.checklists.teaching.some(check => check.id === 'guided-dissection'));
  const completeExceptGuide = { ...current.blankSpecimenReview(after.context, 'teaching'),
    reviewer: 'Synthetic reviewer', qualification: 'Synthetic test', scope: 'Synthetic scope only', evidence: ['https://example.test/evidence'], attested: true,
    checks: Object.fromEntries(after.context.checklists.teaching.map(check => [check.id, check.id !== 'guided-dissection'])) };
  assert(current.specimenApprovalProblems(completeExceptGuide, after.context, 'teaching').includes('Complete every checklist item.'));
  assert.equal(after.context.revisions.imaging, null);
  const draft = current.blankSpecimenReview(after.context, 'teaching');
  const event = { ...draft, eventSchema: 'vm-specimen-review-event-1', catalogScope: after.context.catalogScope,
    specimenKey: group.key, sourceFrame: after.context.sourceFrame, structureId: row.id, track: 'teaching',
    version: 1, savedAt: '2026-10-01T00:00:00.000Z', reviewedAt: null,
    revisionHash: after.context.revisions.teaching, checklistVersion: after.context.checklistVersion,
    checklist: after.context.checklists.teaching,
    material: Object.fromEntries(['materialHash', 'sourceHash', 'teachingHash', 'rendererHash', 'teachingTabs'].map(key => [key, after.context[key]])),
  };
  assert.deepEqual(current.parseSavedSpecimenReview(event), event, 'New draft review remains readable');
  const old = { ...event, revisionHash: before.context.revisions.teaching };
  assert(current.specimenReviewStale(old, after.context));
  assert.equal(current.specimenDraftFromSaved(old, after.context, 'teaching').attested, false);
  for (const patch of [{ materialHash: before.context.materialHash }, { revisionHash: before.context.revisions.teaching }, { sourceFrame: 'foreign' }]) {
    const payload = { catalogScope: after.context.catalogScope, specimenKey: group.key, sourceFrame: after.context.sourceFrame,
      structureId: row.id, track: 'teaching', expectedVersion: 0, materialHash: after.context.materialHash,
      revisionHash: after.context.revisions.teaching, checklistVersion: after.context.checklistVersion, draft, ...patch };
    const response = await current.postSpecimenReview(new Request('https://atlas.test/api/review/specimens', {
      method: 'POST', headers: { origin: 'https://atlas.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_GUIDE_REVIEW_TEST' }, body: JSON.stringify(payload),
    }), undefined);
    assert.equal(response.status, 409, 'Stale/foreign review rejected before storage');
    rejectedStale++;
  }
  const copied = structuredClone(after);
  copied.teaching.guidedDissection.steps[0].caption = 'not the reviewed caption';
  assert.deepEqual(await current.specimenReviewMaterial(group.key, row.id), after);
}
assert.equal(contexts, 356);
assert.equal(changed, touched.size);
assert(changed > 0);
for (const path of ['public/models/hra-pelvis/catalog.json', 'public/models/hra-pelvis/pelvis.glb', 'public/models/hra-renal/catalog.json']) {
  const original = execFileSync('git', ['show', `${baseline}:${path}`], { maxBuffer: 20_000_000 });
  assert.equal(sha(await readFile(path)), sha(original));
}
// Reject foreign/malformed snapshots, without clobbering a legitimate Undo chain.
const definition = current.hraPelvisDefinition;
const state = current.initialSpecimen(definition);
const changedState = current.reduceSpecimen(definition, state, current.guidedDissectionAction(definition, guide, 0));
const restored = current.reduceSpecimen(definition, changedState, { type: 'restore-state', state });
assert.deepEqual(restored, state); restored.hidden.push('mutation'); assert(!state.hidden.includes('mutation'));
for (const corrupt of [null, {}, { ...state, selectedId: 'foreign' }, { ...state, hidden: ['foreign'] }, { ...state, hidden: [state.selectedId] },
  { ...state, history: [{ selectedId: 'foreign', hidden: [] }] }, { ...state, future: [null] }, { ...state, history: Array(31).fill({ selectedId: null, hidden: [] }) }]) {
  assert.strictEqual(current.reduceSpecimen(definition, changedState, { type: 'restore-state', state: corrupt }), changedState);
}
assert.equal(current.guidedDissectionAction(definition, { ...guide, specimenKey: 'foreign' }, 0), null);
for (const index of [-1, 6, NaN, 0.5]) assert.equal(current.guidedDissectionAction(definition, guide, index), null);
console.log(JSON.stringify({ deliveredTeachingMilestone: milestone, contexts, unchangedSourceContexts: contexts, changedGuidedTeachingContexts: changed, rejectedStalePackets: rejectedStale, modelsUnchanged: true, clinicalApproved: false }));
