import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {atlasExactGitApi} from './atlas-exact-git-api.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const websiteBaseline = 'eed504734b845c635f23ee607c270abe34ed17a5';
const coronaryWebsiteBaseline = 'ec85edb86bb34c92c66e2f310da09904f27ea7c4';
const coronaryStudyWebsiteEpoch = '77ac93cd45a6b7195f37b9122e7a526f6d547acd';
const respiratorySourceRevision = '12570b5245dc6a253cbdd73ec4e044c58b81a927';
const coronaryStudySourceRevision = 'd3d7ef2b22ed5bfe872aa6fa4b54fb69d8747cda';
const sourceBaseline = 'ae13b8de049671e2cac8dd789a6bfb385f147769';
const atlasSource = 'C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
const sha = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
const gitOptions = {maxBuffer: 32e6, windowsHide: true, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}};
const old = path => execFileSync('git', ['show', `${websiteBaseline}:${path}`], gitOptions);
const preCoronaryFile = path => execFileSync('git', ['show', `${coronaryWebsiteBaseline}:${path}`], gitOptions);
const studyFile = path => execFileSync('git', ['show', `${coronaryStudyWebsiteEpoch}:${path}`], gitOptions);
const respiratoryAt = path => execFileSync('git', ['show', `${respiratorySourceRevision}:${path}`], {...gitOptions, cwd: atlasSource});
const studySourceAt = path => execFileSync('git', ['show', `${coronaryStudySourceRevision}:${path}`], {...gitOptions, cwd: atlasSource});
const json = path => JSON.parse(readFileSync(path));
const review = json('atlas-review/manifest.json');
const sourceRevision = review.revision;
assert.match(sourceRevision, /^[a-f0-9]{40}$/);
execFileSync('git', ['merge-base', '--is-ancestor', respiratorySourceRevision, sourceRevision], {...gitOptions, cwd: atlasSource});
const sourceAt = path => execFileSync('git', ['show', `${sourceRevision}:${path}`], {...gitOptions, cwd: atlasSource});
const coronaryHistoryPath = `${atlasSource}/scripts/coronary-arterial-study-history.mjs`;
assert.deepEqual(readFileSync(coronaryHistoryPath), sourceAt('scripts/coronary-arterial-study-history.mjs'));
const {preCoronaryArterialStudyProfiles} = await import(pathToFileURL(coronaryHistoryPath).href);
const common = "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';export {structures} from './atlas-review/app/anatomy-data';export {dissectionProfiles} from './atlas-review/app/dissection-data';export {regionalTours} from './atlas-review/lib/regional-tours';export {reasoningConcepts} from './atlas-review/lib/reasoning-questions';export {nestedReviewRows,nestedReviewMaterial} from './atlas-review/lib/nested-review-material';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';";
const before = await atlasExactGitApi(websiteBaseline, common);
const preCoronary = await atlasExactGitApi(coronaryWebsiteBaseline,
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {bodyReviewContext} from './atlas-review/lib/body-review-context';");
// Preserve the original respiratory and coronary-study Review contract at its
// exact saved epoch. The current coronary tour import is audited below.
const now = await atlasExactGitApi(coronaryStudyWebsiteEpoch,
  common + "export * from './atlas-review/lib/respiratory-core-depth';export * from './atlas-review/content/respiratory-core-depth';");
const pins = JSON.parse(respiratoryAt('content/respiratory-core-depth-pins.json'));
const transition = JSON.parse(respiratoryAt('content/respiratory-core-depth.transition.json'));
assert.equal(pins.baseline, sourceBaseline);
assert.equal(transition.baseline, sourceBaseline);
assert.equal(transition.pinsHash, sha(pins));
assert.equal(pins.entries.length, 5);
assert.equal(transition.entries.length, 8);
assert.deepEqual(sourceAt('content/respiratory-core-depth-pins.json'), respiratoryAt('content/respiratory-core-depth-pins.json'));
assert.deepEqual(readFileSync('atlas-review/content/respiratory-core-depth-pins.json'), respiratoryAt('content/respiratory-core-depth-pins.json'));
const entries = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
assert.equal(entries.size, 5);
const coronaryPins = json('atlas-review/content/coronary-arterial-study-pins.json');
const coronaryIds = new Set(coronaryPins.entries.map(entry => entry.id));
assert.deepEqual(coronaryPins.entries.map(entry => entry.fmaId),
  ['FMA3802', 'FMA3855', 'FMA3862', 'FMA3895', 'FMA7088']);
assert.equal(coronaryIds.size, 5);
assert.deepEqual(Object.fromEntries(Object.entries(now.respiratoryCoreDepthGroups).map(([group, ids]) => [group, [...ids]])), {
  rightLung: ['FMA7309'], leftLung: ['FMA7310'], trachea: ['FMA7394'], rightBronchus: ['FMA7395'], leftBronchus: ['FMA7396'],
});
for (const entry of pins.entries) assert(now.respiratoryCoreDepthGroups[entry.group].includes(entry.identity.fmaId));
const changedKeys = new Set(transition.entries.map(({id, tab}) => `${id}:${tab}`));
assert.equal(changedKeys.size, 8);
for (const entry of pins.entries) {
  const tabs = Object.keys(entry.previous);
  assert.deepEqual(tabs, entry.group.endsWith('Lung') ? ['anatomy'] : ['anatomy', 'function']);
  for (const tab of tabs) assert(changedKeys.has(`${entry.identity.id}:${tab}`));
}
const sourceCatalog = json('atlas-review/public/models/bodyparts3d/full-body/catalog.json');
const catalog = now.bodyDisplayCatalog(sourceCatalog);
assert.equal(catalog.structures.length, 1104);
assert.equal(catalog.bundles.length, 109);
assert.deepEqual(catalog, before.bodyDisplayCatalog(JSON.parse(old('atlas-review/public/models/bodyparts3d/full-body/catalog.json'))));
for (const key of ['structures', 'regionalTours', 'reasoningConcepts', 'contentTabs']) assert.deepEqual(now[key], before[key], key);
assert.equal(now.regionalTours.length, 30);
assert.equal(now.regionalTours.reduce((count, tour) => count + tour.steps.length, 0), 177);
assert.deepEqual(preCoronaryArterialStudyProfiles(now.dissectionProfiles), before.dissectionProfiles,
  'Frozen two-focus coronary transition reverses to the full prior recipe set');
assert.equal(now.contentTabs.length, 9);
assert.equal(pins.sourceVersion, sourceCatalog.sourceVersion);
assert.deepEqual(pins.coordinateSystem, sourceCatalog.coordinateSystem);
assert.deepEqual(pins.bundles, catalog.bundles.filter(bundle => pins.bundles.some(pinned => pinned.id === bundle.id)));

let changed = 0, preserved = 0;
for (const structure of catalog.structures) {
  const entry = entries.get(structure.id);
  for (const tab of now.contentTabs) {
    const previous = before.bodyLesson(structure, tab), current = now.bodyLesson(structure, tab);
    if (!changedKeys.has(`${structure.id}:${tab}`)) {
      assert.deepEqual(current, previous, `${structure.id}:${tab}:unchanged`);
      preserved++;
      continue;
    }
    assert(entry);
    assert.deepEqual(structure, entry.identity);
    assert.deepEqual(entry.previous[tab], previous);
    assert.deepEqual(current, now.respiratoryCoreDepthLesson(entry.identity, tab));
    assert.equal(current.readiness, 'draft');
    const {readiness, ...display} = current;
    assert.deepEqual(now.bodyContent(structure, tab), display);
    const topic = now.respiratoryCoreDepthTopics[entry.group], section = topic[tab];
    assert.equal(current.title, `${structure.name} · ${section.title} · draft`);
    assert.equal(current.body, section.body);
    assert.deepEqual(current.bullets, [...section.bullets, `Visible source limit: ${topic.limit}${structure.coverageNote ? ' ' + structure.coverageNote : ''}`]);
    assert.deepEqual(current.citations, topic.references.map(key => now.respiratoryCoreDepthReferences[key]));
    for (const citation of current.citations) assert.equal(new URL(citation).protocol, 'https:');
    assert.match(current.note, /revision-bound radiologist review pending/i);
    assert.match(current.note, /independent/i);
    const record = transition.entries.find(item => item.id === structure.id && item.tab === tab);
    assert(record);
    assert.equal(record.fmaId, structure.fmaId);
    assert.equal(record.previousHash, sha(previous));
    assert.equal(record.currentHash, sha(current));
    changed++;
  }
}
assert.equal(changed, 8);
assert.equal(preserved, 9928);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object' ? Object.entries(value).flatMap(([key, part]) => pathsWhere(part, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let forged = 0, stale = 0, storageCalls = 0, changedReview = 0, preservedReview = 0, coronaryReview = 0;
for (const {identity} of pins.entries) {
  const tabs = [...changedKeys].filter(key => key.startsWith(identity.id + ':')).map(key => key.slice(identity.id.length + 1));
  for (const tab of tabs) {
    const original = now.respiratoryCoreDepthLesson(identity, tab);
    const mutated = now.respiratoryCoreDepthLesson(identity, tab);
    mutated.bullets.push('foreign');
    mutated.citations.push('https://foreign.example');
    assert.deepEqual(now.respiratoryCoreDepthLesson(identity, tab), original);
  }
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const foreign = structuredClone(identity), parent = at(foreign, path.slice(0, -1)), key = path.at(-1), value = parent[key];
    parent[key] = typeof value === 'string' ? `${value}-foreign` : typeof value === 'number' ? value + 0.01 : value === null ? 'foreign' : !value;
    for (const tab of tabs) assert.equal(now.respiratoryCoreDepthLesson(foreign, tab), undefined, `${identity.id}:${path.join('.')}:${tab}`);
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const foreign = structuredClone(identity);
    at(foreign, path).push('foreign');
    for (const tab of tabs) assert.equal(now.respiratoryCoreDepthLesson(foreign, tab), undefined, `${identity.id}:${path.join('.')}:${tab}`);
  }
  for (const tab of tabs) assert.equal(now.respiratoryCoreDepthLesson({...structuredClone(identity), unexpected: true}, tab), undefined);
  for (const tab of now.contentTabs.filter(tab => tab !== 'anatomy' && tab !== 'function')) assert.equal(now.respiratoryCoreDepthLesson(identity, tab), undefined);
  if (tabs.length === 1) assert.equal(now.respiratoryCoreDepthLesson(identity, 'function'), undefined);
  const material = await now.bodyReviewMaterial(identity.id), priorMaterial = await before.bodyReviewMaterial(identity.id);
  assert.equal(material.approval, false);
  assert(await now.parseBodyReviewResponse(material, identity.id));
  for (const key of ['source', 'reasoning', 'guidedTours']) assert.deepEqual(material[key], priorMaterial[key]);
  for (const tab of tabs) assert.deepEqual(material.topics.find(topic => topic.tab === tab), {tab, ...now.respiratoryCoreDepthLesson(identity, tab)});
  const changedTab = tabs[0];
  for (const edit of [
    value => {value.topics.find(topic => topic.tab === changedTab).body += ' foreign';},
    value => {value.topics.find(topic => topic.tab === changedTab).readiness = 'approved';},
    value => {value.topics.find(topic => topic.tab === changedTab).citations = ['https://foreign.example'];},
    value => {value.source.structure.sources = [];},
    value => {value.topics = value.topics.filter(topic => topic.tab !== changedTab);},
  ]) {
    const foreign = structuredClone(material); edit(foreign);
    assert.equal(await now.parseBodyReviewResponse(foreign, identity.id), null);
    forged++;
  }
  const priorContext = await before.bodyReviewContext(identity.id), context = await now.bodyReviewContext(identity.id);
  assert.equal(context.sourceHash, priorContext.sourceHash);
  assert.notEqual(context.rendererHash, priorContext.rendererHash);
  assert.notEqual(context.revisions.geometry, priorContext.revisions.geometry);
  assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
  assert.equal(context.revisions.imaging, null);
  const packet = {catalogScope: context.catalogScope, structureId: identity.id, track: 'teaching', expectedVersion: 0, materialHash: context.materialHash, revisionHash: context.revisions.teaching, checklistVersion: context.checklistVersion, draft: now.blankBodyReview(context, 'teaching')};
  for (const delta of [
    {materialHash: priorContext.materialHash, revisionHash: priorContext.revisions.teaching},
    {materialHash: priorContext.materialHash},
    {revisionHash: priorContext.revisions.teaching},
  ]) {
    const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_RESPIRATORY_DEPTH'}, body: JSON.stringify({...packet, ...delta})}), {prepare() {storageCalls++; throw Error('Stale decision reached storage');}});
    assert.equal(response.status, 409);
    stale++;
  }
}
assert.equal(forged, 25);
assert.equal(stale, 15);
assert.equal(storageCalls, 0);
assert.equal(now.respiratoryCoreDepthLesson({id: 'foreign'}, 'anatomy'), undefined);

for (const structure of catalog.structures) {
  const previous = await before.bodyReviewMaterial(structure.id), current = await now.bodyReviewMaterial(structure.id);
  assert(await now.parseBodyReviewResponse(current, structure.id), structure.id);
  for (const key of ['source', 'reasoning', 'guidedTours']) assert.deepEqual(current[key], previous[key]);
  assert.equal(current.approval, false);
  if (coronaryIds.has(structure.id)) {
    coronaryReview++;
    const coronaryBefore = await preCoronary.bodyReviewMaterial(structure.id);
    const coronaryBeforeContext = await preCoronary.bodyReviewContext(structure.id);
    const coronaryContext = await now.bodyReviewContext(structure.id);
    assert.equal(coronaryContext.rendererHash, JSON.parse(studyFile('atlas-review/content/body-renderer-revision.json')).sha256);
    assert.equal(coronaryBeforeContext.rendererHash, JSON.parse(preCoronaryFile('atlas-review/content/body-renderer-revision.json')).sha256);
    assert.notEqual(coronaryContext.rendererHash, coronaryBeforeContext.rendererHash, 'Saved coronary scene and website integration require renderer re-review');
    assert.equal(current.fingerprints.source, coronaryBefore.fingerprints.source);
    assert.equal(current.fingerprints.teaching, coronaryBefore.fingerprints.teaching);
    assert.notEqual(current.fingerprints.checklist, coronaryBefore.fingerprints.checklist);
    assert.notEqual(current.materialHash, coronaryBefore.materialHash);
    assert.equal(coronaryBefore.checklist.geometry.length, 3);
    assert.equal(current.checklist.geometry.length, 13);
    const oldPacket = structuredClone(coronaryBefore), newPacket = structuredClone(current);
    for (const packet of [oldPacket, newPacket]) {
      delete packet.checklist.geometry;
      delete packet.fingerprints.checklist;
      delete packet.materialHash;
    }
    assert.deepEqual(newPacket, oldPacket, `${structure.id}: only coronary checklist and hashes changed`);
    assert.equal(coronaryContext.sourceHash, coronaryBeforeContext.sourceHash);
    assert.equal(coronaryContext.teachingHash, coronaryBeforeContext.teachingHash);
    assert.equal(coronaryContext.revisions.teaching, coronaryBeforeContext.revisions.teaching);
    assert.equal(coronaryContext.revisions.imaging, null);
    assert.notEqual(coronaryContext.revisions.geometry, coronaryBeforeContext.revisions.geometry);
    assert.equal(coronaryBeforeContext.checklists.geometry.length, 6);
    assert.equal(coronaryContext.checklists.geometry.length, 16);
    assert.deepEqual(coronaryContext.checklists.geometry.slice(6).map(check => check.id),
      Array.from({length: 10}, (_, index) => `source-study-${index + 1}`));
    const oldContext = structuredClone(coronaryBeforeContext), newContext = structuredClone(coronaryContext);
    for (const context of [oldContext, newContext]) {
      delete context.checklists.geometry;
      delete context.revisions.geometry;
      delete context.materialHash;
      delete context.rendererHash;
    }
    assert.deepEqual(newContext, oldContext, `${structure.id}: only coronary geometry, exact renderer binding and material hash changed`);
  }
  if (entries.has(structure.id)) {
    assert.notEqual(current.fingerprints.teaching, previous.fingerprints.teaching);
    for (const tab of now.contentTabs.filter(tab => !changedKeys.has(`${structure.id}:${tab}`)))
      assert.deepEqual(current.topics.find(topic => topic.tab === tab), previous.topics.find(topic => topic.tab === tab));
    changedReview++;
  } else {
    assert.deepEqual(current.topics, previous.topics);
    assert.equal(current.fingerprints.teaching, previous.fingerprints.teaching);
    preservedReview++;
  }
}
assert.equal(changedReview, 5);
assert.equal(preservedReview, 1099);
assert.equal(coronaryReview, 5);
assert.deepEqual(now.nestedReviewRows, before.nestedReviewRows);
let preservedNested = 0;
for (const row of now.nestedReviewRows) for (const surface of row.surfaces) {
  const current = await now.nestedReviewMaterial(row.key, surface.id);
  const previous = await before.nestedReviewMaterial(row.key, surface.id);
  assert.deepEqual(current.source, previous.source);
  assert.deepEqual(current.teaching, previous.teaching);
  assert.equal(current.context.sourceHash, previous.context.sourceHash);
  assert.equal(current.context.teachingHash, previous.context.teachingHash);
  preservedNested++;
}
assert.equal(preservedNested, 108);
const unaffectedId = catalog.structures.find(structure => !entries.has(structure.id) && !coronaryIds.has(structure.id)).id;
const unaffectedBefore = await before.bodyReviewContext(unaffectedId), unaffectedNow = await now.bodyReviewContext(unaffectedId);
assert.equal(unaffectedNow.sourceHash, unaffectedBefore.sourceHash);
assert.equal(unaffectedNow.revisions.teaching, unaffectedBefore.revisions.teaching);
assert.notEqual(unaffectedNow.revisions.geometry, unaffectedBefore.revisions.geometry);

assert.equal(review.revision, sourceRevision);
for (const file of review.files) assert.equal(sha(readFileSync(`atlas-review/${file.path}`)), file.importedSha256, file.path);
const previousReview = JSON.parse(old('atlas-review/manifest.json'));
const addedPaths = ['content/respiratory-core-depth-pins.json', 'content/respiratory-core-depth.ts', 'lib/respiratory-core-depth.ts'];
const respiratoryReview = JSON.parse(preCoronaryFile('atlas-review/manifest.json'));
assert.equal(respiratoryReview.revision, respiratorySourceRevision);
assert.equal(respiratoryReview.files.length, previousReview.files.length + addedPaths.length);
for (const previous of previousReview.files) assert(respiratoryReview.files.some(file => file.path === previous.path), `Retain prior respiratory Review input: ${previous.path}`);
assert.deepEqual(respiratoryReview.files.filter(file => !previousReview.files.some(prior => prior.path === file.path)).map(file => file.path).sort(), [...addedPaths].sort());
const changedInputs = ['app/body-content.ts', 'content/body-renderer-revision.json', 'content/body-review-display-pins.json'];
assert.deepEqual(respiratoryReview.files.filter(file => previousReview.files.some(prior => prior.path === file.path && prior.sourceSha256 !== file.sourceSha256)).map(file => file.path).sort(), changedInputs);
for (const path of [...addedPaths, ...changedInputs]) assert.equal(respiratoryReview.files.find(file => file.path === path)?.sourceSha256, sha(respiratoryAt(path)), `Frozen respiratory input: ${path}`);
const coronaryAddedPaths = ['content/coronary-arterial-study-pins.json', 'lib/coronary-arterial-study.ts', 'lib/coronary-arterial-review.ts'];
const coronaryChangedInputs = ['app/body-explorer.tsx', 'app/dissection-data.ts',
  'content/body-renderer-revision.json', 'content/body-review-display-pins.json',
  'lib/study-links.ts', 'lib/body-review-material.ts', 'lib/body-review-context.ts'];
const studyReview = JSON.parse(studyFile('atlas-review/manifest.json'));
assert.equal(studyReview.files.length, respiratoryReview.files.length + coronaryAddedPaths.length);
for (const previous of respiratoryReview.files) assert(studyReview.files.some(file => file.path === previous.path), `Retain prior coronary Review input: ${previous.path}`);
assert.deepEqual(studyReview.files.filter(file => !respiratoryReview.files.some(prior => prior.path === file.path)).map(file => file.path).sort(), [...coronaryAddedPaths].sort());
assert.deepEqual(studyReview.files.filter(file => respiratoryReview.files.some(prior => prior.path === file.path && prior.sourceSha256 !== file.sourceSha256)).map(file => file.path).sort(), [...coronaryChangedInputs].sort());
for (const path of [...coronaryAddedPaths, ...coronaryChangedInputs]) assert.equal(studyReview.files.find(file => file.path === path)?.sourceSha256, sha(studySourceAt(path)), `Saved coronary-study input: ${path}`);
for (const path of addedPaths) assert.equal(studyReview.files.find(file => file.path === path)?.sourceSha256, sha(respiratoryAt(path)), `Preserved respiratory input: ${path}`);
const tourAddedPaths = ['lib/coronary-arterial-tour.ts'];
const tourChangedInputs = ['lib/regional-tours.ts', 'content/body-renderer-revision.json', 'content/body-review-display-pins.json'];
assert.equal(review.files.length, studyReview.files.length + tourAddedPaths.length);
for (const previous of studyReview.files) assert(review.files.some(file => file.path === previous.path), `Retain pre-tour Review input: ${previous.path}`);
assert.deepEqual(review.files.filter(file => !studyReview.files.some(prior => prior.path === file.path)).map(file => file.path).sort(), tourAddedPaths);
assert.deepEqual(review.files.filter(file => studyReview.files.some(prior => prior.path === file.path && prior.sourceSha256 !== file.sourceSha256)).map(file => file.path).sort(), [...tourChangedInputs].sort());
for (const path of [...tourAddedPaths, ...tourChangedInputs]) assert.equal(review.files.find(file => file.path === path)?.sourceSha256, sha(sourceAt(path)), `Current coronary-tour input: ${path}`);
for (const path of addedPaths) assert.equal(review.files.find(file => file.path === path)?.sourceSha256, sha(respiratoryAt(path)), `Current respiratory input: ${path}`);
assert(!review.files.some(file => file.path === 'content/respiratory-core-depth.transition.json'));
assert(!review.files.some(file => file.path === 'content/coronary-arterial-study.transition.json'));
for (const file of previousReview.files.filter(file => /^content\/.*-pins\.json$/.test(file.path) && file.path !== 'content/body-review-display-pins.json'))
  assert.deepEqual(readFileSync(`atlas-review/${file.path}`), old(`atlas-review/${file.path}`), `No immutable pin repin: ${file.path}`);

for (const name of ['head-neck', 'shoulder', 'female-pelvis', 'lower-limb']) {
  const base = `public/atlas-runtime/${name}/`, manifest = json(`${base}manifest.json`);
  assert.equal(manifest.sourceCommit, sourceRevision);
  assert.equal(manifest.patientDataIncluded, false);
  assert.equal(manifest.clinicalApproved, false);
  const previous = JSON.parse(old(`${base}manifest.json`));
  assert.deepEqual(manifest.files.filter(file => file.path.startsWith('models/')), previous.files.filter(file => file.path.startsWith('models/')));
  for (const file of manifest.files) assert.equal(sha(readFileSync(base + file.path)), file.sha256, `${name}:${file.path}`);
  const inputs = json(`${base}source-inputs.json`), previousInputs = JSON.parse(old(`${base}source-inputs.json`));
  const respiratoryInputs = JSON.parse(preCoronaryFile(`${base}source-inputs.json`));
  const studyInputs = JSON.parse(studyFile(`${base}source-inputs.json`));
  for (const file of previousInputs) assert(inputs.some(item => item.path === file.path), `${name}: retained source input: ${file.path}`);
  assert.deepEqual(respiratoryInputs.filter(file => !previousInputs.some(prior => prior.path === file.path)).map(file => file.path).sort(),
    (name === 'head-neck' || name === 'shoulder' ? [...addedPaths].sort() : []), `${name}: original respiratory additions`);
  for (const path of addedPaths) {
    const actual = inputs.find(file => file.path === path);
    assert.equal(Boolean(actual), name === 'head-neck' || name === 'shoulder', `${name}:${path}`);
    if (actual) assert.equal(actual.sha256, sha(sourceAt(path)));
  }
  assert.deepEqual(studyInputs.filter(file => !respiratoryInputs.some(prior => prior.path === file.path)).map(file => file.path).sort(),
    (name === 'head-neck' || name === 'shoulder' ? ['content/coronary-arterial-study-pins.json', 'lib/coronary-arterial-study.ts'] : []), `${name}: exact coronary scene additions`);
  // The private worksheet helper belongs to the protected Review import,
  // not the learner scene dependency graph.
  assert(!inputs.some(file => file.path === 'lib/coronary-arterial-review.ts'));
  for (const path of ['content/coronary-arterial-study-pins.json', 'lib/coronary-arterial-study.ts']) {
    const actual = inputs.find(file => file.path === path);
    assert.equal(Boolean(actual), name === 'head-neck' || name === 'shoulder', `${name}:${path}`);
    if (actual) assert.equal(actual.sha256, sha(sourceAt(path)));
  }
  assert.deepEqual(inputs.filter(file => !studyInputs.some(prior => prior.path === file.path)).map(file => file.path),
    name === 'head-neck' ? tourAddedPaths : [], `${name}: current tour source addition`);
  assert.deepEqual(inputs.filter(file => studyInputs.some(prior => prior.path === file.path && prior.sha256 !== file.sha256)).map(file => file.path),
    name === 'head-neck' ? ['lib/regional-tours.ts'] : [], `${name}: current tour source change`);
  if (name === 'head-neck') {
    for (const path of [...tourAddedPaths, 'lib/regional-tours.ts'])
      assert.equal(inputs.find(file => file.path === path)?.sha256, sha(sourceAt(path)), `${name}: ${path}`);
  }
  assert(!inputs.some(file => file.path === 'content/respiratory-core-depth.transition.json'));
  assert(!inputs.some(file => file.path === 'content/coronary-arterial-study.transition.json'));
  if (name === 'head-neck') {
    const emitted = emittedTeaching(base, manifest.files);
    for (const entry of pins.entries) for (const tab of Object.keys(entry.previous)) {
      const lesson = now.respiratoryCoreDepthLesson(entry.identity, tab);
      const topic = now.respiratoryCoreDepthTopics[entry.group], section = topic[tab];
      // Titles and source-limit bullets are assembled dynamically by the actual root renderer.
      for (const value of [entry.identity.id, entry.identity.name, section.title, lesson.body, ...section.bullets, topic.limit, entry.identity.coverageNote, lesson.note, ...lesson.citations].filter(Boolean))
        assert(emitted.includes(value) || emitted.includes(JSON.stringify(value).slice(1, -1)), `${name}:${entry.identity.id}:${tab}:${value.slice(0, 40)}`);
    }
  }
}
const reviewBase = 'public/atlas-review-viewer/', reviewManifest = json(`${reviewBase}manifest.json`);
assert.equal(reviewManifest.sourceCommit, sourceRevision);
assert.equal(reviewManifest.personalRecordsIncluded, false);
assert.equal(reviewManifest.websiteIntegrationSha256, review.websiteIntegrationSha256);
for (const file of reviewManifest.files) assert.equal(sha(readFileSync(reviewBase + file.path)), file.sha256, `review:${file.path}`);
const emittedReview = emittedTeaching(reviewBase, reviewManifest.files, true);
for (const entry of pins.entries) for (const tab of Object.keys(entry.previous)) {
  const lesson = now.respiratoryCoreDepthLesson(entry.identity, tab);
  const topic = now.respiratoryCoreDepthTopics[entry.group], section = topic[tab];
  for (const value of [entry.identity.id, entry.identity.name, section.title, lesson.body, ...section.bullets, topic.limit, entry.identity.coverageNote, lesson.note, ...lesson.citations].filter(Boolean))
    assert(emittedReview.includes(value) || emittedReview.includes(JSON.stringify(value).slice(1, -1)), `review:${entry.identity.id}:${tab}:${value.slice(0, 40)}`);
}
console.log(JSON.stringify({websiteBaseline, sourceRevision, changed, preserved, forgedMaterialRefusals: forged, staleRefusalsBeforeStorage: stale, storageCalls, changedReview, preservedReview, coronaryReview, preservedNested, clinicalApproval: false}));
