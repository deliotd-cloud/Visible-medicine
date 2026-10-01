import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { build } from './workspace-test-build.mjs';

const baseline = '944f57b801471c3b005a64ec83314188b2f06cf5';
const oldFile = path => execFileSync('git', ['show', `${baseline}:${path}`], { encoding: 'utf8', maxBuffer: 32e6 });
const entry = "export * from './lib/specimen-review-material'; export * from './lib/specimen-review'; export * from './lib/specimen-review-api'; export * from './lib/hra-pelvis'; export * from './content/hra-pelvic-teaching';";
async function load(previous = false) {
  const result = await build({
    stdin: { contents: entry, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, platform: 'node', format: 'esm',
    plugins: previous ? [{ name: 'before-pelvic-topic-completion', setup(api) {
      api.onLoad({ filter: /[\\/]content[\\/]hra-pelvic-teaching\.ts$/ }, args => ({
        contents: oldFile('content/hra-pelvic-teaching.ts'), loader: 'ts', resolveDir: dirname(args.path),
      }));
      api.onLoad({ filter: /[\\/]content[\\/]body-renderer-revision\.json$/ }, () => ({
        contents: oldFile('content/body-renderer-revision.json'), loader: 'json',
      }));
    } }] : [],
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

const [current, previous] = await Promise.all([load(), load(true)]);
const storage = new Proxy({}, { get() { throw Error('Stale pelvic-topic request reached storage'); } });
const expectedAdditions = { ct: 29, xray: 37, ultrasound: 2 };
const additions = { ct: 0, xray: 0, ultrasound: 0 };
const expectedOwnTitles = {
  'https://www.radiologyinfo.org/en/info/abdominct': 'ACR/RSNA · Abdominal and Pelvic CT',
  'https://www.radiologyinfo.org/en/info/abdominrad': 'ACR/RSNA · Abdominal X-ray',
  'https://www.radiologyinfo.org/en/info/pelvus': 'ACR/RSNA · Pelvis Ultrasound',
};
const expectedContextTitles = {
  'https://www.radiologyinfo.org/en/info/abdominct': expectedOwnTitles['https://www.radiologyinfo.org/en/info/abdominct'],
  'https://www.radiologyinfo.org/en/info/pelvus': expectedOwnTitles['https://www.radiologyinfo.org/en/info/pelvus'],
};
const newTitles = Object.fromEntries(Object.entries(current.hraPelvicReferenceTitles)
  .filter(([url]) => !Object.hasOwn(previous.hraPelvicReferenceTitles, url)));
assert.deepEqual(newTitles, expectedOwnTitles, 'Exact new pelvic reference entries');
for (const [url, title] of Object.entries(previous.hraPelvicReferenceTitles))
  assert.equal(current.hraPelvicReferenceTitles[url], title, `Retain reference title: ${url}`);

let contexts = 0, pelvicContexts = 0, changed = 0, unchanged = 0;
let lessonChanges = 0, metadataOnly = 0, unblocked = 0, rejected = 0;
for (const row of current.specimenReviewRows) for (const surface of row.surfaces) {
  const [before, after] = await Promise.all([
    previous.specimenReviewMaterial(row.key, surface.id),
    current.specimenReviewMaterial(row.key, surface.id),
  ]);
  assert(before && after, `${row.key}/${surface.id}`);
  contexts++;
  const isPelvic = row.key === current.hraPelvisDefinition.key;
  if (isPelvic) pelvicContexts++;
  assert.deepEqual(after.source, before.source, `${row.key}/${surface.id}: source packet`);
  assert.equal(after.context.sourceHash, before.context.sourceHash, `${row.key}/${surface.id}: source hash`);
  assert.equal(after.atlasLink, before.atlasLink, `${row.key}/${surface.id}: atlas access link`);
  assert.equal(after.atlasPath, before.atlasPath, `${row.key}/${surface.id}: atlas path`);
  assert.deepEqual(after.context.checklists, before.context.checklists);
  assert.deepEqual(after.context.blockers.geometry, before.context.blockers.geometry);
  assert.deepEqual(after.context.blockers.imaging, before.context.blockers.imaging);
  assert.deepEqual(after.context.blockers.teaching, before.context.blockers.teaching);
  assert.equal(after.context.revisions.imaging, null);
  assert(after.context.blockers.imaging.length > 0);
  assert.deepEqual(after.context.teachingTabs.filter(tab => !Object.hasOwn(expectedAdditions, tab)),
    before.context.teachingTabs.filter(tab => !Object.hasOwn(expectedAdditions, tab)));
  if (before.context.blockers.teaching.length && !after.context.blockers.teaching.length) unblocked++;

  if (!isPelvic) {
    unchanged++;
    assert.deepEqual(after.teaching, before.teaching, `${row.key}/${surface.id}: unaffected teaching`);
    assert.equal(after.context.teachingHash, before.context.teachingHash);
    assert.equal(after.context.revisions.teaching, before.context.revisions.teaching);
    continue;
  }

  changed++;
  const missing = before.teaching.topics.filter(topic =>
    Object.hasOwn(expectedAdditions, topic.tab) && topic.body === null);
  if (missing.length) lessonChanges++;
  else {
    metadataOnly++;
    assert.deepEqual(after.teaching.lesson, before.teaching.lesson,
      `${surface.id}: metadata-only lesson retained`);
  }
  const addedTitles = Object.fromEntries(Object.entries(after.teaching.referenceTitles)
    .filter(([url]) => !Object.hasOwn(before.teaching.referenceTitles, url)));
  assert.deepEqual(addedTitles, expectedContextTitles, `${surface.id}: propagated pelvic reference titles`);
  for (const [url, title] of Object.entries(before.teaching.referenceTitles))
    assert.equal(after.teaching.referenceTitles[url], title, `${surface.id}: ${url}`);
  assert.notEqual(after.context.teachingHash, before.context.teachingHash);
  assert.notEqual(after.context.revisions.teaching, before.context.revisions.teaching);

  const oldTeaching = structuredClone(before.teaching), newTeaching = structuredClone(after.teaching);
  delete oldTeaching.topics; delete newTeaching.topics;
  delete oldTeaching.referenceTitles; delete newTeaching.referenceTitles;
  if (oldTeaching.lesson?.extended?.topics) delete oldTeaching.lesson.extended.topics;
  if (newTeaching.lesson?.extended?.topics) delete newTeaching.lesson.extended.topics;
  assert.deepEqual(newTeaching, oldTeaching, `${surface.id}: existing core, guidance and self-check`);
  const oldExtendedTopics = structuredClone(before.teaching.lesson?.extended?.topics ?? {});
  const newExtendedTopics = structuredClone(after.teaching.lesson?.extended?.topics ?? {});
  for (const topic of missing) delete newExtendedTopics[topic.tab];
  assert.deepEqual(newExtendedTopics, oldExtendedTopics,
    `${surface.id}: every previously populated extended topic retained`);
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
    for (const url of topic.references)
      assert(after.teaching.referenceTitles[url], `${surface.id}: ${url}`);
  }
  for (const tab of Object.keys(expectedAdditions)) {
    const old = before.teaching.lesson?.extended?.topics?.[tab];
    const now = after.teaching.lesson?.extended?.topics?.[tab];
    if (missing.some(value => value.tab === tab)) {
      assert.equal(old, undefined, `${surface.id}: ${tab} was absent in baseline`);
      assert.equal(now?.readiness, 'draft', `${surface.id}: ${tab} remains draft`);
      assert.equal(now?.body, after.teaching.topics.find(topic => topic.tab === tab)?.body);
    } else assert.deepEqual(now, old, `${surface.id}: ${tab} retained`);
  }

  const draft = current.blankSpecimenReview(after.context, 'teaching');
  assert.equal(draft.status, 'draft');
  assert.equal(draft.attested, false);
  assert(Object.values(draft.checks).every(value => value === false));
  const unchecked = { ...draft, reviewer: 'Synthetic test', qualification: 'Synthetic test',
    scope: 'Synthetic scope', attested: true, evidence: ['https://example.test/review'] };
  assert(current.specimenApprovalProblems(unchecked, after.context, 'teaching')
    .includes('Complete every checklist item.'));
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
        'oai-authenticated-user-id': 'SYNTHETIC_PELVIC_TOPICS' }, body: JSON.stringify(payload),
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
assert.equal(pelvicContexts, 43);
assert.deepEqual(additions, expectedAdditions);
assert.equal(changed, 43);
assert.equal(lessonChanges, 38);
assert.equal(metadataOnly, 5);
assert.equal(changed, lessonChanges + metadataOnly);
assert.equal(unchanged, 313);
assert.equal(rejected, 129);
assert.equal(unblocked, 0, 'Teaching additions cannot newly clear a clinical-review prerequisite');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
for (const path of [
  'public/models/hra-pelvis/pelvis.glb',
  'public/models/hra-pelvis/catalog.json',
  'content/sources/hra-pelvis/pelvic-source.glb',
  'content/sources/hra-pelvis/metadata.json',
  'content/sources/hra-pelvis/crosswalk.csv',
  'public/models/hra-renal/kidneys.glb',
  'public/models/hra-renal/catalog.json',
]) assert.equal(sha(await readFile(path)), sha(execFileSync('git', ['show', `${baseline}:${path}`], { maxBuffer: 32e6 })), path);
console.log(JSON.stringify({ contexts, unchangedSourceContexts: contexts,
  changedTeachingContexts: changed, unchangedTeachingContexts: unchanged,
  lessonChanges, metadataOnly, newReferenceTitles: Object.keys(newTitles).length,
  newReviewPacketReferenceTitles: Object.keys(expectedContextTitles).length,
  newTopicPlacements: additions, newSoftwarePrerequisiteContexts: unblocked,
  rejectedStalePackets: rejected, modelsAndSourceRetentionUnchanged: true,
  clinicalApproval: false }));
