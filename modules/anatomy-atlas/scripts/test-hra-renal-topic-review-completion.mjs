import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { build } from './workspace-test-build.mjs';

const baseline = 'fc5457b6dbc12cb6ce702c2fc272d0bcb6cc59fc';
const oldFile = path => execFileSync('git', ['show', `${baseline}:${path}`], { encoding: 'utf8', maxBuffer: 32e6 });
const entry = "export * from './lib/specimen-review-material'; export * from './lib/specimen-review'; export * from './lib/specimen-review-api'; export * from './lib/hra-renal'; export * from './lib/hra-pelvis';";
async function load(previous = false) {
  const result = await build({
    stdin: { contents: entry, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, platform: 'node', format: 'esm',
    plugins: previous ? [{ name: 'before-renal-topic-completion', setup(api) {
      api.onLoad({ filter: /[\\/]content[\\/]hra-renal-clinical\.ts$/ }, args => ({
        contents: oldFile('content/hra-renal-clinical.ts'), loader: 'ts', resolveDir: dirname(args.path),
      }));
      api.onLoad({ filter: /[\\/]content[\\/]body-renderer-revision\.json$/ }, () => ({
        contents: oldFile('content/body-renderer-revision.json'), loader: 'json',
      }));
    } }] : [],
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

const [current, previous] = await Promise.all([load(), load(true)]);
const storage = new Proxy({}, { get() { throw Error('Stale renal-topic request reached storage'); } });
const additions = { mri: 0, ultrasound: 0, xray: 0 };
const newTitles = {
  'https://www.radiologyinfo.org/en/info/abdominrad': 'ACR/RSNA · Abdominal X-ray',
  'https://www.radiologyinfo.org/en/info/abdominus': 'ACR/RSNA · Abdominal ultrasound',
};
let contexts = 0, changed = 0, unchanged = 0, lessonChanges = 0, metadataOnly = 0;
let renalMetadataOnly = 0, pelvicMetadataOnly = 0, unblocked = 0, rejected = 0;
for (const row of current.specimenReviewRows) for (const surface of row.surfaces) {
  const [before, after] = await Promise.all([
    previous.specimenReviewMaterial(row.key, surface.id),
    current.specimenReviewMaterial(row.key, surface.id),
  ]);
  assert(before && after, `${row.key}/${surface.id}`);
  contexts++;
  assert.deepEqual(after.source, before.source, `${row.key}/${surface.id}: source packet`);
  assert.equal(after.context.sourceHash, before.context.sourceHash, `${row.key}/${surface.id}: source hash`);
  assert.equal(after.context.revisions.imaging, null);
  assert(after.context.blockers.imaging.length > 0);

  const missing = row.key === current.hraRenalDefinition.key
    ? before.teaching.topics.filter(topic => Object.hasOwn(additions, topic.tab) && topic.body === null)
    : [];
  const addedTitles = Object.fromEntries(Object.entries(after.teaching.referenceTitles)
    .filter(([url]) => !Object.hasOwn(before.teaching.referenceTitles, url)));
  if (!missing.length && !Object.keys(addedTitles).length) {
    unchanged++;
    assert.deepEqual(after.teaching, before.teaching, `${row.key}/${surface.id}: unaffected teaching`);
    assert.equal(after.context.teachingHash, before.context.teachingHash);
    assert.equal(after.context.revisions.teaching, before.context.revisions.teaching);
    continue;
  }

  if (missing.length) lessonChanges++;
  else {
    metadataOnly++;
    assert.deepEqual(after.teaching.lesson, before.teaching.lesson, `${surface.id}: metadata-only lesson retained`);
    if (row.key === current.hraRenalDefinition.key) renalMetadataOnly++;
    else {
      assert.equal(row.key, current.hraPelvisDefinition.key);
      pelvicMetadataOnly++;
    }
  }
  changed++;
  assert.deepEqual(addedTitles, newTitles, `${row.key}/${surface.id}: exact propagated reference titles`);
  assert.notEqual(after.context.teachingHash, before.context.teachingHash);
  assert.notEqual(after.context.revisions.teaching, before.context.revisions.teaching);
  assert.deepEqual(after.context.checklists, before.context.checklists);
  assert.deepEqual(after.context.blockers.geometry, before.context.blockers.geometry);
  assert.deepEqual(after.context.blockers.imaging, before.context.blockers.imaging);
  if (row.key === current.hraRenalDefinition.key) assert.equal(after.context.blockers.teaching.length, 0);
  else assert.deepEqual(after.context.blockers.teaching, before.context.blockers.teaching);
  if (before.context.blockers.teaching.length && !after.context.blockers.teaching.length) unblocked++;

  const oldTeaching = structuredClone(before.teaching), newTeaching = structuredClone(after.teaching);
  delete oldTeaching.topics; delete newTeaching.topics;
  delete oldTeaching.referenceTitles; delete newTeaching.referenceTitles;
  if (oldTeaching.lesson?.extended?.topics) delete oldTeaching.lesson.extended.topics;
  if (newTeaching.lesson?.extended?.topics) delete newTeaching.lesson.extended.topics;
  assert.deepEqual(newTeaching, oldTeaching, `${surface.id}: existing lesson, guidance and self-check`);
  for (const [url, title] of Object.entries(before.teaching.referenceTitles))
    assert.equal(after.teaching.referenceTitles[url], title, `${surface.id}: ${url}`);
  assert.equal(after.teaching.topics.length, before.teaching.topics.length);
  for (const topic of after.teaching.topics) {
    const old = before.teaching.topics.find(value => value.tab === topic.tab);
    assert(old, `${surface.id}: ${topic.tab}`);
    if (missing.some(value => value.tab === topic.tab)) {
      assert.equal(typeof topic.body, 'string');
      assert(topic.body.length > 100, `${surface.id}: ${topic.tab} needs substantive teaching`);
      assert(topic.references.length > 0, `${surface.id}: ${topic.tab} references`);
      additions[topic.tab]++;
    } else assert.deepEqual(topic, old, `${surface.id}: ${topic.tab} previously populated topic`);
    for (const url of topic.references) assert(after.teaching.referenceTitles[url], `${surface.id}: ${url}`);
  }

  const draft = current.blankSpecimenReview(after.context, 'teaching');
  assert.equal(draft.status, 'draft');
  assert.equal(draft.attested, false);
  assert(Object.values(draft.checks).every(value => value === false));
  const unchecked = { ...draft, reviewer: 'Synthetic test', qualification: 'Synthetic test',
    scope: 'Synthetic scope', attested: true, evidence: ['https://example.test/review'] };
  assert(current.specimenApprovalProblems(unchecked, after.context, 'teaching').includes('Complete every checklist item.'));
  for (const patch of [
    { revisionHash: before.context.revisions.teaching },
    { materialHash: before.context.materialHash },
    { sourceFrame: 'foreign-frame' },
  ]) {
    const payload = { catalogScope: after.context.catalogScope, specimenKey: row.key,
      structureId: surface.id, sourceFrame: after.context.sourceFrame,
      materialHash: after.context.materialHash, revisionHash: after.context.revisions.teaching,
      checklistVersion: after.context.checklistVersion, track: 'teaching',
      expectedVersion: 0, draft, ...patch };
    const response = await current.postSpecimenReview(new Request('https://atlas.test/api/review/specimens', {
      method: 'POST', headers: { origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_RENAL_TOPICS' }, body: JSON.stringify(payload),
    }), storage);
    assert.equal(response.status, 409, `${surface.id}: stale/foreign review must reject before storage`);
    rejected++;
  }

  const mutationTab = missing[0]?.tab;
  if (mutationTab) {
    after.teaching.lesson.extended.topics[mutationTab].body = 'mutated';
    after.teaching.topics.find(topic => topic.tab === mutationTab).body = 'mutated';
  }
  after.teaching.referenceTitles[Object.keys(after.teaching.referenceTitles)[0]] = 'mutated';
  const fresh = await current.specimenReviewMaterial(row.key, surface.id);
  if (mutationTab) {
    assert.notEqual(fresh.teaching.lesson.extended.topics[mutationTab].body, 'mutated');
    assert.notEqual(fresh.teaching.topics.find(topic => topic.tab === mutationTab).body, 'mutated');
  }
  assert.notEqual(fresh.teaching.referenceTitles[Object.keys(after.teaching.referenceTitles)[0]], 'mutated');
}

assert.equal(contexts, 356);
assert.deepEqual(additions, { mri: 21, ultrasound: 24, xray: 49 });
assert.equal(lessonChanges, 49);
assert.equal(renalMetadataOnly, 33);
assert.equal(current.hraPelvisDefinition.surfaces.length, 43);
assert.equal(pelvicMetadataOnly, 43);
assert.equal(metadataOnly, renalMetadataOnly + pelvicMetadataOnly);
assert.equal(changed, 125);
assert.equal(changed, lessonChanges + metadataOnly);
assert.equal(unchanged, 231);
assert.equal(rejected, 375);
assert.equal(unblocked, 0, 'Additional introductory topics do not newly clear a clinical-review prerequisite');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
for (const path of [
  'public/models/hra-renal/kidneys.glb',
  'public/models/hra-renal/catalog.json',
  'content/sources/hra-renal/renal-source.glb',
  'content/sources/hra-renal/retention.json',
]) assert.equal(sha(await readFile(path)), sha(execFileSync('git', ['show', `${baseline}:${path}`], { maxBuffer: 32e6 })), path);
console.log(JSON.stringify({ contexts, unchangedSourceContexts: contexts,
  changedTeachingContexts: changed, unchangedTeachingContexts: unchanged,
  lessonChanges, renalMetadataOnly, pelvicMetadataOnly, newTopicPlacements: additions,
  newSoftwarePrerequisiteContexts: unblocked,
  rejectedStalePackets: rejected, modelsAndSourceRetentionUnchanged: true,
  clinicalApproval: false }));
