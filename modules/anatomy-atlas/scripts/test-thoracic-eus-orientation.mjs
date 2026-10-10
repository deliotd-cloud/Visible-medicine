import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { build } from './workspace-test-build.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = 'b03ba458907946c1b1c152149ee5867f8d6a62df';
const targetId = 'vm:anatomy:body:thorax:unspecified:vessel:azygos-vein';
const pins = JSON.parse(readFileSync('content/central-vessel-imaging-pins.json', 'utf8'));
const matches = pins.entries.filter(entry => entry.identity.fmaId === 'FMA4838');
assert.equal(matches.length, 1);
const { identity } = matches[0];
assert.equal(identity.id, targetId);
assert.equal(identity.system, 'vessels');
assert.equal(identity.laterality, 'unspecified');
assert.equal(identity.nodeName, 'FMA4838');
assert.equal(identity.validation.status, 'unvalidated');
assert.equal(identity.validation.anatomicalReview, false);
assert.deepEqual(identity.sources.map(source => source.file), ['FJ3416']);
const hemiazygos = pins.entries.find(entry => entry.identity.fmaId === 'FMA4944')?.identity;
assert.equal(hemiazygos?.id, 'vm:anatomy:body:thorax:midline:vessel:hemiazygos-vein');

const old = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({
  stdin: {
    contents: "export {thoracicEusOrientationLesson} from './lib/thoracic-eus-orientation';" +
      "export {thoracicEusTopics} from './content/thoracic-eus-orientation';" +
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
assert.deepEqual(Object.keys(now.thoracicEusTopics), ['FMA4838']);
const topic = now.thoracicEusTopics.FMA4838;
assert.equal(typeof topic.title, 'string'); assert(topic.title.trim());
assert.equal(typeof topic.body, 'string'); assert(topic.body.trim());
assert(Array.isArray(topic.bullets) && topic.bullets.length > 0);
assert(topic.bullets.every(bullet => typeof bullet === 'string' && bullet.trim()));
assert(Array.isArray(topic.citations) && topic.citations.length > 0);
assert(topic.citations.every(url => /^https:\/\//.test(url)));
assert.equal(new Set(topic.citations).size, topic.citations.length);

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
assert.deepEqual(catalog.structures.find(row => row.id === targetId), identity);
assert.equal(old.bodyLesson(identity, 'ultrasound').readiness, 'pending');
assert.equal(now.bodyLesson(hemiazygos, 'ultrasound').readiness, 'pending');

let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let malformed = 0, stale = 0, forgedSaves = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  for (const tab of now.contentTabs) {
    const previous = old.bodyLesson(structure, tab);
    const lesson = now.bodyLesson(structure, tab);
    const orientation = now.thoracicEusOrientationLesson(structure, tab);
    if (structure.id === targetId && tab === 'ultrasound') {
      assert.equal(previous.readiness, 'pending');
      assert.deepEqual(lesson, orientation);
      assert.equal(lesson.readiness, 'draft');
      assert.equal(lesson.body, topic.body);
      assert.deepEqual(lesson.bullets.slice(0, topic.bullets.length), topic.bullets);
      assert.deepEqual(lesson.citations, topic.citations);
      assert.match([lesson.title, lesson.body, ...lesson.bullets, lesson.note].join(' '), /endoscopic ultrasound|\bEUS\b/i);
      assert.match(lesson.note, /revision-bound radiologist review pending/i);
      assert.match(lesson.body, /internal, transoesophageal view, not a routine transthoracic ultrasound window/i);
      assert.match(lesson.bullets.join(' '), /11 controls.*17 participants.*not a universal visibility rate/i);
      assert.match(lesson.bullets.join(' '), /do not infer patient flow, patency or portal pressure/i);
      assert.match(lesson.bullets.join(' '), /does not establish that it is the hemiazygos vein/i);
      assert.match([lesson.body, ...lesson.bullets, lesson.note].join(' '), /no patient-space registration|not registered/i);
      assert.doesNotMatch(lesson.note, /clinically approved/i);
      const { readiness, ...shown } = lesson;
      assert.deepEqual(now.bodyContent(structure, tab), shown);
      changed++;
    } else {
      assert.deepEqual(lesson, previous, `${structure.id}:${tab}`);
      assert.equal(orientation, undefined, `${structure.id}:${tab}`);
      preserved++;
    }
  }
  const previousPacket = await old.bodyReviewMaterial(structure.id);
  const packet = await now.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval, false);
  if (structure.id === targetId) {
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], previousPacket[key], key);
    assert.equal(packet.fingerprints.source, previousPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, previousPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, previousPacket.materialHash);
    assert.deepEqual(packet.topics.find(row => row.tab === 'ultrasound'), {
      tab: 'ultrasound', ...now.bodyLesson(structure, 'ultrasound'),
    });
    assert.deepEqual(await now.parseBodyReviewResponse(packet, targetId), packet);
    assert.equal(await now.parseBodyReviewResponse(previousPacket, targetId), null);
    for (const edit of [
      value => { value.topics.find(row => row.tab === 'ultrasound').body += ' foreign'; },
      value => { value.topics.find(row => row.tab === 'ultrasound').bullets[0] += ' foreign'; },
      value => { value.topics.find(row => row.tab === 'ultrasound').citations = ['https://foreign.example']; },
      value => { value.topics.find(row => row.tab === 'ultrasound').readiness = 'approved'; },
      value => { value.topics.splice(value.topics.findIndex(row => row.tab === 'ultrasound'), 1); },
    ]) {
      const forged = structuredClone(packet); edit(forged);
      assert.equal(await now.parseBodyReviewResponse(forged, targetId), null);
      malformed++;
    }
    const priorContext = await old.bodyReviewContext(targetId);
    const context = await now.bodyReviewContext(targetId);
    assert.equal(context.sourceHash, priorContext.sourceHash);
    assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
    const decision = {
      catalogScope: context.catalogScope, structureId: targetId, track: 'teaching',
      expectedVersion: 0, materialHash: context.materialHash,
      revisionHash: context.revisions.teaching, checklistVersion: context.checklistVersion,
      draft: now.blankBodyReview(context, 'teaching'),
    };
    for (const staleHashes of [
      { materialHash: priorContext.materialHash, revisionHash: priorContext.revisions.teaching },
      { materialHash: priorContext.materialHash },
      { revisionHash: priorContext.revisions.teaching },
    ]) {
      const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
        method: 'POST', headers: { origin: 'https://atlas.test', 'content-type': 'application/json',
          'oai-authenticated-user-id': 'SYNTHETIC_THORACIC_EUS' },
        body: JSON.stringify({ ...decision, ...staleHashes }),
      }), { prepare() { storageCalls++; throw Error('Stale decision reached storage'); } });
      assert.equal(response.status, 409);
      stale++;
    }
    const forged = structuredClone(decision);
    forged.draft.checks.foreign = true;
    const forgedResponse = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: { origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_THORACIC_EUS' },
      body: JSON.stringify(forged),
    }), { prepare() { storageCalls++; throw Error('Forged decision reached storage'); } });
    assert.equal(forgedResponse.status, 422);
    forgedSaves++;
    changedPackets++;
  } else {
    assert.deepEqual(packet, previousPacket, `${structure.id}: Review packet`);
    preservedPackets++;
  }
}
assert.equal(changed, 1);
assert.equal(preserved, 9935);
assert.equal(changedPackets, 1);
assert.equal(preservedPackets, 1103);
assert.equal(malformed, 5);
assert.equal(stale, 3);
assert.equal(forgedSaves, 1);
assert.equal(storageCalls, 0);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
const first = now.thoracicEusOrientationLesson(identity, 'ultrasound');
const clean = structuredClone(first);
first.bullets.push('foreign'); first.citations.push('https://foreign.example');
assert.deepEqual(now.thoracicEusOrientationLesson(identity, 'ultrasound'), clean, 'Fresh lesson arrays');
for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
  const invalid = structuredClone(identity);
  const parent = at(invalid, path.slice(0, -1));
  const key = path.at(-1), original = parent[key];
  parent[key] = typeof original === 'string' ? original + '-foreign'
    : typeof original === 'number' ? original + 0.01
      : original === null ? 'foreign' : !original;
  assert.equal(now.thoracicEusOrientationLesson(invalid, 'ultrasound'), undefined, path.join('.'));
  refusedIdentities++;
}
for (const path of pathsWhere(identity, Array.isArray)) {
  const invalid = structuredClone(identity); at(invalid, path).push('foreign');
  assert.equal(now.thoracicEusOrientationLesson(invalid, 'ultrasound'), undefined, path.join('.'));
  refusedIdentities++;
}
for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
  const invalid = structuredClone(identity); at(invalid, path).unexpected = true;
  assert.equal(now.thoracicEusOrientationLesson(invalid, 'ultrasound'), undefined, path.join('.') || '<root>');
  refusedIdentities++;
}
for (const bundle of catalog.bundles) {
  const path = 'public' + bundle.url.split('?')[0];
  const bytes = readFileSync(path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  assert.deepEqual(bytes, gitBytes(path), `${path} remains unchanged`);
}
console.log(JSON.stringify({ baseline, changed, preserved, changedPackets, preservedPackets,
  refusedIdentities, malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale,
  forgedSavesRefusedBeforeStorage: forgedSaves,
  storageCalls, sourceBundlesUnchanged: catalog.bundles.length, clinicalApproval: false }));
