import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { emittedTeaching } from './atlas-emitted-teaching.ts';
import {
  CURRENT_ATLAS_REVISION,
  currentAtlasDeliveryRoot,
  validateCurrentAtlasDelivery,
} from './current-atlas-delivery.mjs';

const current = 'c237fa215f061147975e91b01fa830b3f44458c7';
const tree = '29fb723e34279d3e586f52f380128b430cd07325';
const reviewDigest = 'cd20387aee9e0c5f03d02ba9f83c347a588df371c497efad5c7e337ad83df984';
const baseline = '3dcdf94a46db44202e72641be9fbcf1274ce5364';
const expected = [
  ['vm:anatomy:body:forearm:right:vessel:right-median-antebrachial-vein', 'FMA22968', 'right'],
  ['vm:anatomy:body:forearm:left:vessel:left-median-antebrachial-vein', 'FMA22969', 'left'],
];
const sourcePaths = [
  'content/median-antebrachial-xray-pins.json',
  'content/median-antebrachial-xray.ts',
  'lib/median-antebrachial-xray.ts',
  'content/regional-teaching/forearm.json',
  'app/review/body/review-dashboard.tsx',
];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = path => readFileSync(path);
const json = path => JSON.parse(read(path));
const wire = value => JSON.parse(JSON.stringify(value));
const visible = (code, value) => code.includes(value) || code.includes(JSON.stringify(value).slice(1, -1));
const gitSource = (atlas, revision, path) => execFileSync('git', ['show', `${revision}:${path}`], {
  cwd: atlas, windowsHide: true, maxBuffer: 32e6,
  env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});

test('current delivery binds five exact Atlas sources, four runtimes, protected Review and private dialog source', () => {
  const delivery = validateCurrentAtlasDelivery();
  const atlas = currentAtlasDeliveryRoot();
  assert.equal(CURRENT_ATLAS_REVISION, current);
  assert.equal(delivery.source, current);
  assert.equal(delivery.sourceTree, tree);
  assert.equal(delivery.reviewIntegration, reviewDigest);
  assert.equal(delivery.reviewSourceFiles, 1538);
  assert.equal(delivery.viewerFiles, 46);
  assert.equal(delivery.viewerPackages, 22);
  const manifest = json('atlas-review/manifest.json');
  const inputs = json('atlas-review/integration-inputs.json');
  assert.equal(manifest.revision, current);
  assert.equal(manifest.websiteIntegrationSha256, reviewDigest);
  assert.equal(inputs.inputs.length, 1668);
  assert.equal(sha(JSON.stringify(inputs.inputs)), reviewDigest);
  for (const path of sourcePaths) {
    const sourceBytes = gitSource(atlas, current, path);
    const imported = read(`atlas-review/${path}`);
    const row = manifest.files.find(file => file.path === path);
    assert(row, `Missing Review source: ${path}`);
    assert.equal(row.sourceSha256, sha(sourceBytes), `${path}: exact committed source`);
    assert.equal(row.importedSha256, sha(imported), `${path}: exact protected import`);
    assert.equal(inputs.inputs.find(file => file.path === `atlas-review/${path}`)?.sha256,
      row.importedSha256, `${path}: integration input`);
  }
  const dashboard = read('atlas-review/app/review/body/review-dashboard.tsx').toString();
  for (const text of ['<AlertDialog', 'initialFocus={cancelButtonRef}', 'finalFocus={false}',
    'Discard unsaved review edits?', 'sameLeaveContext', 'event.ctrlKey', 'event.metaKey',
    'event.shiftKey', 'event.altKey', 'event.defaultPrevented', 'event.button'])
    assert(dashboard.includes(text), `Private Dashboard omitted ${text}`);
  assert(!dashboard.includes('window.confirm('), 'Private leave flow must be nonblocking');

  const inventory = json('lib/atlas-model-inventory.json');
  assert.equal(inventory.models.length, 137);
  assert.equal(inventory.models.flatMap(model => model.paths).length, 144);
  assert.equal(inventory.models.reduce((sum, model) => sum + model.bytes, 0), 199072480);
  for (const name of ['head-neck', 'shoulder', 'lower-limb', 'female-pelvis']) {
    const runtime = json(`public/atlas-runtime/${name}/manifest.json`);
    assert.equal(runtime.sourceCommit, current, name);
    assert.equal(runtime.patientDataIncluded, false, name);
    assert.notEqual(runtime.clinicalApproved, true, name);
    assert.notEqual(runtime.imagingConnection, true, name);
  }
  const viewer = json('public/atlas-review-viewer/manifest.json');
  assert.equal(viewer.sourceCommit, current);
  assert.equal(viewer.websiteIntegrationSha256, reviewDigest);
  assert.equal(viewer.personalRecordsIncluded, false);
});

test('two exact median-antebrachial drafts reach emitted forearm teaching and reject stale or unattested Review writes',
  { timeout: 180000 }, async () => {
    const atlas = currentAtlasDeliveryRoot();
    const pins = json('atlas-review/content/median-antebrachial-xray-pins.json');
    assert.equal(pins.baselineCommit, baseline);
    assert.deepEqual(pins.entries.map(({ identity }) => [identity.id, identity.fmaId, identity.laterality]), expected);
    assert(pins.entries.every(entry => entry.previousReadiness === 'pending'));
    assert.equal(sha(gitSource(atlas, current, pins.sourcePath)), pins.sourceSha256);
    const learnerBase = 'public/atlas-runtime/head-neck/';
    const learner = json(`${learnerBase}manifest.json`);
    const learnerInputs = json(`${learnerBase}source-inputs.json`);
    for (const path of sourcePaths.slice(0, 4))
      assert.equal(learnerInputs.find(row => row.path === path)?.sha256,
        sha(read(`atlas-review/${path}`)), `${path}: head-neck learner input`);
    const forearm = json('atlas-review/content/regional-teaching/forearm.json');
    assert.equal(forearm.region, 'forearm');
    assert.equal(forearm.undefinedPaths.length, 0);
    const emitted = emittedTeaching(learnerBase, learner.files, true);

    const bundle = await build({ stdin: { contents: [
      "export {bodyLesson} from './atlas-review/app/body-content';",
      "export {medianAntebrachialXrayLesson} from './atlas-review/lib/median-antebrachial-xray';",
      "export {medianAntebrachialXrayTeaching,medianAntebrachialXrayReferences,medianAntebrachialXrayNote} from './atlas-review/content/median-antebrachial-xray';",
      "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
      "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
      "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
      "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
      "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
      "export {blankBodyReview,bodyApprovalProblems,validateBodyReviewDraft} from './atlas-review/lib/body-review-decisions';",
    ].join('\n'), resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, platform: 'node', format: 'esm' });
    const api = await import('data:text/javascript;base64,' +
      Buffer.from(bundle.outputFiles[0].text).toString('base64'));
    const { exactSourceHistoryApi } = await import(
      pathToFileURL(`${atlas}/scripts/exact-source-history-api.mjs`).href);
    const before = await exactSourceHistoryApi(baseline, 'review-security');
    const catalog = api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
    const storage = { calls: 0, prepare() { this.calls++; throw Error('Refused save reached storage'); } };

    for (const { identity } of pins.entries) {
      const id = identity.id;
      const display = catalog.structures.find(row => row.id === id);
      assert.deepEqual(display, identity, `${id}: actual display source`);
      assert.equal(before.bodyLesson(display, 'xray').readiness, 'pending');
      const lesson = api.medianAntebrachialXrayLesson(display, 'xray');
      assert.deepEqual(api.bodyLesson(display, 'xray'), lesson);
      assert.equal(lesson.readiness, 'draft');
      assert.equal(lesson.body, api.medianAntebrachialXrayTeaching.body);
      assert.deepEqual(lesson.bullets, [...api.medianAntebrachialXrayTeaching.bullets]);
      assert.deepEqual(lesson.citations, Object.values(api.medianAntebrachialXrayReferences));
      assert.equal(lesson.note, api.medianAntebrachialXrayNote);
      assert.match(lesson.title, /not routine plain-film visibility/);
      assert.match(lesson.body, /injection.*not evidence.*ordinary unenhanced radiograph/i);
      assert.match(lesson.bullets.join(' '), /median antebrachial and median cubital veins distinct/i);
      assert.match(lesson.note, /No acquired|Publication figures and datasets are not included/i);
      assert.match(lesson.note, /Atlas, imaging-case and paid-lecture access remain independent/);
      const forgedIdentity = wire(display);
      forgedIdentity.sources[0].sha256 = '0'.repeat(64);
      assert.equal(api.medianAntebrachialXrayLesson(forgedIdentity, 'xray'), undefined);
      for (const tab of ['anatomy', 'function', 'ct', 'mri', 'ultrasound', 'clinical'])
        assert.equal(api.medianAntebrachialXrayLesson(display, tab), undefined, `${id}: ${tab}`);

      const regionalRows = forearm.entries.filter(row => JSON.parse(row.identity).id === id);
      assert.equal(regionalRows.length, 1, `${id}: emitted regional JSON row`);
      assert.deepEqual(JSON.parse(regionalRows[0].identity), identity);
      assert.deepEqual(regionalRows[0].lessons.xray, lesson);
      for (const value of [lesson.body, ...lesson.bullets, lesson.note, ...lesson.citations])
        assert(visible(emitted, value), `${id}: missing reachable head-neck teaching`);

      const oldPacket = wire(await before.bodyReviewMaterial(id));
      const packet = wire(await api.bodyReviewMaterial(id));
      assert.equal(packet.approval, false);
      assert.equal(packet.status, 'worksheet-not-submitted');
      assert.deepEqual(packet.source, oldPacket.source);
      assert.deepEqual(packet.topics.find(row => row.tab === 'xray'), { tab: 'xray', ...lesson });
      assert.equal(packet.fingerprints.source, oldPacket.fingerprints.source);
      assert.notEqual(packet.fingerprints.teaching, oldPacket.fingerprints.teaching);
      assert.deepEqual(await api.parseBodyReviewResponse(packet, id), packet);
      assert.equal(await api.parseBodyReviewResponse(oldPacket, id), null);
      const altered = wire(packet);
      altered.topics.find(row => row.tab === 'xray').citations[0] = 'https://forged.example/';
      assert.equal(await api.parseBodyReviewResponse(altered, id), null);

      const oldContext = await before.bodyReviewContext(id);
      const context = await api.bodyReviewContext(id);
      assert.equal(context.sourceHash, oldContext.sourceHash);
      assert.notEqual(context.teachingHash, oldContext.teachingHash);
      assert.notEqual(context.revisions.teaching, oldContext.revisions.teaching);
      assert.equal(context.revisions.imaging, null);
      const decision = { catalogScope: context.catalogScope, structureId: id,
        track: 'teaching', expectedVersion: 0, materialHash: context.materialHash,
        revisionHash: context.revisions.teaching, checklistVersion: context.checklistVersion,
        draft: api.blankBodyReview(context, 'teaching') };
      const save = input => api.postBodyDecision(new Request('https://review.test/api/body-decisions', {
        method: 'POST', headers: { origin: 'https://review.test',
          'content-type': 'application/json',
          'oai-authenticated-user-id': 'SYNTHETIC_MEDIAN_ANTEBRACHIAL_REVIEWER' },
        body: JSON.stringify(input),
      }), storage);
      for (const hashes of [
        { materialHash: oldContext.materialHash, revisionHash: oldContext.revisions.teaching },
        { materialHash: oldContext.materialHash },
        { revisionHash: oldContext.revisions.teaching },
      ]) assert.equal((await save({ ...decision, ...hashes })).status, 409);
      const forged = wire(decision);
      forged.draft.checks.foreign = true;
      assert.equal((await save(forged)).status, 422);
      const unattested = wire(decision);
      unattested.draft.status = 'approved';
      Object.keys(unattested.draft.checks).forEach(key => { unattested.draft.checks[key] = true; });
      Object.assign(unattested.draft, { reviewer: 'Synthetic Reviewer', qualification: 'Synthetic role',
        scope: 'Synthetic scope for refusal only',
        evidence: [{ title: 'Synthetic evidence', url: 'https://review.test/evidence', note: '' }] });
      const validUnattested = api.validateBodyReviewDraft(unattested.draft, context.checklists.teaching);
      assert(api.bodyApprovalProblems(validUnattested, context, 'teaching').includes(
        'Attest that you personally performed this review.'));
      assert.equal((await save(unattested)).status, 422);
    }
    assert.equal(storage.calls, 0, 'Every invalid submission refused before the synthetic store');
  });
