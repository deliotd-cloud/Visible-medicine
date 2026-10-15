import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const working = process.argv.length === 3 && process.argv[2] === '--working-transition';
assert(working || process.argv.length === 2, 'Only --working-transition is accepted');
const baseline = 'ec9972a60325de147277941e04089e2d4be0baf9';
const baselineTree = 'ec7d1b759a613e84d79a94bcc18370b1bb885e88';
const helperPath = 'lib/axillary-branch-xray.ts';
const contentPath = 'content/axillary-branch-xray.ts';
const pinPaths = [
  'content/shoulder-arm-artery-quiz-pins.json',
  'content/shoulder-arterial-imaging-pins.json',
  'content/thoracoacromial-quiz-pins.json',
];
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const subscapularCatalogPath = 'public/models/bodyparts3d/subscapular-arteries/catalog.json';
const git = args => execFileSync('git', args, {windowsHide: true, maxBuffer: 64e6,
  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}});
const gitBytes = (commit, path) => git(['show', `${commit}:${path}`]);
const head = () => git(['rev-parse', 'HEAD']).toString().trim();
assert.equal(git(['rev-parse', `${baseline}^{commit}`]).toString().trim(), baseline);
assert.equal(git(['rev-parse', `${baseline}^{tree}`]).toString().trim(), baselineTree);
let introduction;
if (working) {
  assert.equal(head(), baseline, 'Working transition requires exact baseline HEAD');
  for (const path of [helperPath, contentPath])
    assert.equal(git(['ls-files', '--others', '--exclude-standard', '--', path]).toString().trim(), path,
      `${path}: working source must be untracked`);
} else {
  introduction = git(['log', '--diff-filter=A', '--format=%H', '--', helperPath])
    .toString().trim().split(/\r?\n/).filter(Boolean).at(-1);
  assert.match(introduction ?? '', /^[a-f0-9]{40}$/, 'Immutable helper introduction commit');
  assert.equal(git(['merge-base', baseline, introduction]).toString().trim(), baseline);
  assert.equal(git(['merge-base', introduction, 'HEAD']).toString().trim(), introduction);
  for (const path of [helperPath, contentPath])
    assert(gitBytes(introduction, path).length > 0, `${path}: immutable introduced teaching`);
}
for (const path of [...pinPaths, catalogPath, subscapularCatalogPath])
  assert.deepEqual(readFileSync(path), gitBytes(baseline, path), `${path}: immutable baseline pin`);

const pins = pinPaths.map(path => JSON.parse(gitBytes(baseline, path)));
const rawCatalog = JSON.parse(gitBytes(baseline, catalogPath));
const subscapularCatalog = JSON.parse(gitBytes(baseline, subscapularCatalogPath));
// Independently retained FMA/group/side/file/hash identities. Full records are
// cross-checked against the baseline catalog and subjected to nested mutations.
const expected = new Map([
  ["FMA22682", {"group":"anteriorCircumflexHumeral","id":"vm:anatomy:body:shoulder-arm:right:vessel:right-anterior-circumflex-humeral-artery","side":"right","bundle":"shoulder-arm-vessels-recovery","sources":[{"file":"FJ2264","sha256":"a7aaef0dc149e6b481057266ee1b9a41720e0400a70697fbb5c15e7f8dd06187"}],"pinIndex":0}],
  ["FMA22683", {"group":"anteriorCircumflexHumeral","id":"vm:anatomy:body:shoulder-arm:left:vessel:left-anterior-circumflex-humeral-artery","side":"left","bundle":"shoulder-arm-vessels-recovery","sources":[{"file":"FJ2212","sha256":"87ac4531b5551470294420965e60888cae7a4943f767386ab3f40713144850f2"}],"pinIndex":0}],
  ["FMA22685", {"group":"posteriorCircumflexHumeral","id":"vm:anatomy:body:shoulder-arm:right:vessel:right-posterior-circumflex-humeral-artery","side":"right","bundle":"shoulder-arm-vessels-recovery","sources":[{"file":"FJ2291","sha256":"72f4c8d4e8465447611464bfa74df78924ffeaa9fc9829af32a4082518b6c02b"},{"file":"FJ2292","sha256":"19ad27ed37b4fdc61653588976e81e138f28b063c52b270e5cdfb93364eac58b"}],"pinIndex":0}],
  ["FMA22687", {"group":"posteriorCircumflexHumeral","id":"vm:anatomy:body:shoulder-arm:left:vessel:left-posterior-circumflex-humeral-artery","side":"left","bundle":"shoulder-arm-vessels-recovery","sources":[{"file":"FJ2239","sha256":"1e88872df7cffa6ccc3c325b2fbd0543279dc9ffc0a75b7e1e1ae14a0dc30d6f"},{"file":"FJ2240","sha256":"8d07c946f22777f447e46597283d37a9ad993f8f1f8d194af6ed58dd2475d62c"}],"pinIndex":0}],
  ["FMA23180", {"group":"circumflexScapular","id":"vm:anatomy:body:shoulder-arm:right:vessel:right-circumflex-scapular-artery","side":"right","bundle":"shoulder-arm-vessels-recovery","sources":[{"file":"FJ2273","sha256":"37154eff6530ba3cb17412723850f45c3ee5be9d0d9b78e737c7a1f356c87b3c"}],"pinIndex":0}],
  ["FMA23181", {"group":"circumflexScapular","id":"vm:anatomy:body:shoulder-arm:left:vessel:left-circumflex-scapular-artery","side":"left","bundle":"shoulder-arm-vessels-recovery","sources":[{"file":"FJ2221","sha256":"3387830f0c01f2f98710951a900442fdf6ad7b123ad1202aad4e0390cb0551f4"}],"pinIndex":0}],
  ["FMA66321", {"group":"thoracodorsal","id":"vm:anatomy:body:shoulder-arm:right:vessel:right-thoracodorsal-artery","side":"right","bundle":"shoulder-arm-vessels-recovery","sources":[{"file":"FJ2305","sha256":"b7d085f37da4801db31307961a176357a1d3a11e226c290e9883455376e9e254"}],"pinIndex":0}],
  ["FMA66322", {"group":"thoracodorsal","id":"vm:anatomy:body:shoulder-arm:left:vessel:left-thoracodorsal-artery","side":"left","bundle":"shoulder-arm-vessels-recovery","sources":[{"file":"FJ2253","sha256":"b6f9ae7678bb79b0245d03ea27ceee0a9e3f0cf6b6b0c7613c0830ac40e8989f"}],"pinIndex":0}],
  ["FMA22678", {"group":"subscapular","id":"vm:anatomy:body:shoulder-arm:right:vessel:right-subscapular-artery","side":"right","bundle":"subscapular-arteries","sources":[{"file":"FJ2298","sha256":"41050856a7c2cbb79984a78346a0e3dc13e271758a04012f2283fee2182a2f29"}],"pinIndex":1}],
  ["FMA22679", {"group":"subscapular","id":"vm:anatomy:body:shoulder-arm:left:vessel:left-subscapular-artery","side":"left","bundle":"subscapular-arteries","sources":[{"file":"FJ2246","sha256":"4dc93c063b9d87ab85699bfeb9f856cb39faf12d2859b0e4184ba64de6c9ef87"}],"pinIndex":1}],
  ["FMA66563", {"group":"trunk","id":"vm:anatomy:body:shoulder-arm:right:vessel:trunk-of-right-thoraco-acromial-artery","side":"right","bundle":"shoulder-arm-vessels-inventory","sources":[{"file":"FJ2304","sha256":"b82a47ccca2bb3affd63d8d1f86ad7c79a5a725bcbeb60a25711f1cd3275494e"}],"pinIndex":2}],
  ["FMA66564", {"group":"trunk","id":"vm:anatomy:body:shoulder-arm:left:vessel:trunk-of-left-thoraco-acromial-artery","side":"left","bundle":"shoulder-arm-vessels-inventory","sources":[{"file":"FJ2252","sha256":"2ff1924941e505e62ac394bc8e8087f6903c7dba58826d87dd21cbc254e511c7"}],"pinIndex":2}],
  ["FMA23063", {"group":"pectoral","id":"vm:anatomy:body:shoulder-arm:right:vessel:pectoral-branch-of-right-thoraco-acromial-artery","side":"right","bundle":"shoulder-arm-vessels-inventory","sources":[{"file":"FJ2361","sha256":"341bf21d162b7d1f60261396f397db0d7d4acb5be2295e30dea7f6b9394651e8"}],"pinIndex":2}],
  ["FMA23064", {"group":"pectoral","id":"vm:anatomy:body:shoulder-arm:left:vessel:pectoral-branch-of-left-thoraco-acromial-artery","side":"left","bundle":"shoulder-arm-vessels-inventory","sources":[{"file":"FJ2330","sha256":"3defe0932a0a8948faf7037f0812527864b9ac4e4f8251f45873d7b48ab00977"}],"pinIndex":2}],
  ["FMA23068", {"group":"acromial","id":"vm:anatomy:body:shoulder-arm:right:vessel:acromial-branch-of-right-thoraco-acromial-artery","side":"right","bundle":"shoulder-arm-vessels-inventory","sources":[{"file":"FJ2263","sha256":"d794a35d47638639cd793d357a99312850d6f7b27531cdc10b4b00817f35e170"}],"pinIndex":2}],
  ["FMA23069", {"group":"acromial","id":"vm:anatomy:body:shoulder-arm:left:vessel:acromial-branch-of-left-thoraco-acromial-artery","side":"left","bundle":"shoulder-arm-vessels-inventory","sources":[{"file":"FJ2211","sha256":"bd760839d0c3565e6d2bfe9d40e111116f7965e636053f213b0800b1ccb27537"}],"pinIndex":2}],
  ["FMA23072", {"group":"deltoid","id":"vm:anatomy:body:shoulder-arm:right:vessel:deltoid-branch-of-right-thoraco-acromial-artery","side":"right","bundle":"shoulder-arm-vessels-inventory","sources":[{"file":"FJ2282","sha256":"c5d3cd8addb5e3355d853cd416a599e3a90e6c450adbe08c6aad1d28136dc761"}],"pinIndex":2}],
  ["FMA23073", {"group":"deltoid","id":"vm:anatomy:body:shoulder-arm:left:vessel:deltoid-branch-of-left-thoraco-acromial-artery","side":"left","bundle":"shoulder-arm-vessels-inventory","sources":[{"file":"FJ2230","sha256":"cf6ccdb1b2c827dd096a04457aee6f55d2c95a3400f4dc6254c42fbfbd6bfcd1"}],"pinIndex":2}],
]);
assert.equal(expected.size, 18);
assert.equal(new Set([...expected.values()].map(row => row.group)).size, 9);
const selected = pinPaths.flatMap((_, index) => pins[index].entries
  .filter(entry => expected.get(entry.identity.fmaId)?.pinIndex === index));
assert.equal(selected.length, 18);
assert.deepEqual(new Set(selected.map(entry => entry.identity.fmaId)), new Set(expected.keys()));
const identities = new Map();
for (const entry of selected) {
  const i = entry.identity, e = expected.get(i.fmaId);
  assert.equal(entry.group ?? 'subscapular', e.group);
  assert.equal(i.id, e.id);
  assert.equal(i.laterality, e.side);
  assert.equal(i.region, 'shoulder-arm');
  assert.equal(i.system, 'vessels');
  assert.equal(i.category, 'vessel');
  assert.equal(i.bundle, e.bundle);
  assert.equal(i.nodeName, i.fmaId);
  assert.equal(i.sourceTree, 'isa');
  assert.deepEqual(i.sources, e.sources);
  assert.equal(i.validation.status, 'unvalidated');
  assert.equal(i.validation.anatomicalReview, false);
  const catalogRows = [rawCatalog, subscapularCatalog].flatMap(source =>
    source.structures.filter(row => row.fmaId === i.fmaId));
  assert.equal(catalogRows.length, 1);
  assert.deepEqual(catalogRows[0], i, `${i.fmaId}: baseline catalog source identity`);
  assert(!identities.has(i.id));
  identities.set(i.id, i);
}
assert.equal(identities.size, 18);
const trackedGlbs = git(['ls-tree', '-r', '--name-only', baseline])
  .toString().trim().split(/\r?\n/).filter(path => path.endsWith('.glb'));
assert.equal(trackedGlbs.length, 146);
for (const path of trackedGlbs)
  assert.deepEqual(readFileSync(path), gitBytes(baseline, path), `${path}: geometry bytes`);

const compiled = await build({stdin: {contents:
  "export {axillaryBranchXrayLesson} from './lib/axillary-branch-xray';" +
  "export {bodyLesson,bodyContent} from './app/body-content';" +
  "export {bodyDisplayCatalog} from './lib/body-display-catalog';" +
  "export {contentTabs} from './lib/content-types';" +
  "export {structures} from './app/anatomy-data';" +
  "export {dissectionProfiles} from './app/dissection-data';" +
  "export {regionalTours} from './lib/regional-tours';" +
  "export * from './lib/body-review-material';" +
  "export * from './lib/body-review-context';" +
  "export * from './lib/body-review-response';" +
  "export * from './lib/body-review-api';" +
  "export * from './lib/body-review-decisions';",
  resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm'});
const live = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const old = await exactSourceHistoryApi(baseline, 'regional-tour-review');
const feature = working ? live : await exactSourceHistoryApi(introduction, 'axillary-branch-xray-epoch');
const wholeEpoch = working || head() === introduction;
const subject = wholeEpoch ? live : feature;
const catalog = feature.bodyDisplayCatalog(rawCatalog);
assert.equal(catalog.structures.length, 1104);
assert.equal(catalog.structures.length * feature.contentTabs.length, 9936);
assert.deepEqual(catalog, old.bodyDisplayCatalog(rawCatalog));
for (const identity of identities.values()) {
  const rows = catalog.structures.filter(row => row.id === identity.id);
  assert.deepEqual(rows, [identity], `${identity.fmaId}: exact transformed baseline identity`);
}
assert.deepEqual(feature.contentTabs, old.contentTabs);
assert.deepEqual(feature.structures, old.structures);
assert.deepEqual(feature.dissectionProfiles, old.dissectionProfiles);
assert.deepEqual(feature.regionalTours, old.regionalTours);
assert.equal(feature.regionalTours.length, 51);
assert.equal(feature.regionalTours.reduce((n, tour) => n + tour.steps.length, 0), 309);
if (wholeEpoch) {
  assert.deepEqual(live.bodyDisplayCatalog(rawCatalog), catalog);
  assert.deepEqual(live.contentTabs, feature.contentTabs);
  assert.deepEqual(live.regionalTours, feature.regionalTours);
}

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object' ? Object.entries(value)
    .flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
for (const identity of identities.values()) {
  assert.equal(subject.axillaryBranchXrayLesson(identity, 'xray').readiness, 'draft');
  for (const tab of feature.contentTabs.filter(tab => tab !== 'xray'))
    assert.equal(subject.axillaryBranchXrayLesson(identity, tab), undefined);
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
    const key = path.at(-1), original = parent[key];
    parent[key] = typeof original === 'string' ? original + '-foreign'
      : typeof original === 'number' ? original + 0.01 : original === null ? 'foreign' : !original;
    assert.equal(subject.axillaryBranchXrayLesson(bad, 'xray'), undefined, `${identity.id}:${path.join('.')}`);
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const bad = structuredClone(identity); at(bad, path).push('foreign');
    assert.equal(subject.axillaryBranchXrayLesson(bad, 'xray'), undefined, `${identity.id}:${path.join('.')} extended`);
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const bad = structuredClone(identity); at(bad, path).unexpected = true;
    assert.equal(subject.axillaryBranchXrayLesson(bad, 'xray'), undefined, `${identity.id}:${path.join('.') || '<root>'} extra`);
    refusedIdentities++;
    for (const key of Object.keys(at(identity, path))) {
      const omitted = structuredClone(identity); delete at(omitted, path)[key];
      assert.equal(subject.axillaryBranchXrayLesson(omitted, 'xray'), undefined,
        `${identity.id}:${[...path, key].join('.')} omitted`);
      refusedIdentities++;
    }
  }
  for (const path of pathsWhere(identity, value => Array.isArray(value) && value.length > 1)) {
    const original = at(identity, path);
    const second = original.findIndex((item, index) => index > 0 && JSON.stringify(item) !== JSON.stringify(original[0]));
    if (second < 0) continue;
    const bad = structuredClone(identity), array = at(bad, path);
    [array[0], array[second]] = [array[second], array[0]];
    assert.equal(subject.axillaryBranchXrayLesson(bad, 'xray'), undefined,
      `${identity.id}:${path.join('.')} reordered`);
    refusedIdentities++;
  }
}

let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let malformed = 0, stale = 0, forgedSave = 0, forgedApproval = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  for (const tab of feature.contentTabs) {
    const previous = old.bodyLesson(structure, tab), lesson = feature.bodyLesson(structure, tab);
    if (wholeEpoch) assert.deepEqual(subject.bodyLesson(structure, tab), lesson, `${structure.id}:${tab}: current epoch`);
    if (identities.has(structure.id) && tab === 'xray') {
      assert.equal(previous.readiness, 'pending');
      assert.equal(lesson.readiness, 'draft');
      assert.deepEqual(lesson, feature.axillaryBranchXrayLesson(structure, tab));
      assert.deepEqual(subject.axillaryBranchXrayLesson(structure, tab), lesson);
      assert(lesson.citations.length > 0 && lesson.citations.every(url => /^https:\/\//.test(url)));
      assert.equal(new Set(lesson.citations).size, lesson.citations.length);
      const copyText = [lesson.body, ...lesson.bullets, lesson.note].join(' ');
      assert.match(copyText, /(?:radiograph|plain film|x-ray)/i);
      assert.match(copyText, /arter(?:y|ies|ial)|branch|vessel|vascular|lumen/i);
      assert.match(copyText, /(?:not|cannot|does not).*(?:show|resolve|assess|establish|confirm|prove|depict|visuali[sz]e)|(?:cannot|not) be (?:assessed|seen)/i,
        `${structure.id}: plain-film limitation`);
      assert.doesNotMatch(copyText, /approved for clinical use|registered to a patient|normal arterial patency/i);
      const {readiness, ...content} = lesson;
      assert.deepEqual(feature.bodyContent(structure, tab), content);
      const copy = structuredClone(lesson);
      lesson.bullets.push('foreign'); lesson.citations.push('https://foreign.example');
      assert.deepEqual(subject.axillaryBranchXrayLesson(structure, tab), copy);
      changed++;
    } else {
      assert.deepEqual(lesson, previous, `${structure.id}:${tab}: untouched placement`);
      assert.equal(subject.axillaryBranchXrayLesson(structure, tab), undefined);
      preserved++;
    }
  }
  const previousPacket = await old.bodyReviewMaterial(structure.id);
  const packet = await feature.bodyReviewMaterial(structure.id);
  if (wholeEpoch && !working) assert.deepEqual(await subject.bodyReviewMaterial(structure.id), packet);
  assert.equal(packet.approval, false);
  if (identities.has(structure.id)) {
    const currentPacket = await subject.bodyReviewMaterial(structure.id);
    for (const key of ['source', 'topics', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits', 'fingerprints', 'materialHash'])
      assert.deepEqual(currentPacket[key], packet[key], `${structure.id}: current ${key}`);
    assert.deepEqual(packet.topics.filter(row => row.tab !== 'xray'), previousPacket.topics.filter(row => row.tab !== 'xray'));
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], previousPacket[key], `${structure.id}: preserved ${key}`);
    assert.equal(packet.fingerprints.source, previousPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, previousPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, previousPacket.materialHash);
    assert.deepEqual(packet.topics.find(row => row.tab === 'xray'), {tab: 'xray', ...feature.bodyLesson(structure, 'xray')});
    assert.deepEqual(await feature.parseBodyReviewResponse(packet, structure.id), packet);
    assert.deepEqual(await subject.parseBodyReviewResponse(currentPacket, structure.id), currentPacket);
    assert.equal(await subject.parseBodyReviewResponse(previousPacket, structure.id), null);
    for (const edit of [
      value => { value.topics.find(row => row.tab === 'xray').body += ' foreign'; },
      value => { value.topics.find(row => row.tab === 'xray').citations = ['https://foreign.example']; },
      value => { value.topics.find(row => row.tab === 'xray').readiness = 'approved'; },
      value => { value.source.structure.sources = []; },
    ]) {
      const forged = structuredClone(currentPacket); edit(forged);
      assert.equal(await subject.parseBodyReviewResponse(forged, structure.id), null);
      malformed++;
    }
    const priorContext = await old.bodyReviewContext(structure.id);
    const context = await subject.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash, priorContext.sourceHash);
    assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
    const decision = {catalogScope: context.catalogScope, structureId: structure.id,
      track: 'teaching', expectedVersion: 0, materialHash: priorContext.materialHash,
      revisionHash: priorContext.revisions.teaching, checklistVersion: context.checklistVersion,
      draft: subject.blankBodyReview(context, 'teaching')};
    const request = value => new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_AXILLARY_BRANCH_XRAY'}, body: JSON.stringify(value)});
    const db = {prepare() { storageCalls++; throw Error('Rejected decision reached storage'); }};
    assert.equal((await subject.postBodyDecision(request(decision), db)).status, 409); stale++;
    const forged = structuredClone(decision);
    forged.materialHash = context.materialHash;
    forged.revisionHash = context.revisions.teaching;
    const foreignCheck = structuredClone(forged);
    foreignCheck.draft.checks.foreign = true;
    assert.equal((await subject.postBodyDecision(request(foreignCheck), db)).status, 422); forgedSave++;
    forged.draft.status = 'approved';
    assert.equal((await subject.postBodyDecision(request(forged), db)).status, 422); forgedApproval++;
    changedPackets++;
  } else {
    assert.deepEqual(packet, previousPacket, `${structure.id}: untouched Review packet`);
    preservedPackets++;
  }
}
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [18, 9918, 18, 1086]);
assert.deepEqual([malformed, stale, forgedSave, forgedApproval, storageCalls], [72, 18, 18, 18, 0]);
console.log(JSON.stringify({baseline, introduction, working, wholeEpoch, changed, preserved,
  changedPackets, preservedPackets, refusedIdentities, malformedPacketsRefused: malformed,
  staleRefusalsBeforeStorage: stale, forgedSaveRefusalsBeforeStorage: forgedSave,
  forgedApprovalRefusalsBeforeStorage: forgedApproval, storageCalls, clinicalApproval: false}));
