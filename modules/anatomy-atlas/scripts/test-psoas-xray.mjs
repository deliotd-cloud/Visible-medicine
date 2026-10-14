import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = '2fd700948dfa10ec6b5a03c4ed4c6ff9443c387e';
const gitBytes = path => execFileSync('git', ['show', `${baseline}:${path}`],
  {windowsHide: true, maxBuffer: 32e6});
const pinsPath = 'content/hip-imaging-pins.json';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
assert.deepEqual(readFileSync(pinsPath), gitBytes(pinsPath), 'Reuse original hip source pins');
assert.deepEqual(readFileSync(catalogPath), gitBytes(catalogPath), 'Do not change source catalogue');
const pins = JSON.parse(readFileSync(pinsPath, 'utf8'));
const expectedIds = new Map([
  ['FMA22342', 'right'], ['FMA22343', 'left'],
]);
const entries = pins.entries.filter(e => expectedIds.has(e.identity?.fmaId));
assert.equal(entries.length, 2);
const identities = new Map(entries.map(e => [e.identity.id, e.identity]));
assert.equal(identities.size, 2);
for (const {identity, group} of entries) {
  assert.equal(group, 'iliopsoas');
  assert.equal(identity.name, `${expectedIds.get(identity.fmaId) === 'right' ? 'Right' : 'Left'} psoas major`);
  assert.equal(identity.laterality, expectedIds.get(identity.fmaId));
  assert.equal(identity.region, 'spine');
  assert.equal(identity.system, 'muscles');
  assert.equal(identity.category, 'muscle');
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
}
for (const bundle of new Set(entries.map(e => e.identity.bundle))) {
  const descriptor = pins.bundles.find(b => b.id === bundle);
  assert(descriptor, `Existing bundle: ${bundle}`);
  const path = 'public' + descriptor.url.split('?')[0];
  assert.deepEqual(readFileSync(path), gitBytes(path), `${bundle} geometry unchanged`);
}

const compiled = await build({
  stdin: {contents:
    "export {psoasXrayLesson} from './lib/psoas-xray';" +
    "export * from './content/psoas-xray';" +
    "export {bodyLesson,bodyContent} from './app/body-content';" +
    "export {bodyDisplayCatalog} from './lib/body-display-catalog';" +
    "export {contentTabs} from './lib/content-types';" +
    "export {regionalTours} from './lib/regional-tours';" +
    "export {structures} from './app/anatomy-data';" +
    "export {dissectionProfiles} from './app/dissection-data';" +
    "export * from './lib/body-review-material';" +
    "export * from './lib/body-review-context';" +
    "export * from './lib/body-review-response';" +
    "export * from './lib/body-review-api';" +
    "export * from './lib/body-review-decisions';",
    resolveDir: process.cwd(), loader: 'ts'},
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const live = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const old = await exactSourceHistoryApi(baseline, 'review-security');
const rawCatalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const catalog = live.bodyDisplayCatalog(rawCatalog);
assert.deepEqual(catalog, old.bodyDisplayCatalog(JSON.parse(gitBytes(catalogPath))));
assert.deepEqual(live.contentTabs, old.contentTabs);
assert.deepEqual(live.regionalTours, old.regionalTours);
assert.deepEqual(live.structures, old.structures);
assert.deepEqual(live.dissectionProfiles, old.dissectionProfiles);
assert.equal(catalog.structures.length * live.contentTabs.length, 9936);
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
  assert.equal(live.psoasXrayLesson(identity, 'xray').readiness, 'draft');
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
    const key = path.at(-1), original = parent[key];
    parent[key] = typeof original === 'string' ? original + '-foreign'
      : typeof original === 'number' ? original + 0.01
        : original === null ? 'foreign' : !original;
    assert.equal(live.psoasXrayLesson(bad, 'xray'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const bad = structuredClone(identity); at(bad, path).push('foreign');
    assert.equal(live.psoasXrayLesson(bad, 'xray'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const bad = structuredClone(identity); at(bad, path).unexpected = true;
    assert.equal(live.psoasXrayLesson(bad, 'xray'), undefined, path.join('.') || '<root>');
    refusedIdentities++;
  }
}

let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let stale = 0, forgedDecisions = 0, malformed = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  for (const tab of live.contentTabs) {
    const previous = old.bodyLesson(structure, tab), lesson = live.bodyLesson(structure, tab);
    if (identities.has(structure.id) && tab === 'xray') {
      assert.equal(previous.readiness, 'pending');
      assert.equal(lesson.readiness, 'draft');
      assert.deepEqual(lesson, live.psoasXrayLesson(structure, tab));
      const prose = [lesson.title, lesson.body, ...lesson.bullets, lesson.note].join(' ');
      assert.match(prose, /plain.{0,30}(abdominal )?radiograph|x[- ]ray/i);
      assert.match(prose, /psoas/i);
      assert.match(prose, /fat/i);
      assert.match(prose, /projection/i);
      assert.match(prose, /normal nonvisuali[sz]ation/i);
      assert.match(prose, /missing margin alone does not establish/i);
      assert.match(prose, /preserved margin does not exclude/i);
      assert.match(prose, /cannot distinguish.{0,100}normal variation/i);
      assert.match(lesson.note, /review pending for this exact source and teaching revision/i);
      assert.match(lesson.note, /No imaging study loaded, patient registration or diagnostic decision is supplied/i);
      assert.match(lesson.note, /Atlas, imaging-case and paid-lecture access remain independent/i);
      assert.doesNotMatch(prose, /approved for clinical use|diagnostic threshold is|registered to (?:a )?patient/i);
      const {readiness, ...content} = lesson;
      assert.deepEqual(live.bodyContent(structure, tab), content);
      const copy = structuredClone(lesson);
      lesson.bullets.push('foreign'); lesson.citations.push('https://foreign.example');
      assert.deepEqual(live.psoasXrayLesson(structure, tab), copy, 'Lesson must be detached');
      for (const other of live.contentTabs) if (other !== 'xray')
        assert.equal(live.psoasXrayLesson(structure, other), undefined);
      changed++;
    } else {
      assert.deepEqual(lesson, previous, `${structure.id}:${tab}`);
      preserved++;
      assert.equal(live.psoasXrayLesson(structure, tab), undefined, 'No modality or identity leakage');
    }
  }
  const previousPacket = await old.bodyReviewMaterial(structure.id);
  const packet = await live.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval, false);
  if (identities.has(structure.id)) {
    assert.deepEqual(packet.topics.filter(row => row.tab !== 'xray'),
      previousPacket.topics.filter(row => row.tab !== 'xray'));
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], previousPacket[key], `${structure.id}:${key}`);
    assert.equal(packet.fingerprints.source, previousPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, previousPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, previousPacket.materialHash);
    assert.deepEqual(packet.topics.find(row => row.tab === 'xray'),
      {tab: 'xray', ...live.bodyLesson(structure, 'xray')});
    assert.deepEqual(await live.parseBodyReviewResponse(packet, structure.id), packet);
    assert.equal(await live.parseBodyReviewResponse(previousPacket, structure.id), null);
    const forged = structuredClone(packet);
    forged.topics.find(row => row.tab === 'xray').body += ' foreign';
    assert.equal(await live.parseBodyReviewResponse(forged, structure.id), null);
    malformed++;
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
      method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_PSOAS_XRAY'}, body: JSON.stringify(value),
    });
    const db = {prepare() { storageCalls++; throw Error('Rejected decision reached storage'); }};
    assert.equal((await live.postBodyDecision(request(decision), db)).status, 409);
    const forgedDecision = structuredClone(decision);
    forgedDecision.materialHash = context.materialHash;
    forgedDecision.revisionHash = context.revisions.teaching;
    forgedDecision.draft.status = 'approved';
    assert.equal((await live.postBodyDecision(request(forgedDecision), db)).status, 422);
    stale++; forgedDecisions++; changedPackets++;
  } else {
    assert.deepEqual(packet, previousPacket, `${structure.id}: Review packet`);
    preservedPackets++;
  }
}
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [2, 9934, 2, 1102]);
assert.equal(storageCalls, 0);
console.log(JSON.stringify({baseline, changed, preserved, changedPackets, preservedPackets,
  refusedIdentities, malformedPacketsRefused: malformed,
  staleRefusalsBeforeStorage: stale, forgedApprovalRefusalsBeforeStorage: forgedDecisions,
  storageCalls, clinicalApproval: false}));
