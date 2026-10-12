import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = 'bad2f98dfb7813f402ddfcf23bf8552d0655dbb2';
const expected = new Map([
  ['vm:anatomy:body:thorax:unspecified:vessel:great-cardiac-vein', 'FMA4707'],
  ['vm:anatomy:body:thorax:unspecified:vessel:middle-cardiac-vein', 'FMA4713'],
]);
const pinsPath = 'content/cardiac-venous-tour-pins.json';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const git = (args, options = {}) => execFileSync('git', args, {
  windowsHide: true, encoding: 'utf8', maxBuffer: 32e6, ...options,
});
const gitBytes = (commit, path) => git(['show', `${commit}:${path}`], {encoding: null});
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
assert.deepEqual(readFileSync(pinsPath), gitBytes(baseline, pinsPath), 'Source pins unchanged');
const pins = JSON.parse(readFileSync(pinsPath, 'utf8'));
const identities = pins.entries.filter(s => expected.has(s.id));
assert.equal(identities.length, 2);
assert.deepEqual(new Map(identities.map(s => [s.id, s.fmaId])), expected);
for (const identity of identities) {
  assert.equal(identity.nodeName, expected.get(identity.id));
  assert.equal(identity.region, 'thorax');
  assert.equal(identity.laterality, 'unspecified');
  assert.equal(identity.system, 'vessels');
  assert.equal(identity.category, 'vessel');
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
}

const old = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({
  stdin: {contents:
    "export {cardiacVenousUltrasoundLesson} from './lib/cardiac-venous-ultrasound';" +
    "export {cardiacVenousUltrasoundTopics} from './content/cardiac-venous-ultrasound';" +
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
assert.deepEqual(Object.keys(current.cardiacVenousUltrasoundTopics).sort(),
  ['great-cardiac-vein', 'middle-cardiac-vein']);
for (const identity of identities) {
const selected = current.cardiacVenousUltrasoundLesson(identity, 'ultrasound');
const topic = current.cardiacVenousUltrasoundTopics[identity.id.split(':').at(-1)];
assert.deepEqual(current.bodyLesson(identity, 'ultrasound'), selected);
assert.equal(selected.readiness, 'draft');
assert.equal(selected.body, topic.body);
assert(topic.bullets.every(b => selected.bullets.includes(b)));
assert.deepEqual(selected.citations, topic.citations);
assert(selected.title && selected.body && selected.bullets.length >= 2);
assert(selected.bullets.every(b => typeof b === 'string' && b.trim()));
assert(selected.citations.includes(identity.fmaId === 'FMA4707'
  ? 'https://pubmed.ncbi.nlm.nih.gov/11875389/' : 'https://pubmed.ncbi.nlm.nih.gov/26009286/'));
assert(selected.citations.every(url => /^https:\/\//.test(url)));
assert.equal(new Set(selected.citations).size, selected.citations.length);
const prose = [selected.title, selected.body, ...selected.bullets, selected.note].join(' ');
if (identity.fmaId === 'FMA4707') {
assert.match(prose, /transthoracic/i);
assert.match(prose, /Doppler|TTDE/i);
assert.match(prose, /21\s*(?:\/|of|out of)\s*23/i);
assert.match(prose, /(?:human|adult).{0,80}volunteer|volunteer.{0,80}(?:human|adult)/i);
assert.match(prose, /dog|canine/i);
assert.match(prose, /experiment|animal/i);
assert.match(prose, /(?:not|no|does not|cannot).{0,140}(?:plane|window)|(?:plane|window).{0,140}(?:not|no|does not|cannot)/i);
assert.match(prose, /(?:not|no|does not|cannot).{0,140}(?:universal|every|always|routine)/i);
assert.match(prose, /(?:not|no|does not|cannot).{0,140}(?:diagnos|threshold)/i);
} else {
  assert.match(prose, /transesophageal|transoesophageal|\bTEE\b/i);
  assert.match(prose, /modified bicaval/i);
  assert.match(prose, /70/);
  assert.match(prose, /surg(?:ical|ery)|intraoperative/i);
  assert.match(prose, /not.{0,30}healthy.volunteer/i);
  assert.match(prose, /14.{0,80}(?:component|surface)/i);
  assert.match(prose, /(?:not|no|does not|cannot).{0,160}(?:14.{0,30}(?:vein|named)|(?:named|count).{0,30}vein)/i);
  assert.match(prose, /(?:not|no|does not|cannot).{0,140}(?:detection rate|visibility rate|MCV.specific)/i);
  assert.match(prose, /(?:not|no|does not|cannot).{0,140}(?:routine.{0,30}(?:TTE|transthoracic)|full.course|entire course)/i);
  assert.match(prose, /(?:not|no|does not|cannot).{0,100}(?:entire|full|complete).{0,30}(?:course|lumen)/i);
  assert.match(prose, /No catheter.placement instructions/i);
}
assert.match(selected.note, /revision.bound radiologist.{0,30}pending/i);
assert.match(selected.note, /No[^.]*clinical approval/i);
assert.match(selected.note, /No[^.]*patient.space registration/i);
assert.match(prose, /(?:no|not|does not|cannot).{0,140}(?:simulat.{0,20}flow|flow.{0,20}simulat)/i);
assert.match(selected.note, /No[^.]*acquired/i);
assert.match(selected.note, /No[^.]*(?:publisher|reused|media)/i);
assert.match(selected.note, /(?:Atlas|case).*(?:Education case|Atlas).*(?:lecture|access).*independent/i);
assert.doesNotMatch(prose, /approved for clinical use|recommended catheter route|diagnostic threshold is/i);
const {readiness, ...content} = selected;
assert.deepEqual(current.bodyContent(identity, 'ultrasound'), content);
const clean = structuredClone(selected);
cleanLessons.set(identity.id, clean);
selected.bullets.push('foreign'); selected.citations.push('https://foreign.example');
assert.deepEqual(current.cardiacVenousUltrasoundLesson(identity, 'ultrasound'), clean, 'Fresh arrays');
for (const tab of current.contentTabs) if (tab !== 'ultrasound')
  assert.equal(current.cardiacVenousUltrasoundLesson(identity, tab), undefined);
}
for (const structure of catalog.structures) if (!expected.has(structure.id))
  for (const tab of current.contentTabs)
    assert.equal(current.cardiacVenousUltrasoundLesson(structure, tab), undefined, `${structure.id}:${tab}`);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
const refuse = (bad, label) => {
  assert.equal(current.cardiacVenousUltrasoundLesson(bad, 'ultrasound'), undefined, label);
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
// advance other structures. Still compare both live targets' complete display/packet.
const featureCommit = git(['log', '--diff-filter=A', '-1', '--format=%H', '--',
  'content/cardiac-venous-ultrasound.ts']).trim();
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
    if (expected.has(structure.id) && tab === 'ultrasound') {
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
    assert.deepEqual(packet.topics.filter(row => row.tab !== 'ultrasound'),
      previousPacket.topics.filter(row => row.tab !== 'ultrasound'), 'All other Review tabs, including prior Xray');
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], previousPacket[key], `${id}:${key}`);
    assert.equal(packet.fingerprints.source, previousPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, previousPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, previousPacket.materialHash);
    assert.deepEqual(packet.topics.find(row => row.tab === 'ultrasound'),
      {tab: 'ultrasound', ...feature.bodyLesson(structure, 'ultrasound')});
    assert.deepEqual(await feature.parseBodyReviewResponse(packet, id), packet);
    assert.equal(await feature.parseBodyReviewResponse(previousPacket, id), null);
    for (const edit of [
      value => { value.topics.find(row => row.tab === 'ultrasound').body += ' foreign'; },
      value => { value.topics.find(row => row.tab === 'ultrasound').bullets[0] += ' foreign'; },
      value => { value.topics.find(row => row.tab === 'ultrasound').citations = ['https://foreign.example']; },
      value => { value.topics.find(row => row.tab === 'ultrasound').readiness = 'approved'; },
      value => { value.topics.splice(value.topics.findIndex(row => row.tab === 'ultrasound'), 1); },
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
        'oai-authenticated-user-id': 'SYNTHETIC_CARDIAC_VENOUS_ULTRASOUND'}, body: JSON.stringify(input),
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
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [2, 9934, 2, 1102]);
assert.deepEqual([malformed, stale, forgedSaves, forgedApprovals, storageCalls], [10, 6, 2, 2, 0]);
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
