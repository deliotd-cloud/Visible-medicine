import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = 'dc173440a953cf699874950fb593e1d4f6d46fa8';
const vesselPins = 'content/abdominal-branch-imaging-pins.json';
const connectivePins = 'content/abdominal-connective-quiz-pins.json';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const prefix = 'vm:anatomy:body:abdomen:';
// slug, FMA, bundle, exact source files, and source-side/category. No grouped
// file is promoted into a named child structure or assigned a new side.
const targets = [
  ['unspecified:vessel:appendicular-artery', 'FMA14818', 'abdomen-vessels-mesenteric', 'FJ3410'],
  ['unspecified:vessel:ascending-branch-of-inferior-branch-of-ileocolic-artery', 'FMA14820', 'abdomen-vessels-mesenteric', 'FJ3414'],
  ['unspecified:vessel:ileal-vein', 'FMA15405', 'abdomen-vessels-mesenteric', 'FJ3438'],
  ['left:vessel:left-inferior-epigastric-artery', 'FMA20689', 'inferior-epigastric-vessels', 'FJ3511'],
  ['left:vessel:left-inferior-epigastric-vein', 'FMA21164', 'inferior-epigastric-vessels', 'FJ3512'],
  ['midline:vessel:middle-colic-vein', 'FMA15406', 'abdomen-vessels-mesenteric', 'FJ3543'],
  ['unspecified:vessel:pancreaticoduodenal-vein', 'FMA15398', 'abdomen-vessels-visceral-detail', 'FJ3545', 'FJ3646', 'FJ3655'],
  ['right:vessel:right-colic-vein', 'FMA15407', 'abdomen-vessels-mesenteric', 'FJ3591'],
  ['right:vessel:right-inferior-epigastric-artery', 'FMA20688', 'inferior-epigastric-vessels', 'FJ3604'],
  ['right:vessel:right-inferior-epigastric-vein', 'FMA21163', 'inferior-epigastric-vessels', 'FJ3605'],
  ['left:vessel:tributary-of-left-hepatic-vein', 'FMA15794', 'hepatic-veins', 'FJ3097', 'FJ3098', 'FJ3099', 'FJ3100', 'FJ3101'],
  ['right:vessel:tributary-of-right-hepatic-vein', 'FMA15791', 'hepatic-veins', 'FJ3118', 'FJ3119', 'FJ3120', 'FJ3121'],
  ['midline:fascia:linea-alba', 'FMA11336', 'abdomen-connective-axial-detail', 'FJ1448'],
  ['midline:membrane:mesentery-of-small-intestine', 'FMA14643', 'abdomen-connective-mesenteric', 'FJ3396'],
  ['unspecified:membrane:mesoappendix', 'FMA16549', 'abdomen-connective-mesenteric', 'FJ3397'],
  ['midline:membrane:transverse-mesocolon', 'FMA14647', 'abdomen-connective-mesenteric', 'FJ3398'],
];
const expected = new Map(targets.map(([suffix, fma, bundle, ...files]) =>
  [prefix + suffix, {fma, bundle, files, side: suffix.split(':')[0], category: suffix.split(':')[1]}]));
assert.equal(expected.size, 16);
const git = (args, options = {}) => execFileSync('git', args, {
  windowsHide: true, encoding: 'utf8', maxBuffer: 32e6, ...options,
});
const gitBytes = (commit, path) => git(['show', `${commit}:${path}`], {encoding: null});
const normalized = bytes => Buffer.from(bytes).toString('utf8').replaceAll('\r\n', '\n');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
for (const path of [vesselPins, connectivePins])
  assert.equal(normalized(readFileSync(path)), normalized(gitBytes(baseline, path)), `${path}: source pin unchanged`);
const pinned = [vesselPins, connectivePins].flatMap(path =>
  JSON.parse(readFileSync(path, 'utf8')).entries.map(row => row.identity)
    .filter(identity => expected.has(identity.id)));
assert.equal(pinned.length, 16);
assert.equal(new Set(pinned.map(identity => identity.id)).size, 16);
for (const identity of pinned) {
  const {fma, bundle, files, side, category} = expected.get(identity.id);
  assert.equal(identity.fmaId, fma);
  assert.equal(identity.nodeName, fma);
  assert.equal(identity.region, 'abdomen');
  assert.equal(identity.system, category === 'vessel' ? 'vessels' : 'connective');
  assert.equal(identity.category, category);
  assert.equal(identity.laterality, side);
  assert.equal(identity.bundle, bundle);
  assert.deepEqual(identity.sources.map(source => source.file), files);
  assert(identity.sources.every(source => /^[a-f0-9]{64}$/.test(source.sha256)));
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
}
const old = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({
  stdin: {contents:
    "export {abdominalDetailXrayLesson} from './lib/abdominal-detail-xray';" +
    "export {abdominalDetailVascularXrayTopics} from './content/abdominal-detail-vascular-xray';" +
    "export {abdominalDetailConnectiveXrayTopics} from './content/abdominal-detail-connective-xray';" +
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
const live = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw = JSON.parse(readFileSync(catalogPath, 'utf8'));
assert.deepEqual(readFileSync(catalogPath), gitBytes(baseline, catalogPath));
const catalog = live.bodyDisplayCatalog(raw);
assert.deepEqual(new Map(catalog.structures.filter(s => expected.has(s.id)).map(s => [s.id, s])),
  new Map(pinned.map(s => [s.id, s])));
const vascularIds = targets.slice(0, 12).map(row => row[0].split(':').at(-1));
const connectiveIds = targets.slice(12).map(row => row[0].split(':').at(-1));
assert.deepEqual(Object.keys(live.abdominalDetailVascularXrayTopics).sort(), vascularIds.sort());
assert.deepEqual(Object.keys(live.abdominalDetailConnectiveXrayTopics).sort(), connectiveIds.sort());

function assertCommon(prose) {
  assert.match(prose, /plain.{0,50}(radiograph|X.ray)/i);
  assert.match(prose, /contrast.{0,80}(X.ray|radiograph|angiograph|venograph)/i);
  assert.match(prose, /acquired/i);
  assert.match(prose, /(assembled|reassembl)/i);
  assert.match(prose, /explode/i);
  assert.match(prose, /depth/i);
  assert.match(prose, /source.{0,60}laterality/i);
  assert.match(prose, /(patient|screen).{0,35}(marker|side)|(marker|side).{0,35}(patient|screen)/i);
  assert.match(prose, /(no|not|without).{0,100}acquired/i);
  assert.match(prose, /(no|not|without).{0,100}(publisher.{0,20}media|media|image)/i);
  assert.match(prose, /(no|not|cannot|does not).{0,120}(registration|patient.space)/i);
  assert.match(prose, /(no|not|cannot|does not).{0,120}(flow|patency)/i);
  assert.match(prose, /(no|not|cannot|does not).{0,120}(procedure|route)/i);
  assert.match(prose, /(no|not|cannot|does not).{0,120}clinical approval/i);
  assert.match(prose, /revision.bound radiologist.{0,60}pending/i);
  assert.match(prose, /independent/i);
  for (const access of ['Atlas', 'case', 'lecture']) assert.match(prose, new RegExp(access, 'i'));
  assert.doesNotMatch(prose, /approved for clinical use|recommended catheter route|diagnostic threshold is/i);
}
function assertSpecific(prose, id) {
  if (id.includes(':vessel:')) {
    assert.match(prose, /(lumen|vessel).{0,100}(not|cannot|does not|no).{0,70}(plain|radiograph|X.ray)|(plain|radiograph|X.ray).{0,100}(not|cannot|does not|no).{0,70}(lumen|vessel)/i);
    assert.match(prose, /\bCTA\b|CT angiograph/i);
    assert.match(prose, /\bMRA\b|MR angiograph/i);
    assert.match(prose, /\bCTV\b|CT venograph/i);
    assert.match(prose, /\bMRV\b|MR venograph/i);
    assert.match(prose, /Doppler/i);
    if (id.includes('epigastric-artery')) assert.match(prose, /arterial|artery/i);
    if (id.includes('epigastric-vein')) assert.match(prose, /venous|vein/i);
    if (id.includes('pancreaticoduodenal') || id.includes('hepatic-vein'))
      assert.match(prose, /(group|source.label|source.selection|multiple source)/i);
  } else {
    assert.match(prose, /(soft.tissue|membrane|fascia)/i);
    assert.match(prose, /(not|no|cannot|does not).{0,100}(direct|delineat|show|visible)|(direct|delineat|show|visible).{0,100}(not|no|cannot|does not)/i);
    if (id.includes('mesenter') || id.includes('mesocolon') || id.includes('mesoappendix'))
      assert.match(prose, /(contrast.{0,60}bowel|bowel.{0,60}contrast)/i);
    assert.doesNotMatch(prose, /barium supplied|patient.correspondence established/i);
  }
}
const cleanLessons = new Map();
for (const identity of pinned) {
  const selected = live.abdominalDetailXrayLesson(identity, 'xray');
  const slug = identity.id.split(':').at(-1);
  const topic = identity.system === 'vessels'
    ? live.abdominalDetailVascularXrayTopics[slug]
    : live.abdominalDetailConnectiveXrayTopics[slug];
  assert.deepEqual(live.bodyLesson(identity, 'xray'), selected);
  assert.equal(selected.readiness, 'draft');
  assert.equal(selected.title, `${identity.name} · ${topic.title} · draft`);
  assert.equal(selected.body, topic.body);
  assert(topic.bullets.every(b => selected.bullets.includes(b)));
  assert.deepEqual(selected.citations, topic.citations);
  assert(selected.bullets.length >= 2 && selected.bullets.every(b => typeof b === 'string' && b.trim()));
  assert(selected.citations.length >= 2 && selected.citations.every(url => /^https:\/\//.test(url)));
  const prose = [selected.title, selected.body, ...selected.bullets, selected.note].join(' ');
  assertCommon(prose);
  assertSpecific(prose, identity.id);
  const {readiness, ...content} = selected;
  assert.deepEqual(live.bodyContent(identity, 'xray'), content);
  const clean = structuredClone(selected);
  cleanLessons.set(identity.id, clean);
  selected.bullets.push('foreign'); selected.citations.push('https://foreign.example');
  assert.deepEqual(live.abdominalDetailXrayLesson(identity, 'xray'), clean, 'Fresh arrays');
  for (const tab of live.contentTabs) if (tab !== 'xray')
    assert.equal(live.abdominalDetailXrayLesson(identity, tab), undefined);
}
for (const structure of catalog.structures) if (!expected.has(structure.id))
  for (const tab of live.contentTabs)
    assert.equal(live.abdominalDetailXrayLesson(structure, tab), undefined, `${structure.id}:${tab}`);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
for (const identity of pinned) {
  const refuse = (bad, label) => {
    assert.equal(live.abdominalDetailXrayLesson(bad, 'xray'), undefined, label);
    refusedIdentities++;
  };
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

// Admit exactly the sixteen slots at the feature commit. Independent later
// teaching edits remain free to evolve; current target source pins still bind.
const featureCommit = git(['log', '--diff-filter=A', '-1', '--format=%H', '--',
  'content/abdominal-detail-vascular-xray.ts']).trim();
const feature = featureCommit ? await exactSourceHistoryApi(featureCommit, 'review-security') : live;
const featureRaw = featureCommit ? JSON.parse(gitBytes(featureCommit, catalogPath)) : raw;
const featureCatalog = feature.bodyDisplayCatalog(featureRaw);
for (const path of [vesselPins, connectivePins])
  assert.equal(normalized(featureCommit ? gitBytes(featureCommit, path) : readFileSync(path)),
    normalized(gitBytes(baseline, path)), `${path}: admission source unchanged`);
assert.deepEqual(featureRaw, JSON.parse(gitBytes(baseline, catalogPath)));
assert.deepEqual(featureCatalog, old.bodyDisplayCatalog(JSON.parse(gitBytes(baseline, catalogPath))));
assert.deepEqual(feature.structures, old.structures);
assert.deepEqual(feature.dissectionProfiles, old.dissectionProfiles);
assert.deepEqual(feature.regionalTours, old.regionalTours);
assert.deepEqual(feature.contentTabs, old.contentTabs);
for (const path of ['app/anatomy-data.ts', 'app/dissection-data.ts', 'lib/regional-tours.ts'])
  assert.deepEqual(featureCommit ? gitBytes(featureCommit, path) : readFileSync(path),
    gitBytes(baseline, path), `${path}: admission source unchanged`);
assert.equal(featureCatalog.structures.length, 1104);
assert.equal(feature.contentTabs.length, 9);
assert.equal(featureCatalog.structures.length * feature.contentTabs.length, 9936);

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
      previousPacket.topics.filter(row => row.tab !== 'xray'));
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
        'oai-authenticated-user-id': 'SYNTHETIC_ABDOMINAL_DETAIL_XRAY'}, body: JSON.stringify(input),
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
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [16, 9920, 16, 1088]);
assert.deepEqual([malformed, stale, forgedSaves, forgedApprovals, storageCalls], [96, 48, 16, 16, 0]);
for (const bundle of featureCatalog.bundles) {
  const path = 'public' + bundle.url.split('?')[0];
  const bytes = featureCommit ? gitBytes(featureCommit, path) : readFileSync(path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  assert.deepEqual(bytes, gitBytes(baseline, path), `${path}: geometry unchanged`);
}
console.log(JSON.stringify({baseline, featureCommit: featureCommit || 'working-tree',
  changed, preserved, changedPackets, preservedPackets, refusedIdentities,
  malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale,
  forgedSavesRefusedBeforeStorage: forgedSaves, forgedApprovalsRefusedBeforeStorage: forgedApprovals,
  storageCalls, sourceBundlesUnchanged: featureCatalog.bundles.length, clinicalApproval: false}));
