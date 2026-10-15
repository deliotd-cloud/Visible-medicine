import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { build } from './workspace-test-build.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

const workingTransition = process.argv.length === 3 && process.argv[2] === '--working-transition';
assert(workingTransition || process.argv.length === 2, 'Only --working-transition is accepted');
const baseline = 'af90b4afc38d4f18e0ab1d9ac9ef16277761b355';
const helperPath = 'lib/pelvic-tributary-xray.ts';
const git = args => execFileSync('git', args, {
  windowsHide: true, maxBuffer: 32e6, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});
const gitBytes = path => execFileSync('git', ['show', `${baseline}:${path}`], {
  windowsHide: true, maxBuffer: 32e6, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});
assert.equal(git(['rev-parse', `${baseline}^{commit}`]).toString().trim(), baseline);
let featureCommit;
if (workingTransition) {
  assert.equal(git(['rev-parse', 'HEAD']).toString().trim(), baseline,
    'Working transition requires exact baseline HEAD');
  assert.equal(git(['ls-files', '--others', '--exclude-standard', '--', helperPath])
    .toString().trim(), helperPath, 'Working helper must be untracked');
} else {
  featureCommit = git(['log', '--diff-filter=A', '--format=%H', '--', helperPath])
    .toString().trim().split(/\r?\n/).filter(Boolean).at(-1);
  assert.match(featureCommit ?? '', /^[a-f0-9]{40}$/, 'Immutable helper introduction commit');
  assert.equal(git(['rev-parse', `${featureCommit}^{commit}`]).toString().trim(), featureCommit);
  assert.equal(git(['merge-base', featureCommit, 'HEAD']).toString().trim(), featureCommit);
  assert.equal(git(['merge-base', baseline, featureCommit]).toString().trim(), baseline);
  assert.deepEqual(readFileSync(helperPath), git(['show', `${featureCommit}:${helperPath}`]),
    'Current helper bytes match immutable introduction');
}
const pinsPath = 'content/pelvic-venous-tour-pins.json';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
assert.deepEqual(readFileSync(pinsPath), gitBytes(pinsPath), 'Source pins unchanged');
assert.deepEqual(readFileSync(catalogPath), gitBytes(catalogPath), 'Source catalogue unchanged');
const pins = JSON.parse(readFileSync(pinsPath, 'utf8'));
const expected = new Map([
  ['FMA18904', ['left', 'iliolumbar', 'FJ3510']], ['FMA18913', ['left', 'inferior-gluteal', 'FJ3513']],
  ['FMA18916', ['left', 'obturator', 'FJ3527']], ['FMA18910', ['left', 'superior-gluteal', 'FJ3531']],
  ['FMA18903', ['right', 'iliolumbar', 'FJ3603']], ['FMA18912', ['right', 'inferior-gluteal', 'FJ3606']],
  ['FMA18918', ['right', 'internal-pudendal', 'FJ3610']], ['FMA18906', ['right', 'lateral-sacral', 'FJ3611']],
  ['FMA18915', ['right', 'obturator', 'FJ3612']], ['FMA18909', ['right', 'superior-gluteal', 'FJ3616']],
]);
const entries = pins.entries.filter(e => expected.has(e.fmaId));
assert.equal(entries.length, 10);
const identities = new Map(entries.map(identity => [identity.id, identity]));
assert.equal(identities.size, 10);
for (const identity of entries) {
  const [side, slug, file] = expected.get(identity.fmaId);
  assert.equal(identity.id, `vm:anatomy:body:pelvis:${side}:vessel:${side}-${slug}-vein`);
  assert.equal(identity.laterality, side);
  assert.equal(identity.region, 'pelvis');
  assert.equal(identity.system, 'vessels');
  assert.equal(identity.category, 'vessel');
  assert.equal(identity.sourceTree, 'isa');
  assert.deepEqual(identity.sources.map(s => s.file), [file]);
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
}
for (const bundle of new Set(entries.map(e => e.bundle))) {
  const descriptor = pins.bundles.find(b => b.id === bundle);
  assert(descriptor, `Existing bundle: ${bundle}`);
  const path = 'public' + descriptor.url.split('?')[0];
  assert.deepEqual(readFileSync(path), gitBytes(path), `${bundle} geometry unchanged`);
}

const compiled = await build({
  stdin: { contents:
    "export {pelvicTributaryXrayLesson} from './lib/pelvic-tributary-xray';" +
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
    resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const live = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const old = await exactSourceHistoryApi(baseline, 'review-security');
const feature = workingTransition ? live : await exactSourceHistoryApi(featureCommit, 'review-security');
// Whole-current equality is meaningful only at this introduction epoch. Later
// legitimate additions keep the immutable original transition, plus current
// target/security checks, rather than repinning history or rejecting new work.
const currentWholeEpoch = workingTransition || git(['rev-parse', 'HEAD']).toString().trim() === featureCommit;
const catalog = live.bodyDisplayCatalog(JSON.parse(readFileSync(catalogPath, 'utf8')));
assert(!catalog.structures.some(s => ['FMA18919', 'FMA18907'].includes(s.fmaId)), 'Held counterparts are not admitted');
assert.equal(catalog.structures.length, 1104);
assert.equal(catalog.structures.length * live.contentTabs.length, 9936);
assert.deepEqual(catalog, old.bodyDisplayCatalog(JSON.parse(gitBytes(catalogPath))));
assert.deepEqual(catalog, feature.bodyDisplayCatalog(JSON.parse(readFileSync(catalogPath, 'utf8'))));
assert.deepEqual(live.contentTabs, feature.contentTabs);
assert.deepEqual(live.contentTabs, old.contentTabs);
assert.deepEqual(live.structures, old.structures);
assert.deepEqual(live.dissectionProfiles, old.dissectionProfiles);
assert.deepEqual(live.regionalTours, old.regionalTours);
assert.deepEqual(catalog.structures.filter(s => identities.has(s.id))
  .sort((a, b) => a.id.localeCompare(b.id)),
  [...identities.values()].sort((a, b) => a.id.localeCompare(b.id)));

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
for (const identity of identities.values()) {
  assert.equal(live.pelvicTributaryXrayLesson(identity, 'xray').readiness, 'draft');
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
    const key = path.at(-1), original = parent[key];
    parent[key] = typeof original === 'string' ? original + '-foreign'
      : typeof original === 'number' ? original + 0.01 : original === null ? 'foreign' : !original;
    assert.equal(live.pelvicTributaryXrayLesson(bad, 'xray'), undefined, `${identity.id}:${path.join('.')}`);
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const bad = structuredClone(identity); at(bad, path).push('foreign');
    assert.equal(live.pelvicTributaryXrayLesson(bad, 'xray'), undefined, `${identity.id}:${path.join('.')}`);
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const bad = structuredClone(identity); at(bad, path).unexpected = true;
    assert.equal(live.pelvicTributaryXrayLesson(bad, 'xray'), undefined, `${identity.id}:${path.join('.') || '<root>'}`);
    refusedIdentities++;
    for (const key of Object.keys(at(identity, path))) {
      const omitted = structuredClone(identity); delete at(omitted, path)[key];
      assert.equal(live.pelvicTributaryXrayLesson(omitted, 'xray'), undefined,
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
    assert.equal(live.pelvicTributaryXrayLesson(bad, 'xray'), undefined,
      `${identity.id}:${path.join('.')} reordered`);
    refusedIdentities++;
  }
}

let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let malformed = 0, stale = 0, forgedSave = 0, forgedApproval = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  for (const tab of live.contentTabs) {
    const previous = old.bodyLesson(structure, tab), lesson = feature.bodyLesson(structure, tab);
    if (currentWholeEpoch) assert.deepEqual(live.bodyLesson(structure, tab), lesson,
      `${structure.id}:${tab}: whole-current introduction epoch`);
    if (identities.has(structure.id))
      assert.deepEqual(live.bodyLesson(structure, tab), lesson,
        `${structure.id}:${tab}: current pelvic-tributary target retained`);
    if (identities.has(structure.id) && tab === 'xray') {
      assert.equal(previous.readiness, 'pending');
      assert.equal(lesson.readiness, 'draft');
      assert.deepEqual(lesson, live.pelvicTributaryXrayLesson(structure, tab));
      assert(lesson.citations.length > 0 && lesson.citations.every(url => /^https:\/\//.test(url)));
      assert.equal(new Set(lesson.citations).size, lesson.citations.length);
      const text = [lesson.body, ...lesson.bullets, lesson.note].join(' ');
      assert.match(text, /contrast X-ray venography/);
      assert.match(text, /routine plain pelvic radiograph/);
      assert.match(text, /CT venography \(CTV\), MR venography \(MRV\).*IVUS/);
      assert.match(text, /actual examination side and projection/);
      assert.match(text, /projected crossing does not establish a venous junction/);
      assert.match(text, /No acquired venogram, complete connected lumen/);
      assert.match(text, /exact source and teaching revision/);
      assert.match(text, /Atlas, imaging-case and paid-lecture access remain independent/);
      if (/superior-gluteal/.test(structure.id)) assert.match(text, /short supplied superior gluteal surface/);
      if (/internal-pudendal|lateral-sacral/.test(structure.id)) assert.match(text, /left-labelled candidate remains held/);
      assert.doesNotMatch(text, /approved for clinical use|registered to a patient/i);
      const { readiness, ...content } = lesson;
      assert.deepEqual(live.bodyContent(structure, tab), content);
      const copy = structuredClone(lesson);
      lesson.bullets.push('foreign'); lesson.citations.push('https://foreign.example');
      assert.deepEqual(live.pelvicTributaryXrayLesson(structure, tab), copy);
      changed++;
    } else {
      assert.deepEqual(lesson, previous, `${structure.id}:${tab}`);
      assert.equal(live.pelvicTributaryXrayLesson(structure, tab), undefined);
      preserved++;
    }
  }
  const previousPacket = await old.bodyReviewMaterial(structure.id);
  const packet = await feature.bodyReviewMaterial(structure.id);
  if (currentWholeEpoch && !workingTransition) assert.deepEqual(await live.bodyReviewMaterial(structure.id), packet,
    `${structure.id}: whole-current introduction Review epoch`);
  assert.equal(packet.approval, false);
  if (identities.has(structure.id)) {
    assert.deepEqual(await live.bodyReviewMaterial(structure.id), packet,
      `${structure.id}: current Review material matches feature epoch`);
    const liveContext = await live.bodyReviewContext(structure.id);
    const featureContext = await feature.bodyReviewContext(structure.id);
    const stableContext = ({ rendererHash, revisions: { geometry, ...revisions }, ...rest }) =>
      ({ ...rest, revisions });
    assert.deepEqual(stableContext(liveContext), stableContext(featureContext),
      `${structure.id}: current source/teaching context retained`);
    assert.equal(liveContext.rendererHash,
      JSON.parse(readFileSync('content/body-renderer-revision.json', 'utf8')).sha256);
    const geometryInput = { catalogScope: liveContext.catalogScope,
      structureId: structure.id, checklistVersion: liveContext.checklistVersion,
      source: liveContext.sourceHash, renderer: liveContext.rendererHash,
      checks: liveContext.checklists.geometry };
    assert.equal(liveContext.revisions.geometry,
      createHash('sha256').update(JSON.stringify(geometryInput)).digest('hex'));
    assert.deepEqual(packet.topics.filter(row => row.tab !== 'xray'),
      previousPacket.topics.filter(row => row.tab !== 'xray'));
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], previousPacket[key], `${structure.id}:${key}`);
    assert.equal(packet.fingerprints.source, previousPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, previousPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, previousPacket.materialHash);
    assert.deepEqual(packet.topics.find(row => row.tab === 'xray'),
      { tab: 'xray', ...live.bodyLesson(structure, 'xray') });
    assert.deepEqual(await live.parseBodyReviewResponse(packet, structure.id), packet);
    assert.equal(await live.parseBodyReviewResponse(previousPacket, structure.id), null);
    for (const edit of [
      value => { value.topics.find(row => row.tab === 'xray').body += ' foreign'; },
      value => { value.topics.find(row => row.tab === 'xray').citations = ['https://foreign.example']; },
      value => { value.topics.find(row => row.tab === 'xray').readiness = 'approved'; },
      value => { value.source.structure.sources = []; },
    ]) {
      const forged = structuredClone(packet); edit(forged);
      assert.equal(await live.parseBodyReviewResponse(forged, structure.id), null);
      malformed++;
    }
    const priorContext = await old.bodyReviewContext(structure.id);
    const context = await live.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash, priorContext.sourceHash);
    assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
    const decision = {
      catalogScope: context.catalogScope, structureId: structure.id, track: 'teaching',
      expectedVersion: 0, materialHash: priorContext.materialHash,
      revisionHash: priorContext.revisions.teaching, checklistVersion: context.checklistVersion,
      draft: live.blankBodyReview(context, 'teaching'),
    };
    const request = value => new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: { origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_PELVIC_TRIBUTARY_XRAY' }, body: JSON.stringify(value),
    });
    const db = { prepare() { storageCalls++; throw Error('Rejected decision reached storage'); } };
    assert.equal((await live.postBodyDecision(request(decision), db)).status, 409);
    const forged = structuredClone(decision);
    forged.materialHash = context.materialHash;
    forged.revisionHash = context.revisions.teaching;
    const foreignCheck = structuredClone(forged);
    foreignCheck.draft.checks.foreign = true;
    assert.equal((await live.postBodyDecision(request(foreignCheck), db)).status, 422);
    forgedSave++;
    forged.draft.status = 'approved';
    assert.equal((await live.postBodyDecision(request(forged), db)).status, 422);
    stale++; forgedApproval++; changedPackets++;
  } else {
    assert.deepEqual(packet, previousPacket, `${structure.id}: Review packet`);
    preservedPackets++;
  }
}
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [10, 9926, 10, 1094]);
assert.equal(malformed, 40);
assert.equal(storageCalls, 0);
console.log(JSON.stringify({ baseline, featureCommit, originalTransitionEpochPinned: !workingTransition, workingTransition,
  currentWholeEpochPreserved: currentWholeEpoch,
  currentTargetsRetained: 10, currentTargetTopicPlacementsRetained: 90,
  currentReviewPacketsRetained: 10, changed, preserved, changedPackets, preservedPackets,
  refusedIdentities, malformedPacketsRefused: malformed,
  staleRefusalsBeforeStorage: stale, forgedSaveRefusalsBeforeStorage: forgedSave,
  forgedApprovalRefusalsBeforeStorage: forgedApproval,
  storageCalls, clinicalApproval: false }));

