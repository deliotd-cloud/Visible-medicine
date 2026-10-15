import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const working = process.argv.length === 3 && process.argv[2] === '--working-transition';
assert(working || process.argv.length === 2, 'Only --working-transition is accepted');
const baseline = 'c978ecee3bdddfeaf2995ecbf62d5178e719c4fb';
const helperPath = 'lib/shoulder-muscle-xray.ts';
const contentPath = 'content/shoulder-muscle-xray.ts';
const imagingPinPath = 'content/shoulder-arm-muscle-imaging-pins.json';
const motorPinPath = 'content/upper-limb-motor-pins.json';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const git = args => execFileSync('git', args, {windowsHide: true, maxBuffer: 64e6,
  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}});
const gitBytes = (commit, path) => git(['show', `${commit}:${path}`]);
const head = () => git(['rev-parse', 'HEAD']).toString().trim();
assert.equal(git(['rev-parse', `${baseline}^{commit}`]).toString().trim(), baseline);
let introduction;
if (working) {
  assert.equal(head(), baseline, 'Working transition requires exact baseline HEAD');
  assert.equal(git(['ls-files', '--others', '--exclude-standard', '--', helperPath]).toString().trim(), helperPath,
    'Working helper must be untracked');
} else {
  introduction = git(['log', '--diff-filter=A', '--format=%H', '--', helperPath])
    .toString().trim().split(/\r?\n/).filter(Boolean).at(-1);
  assert.match(introduction ?? '', /^[a-f0-9]{40}$/, 'Immutable helper introduction commit');
  assert.equal(git(['merge-base', baseline, introduction]).toString().trim(), baseline);
  assert.equal(git(['merge-base', introduction, 'HEAD']).toString().trim(), introduction);
  for (const path of [helperPath, contentPath])
    assert.deepEqual(readFileSync(path), gitBytes(introduction, path), `${path}: immutable introduced teaching`);
}

for (const path of [imagingPinPath, motorPinPath, catalogPath])
  assert.deepEqual(readFileSync(path), gitBytes(baseline, path), `${path}: immutable baseline pin`);
const imaging = JSON.parse(gitBytes(baseline, imagingPinPath));
const motor = JSON.parse(gitBytes(baseline, motorPinPath));
const rawCatalog = JSON.parse(gitBytes(baseline, catalogPath));
// Independently selected FMA/group/side/source identities from the two existing pins.
// The imaging pin covers 12; the older motor pin supplies the four right-side records.
const expected = new Map([
  ['FMA34680', ['deltoid-clavicular', 'right', 'clavicular-part-of-right-deltoid', 'FJ1468', '09eebb4a8d72c91936b0bfde7f35829a58f56103ac158f559186698458bcc616']],
  ['FMA34681', ['deltoid-clavicular', 'left', 'clavicular-part-of-left-deltoid', 'FJ1468M', '75340ac9157ea6c64baaa74c0bbfd6173114dcff0d30ea814702c288b002f104']],
  ['FMA34682', ['deltoid-acromial', 'right', 'acromial-part-of-right-deltoid', 'FJ1467', '2f69f1a13c836539abca85d9b77f55f96319ad3fdd75c62f498eabe49b266bfe']],
  ['FMA34683', ['deltoid-acromial', 'left', 'acromial-part-of-left-deltoid', 'FJ1467M', 'a523b5f2ab862ad6505787f4936098fbcfe3f28a3742b57aac34307fe752f8eb']],
  ['FMA34684', ['deltoid-spinal', 'right', 'spinal-part-of-right-deltoid', 'FJ1513', 'ef8308c92fd0d01d8c0d7ffd9238305eefc2f28710d7bb58f451512abdc08e99']],
  ['FMA34685', ['deltoid-spinal', 'left', 'spinal-part-of-left-deltoid', 'FJ1513M', 'a806a9a20b68009f0071c22411b009f4baef3de118f00a37cc4a3be8cdf7ce2e']],
  ['FMA37686', ['biceps-long-head', 'right', 'long-head-of-right-biceps-brachii', 'FJ1478', '2442d2b5ac30c5da42e72eeff83d143df51c7617001cbc6552096a504f29bc07']],
  ['FMA37687', ['biceps-long-head', 'left', 'long-head-of-left-biceps-brachii', 'FJ1478M', '10189f1d7b5220df3baef2b259ae9855ed301c1afaadfc2de25af3222c5a08fc']],
  ['FMA37684', ['biceps-short-head', 'right', 'short-head-of-right-biceps-brachii', 'FJ1512', '2173b7cce29f11036907b80e068e9bd6c16f22359d6e7994af9684454b99b4d5']],
  ['FMA37685', ['biceps-short-head', 'left', 'short-head-of-left-biceps-brachii', 'FJ1512M', '6b0ed7b70973b3a2e08de4ea5ce59c05a4ddce2b90212ff734326be2726d1293']],
  ['FMA37695', ['triceps-medial-head', 'right', 'medial-head-of-right-triceps-brachii', 'FJ1480', '1ea653667afa5ff0bf0e01d71ac648819655241c130e8dd1778ed2f9561c34c5']],
  ['FMA37696', ['triceps-medial-head', 'left', 'medial-head-of-left-triceps-brachii', 'FJ1480M', 'fc35854102a057ca85a201eeff4c18f03722b1ceab52c311ce1b87abf4fa2ff8']],
  ['FMA37697', ['triceps-lateral-head', 'right', 'lateral-head-of-right-triceps-brachii', 'FJ1477', '1d1c3b42eec0dffe696bd25cffa81784c87c15f16c9605050fdf1cb2f47698dd']],
  ['FMA37698', ['triceps-lateral-head', 'left', 'lateral-head-of-left-triceps-brachii', 'FJ1477M', '96d9859e983736f53864e53fa0579b8f6a18006067967df42e4fe7ea2d2b9e6f']],
  ['FMA37699', ['triceps-long-head', 'right', 'long-head-of-right-triceps-brachii', 'FJ1479', 'acc48f746bd07a117357a9c49a1a9850c96b85d7c63cf90a662a45717875a315']],
  ['FMA37700', ['triceps-long-head', 'left', 'long-head-of-left-triceps-brachii', 'FJ1479M', '4b8315f9134a213f45c3af830270f4526e705d0a149894516d3f5fba98878f15']],
]);
assert.equal(expected.size, 16);
assert.equal(new Set([...expected.values()].map(row => row[0])).size, 8);
const pinned = new Map();
for (const entry of imaging.entries.filter(entry => expected.has(entry.identity.fmaId))) {
  assert(!pinned.has(entry.identity.fmaId));
  pinned.set(entry.identity.fmaId, entry.identity);
  assert.equal(entry.group, expected.get(entry.identity.fmaId)[0]);
}
assert.equal(pinned.size, 12);
for (const id of ['FMA34680', 'FMA34682', 'FMA34684', 'FMA37686']) {
  const rows = motor.entries.filter(entry => entry.fmaId === id);
  assert.equal(rows.length, 1, `${id}: exactly one motor pin`);
  pinned.set(id, rows[0]);
}
assert.deepEqual(new Set(pinned.keys()), new Set(expected.keys()));
const identities = new Map();
for (const [fmaId, identity] of pinned) {
  const [group, side, slug, file, sha] = expected.get(fmaId);
  assert.equal(identity.id, `vm:anatomy:body:shoulder-arm:${side}:muscle:${slug}`);
  assert.equal(identity.fmaId, fmaId);
  assert.equal(identity.laterality, side);
  assert.equal(identity.region, 'shoulder-arm');
  assert.equal(identity.system, 'muscles');
  assert.equal(identity.category, 'muscle');
  assert.equal(identity.bundle, 'shoulder-arm-muscles-dissection');
  assert.equal(identity.nodeName, fmaId);
  assert.equal(identity.sourceTree, 'isa');
  assert.deepEqual(identity.sources, [{file, sha256: sha}]);
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
  const matches = rawCatalog.structures.filter(row => row.fmaId === fmaId);
  assert.equal(matches.length, 1);
  assert.deepEqual(matches[0], identity, `${group}:${fmaId}: full baseline catalog identity`);
  assert(!identities.has(identity.id));
  identities.set(identity.id, identity);
}
const modelPath = 'public/models/bodyparts3d/full-body/shoulder-arm-muscles-dissection.glb';
assert.deepEqual(readFileSync(modelPath), gitBytes(baseline, modelPath));
const trackedGlbs = git(['ls-tree', '-r', '--name-only', baseline])
  .toString().trim().split(/\r?\n/).filter(path => path.endsWith('.glb'));
assert.equal(trackedGlbs.length, 146);
for (const path of trackedGlbs) assert.deepEqual(readFileSync(path), gitBytes(baseline, path), `${path}: geometry bytes`);

const compiled = await build({stdin: {contents:
  "export {shoulderMuscleXrayLesson} from './lib/shoulder-muscle-xray';" +
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
const feature = working ? live : await exactSourceHistoryApi(introduction, 'shoulder-muscle-xray-epoch');
const wholeEpoch = working || head() === introduction;
const catalog = feature.bodyDisplayCatalog(rawCatalog);
assert.equal(catalog.structures.length, 1104);
assert.equal(catalog.structures.length * feature.contentTabs.length, 9936);
assert.deepEqual(catalog, old.bodyDisplayCatalog(rawCatalog));
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
  assert.equal(live.shoulderMuscleXrayLesson(identity, 'xray').readiness, 'draft');
  for (const tab of feature.contentTabs.filter(tab => tab !== 'xray'))
    assert.equal(live.shoulderMuscleXrayLesson(identity, tab), undefined);
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
    const key = path.at(-1), original = parent[key];
    parent[key] = typeof original === 'string' ? original + '-foreign'
      : typeof original === 'number' ? original + 0.01 : original === null ? 'foreign' : !original;
    assert.equal(live.shoulderMuscleXrayLesson(bad, 'xray'), undefined, `${identity.id}:${path.join('.')}`);
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const bad = structuredClone(identity); at(bad, path).push('foreign');
    assert.equal(live.shoulderMuscleXrayLesson(bad, 'xray'), undefined, `${identity.id}:${path.join('.')} extended`);
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const bad = structuredClone(identity); at(bad, path).unexpected = true;
    assert.equal(live.shoulderMuscleXrayLesson(bad, 'xray'), undefined, `${identity.id}:${path.join('.') || '<root>'} extra`);
    refusedIdentities++;
    for (const key of Object.keys(at(identity, path))) {
      const omitted = structuredClone(identity); delete at(omitted, path)[key];
      assert.equal(live.shoulderMuscleXrayLesson(omitted, 'xray'), undefined,
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
    assert.equal(live.shoulderMuscleXrayLesson(bad, 'xray'), undefined,
      `${identity.id}:${path.join('.')} reordered`);
    refusedIdentities++;
  }
}

let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let malformed = 0, stale = 0, forgedSave = 0, forgedApproval = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  for (const tab of feature.contentTabs) {
    const previous = old.bodyLesson(structure, tab), lesson = feature.bodyLesson(structure, tab);
    if (wholeEpoch) assert.deepEqual(live.bodyLesson(structure, tab), lesson, `${structure.id}:${tab}: current epoch`);
    if (identities.has(structure.id) && tab === 'xray') {
      assert.equal(previous.readiness, 'pending');
      assert.equal(lesson.readiness, 'draft');
      assert.deepEqual(lesson, feature.shoulderMuscleXrayLesson(structure, tab));
      assert.deepEqual(live.shoulderMuscleXrayLesson(structure, tab), lesson);
      assert(lesson.citations.length > 0 && lesson.citations.every(url => /^https:\/\//.test(url)));
      assert.equal(new Set(lesson.citations).size, lesson.citations.length);
      const text = [lesson.body, ...lesson.bullets, lesson.note].join(' ');
      assert.match(text, /(?:plain (?:film|radiograph|x-ray)|radiograph)/i);
      assert.match(text, /(?:muscle|tendon)/i);
      assert.match(text, /(?:not|cannot|does not).*(?:show|resolve|assess|establish|confirm|prove|depict|visuali[sz]e)|(?:cannot|not) be (?:assessed|seen)/i,
        `${structure.id}: conditional plain-film visibility`);
      assert.doesNotMatch(text, /approved for clinical use|registered to a patient|normal muscle and tendon/i);
      const {readiness, ...content} = lesson;
      assert.deepEqual(feature.bodyContent(structure, tab), content);
      const copy = structuredClone(lesson);
      lesson.bullets.push('foreign'); lesson.citations.push('https://foreign.example');
      assert.deepEqual(live.shoulderMuscleXrayLesson(structure, tab), copy);
      changed++;
    } else {
      assert.deepEqual(lesson, previous, `${structure.id}:${tab}: untouched placement`);
      assert.equal(live.shoulderMuscleXrayLesson(structure, tab), undefined);
      preserved++;
    }
  }
  const previousPacket = await old.bodyReviewMaterial(structure.id);
  const packet = await feature.bodyReviewMaterial(structure.id);
  if (wholeEpoch && !working) assert.deepEqual(await live.bodyReviewMaterial(structure.id), packet);
  assert.equal(packet.approval, false);
  if (identities.has(structure.id)) {
    const currentPacket = await live.bodyReviewMaterial(structure.id);
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
    assert.deepEqual(await live.parseBodyReviewResponse(currentPacket, structure.id), currentPacket);
    assert.equal(await live.parseBodyReviewResponse(previousPacket, structure.id), null);
    for (const edit of [
      value => { value.topics.find(row => row.tab === 'xray').body += ' foreign'; },
      value => { value.topics.find(row => row.tab === 'xray').citations = ['https://foreign.example']; },
      value => { value.topics.find(row => row.tab === 'xray').readiness = 'approved'; },
      value => { value.source.structure.sources = []; },
    ]) {
      const forged = structuredClone(currentPacket); edit(forged);
      assert.equal(await live.parseBodyReviewResponse(forged, structure.id), null);
      malformed++;
    }
    const priorContext = await old.bodyReviewContext(structure.id);
    const context = await live.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash, priorContext.sourceHash);
    assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
    const decision = {catalogScope: context.catalogScope, structureId: structure.id,
      track: 'teaching', expectedVersion: 0, materialHash: priorContext.materialHash,
      revisionHash: priorContext.revisions.teaching, checklistVersion: context.checklistVersion,
      draft: live.blankBodyReview(context, 'teaching')};
    const request = value => new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_SHOULDER_MUSCLE_XRAY'}, body: JSON.stringify(value)});
    const db = {prepare() { storageCalls++; throw Error('Rejected decision reached storage'); }};
    assert.equal((await live.postBodyDecision(request(decision), db)).status, 409); stale++;
    const forged = structuredClone(decision);
    forged.materialHash = context.materialHash;
    forged.revisionHash = context.revisions.teaching;
    const foreignCheck = structuredClone(forged);
    foreignCheck.draft.checks.foreign = true;
    assert.equal((await live.postBodyDecision(request(foreignCheck), db)).status, 422); forgedSave++;
    forged.draft.status = 'approved';
    assert.equal((await live.postBodyDecision(request(forged), db)).status, 422); forgedApproval++;
    changedPackets++;
  } else {
    assert.deepEqual(packet, previousPacket, `${structure.id}: untouched Review packet`);
    preservedPackets++;
  }
}
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [16, 9920, 16, 1088]);
assert.deepEqual([malformed, stale, forgedSave, forgedApproval, storageCalls], [64, 16, 16, 16, 0]);
console.log(JSON.stringify({baseline, introduction, working, wholeEpoch, changed, preserved,
  changedPackets, preservedPackets, refusedIdentities, malformedPacketsRefused: malformed,
  staleRefusalsBeforeStorage: stale, forgedSaveRefusalsBeforeStorage: forgedSave,
  forgedApprovalRefusalsBeforeStorage: forgedApproval, storageCalls, clinicalApproval: false}));
