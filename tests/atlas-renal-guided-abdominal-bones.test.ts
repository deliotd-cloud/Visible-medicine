import assert from 'node:assert/strict';
import test from 'node:test';
import {Buffer} from 'node:buffer';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {build} from 'esbuild';

const source = '31a6ae7d0a823374b97c21cd7e810070e056d352';
const sourceBefore = 'adad1abe1ad6fdb3c942d1d8b6a98393591bec80';
const renalBoneMilestone = '7d3010368fc53e3433e8df4f9e9d4ddb67e786e8';
const websiteBefore = 'c0da7e2bf6a9f6f3e262b8c5326c369e5e6cafd2';
const sourceRepo = process.env.ATLAS_SOURCE_REPO ?? resolve('..', '..', '..', '2026-09-05', 'referenced-chatgpt-conversation-this-is-an-2', 'outputs');
const gitBytes = (repo: string, revision: string, path: string) => Buffer.from(execFileSync('git', ['-C', repo, 'show', `${revision}:${path}`], {maxBuffer: 32e6}));
const sourceBytes = (path: string) => gitBytes(sourceRepo, source, path);
const previousSourceBytes = (path: string) => gitBytes(sourceRepo, sourceBefore, path);
const previousWebsiteBytes = (path: string) => Buffer.from(execFileSync('git', ['show', `${websiteBefore}:${path}`], {maxBuffer: 32e6}));
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

async function reviewApi(revision: 'latest' | 'prior' | 'milestone' = 'latest') {
  const result = await build({
    stdin: {contents: [
      "export {hraRenalDefinition} from './atlas-review/lib/hra-renal';",
      "export {hraRenalGuidedDissection} from './atlas-review/lib/hra-renal-guided-dissection';",
      "export {abdominalWallDefinition} from './atlas-review/lib/abdominal-wall';",
      "export {specimenReviewMaterial, specimenReviewRows} from './atlas-review/lib/specimen-review-material';",
      "export {blankSpecimenReview, specimenReviewStale, specimenDecisionLabel, specimenApprovalProblems} from './atlas-review/lib/specimen-review';",
      "export {postSpecimenReview} from './atlas-review/lib/specimen-review-api';",
    ].join('\n'), resolveDir: process.cwd(), loader: 'ts'},
    bundle: true, write: false, platform: 'node', format: 'esm',
    plugins: revision === 'latest' ? [] : [{name: 'historical-renal-and-bone-teaching', setup(plugin) {
      const adapterRevision = revision === 'prior' ? sourceBefore : renalBoneMilestone;
      plugin.onLoad({filter: /[\\/]content[\\/]hra-pelvic-teaching\.ts$/}, args => ({
        contents: gitBytes(sourceRepo, renalBoneMilestone, 'content/hra-pelvic-teaching.ts').toString('utf8'), loader: 'ts', resolveDir: dirname(args.path),
      }));
      for (const path of ['lib/specimen-review-material.ts', 'lib/abdominal-wall-teaching.ts'])
        plugin.onLoad({filter: new RegExp(path.replaceAll('/', '[\\\\/]') + '$')}, args => ({
          contents: gitBytes(sourceRepo, adapterRevision, path).toString('utf8'), loader: 'ts', resolveDir: dirname(args.path),
        }));
      for (const path of ['content/back-bone-teaching.ts', 'content/back-layers-clinical.ts'])
        plugin.onLoad({filter: new RegExp(path.replaceAll('/', '[\\\\/]') + '$')}, args => ({
          contents: gitBytes(sourceRepo, renalBoneMilestone, path).toString('utf8'), loader: 'ts', resolveDir: dirname(args.path),
        }));
      plugin.onLoad({filter: /[\\/]content[\\/]hra-renal-clinical\.ts$/}, args => ({
        contents: gitBytes(sourceRepo, renalBoneMilestone, 'content/hra-renal-clinical.ts').toString('utf8'), loader: 'ts', resolveDir: dirname(args.path),
      }));
      plugin.onLoad({filter: /[\\/]content[\\/]body-renderer-revision\.json$/}, () => ({
        contents: gitBytes(sourceRepo, adapterRevision, 'content/body-renderer-revision.json').toString('utf8'), loader: 'json',
      }));
    }}],
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('pinned renal guide and abdominal bone lessons ship in the shared learner and protected review', {timeout: 120000}, async () => {
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
  assert.deepEqual(learner.modelBundles, priorLearner.modelBundles);
  assert.deepEqual(learner.files.filter((entry: any) => entry.path.startsWith('models/')).map((entry: any) => entry.path),
    priorLearner.files.filter((entry: any) => entry.path.startsWith('models/')).map((entry: any) => entry.path));

  const learnerPaths = new Set([
    'lib/hra-renal-guided-dissection.ts', 'lib/hra-renal.ts', 'app/hra-renal-study.tsx',
    'lib/abdominal-wall-teaching.ts', 'content/abdominal-bone-teaching.ts', 'app/abdominal-wall-study.tsx',
  ]);
  for (const path of [...learnerPaths, 'lib/specimen-review-material.ts', 'lib/specimen-review.ts', 'app/review/specimens/workspace.tsx']) {
    const entry = review.files.find((item: any) => item.path === path);
    assert(entry, `review import: ${path}`);
    assert.equal(entry.sourceSha256, sha256(sourceBytes(path)), path);
    assert.equal(entry.importedSha256, sha256(Buffer.from(readFileSync('atlas-review/' + path))), path);
    if (learnerPaths.has(path)) assert.equal(inputs.find((item: any) => item.path === path)?.sha256, entry.sourceSha256, `learner input: ${path}`);
  }

  const api = await reviewApi();
  const renal = api.hraRenalDefinition;
  const guide = api.hraRenalGuidedDissection(renal);
  assert(guide);
  assert.equal(renal.surfaces.length, 82);
  assert.equal(renal.studies.length, 9);
  assert.equal(guide.id, 'hra-renal-source-guide');
  assert.equal(guide.status, 'draft');
  assert.equal(guide.specimenKey, renal.key);
  assert.equal(guide.sourceFrame, 'hra-united-female-v1.10:lps-mm');
  const steps = [
    ['right-supplied-layers', 'layers-right', 37], ['right-interior', 'internal-right', 34],
    ['right-collecting', 'collecting-right', 14], ['left-supplied-layers', 'layers-left', 40],
    ['left-interior', 'internal-left', 37], ['left-collecting', 'collecting-left', 15],
    ['bilateral-hila', 'hila', 7], ['bilateral-pelves-ureters', 'ureters', 4],
  ] as const;
  assert.deepEqual(guide.steps.map((step: any) => step.id), steps.map(([id]) => id));
  const guidedIds = new Set<string>();
  for (const [index, [, studyId, count]] of steps.entries()) {
    const step = guide.steps[index];
    const study = renal.studies.find((item: any) => item.id === studyId);
    assert(study, studyId);
    assert.deepEqual(step.ids, study.ids, step.id);
    assert.equal(step.ids.length, count, step.id);
    assert.equal(step.selectedId, study.selectedId, step.id);
    assert.equal(step.view, study.view, step.id);
    assert(step.ids.includes(step.selectedId), step.id);
    assert(step.caption.length > 60, step.id);
    step.ids.forEach((id: string) => guidedIds.add(id));
  }
  assert.equal(guidedIds.size, 82);
  const held = ['VH_F_outer_cortex_of_kidney_L', 'VH_F_renal_column_R', 'VH_F_left_renal_vein'];
  assert(held.every(name => !renal.surfaces.some((surface: any) => surface.sourceName === name)));
  assert.match(guide.limitation, /revision-bound radiologist review/i);
  assert.equal(api.hraRenalGuidedDissection({...renal, sourceFrame: 'foreign-frame'}), null);

  const bones = api.abdominalWallDefinition.surfaces.filter((surface: any) => surface.tissue === 'skeleton');
  assert.equal(bones.length, 21);
  for (const surface of bones) {
    const packet = await api.specimenReviewMaterial(api.abdominalWallDefinition.key, surface.id);
    assert(packet?.teaching.lesson, surface.id);
    assert(packet.teaching.lesson.anatomy.length > 80, surface.id);
    assert(packet.teaching.lesson.function.length > 70, surface.id);
    assert.deepEqual(Object.keys(packet.teaching.lesson.extended.topics).sort(), ['clinical', 'ct', 'mri', 'pathology', 'ultrasound', 'xray']);
    assert(Object.values(packet.teaching.lesson.extended.topics).every((topic: any) => topic.readiness === 'draft' && topic.body.length > 80), surface.id);
    for (const topic of packet.teaching.topics)
      for (const url of topic.references) assert(packet.teaching.referenceTitles[url], `${surface.id}: ${url}`);
  }

  const bundle = learner.files.filter((entry: any) => entry.path.endsWith('.js')).map((entry: any) => {
    const bytes = Buffer.from(readFileSync('public/atlas-runtime/head-neck/' + entry.path));
    assert.equal(sha256(bytes), entry.sha256, entry.path);
    return bytes.toString('utf8');
  }).join('\n');
  for (const phrase of [guide.id, ...guide.steps.map((step: any) => step.caption), 'Guided learning'])
    assert(bundle.includes(phrase), `shipped learner: ${phrase}`);
  assert(bundle.includes(bones[0].id), 'shipped skeletal selection');
  const reviewUi = readFileSync('atlas-review/app/review/specimens/workspace.tsx', 'utf8');
  assert(reviewUi.includes('Guided dissection to review'));
  assert(reviewUi.includes('guidedDissection.steps.map'));

  assert.deepEqual(json('lib/atlas-model-inventory.json').models,
    JSON.parse(previousWebsiteBytes('lib/atlas-model-inventory.json').toString('utf8')).models);
  for (const [scope, files] of [
    ['hra-renal', ['catalog.json', 'kidneys.glb', 'NOTICE.md']],
    ['bodyparts3d-v3/abdominal-wall', ['catalog.json', 'abdominal-wall.glb', 'NOTICE.md']],
  ] as const) for (const file of files) {
    const path = `public/models/${scope}/${file}`;
    assert.equal(sha256(sourceBytes(path)), sha256(previousSourceBytes(path)), `unchanged source asset: ${path}`);
    assert.equal(sha256(Buffer.from(readFileSync('public/atlas-runtime/head-neck/models/' + scope + '/' + file))), sha256(sourceBytes(path)), `shipped asset: ${path}`);
  }
  for (const flag of ['patientDataIncluded', 'clinicalApproved', 'standaloneReviewConnection', 'imagingConnection'])
    assert.equal(learner[flag], false, flag);
  assert.equal(viewer.personalRecordsIncluded, false);
  assert.equal(viewer.mode, JSON.parse(previousWebsiteBytes('public/atlas-review-viewer/manifest.json').toString('utf8')).mode);
});

test('356 source identities stay fixed; 103 teaching changes reject 309 stale or foreign submissions before storage', {timeout: 120000}, async () => {
  const current = await reviewApi('milestone');
  const previous = await reviewApi('prior');
  const guide = current.hraRenalGuidedDissection(current.hraRenalDefinition);
  assert(guide);
  const renalIds = new Set<string>(guide.steps.flatMap((step: any) => step.ids));
  const boneIds = new Set<string>(current.abdominalWallDefinition.surfaces.filter((surface: any) => surface.tissue === 'skeleton').map((surface: any) => surface.id));
  const unreachableStorage = new Proxy({}, {get() { throw Error('Revision conflict reached storage'); }});
  let contexts = 0, renal = 0, bones = 0, unchanged = 0, rejected = 0;
  for (const row of current.specimenReviewRows) for (const surface of row.surfaces) {
    const label = `${row.key}/${surface.id}`;
    const now = await current.specimenReviewMaterial(row.key, surface.id);
    const before = await previous.specimenReviewMaterial(row.key, surface.id);
    assert(now && before, label);
    contexts++;
    assert.deepEqual(now.source, before.source, label);
    assert.equal(now.context.sourceHash, before.context.sourceHash, label);
    const isRenal = row.key === guide.specimenKey && renalIds.has(surface.id);
    const isBone = row.key === current.abdominalWallDefinition.key && boneIds.has(surface.id);
    if (!isRenal && !isBone) {
      unchanged++;
      assert.deepEqual(now.teaching, before.teaching, label);
      assert.equal(now.context.teachingHash, before.context.teachingHash, label);
      assert.equal(now.context.revisions.teaching, before.context.revisions.teaching, label);
      assert.deepEqual(now.context.checklists.teaching, before.context.checklists.teaching, label);
      continue;
    }
    if (isRenal) {
      renal++;
      assert.deepEqual(now.teaching.guidedDissection, guide, label);
      const retained = structuredClone(now.teaching);
      delete retained.guidedDissection;
      assert.deepEqual(retained, before.teaching, label);
      assert.equal(now.context.checklists.teaching.at(-1).id, 'guided-dissection', label);
    } else {
      bones++;
      assert.equal(before.teaching.lesson, null, label);
      assert(now.teaching.lesson, label);
      assert.deepEqual(now.teaching.guidedDissection, before.teaching.guidedDissection, label);
      assert.deepEqual(before.context.teachingTabs, ['guided-dissection'], label);
      assert.deepEqual(now.context.teachingTabs, ['anatomy', 'function', 'clinical', 'pathology', 'ct', 'mri', 'xray', 'ultrasound', 'self-check', 'guided-dissection'], label);
    }
    assert.notEqual(now.context.teachingHash, before.context.teachingHash, label);
    assert.notEqual(now.context.revisions.teaching, before.context.revisions.teaching, label);
    assert.equal(now.context.revisions.imaging, null, label);
    assert(now.context.blockers.imaging.length > 0, label);
    const draft = current.blankSpecimenReview(now.context, 'teaching');
    assert.equal(draft.status, 'draft', label);
    assert.equal(draft.attested, false, label);
    assert(Object.values(draft.checks).every(value => value === false), label);
    const unchecked = {...draft, reviewer: 'Synthetic reviewer', qualification: 'Synthetic qualification', scope: 'Synthetic source only', attested: true, evidence: ['https://example.test/review']};
    assert(current.specimenApprovalProblems(unchecked, now.context, 'teaching').includes('Complete every checklist item.'), label);
    for (const patch of [
      {revisionHash: before.context.revisions.teaching},
      {materialHash: before.context.materialHash},
      {sourceFrame: 'foreign-frame'},
    ]) {
      const request = new Request('https://review.test/api/atlas-review/specimen-review', {
        method: 'POST', headers: {'oai-authenticated-user-id': 'synthetic-reviewer', origin: 'https://review.test', 'content-type': 'application/json'},
        body: JSON.stringify({catalogScope: now.context.catalogScope, specimenKey: row.key, structureId: surface.id,
          sourceFrame: now.context.sourceFrame, materialHash: now.context.materialHash, revisionHash: now.context.revisions.teaching,
          checklistVersion: now.context.checklistVersion, track: 'teaching', expectedVersion: 0, draft, ...patch}),
      });
      const response = await current.postSpecimenReview(request, unreachableStorage);
      assert.equal(response.status, 409, `${label}: ${JSON.stringify(patch)}`);
      assert.match((await response.json()).error, /Material changed/);
      rejected++;
    }
  }
  assert.equal(contexts, 356);
  assert.equal(renal, 82);
  assert.equal(bones, 21);
  assert.equal(unchanged, 253);
  assert.equal(rejected, 309);
});
