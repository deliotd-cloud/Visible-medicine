import assert from 'node:assert/strict';
import test from 'node:test';
import {Buffer} from 'node:buffer';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {build} from 'esbuild';

const source = '871c57b7729476bb08cbf04d58732b90fc4b52c5';
const sourceBefore = 'a023f47064b2987c5593d9a7884c7e1937afe001';
const wallBackMilestone = 'adad1abe1ad6fdb3c942d1d8b6a98393591bec80';
const websiteBefore = 'c5448a86591b231d29719b37f5f5ed9eb3ee416b';
const sourceRepo = process.env.ATLAS_SOURCE_REPO ?? resolve('..', '..', '..', '2026-09-05', 'referenced-chatgpt-conversation-this-is-an-2', 'outputs');
const gitBytes = (repo: string, revision: string, path: string) => Buffer.from(execFileSync('git', ['-C', repo, 'show', `${revision}:${path}`], {maxBuffer: 32e6}));
const sourceBytes = (path: string) => gitBytes(sourceRepo, source, path);
const priorSourceBytes = (path: string) => gitBytes(sourceRepo, sourceBefore, path);
const priorWebsiteBytes = (path: string) => Buffer.from(execFileSync('git', ['show', `${websiteBefore}:${path}`], {maxBuffer: 12e6}));
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

// Reconstruct the delivered wall/back transition independently of later renal
// and skeletal teaching. Both sides pin the adapter, teaching and renderer inputs.
async function materialApi(revision: 'latest' | 'prior' | 'milestone' = 'latest') {
  const result = await build({
    stdin: {contents: [
      "export {abdominalWallDefinition} from './atlas-review/lib/abdominal-wall';",
      "export {backLayersDefinition} from './atlas-review/lib/back-layers';",
      "export {abdominalGuidedDissection} from './atlas-review/lib/abdominal-guided-dissection';",
      "export {backGuidedDissection} from './atlas-review/lib/back-guided-dissection';",
      "export {specimenReviewMaterial, specimenReviewRows} from './atlas-review/lib/specimen-review-material';",
      "export {blankSpecimenReview, specimenReviewStale, specimenDecisionLabel} from './atlas-review/lib/specimen-review';",
      "export {postSpecimenReview} from './atlas-review/lib/specimen-review-api';",
    ].join('\n'), resolveDir: process.cwd(), loader: 'ts'},
    bundle: true, write: false, platform: 'node', format: 'esm',
    plugins: revision === 'latest' ? [] : [{name: 'historical-wall-back-material', setup(plugin) {
      const commit = revision === 'prior' ? sourceBefore : wallBackMilestone;
      plugin.onLoad({filter: /[\\/]content[\\/]hra-pelvic-teaching\.ts$/}, args => ({
        contents: gitBytes(sourceRepo, commit, 'content/hra-pelvic-teaching.ts').toString('utf8'), loader: 'ts', resolveDir: dirname(args.path),
      }));
      for (const path of ['lib/specimen-review-material.ts', 'lib/abdominal-wall-teaching.ts', 'content/back-bone-teaching.ts', 'content/back-layers-clinical.ts'])
        plugin.onLoad({filter: new RegExp(path.replaceAll('/', '[\\\\/]') + '$')}, args => ({
          contents: gitBytes(sourceRepo, commit, path).toString('utf8'), loader: 'ts', resolveDir: dirname(args.path),
        }));
      plugin.onLoad({filter: /[\\/]content[\\/]hra-renal-clinical\.ts$/}, args => ({
        contents: gitBytes(sourceRepo, wallBackMilestone, 'content/hra-renal-clinical.ts').toString('utf8'), loader: 'ts', resolveDir: dirname(args.path),
      }));
      plugin.onLoad({filter: /[\\/]content[\\/]body-renderer-revision\.json$/}, () => ({
        contents: gitBytes(sourceRepo, commit, 'content/body-renderer-revision.json').toString('utf8'), loader: 'json',
      }));
    }}],
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('wall and back guidance ships from the pinned source in the shared learner and review viewer', {timeout: 120000}, async () => {
  const review = json('atlas-review/manifest.json');
  const learner = json('public/atlas-runtime/head-neck/manifest.json');
  const inputs = json('public/atlas-runtime/head-neck/source-inputs.json');
  const viewer = json('public/atlas-review-viewer/manifest.json');
  const priorLearner = JSON.parse(priorWebsiteBytes('public/atlas-runtime/head-neck/manifest.json').toString('utf8'));
  assert.equal(review.revision, source);
  assert.equal(learner.sourceCommit, source);
  assert.equal(viewer.sourceCommit, source);
  assert.equal(learner.region, 'head-neck');
  assert.equal(viewer.mode, 'production');
  assert.deepEqual(learner.modelBundles, priorLearner.modelBundles);
  assert.deepEqual(learner.files.filter((entry: any) => entry.path.startsWith('models/')).map((entry: any) => entry.path),
    priorLearner.files.filter((entry: any) => entry.path.startsWith('models/')).map((entry: any) => entry.path));
  const learnerPaths = new Set([
    'lib/abdominal-guided-dissection.ts', 'lib/back-guided-dissection.ts',
    'lib/specimen-guided-dissection.ts', 'app/abdominal-wall-study.tsx',
    'app/back-layers-study.tsx', 'app/um-knee-study.tsx',
  ]);
  for (const path of [...learnerPaths, 'lib/specimen-review-material.ts', 'lib/specimen-review.ts', 'app/review/specimens/workspace.tsx']) {
    const file = review.files.find((entry: any) => entry.path === path);
    assert(file, `review import: ${path}`);
    assert.equal(file.sourceSha256, hash(sourceBytes(path)), path);
    assert.equal(file.importedSha256, hash(Buffer.from(readFileSync('atlas-review/' + path))), path);
    if (learnerPaths.has(path))
      assert.equal(inputs.find((entry: any) => entry.path === path)?.sha256, file.sourceSha256, `learner input: ${path}`);
  }

  const api = await materialApi();
  const cases = [
    {definition: api.abdominalWallDefinition, make: api.abdominalGuidedDissection,
      id: 'bp3d3-abdominal-wall-source-guide', path: 'abdominal-wall', surfaceCount: 29, studies: 7,
      stepIds: ['abdominal-all', 'abdominal-internal', 'abdominal-transverse', 'abdominal-rectus', 'abdominal-right', 'abdominal-left'],
      studyIds: ['all', 'internal', 'transverse', 'rectus', 'right', 'left'], counts: [29, 27, 25, 23, 25, 25], view: 'anterior'},
    {definition: api.backLayersDefinition, make: api.backGuidedDissection,
      id: 'back-layers-source-guide', path: 'back-layers', surfaceCount: 48, studies: 8,
      stepIds: ['supplied-context', 'trapezius-aside', 'rhomboid-comparison', 'latissimus-comparison', 'multifidus-comparison', 'source-context-return'],
      studyIds: ['all', 'below-trapezius', 'rhomboids', 'latissimus', 'multifidus', 'all'], counts: [48, 42, 38, 36, 36, 48], view: 'posterior'},
  ];
  const bundle = learner.files.filter((entry: any) => entry.path.endsWith('.js')).map((entry: any) => {
    const bytes = Buffer.from(readFileSync('public/atlas-runtime/head-neck/' + entry.path));
    assert.equal(hash(bytes), entry.sha256, entry.path);
    return bytes.toString('utf8');
  }).join('\n');
  assert(bundle.includes('Guided learning'));
  for (const item of cases) {
    const definition = item.definition;
    assert.equal(definition.surfaces.length, item.surfaceCount);
    assert.equal(definition.studies.length, item.studies);
    const guide = item.make(definition);
    assert(guide);
    assert.equal(guide.id, item.id);
    assert.equal(guide.status, 'draft');
    assert.equal(guide.specimenKey, definition.key);
    assert.equal(guide.sourceFrame, 'bodyparts3d-v3-20110915:source');
    assert.deepEqual(guide.steps.map((step: any) => step.id), item.stepIds);
    assert.deepEqual(guide.steps.map((step: any) => step.view), Array(6).fill(item.view));
    assert.deepEqual(guide.steps.map((step: any) => step.ids.length), item.counts);
    const allIds = new Set(definition.surfaces.map((surface: any) => surface.id));
    const covered = new Set<string>();
    for (const [index, step] of guide.steps.entries()) {
      const study = definition.studies.find((entry: any) => entry.id === item.studyIds[index]);
      assert(study, step.id);
      assert.deepEqual(step.ids, study.ids, step.id);
      assert.equal(step.selectedId, study.selectedId, step.id);
      assert.equal(step.view, study.view, step.id);
      assert(step.ids.includes(step.selectedId), step.id);
      assert.equal(new Set(step.ids).size, step.ids.length, step.id);
      assert(step.ids.every((id: string) => allIds.has(id)), step.id);
      assert(step.caption.length > 60, step.id);
      assert(bundle.includes(step.caption), `shipped caption: ${step.id}`);
      step.ids.forEach((id: string) => covered.add(id));
    }
    assert.equal(covered.size, item.surfaceCount);
    assert(bundle.includes(guide.id), `shipped guide: ${guide.id}`);
    assert.match(guide.limitation, /revision-bound radiologist review/i);
    assert.equal(item.make({...definition, sourceFrame: 'foreign-frame'}), null);
    const modelPath = `public/atlas-runtime/head-neck/models/bodyparts3d-v3/${item.path}`;
    const catalog = json(`${modelPath}/catalog.json`);
    assert.equal(catalog.structures.length, item.surfaceCount);
    assert.equal(catalog.source.registration, 'none');
    assert.equal(catalog.source.license, 'CC BY-SA 2.1 JP');
    const notice = readFileSync(`${modelPath}/NOTICE.md`, 'utf8');
    assert.match(notice, /CC BY-SA 2\.1 Japan/);
    assert.match(notice, /commercially/);
    for (const path of ['catalog.json', `${item.path}.glb`, 'NOTICE.md']) {
      const relative = `public/models/bodyparts3d-v3/${item.path}/${path}`;
      assert(Buffer.from(readFileSync(`${modelPath}/${path}`)).equals(priorSourceBytes(relative)), `unchanged source asset: ${relative}`);
    }
  }
  const beforeModels = JSON.parse(priorWebsiteBytes('lib/atlas-model-inventory.json').toString('utf8')).models;
  assert.equal(beforeModels.length, 137);
  assert.deepEqual(json('lib/atlas-model-inventory.json').models, beforeModels);
  for (const flag of ['patientDataIncluded', 'clinicalApproved', 'standaloneReviewConnection', 'imagingConnection'])
    assert.equal(learner[flag], false, flag);
  assert.equal(viewer.personalRecordsIncluded, false);
  assert.equal(viewer.mode, JSON.parse(priorWebsiteBytes('public/atlas-review-viewer/manifest.json').toString('utf8')).mode);
});

test('only 77 teaching packets change; prior reviews and foreign identities conflict before storage', {timeout: 120000}, async () => {
  const current = await materialApi('milestone');
  const prior = await materialApi('prior');
  const guideByKey = new Map([
    [current.abdominalWallDefinition.key, current.abdominalGuidedDissection(current.abdominalWallDefinition)],
    [current.backLayersDefinition.key, current.backGuidedDissection(current.backLayersDefinition)],
  ]);
  let rows = 0, guided = 0, unchanged = 0;
  const selected: Array<{context: any; id: string}> = [];
  for (const row of current.specimenReviewRows) {
    for (const surface of row.surfaces) {
      rows++;
      const now = await current.specimenReviewMaterial(row.key, surface.id);
      const before = await prior.specimenReviewMaterial(row.key, surface.id);
      assert(now && before, `${row.key}/${surface.id}`);
      const label = `${row.key}/${surface.id}`;
      assert.equal(now.context.sourceHash, before.context.sourceHash, label);
      assert.deepEqual(now.source, before.source, label);
      assert.deepEqual(now.teaching.lesson, before.teaching.lesson, label);
      assert.deepEqual(now.teaching.topics, before.teaching.topics, label);
      assert.deepEqual(now.teaching.referenceTitles, before.teaching.referenceTitles, label);
      const guide = guideByKey.get(row.key);
      if (guide) {
        guided++;
        assert.deepEqual(now.teaching.guidedDissection, guide, label);
        assert.equal(now.context.teachingTabs.at(-1), 'guided-dissection', label);
        assert.equal(now.context.checklists.teaching.at(-1).id, 'guided-dissection', label);
        assert.match(now.context.checklists.teaching.at(-1).label, /actual source viewer/);
        assert.notEqual(now.context.teachingHash, before.context.teachingHash, label);
        assert.notEqual(now.context.revisions.teaching, before.context.revisions.teaching, label);
        assert.equal(before.teaching.guidedDissection, undefined, label);
        const draft = current.blankSpecimenReview(now.context, 'teaching');
        assert.equal(draft.checks['guided-dissection'], false);
        assert.equal(draft.attested, false);
        assert.equal(draft.status, 'draft');
        if (selected.every(item => item.context.specimenKey !== row.key)) selected.push({context: now.context, id: surface.id});
      } else {
        unchanged++;
        assert.deepEqual(now.teaching, before.teaching, label);
        assert.equal(now.context.teachingHash, before.context.teachingHash, label);
        assert.equal(now.context.revisions.teaching, before.context.revisions.teaching, label);
        assert.deepEqual(now.context.checklists.teaching, before.context.checklists.teaching, label);
      }
      assert.equal(now.context.revisions.imaging, null, label);
      assert(now.context.blockers.imaging.length > 0, label);
    }
  }
  assert.equal(rows, 356);
  assert.equal(guided, 77);
  assert.equal(unchanged, 279);
  assert.equal(selected.length, 2);
  const unreachableStorage = new Proxy({}, {get() { throw Error('Storage reached before revision conflict'); }});
  for (const {context: c, id} of selected) {
    const stale = {...current.blankSpecimenReview(c, 'teaching'), revisionHash: '0'.repeat(64)};
    assert.equal(current.specimenReviewStale(stale, c), true);
    assert.equal(current.specimenDecisionLabel(stale, c), 'Re-review required');
    for (const changes of [
      {revisionHash: stale.revisionHash},
      {materialHash: c.materialHash === '0'.repeat(64) ? '1'.repeat(64) : '0'.repeat(64)},
      {sourceFrame: 'foreign-frame'},
      {checklistVersion: 'foreign-checklist'},
    ]) {
      const request = new Request('https://review.test/api/atlas-review/specimen-review', {
        method: 'POST', headers: {'oai-authenticated-user-id': 'synthetic-reviewer', origin: 'https://review.test', 'content-type': 'application/json'},
        body: JSON.stringify({catalogScope: c.catalogScope, specimenKey: c.specimenKey, structureId: id,
          sourceFrame: c.sourceFrame, materialHash: c.materialHash, revisionHash: c.revisions.teaching,
          checklistVersion: c.checklistVersion, track: 'teaching', expectedVersion: 0,
          draft: current.blankSpecimenReview(c, 'teaching'), ...changes}),
      });
      const response = await current.postSpecimenReview(request, unreachableStorage);
      assert.equal(response.status, 409, `${c.specimenKey}: ${JSON.stringify(changes)}`);
      assert.match((await response.json()).error, /Material changed/);
    }
  }
});
