import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { build } from './workspace-test-build.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = '4233534fadb842b4d3c074b6881b28e29a6fdd06';
const fmaIds = ['FMA76574', 'FMA15391', 'FMA14768'];
const branchPins = JSON.parse(readFileSync('content/abdominal-branch-imaging-pins.json', 'utf8'));
const centralPins = JSON.parse(readFileSync('content/central-vessel-imaging-pins.json', 'utf8'));
const selected = [
  ...branchPins.entries.filter(entry => fmaIds.slice(0, 2).includes(entry.identity.fmaId)),
  ...centralPins.entries.filter(entry => entry.identity.fmaId === fmaIds[2]),
];
assert.equal(selected.length, 3);
assert.deepEqual(new Set(selected.map(entry => entry.identity.fmaId)), new Set(fmaIds));
assert.equal(new Set(selected.map(entry => entry.identity.id)).size, 3);
for (const entry of selected) {
  assert.equal(entry.identity.validation.anatomicalReview, false);
  assert.equal(entry.identity.validation.status, 'unvalidated');
  assert.equal(entry.identity.nodeName, entry.identity.fmaId);
}
const byId = new Map(selected.map(entry => [entry.identity.id, entry]));
const fromBaseline = path => execFileSync('git', ['show', `${baseline}:${path}`], {
  windowsHide: true, maxBuffer: 32e6,
});
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

const previous = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({
  stdin: {
    contents: "export {abdominalEusOrientationLesson} from './lib/abdominal-eus-orientation';" +
      "export {abdominalEusTopics} from './content/abdominal-eus-orientation';" +
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
assert.deepEqual(Object.keys(now.abdominalEusTopics).sort(), [...fmaIds].sort());
for (const fmaId of fmaIds) {
  const topic = now.abdominalEusTopics[fmaId];
  assert.equal(typeof topic.title, 'string'); assert(topic.title.trim());
  assert.equal(typeof topic.body, 'string'); assert(topic.body.trim());
  assert(Array.isArray(topic.bullets) && topic.bullets.length > 0);
  assert(topic.bullets.every(bullet => typeof bullet === 'string' && bullet.trim()));
  assert(Array.isArray(topic.citations) && topic.citations.length > 0);
  assert(topic.citations.every(url => /^https:\/\//.test(url)));
  assert.equal(new Set(topic.citations).size, topic.citations.length);
}

const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const raw = JSON.parse(readFileSync(catalogPath, 'utf8'));
assert.deepEqual(raw, JSON.parse(fromBaseline(catalogPath)));
const catalog = now.bodyDisplayCatalog(raw);
assert.deepEqual(catalog, previous.bodyDisplayCatalog(JSON.parse(fromBaseline(catalogPath))));
assert.deepEqual(now.structures, previous.structures);
assert.deepEqual(now.dissectionProfiles, previous.dissectionProfiles);
assert.deepEqual(now.regionalTours, previous.regionalTours);
assert.deepEqual(now.contentTabs, previous.contentTabs);
assert.equal(now.contentTabs.length * catalog.structures.length, 9936);
assert.equal(catalog.bundles.length, 109);
for (const entry of selected)
  assert.deepEqual(catalog.structures.find(row => row.id === entry.identity.id), entry.identity);

let changed = 0, preserved = 0, changedWorksheets = 0, preservedWorksheets = 0;
let malformed = 0, stale = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  for (const tab of now.contentTabs) {
    const oldLesson = previous.bodyLesson(structure, tab);
    const lesson = now.bodyLesson(structure, tab);
    const orientation = now.abdominalEusOrientationLesson(structure, tab);
    if (byId.has(structure.id) && tab === 'ultrasound') {
      assert.equal(oldLesson.readiness, 'pending', structure.id);
      assert.deepEqual(lesson, orientation);
      assert.equal(lesson.readiness, 'draft');
      assert.equal(lesson.body, now.abdominalEusTopics[structure.fmaId].body);
      assert.deepEqual(lesson.bullets.slice(0, -2), now.abdominalEusTopics[structure.fmaId].bullets);
      assert.equal(lesson.bullets.length, now.abdominalEusTopics[structure.fmaId].bullets.length + 2);
      assert.deepEqual(lesson.citations, now.abdominalEusTopics[structure.fmaId].citations);
      assert.match([lesson.title, lesson.body, ...lesson.bullets, lesson.note].join(' '), /endoscopic ultrasound|\bEUS\b/i);
      assert.match(lesson.note, /revision-bound radiologist review pending/i);
      assert.match(lesson.bullets.at(-2), /do not guarantee visibility on routine transabdominal ultrasound/i);
      assert.match(lesson.bullets.at(-1), /no patient-space registration is provided/i);
      assert.doesNotMatch(lesson.note, /clinically approved/i);
      const { readiness, ...shown } = lesson;
      assert.deepEqual(now.bodyContent(structure, tab), shown);
      changed++;
    } else {
      assert.deepEqual(lesson, oldLesson, `${structure.id}:${tab}`);
      assert.equal(orientation, undefined, `${structure.id}:${tab}`);
      preserved++;
    }
  }
  const oldPacket = await previous.bodyReviewMaterial(structure.id);
  const packet = await now.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval, false);
  if (byId.has(structure.id)) {
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], oldPacket[key], `${structure.id}:${key}`);
    assert.equal(packet.fingerprints.source, oldPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, oldPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, oldPacket.materialHash);
    assert.deepEqual(packet.topics.find(topic => topic.tab === 'ultrasound'), {
      tab: 'ultrasound', ...now.bodyLesson(structure, 'ultrasound'),
    });
    assert.deepEqual(await now.parseBodyReviewResponse(packet, structure.id), packet);
    assert.equal(await now.parseBodyReviewResponse(oldPacket, structure.id), null);
    for (const edit of [
      value => { value.topics.find(topic => topic.tab === 'ultrasound').body += ' foreign'; },
      value => { value.topics.find(topic => topic.tab === 'ultrasound').bullets[0] += ' foreign'; },
      value => { value.topics.find(topic => topic.tab === 'ultrasound').citations = ['https://foreign.example']; },
      value => { value.topics.find(topic => topic.tab === 'ultrasound').readiness = 'approved'; },
      value => { value.topics.splice(value.topics.findIndex(topic => topic.tab === 'ultrasound'), 1); },
    ]) {
      const forged = structuredClone(packet); edit(forged);
      assert.equal(await now.parseBodyReviewResponse(forged, structure.id), null);
      malformed++;
    }
    const oldContext = await previous.bodyReviewContext(structure.id);
    const context = await now.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash, oldContext.sourceHash);
    assert.notEqual(context.revisions.teaching, oldContext.revisions.teaching);
    const decision = {
      catalogScope: context.catalogScope, structureId: structure.id, track: 'teaching',
      expectedVersion: 0, materialHash: context.materialHash,
      revisionHash: context.revisions.teaching, checklistVersion: context.checklistVersion,
      draft: now.blankBodyReview(context, 'teaching'),
    };
    for (const staleHashes of [
      { materialHash: oldContext.materialHash, revisionHash: oldContext.revisions.teaching },
      { materialHash: oldContext.materialHash },
      { revisionHash: oldContext.revisions.teaching },
    ]) {
      const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
        method: 'POST', headers: { origin: 'https://atlas.test', 'content-type': 'application/json',
          'oai-authenticated-user-id': 'SYNTHETIC_ABDOMINAL_EUS' },
        body: JSON.stringify({ ...decision, ...staleHashes }),
      }), { prepare() { storageCalls++; throw Error('Stale decision reached storage'); } });
      assert.equal(response.status, 409);
      stale++;
    }
    changedWorksheets++;
  } else {
    assert.deepEqual(packet, oldPacket, `${structure.id}: review packet`);
    preservedWorksheets++;
  }
}
assert.equal(changed, 3);
assert.equal(preserved, 9933);
assert.equal(changedWorksheets, 3);
assert.equal(preservedWorksheets, 1101);
assert.equal(malformed, 15);
assert.equal(stale, 9);
assert.equal(storageCalls, 0);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
for (const { identity } of selected) {
  const lesson = now.abdominalEusOrientationLesson(identity, 'ultrasound');
  const clean = structuredClone(lesson);
  lesson.bullets.push('foreign'); lesson.citations.push('https://foreign.example');
  assert.deepEqual(now.abdominalEusOrientationLesson(identity, 'ultrasound'), clean, 'Fresh lesson arrays');
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const invalid = structuredClone(identity);
    const parent = at(invalid, path.slice(0, -1));
    const key = path.at(-1), original = parent[key];
    parent[key] = typeof original === 'string' ? original + '-foreign'
      : typeof original === 'number' ? original + 0.01
        : original === null ? 'foreign' : !original;
    assert.equal(now.abdominalEusOrientationLesson(invalid, 'ultrasound'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const invalid = structuredClone(identity); at(invalid, path).push('foreign');
    assert.equal(now.abdominalEusOrientationLesson(invalid, 'ultrasound'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const invalid = structuredClone(identity); at(invalid, path).unexpected = true;
    assert.equal(now.abdominalEusOrientationLesson(invalid, 'ultrasound'), undefined, path.join('.') || '<root>');
    refusedIdentities++;
  }
}
for (const bundle of catalog.bundles) {
  const path = 'public' + bundle.url.split('?')[0];
  const bytes = readFileSync(path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  assert.deepEqual(bytes, fromBaseline(path), `${path} remains unchanged`);
}
console.log(JSON.stringify({ baseline, changed, preserved, changedWorksheets, preservedWorksheets,
  refusedIdentities, malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale,
  storageCalls, sourceBundlesUnchanged: catalog.bundles.length, clinicalApproval: false }));
