import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = '61ff057d5204caaaa4be654bacb371de7de8f038';
const completedCommit = '5432e508f974703d817cfd02024e98803a7eaa72';
const expectedIds = ['FMA3855', 'FMA3862', 'FMA3895', 'FMA3802'];
const pins = JSON.parse(readFileSync('content/coronary-arterial-us-pins.json', 'utf8'));
assert.deepEqual(pins.entries.map(entry => entry.identity.fmaId), expectedIds);
const identities = new Map(pins.entries.map(entry => [entry.identity.id, entry.identity]));
assert.equal(identities.size, 4);
for (const identity of identities.values()) {
  assert.equal(identity.nodeName, identity.fmaId);
  assert.equal(identity.system, 'vessels');
  assert.equal(identity.category, 'vessel');
  assert.equal(identity.region, 'thorax');
  assert.equal(identity.bundle, 'thorax-vessels-recovery');
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
}

const old = await exactSourceHistoryApi(baseline, 'review-security');
const completed = await exactSourceHistoryApi(completedCommit, 'review-security');
const compiled = await build({
  stdin: {
    contents: "export {coronaryArterialXrayLesson} from './lib/coronary-arterial-xray';" +
      "export {coronaryArterialXrayTopics} from './content/coronary-arterial-xray';" +
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
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const now = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
assert.deepEqual(Object.keys(now.coronaryArterialXrayTopics).sort(), [...expectedIds].sort());
for (const id of expectedIds) {
  const topic = now.coronaryArterialXrayTopics[id];
  assert.equal(typeof topic.title, 'string'); assert(topic.title.trim());
  assert.equal(typeof topic.body, 'string'); assert(topic.body.trim());
  assert(Array.isArray(topic.bullets) && topic.bullets.length > 0);
  assert(topic.bullets.every(bullet => typeof bullet === 'string' && bullet.trim()));
  assert(Array.isArray(topic.citations) && topic.citations.length > 0);
  assert(topic.citations.every(url => /^https:\/\//.test(url)));
  assert.equal(new Set(topic.citations).size, topic.citations.length);
}

const gitBytes = path => execFileSync('git', ['show', `${baseline}:${path}`], {
  windowsHide: true, maxBuffer: 32e6,
});
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const raw = JSON.parse(readFileSync(catalogPath, 'utf8'));
assert.deepEqual(raw, JSON.parse(gitBytes(catalogPath)));
const catalog = now.bodyDisplayCatalog(raw);
assert.deepEqual(catalog, old.bodyDisplayCatalog(JSON.parse(gitBytes(catalogPath))));
assert.deepEqual(now.structures, old.structures);
assert.deepEqual(now.dissectionProfiles, old.dissectionProfiles);
assert.deepEqual(now.regionalTours, old.regionalTours);
assert.deepEqual(now.contentTabs, old.contentTabs);
assert.equal(catalog.structures.length * now.contentTabs.length, 9936);
assert.equal(catalog.bundles.length, 109);
for (const [id, identity] of identities) {
  assert.deepEqual(catalog.structures.find(row => row.id === id), identity);
  assert.equal(old.bodyLesson(identity, 'xray').readiness, 'pending');
}

let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let malformed = 0, stale = 0, forgedSaves = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  for (const tab of now.contentTabs) {
    const previous = old.bodyLesson(structure, tab);
    const completedLesson = completed.bodyLesson(structure, tab);
    const lesson = now.bodyLesson(structure, tab);
    const selected = now.coronaryArterialXrayLesson(structure, tab);
    if (identities.has(structure.id) && tab === 'xray') {
      const topic = now.coronaryArterialXrayTopics[structure.fmaId];
      assert.equal(previous.readiness, 'pending');
      assert.deepEqual(lesson, completedLesson, `${structure.id}: current coronary teaching`);
      assert.deepEqual(lesson, selected);
      assert.equal(lesson.readiness, 'draft');
      assert.equal(lesson.body, topic.body);
      assert.equal(lesson.bullets[0],
        'Invasive coronary angiography uses catheter-delivered contrast and X-ray images. Do not treat a routine chest X-ray as a coronary angiogram; coronary CT angiography is a different examination.');
      assert.deepEqual(lesson.bullets.slice(1, 1 + topic.bullets.length), topic.bullets);
      assert.equal(lesson.bullets.length, topic.bullets.length + 3);
      assert.deepEqual(lesson.citations, topic.citations);
      const prose = [lesson.title, lesson.body, ...lesson.bullets, lesson.note].join(' ');
      assert.match(prose, /coronary angiograph/i);
      assert.match(prose, /chest (?:x-ray|radiograph)/i);
      assert.match(prose, /(?:no patient-space registration|not registered|no patient registration)/i);
      assert.match(lesson.note, /revision-bound radiologist review pending/i);
      assert.doesNotMatch(lesson.note, /clinically approved/i);
      const {readiness, ...shown} = lesson;
      assert.deepEqual(now.bodyContent(structure, tab), shown);
      changed++;
    } else {
      assert.deepEqual(completedLesson, previous, `${structure.id}:${tab}: original coronary transition`);
      assert.equal(selected, undefined, `${structure.id}:${tab}`);
      preserved++;
    }
  }
  const previousPacket = await old.bodyReviewMaterial(structure.id);
  const packet = await now.bodyReviewMaterial(structure.id);
  const completedPacket = await completed.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval, false);
  assert.deepEqual(packet.reasoning, previousPacket.reasoning, `${structure.id}: reasoning session`);
  if (identities.has(structure.id)) {
    assert.deepEqual(packet, completedPacket, `${structure.id}: current coronary Review`);
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], previousPacket[key], `${structure.id}:${key}`);
    assert.equal(packet.fingerprints.source, previousPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, previousPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, previousPacket.materialHash);
    assert.deepEqual(packet.topics.find(row => row.tab === 'xray'), {
      tab: 'xray', ...now.bodyLesson(structure, 'xray'),
    });
    assert.deepEqual(await now.parseBodyReviewResponse(packet, structure.id), packet);
    assert.equal(await now.parseBodyReviewResponse(previousPacket, structure.id), null);
    for (const edit of [
      value => { value.topics.find(row => row.tab === 'xray').body += ' foreign'; },
      value => { value.topics.find(row => row.tab === 'xray').bullets[0] += ' foreign'; },
      value => { value.topics.find(row => row.tab === 'xray').citations = ['https://foreign.example']; },
      value => { value.topics.find(row => row.tab === 'xray').readiness = 'approved'; },
      value => { value.topics.splice(value.topics.findIndex(row => row.tab === 'xray'), 1); },
    ]) {
      const forged = structuredClone(packet); edit(forged);
      assert.equal(await now.parseBodyReviewResponse(forged, structure.id), null);
      malformed++;
    }
    const priorContext = await old.bodyReviewContext(structure.id);
    const context = await now.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash, priorContext.sourceHash);
    assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
    const decision = {
      catalogScope: context.catalogScope, structureId: structure.id, track: 'teaching',
      expectedVersion: 0, materialHash: context.materialHash,
      revisionHash: context.revisions.teaching, checklistVersion: context.checklistVersion,
      draft: now.blankBodyReview(context, 'teaching'),
    };
    for (const staleHashes of [
      {materialHash: priorContext.materialHash, revisionHash: priorContext.revisions.teaching},
      {materialHash: priorContext.materialHash},
      {revisionHash: priorContext.revisions.teaching},
    ]) {
      const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
        method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
          'oai-authenticated-user-id': 'SYNTHETIC_CORONARY_XRAY'},
        body: JSON.stringify({...decision, ...staleHashes}),
      }), {prepare() { storageCalls++; throw Error('Stale decision reached storage'); }});
      assert.equal(response.status, 409);
      stale++;
    }
    const forged = structuredClone(decision);
    forged.draft.checks.foreign = true;
    const forgedResponse = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_CORONARY_XRAY'},
      body: JSON.stringify(forged),
    }), {prepare() { storageCalls++; throw Error('Forged decision reached storage'); }});
    assert.equal(forgedResponse.status, 422);
    forgedSaves++;
    changedPackets++;
  } else {
    assert.deepEqual(completedPacket, previousPacket, `${structure.id}: original coronary Review`);
    preservedPackets++;
  }
}
assert.equal(changed, 4);
assert.equal(preserved, 9932);
assert.equal(changedPackets, 4);
assert.equal(preservedPackets, 1100);
assert.equal(malformed, 20);
assert.equal(stale, 12);
assert.equal(forgedSaves, 4);
assert.equal(storageCalls, 0);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
for (const identity of identities.values()) {
  const first = now.coronaryArterialXrayLesson(identity, 'xray');
  const clean = structuredClone(first);
  first.bullets.push('foreign'); first.citations.push('https://foreign.example');
  assert.deepEqual(now.coronaryArterialXrayLesson(identity, 'xray'), clean, 'Fresh lesson arrays');
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const invalid = structuredClone(identity);
    const parent = at(invalid, path.slice(0, -1));
    const key = path.at(-1), original = parent[key];
    parent[key] = typeof original === 'string' ? original + '-foreign'
      : typeof original === 'number' ? original + 0.01
        : original === null ? 'foreign' : !original;
    assert.equal(now.coronaryArterialXrayLesson(invalid, 'xray'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const invalid = structuredClone(identity); at(invalid, path).push('foreign');
    assert.equal(now.coronaryArterialXrayLesson(invalid, 'xray'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const invalid = structuredClone(identity); at(invalid, path).unexpected = true;
    assert.equal(now.coronaryArterialXrayLesson(invalid, 'xray'), undefined, path.join('.') || '<root>');
    refusedIdentities++;
  }
}
for (const bundle of catalog.bundles) {
  const path = 'public' + bundle.url.split('?')[0];
  const bytes = readFileSync(path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  assert.deepEqual(bytes, gitBytes(path), `${path} remains unchanged`);
}
console.log(JSON.stringify({baseline, completedCommit, fullCountsScope: 'baseline-to-completed', changed, preserved, changedPackets, preservedPackets,
  refusedIdentities, malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale,
  forgedSavesRefusedBeforeStorage: forgedSaves, storageCalls,
  sourceBundlesUnchanged: catalog.bundles.length, clinicalApproval: false}));
