import assert from 'node:assert/strict';
import {withoutEyeCrossSectionalNotice} from './atlas-eye-notice-history.ts';
import test from 'node:test';
import {Buffer} from 'node:buffer';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {build} from 'esbuild';

const source = 'fa7dcf45efbad1dc908b02e6c699dcb02e6b3c06';
const renalTopicMilestone = '944f57b801471c3b005a64ec83314188b2f06cf5';
const sourceBefore = 'fc5457b6dbc12cb6ce702c2fc272d0bcb6cc59fc';
const websiteBefore = '1377cba878403777924a82515a12faedb679363d';
const sourceRepo = process.env.ATLAS_SOURCE_REPO ?? resolve('..', '..', '..', '2026-09-05', 'referenced-chatgpt-conversation-this-is-an-2', 'outputs');
const gitBytes = (repo: string, revision: string, path: string) => Buffer.from(execFileSync('git', ['-C', repo, 'show', `${revision}:${path}`], {maxBuffer: 32e6}));
const sourceBytes = (path: string) => gitBytes(sourceRepo, source, path);
const previousSourceBytes = (path: string) => gitBytes(sourceRepo, sourceBefore, path);
const previousWebsiteBytes = (path: string) => gitBytes(process.cwd(), websiteBefore, path);
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

async function reviewApi(revision: 'latest' | 'milestone' | 'prior' = 'latest') {
  const result = await build({
    stdin: {contents: [
      "export {hraRenalDefinition} from './atlas-review/lib/hra-renal';",
      "export {hraPelvisDefinition} from './atlas-review/lib/hra-pelvis';",
      "export {specimenReviewMaterial, specimenReviewRows} from './atlas-review/lib/specimen-review-material';",
      "export {blankSpecimenReview, specimenApprovalProblems} from './atlas-review/lib/specimen-review';",
      "export {postSpecimenReview} from './atlas-review/lib/specimen-review-api';",
    ].join('\n'), resolveDir: process.cwd(), loader: 'ts'},
    bundle: true, write: false, platform: 'node', format: 'esm',
    plugins: revision === 'latest' ? [] : [{name: 'historical-renal-topic-teaching', setup(plugin) {
      plugin.onLoad({filter: /[\\/]content[\\/]hra-pelvic-teaching\.ts$/}, args => ({
        contents: gitBytes(sourceRepo, renalTopicMilestone, 'content/hra-pelvic-teaching.ts').toString('utf8'), loader: 'ts', resolveDir: dirname(args.path),
      }));
      plugin.onLoad({filter: /[\\/]content[\\/]hra-renal-clinical\.ts$/}, args => ({
        contents: gitBytes(sourceRepo, revision === 'prior' ? sourceBefore : renalTopicMilestone, 'content/hra-renal-clinical.ts').toString('utf8'), loader: 'ts', resolveDir: dirname(args.path),
      }));
      plugin.onLoad({filter: /[\\/]content[\\/]body-renderer-revision\.json$/}, () => ({
        contents: gitBytes(sourceRepo, revision === 'prior' ? sourceBefore : renalTopicMilestone, 'content/body-renderer-revision.json').toString('utf8'), loader: 'json',
      }));
    }}],
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('renal modality topics are pinned in learner and Clinical Review with models, licences and draft boundaries retained', {timeout: 120000}, async () => {
  const review = json('atlas-review/manifest.json');
  const learner = json('public/atlas-runtime/head-neck/manifest.json');
  const inputs = json('public/atlas-runtime/head-neck/source-inputs.json');
  const viewer = json('public/atlas-review-viewer/manifest.json');
  const priorLearner = JSON.parse(previousWebsiteBytes('public/atlas-runtime/head-neck/manifest.json').toString('utf8'));
  assert.equal(review.revision, source);
  assert.equal(learner.sourceCommit, source);
  assert.equal(viewer.sourceCommit, source);
  assert.equal(learner.region, 'head-neck');
  assert.equal(viewer.mode, 'production');
  assert.equal(viewer.personalRecordsIncluded, false);
  assert.deepEqual(learner.modelBundles, priorLearner.modelBundles);
  assert.deepEqual(learner.files.filter((entry: any) => entry.path.startsWith('models/')),
    priorLearner.files.filter((entry: any) => entry.path.startsWith('models/')));
  const modelInventory = json('lib/atlas-model-inventory.json');
  assert.equal(modelInventory.models.length, 137);
  assert.deepEqual(modelInventory.models,
    JSON.parse(previousWebsiteBytes('lib/atlas-model-inventory.json').toString('utf8')).models);

  for (const path of ['content/hra-renal-clinical.ts', 'content/body-renderer-revision.json']) {
    const entry = review.files.find((item: any) => item.path === path);
    assert(entry, `review import: ${path}`);
    assert.equal(entry.sourceSha256, sha256(sourceBytes(path)), path);
    assert.equal(entry.importedSha256, sha256(Buffer.from(readFileSync('atlas-review/' + path))), path);
    if (path !== 'content/body-renderer-revision.json')
      assert.equal(inputs.find((item: any) => item.path === path)?.sha256, entry.sourceSha256, `learner input: ${path}`);
  }

  for (const module of ['head-neck', 'shoulder']) {
    const path = `public/atlas-runtime/${module}/LICENSES/THIRD_PARTY_NOTICES.md`;
    const before = previousWebsiteBytes(path).toString('utf8').replaceAll('\r', '');
    const nowRaw = readFileSync(path, 'utf8').replaceAll('\r', '');
    const now = withoutEyeCrossSectionalNotice(nowRaw);
    assert(now.startsWith(before), `complete prior notice retained: ${module}`);
    assert.match(now.slice(before.length), /^\n## HRA renal modality-topic completion \(1 October 2026\)\n/);
    const renalNotice = gitBytes(process.cwd(), 'afca2757914d0fc35af577fe1d736caf8549a99f', path).toString('utf8').replaceAll('\r', '');
    assert(renalNotice.startsWith(before), `historical renal notice retained: ${module}`);
    assert(now.startsWith(renalNotice), `complete renal notice retained: ${module}`);
    assert.match(now.slice(renalNotice.length), /^\n## HRA pelvic modality-topic completion \(1 October 2026\)\n/);
    assert.equal(nowRaw, readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md', 'utf8').replaceAll('\r', ''));
  }
  for (const flag of ['patientDataIncluded', 'clinicalApproved', 'standaloneReviewConnection', 'imagingConnection'])
    assert.equal(learner[flag], false, flag);

  const api = await reviewApi();
  const priorApi = await reviewApi('prior');
  let selected: {surfaceId: string, body: string, packet: any} | undefined;
  for (const surface of api.hraRenalDefinition.surfaces) {
    const packet = await api.specimenReviewMaterial(api.hraRenalDefinition.key, surface.id);
    const prior = await priorApi.specimenReviewMaterial(api.hraRenalDefinition.key, surface.id);
    const topic = packet?.teaching.topics.find((item: any) =>
      ['mri', 'ultrasound', 'xray'].includes(item.tab) &&
      prior?.teaching.topics.find((old: any) => old.tab === item.tab)?.body === null && item.body?.length > 100);
    if (topic) { selected = {surfaceId: surface.id, body: topic.body, packet}; break; }
  }
  assert(selected, 'a new substantive renal modality topic reaches review material');
  assert.equal(selected.packet.context.revisions.imaging, null);
  assert(selected.packet.context.blockers.imaging.length > 0);
  assert.equal(api.blankSpecimenReview(selected.packet.context, 'teaching').status, 'draft');
  const bundle = learner.files.filter((entry: any) => entry.path.endsWith('.js')).map((entry: any) => {
    const bytes = Buffer.from(readFileSync('public/atlas-runtime/head-neck/' + entry.path));
    assert.equal(sha256(bytes), entry.sha256, entry.path);
    return bytes.toString('utf8');
  }).join('\n');
  assert(bundle.includes(selected.surfaceId), 'renal selection shipped in learner');
  assert(bundle.includes(selected.body.slice(0, 65)), 'substantive new renal teaching shipped in learner');
});

test('356 source contexts stay fixed; 125 renal and shared-reference teaching changes reject 375 stale or foreign submissions before storage', {timeout: 120000}, async () => {
  const current = await reviewApi('milestone');
  const previous = await reviewApi('prior');
  const unreachableStorage = new Proxy({}, {get() { throw Error('Revision conflict reached storage'); }});
  const additions = {mri: 0, ultrasound: 0, xray: 0};
  const newTitles = {
    'https://www.radiologyinfo.org/en/info/abdominrad': 'ACR/RSNA · Abdominal X-ray',
    'https://www.radiologyinfo.org/en/info/abdominus': 'ACR/RSNA · Abdominal ultrasound',
  };
  let contexts = 0, changed = 0, unchanged = 0, lessonChanges = 0, metadataOnly = 0;
  let renalMetadataOnly = 0, pelvicMetadataOnly = 0, preservedTopics = 0, unblocked = 0, rejected = 0;
  for (const row of current.specimenReviewRows) for (const surface of row.surfaces) {
    const label = `${row.key}/${surface.id}`;
    const before = await previous.specimenReviewMaterial(row.key, surface.id);
    const after = await current.specimenReviewMaterial(row.key, surface.id);
    assert(before && after, label);
    contexts++;
    assert.deepEqual(after.source, before.source, `${label}: source packet`);
    assert.equal(after.context.sourceHash, before.context.sourceHash, `${label}: source hash`);
    assert.equal(after.context.revisions.imaging, null, label);
    assert(after.context.blockers.imaging.length > 0, label);

    const missing = row.key === current.hraRenalDefinition.key
      ? before.teaching.topics.filter((topic: any) => Object.hasOwn(additions, topic.tab) && topic.body === null)
      : [];
    const addedTitles = Object.fromEntries(Object.entries(after.teaching.referenceTitles)
      .filter(([url]) => !Object.hasOwn(before.teaching.referenceTitles, url)));
    if (!missing.length && !Object.keys(addedTitles).length) {
      unchanged++;
      assert.deepEqual(after.teaching, before.teaching, `${label}: unaffected teaching`);
      assert.equal(after.context.teachingHash, before.context.teachingHash, label);
      assert.equal(after.context.revisions.teaching, before.context.revisions.teaching, label);
      continue;
    }

    if (missing.length) lessonChanges++;
    else {
      metadataOnly++;
      assert.deepEqual(after.teaching.lesson, before.teaching.lesson, `${label}: metadata-only lesson retained`);
      if (row.key === current.hraRenalDefinition.key) renalMetadataOnly++;
      else {
        assert.equal(row.key, current.hraPelvisDefinition.key, label);
        pelvicMetadataOnly++;
      }
    }
    changed++;
    assert.deepEqual(addedTitles, newTitles, `${label}: exact propagated reference titles`);
    assert.notEqual(after.context.teachingHash, before.context.teachingHash, label);
    assert.notEqual(after.context.revisions.teaching, before.context.revisions.teaching, label);
    assert.deepEqual(after.context.checklists, before.context.checklists, label);
    assert.deepEqual(after.context.blockers.geometry, before.context.blockers.geometry, label);
    assert.deepEqual(after.context.blockers.imaging, before.context.blockers.imaging, label);
    if (row.key === current.hraRenalDefinition.key) assert.equal(after.context.blockers.teaching.length, 0, label);
    else assert.deepEqual(after.context.blockers.teaching, before.context.blockers.teaching, label);
    if (before.context.blockers.teaching.length && !after.context.blockers.teaching.length) unblocked++;

    const oldTeaching = structuredClone(before.teaching), newTeaching = structuredClone(after.teaching);
    delete oldTeaching.topics; delete newTeaching.topics;
    delete oldTeaching.referenceTitles; delete newTeaching.referenceTitles;
    if (oldTeaching.lesson?.extended?.topics) delete oldTeaching.lesson.extended.topics;
    if (newTeaching.lesson?.extended?.topics) delete newTeaching.lesson.extended.topics;
    assert.deepEqual(newTeaching, oldTeaching, `${label}: existing lesson, guidance and self-check`);
    for (const [url, title] of Object.entries(before.teaching.referenceTitles))
      assert.equal(after.teaching.referenceTitles[url], title, `${label}: ${url}`);
    assert.equal(after.teaching.topics.length, before.teaching.topics.length, label);
    for (const topic of after.teaching.topics) {
      const old = before.teaching.topics.find((item: any) => item.tab === topic.tab);
      assert(old, `${label}/${topic.tab}`);
      if (row.key === current.hraRenalDefinition.key &&
          topic.tab !== 'anatomy' && topic.tab !== 'function' && old.body !== null) preservedTopics++;
      if (missing.some((item: any) => item.tab === topic.tab)) {
        assert.equal(typeof topic.body, 'string', `${label}/${topic.tab}`);
        assert(topic.body.length > 100, `${label}/${topic.tab}: substantive teaching`);
        assert(topic.references.length > 0, `${label}/${topic.tab}: references`);
        additions[topic.tab as keyof typeof additions]++;
      } else assert.deepEqual(topic, old, `${label}/${topic.tab}: previous topic retained`);
      for (const url of topic.references) assert(after.teaching.referenceTitles[url], `${label}: ${url}`);
    }

    const draft = current.blankSpecimenReview(after.context, 'teaching');
    assert.equal(draft.status, 'draft', label);
    assert.equal(draft.attested, false, label);
    assert(Object.values(draft.checks).every(value => value === false), label);
    const unchecked = {...draft, reviewer: 'Synthetic reviewer', qualification: 'Synthetic qualification',
      scope: 'Synthetic scope', attested: true, evidence: ['https://example.test/review']};
    assert(current.specimenApprovalProblems(unchecked, after.context, 'teaching').includes('Complete every checklist item.'), label);
    for (const patch of [
      {revisionHash: before.context.revisions.teaching},
      {materialHash: before.context.materialHash},
      {sourceFrame: 'foreign-frame'},
    ]) {
      const request = new Request('https://review.test/api/atlas-review/specimen-review', {
        method: 'POST', headers: {'oai-authenticated-user-id': 'synthetic-reviewer', origin: 'https://review.test', 'content-type': 'application/json'},
        body: JSON.stringify({catalogScope: after.context.catalogScope, specimenKey: row.key, structureId: surface.id,
          sourceFrame: after.context.sourceFrame, materialHash: after.context.materialHash, revisionHash: after.context.revisions.teaching,
          checklistVersion: after.context.checklistVersion, track: 'teaching', expectedVersion: 0, draft, ...patch}),
      });
      const response = await current.postSpecimenReview(request, unreachableStorage);
      assert.equal(response.status, 409, `${label}: ${JSON.stringify(patch)}`);
      assert.match((await response.json()).error, /Material changed/);
      rejected++;
    }
    const original = structuredClone(after);
    const mutationTab = missing[0]?.tab;
    if (mutationTab) {
      after.teaching.lesson.extended.topics[mutationTab].body = 'changed';
      after.teaching.topics.find((item: any) => item.tab === mutationTab).body = 'changed';
    }
    after.teaching.referenceTitles[Object.keys(after.teaching.referenceTitles)[0]] = 'changed';
    assert.deepEqual(await current.specimenReviewMaterial(row.key, surface.id), original, `isolated review material: ${label}`);
  }
  assert.equal(contexts, 356);
  assert.deepEqual(additions, {mri: 21, ultrasound: 24, xray: 49});
  assert.equal(lessonChanges, 49);
  assert.equal(renalMetadataOnly, 33);
  assert.equal(current.hraPelvisDefinition.surfaces.length, 43);
  assert.equal(pelvicMetadataOnly, 43);
  assert.equal(metadataOnly, 76);
  assert.equal(changed, 125);
  assert.equal(unchanged, 231);
  assert.equal(preservedTopics, 398);
  assert.equal(unblocked, 0, 'introductory topics do not newly clear a clinical-review prerequisite');
  assert.equal(rejected, 375);
});
