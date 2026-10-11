import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = 'ba8008b6d1ac8c49aa551c2bf9995e80cc52997f';
const expected = new Map([
  ['abdominal-aorta', 'FMA3789'], ['celiac', 'FMA50737'],
  ['sma', 'FMA14749'], ['ima', 'FMA14750'],
]);
const pinsPath = 'content/central-vessel-imaging-pins.json';
const pins = JSON.parse(readFileSync(pinsPath, 'utf8'));
const entries = pins.entries.filter(e => expected.has(e.group));
assert.equal(entries.length, 4);
assert.deepEqual(new Map(entries.map(e => [e.group, e.identity.fmaId])), expected);
const identities = new Map(entries.map(e => [e.identity.id, e.identity]));
assert.equal(identities.size, 4);
for (const {identity} of entries) {
  assert.equal(identity.region, 'abdomen');
  assert.equal(identity.system, 'vessels');
  assert.equal(identity.category, 'vessel');
  assert.equal(identity.bundle, 'abdomen-vessels-recovery');
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
}
const gitBytes = path => execFileSync('git', ['show', `${baseline}:${path}`],
  {windowsHide: true, maxBuffer: 32e6});
assert.deepEqual(readFileSync(pinsPath), gitBytes(pinsPath), 'Reuse current central vessel pins');

const compiled = await build({
  stdin: {contents:
    "export {abdominalArterialXrayLesson} from './lib/abdominal-arterial-xray';" +
    "export {abdominalArterialXrayTopics} from './content/abdominal-arterial-xray';" +
    "export {bodyLesson,bodyContent} from './app/body-content';" +
    "export {bodyDisplayCatalog,celiacTeachingIdentity,celiacDisplayCorrection} from './lib/body-display-catalog';" +
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
assert.deepEqual(Object.keys(current.abdominalArterialXrayTopics).sort(), [...expected.keys()].sort());
for (const topic of Object.values(current.abdominalArterialXrayTopics)) {
  assert(topic.title && topic.body && topic.bullets.length >= 2);
  assert(topic.bullets.every(b => typeof b === 'string' && b.trim()));
  assert(topic.citations.every(url => /^https:\/\//.test(url)));
  assert.equal(new Set(topic.citations).size, topic.citations.length);
}

const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const raw = JSON.parse(readFileSync(catalogPath, 'utf8'));
const catalog = current.bodyDisplayCatalog(raw);
assert.deepEqual(catalog, old.bodyDisplayCatalog(JSON.parse(gitBytes(catalogPath))));
assert.equal(catalog.structures.length * current.contentTabs.length, 9936);
assert.deepEqual(catalog.structures.filter(s => identities.has(s.id)).map(current.celiacTeachingIdentity),
  entries.map(e => e.identity));
const correctedCeliac = catalog.structures.find(s => s.id ===
  entries.find(e => e.group === 'celiac').identity.id);
assert.deepEqual(correctedCeliac, current.celiacDisplayCorrection.replacement);
assert.equal(current.abdominalArterialXrayLesson(correctedCeliac, 'xray').readiness, 'draft');
for (const alteration of [
  s => { s.bundle += '-foreign'; },
  s => { s.sources[0].sha256 = '0'.repeat(64); },
  s => { s.bounds.max[0] += 0.01; },
]) {
  const bad = structuredClone(correctedCeliac); alteration(bad);
  assert.equal(current.abdominalArterialXrayLesson(bad, 'xray'), undefined,
    'Altered corrected celiac surface must refuse teaching');
}

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
for (const identity of identities.values()) {
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
    const key = path.at(-1), original = parent[key];
    parent[key] = typeof original === 'string' ? original + '-foreign'
      : typeof original === 'number' ? original + 0.01
        : original === null ? 'foreign' : !original;
    assert.equal(current.abdominalArterialXrayLesson(bad, 'xray'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const bad = structuredClone(identity); at(bad, path).push('foreign');
    assert.equal(current.abdominalArterialXrayLesson(bad, 'xray'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const bad = structuredClone(identity); at(bad, path).unexpected = true;
    assert.equal(current.abdominalArterialXrayLesson(bad, 'xray'), undefined, path.join('.') || '<root>');
    refusedIdentities++;
  }
}

let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let stale = 0, malformed = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  for (const tab of current.contentTabs) {
    const previous = old.bodyLesson(structure, tab), lesson = current.bodyLesson(structure, tab);
    if (identities.has(structure.id) && tab === 'xray') {
      assert.equal(previous.readiness, 'pending');
      assert.equal(lesson.readiness, 'draft');
      assert.deepEqual(lesson, current.abdominalArterialXrayLesson(structure, tab));
      const topic = current.abdominalArterialXrayTopics[entries.find(e => e.identity.id === structure.id).group];
      assert.equal(lesson.body, topic.body);
      for (const b of topic.bullets) assert(lesson.bullets.includes(b));
      const prose = [lesson.title, lesson.body, ...lesson.bullets, lesson.note].join(' ');
      assert.match(prose, /contrast.{0,30}x-ray|x-ray.{0,30}contrast/i);
      assert.match(prose, /plain.{0,30}radiograph|ordinary.{0,30}radiograph/i);
      assert.match(prose, /CT angiography/);
      assert.match(prose, /MR angiography/);
      assert.match(lesson.note, /revision-bound radiologist review pending/i);
      assert.doesNotMatch(prose, /approved for clinical use|recommended catheter route|diagnostic threshold is/i);
      const {readiness, ...content} = lesson;
      assert.deepEqual(current.bodyContent(structure, tab), content);
      const copy = structuredClone(lesson);
      lesson.bullets.push('foreign'); lesson.citations.push('https://foreign.example');
      assert.deepEqual(current.abdominalArterialXrayLesson(structure, tab), copy);
      for (const other of current.contentTabs) if (other !== 'xray')
        assert.equal(current.abdominalArterialXrayLesson(structure, other), undefined);
      changed++;
    } else {
      assert.deepEqual(lesson, previous, `${structure.id}:${tab}`);
      preserved++;
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
        'oai-authenticated-user-id': 'SYNTHETIC_ABDOMINAL_XRAY'}, body: JSON.stringify(decision),
    }), {prepare() { storageCalls++; throw Error('Stale decision reached storage'); }});
    assert.equal(response.status, 409);
    stale++; changedPackets++;
  } else {
    assert.deepEqual(packet, previousPacket, `${structure.id}: Review packet`);
    preservedPackets++;
  }
}
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [4, 9932, 4, 1100]);
assert.equal(storageCalls, 0);
console.log(JSON.stringify({baseline, changed, preserved, changedPackets, preservedPackets,
  refusedIdentities, malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale,
  storageCalls, clinicalApproval: false}));
