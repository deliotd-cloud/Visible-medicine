import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = '6c4c9d093b57f232f8d5bb597e65a31ab4709845';
const expected = new Map([
  ['vm:anatomy:body:abdomen:unspecified:vessel:inferior-vena-cava', 'FMA10951'],
  ['vm:anatomy:body:abdomen:right:vessel:right-hepatic-vein', 'FMA14338'],
  ['vm:anatomy:body:abdomen:left:vessel:left-hepatic-vein', 'FMA14339'],
  ['vm:anatomy:body:abdomen:unspecified:vessel:middle-hepatic-vein', 'FMA14340'],
]);
const sourceFiles = new Map([
  ['FMA10951', ['FJ3441', 'FJ3659']], ['FMA14338', ['FJ2416']],
  ['FMA14339', ['FJ2415']], ['FMA14340', ['FJ2414']],
]);
const bundles = new Map([
  ['FMA10951', 'abdomen-vessels-recovery'], ['FMA14338', 'abdomen-vessels-recovery'],
  ['FMA14339', 'abdomen-vessels-recovery'], ['FMA14340', 'hepatic-veins'],
]);
const pinsPath = 'content/central-vessel-imaging-pins.json';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const git = (args, options = {}) => execFileSync('git', args, {
  windowsHide: true, encoding: 'utf8', maxBuffer: 32e6, ...options,
});
const gitBytes = (commit, path) => git(['show', `${commit}:${path}`], {encoding: null});
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
// Local text checkouts may have CRLF; preserve complete JSON comparison against Git.
const pinText = bytes => Buffer.from(bytes).toString('utf8').replaceAll('\r\n', '\n');
assert.equal(pinText(readFileSync(pinsPath)), pinText(gitBytes(baseline, pinsPath)),
  'The full central-vessel source pin file remains unchanged');
const pins = JSON.parse(readFileSync(pinsPath, 'utf8'));
const identities = pins.entries.map(entry => entry.identity).filter(identity => expected.has(identity.id));
assert.equal(identities.length, 4);
assert.deepEqual(new Map(identities.map(identity => [identity.id, identity.fmaId])), expected);
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

function assertTeachingSemantics(prose, group) {
  assert.match(prose, /plain.{0,60}(?:radiograph|X.ray)/i);
  assert.match(prose, /contrast.{0,120}(?:venograph|X.ray|DSA)|(?:venograph|DSA).{0,120}contrast/i);
  assert.match(prose, /(?:digital subtraction|\bDSA\b)/i);
  assert.match(prose, /(?:CT venograph|\bCTV\b)/i);
  assert.match(prose, /(?:MR venograph|\bMRV\b)/i);
  assert.match(prose, /Doppler/i);
  assert.match(prose, /projection/i);
  assert.match(prose, /(?:source|retained).{0,100}(?:laterality|unspecified|side)/i);
  assert.match(prose, /(?:screen|display).{0,70}(?:not|no|cannot|does not).{0,70}(?:patient|anatomic|source)|(?:patient|anatomic|source).{0,70}(?:side|laterality).{0,70}(?:not|no|cannot|does not).{0,70}(?:screen|display)/i);
  assert.match(prose, /(?:no|not|without).{0,100}acquired/i);
  assert.match(prose, /(?:no|not|without).{0,100}(?:publisher|publication).{0,30}(?:image|media)/i);
  assert.match(prose, /(?:no|not|cannot|does not).{0,140}(?:registration|patient.space)/i);
  assert.match(prose, /(?:no|not|cannot|does not).{0,140}(?:flow|pressure)/i);
  assert.match(prose, /(?:no|not|cannot|does not).{0,140}(?:procedur|route|catheter.placement)/i);
  assert.match(prose, /(?:no|not|cannot|does not).{0,140}clinical approval/i);
  assert.match(prose, /revision.bound radiologist.{0,60}pending/i);
  assert.match(prose, /independent/i);
  assert.match(prose, /Atlas/i); assert.match(prose, /case/i); assert.match(prose, /lecture/i);
  assert.doesNotMatch(prose, /approved for clinical use|recommended catheter route|diagnostic threshold is/i);
  if (group === 'inferior-vena-cava') {
    assert.match(prose, /108/);
    assert.match(prose, /referral|referred/i);
    assert.match(prose, /cavograph/i);
    assert.match(prose, /selective renal venograph/i);
    assert.match(prose, /(?:variant|missing|absence)/i);
  } else {
    assert.match(prose, /102/);
    assert.match(prose, /portal hypertension/i);
    assert.match(prose, /\bTIPS\b/i);
    assert.match(prose, /balloon[ -]occlusion/i);
    assert.match(prose, /(?:selected|retrospective|cohort)/i);
    assert.match(prose, /(?:not|no|cannot|does not).{0,120}(?:routine|normal|threshold)/i);
    if (group === 'right-hepatic-vein') {
      assert.match(prose, /accessory right hepatic vein/i);
      assert.match(prose, /variable hepatic venous openings/i);
    } else {
      assert.match(prose, /(?:middle|left).{0,80}(?:common trunk|shared trunk)|common trunk.{0,80}(?:middle|left)/i);
      assert.match(prose, /(?:variation|variable|not an? invariant|not universal)/i);
    }
  }
}

const old = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({
  stdin: {contents:
    "export {hepaticVenousXrayLesson} from './lib/hepatic-venous-xray';" +
    "export {hepaticVenousXrayTopics} from './content/hepatic-venous-xray';" +
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
assert.deepEqual(readFileSync(catalogPath), gitBytes(baseline, catalogPath),
  'Live source catalog unchanged');
const catalog = current.bodyDisplayCatalog(raw);
assert.deepEqual(new Map(catalog.structures.filter(s => expected.has(s.id)).map(s => [s.id, s])),
  new Map(identities.map(s => [s.id, s])));
assert.deepEqual(Object.keys(current.hepaticVenousXrayTopics).sort(),
  ['inferior-vena-cava', 'left-hepatic-vein', 'middle-hepatic-vein', 'right-hepatic-vein']);
const cleanLessons = new Map();
for (const identity of identities) {
  const group = identity.id.split(':').at(-1);
  const selected = current.hepaticVenousXrayLesson(identity, 'xray');
  const topic = current.hepaticVenousXrayTopics[group];
  assert.deepEqual(current.bodyLesson(identity, 'xray'), selected);
  assert.equal(selected.readiness, 'draft');
  assert.equal(selected.title, `${identity.name} · ${topic.title} · draft`);
  assert.equal(selected.body, topic.body);
  assert(topic.bullets.every(bullet => selected.bullets.includes(bullet)));
  assert.deepEqual(selected.citations, topic.citations);
  assert(selected.title && selected.body && selected.bullets.length >= 2);
  assert(selected.bullets.every(bullet => typeof bullet === 'string' && bullet.trim()));
  for (const source of [
    'https://www.radiologyinfo.org/en/info/venography',
    'https://pubmed.ncbi.nlm.nih.gov/20177869/',
    group === 'inferior-vena-cava'
      ? 'https://pubmed.ncbi.nlm.nih.gov/8541675/'
      : 'https://www.wjgnet.com/2307-8960/full/v10/i14/4460.htm',
  ]) assert(selected.citations.includes(source), `${group}: ${source}`);
  assert(selected.citations.every(url => /^https:\/\//.test(url)));
  assert.equal(new Set(selected.citations).size, selected.citations.length);
  assertTeachingSemantics([selected.title, selected.body, ...selected.bullets, selected.note].join(' '), group);
  const {readiness, ...content} = selected;
  assert.deepEqual(current.bodyContent(identity, 'xray'), content);
  const clean = structuredClone(selected);
  cleanLessons.set(identity.id, clean);
  selected.bullets.push('foreign'); selected.citations.push('https://foreign.example');
  assert.deepEqual(current.hepaticVenousXrayLesson(identity, 'xray'), clean, 'Fresh lesson arrays');
  for (const tab of current.contentTabs) if (tab !== 'xray')
    assert.equal(current.hepaticVenousXrayLesson(identity, tab), undefined);
}
for (const structure of catalog.structures) if (!expected.has(structure.id))
  for (const tab of current.contentTabs)
    assert.equal(current.hepaticVenousXrayLesson(structure, tab), undefined, `${structure.id}:${tab}`);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
const refuse = (bad, label) => {
  assert.equal(current.hepaticVenousXrayLesson(bad, 'xray'), undefined, label);
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

// Replay the completed admission after commit. Later independent teaching may evolve.
const featureCommit = git(['log', '--diff-filter=A', '-1', '--format=%H', '--',
  'content/hepatic-venous-xray.ts']).trim();
const feature = featureCommit ? await exactSourceHistoryApi(featureCommit, 'review-security') : current;
const featureRaw = featureCommit ? JSON.parse(gitBytes(featureCommit, catalogPath)) : raw;
const featureCatalog = feature.bodyDisplayCatalog(featureRaw);
const featurePins = featureCommit ? gitBytes(featureCommit, pinsPath) : readFileSync(pinsPath);
assert.equal(pinText(featurePins), pinText(gitBytes(baseline, pinsPath)),
  'Admission source pins unchanged');
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
  assert.deepEqual(current.bodyLesson(identity, 'xray'), feature.bodyLesson(identity, 'xray'),
    `${identity.id}: live X-ray lesson`);
  const livePacket = await current.bodyReviewMaterial(identity.id);
  const admittedPacket = await feature.bodyReviewMaterial(identity.id);
  assert.deepEqual(livePacket.source, admittedPacket.source, `${identity.id}: live source`);
  assert.deepEqual(livePacket.topics.find(row => row.tab === 'xray'),
    admittedPacket.topics.find(row => row.tab === 'xray'), `${identity.id}: live X-ray packet`);
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
        'oai-authenticated-user-id': 'SYNTHETIC_HEPATIC_VENOUS_XRAY'}, body: JSON.stringify(input),
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
