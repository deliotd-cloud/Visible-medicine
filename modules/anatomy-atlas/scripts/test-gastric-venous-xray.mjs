import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = '9e229803af93cdb12c711ba738771ce92ee51191';
const pinsPath = 'content/abdominal-branch-imaging-pins.json';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const expected = new Map([
  ['vm:anatomy:body:abdomen:left:vessel:left-gastric-vein', ['FMA15399', 'FJ3500', 'left']],
  ['vm:anatomy:body:abdomen:right:vessel:right-gastric-vein', ['FMA15400', 'FJ3595', 'right']],
  ['vm:anatomy:body:abdomen:left:vessel:left-gastroepiploic-vein', ['FMA15390', 'FJ3502', 'left']],
  ['vm:anatomy:body:abdomen:right:vessel:right-gastroepiploic-vein', ['FMA15397', 'FJ3597', 'right']],
]);
const git = (args, options = {}) => execFileSync('git', args, {
  windowsHide: true, encoding: 'utf8', maxBuffer: 32e6, ...options,
});
const gitBytes = (commit, path) => git(['show', `${commit}:${path}`], {encoding: null});
const normalizedText = bytes => Buffer.from(bytes).toString('utf8').replaceAll('\r\n', '\n');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

assert.equal(normalizedText(readFileSync(pinsPath)), normalizedText(gitBytes(baseline, pinsPath)));
const identities = JSON.parse(readFileSync(pinsPath, 'utf8')).entries.map(row => row.identity)
  .filter(identity => expected.has(identity.id));
assert.equal(identities.length, 4);
for (const identity of identities) {
  const [fma, file, side] = expected.get(identity.id);
  assert.equal(identity.fmaId, fma);
  assert.equal(identity.nodeName, fma);
  assert.equal(identity.laterality, side);
  assert.equal(identity.region, 'abdomen');
  assert.equal(identity.system, 'vessels');
  assert.equal(identity.category, 'vessel');
  assert.equal(identity.bundle, 'portal-veins');
  assert.deepEqual(identity.sources.map(source => source.file), [file]);
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
}

const old = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({
  stdin: {contents:
    "export {gastricVenousXrayLesson} from './lib/gastric-venous-xray';" +
    "export {gastricVenousXrayTopics} from './content/gastric-venous-xray';" +
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
  new Map(identities.map(s => [s.id, s])));
assert.deepEqual(Object.keys(live.gastricVenousXrayTopics).sort(),
  [...expected.keys()].map(id => id.split(':').at(-1)).sort());

function assertLessonSemantics(prose, id) {
  assert.match(prose, /contrast.{0,100}venogra|venogra.{0,100}contrast/i);
  assert.match(prose, /acquired contrast venogra/i);
  assert.match(prose, /(?:not|no|cannot|does not).{0,120}(?:guarantee|always|necessarily|every).{0,50}opacif|opacif.{0,100}(?:not|no|cannot|does not).{0,50}(?:guarantee|always)/i);
  assert.match(prose, /plain.{0,50}(?:radiograph|X.ray)/i);
  assert.match(prose, /(?:not|no|cannot|does not).{0,120}(?:delineate|show|resolve|visible).{0,50}(?:lumen|vein)|(?:lumen|vein).{0,100}(?:not|no|cannot|does not).{0,50}(?:visible|delineat)/i);
  assert.match(prose, /\bCTV\b|CT venogra/i);
  assert.match(prose, /\bMRV\b|MR venogra/i);
  assert.match(prose, /Doppler/i);
  assert.match(prose, /(?:reassembl|assembled).{0,100}explode|explode.{0,100}(?:reassembl|assembled)/i);
  assert.match(prose, /source.{0,100}laterality/i);
  assert.match(prose, /(?:not|no|cannot|does not).{0,100}(?:screen|patient).{0,30}(?:side|marker)|(?:screen|patient).{0,30}(?:side|marker).{0,100}(?:not|no|cannot|does not)/i);
  assert.match(prose, /(?:no|not|without).{0,100}acquired/i);
  assert.match(prose, /(?:no|not|without).{0,100}(?:media|image)/i);
  assert.match(prose, /(?:no|not|cannot|does not).{0,140}(?:registration|patient.space)/i);
  assert.match(prose, /(?:no|not|cannot|does not).{0,140}(?:simulat.{0,30}flow|flow.{0,30}simulat)/i);
  assert.match(prose, /(?:no|not|cannot|does not).{0,140}(?:procedur|route)/i);
  assert.match(prose, /(?:no|not|cannot|does not).{0,140}clinical approval/i);
  assert.match(prose, /revision.bound radiologist.{0,60}pending/i);
  assert.match(prose, /independent/i);
  assert.match(prose, /Atlas/i); assert.match(prose, /case/i); assert.match(prose, /lecture/i);
  assert.doesNotMatch(prose, /approved for clinical use|recommended catheter route|diagnostic threshold is/i);
  if (id.includes('gastroepiploic')) {
    assert.match(prose, /greater[- ]curvature/i);
    assert.match(prose, /gastro.omental/i);
    if (id.includes(':left:')) assert.match(prose, /left.{0,120}splenic|splenic.{0,120}left/i);
    else assert.match(prose, /right.{0,120}(?:SMV|superior mesenteric)|(?:SMV|superior mesenteric).{0,120}right/i);
  } else {
    assert.match(prose, /lesser[- ]curvature/i);
    assert.match(prose, /left gastric/i);
    assert.match(prose, /right gastric/i);
    assert.match(prose, /portal/i);
  }
}

const cleanLessons = new Map();
for (const identity of identities) {
  const selected = live.gastricVenousXrayLesson(identity, 'xray');
  const topic = live.gastricVenousXrayTopics[identity.id.split(':').at(-1)];
  assert.deepEqual(live.bodyLesson(identity, 'xray'), selected);
  assert.equal(selected.readiness, 'draft');
  assert.equal(selected.title, `${identity.name} · ${topic.title} · draft`);
  assert.equal(selected.body, topic.body);
  assert(topic.bullets.every(b => selected.bullets.includes(b)));
  assert.deepEqual(selected.citations, topic.citations);
  assert(selected.bullets.length >= 2 && selected.bullets.every(b => typeof b === 'string' && b.trim()));
  assert.deepEqual(selected.citations, [
    'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-abdomen/',
    'https://www.radiologyinfo.org/en/info/angiocath',
  ]);
  assertLessonSemantics([selected.title, selected.body, ...selected.bullets, selected.note].join(' '), identity.id);
  const {readiness, ...content} = selected;
  assert.deepEqual(live.bodyContent(identity, 'xray'), content);
  const clean = structuredClone(selected);
  cleanLessons.set(identity.id, clean);
  selected.bullets.push('foreign'); selected.citations.push('https://foreign.example');
  assert.deepEqual(live.gastricVenousXrayLesson(identity, 'xray'), clean, 'Fresh arrays');
  for (const tab of live.contentTabs) if (tab !== 'xray')
    assert.equal(live.gastricVenousXrayLesson(identity, tab), undefined);
}
for (const structure of catalog.structures) if (!expected.has(structure.id))
  for (const tab of live.contentTabs)
    assert.equal(live.gastricVenousXrayLesson(structure, tab), undefined, `${structure.id}:${tab}`);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
for (const identity of identities) {
  const refuse = (bad, label) => {
    assert.equal(live.gastricVenousXrayLesson(bad, 'xray'), undefined, label);
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

// Replay the admission commit after landing. Later independent teaching and tours
// can evolve without changing the four-slot admission proof.
const featureCommit = git(['log', '--diff-filter=A', '-1', '--format=%H', '--',
  'content/gastric-venous-xray.ts']).trim();
const feature = featureCommit ? await exactSourceHistoryApi(featureCommit, 'review-security') : live;
const featureRaw = featureCommit ? JSON.parse(gitBytes(featureCommit, catalogPath)) : raw;
const featureCatalog = feature.bodyDisplayCatalog(featureRaw);
assert.equal(normalizedText(featureCommit ? gitBytes(featureCommit, pinsPath) : readFileSync(pinsPath)),
  normalizedText(gitBytes(baseline, pinsPath)));
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
        'oai-authenticated-user-id': 'SYNTHETIC_GASTRIC_VENOUS_XRAY'}, body: JSON.stringify(input),
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
  assert.deepEqual(bytes, gitBytes(baseline, path), `${path}: geometry unchanged`);
}
console.log(JSON.stringify({baseline, featureCommit: featureCommit || 'working-tree',
  changed, preserved, changedPackets, preservedPackets, refusedIdentities,
  malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale,
  forgedSavesRefusedBeforeStorage: forgedSaves, forgedApprovalsRefusedBeforeStorage: forgedApprovals,
  storageCalls, sourceBundlesUnchanged: featureCatalog.bundles.length, clinicalApproval: false}));
