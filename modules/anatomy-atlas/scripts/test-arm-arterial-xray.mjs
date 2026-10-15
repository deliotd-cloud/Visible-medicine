import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { build } from './workspace-test-build.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const working = process.argv.length === 3 && process.argv[2] === '--working-transition';
assert(working || process.argv.length === 2, 'Only --working-transition is accepted');
const baseline = '89a22c1b71e1904dedb4f161398b07cec64d8624';
const helperPath = 'lib/arm-arterial-xray.ts';
const git = args => execFileSync('git', args, { windowsHide: true, maxBuffer: 32e6,
  env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' } });
const gitBytes = (commit, path) => git(['show', `${commit}:${path}`]);
assert.equal(git(['rev-parse', `${baseline}^{commit}`]).toString().trim(), baseline);
let introduction;
if (working) {
  assert.equal(git(['rev-parse', 'HEAD']).toString().trim(), baseline,
    'Working transition requires exact baseline HEAD');
  assert.equal(git(['ls-files', '--others', '--exclude-standard', '--', helperPath]).toString().trim(), helperPath,
    'Working helper must be untracked');
} else {
  introduction = git(['log', '--diff-filter=A', '--format=%H', '--', helperPath])
    .toString().trim().split(/\r?\n/).filter(Boolean).at(-1);
  assert.match(introduction ?? '', /^[a-f0-9]{40}$/, 'Immutable helper introduction commit');
  assert.equal(git(['merge-base', baseline, introduction]).toString().trim(), baseline);
  assert.equal(git(['merge-base', introduction, 'HEAD']).toString().trim(), introduction);
  for (const path of [helperPath, 'content/arm-arterial-xray.ts'])
    assert.deepEqual(readFileSync(path), gitBytes(introduction, path), `${path}: immutable introduced teaching`);
}

const pinPaths = ['content/shoulder-arm-artery-quiz-pins.json', 'content/elbow-arterial-ct-pins.json'];
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
for (const path of [...pinPaths, catalogPath])
  assert.deepEqual(readFileSync(path), gitBytes(baseline, path), `${path} unchanged`);
const pins = pinPaths.map(path => JSON.parse(readFileSync(path, 'utf8')));
// These expectations are fixed from the pinned source identities, not the lesson implementation.
const expected = new Map([
  ['FMA22655', ['axillary', 'right', 'right-axillary-artery', 'shoulder-arm-vessels-recovery', 'FJ2268']],
  ['FMA22656', ['axillary', 'left', 'left-axillary-artery', 'shoulder-arm-vessels-recovery', 'FJ2216']],
  ['FMA22691', ['brachial', 'right', 'right-brachial-artery', 'shoulder-arm-vessels-recovery', 'FJ2271']],
  ['FMA22692', ['brachial', 'left', 'left-brachial-artery', 'shoulder-arm-vessels-recovery', 'FJ2219']],
  ['FMA22696', ['deepBrachial', 'right', 'right-deep-brachial-artery', 'shoulder-arm-vessels-recovery', 'FJ2277']],
  ['FMA22697', ['deepBrachial', 'left', 'left-deep-brachial-artery', 'shoulder-arm-vessels-recovery', 'FJ2225']],
  ['FMA22707', ['superiorUlnarCollateral', 'right', 'right-superior-ulnar-collateral-artery', 'elbow-arteries', 'FJ2373']],
  ['FMA22708', ['superiorUlnarCollateral', 'left', 'left-superior-ulnar-collateral-artery', 'elbow-arteries', 'FJ2374']],
  ['FMA22712', ['inferiorUlnarCollateral', 'right', 'right-inferior-ulnar-collateral-artery', 'elbow-arteries', 'FJ2267']],
  ['FMA22713', ['inferiorUlnarCollateral', 'left', 'left-inferior-ulnar-collateral-artery', 'elbow-arteries', 'FJ2215']],
  ['FMA23126', ['radialCollateral', 'right', 'radial-collateral-branch-of-right-deep-brachial-artery', 'elbow-arteries', 'FJ2262']],
  ['FMA23127', ['radialCollateral', 'left', 'radial-collateral-branch-of-left-deep-brachial-artery', 'elbow-arteries', 'FJ2261']],
  ['FMA23124', ['middleCollateral', 'right', 'middle-collateral-branch-of-right-deep-brachial-artery', 'elbow-arteries', 'FJ2362']],
  ['FMA23125', ['middleCollateral', 'left', 'middle-collateral-branch-of-left-deep-brachial-artery', 'elbow-arteries', 'FJ2331']],
]);
const targets = pins.flatMap(pin => pin.entries.filter(entry => expected.has(entry.identity.fmaId)));
assert.equal(targets.length, 14);
const identities = new Map(targets.map(entry => [entry.identity.id, entry.identity]));
assert.equal(identities.size, 14, 'No duplicate identity');
assert.deepEqual(new Set(targets.map(entry => entry.identity.fmaId)), new Set(expected.keys()));
for (const { group, identity } of targets) {
  const [expectedGroup, side, slug, bundle, file] = expected.get(identity.fmaId);
  assert.equal(group, expectedGroup);
  assert.equal(identity.id, `vm:anatomy:body:shoulder-arm:${side}:vessel:${slug}`);
  assert.equal(identity.laterality, side);
  assert.equal(identity.region, 'shoulder-arm');
  assert.equal(identity.system, 'vessels');
  assert.equal(identity.category, 'vessel');
  assert.equal(identity.bundle, bundle);
  assert.equal(identity.nodeName, identity.fmaId);
  assert.equal(identity.sourceTree, 'isa');
  assert.deepEqual(identity.sources.map(source => source.file), [file]);
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
}
for (const pin of pins) for (const descriptor of pin.bundles ?? []) {
  if (!targets.some(({ identity }) => identity.bundle === descriptor.id)) continue;
  const path = 'public' + descriptor.url.split('?')[0];
  assert.deepEqual(readFileSync(path), gitBytes(baseline, path), `${descriptor.id} geometry unchanged`);
}

const compiled = await build({ stdin: { contents:
  "export {armArterialXrayLesson} from './lib/arm-arterial-xray';" +
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
  resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const live = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const old = await exactSourceHistoryApi(baseline, 'review-security');
const feature = working ? live : await exactSourceHistoryApi(introduction, 'review-security');
// Whole-catalog comparisons belong to the introduction epoch. Later features may
// legitimately change other lessons; live selected bindings and security still apply.
const wholeEpoch = working || git(['rev-parse', 'HEAD']).toString().trim() === introduction;
const rawCatalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const catalog = feature.bodyDisplayCatalog(rawCatalog);
assert.equal(catalog.structures.length, 1104);
assert.equal(catalog.structures.length * feature.contentTabs.length, 9936);
assert.deepEqual(catalog, old.bodyDisplayCatalog(JSON.parse(gitBytes(baseline, catalogPath))));
assert.deepEqual(feature.contentTabs, old.contentTabs);
assert.deepEqual(feature.structures, old.structures);
assert.deepEqual(feature.dissectionProfiles, old.dissectionProfiles);
assert.deepEqual(feature.regionalTours, old.regionalTours);
if (wholeEpoch) {
  assert.deepEqual(live.bodyDisplayCatalog(rawCatalog), catalog);
  assert.deepEqual(live.contentTabs, feature.contentTabs);
  assert.deepEqual(live.structures, feature.structures);
  assert.deepEqual(live.dissectionProfiles, feature.dissectionProfiles);
  assert.deepEqual(live.regionalTours, feature.regionalTours);
}
assert.deepEqual(catalog.structures.filter(s => identities.has(s.id)).sort((a, b) => a.id.localeCompare(b.id)),
  [...identities.values()].sort((a, b) => a.id.localeCompare(b.id)));

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
for (const identity of identities.values()) {
  assert.equal(live.armArterialXrayLesson(identity, 'xray').readiness, 'draft');
  for (const tab of feature.contentTabs.filter(tab => tab !== 'xray'))
    assert.equal(live.armArterialXrayLesson(identity, tab), undefined);
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
    const key = path.at(-1), original = parent[key];
    parent[key] = typeof original === 'string' ? original + '-foreign'
      : typeof original === 'number' ? original + 0.01 : original === null ? 'foreign' : !original;
    assert.equal(live.armArterialXrayLesson(bad, 'xray'), undefined, `${identity.id}:${path.join('.')}`);
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const bad = structuredClone(identity); at(bad, path).push('foreign');
    assert.equal(live.armArterialXrayLesson(bad, 'xray'), undefined, `${identity.id}:${path.join('.')}`);
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const bad = structuredClone(identity); at(bad, path).unexpected = true;
    assert.equal(live.armArterialXrayLesson(bad, 'xray'), undefined, `${identity.id}:${path.join('.') || '<root>'}`);
    refusedIdentities++;
    for (const key of Object.keys(at(identity, path))) {
      const omitted = structuredClone(identity); delete at(omitted, path)[key];
      assert.equal(live.armArterialXrayLesson(omitted, 'xray'), undefined,
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
    assert.equal(live.armArterialXrayLesson(bad, 'xray'), undefined,
      `${identity.id}:${path.join('.')} reordered`);
    refusedIdentities++;
  }
}

let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let malformed = 0, stale = 0, forgedSave = 0, forgedApproval = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  for (const tab of feature.contentTabs) {
    const previous = old.bodyLesson(structure, tab), lesson = feature.bodyLesson(structure, tab);
    if (wholeEpoch) assert.deepEqual(live.bodyLesson(structure, tab), lesson,
      `${structure.id}:${tab}: whole-current introduction epoch`);
    if (identities.has(structure.id) && tab === 'xray') {
      assert.equal(previous.readiness, 'pending');
      assert.equal(lesson.readiness, 'draft');
      assert.deepEqual(lesson, live.armArterialXrayLesson(structure, tab));
      assert.deepEqual(live.bodyLesson(structure, tab), lesson, `${structure.id}: current selected lesson`);
      assert(lesson.citations.length > 0 && lesson.citations.every(url => /^https:\/\//.test(url)));
      assert.equal(new Set(lesson.citations).size, lesson.citations.length);
      const text = [lesson.body, ...lesson.bullets, lesson.note].join(' ');
      for (const term of [/catheter/i, /(?:digital subtraction|DSA)/i,
        /(?:unenhanced|plain) (?:radiograph|x-ray)/i, /CTA/i, /MRA/i, /ultrasound/i,
        /(?:side marker|laterality).*(?:acquired|image)|(?:acquired|image).*(?:side marker|laterality)/i,
        /reassembl/i, /registration/i,
        /(?:no|not).*(?:acquired angiogram|lumen|patency|flow|perfusion|procedure)/i,
        /radiologist/i, /(?:independent|separate).*(?:access|case|Atlas|lecture)|(?:access|case|Atlas|lecture).*(?:independent|separate)/i])
        assert.match(text, term, `${structure.id}: safety term ${term}`);
      assert.doesNotMatch(text, /approved for clinical use|registered to a patient/i);
      const { readiness, ...content } = lesson;
      assert.deepEqual(feature.bodyContent(structure, tab), content);
      const copy = structuredClone(lesson);
      lesson.bullets.push('foreign'); lesson.citations.push('https://foreign.example');
      assert.deepEqual(live.armArterialXrayLesson(structure, tab), copy);
      changed++;
    } else {
      assert.deepEqual(lesson, previous, `${structure.id}:${tab}`);
      assert.equal(live.armArterialXrayLesson(structure, tab), undefined);
      preserved++;
    }
  }
  const previousPacket = await old.bodyReviewMaterial(structure.id);
  const packet = await feature.bodyReviewMaterial(structure.id);
  if (wholeEpoch && !working) assert.deepEqual(await live.bodyReviewMaterial(structure.id), packet,
    `${structure.id}: whole-current Review epoch`);
  assert.equal(packet.approval, false);
  if (identities.has(structure.id)) {
    const currentPacket = await live.bodyReviewMaterial(structure.id);
    const context = await live.bodyReviewContext(structure.id);
    const featureContext = await feature.bodyReviewContext(structure.id);
    const stable = ({rendererHash, revisions: {geometry, ...revisions}, ...rest}) => ({...rest, revisions});
    assert.deepEqual(stable(context), stable(featureContext), `${structure.id}: selected context retained`);
    for (const key of ['source', 'topics', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits', 'fingerprints', 'materialHash'])
      assert.deepEqual(currentPacket[key], packet[key], `${structure.id}: current ${key} retained`);
    assert.equal(currentPacket.approval, false);
    assert.deepEqual(currentPacket.topics.find(row => row.tab === 'xray'),
      { tab: 'xray', ...live.armArterialXrayLesson(structure, 'xray') });
    assert.equal(context.rendererHash,
      JSON.parse(readFileSync('content/body-renderer-revision.json', 'utf8')).sha256);
    const geometryInput = { catalogScope: context.catalogScope, structureId: structure.id,
      checklistVersion: context.checklistVersion, source: context.sourceHash,
      renderer: context.rendererHash, checks: context.checklists.geometry };
    assert.equal(context.revisions.geometry,
      createHash('sha256').update(JSON.stringify(geometryInput)).digest('hex'));
    assert.deepEqual(packet.topics.filter(row => row.tab !== 'xray'),
      previousPacket.topics.filter(row => row.tab !== 'xray'));
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], previousPacket[key], `${structure.id}:${key}`);
    assert.equal(packet.fingerprints.source, previousPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, previousPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, previousPacket.materialHash);
    assert.deepEqual(packet.topics.find(row => row.tab === 'xray'),
      { tab: 'xray', ...feature.bodyLesson(structure, 'xray') });
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
    assert.equal(context.sourceHash, priorContext.sourceHash);
    assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
    const decision = { catalogScope: context.catalogScope, structureId: structure.id,
      track: 'teaching', expectedVersion: 0, materialHash: priorContext.materialHash,
      revisionHash: priorContext.revisions.teaching, checklistVersion: context.checklistVersion,
      draft: live.blankBodyReview(context, 'teaching') };
    const request = value => new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: { origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_ARM_ARTERIAL_XRAY' }, body: JSON.stringify(value) });
    const db = { prepare() { storageCalls++; throw Error('Rejected decision reached storage'); } };
    assert.equal((await live.postBodyDecision(request(decision), db)).status, 409);
    stale++;
    const forged = structuredClone(decision);
    forged.materialHash = context.materialHash;
    forged.revisionHash = context.revisions.teaching;
    const foreignCheck = structuredClone(forged);
    foreignCheck.draft.checks.foreign = true;
    assert.equal((await live.postBodyDecision(request(foreignCheck), db)).status, 422);
    forgedSave++;
    forged.draft.status = 'approved';
    assert.equal((await live.postBodyDecision(request(forged), db)).status, 422);
    forgedApproval++; changedPackets++;
  } else {
    assert.deepEqual(packet, previousPacket, `${structure.id}: Review packet`);
    preservedPackets++;
  }
}
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [14, 9922, 14, 1090]);
assert.deepEqual([malformed, stale, forgedSave, forgedApproval, storageCalls], [56, 14, 14, 14, 0]);
console.log(JSON.stringify({ baseline, introduction, working, wholeEpoch, changed, preserved,
  changedPackets, preservedPackets, refusedIdentities, malformedPacketsRefused: malformed,
  staleRefusalsBeforeStorage: stale, forgedSaveRefusalsBeforeStorage: forgedSave,
  forgedApprovalRefusalsBeforeStorage: forgedApproval, storageCalls, clinicalApproval: false }));
