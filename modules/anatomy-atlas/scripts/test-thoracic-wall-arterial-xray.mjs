import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = 'c0025a9e33cde8e8936c4ba13f8145d5f0bb9364';
const expected = new Map([
  ['right-internal-thoracic-artery', 'FMA3969'],
  ['left-internal-thoracic-artery', 'FMA4068'],
  ['right-musculophrenic-artery', 'FMA10692'],
  ['left-musculophrenic-artery', 'FMA4077'],
  ['right-superior-epigastric-artery', 'FMA3988'],
  ['left-superior-epigastric-artery', 'FMA4083'],
]);
const pinsPath = 'content/thoracic-branch-imaging-pins.json';
const gitBytes = path => execFileSync('git', ['show', `${baseline}:${path}`],
  {windowsHide: true, maxBuffer: 32e6});
assert.deepEqual(readFileSync(pinsPath), gitBytes(pinsPath), 'Reuse unchanged thoracic branch pins');
const pins = JSON.parse(readFileSync(pinsPath, 'utf8'));
const entries = pins.entries.filter(e => expected.has(e.group));
assert.equal(entries.length, 6);
assert.deepEqual(new Map(entries.map(e => [e.group, e.identity.fmaId])), expected);
const identities = new Map(entries.map(e => [e.identity.id, e.identity]));
assert.equal(identities.size, 6);
for (const {identity, group} of entries) {
  assert.equal(identity.region, 'thorax');
  assert.equal(identity.system, 'vessels');
  assert.equal(identity.category, 'vessel');
  assert.equal(identity.laterality, group.split('-')[0]);
  assert.equal(identity.bundle, 'thorax-vessels-inventory');
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
}

const compiled = await build({
  stdin: {contents:
    "export {thoracicWallArterialXrayLesson} from './lib/thoracic-wall-arterial-xray';" +
    "export {thoracicWallArterialXrayTopics} from './content/thoracic-wall-arterial-xray';" +
    "export {bodyLesson,bodyContent} from './app/body-content';" +
    "export {bodyDisplayCatalog} from './lib/body-display-catalog';" +
    "export {contentTabs} from './lib/content-types';" +
    "export * from './lib/body-review-material';" +
    "export * from './lib/body-review-context';" +
    "export * from './lib/body-review-response';" +
    "export * from './lib/body-review-api';" +
    "export * from './lib/body-review-decisions';",
    resolveDir: process.cwd(), loader: 'ts'},
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const current = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const old = await exactSourceHistoryApi(baseline, 'review-security');
const topicKeys = ['internal-thoracic-artery', 'musculophrenic-artery',
  'superior-epigastric-artery'];
assert.deepEqual(Object.keys(current.thoracicWallArterialXrayTopics).sort(), topicKeys.sort());
for (const topic of Object.values(current.thoracicWallArterialXrayTopics)) {
  assert(topic.title && topic.body && topic.bullets.length >= 2);
  assert(topic.bullets.every(b => typeof b === 'string' && b.trim()));
  assert(topic.citations.length > 0);
  assert(topic.citations.every(url => /^https:\/\//.test(url)));
  assert.equal(new Set(topic.citations).size, topic.citations.length);
}

const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const catalog = current.bodyDisplayCatalog(JSON.parse(readFileSync(catalogPath, 'utf8')));
assert.deepEqual(catalog, old.bodyDisplayCatalog(JSON.parse(gitBytes(catalogPath))));
assert.equal(catalog.structures.length * current.contentTabs.length, 9936);
assert.deepEqual(catalog.structures.filter(s => identities.has(s.id)),
  entries.map(e => e.identity));

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
for (const identity of identities.values()) {
  assert.equal(current.thoracicWallArterialXrayLesson(identity, 'xray').readiness, 'draft');
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
    const key = path.at(-1), original = parent[key];
    parent[key] = typeof original === 'string' ? original + '-foreign'
      : typeof original === 'number' ? original + 0.01
        : original === null ? 'foreign' : !original;
    assert.equal(current.thoracicWallArterialXrayLesson(bad, 'xray'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const bad = structuredClone(identity); at(bad, path).push('foreign');
    assert.equal(current.thoracicWallArterialXrayLesson(bad, 'xray'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const bad = structuredClone(identity); at(bad, path).unexpected = true;
    assert.equal(current.thoracicWallArterialXrayLesson(bad, 'xray'), undefined, path.join('.') || '<root>');
    refusedIdentities++;
  }
}

let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let stale = 0, forgedDecisions = 0, malformed = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  for (const tab of current.contentTabs) {
    const previous = old.bodyLesson(structure, tab), lesson = current.bodyLesson(structure, tab);
    if (identities.has(structure.id) && tab === 'xray') {
      assert.equal(previous.readiness, 'pending');
      assert.equal(lesson.readiness, 'draft');
      assert.deepEqual(lesson, current.thoracicWallArterialXrayLesson(structure, tab));
      const group = entries.find(e => e.identity.id === structure.id).group;
      const topic = current.thoracicWallArterialXrayTopics[group.replace(/^(left|right)-/, '')];
      assert.equal(lesson.body, topic.body);
      for (const bullet of topic.bullets) assert(lesson.bullets.includes(bullet));
      const prose = [lesson.title, lesson.body, ...lesson.bullets, lesson.note].join(' ');
      assert.match(prose, /contrast.{0,30}x-ray|x-ray.{0,30}contrast|digital subtraction angiography|\bDSA\b/i);
      assert.match(prose, /plain.{0,30}(chest )?radiograph|ordinary.{0,30}(chest )?radiograph/i);
      assert.match(prose, /CT angiography|\bCTA\b/i);
      assert.match(prose, /MR angiography|\bMRA\b/i);
      if (group.endsWith('internal-thoracic-artery'))
        assert.match(prose, /50.{0,30}donor/i);
      else
        assert.match(prose, /97.{0,30}(HCC|hepatocellular|cohort)/i);
      assert.match(lesson.note, /revision-bound radiologist review pending/i);
      assert.doesNotMatch(prose, /approved for clinical use|recommended catheter route|diagnostic threshold is/i);
      assert.match(lesson.note, /No[^.]*graft validation/i);
      assert.match(lesson.note, /No[^.]*patient-space registration/i);
      assert.match(lesson.note, /No[^.]*procedural route/i);
      assert.match(lesson.note, /No[^.]*clinical approval/i);
      const {readiness, ...content} = lesson;
      assert.deepEqual(current.bodyContent(structure, tab), content);
      const copy = structuredClone(lesson);
      lesson.bullets.push('foreign'); lesson.citations.push('https://foreign.example');
      assert.deepEqual(current.thoracicWallArterialXrayLesson(structure, tab), copy);
      for (const other of current.contentTabs) if (other !== 'xray')
        assert.equal(current.thoracicWallArterialXrayLesson(structure, other), undefined);
      changed++;
    } else {
      assert.deepEqual(lesson, previous, `${structure.id}:${tab}`);
      preserved++;
      if (!identities.has(structure.id))
        assert.equal(current.thoracicWallArterialXrayLesson(structure, tab), undefined);
    }
  }
  const previousPacket = await old.bodyReviewMaterial(structure.id);
  const packet = await current.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval, false);
  if (identities.has(structure.id)) {
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], previousPacket[key], `${structure.id}:${key}`);
    assert.equal(packet.fingerprints.source, previousPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, previousPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, previousPacket.materialHash);
    assert.deepEqual(packet.topics.find(row => row.tab === 'xray'),
      {tab: 'xray', ...current.bodyLesson(structure, 'xray')});
    assert.deepEqual(await current.parseBodyReviewResponse(packet, structure.id), packet);
    assert.equal(await current.parseBodyReviewResponse(previousPacket, structure.id), null);
    const forged = structuredClone(packet);
    forged.topics.find(row => row.tab === 'xray').body += ' foreign';
    assert.equal(await current.parseBodyReviewResponse(forged, structure.id), null);
    malformed++;
    const priorContext = await old.bodyReviewContext(structure.id);
    const context = await current.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash, priorContext.sourceHash);
    assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
    const decision = {
      catalogScope: context.catalogScope, structureId: structure.id, track: 'teaching',
      expectedVersion: 0, materialHash: priorContext.materialHash,
      revisionHash: priorContext.revisions.teaching, checklistVersion: context.checklistVersion,
      draft: current.blankBodyReview(context, 'teaching'),
    };
    const response = await current.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_THORACIC_WALL_XRAY'}, body: JSON.stringify(decision),
    }), {prepare() { storageCalls++; throw Error('Stale decision reached storage'); }});
    assert.equal(response.status, 409);
    const forgedDecision = structuredClone(decision);
    forgedDecision.materialHash = context.materialHash;
    forgedDecision.revisionHash = context.revisions.teaching;
    forgedDecision.draft.status = 'approved';
    const forgedResponse = await current.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_THORACIC_WALL_XRAY'}, body: JSON.stringify(forgedDecision),
    }), {prepare() { storageCalls++; throw Error('Forged approval reached storage'); }});
    assert.equal(forgedResponse.status, 422);
    forgedDecisions++;
    stale++; changedPackets++;
  } else {
    assert.deepEqual(packet, previousPacket, `${structure.id}: Review packet`);
    preservedPackets++;
  }
}
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [6, 9930, 6, 1098]);
assert.equal(storageCalls, 0);
console.log(JSON.stringify({baseline, changed, preserved, changedPackets, preservedPackets,
  refusedIdentities, malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale,
  forgedApprovalRefusalsBeforeStorage: forgedDecisions,
  storageCalls, clinicalApproval: false}));
