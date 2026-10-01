import assert from 'node:assert/strict';
import test from 'node:test';
import {Buffer} from 'node:buffer';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {build} from 'esbuild';

const source = 'fc5457b6dbc12cb6ce702c2fc272d0bcb6cc59fc';
const sourceParent = 'e88e43b4c0c0aa5d2fa48c2ee5fc0b86c9519abe';
const websiteBefore = 'c93ee19856ac4598de1fd8afd703b175dac4a6db';
const sourceRepo = process.env.ATLAS_SOURCE_REPO ?? resolve('..', '..', '..', '2026-09-05', 'referenced-chatgpt-conversation-this-is-an-2', 'outputs');
const gitBytes = (repo: string, revision: string, path: string) => Buffer.from(execFileSync('git', ['-C', repo, 'show', `${revision}:${path}`], {maxBuffer: 12e6}));
const sourceBytes = (path: string) => gitBytes(sourceRepo, source, path);
const priorSourceBytes = (path: string) => gitBytes(sourceRepo, sourceParent, path);
const priorWebsiteBytes = (path: string) => Buffer.from(execFileSync('git', ['show', `${websiteBefore}:${path}`], {maxBuffer: 12e6}));
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const imported = async () => {
  const result = await build({stdin: {contents: [
    "export {hraPelvisDefinition} from './atlas-review/lib/hra-pelvis';",
    "export {hraPelvicGuidedDissection} from './atlas-review/lib/hra-pelvic-guided-dissection';",
    "export {kneeDefinition} from './atlas-review/lib/um-limb-studies';",
    "export {specimenReviewMaterial, specimenReviewRows} from './atlas-review/lib/specimen-review-material';",
    "export {parseSavedSpecimenReview, specimenReviewStale, specimenDecisionLabel, blankSpecimenReview} from './atlas-review/lib/specimen-review';",
    "export {postSpecimenReview} from './atlas-review/lib/specimen-review-api';",
  ].join('\n'), resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm'});
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
};

test('pelvic guided sequence is the pinned source in learner and Clinical Review', {timeout: 120000}, async () => {
  const review = json('atlas-review/manifest.json');
  const learner = json('public/atlas-runtime/head-neck/manifest.json');
  const inputs = json('public/atlas-runtime/head-neck/source-inputs.json');
  const viewer = json('public/atlas-review-viewer/manifest.json');
  assert.equal(review.revision, source);
  assert.equal(learner.sourceCommit, source);
  assert.equal(viewer.sourceCommit, source);
  const learnerPaths = new Set(['lib/hra-pelvic-guided-dissection.ts', 'lib/specimen-guided-dissection.ts', 'app/hra-pelvis-supplement.tsx']);
  for (const path of [...learnerPaths, 'lib/specimen-review-material.ts', 'lib/specimen-review.ts', 'app/review/specimens/workspace.tsx']) {
    const file = review.files.find((entry: any) => entry.path === path);
    assert(file, `review import: ${path}`);
    assert.equal(file.sourceSha256, hash(sourceBytes(path)), path);
    assert.equal(file.importedSha256, hash(readFileSync('atlas-review/' + path)), path);
    if (learnerPaths.has(path))
      assert.equal(inputs.find((entry: any) => entry.path === path)?.sha256, file.sourceSha256, `learner input: ${path}`);
  }
  for (const flag of ['patientDataIncluded', 'clinicalApproved', 'standaloneReviewConnection', 'imagingConnection'])
    if (flag in learner) assert.equal(learner[flag], false, flag);
  assert.equal(viewer.personalRecordsIncluded, false);
  const api = await imported();
  const definition = api.hraPelvisDefinition;
  assert.equal(definition.surfaces.length, 43);
  assert.equal(definition.studies.length, 11);
  const guide = api.hraPelvicGuidedDissection(definition);
  assert(guide);
  assert.equal(guide.id, 'hra-female-pelvis-source-guide');
  assert.equal(guide.status, 'draft');
  assert.equal(guide.specimenKey, definition.key);
  assert.equal(guide.sourceFrame, json('atlas-review/public/models/hra-pelvis/catalog.json').sourceFrame);
  assert.deepEqual(guide.steps.map((step: any) => step.id), ['support-context', 'cardinal-context', 'posterior-uterosacral', 'right-urinary-vessels', 'left-urinary-vessels', 'bilateral-urinary']);
  assert.deepEqual(guide.steps.map((step: any) => step.view), ['posterior', 'anterior', 'posterior', 'right', 'left', 'anterior']);
  const allIds = new Set(definition.surfaces.map((surface: any) => surface.id));
  const guidedIds = new Set<string>();
  for (const step of guide.steps) {
    assert(step.caption.length > 60);
    assert.equal(new Set(step.ids).size, step.ids.length, step.id);
    assert(step.ids.every((id: string) => allIds.has(id)), step.id);
    assert(step.ids.includes(step.selectedId), step.id);
    step.ids.forEach((id: string) => guidedIds.add(id));
  }
  assert.equal(guidedIds.size, 16);
  const right = guide.steps[3], left = guide.steps[4];
  assert.match(right.selectedId, /right/i);
  assert.match(left.selectedId, /left/i);
  assert(right.ids.some((id: string) => /right.*ureter/i.test(id)));
  assert(left.ids.some((id: string) => /left.*ureter/i.test(id)));
  assert.equal(api.hraPelvicGuidedDissection({...definition, sourceFrame: 'foreign-frame'}), null);

  const pelvic = api.specimenReviewRows.find((row: any) => row.key === definition.key);
  assert(pelvic);
  assert.equal(pelvic.surfaces.length, 43);
  let count = 0;
  for (const surface of definition.surfaces) {
    const packet = await api.specimenReviewMaterial(definition.key, surface.id);
    assert(packet, surface.id);
    const expected = guidedIds.has(surface.id);
    assert.equal(!!packet.teaching.guidedDissection, expected, surface.id);
    assert.equal(packet.context.teachingTabs.includes('guided-dissection'), expected, surface.id);
    assert.equal(packet.context.checklists.teaching.some((item: any) => item.id === 'guided-dissection'), expected, surface.id);
    assert.equal(packet.context.sourceFrame, guide.sourceFrame);
    assert.equal(packet.context.sourceHash.length, 64);
    assert.equal(packet.context.teachingHash.length, 64);
    assert.equal(packet.context.revisions.imaging, null);
    if (expected) {
      count++;
      assert.deepEqual(packet.teaching.guidedDissection, guide);
      assert.match(packet.context.checklists.teaching.at(-1).label, /actual source viewer/);
      assert.match(packet.teaching.guidedDissection.limitation, /radiologist review/i);
      const draft = api.blankSpecimenReview(packet.context, 'teaching');
      assert.equal(draft.checks['guided-dissection'], false);
      assert.equal(draft.attested, false);
      assert.equal(draft.status, 'draft');
    }
  }
  assert.equal(count, 16);
  // An explicit unguided context; row order is not a guide-availability contract.
  const other = api.specimenReviewRows.find((row: any) => row.key === api.kneeDefinition.key);
  assert(other);
  const otherPacket = await api.specimenReviewMaterial(other.key, other.surfaces[0].id);
  assert(otherPacket);
  assert.equal(otherPacket.teaching.guidedDissection, undefined);
  assert.equal(otherPacket.context.teachingTabs.includes('guided-dissection'), false);
  assert.equal(otherPacket.context.checklists.teaching.some((item: any) => item.id === 'guided-dissection'), false);

  const bundle = learner.files.filter((entry: any) => entry.path.endsWith('.js')).map((entry: any) => {
    const bytes = readFileSync('public/atlas-runtime/head-neck/' + entry.path);
    assert.equal(hash(bytes), entry.sha256, entry.path);
    return Buffer.from(bytes).toString('utf8');
  }).join('\n');
  for (const phrase of ['hra-female-pelvis-source-guide', ...guide.steps.map((step: any) => step.caption), 'Guided learning'])
    assert(bundle.includes(phrase), `shipped learner: ${phrase}`);
  const reviewUi = readFileSync('atlas-review/app/review/specimens/workspace.tsx', 'utf8');
  for (const phrase of ['Guided dissection to review', 'guidedDissection.steps.map', 'Source frame:'])
    assert(reviewUi.includes(phrase), `review viewer: ${phrase}`);
  assert.equal(Buffer.from(readFileSync('atlas-review/lib/hra-pelvic-guided-dissection.ts')).equals(sourceBytes('lib/hra-pelvic-guided-dissection.ts')), true);
  assert.deepEqual(json('lib/atlas-model-inventory.json').models, JSON.parse(priorWebsiteBytes('lib/atlas-model-inventory.json').toString()).models);
  for (const path of ['atlas-review/content/hra-pelvic-teaching.ts', 'atlas-review/lib/hra-pelvis.ts', 'atlas-review/lib/hra-pelvis-teaching.ts'])
    assert.deepEqual(readFileSync(path), priorWebsiteBytes(path), `previous pelvic content: ${path}`);
  for (const path of ['public/models/hra-pelvis/catalog.json', 'public/models/hra-renal/catalog.json'])
    assert.deepEqual(sourceBytes(path), priorSourceBytes(path), `source catalogue: ${path}`);
});

test('ten-tab event parsing and old/foreign teaching saves require fresh review before storage', {timeout: 120000}, async () => {
  const api = await imported();
  const guide = api.hraPelvicGuidedDissection(api.hraPelvisDefinition);
  const id = guide.steps[0].selectedId;
  const packet = await api.specimenReviewMaterial(api.hraPelvisDefinition.key, id);
  const c = packet.context;
  assert(c.teachingTabs.includes('guided-dissection'));
  assert(c.teachingTabs.length <= 10);
  // A saved event may carry every allowed teaching tab even when this selection
  // currently has fewer populated topics. Exercise the parser's ten-tab cap.
  const allTeachingTabs = ['anatomy', 'function', 'clinical', 'pathology', 'ct', 'mri', 'xray', 'ultrasound', 'self-check', 'guided-dissection'];
  const saved = {
    ...api.blankSpecimenReview(c, 'teaching'), eventSchema: 'vm-specimen-review-event-1',
    catalogScope: c.catalogScope, specimenKey: c.specimenKey, sourceFrame: c.sourceFrame,
    structureId: id, track: 'teaching', version: 1, savedAt: new Date(0).toISOString(),
    reviewedAt: null, revisionHash: c.revisions.teaching, checklistVersion: c.checklistVersion,
    checklist: c.checklists.teaching,
    material: {materialHash: c.materialHash, sourceHash: c.sourceHash, teachingHash: c.teachingHash,
      rendererHash: c.rendererHash, teachingTabs: allTeachingTabs},
  };
  assert.deepEqual(api.parseSavedSpecimenReview(saved), saved);
  const old = structuredClone(saved);
  old.revisionHash = '0'.repeat(64);
  old.material.teachingTabs = c.teachingTabs.filter((tab: string) => tab !== 'guided-dissection');
  old.checklist.pop();
  assert.equal(api.specimenReviewStale(old, c), true);
  assert.equal(api.specimenDecisionLabel(old, c), 'Re-review required');
  assert.equal(old.attested, false);
  assert.notEqual(old.status, 'approved');

  const unreachableStorage = new Proxy({}, {get() { throw Error('Storage reached before revision conflict'); }});
  const post = async (changes: Record<string, unknown>) => {
    const request = new Request('https://review.test/api/atlas-review/specimen-review', {
      method: 'POST', headers: {'oai-authenticated-user-id': 'synthetic-reviewer', origin: 'https://review.test', 'content-type': 'application/json'},
      body: JSON.stringify({catalogScope: c.catalogScope, specimenKey: c.specimenKey, structureId: id,
        sourceFrame: c.sourceFrame, materialHash: c.materialHash, revisionHash: c.revisions.teaching,
        checklistVersion: c.checklistVersion, track: 'teaching', expectedVersion: 0,
        draft: api.blankSpecimenReview(c, 'teaching'), ...changes}),
    });
    return api.postSpecimenReview(request, unreachableStorage);
  };
  for (const changes of [
    {revisionHash: old.revisionHash}, {materialHash: c.materialHash === '0'.repeat(64) ? '1'.repeat(64) : '0'.repeat(64)},
    {sourceFrame: 'foreign-frame'}, {checklistVersion: 'foreign-checklist'},
  ]) {
    const response = await post(changes);
    assert.equal(response.status, 409, JSON.stringify(changes));
    assert.match((await response.json()).error, /Material changed/);
  }
});
