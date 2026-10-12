import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = '8c644c4ebb59510da8bdb33930f615dcd441447e';
const expected = new Map([
  ['vm:anatomy:body:abdomen:unspecified:vessel:hepatic-portal-vein', 'FMA50735'],
  ['vm:anatomy:body:abdomen:unspecified:vessel:splenic-vein', 'FMA14331'],
  ['vm:anatomy:body:abdomen:unspecified:vessel:superior-mesenteric-vein', 'FMA14332'],
  ['vm:anatomy:body:abdomen:unspecified:vessel:inferior-mesenteric-vein', 'FMA15391'],
]);
const pinsPaths = ['content/central-vessel-imaging-pins.json', 'content/abdominal-branch-imaging-pins.json'];
const sourceFiles = new Map([
  ['FMA50735', ['FJ1853']], ['FMA14331', ['FJ3641']],
  ['FMA14332', ['FJ3647']], ['FMA15391', ['FJ3443']],
]);
const bundles = new Map([
  ['FMA50735', 'abdomen-vessels-recovery'], ['FMA14331', 'portal-veins'],
  ['FMA14332', 'abdomen-vessels-mesenteric'], ['FMA15391', 'abdomen-vessels-mesenteric'],
]);
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const git = (args, options = {}) => execFileSync('git', args, {
  windowsHide: true, encoding: 'utf8', maxBuffer: 32e6, ...options,
});
const gitBytes = (commit, path) => git(['show', `${commit}:${path}`], {encoding: null});
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
// Legacy pin checkouts may use CRLF; compare their complete text with Git's LF
// blobs without relaxing JSON fields or binary source checks.
const pinText = bytes => Buffer.from(bytes).toString('utf8').replaceAll('\r\n', '\n');
for (const path of pinsPaths) assert.equal(pinText(readFileSync(path)), pinText(gitBytes(baseline, path)), 'Source pins unchanged');
const identities = pinsPaths.flatMap(path => JSON.parse(readFileSync(path, 'utf8')).entries.map(row => row.identity))
  .filter(identity => expected.has(identity.id));
assert.equal(identities.length, 4);
assert.deepEqual(new Map(identities.map(s => [s.id, s.fmaId])), expected);
for (const identity of identities) {
  assert.equal(identity.nodeName, expected.get(identity.id));
  assert.equal(identity.region, 'abdomen');
  assert.equal(identity.laterality, identity.id.split(':')[4]);
  assert.equal(identity.system, 'vessels');
  assert.equal(identity.category, 'vessel');
  assert.deepEqual(identity.sources.map(source => source.file), sourceFiles.get(identity.fmaId));
  assert.equal(identity.bundle, bundles.get(identity.fmaId));
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
}


function assertPortalSemantics(prose, group) {
  assert.match(prose, /contrast.{0,100}(?:venogra|portogra)|(?:venogra|portogra).{0,100}contrast/i);
  assert.match(prose, /plain.{0,40}(?:radiograph|X.ray)/i);
  assert.match(prose, /\bCTV\b|CT venogra/i);
  assert.match(prose, /\bMRV\b|MR venogra/i);
  assert.match(prose, /Doppler/i);
  assert.match(prose, /projection/i);
  assert.match(prose, /(?:source|retained).{0,100}(?:laterality|unspecified)/i);
  assert.match(prose, /(?:not|no|cannot|does not).{0,100}patient.{0,20}(?:side|marker)|patient.{0,20}(?:side|marker).{0,100}(?:not|no|cannot|does not)/i);
  assert.match(prose, /(?:no|not|without).{0,100}acquired/i);
  assert.match(prose, /(?:no|not|without).{0,100}(?:publisher|publication).{0,30}(?:image|media)/i);
  assert.match(prose, /(?:no|not|cannot|does not).{0,140}(?:registration|patient.space)/i);
  assert.match(prose, /(?:no|not|cannot|does not).{0,140}(?:simulat.{0,30}flow|flow.{0,30}simulat)/i);
  assert.match(prose, /(?:no|not|cannot|does not).{0,140}(?:procedur|route|catheter.placement)/i);
  assert.match(prose, /(?:no|not|cannot|does not).{0,140}clinical approval/i);
  assert.match(prose, /revision.bound radiologist.{0,60}pending/i);
  assert.match(prose, /independent/i);
  assert.match(prose, /Atlas/i); assert.match(prose, /case/i); assert.match(prose, /lecture/i);
  assert.doesNotMatch(prose, /approved for clinical use|recommended catheter route|diagnostic threshold is/i);
  if (group === 'hepatic-portal-vein') {
    assert.match(prose, /usual|typically|normally/i);
    assert.match(prose, /(?:SMV|superior mesenteric).{0,100}splenic|splenic.{0,100}(?:SMV|superior mesenteric)/i);
    assert.match(prose, /confluence/i);
    assert.match(prose, /hepatic.{0,80}(?:vein|drainage)/i);
    assert.match(prose, /distinct|separate|not/i);
  } else if (group === 'splenic-vein') {
    assert.match(prose, /hil(?:ar|um)/i); assert.match(prose, /confluence/i);
    assert.match(prose, /(?:not|no|cannot|does not|must not).{0,120}collateral|collateral.{0,120}(?:not|no|cannot|does not|must not)/i);
  } else if (group === 'superior-mesenteric-vein') {
    assert.match(prose, /superior mesenteric artery|\bSMA\b/i);
    assert.match(prose, /distinct|separate|not/i);
    assert.match(prose, /49/); assert.match(prose, /non.malignant/i);
    assert.match(prose, /acute/i); assert.match(prose, /retrospective/i);
    assert.match(prose, /splanchnic|\bSVT\b/i);
    assert.match(prose, /direct.{0,30}portogra/i);
  } else {
    assert.match(prose, /four|\b4\b/i);
    assert.match(prose, /portal vein thrombosis|\bPVT\b/i);
    assert.match(prose, /cavern/i);
    assert.match(prose, /(?:only|one|1).{0,100}(?:IMV|inferior mesenteric).{0,100}access|access.{0,100}(?:one|1)/i);
    assert.match(prose, /(?:not|no|cannot|does not).{0,120}(?:routine|visibility|route)/i);
  }
}

const old = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({
  stdin: {contents:
    "export {portalVenousXrayLesson} from './lib/portal-venous-xray';" +
    "export {portalVenousXrayTopics} from './content/portal-venous-xray';" +
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
    resolveDir: process.cwd(), loader: 'ts'},
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const current = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw = JSON.parse(readFileSync(catalogPath, 'utf8'));
assert.deepEqual(readFileSync(catalogPath), gitBytes(baseline, catalogPath), 'Live source catalog unchanged');
const catalog = current.bodyDisplayCatalog(raw);
assert.deepEqual(new Map(catalog.structures.filter(s => expected.has(s.id)).map(s => [s.id, s])), new Map(identities.map(s => [s.id, s])));
const cleanLessons = new Map();
assert.deepEqual(Object.keys(current.portalVenousXrayTopics).sort(),
  ['hepatic-portal-vein', 'inferior-mesenteric-vein', 'splenic-vein', 'superior-mesenteric-vein']);
for (const identity of identities) {
const selected = current.portalVenousXrayLesson(identity, 'xray');
const topic = current.portalVenousXrayTopics[identity.id.split(':').at(-1)];
assert.deepEqual(current.bodyLesson(identity, 'xray'), selected);
assert.equal(selected.readiness, 'draft');
assert.equal(selected.title, `${identity.name} · ${topic.title} · draft`);
assert.equal(selected.body, topic.body);
assert(topic.bullets.every(b => selected.bullets.includes(b)));
assert.deepEqual(selected.citations, topic.citations);
assert(selected.title && selected.body && selected.bullets.length >= 2);
assert(selected.bullets.every(b => typeof b === 'string' && b.trim()));
assert(selected.citations.includes('https://www.radiologyinfo.org/en/info/angiocath'));
assert(selected.citations.includes(identity.fmaId === 'FMA15391'
  ? 'https://pubmed.ncbi.nlm.nih.gov/33230650/' : 'https://doi.org/10.1371/journal.pone.0261499'));
assert(selected.citations.includes('https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-abdomen/'));
assert(selected.citations.every(url => /^https:\/\//.test(url)));
assert.equal(new Set(selected.citations).size, selected.citations.length);
const prose = [selected.title, selected.body, ...selected.bullets, selected.note].join(' ');
assertPortalSemantics(prose, identity.id.split(':').at(-1));
const {readiness, ...content} = selected;
assert.deepEqual(current.bodyContent(identity, 'xray'), content);
const clean = structuredClone(selected);
cleanLessons.set(identity.id, clean);
selected.bullets.push('foreign'); selected.citations.push('https://foreign.example');
assert.deepEqual(current.portalVenousXrayLesson(identity, 'xray'), clean, 'Fresh arrays');
for (const tab of current.contentTabs) if (tab !== 'xray')
  assert.equal(current.portalVenousXrayLesson(identity, tab), undefined);
}

for (const structure of catalog.structures) if (!expected.has(structure.id))
  for (const tab of current.contentTabs)
    assert.equal(current.portalVenousXrayLesson(structure, tab), undefined, `${structure.id}:${tab}`);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
const refuse = (bad, label) => {
  assert.equal(current.portalVenousXrayLesson(bad, 'xray'), undefined, label);
  refusedIdentities++;
};
for (const identity of identities) {
for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
  const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
  const key = path.at(-1), original = parent[key];
  parent[key] = typeof original === 'string' ? original + '-foreign'
    : typeof original === 'number' ? original + 0.01 : original === null ? 'foreign' : !original;
  refuse(bad, path.join('.'));
}
for (const path of pathsWhere(identity, Array.isArray)) {
  const bad = structuredClone(identity); at(bad, path).push('foreign');
  refuse(bad, path.join('.') + ': append');
}
for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
  const bad = structuredClone(identity); at(bad, path).unexpected = true;
  refuse(bad, (path.join('.') || '<root>') + ': extra field');
  for (const key of Object.keys(at(identity, path))) {
    const omitted = structuredClone(identity); delete at(omitted, path)[key];
    refuse(omitted, [...path, key].join('.') + ': omitted');
  }
}
}

// Freeze the admission transition after landing; independent later drafts may
// advance other structures. Still compare all four live targets' complete display/packet.
const featureCommit = git(['log', '--diff-filter=A', '-1', '--format=%H', '--',
  'content/portal-venous-xray.ts']).trim();
const feature = featureCommit ? await exactSourceHistoryApi(featureCommit, 'review-security') : current;
const featureRaw = featureCommit ? JSON.parse(gitBytes(featureCommit, catalogPath)) : raw;
const featureCatalog = feature.bodyDisplayCatalog(featureRaw);
for (const path of pinsPaths) {
  const bytes = featureCommit ? gitBytes(featureCommit, path) : readFileSync(path);
  assert.equal(pinText(bytes), pinText(gitBytes(baseline, path)), `${path}: admission source pins unchanged`);
}
assert.deepEqual(featureRaw, JSON.parse(gitBytes(baseline, catalogPath)));
assert.deepEqual(featureCatalog, old.bodyDisplayCatalog(JSON.parse(gitBytes(baseline, catalogPath))));
assert.deepEqual(feature.structures, old.structures);
assert.deepEqual(feature.dissectionProfiles, old.dissectionProfiles);
assert.deepEqual(feature.regionalTours, old.regionalTours);
assert.deepEqual(feature.contentTabs, old.contentTabs);
for (const path of ['app/anatomy-data.ts', 'app/dissection-data.ts', 'lib/regional-tours.ts']) {
  const bytes = featureCommit ? gitBytes(featureCommit, path) : readFileSync(path);
  assert.deepEqual(bytes, gitBytes(baseline, path), `${path}: admission guide/source bytes unchanged`);
  assert.deepEqual(readFileSync(path), bytes, `${path}: live guide/source bytes unchanged`);
}
assert.equal(featureCatalog.structures.length, 1104);
assert.equal(feature.contentTabs.length, 9);
assert.equal(featureCatalog.structures.length * feature.contentTabs.length, 9936);
for (const identity of identities) {
  for (const tab of current.contentTabs)
    assert.deepEqual(current.bodyLesson(identity, tab), feature.bodyLesson(identity, tab), `${identity.id}:${tab}: live`);
  assert.deepEqual(await current.bodyReviewMaterial(identity.id), await feature.bodyReviewMaterial(identity.id), `${identity.id}: live packet`);
}
let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let malformed = 0, stale = 0, forgedSaves = 0, forgedApprovals = 0, storageCalls = 0;
for (const structure of featureCatalog.structures) {
  for (const tab of feature.contentTabs) {
    const previous = old.bodyLesson(structure, tab), lesson = feature.bodyLesson(structure, tab);
    if (expected.has(structure.id) && tab === 'xray') {
      assert.equal(previous.readiness, 'pending');
      assert.equal(lesson.readiness, 'draft');
      assert.deepEqual(lesson, cleanLessons.get(structure.id));
      changed++;
    } else {
      assert.deepEqual(lesson, previous, `${structure.id}:${tab}`);
      preserved++;
    }
  }
  const previousPacket = await old.bodyReviewMaterial(structure.id);
  const packet = await feature.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval, false);
  if (expected.has(structure.id)) {
    const id = structure.id;
    assert.deepEqual(packet.topics.filter(row => row.tab !== 'xray'),
      previousPacket.topics.filter(row => row.tab !== 'xray'), 'All other Review tabs');
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], previousPacket[key], `${id}:${key}`);
    assert.equal(packet.fingerprints.source, previousPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, previousPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, previousPacket.materialHash);
    assert.deepEqual(packet.topics.find(row => row.tab === 'xray'),
      {tab: 'xray', ...feature.bodyLesson(structure, 'xray')});
    assert.deepEqual(await feature.parseBodyReviewResponse(packet, id), packet);
    assert.equal(await feature.parseBodyReviewResponse(previousPacket, id), null);
    for (const edit of [
      value => { value.topics.find(row => row.tab === 'xray').body += ' foreign'; },
      value => { value.topics.find(row => row.tab === 'xray').bullets[0] += ' foreign'; },
      value => { value.topics.find(row => row.tab === 'xray').citations = ['https://foreign.example']; },
      value => { value.topics.find(row => row.tab === 'xray').readiness = 'approved'; },
      value => { value.topics.splice(value.topics.findIndex(row => row.tab === 'xray'), 1); },
      value => { value.source.structure.sources[0].sha256 = '0'.repeat(64); },
    ]) {
      const forged = structuredClone(packet); edit(forged);
      assert.equal(await feature.parseBodyReviewResponse(forged, id), null);
      malformed++;
    }
    const priorContext = await old.bodyReviewContext(id), context = await feature.bodyReviewContext(id);
    assert.equal(context.sourceHash, priorContext.sourceHash);
    assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
    const decision = {
      catalogScope: context.catalogScope, structureId: id, track: 'teaching', expectedVersion: 0,
      materialHash: context.materialHash, revisionHash: context.revisions.teaching,
      checklistVersion: context.checklistVersion, draft: feature.blankBodyReview(context, 'teaching'),
    };
    const save = async input => feature.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_PORTAL_VENOUS_XRAY'}, body: JSON.stringify(input),
    }), {prepare() { storageCalls++; throw Error('Invalid decision reached storage'); }});
    for (const hashes of [
      {materialHash: priorContext.materialHash, revisionHash: priorContext.revisions.teaching},
      {materialHash: priorContext.materialHash}, {revisionHash: priorContext.revisions.teaching},
    ]) {
      assert.equal((await save({...decision, ...hashes})).status, 409);
      stale++;
    }
    const forged = structuredClone(decision); forged.draft.checks.foreign = true;
    assert.equal((await save(forged)).status, 422); forgedSaves++;
    const approval = structuredClone(decision); approval.draft.status = 'approved';
    assert.equal((await save(approval)).status, 422); forgedApprovals++;
    changedPackets++;
  } else {
    assert.deepEqual(packet, previousPacket, `${structure.id}: Review packet`);
    preservedPackets++;
  }
}
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [4, 9932, 4, 1100]);
assert.deepEqual([malformed, stale, forgedSaves, forgedApprovals, storageCalls], [24, 12, 4, 4, 0]);
for (const bundle of featureCatalog.bundles) {
  const path = 'public' + bundle.url.split('?')[0];
  const bytes = featureCommit ? gitBytes(featureCommit, path) : readFileSync(path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  assert.deepEqual(bytes, gitBytes(baseline, path), `${path}: source geometry unchanged`);
  assert.deepEqual(readFileSync(path), bytes, `${path}: live source geometry unchanged`);
}
console.log(JSON.stringify({baseline, featureCommit: featureCommit || 'working-tree',
  changed, preserved, changedPackets, preservedPackets, refusedIdentities,
  malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale,
  forgedSavesRefusedBeforeStorage: forgedSaves, forgedApprovalsRefusedBeforeStorage: forgedApprovals,
  storageCalls, sourceBundlesUnchanged: featureCatalog.bundles.length, clinicalApproval: false}));
