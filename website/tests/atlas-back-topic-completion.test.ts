import assert from 'node:assert/strict';
import test from 'node:test';
import {Buffer} from 'node:buffer';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {build} from 'esbuild';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';

const source = '88cea927d48729769b96ad8fe680b0872b7e6687';
const backTopicMilestone = 'fc5457b6dbc12cb6ce702c2fc272d0bcb6cc59fc';
const sourceBefore = '7d3010368fc53e3433e8df4f9e9d4ddb67e786e8';
const websiteBefore = 'abfd5cf175f2b28417f43a34d34c3c730b453a4e';
const websiteMilestone = 'f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
const liveSource = CURRENT_ATLAS_REVISION;
const sourceRepo = process.env.ATLAS_SOURCE_REPO ?? 'F:/VisibleMedicine/atlas';
const liveSourceRepo = currentAtlasDeliveryRoot();
const gitBytes = (repo: string, revision: string, path: string) => Buffer.from(execFileSync('git', ['-C', repo, 'show', `${revision}:${path}`], {maxBuffer: 32e6}));
const sourceBytes = (path: string) => gitBytes(sourceRepo, source, path);
const previousSourceBytes = (path: string) => gitBytes(sourceRepo, sourceBefore, path);
const previousWebsiteBytes = (path: string) => gitBytes(process.cwd(), websiteBefore, path);
const milestoneWebsiteBytes = (path: string) => gitBytes(process.cwd(), websiteMilestone, path);
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
// Compare both teaching states against the complete milestone registry.
const milestoneRegistryBytes = milestoneWebsiteBytes('atlas-review/lib/specimen-review-material.ts');
assert.equal(sha256(milestoneRegistryBytes),
  '33e4deca7d8c2fed6cab7753ab9a6671fbaeb73e5c26a49bda42274b782b68e1');

async function reviewApi(revision: 'latest' | 'milestone' | 'prior' = 'latest') {
  const result = await build({
    stdin: {contents: [
      "export {backLayersDefinition} from './atlas-review/lib/back-layers';",
      "export {specimenReviewMaterial, specimenReviewRows} from './atlas-review/lib/specimen-review-material';",
      "export {blankSpecimenReview, specimenApprovalProblems} from './atlas-review/lib/specimen-review';",
      "export {postSpecimenReview} from './atlas-review/lib/specimen-review-api';",
    ].join('\n'), resolveDir: process.cwd(), loader: 'ts'},
    bundle: true, write: false, platform: 'node', format: 'esm',
    plugins: revision === 'latest' ? [] : [{name: 'historical-back-topic-teaching', setup(plugin) {
      plugin.onLoad({filter: /[\\/]lib[\\/]specimen-review-material\.ts$/}, args => ({
        contents: milestoneRegistryBytes.toString('utf8'), loader: 'ts', resolveDir: dirname(args.path),
      }));
      plugin.onLoad({filter: /[\\/]content[\\/]hra-pelvic-teaching\.ts$/}, args => ({
        contents: gitBytes(sourceRepo, backTopicMilestone, 'content/hra-pelvic-teaching.ts').toString('utf8'), loader: 'ts', resolveDir: dirname(args.path),
      }));
      // Keep the later renal vocabulary out of both sides of this delivered transition.
      plugin.onLoad({filter: /[\\/]content[\\/]hra-renal-clinical\.ts$/}, args => ({
        contents: gitBytes(sourceRepo, backTopicMilestone, 'content/hra-renal-clinical.ts').toString('utf8'), loader: 'ts', resolveDir: dirname(args.path),
      }));
      if (revision === 'milestone') {
        for (const path of ['content/back-bone-teaching.ts', 'content/back-layers-clinical.ts'])
          plugin.onLoad({filter: new RegExp(path.replaceAll('/', '[\\\\/]') + '$')}, args => ({
            contents: gitBytes(sourceRepo, backTopicMilestone, path).toString('utf8'), loader: 'ts', resolveDir: dirname(args.path),
          }));
        plugin.onLoad({filter: /[\\/]content[\\/]body-renderer-revision\.json$/}, () => ({
          contents: gitBytes(sourceRepo, backTopicMilestone, 'content/body-renderer-revision.json').toString('utf8'), loader: 'json',
        }));
        return;
      }
      for (const path of ['content/back-bone-teaching.ts', 'content/back-layers-clinical.ts'])
        plugin.onLoad({filter: new RegExp(path.replaceAll('/', '[\\\\/]') + '$')}, args => ({
          contents: previousSourceBytes(path).toString('utf8'), loader: 'ts', resolveDir: dirname(args.path),
        }));
      plugin.onLoad({filter: /[\\/]content[\\/]body-renderer-revision\.json$/}, () => ({
        contents: previousSourceBytes('content/body-renderer-revision.json').toString('utf8'), loader: 'json',
      }));
    }}],
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('back-topic completion is pinned in learner and Clinical Review with models, licences and draft boundaries retained', {timeout: 120000}, async () => {
  const review = JSON.parse(milestoneWebsiteBytes('atlas-review/manifest.json').toString());
  const learner = JSON.parse(milestoneWebsiteBytes('public/atlas-runtime/head-neck/manifest.json').toString());
  const inputs = JSON.parse(milestoneWebsiteBytes('public/atlas-runtime/head-neck/source-inputs.json').toString());
  const viewer = JSON.parse(milestoneWebsiteBytes('public/atlas-review-viewer/manifest.json').toString());
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

  for (const path of ['content/back-bone-teaching.ts', 'content/back-layers-clinical.ts', 'content/body-renderer-revision.json']) {
    const entry = review.files.find((item: any) => item.path === path);
    assert(entry, `review import: ${path}`);
    assert.equal(entry.sourceSha256, sha256(sourceBytes(path)), path);
    assert.equal(entry.importedSha256, sha256(milestoneWebsiteBytes('atlas-review/' + path)), path);
    if (path !== 'content/body-renderer-revision.json')
      assert.equal(inputs.find((item: any) => item.path === path)?.sha256, entry.sourceSha256, `learner input: ${path}`);
  }

  const liveReview = json('atlas-review/manifest.json');
  const liveLearner = json('public/atlas-runtime/head-neck/manifest.json');
  const liveInputs = json('public/atlas-runtime/head-neck/source-inputs.json');
  const liveViewer = json('public/atlas-review-viewer/manifest.json');
  assert.equal(liveReview.revision, liveSource);
  assert.equal(liveLearner.sourceCommit, liveSource);
  assert.equal(liveViewer.sourceCommit, liveSource);
  assert.equal(liveViewer.websiteIntegrationSha256, liveReview.websiteIntegrationSha256);
  for (const path of ['content/back-bone-teaching.ts', 'content/back-layers-clinical.ts', 'content/body-renderer-revision.json']) {
    const entry = liveReview.files.find((item: any) => item.path === path);
    assert(entry, `live review import: ${path}`);
    assert.equal(entry.sourceSha256, sha256(gitBytes(liveSourceRepo, liveSource, path)), path);
    assert.equal(entry.importedSha256, sha256(Buffer.from(readFileSync('atlas-review/' + path))), path);
    if (path !== 'content/body-renderer-revision.json')
      assert.equal(liveInputs.find((item: any) => item.path === path)?.sha256, entry.sourceSha256, `live learner input: ${path}`);
  }
  const liveNotice = liveReview.files.find((item: any) => item.path === 'LICENSES/THIRD_PARTY_NOTICES.md');
  assert(liveNotice, 'live source notice');
  assert.equal(liveNotice.sourceSha256, sha256(gitBytes(liveSourceRepo, liveSource, liveNotice.path)));
  assert.equal(liveNotice.importedSha256, sha256(Buffer.from(readFileSync('atlas-review/' + liveNotice.path))));

  for (const module of ['head-neck', 'shoulder']) {
    const path = `public/atlas-runtime/${module}/LICENSES/THIRD_PARTY_NOTICES.md`;
    const before = previousWebsiteBytes(path).toString('utf8').replaceAll('\r', '');
    const nowRaw = readFileSync(path, 'utf8').replaceAll('\r', '');
    const backNotice = gitBytes(process.cwd(), '1377cba878403777924a82515a12faedb679363d', path).toString('utf8').replaceAll('\r', '');
    assert(backNotice.startsWith(before), `complete prior notice retained: ${module}`);
    assert.match(backNotice.slice(before.length), /^\n## Back-specimen teaching completion \(1 October 2026\)\n/);
    const renalNotice = gitBytes(process.cwd(), 'afca2757914d0fc35af577fe1d736caf8549a99f', path).toString('utf8').replaceAll('\r', '');
    assert(renalNotice.startsWith(backNotice), `complete historical renal notice retained: ${module}`);
    assert.match(renalNotice.slice(backNotice.length), /^\n## HRA renal modality-topic completion \(1 October 2026\)\n/);
    const pelvicNotice = milestoneWebsiteBytes(path).toString('utf8').replaceAll('\r', '');
    assert(pelvicNotice.includes(backNotice.slice(before.length)), `exact back notice retained at milestone: ${module}`);
    assert(pelvicNotice.includes(renalNotice.slice(backNotice.length)), `exact renal notice retained at milestone: ${module}`);
    assert(nowRaw.includes(backNotice.slice(before.length)), `exact back notice retained live: ${module}`);
    assert(nowRaw.includes(renalNotice.slice(backNotice.length)), `exact renal notice retained live: ${module}`);
    assert.match(pelvicNotice, /\n## HRA pelvic modality-topic completion \(1 October 2026\)\n/);
    const runtimeSource = JSON.parse(readFileSync(`public/atlas-runtime/${module}/manifest.json`, 'utf8')).sourceCommit;
    assert.equal(nowRaw, gitBytes(liveSourceRepo, runtimeSource, 'LICENSES/THIRD_PARTY_NOTICES.md').toString('utf8').replaceAll('\r', ''),
      `current ${module} notice is exact at its own pinned Atlas source`);
  }
  for (const flag of ['patientDataIncluded', 'clinicalApproved', 'standaloneReviewConnection', 'imagingConnection'])
    assert.equal(learner[flag], false, flag);

  const api = await reviewApi();
  const surface = api.backLayersDefinition.surfaces.find((item: any) => item.tissue === 'skeleton');
  assert(surface, 'back skeletal surface');
  const packet = await api.specimenReviewMaterial(api.backLayersDefinition.key, surface.id);
  assert(packet?.teaching.lesson, 'shipped review lesson');
  const priorApi = await reviewApi('prior');
  const priorPacket = await priorApi.specimenReviewMaterial(api.backLayersDefinition.key, surface.id);
  const newTopic = packet.teaching.topics.find((topic: any) =>
    priorPacket.teaching.topics.find((old: any) => old.tab === topic.tab)?.body === null);
  assert(newTopic?.body.length > 100, 'new draft prose reaches review material');
  assert.equal(packet.context.revisions.imaging, null);
  assert(packet.context.blockers.imaging.length > 0);
  assert.equal(api.blankSpecimenReview(packet.context, 'teaching').status, 'draft');
  const bundle = learner.files.filter((entry: any) => entry.path.endsWith('.js')).map((entry: any) => {
    const bytes = milestoneWebsiteBytes('public/atlas-runtime/head-neck/' + entry.path);
    assert.equal(sha256(bytes), entry.sha256, entry.path);
    return bytes.toString('utf8');
  }).join('\n');
  assert(bundle.includes(surface.id), 'back selection shipped in learner');
  assert(bundle.includes(newTopic.body.slice(0, 65)), 'substantive new back teaching shipped in learner');
});

test('356 source contexts stay fixed; 48 back teaching changes reject 144 stale or foreign submissions before storage', {timeout: 120000}, async () => {
  const currentRegistryBytes = readFileSync('atlas-review/lib/specimen-review-material.ts');
  assert.equal(sha256(currentRegistryBytes),
    '485d3153101e3481eab586108053a824111d732f4dd48ef3f81c07b40e2a39c5');
  assert(!milestoneRegistryBytes.toString('utf8').includes('fdaSpecimenReviewRows'));
  assert(Buffer.from(currentRegistryBytes).toString('utf8').includes('...fdaSpecimenReviewRows'));
  const fdaCatalogueBytes = readFileSync('atlas-review/public/models/fda-shoulder-draft/catalog.json');
  assert.equal(sha256(fdaCatalogueBytes),
    '56cf325c006a00e4349a6b45844797800a11c005448d32a08f40e64664288b44');
  assert.deepEqual(JSON.parse(Buffer.from(fdaCatalogueBytes).toString('utf8')).structures.map((s: any) => s.id), [
    'vm:reference:fda-shoulder-fc9f3e56:ac-ligament',
    'vm:reference:fda-shoulder-fc9f3e56:humeral-cartilage',
    'vm:reference:fda-shoulder-fc9f3e56:labrum',
    'vm:reference:fda-shoulder-fc9f3e56:clavicle',
    'vm:reference:fda-shoulder-fc9f3e56:humerus-source',
    'vm:reference:fda-shoulder-fc9f3e56:scapula',
  ]);
  const current = await reviewApi('milestone');
  const previous = await reviewApi('prior');
  const unreachableStorage = new Proxy({}, {get() { throw Error('Revision conflict reached storage'); }});
  let contexts = 0, changed = 0, unchanged = 0, added = 0, unblocked = 0, rejected = 0;
  for (const row of current.specimenReviewRows) for (const surface of row.surfaces) {
    const label = `${row.key}/${surface.id}`;
    const before = await previous.specimenReviewMaterial(row.key, surface.id);
    const after = await current.specimenReviewMaterial(row.key, surface.id);
    assert(before && after, label);
    contexts++;
    assert.deepEqual(after.source, before.source, label);
    assert.equal(after.context.sourceHash, before.context.sourceHash, label);
    assert.equal(after.context.revisions.imaging, null, label);
    assert(after.context.blockers.imaging.length > 0, label);
    if (row.key !== current.backLayersDefinition.key) {
      unchanged++;
      assert.deepEqual(after.teaching, before.teaching, label);
      assert.equal(after.context.teachingHash, before.context.teachingHash, label);
      assert.equal(after.context.revisions.teaching, before.context.revisions.teaching, label);
      continue;
    }
    changed++;
    assert.notEqual(after.context.teachingHash, before.context.teachingHash, label);
    assert.notEqual(after.context.revisions.teaching, before.context.revisions.teaching, label);
    assert.deepEqual(after.teaching.guidedDissection, before.teaching.guidedDissection, label);
    assert.deepEqual(after.context.checklists.teaching, before.context.checklists.teaching, label);
    assert.equal(after.context.blockers.teaching.length, 0, label);
    if (before.context.blockers.teaching.length) unblocked++;
    const oldLesson = structuredClone(before.teaching.lesson);
    const newLesson = structuredClone(after.teaching.lesson);
    delete oldLesson.extended.topics;
    delete newLesson.extended.topics;
    assert.deepEqual(newLesson, oldLesson, `retained anatomy, function, attachments, self-checks and model limits: ${label}`);
    assert.equal(after.teaching.topics.length, 8, label);
    for (const topic of after.teaching.topics) {
      const old = before.teaching.topics.find((item: any) => item.tab === topic.tab);
      assert(old, `${label}/${topic.tab}`);
      assert.equal(typeof topic.body, 'string', label);
      assert(topic.body.length > 0, label);
      if (old.body !== null) assert.deepEqual(topic, old, `previously populated topic retained: ${label}/${topic.tab}`);
      else {
        assert(topic.body.length > 100, `new topic substantive: ${label}/${topic.tab}`);
        added++;
      }
      assert(topic.references.length > 0, `${label}/${topic.tab}`);
      for (const url of topic.references) assert(after.teaching.referenceTitles[url], `${label}: ${url}`);
    }
    for (const [url, title] of Object.entries(before.teaching.referenceTitles))
      assert.equal(after.teaching.referenceTitles[url], title, `${label}: ${url}`);
    const draft = current.blankSpecimenReview(after.context, 'teaching');
    assert.equal(draft.status, 'draft', label);
    assert.equal(draft.attested, false, label);
    assert(Object.values(draft.checks).every(value => value === false), label);
    const unchecked = {...draft, reviewer: 'Synthetic reviewer', qualification: 'Synthetic qualification', scope: 'Synthetic scope', attested: true, evidence: ['https://example.test/review']};
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
    const copy = structuredClone(after);
    copy.teaching.lesson.extended.topics.clinical.body = 'changed';
    copy.teaching.referenceTitles[Object.keys(copy.teaching.referenceTitles)[0]] = 'changed';
    assert.deepEqual(await current.specimenReviewMaterial(row.key, surface.id), after, `isolated review material: ${label}`);
  }
  assert.equal(contexts, 356);
  assert.equal(changed, 48);
  assert.equal(unchanged, 308);
  assert.equal(added, 89);
  assert.equal(unblocked, 10);
  assert.equal(rejected, 144);
});
