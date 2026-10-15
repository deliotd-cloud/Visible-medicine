import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const working = process.argv.length === 3 && process.argv[2] === '--working-transition';
assert(working || process.argv.length === 2, 'Only --working-transition is accepted');
const baseline = 'eb34afd7f1adc6a9655d3e4f238c9eb2c5288cf1';
const baselineTree = 'ee0cc791b247104f0d80b4ac8e82464b1c60aeef';
const helperPath = 'lib/girdle-muscle-xray.ts';
const contentPath = 'content/girdle-muscle-xray.ts';
const pinPath = 'content/shoulder-arm-muscle-imaging-pins.json';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
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
    assert.deepEqual(readFileSync(path), gitBytes(introduction, path), `${path}: immutable introduced teaching`);
}
for (const path of [pinPath, catalogPath])
  assert.deepEqual(readFileSync(path), gitBytes(baseline, path), `${path}: immutable baseline pin`);

const pins = JSON.parse(gitBytes(baseline, pinPath));
const rawCatalog = JSON.parse(gitBytes(baseline, catalogPath));
// Independently retained FMA/group/side/file/hash identities. Full records are
// cross-checked against the baseline catalog and subjected to nested mutations.
const expected = new Map([
  ['FMA37705', 'anconeus', 'right', 'FJ1485', '5c2e838a39547c4cdbb799cd5a54258d4ff76ab54b2859aecbfae2ba4588c5d4'],
  ['FMA37706', 'anconeus', 'left', 'FJ1485M', '4ca0901654d56656e4da354560abefb85bb958b3d786c148b5bb510fea106abf'],
  ['FMA37668', 'brachialis', 'right', 'FJ1486', 'be5f40b153fd6ce0c8c274eb4c26be8d1a29b4bbe75dd0e4a0dfe5c4d251fa03'],
  ['FMA37669', 'brachialis', 'left', 'FJ1486M', 'cedf106a4917deab99f86f077dde7d34d0672dbbb74f30652a4f81f75d7ef180'],
  ['FMA37665', 'coracobrachialis', 'right', 'FJ1488', '7eb9835056883a0e35954d39ff930c4c8c32d41db000e9f0d656e3c663401e56'],
  ['FMA37666', 'coracobrachialis', 'left', 'FJ1488M', '4004a378ca0d8be2924ce0b614fa19a4819804977e374e7cebcd5faa1cd7aa6b'],
  ['FMA32540', 'levator-scapulae', 'right', 'FJ1532', 'ee7897cbc5cde540e9cc29b03617d90f1b3caaebee4489f6590ee9c4632dcd42'],
  ['FMA32541', 'levator-scapulae', 'left', 'FJ1532M', 'cd98c83bc88a183c77b3eb10ce396f805843444d6f31053b1e3fb04f34647372'],
  ['FMA13381', 'rhomboid-major', 'right', 'FJ1536', '81b84d6d2e7c859004ee2d71f8fef2768ec422fbace3967d54e3f3b2965bdb89'],
  ['FMA13382', 'rhomboid-major', 'left', 'FJ1536M', '89601e72c95415990585118c08e0fb1b9c388f5bfa2b45ac1de116759f663701'],
  ['FMA13383', 'rhomboid-minor', 'right', 'FJ1537', 'acbd2dcd51879085bb2ec7d12b45c0ba2514ce3a2a1bb680bcf78732a1f688ff'],
  ['FMA13384', 'rhomboid-minor', 'left', 'FJ1537M', 'c1708ef88207aef30c32673af54b7c3b8cad2863a29a17f1f7a54859f96232a4'],
  ['FMA13398', 'serratus-anterior', 'right', 'FJ1459', '33f4ae8c7a84785e2bc5f4f21432d13de0805e485a29f3e6762bac6f85cb61d5'],
  ['FMA13399', 'serratus-anterior', 'left', 'FJ1459M', 'cb0e133829295b809e7dccc072318f335e34ccb3c33c80fbc68b8d6da327b7cb'],
  ['FMA32551', 'teres-major', 'right', 'FJ1507', '217aa2d39fdaa682998c8a1a1ffe9c8b37fed881edbbeb8ed5c633fa1541eaac'],
  ['FMA32552', 'teres-major', 'left', 'FJ1507M', '967a771f0d2e0950adfe251ac14b4878f9b12a3aacb16cbf472dac94db38519d'],
].map(([id, group, side, file, sha]) => [id, {group, side, file, sha}]));
assert.equal(expected.size, 16);
assert.equal(new Set([...expected.values()].map(row => row.group)).size, 8);
const selected = pins.entries.filter(entry => expected.has(entry.identity.fmaId));
assert.equal(selected.length, 16);
const identities = new Map();
for (const entry of selected) {
  const i = entry.identity, e = expected.get(i.fmaId);
  assert.equal(entry.group, e.group);
  assert.equal(i.id, `vm:anatomy:body:shoulder-arm:${e.side}:muscle:${e.side}-${e.group}`);
  assert.equal(i.laterality, e.side);
  assert.equal(i.region, 'shoulder-arm');
  assert.equal(i.system, 'muscles');
  assert.equal(i.category, 'muscle');
  assert.equal(i.bundle, 'shoulder-arm-muscles');
  assert.equal(i.nodeName, i.fmaId);
  assert.equal(i.sourceTree, 'isa');
  assert.deepEqual(i.sources, [{file: e.file, sha256: e.sha}]);
  assert.equal(i.validation.status, 'unvalidated');
  assert.equal(i.validation.anatomicalReview, false);
  const catalogRows = rawCatalog.structures.filter(row => row.fmaId === i.fmaId);
  assert.equal(catalogRows.length, 1);
  assert.deepEqual(catalogRows[0], i, `${i.fmaId}: baseline catalog source identity`);
  assert(!identities.has(i.id));
  identities.set(i.id, i);
}
assert.equal(identities.size, 16);
const trackedGlbs = git(['ls-tree', '-r', '--name-only', baseline])
  .toString().trim().split(/\r?\n/).filter(path => path.endsWith('.glb'));
assert.equal(trackedGlbs.length, 146);
for (const path of trackedGlbs)
  assert.deepEqual(readFileSync(path), gitBytes(baseline, path), `${path}: geometry bytes`);

const compiled = await build({stdin: {contents:
  "export {girdleMuscleXrayLesson} from './lib/girdle-muscle-xray';" +
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
const feature = working ? live : await exactSourceHistoryApi(introduction, 'girdle-muscle-xray-epoch');
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
  assert.equal(live.girdleMuscleXrayLesson(identity, 'xray').readiness, 'draft');
  for (const tab of feature.contentTabs.filter(tab => tab !== 'xray'))
    assert.equal(live.girdleMuscleXrayLesson(identity, tab), undefined);
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
    const key = path.at(-1), original = parent[key];
    parent[key] = typeof original === 'string' ? original + '-foreign'
      : typeof original === 'number' ? original + 0.01 : original === null ? 'foreign' : !original;
    assert.equal(live.girdleMuscleXrayLesson(bad, 'xray'), undefined, `${identity.id}:${path.join('.')}`);
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const bad = structuredClone(identity); at(bad, path).push('foreign');
    assert.equal(live.girdleMuscleXrayLesson(bad, 'xray'), undefined, `${identity.id}:${path.join('.')} extended`);
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const bad = structuredClone(identity); at(bad, path).unexpected = true;
    assert.equal(live.girdleMuscleXrayLesson(bad, 'xray'), undefined, `${identity.id}:${path.join('.') || '<root>'} extra`);
    refusedIdentities++;
    for (const key of Object.keys(at(identity, path))) {
      const omitted = structuredClone(identity); delete at(omitted, path)[key];
      assert.equal(live.girdleMuscleXrayLesson(omitted, 'xray'), undefined,
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
    assert.equal(live.girdleMuscleXrayLesson(bad, 'xray'), undefined,
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
      assert.deepEqual(lesson, feature.girdleMuscleXrayLesson(structure, tab));
      assert.deepEqual(live.girdleMuscleXrayLesson(structure, tab), lesson);
      assert(lesson.citations.length > 0 && lesson.citations.every(url => /^https:\/\//.test(url)));
      assert.equal(new Set(lesson.citations).size, lesson.citations.length);
      const copyText = [lesson.body, ...lesson.bullets, lesson.note].join(' ');
      assert.match(copyText, /(?:radiograph|plain film|x-ray)/i);
      assert.match(copyText, /(?:muscle|tendon)/i);
      assert.match(copyText, /(?:not|cannot|does not).*(?:show|resolve|assess|establish|confirm|prove|depict|visuali[sz]e)|(?:cannot|not) be (?:assessed|seen)/i,
        `${structure.id}: plain-film limitation`);
      assert.doesNotMatch(copyText, /approved for clinical use|registered to a patient|normal muscle and tendon/i);
      const {readiness, ...content} = lesson;
      assert.deepEqual(feature.bodyContent(structure, tab), content);
      const copy = structuredClone(lesson);
      lesson.bullets.push('foreign'); lesson.citations.push('https://foreign.example');
      assert.deepEqual(live.girdleMuscleXrayLesson(structure, tab), copy);
      changed++;
    } else {
      assert.deepEqual(lesson, previous, `${structure.id}:${tab}: untouched placement`);
      assert.equal(live.girdleMuscleXrayLesson(structure, tab), undefined);
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
        'oai-authenticated-user-id': 'SYNTHETIC_GIRDLE_MUSCLE_XRAY'}, body: JSON.stringify(value)});
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
