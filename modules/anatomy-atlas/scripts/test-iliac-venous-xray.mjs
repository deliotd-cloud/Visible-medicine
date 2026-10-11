import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = '1563e6394013938f46da559390531e888703b93d';
const expected = new Map([
  ['FMA21387', 'common'], ['FMA21388', 'common'],
  ['FMA18885', 'external'], ['FMA18886', 'external'],
  ['FMA18887', 'internal'], ['FMA18888', 'internal'],
]);
const pinsPath = 'content/iliac-venous-imaging-pins.json';
const pins = JSON.parse(readFileSync(pinsPath, 'utf8'));
assert.equal(pins.entries.length, 6);
assert.deepEqual(new Map(pins.entries.map(e => [e.identity.fmaId, e.group])), expected);
const identities = new Map(pins.entries.map(e => [e.identity.id, e.identity]));
assert.equal(identities.size, 6);
for (const {identity, group} of pins.entries) {
  assert.equal(identity.nodeName, identity.fmaId);
  assert.equal(identity.system, 'vessels');
  assert.equal(identity.category, 'vessel');
  assert.equal(identity.region, 'pelvis');
  assert.equal(identity.bundle, 'pelvis-vessels-recovery');
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
  assert.equal(group, expected.get(identity.fmaId));
}
const git = (args, options = {}) => execFileSync('git', args, {
  windowsHide: true, encoding: 'utf8', maxBuffer: 32e6, ...options,
});
const gitBytes = (commit, path) => git(['show', `${commit}:${path}`], {encoding: null});
assert.deepEqual(readFileSync(pinsPath), gitBytes(baseline, pinsPath), 'Reuse the six existing pins');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const old = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({
  stdin: {
    contents: "export {iliacVenousXrayLesson} from './lib/iliac-venous-xray';" +
      "export {iliacVenousXrayTopics} from './content/iliac-venous-xray';" +
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
  }, bundle: true, write: false, platform: 'node', format: 'esm',
});
const current = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
assert.deepEqual(Object.keys(current.iliacVenousXrayTopics).sort(),
  ['common', 'external', 'internal']);
for (const group of expected.values()) {
  const topic = current.iliacVenousXrayTopics[group];
  assert.equal(typeof topic.title, 'string'); assert(topic.title.trim());
  assert.equal(typeof topic.body, 'string'); assert(topic.body.trim());
  assert(Array.isArray(topic.bullets) && topic.bullets.length > 0);
  assert(topic.bullets.every(b => typeof b === 'string' && b.trim()));
  assert(Array.isArray(topic.citations) && topic.citations.length > 0);
  assert(topic.citations.every(url => /^https:\/\//.test(url)));
  assert.equal(new Set(topic.citations).size, topic.citations.length);
}

const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const raw = JSON.parse(readFileSync(catalogPath, 'utf8'));
const catalog = current.bodyDisplayCatalog(raw);
assert.deepEqual(catalog.structures.filter(s => identities.has(s.id)),
  pins.entries.map(e => e.identity));
for (const {identity, group} of pins.entries) {
  const topic = current.iliacVenousXrayTopics[group];
  assert.equal(old.bodyLesson(identity, 'xray').readiness, 'pending');
  const selected = current.iliacVenousXrayLesson(identity, 'xray');
  const shown = current.bodyLesson(identity, 'xray');
  assert.deepEqual(shown, selected);
  assert.equal(shown.readiness, 'draft');
  assert.equal(shown.body, topic.body);
  assert.deepEqual(shown.citations, topic.citations);
  assert(shown.bullets.length >= topic.bullets.length);
  assert(topic.bullets.every(b => shown.bullets.includes(b)));
  const prose = [shown.title, shown.body, ...shown.bullets, shown.note].join(' ');
  assert.match(prose, /(?:contrast|catheter).*(?:venograph|x-ray|fluoroscop)|(?:venograph|x-ray|fluoroscop).*(?:contrast|catheter)/i);
  assert.match(prose, /(?:plain|routine|ordinary|conventional).*(?:radiograph|x-ray)|(?:radiograph|x-ray).*(?:plain|routine|ordinary|conventional)/i);
  assert.match(prose, /CT venograph|\bCTV\b/i);
  assert.match(prose, /MR venograph|\bMRV\b/i);
  assert.match(prose, /(?:no patient.{0,30}registration|not registered|no patient.space mapping)/i);
  assert.match(shown.note, /revision.bound radiologist.{0,30}pending/i);
  assert.doesNotMatch(prose, /(?:clinically approved|approved for clinical use|validated patient registration)/i);
  assert.doesNotMatch(prose, /(?:safe access route|recommended catheter route|diagnostic threshold is|validated procedural route)/i);
  const {readiness, ...content} = shown;
  assert.deepEqual(current.bodyContent(identity, 'xray'), content);
  for (const tab of current.contentTabs) if (tab !== 'xray')
    assert.equal(current.iliacVenousXrayLesson(identity, tab), undefined);
  const clean = structuredClone(selected);
  selected.bullets.push('foreign'); selected.citations.push('https://foreign.example');
  assert.deepEqual(current.iliacVenousXrayLesson(identity, 'xray'), clean,
    'Fresh lesson arrays');
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
    assert.equal(current.iliacVenousXrayLesson(bad, 'xray'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const bad = structuredClone(identity); at(bad, path).push('foreign');
    assert.equal(current.iliacVenousXrayLesson(bad, 'xray'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const bad = structuredClone(identity); at(bad, path).unexpected = true;
    assert.equal(current.iliacVenousXrayLesson(bad, 'xray'), undefined, path.join('.') || '<root>');
    refusedIdentities++;
  }
}

const featureCommit = git(['log', '--diff-filter=A', '-1', '--format=%H', '--',
  'content/iliac-venous-xray.ts']).trim();
// After the feature lands, replay that exact commit so later unrelated teaching does not
// change the strict, whole-catalog transition assertion.
const feature = featureCommit
  ? await exactSourceHistoryApi(featureCommit, 'review-security') : current;
const featureRaw = featureCommit
  ? JSON.parse(gitBytes(featureCommit, catalogPath)) : raw;
const featureCatalog = feature.bodyDisplayCatalog(featureRaw);
const oldRaw = JSON.parse(gitBytes(baseline, catalogPath));
assert.deepEqual(featureCatalog, old.bodyDisplayCatalog(oldRaw));
assert.deepEqual(feature.structures, old.structures);
assert.deepEqual(feature.dissectionProfiles, old.dissectionProfiles);
assert.deepEqual(feature.regionalTours, old.regionalTours);
assert.deepEqual(feature.contentTabs, old.contentTabs);
assert.equal(featureCatalog.structures.length * feature.contentTabs.length, 9936);
assert.equal(featureCatalog.bundles.length, 109);
let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let malformed = 0, stale = 0, forgedSaves = 0, forgedApprovals = 0, storageCalls = 0;
for (const structure of featureCatalog.structures) {
  for (const tab of feature.contentTabs) {
    const previous = old.bodyLesson(structure, tab), lesson = feature.bodyLesson(structure, tab);
    if (identities.has(structure.id) && tab === 'xray') {
      assert.equal(previous.readiness, 'pending');
      assert.equal(lesson.readiness, 'draft');
      changed++;
    } else {
      assert.deepEqual(lesson, previous, `${structure.id}:${tab}`);
      preserved++;
    }
  }
  const previousPacket = await old.bodyReviewMaterial(structure.id);
  const packet = await feature.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval, false);
  assert.deepEqual(packet.reasoning, previousPacket.reasoning, `${structure.id}: reasoning`);
  if (identities.has(structure.id)) {
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], previousPacket[key], `${structure.id}:${key}`);
    assert.equal(packet.fingerprints.source, previousPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, previousPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, previousPacket.materialHash);
    assert.deepEqual(packet.topics.find(row => row.tab === 'xray'),
      {tab: 'xray', ...feature.bodyLesson(structure, 'xray')});
    assert.deepEqual(await feature.parseBodyReviewResponse(packet, structure.id), packet);
    assert.equal(await feature.parseBodyReviewResponse(previousPacket, structure.id), null);
    for (const edit of [
      value => { value.topics.find(row => row.tab === 'xray').body += ' foreign'; },
      value => { value.topics.find(row => row.tab === 'xray').bullets[0] += ' foreign'; },
      value => { value.topics.find(row => row.tab === 'xray').citations = ['https://foreign.example']; },
      value => { value.topics.find(row => row.tab === 'xray').readiness = 'approved'; },
      value => { value.topics.splice(value.topics.findIndex(row => row.tab === 'xray'), 1); },
    ]) {
      const forged = structuredClone(packet); edit(forged);
      assert.equal(await feature.parseBodyReviewResponse(forged, structure.id), null);
      malformed++;
    }
    const priorContext = await old.bodyReviewContext(structure.id);
    const context = await feature.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash, priorContext.sourceHash);
    assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
    const decision = {
      catalogScope: context.catalogScope, structureId: structure.id, track: 'teaching',
      expectedVersion: 0, materialHash: context.materialHash,
      revisionHash: context.revisions.teaching, checklistVersion: context.checklistVersion,
      draft: feature.blankBodyReview(context, 'teaching'),
    };
    const save = async input => feature.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_ILIAC_VENOUS_XRAY'}, body: JSON.stringify(input),
    }), {prepare() { storageCalls++; throw Error('Invalid decision reached storage'); }});
    for (const hashes of [
      {materialHash: priorContext.materialHash, revisionHash: priorContext.revisions.teaching},
      {materialHash: priorContext.materialHash},
      {revisionHash: priorContext.revisions.teaching},
    ]) {
      assert.equal((await save({...decision, ...hashes})).status, 409);
      stale++;
    }
    const forged = structuredClone(decision); forged.draft.checks.foreign = true;
    assert.equal((await save(forged)).status, 422);
    const approval = structuredClone(decision); approval.draft.status = 'approved';
    assert.equal((await save(approval)).status, 422);
    forgedApprovals++;
    forgedSaves++; changedPackets++;
  } else {
    assert.deepEqual(packet, previousPacket, `${structure.id}: Review packet`);
    preservedPackets++;
  }
}
assert.equal(changed, 6);
assert.equal(preserved, 9930);
assert.equal(changedPackets, 6);
assert.equal(preservedPackets, 1098);
assert.equal(malformed, 30);
assert.equal(stale, 18);
assert.equal(forgedSaves, 6);
assert.equal(forgedApprovals, 6);
assert.equal(storageCalls, 0);
for (const bundle of featureCatalog.bundles) {
  const path = 'public' + bundle.url.split('?')[0];
  const bytes = featureCommit ? gitBytes(featureCommit, path) : readFileSync(path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  assert.deepEqual(bytes, gitBytes(baseline, path), `${path} remains unchanged`);
}
console.log(JSON.stringify({baseline, featureCommit: featureCommit || 'working-tree',
  changed, preserved, changedPackets, preservedPackets, refusedIdentities,
  malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale,
  forgedSavesRefusedBeforeStorage: forgedSaves,
  forgedApprovalsRefusedBeforeStorage: forgedApprovals, storageCalls,
  sourceBundlesUnchanged: featureCatalog.bundles.length, clinicalApproval: false}));
