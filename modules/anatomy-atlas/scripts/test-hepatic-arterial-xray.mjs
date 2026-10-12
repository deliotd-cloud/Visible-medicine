import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = '63e57a037ec0092dedaaad96846b5e679d84482f';
const expected = new Map([
  ['vm:anatomy:body:abdomen:midline:vessel:common-hepatic-artery', 'FMA14771'],
  ['vm:anatomy:body:abdomen:unspecified:vessel:hepatic-artery-proper', 'FMA14772'],
  ['vm:anatomy:body:abdomen:left:vessel:left-gastric-artery', 'FMA14768'],
]);
const pinsPath = 'content/abdominal-arterial-pins.json';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const git = (args, options = {}) => execFileSync('git', args, {
  windowsHide: true, encoding: 'utf8', maxBuffer: 32e6, ...options,
});
const gitBytes = (commit, path) => git(['show', `${commit}:${path}`], {encoding: null});
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
assert.deepEqual(readFileSync(pinsPath), gitBytes(baseline, pinsPath), 'Source pins unchanged');
const pins = JSON.parse(readFileSync(pinsPath, 'utf8'));
const identities = pins.entries.filter(s => expected.has(s.id));
assert.equal(identities.length, 3);
assert.deepEqual(new Map(identities.map(s => [s.id, s.fmaId])), expected);
for (const identity of identities) {
  assert.equal(identity.nodeName, expected.get(identity.id));
  assert.equal(identity.region, 'abdomen');
  assert.equal(identity.laterality, identity.id.split(':')[4]);
  assert.equal(identity.system, 'vessels');
  assert.equal(identity.category, 'vessel');
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
}

const old = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({
  stdin: {contents:
    "export {hepaticArterialXrayLesson} from './lib/hepatic-arterial-xray';" +
    "export {hepaticArterialXrayTopics} from './content/hepatic-arterial-xray';" +
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
assert.deepEqual(catalog.structures.filter(s => expected.has(s.id)), identities);
const cleanLessons = new Map();
assert.deepEqual(Object.keys(current.hepaticArterialXrayTopics).sort(),
  ['common-hepatic-artery', 'hepatic-artery-proper', 'left-gastric-artery']);
for (const identity of identities) {
const selected = current.hepaticArterialXrayLesson(identity, 'xray');
const topic = current.hepaticArterialXrayTopics[identity.id.split(':').at(-1)];
assert.deepEqual(current.bodyLesson(identity, 'xray'), selected);
assert.equal(selected.readiness, 'draft');
assert.equal(selected.body, topic.body);
assert(topic.bullets.every(b => selected.bullets.includes(b)));
assert.deepEqual(selected.citations, topic.citations);
assert(selected.title && selected.body && selected.bullets.length >= 2);
assert(selected.bullets.every(b => typeof b === 'string' && b.trim()));
assert(selected.citations.includes('https://www.radiologyinfo.org/en/info/angiocath'));
assert(selected.citations.includes('https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-abdomen/'));
assert(selected.citations.every(url => /^https:\/\//.test(url)));
assert.equal(new Set(selected.citations).size, selected.citations.length);
const prose = [selected.title, selected.body, ...selected.bullets, selected.note].join(' ');
assert.match(prose, /(?:contrast|catheter).{0,70}angiogra|angiogra.{0,70}(?:contrast|catheter)/i);
assert.match(prose, /digital subtraction|\bDSA\b/i);
assert.match(prose, /varia(?:nt|tion)|replaced|accessory/i);
assert.match(prose, /plain.{0,40}(?:radiograph|X.ray)/i);
assert.match(prose, /\bCTA\b|CT angiogra/i);
assert.match(prose, /\bMRA\b|MR angiogra/i);
assert.match(prose, /(?:source|retained).{0,100}(?:laterality|midline|unspecified|left)/i);
assert.match(prose, /(?:not|no|cannot|does not).{0,100}patient.{0,20}(?:side|marker)|patient.{0,20}(?:side|marker).{0,100}(?:not|no|cannot|does not)/i);
if (identity.fmaId === 'FMA14771') {
  assert.match(prose, /gastroduodenal/i);
  assert.match(prose, /(?:proper hepatic|hepatic artery proper)/i);
  assert.match(prose, /usual|typical|normally/i);
} else if (identity.fmaId === 'FMA14772') {
  assert.match(prose, /right.{0,30}(?:hepatic|left)|hepatic.{0,30}right/i);
  assert.match(prose, /left.{0,30}hepatic|hepatic.{0,30}left/i);
  assert.match(prose, /gastroduodenal/i);
} else {
  assert.match(prose, /lesser curvature|stomach|gastric/i);
  assert.match(prose, /replaced/i);
  assert.match(prose, /accessory/i);
  assert.match(prose, /left.{0,30}hepatic/i);
}
assert.match(selected.note, /revision.bound radiologist.{0,30}pending/i);
assert.match(selected.note, /No[^.]*clinical approval/i);
assert.match(selected.note, /No[^.]*patient.space registration/i);
assert.match(prose, /(?:no|not|does not|cannot).{0,140}(?:simulat.{0,20}flow|flow.{0,20}simulat)/i);
assert.match(selected.note, /No[^.]*acquired/i);
assert.match(selected.note, /No[^.]*(?:publisher|reused|media)/i);
assert.match(selected.note, /(?:Atlas|case).*(?:Education case|Atlas).*(?:lecture|access).*independent/i);
assert.doesNotMatch(prose, /approved for clinical use|recommended catheter route|diagnostic threshold is/i);
assert.match(prose, /(?:no|not|cannot|does not).{0,120}(?:procedur|catheter.placement|treatment.route|embolisation)/i);
const {readiness, ...content} = selected;
assert.deepEqual(current.bodyContent(identity, 'xray'), content);
const clean = structuredClone(selected);
cleanLessons.set(identity.id, clean);
selected.bullets.push('foreign'); selected.citations.push('https://foreign.example');
assert.deepEqual(current.hepaticArterialXrayLesson(identity, 'xray'), clean, 'Fresh arrays');
for (const tab of current.contentTabs) if (tab !== 'xray')
  assert.equal(current.hepaticArterialXrayLesson(identity, tab), undefined);
}
const citations = new Set([...cleanLessons.values()].flatMap(lesson => lesson.citations));
assert(citations.has('https://pubmed.ncbi.nlm.nih.gov/12147854/'), 'Covey hepatic arterial variation study');
assert(citations.has('https://pubmed.ncbi.nlm.nih.gov/15848625/'), 'Coşkun hepatic arterial variation study');

for (const structure of catalog.structures) if (!expected.has(structure.id))
  for (const tab of current.contentTabs)
    assert.equal(current.hepaticArterialXrayLesson(structure, tab), undefined, `${structure.id}:${tab}`);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
const refuse = (bad, label) => {
  assert.equal(current.hepaticArterialXrayLesson(bad, 'xray'), undefined, label);
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
// advance other structures. Still compare all three live targets' complete display/packet.
const featureCommit = git(['log', '--diff-filter=A', '-1', '--format=%H', '--',
  'content/hepatic-arterial-xray.ts']).trim();
const feature = featureCommit ? await exactSourceHistoryApi(featureCommit, 'review-security') : current;
const featureRaw = featureCommit ? JSON.parse(gitBytes(featureCommit, catalogPath)) : raw;
const featureCatalog = feature.bodyDisplayCatalog(featureRaw);
assert.deepEqual(featureRaw, JSON.parse(gitBytes(baseline, catalogPath)));
assert.deepEqual(featureCatalog, old.bodyDisplayCatalog(JSON.parse(gitBytes(baseline, catalogPath))));
assert.deepEqual(feature.structures, old.structures);
assert.deepEqual(feature.dissectionProfiles, old.dissectionProfiles);
assert.deepEqual(feature.regionalTours, old.regionalTours);
assert.deepEqual(feature.contentTabs, old.contentTabs);
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
        'oai-authenticated-user-id': 'SYNTHETIC_HEPATIC_ARTERIAL_XRAY'}, body: JSON.stringify(input),
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
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [3, 9933, 3, 1101]);
assert.deepEqual([malformed, stale, forgedSaves, forgedApprovals, storageCalls], [15, 9, 3, 3, 0]);
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


