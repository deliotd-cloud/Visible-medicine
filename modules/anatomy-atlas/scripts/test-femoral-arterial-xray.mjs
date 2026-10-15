import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = '469b2f6874cc3f8209c2f7b36fd830cae18dce9e';
const expected = new Map([
  ['vm:anatomy:body:thigh:right:vessel:right-femoral-artery', 'FMA70249'],
  ['vm:anatomy:body:thigh:left:vessel:left-femoral-artery', 'FMA70250'],
  ['vm:anatomy:body:thigh:right:vessel:right-deep-femoral-artery', 'FMA20796'],
  ['vm:anatomy:body:thigh:left:vessel:left-deep-femoral-artery', 'FMA20797'],
  ['vm:anatomy:body:thigh:right:vessel:descending-branch-of-right-lateral-circumflex-femoral-artery', 'FMA21422'],
  ['vm:anatomy:body:thigh:left:vessel:descending-branch-of-left-lateral-circumflex-femoral-artery', 'FMA21423'],
]);
const sourceFiles = new Map([
  ['FMA70249', ['FJ2143']], ['FMA70250', ['FJ2074']],
  ['FMA20796', ['FJ2137', 'FJ2158']], ['FMA20797', ['FJ2069', 'FJ2078']],
  ['FMA21422', ['FJ2057']], ['FMA21423', ['FJ2063']],
]);
const pinsPath = 'content/lower-limb-arterial-pins.json';
const branchCatalogPath = 'public/models/bodyparts3d/circumflex-femoral/catalog.json';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const git = (args, options = {}) => execFileSync('git', args, {
  windowsHide: true, encoding: 'utf8', maxBuffer: 32e6, ...options,
});
const gitBytes = (commit, path) => git(['show', `${commit}:${path}`], {encoding: null});
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const normalized = bytes => Buffer.from(bytes).toString('utf8').replaceAll('\r\n', '\n');
const sourceJson = path => {
  const bytes = readFileSync(path);
  assert.equal(normalized(bytes), normalized(gitBytes(baseline, path)), `${path}: source bytes unchanged`);
  return JSON.parse(bytes.toString('utf8'));
};
const pins = sourceJson(pinsPath);
const branchRaw = sourceJson(branchCatalogPath);
const raw = sourceJson(catalogPath);
const identities = [
  ...pins.entries.filter(s => expected.has(s.id)),
  ...branchRaw.structures.filter(s => expected.has(s.id)),
];
assert.equal(identities.length, 6, 'Exactly six source identities');
assert.deepEqual(new Map(identities.map(s => [s.id, s.fmaId])), expected);
for (const identity of identities) {
  const branch = identity.fmaId === 'FMA21422' || identity.fmaId === 'FMA21423';
  assert.equal(identity.nodeName, expected.get(identity.id));
  assert.equal(identity.region, 'thigh');
  assert.equal(identity.laterality, identity.id.split(':')[4]);
  assert.equal(identity.system, 'vessels');
  assert.equal(identity.category, 'vessel');
  assert.equal(identity.bundle, branch ? 'circumflex-femoral' : 'thigh-vessels-recovery');
  assert.equal(identity.sourceTree, branch || identity.fmaId.startsWith('FMA702') ? 'isa' : 'partof');
  assert.deepEqual(identity.sources.map(source => source.file), sourceFiles.get(identity.fmaId));
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
  if (branch) {
    assert.match(identity.coverageNote, /lateral circumflex parent.*deep.femoral aggregate/i);
    assert.match(identity.coverageNote, /not separately selectable/i);
    assert.match(identity.coverageNote, /no junction.*validated/i);
  }
}
assert.equal(branchRaw.structures.length, 2);
assert.equal(branchRaw.bundles.length, 1);
assert.equal(pins.entries.filter(s => /lateral-circumflex-femoral-artery$/.test(s.id)).length, 0,
  'No separate lateral circumflex parent in source pins');

function assertTeachingSemantics(prose, group) {
  assert.match(prose, /plain.{0,100}(?:radiograph|X.ray)/i);
  assert.match(prose, /(?:contrast.{0,100}(?:catheter|angiograph|DSA)|(?:catheter|angiograph|DSA).{0,100}contrast)/i);
  assert.match(prose, /(?:digital subtraction|\bDSA\b)/i);
  assert.match(prose, /\bCTA\b|CT angiograph/i);
  assert.match(prose, /\bMRA\b|MR angiograph/i);
  assert.match(prose, /projection/i);
  assert.match(prose, /(?:source|retained).{0,100}(?:laterality|side)/i);
  assert.match(prose, /patient.side marker/i);
  assert.match(prose, /(?:no|not|without).{0,100}acquired/i);
  assert.match(prose, /(?:no|not|without).{0,140}(?:registration|patient.space)/i);
  assert.match(prose, /(?:no|not|cannot|does not).{0,140}(?:flow|perfusion)/i);
  assert.match(prose, /(?:no|not|cannot|does not).{0,140}(?:procedur|route|catheter.placement)/i);
  assert.match(prose, /(?:no|not|cannot|does not).{0,140}clinical approval/i);
  assert.match(prose, /revision.bound radiologist.{0,60}pending/i);
  assert.match(prose, /independent/i);
  assert.match(prose, /Atlas/i); assert.match(prose, /case/i); assert.match(prose, /lecture/i);
  assert.doesNotMatch(prose, /approved for clinical use|recommended catheter route|diagnostic threshold is/i);
  if (group.includes('deep-femoral')) {
    assert.match(prose, /deep femoral selection includes a lateral circumflex parent/i);
    assert.match(prose, /not separately selectable/i);
    assert.match(prose, /(?:variation|variable)/i);
  }
  if (group.startsWith('descending-branch')) {
    assert.match(prose, /lateral circumflex/i);
    assert.match(prose, /(?:no|not|cannot|does not).{0,120}(?:junction|continuous lumen|direct deep.femoral branch)/i);
  }
  if (group === 'femoral-artery') {
    assert.match(prose, /common femoral/i);
    assert.match(prose, /superficial femoral/i);
    assert.match(prose, /bifurcation/i);
  }
}

const old = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({
  stdin: {contents:
    "export {femoralArterialXrayLesson} from './lib/femoral-arterial-xray';" +
    "export {femoralArterialXrayTopics} from './content/femoral-arterial-xray';" +
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
const catalog = current.bodyDisplayCatalog(raw);
assert.deepEqual(new Map(catalog.structures.filter(s => expected.has(s.id)).map(s => [s.id, s])),
  new Map(identities.map(s => [s.id, s])));
assert.deepEqual(Object.keys(current.femoralArterialXrayTopics).sort(),
  ['femoral-artery', 'deep-femoral-artery', 'descending-lateral-circumflex-femoral-artery'].sort());
const topicFor = identity => identity.id.includes(':descending-branch-')
  ? 'descending-lateral-circumflex-femoral-artery'
  : identity.id.includes(':right-deep-femoral-artery') || identity.id.includes(':left-deep-femoral-artery')
    ? 'deep-femoral-artery' : 'femoral-artery';
const cleanLessons = new Map();
for (const identity of identities) {
  const group = topicFor(identity);
  const selected = current.femoralArterialXrayLesson(identity, 'xray');
  const topic = current.femoralArterialXrayTopics[group];
  assert.deepEqual(current.bodyLesson(identity, 'xray'), selected);
  assert.equal(selected.readiness, 'draft');
  assert.equal(selected.title, `${identity.name} · ${topic.title} · draft`);
  assert.equal(selected.body, topic.body);
  assert(topic.bullets.every(bullet => selected.bullets.includes(bullet)));
  assert.deepEqual(selected.citations, topic.citations);
  assert(selected.title && selected.body && selected.bullets.length >= 2);
  assert(selected.bullets.every(bullet => typeof bullet === 'string' && bullet.trim()));
  assert(selected.citations.length >= 2);
  assert(selected.citations.includes('https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-lower-limb/'));
  assert(selected.citations.includes('https://www.radiologyinfo.org/en/info/angiocath'));
  assert(selected.citations.some(url => /pubmed\.ncbi\.nlm\.nih\.gov\/\d+\//.test(url)), `${group}: specific study`);
  assert(selected.citations.every(url => /^https:\/\//.test(url)));
  assert.equal(new Set(selected.citations).size, selected.citations.length);
  assertTeachingSemantics([selected.title, selected.body, ...selected.bullets, selected.note].join(' '), group);
  const {readiness, ...content} = selected;
  assert.deepEqual(current.bodyContent(identity, 'xray'), content);
  const clean = structuredClone(selected);
  cleanLessons.set(identity.id, clean);
  selected.bullets.push('foreign'); selected.citations.push('https://foreign.example');
  assert.deepEqual(current.femoralArterialXrayLesson(identity, 'xray'), clean, 'Fresh lesson arrays');
  for (const tab of current.contentTabs) if (tab !== 'xray')
    assert.equal(current.femoralArterialXrayLesson(identity, tab), undefined);
}
for (const structure of catalog.structures) if (!expected.has(structure.id))
  for (const tab of current.contentTabs)
    assert.equal(current.femoralArterialXrayLesson(structure, tab), undefined, `${structure.id}:${tab}`);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
const refuse = (bad, label) => {
  assert.equal(current.femoralArterialXrayLesson(bad, 'xray'), undefined, label);
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

// Once committed, replay admission from immutable Git source; later teaching can evolve.
const featureCommit = git(['log', '--diff-filter=A', '-1', '--format=%H', '--',
  'content/femoral-arterial-xray.ts']).trim();
const feature = featureCommit ? await exactSourceHistoryApi(featureCommit, 'review-security') : current;
const featureRaw = featureCommit ? JSON.parse(gitBytes(featureCommit, catalogPath)) : raw;
const featureCatalog = feature.bodyDisplayCatalog(featureRaw);
for (const path of [pinsPath, branchCatalogPath]) {
  const bytes = featureCommit ? gitBytes(featureCommit, path) : readFileSync(path);
  assert.equal(normalized(bytes), normalized(gitBytes(baseline, path)), `${path}: admission source unchanged`);
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
  // Registry equality above is immutable admission evidence; current tour
  // revisions have their own complete source/sequence/Review-delta suite.
  if(path!=='lib/regional-tours.ts')assert.deepEqual(readFileSync(path), bytes, `${path}: live anatomy/dissection bytes unchanged`);
}
const nestedSpecimenPaths = git(['ls-tree', '-r', '--name-only', baseline, '--', 'app', 'lib', 'content'])
  .split(/\r?\n/).filter(path => /(?:nested|specimen)/i.test(path));
assert(nestedSpecimenPaths.length > 0);
for (const path of nestedSpecimenPaths) {
  const bytes = featureCommit ? gitBytes(featureCommit, path) : readFileSync(path);
  assert.deepEqual(bytes, gitBytes(baseline, path), `${path}: nested/specimen admission unchanged`);
  assert.deepEqual(readFileSync(path), bytes, `${path}: nested/specimen live unchanged`);
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
    assert.ok(await feature.parseBodyReviewResponse(packet, id) === packet,
      `${id}: current display pins must admit the exact Review packet`);
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
        'oai-authenticated-user-id': 'SYNTHETIC_FEMORAL_ARTERIAL_XRAY'}, body: JSON.stringify(input),
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
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [6, 9930, 6, 1098]);
assert.deepEqual([malformed, stale, forgedSaves, forgedApprovals, storageCalls], [36, 18, 6, 6, 0]);
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
