import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { atlasExactGitApi } from './atlas-exact-git-api.mjs';

const sourceDir = 'C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
const websiteBaseline = 'ec85edb86bb34c92c66e2f310da09904f27ea7c4';
const json = path => JSON.parse(readFileSync(path, 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const review = json('atlas-review/manifest.json');
const revision = review.revision;
assert.match(revision, /^[a-f0-9]{40}$/);
assert.equal(execFileSync('git', ['rev-parse', `${revision}^{commit}`], {
  cwd: sourceDir, windowsHide: true, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
}).toString().trim(), revision);
const source = path => execFileSync('git', ['show', `${revision}:${path}`], {
  cwd: sourceDir, windowsHide: true, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' }, maxBuffer: 32e6,
});
const required = [
  'content/coronary-arterial-study-pins.json', 'lib/coronary-arterial-study.ts',
  'lib/coronary-arterial-review.ts', 'lib/body-review-material.ts',
  'lib/body-review-context.ts', 'lib/study-links.ts', 'app/dissection-data.ts',
];
const entries = new Map(review.files.map(row => [row.path, row]));
for (const path of required) {
  const row = entries.get(path);
  assert(row, `Review import missing ${path}`);
  assert.equal(row.sourceSha256, sha(source(path)), `${path} saved source`);
  assert.equal(row.importedSha256, sha(readFileSync(`atlas-review/${path}`)), `${path} imported bytes`);
  assert.equal(row.importedSha256, row.sourceSha256, `${path} exact import`);
}
const pins = json('atlas-review/content/coronary-arterial-study-pins.json');
assert.deepEqual(readFileSync('atlas-review/content/coronary-arterial-study-pins.json'), source('content/coronary-arterial-study-pins.json'));
assert.deepEqual(pins.entries.map(item => item.fmaId), ['FMA3802', 'FMA3855', 'FMA3862', 'FMA3895', 'FMA7088']);
for (const name of ['head-neck', 'shoulder', 'female-pelvis', 'lower-limb']) {
  const manifest = json(`public/atlas-runtime/${name}/manifest.json`);
  assert.equal(manifest.sourceCommit, revision, name);
  assert.equal(manifest.patientDataIncluded, false, name);
  assert.equal(manifest.clinicalApproved, false, name);
}
const reviewViewer = json('public/atlas-review-viewer/manifest.json');
assert.equal(reviewViewer.sourceCommit, revision);
assert.equal(reviewViewer.personalRecordsIncluded, false);

const entry = `export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';
export {dissectionProfiles,stageStructures} from './atlas-review/app/dissection-data';
export * from './atlas-review/lib/coronary-arterial-study';
export {bodyStudyScope,makeStudyLink,parseStudyLink,resolveStudyLink} from './atlas-review/lib/study-links';
export * from './atlas-review/lib/body-review-material';
export * from './atlas-review/lib/body-review-context';
export * from './atlas-review/lib/body-review-response';
export * from './atlas-review/lib/body-review-decisions';
export * from './atlas-review/lib/body-review-api';
export {learningResourceKinds,createLearningRegistry} from './atlas-review/lib/learning-resources';`;
const compiled = await build({ stdin: { contents: entry, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', write: false });
const now = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const prior = await atlasExactGitApi(websiteBaseline, `export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';
export {bodyReviewContext} from './atlas-review/lib/body-review-context';`);
const catalog = now.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
const study = now.coronaryArterialStudyFor(catalog);
assert(study);
assert.deepEqual(study.targets.map(item => item.fmaId), pins.entries.slice(0, 4).map(item => item.fmaId));
assert.deepEqual(study.context.map(item => item.fmaId), ['FMA7088']);
assert.deepEqual([...study.targets, ...study.context], pins.entries);
assert.deepEqual(study.bundles, pins.bundles);
const all = [...study.targets, ...study.context];
const ids = all.map(item => item.id);
for (const item of all) {
  assert.equal(now.coronaryArterialStudyFor(catalog, all.filter(other => other.id !== item.id)), null, `${item.fmaId} required`);
}
for (const side of ['left', 'right']) {
  const scope = now.bodyStudyScope(catalog, 'thorax', side);
  assert.equal(now.coronaryArterialStudyFor(catalog, scope), null, `${side} incomplete`);
}
for (const mutate of [
  c => { c.structures = c.structures.filter(item => item.id !== ids[0]); },
  c => { c.structures.push(structuredClone(c.structures.find(item => item.id === ids[0]))); },
  c => { c.structures.find(item => item.id === ids[1]).sources[0].sha256 = '0'.repeat(64); },
  c => { c.bundles.find(item => item.id === pins.bundles[0].id).sha256 = '0'.repeat(64); },
  c => { c.coordinateSystem.unitsPerMillimetre *= 2; },
  c => { c.license = 'changed'; },
  c => { c.credit = 'changed'; },
]) {
  const altered = structuredClone(catalog); mutate(altered);
  assert.equal(now.coronaryArterialStudyFor(altered), null);
}
for (const region of ['thorax', 'whole-body']) {
  const profile = now.dissectionProfiles[region];
  const focus = profile.focuses.find(item => item.id === now.coronaryArterialStudyId);
  assert(focus, `${region} focus`);
  assert.deepEqual(focus.rule.fmaIds, study.targets.map(item => item.fmaId));
  assert.deepEqual(focus.context[0].fmaIds, study.context.map(item => item.fmaId));
  assert.deepEqual(focus.requiredSources, all);
  assert.equal(focus.view, 'anterior');
  assert.equal(focus.landmarks.length, 4);
  assert.match(focus.inspect, /0%/);
  const scope = now.bodyStudyScope(catalog, region, 'both');
  const visible = now.stageStructures(scope, profile, 'assembled', focus.id);
  for (const target of study.targets) {
    assert(visible.some(item => item.id === target.id), `${region}:${target.fmaId} selectable`);
    const href = now.makeStudyLink(catalog, region, target.id, 'both', focus.id);
    assert(href?.startsWith(region === 'thorax' ? '/regions/thorax?' : '/?'));
    assert(!href.startsWith('//') && !href.includes('://'), 'same-origin relative route');
    const parsed = now.parseStudyLink(Object.fromEntries(new URL(href, 'https://atlas.test').searchParams));
    const resolved = now.resolveStudyLink(catalog, region, parsed);
    assert.equal(resolved.status, 'ready');
    assert.equal(resolved.selected.id, target.id);
    assert.equal(resolved.focusId, focus.id);
    assert.equal(now.makeStudyLink(catalog, region, target.id, 'left', focus.id), null);
    assert.equal(now.makeStudyLink(catalog, region, target.id, 'right', focus.id), null);
    const forged = new URL(href, 'https://atlas.test'); forged.searchParams.set('source', '0'.repeat(64));
    assert.equal(now.resolveStudyLink(catalog, region,
      now.parseStudyLink(Object.fromEntries(forged.searchParams))).status, 'rejected');
  }
  const base = { region, focusId: focus.id, exam: false, visibleIds: ids, scope };
  const assembled = now.coronaryArterialScenePlan(catalog, { ...base, explode: 0 });
  assert.deepEqual(assembled.contextIds, [study.context[0].id]);
  assert.equal(assembled.appearance[study.context[0].id].opacity, 0.2);
  assert.deepEqual(now.coronaryArterialScenePlan(catalog, { ...base, explode: 30 }).omitIds, [study.context[0].id]);
  assert.deepEqual(now.coronaryArterialScenePlan(catalog, { ...base, explode: 0,
    visibleIds: ids.slice(0, 4) }).contextIds, []);
}
assert(now.learningResourceKinds.includes('lecture'));
assert(now.learningResourceKinds.includes('ct'));
assert(!now.learningResourceKinds.includes('atlas'), 'Atlas access is separate from case and lecture kinds');
const anatomy = { scope: 'body', structureId: study.targets[0].id,
  sources: study.targets[0].sources.map(({ file, sha256 }) => ({ file, sha256 })) };
const materialHash = 'a'.repeat(64);
const resources = [
  { id: 'vm:resource:synthetic-case', revision: 1, kind: 'ct', title: 'Synthetic case',
    ageGroup: 'adult', laterality: 'right', regionIds: ['thorax'],
    material: { sha256: materialHash, origin: 'synthetic' },
    anchors: [{ type: 'volume', id: 'case-anchor', seriesId: 'synthetic-series',
      frameId: 'synthetic-frame', annotationId: 'synthetic-annotation', geometry: 'point' }] },
  { id: 'vm:resource:synthetic-lecture', revision: 1, kind: 'lecture', title: 'Synthetic lecture',
    ageGroup: 'adult', laterality: 'right', regionIds: ['thorax'],
    material: { sha256: materialHash, origin: 'authored' },
    anchors: [{ type: 'slide', id: 'lecture-anchor', courseId: 'synthetic-course',
      lessonId: 'synthetic-lesson', slideId: 'synthetic-slide', buildId: null }] },
];
const links = resources.map((resource, index) => ({ id: `vm:link:synthetic-${index}`,
  revision: 1, anatomy, resourceId: resource.id, resourceRevision: 1,
  materialSha256: materialHash, anchorId: resource.anchors[0].id, relation: 'exact' }));
let caseAccess = false, lectureAccess = false;
const registry = now.createLearningRegistry({ schemaVersion: 1, resources, links }, [anatomy], {
  canNavigate: () => true, canAccessAnatomy: () => true,
  canAccess: resource => resource.kind === 'ct' ? caseAccess : lectureAccess,
  resourceCleared: () => true, correspondenceCleared: () => true,
});
assert.deepEqual(registry.related('body', anatomy.structureId), []);
caseAccess = true;
assert.deepEqual(registry.related('body', anatomy.structureId).map(match => match.resource.kind), ['ct']);
caseAccess = false; lectureAccess = true;
assert.deepEqual(registry.related('body', anatomy.structureId).map(match => match.resource.kind), ['lecture']);
lectureAccess = false;
assert.deepEqual(registry.related('body', anatomy.structureId), []);

let forgedPackets = 0, refusedSaves = 0, storageCalls = 0;
const storage = new Proxy({}, { get() { storageCalls++; throw Error('Rejected review reached storage'); } });
for (const item of all) {
  const current = await now.bodyReviewMaterial(item.id);
  const previous = await prior.bodyReviewMaterial(item.id);
  const context = await now.bodyReviewContext(item.id);
  const oldContext = await prior.bodyReviewContext(item.id);
  assert(current && previous && context && oldContext);
  assert.equal(current.approval, false);
  assert(await now.parseBodyReviewResponse(current, item.id));
  assert.equal(current.fingerprints.source, previous.fingerprints.source);
  assert.equal(current.fingerprints.teaching, previous.fingerprints.teaching);
  assert.equal(context.sourceHash, oldContext.sourceHash);
  assert.equal(context.teachingHash, oldContext.teachingHash);
  assert.equal(context.revisions.teaching, oldContext.revisions.teaching);
  assert.equal(context.revisions.imaging, null);
  assert.equal(current.checklist.geometry.length, 13);
  assert.equal(context.checklists.geometry.length, 16);
  assert.deepEqual(context.checklists.geometry.slice(6).map(check => check.id),
    Array.from({ length: 10 }, (_, i) => `source-study-${i + 1}`));
  assert(context.checklists.geometry.every(check => check.label.length <= 1000));
  assert(context.checklists.geometry.length <= 30);
  assert.notEqual(context.revisions.geometry, oldContext.revisions.geometry);
  const forged = structuredClone(current); forged.checklist.geometry[3] += ' foreign';
  assert.equal(await now.parseBodyReviewResponse(forged, item.id), null); forgedPackets++;
  const base = { catalogScope: context.catalogScope, structureId: item.id, track: 'geometry',
    expectedVersion: 0, materialHash: context.materialHash,
    revisionHash: context.revisions.geometry, checklistVersion: context.checklistVersion };
  const draft = now.blankBodyReview(context, 'geometry');
  for (const delta of [{ materialHash: oldContext.materialHash },
    { revisionHash: oldContext.revisions.geometry }]) {
    const response = await now.postBodyDecision(new Request('https://review.test/api/body-decisions', {
      method: 'POST', headers: { origin: 'https://review.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_CORONARY_ARTERIAL' },
      body: JSON.stringify({ ...base, ...delta, draft }),
    }), storage);
    assert.equal(response.status, 409); refusedSaves++;
  }
  const incomplete = { ...draft, status: 'approved', reviewer: 'Synthetic reviewer',
    qualification: 'Synthetic reviewer role', scope: 'Exact synthetic review scope',
    evidence: [{ title: 'Synthetic evidence', url: 'https://example.test/evidence', note: '' }],
    attested: true, checks: Object.fromEntries(context.checklists.geometry.map(check => [check.id, true])) };
  incomplete.checks['source-study-10'] = false;
  const response = await now.postBodyDecision(new Request('https://review.test/api/body-decisions', {
    method: 'POST', headers: { origin: 'https://review.test', 'content-type': 'application/json',
      'oai-authenticated-user-id': 'SYNTHETIC_CORONARY_ARTERIAL' },
    body: JSON.stringify({ ...base, draft: incomplete }),
  }), storage);
  assert.equal(response.status, 422); refusedSaves++;
}
assert.equal(forgedPackets, 5);
assert.equal(refusedSaves, 15);
assert.equal(storageCalls, 0);
console.log(JSON.stringify({ passed: true, revision, targets: 4, context: 1,
  forgedPackets, refusedSaves, storageCalls, clinicalApproval: false }));
