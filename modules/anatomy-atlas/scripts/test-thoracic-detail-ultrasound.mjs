import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = 'c3593e6664e8572d882bd19d4525dea0f3d00d17';
const smallPins = 'content/thoracic-small-vessel-mri-pins.json';
const branchPins = 'content/thoracic-branch-imaging-pins.json';
const venousPins = 'content/systemic-venous-pins.json';
const pinPaths = [smallPins, branchPins, venousPins];
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const prefix = 'vm:anatomy:body:thorax:';
// slug, FMA, bundle, exact source files, and source-side/category. No grouped
// file is promoted into a named child structure or assigned a new side.
const targets = [
  ['midline:vessel:esophageal-artery','FMA4149','thorax-vessels-thoracic-detail','FJ1934'],
  ['midline:vessel:variant-bronchial-artery','FMA10704','thorax-vessels-thoracic-detail','FJ3418'],
  ['midline:vessel:bronchial-artery','FMA68109','thorax-vessels-thoracic-detail','FJ1933'],
  ['midline:vessel:set-of-oesophageal-branches-of-thoracic-aorta','FMA71537','thorax-vessels-thoracic-detail','FJ3431'],
  ['unspecified:vessel:anterior-cardiac-vein','FMA76767','anterior-cardiac-vein','FJ2725','FJ2730'],
  ['right:vessel:right-musculophrenic-artery','FMA10692','thorax-vessels-inventory','FJ1969'],
  ['left:vessel:left-musculophrenic-artery','FMA4077','thorax-vessels-inventory','FJ1979'],
  ['right:vessel:right-musculophrenic-vein','FMA4772','thorax-vessels-inventory','FJ1996'],
  ['left:vessel:left-musculophrenic-vein','FMA4786','thorax-vessels-inventory','FJ1988'],
  ['midline:vessel:hemiazygos-vein','FMA4944','thorax-vessels-recovery','FJ3434'],
];
const expected = new Map(targets.map(([suffix, fma, bundle, ...files]) =>
  [prefix + suffix, {fma, bundle, files, side: suffix.split(':')[0], category: suffix.split(':')[1]}]));
assert.equal(expected.size, 10);
const git = (args, options = {}) => execFileSync('git', args, {
  windowsHide: true, encoding: 'utf8', maxBuffer: 32e6, ...options,
});
const gitBytes = (commit, path) => git(['show', `${commit}:${path}`], {encoding: null});
const normalized = bytes => Buffer.from(bytes).toString('utf8').replaceAll('\r\n', '\n');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
for (const path of pinPaths)
  assert.equal(normalized(readFileSync(path)), normalized(gitBytes(baseline, path)), `${path}: source pin unchanged`);
const candidates = pinPaths.flatMap(path => JSON.parse(readFileSync(path, 'utf8')).entries
  .map(row => row.identity ?? row).filter(identity => expected.has(identity.id)));
const pinned = [...new Map(candidates.map(identity => [identity.id, identity])).values()];
for (const identity of candidates) assert.deepEqual(identity, pinned.find(s=>s.id===identity.id));
assert.equal(pinned.length, 10);
for (const identity of pinned) {
  const {fma, bundle, files, side, category} = expected.get(identity.id);
  assert.equal(identity.fmaId, fma);
  assert.equal(identity.nodeName, fma);
  assert.equal(identity.region, 'thorax');
  assert.equal(identity.system, 'vessels');
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
    "export {thoracicDetailUltrasoundLesson} from './lib/thoracic-detail-ultrasound';" +
    "export {thoracicMediastinalUltrasoundTopics} from './content/thoracic-mediastinal-ultrasound';" +
    "export {thoracicCardiacChestwallUltrasoundTopics} from './content/thoracic-cardiac-chestwall-ultrasound';" +
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
const topics = {...live.thoracicMediastinalUltrasoundTopics, ...live.thoracicCardiacChestwallUltrasoundTopics};
assert.deepEqual(Object.keys(topics).sort(), targets.map(row=>row[0].split(':').at(-1)).sort());
assert.equal(Object.keys(live.thoracicMediastinalUltrasoundTopics).length,5);
assert.equal(Object.keys(live.thoracicCardiacChestwallUltrasoundTopics).length,5);
function assertCommon(prose) {
  for(const word of ['ultrasound','acquired','explode','Doppler','spectral','lumen','patency','procedural route','patient-space registration','revision-bound radiologist review pending','independent','Atlas','case','lecture'])
    assert(prose.toLowerCase().includes(word.toLowerCase()),word);
  assert.match(prose,/source laterality is not a screen-side rule or patient-side marker/i);
  assert.match(prose,/supplies no acquired ultrasound image/i);
  assert.match(prose,/no publisher media/i);
  assert.match(prose,/no publisher media.{0,50}clinical approval/i);
  assert.doesNotMatch(prose,/approved for clinical use|recommended needle route|diagnostic threshold is/i);
}
function assertSpecific(prose,id){
  if(id.includes('bronchial'))assert.match(prose,/aortopulmonary|AP window/i);
  if(id.includes('esophageal')||id.includes('oesophageal'))assert.match(prose,/feeder|small.{0,40}branch|small.{0,40}vessel|individual.*arter/i);
  if(id.includes('variant-bronchial')){assert.match(prose,/FMA10704/);assert.match(prose,/FMA14177/);}
  if(id.includes('set-of-oesophageal'))assert.match(prose,/group|set/i);
  if(id.includes('hemiazygos')){assert.match(prose,/azygos/i);assert.match(prose,/aorta/i);}
  if(id.includes('anterior-cardiac')){assert.match(prose,/right atrium/i);assert.match(prose,/coronary sinus/i);assert.match(prose,/group/i);}
  if(id.includes('musculophrenic')){assert.match(prose,/internal thoracic/i);assert.match(prose,/parent/i);assert.match(prose,/not.*(evidence|prove|establish|demonstrat)|does not/i);}
}
const cleanLessons = new Map();
for (const identity of pinned) {
  const selected = live.thoracicDetailUltrasoundLesson(identity, 'ultrasound');
  const slug = identity.id.split(':').at(-1);
  const topic = topics[slug];
  assert.deepEqual(live.bodyLesson(identity, 'ultrasound'), selected);
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
  assert.deepEqual(live.bodyContent(identity, 'ultrasound'), content);
  const clean = structuredClone(selected);
  cleanLessons.set(identity.id, clean);
  selected.bullets.push('foreign'); selected.citations.push('https://foreign.example');
  assert.deepEqual(live.thoracicDetailUltrasoundLesson(identity, 'ultrasound'), clean, 'Fresh arrays');
  for (const tab of live.contentTabs) if (tab !== 'ultrasound')
    assert.equal(live.thoracicDetailUltrasoundLesson(identity, tab), undefined);
}
for (const structure of catalog.structures) if (!expected.has(structure.id))
  for (const tab of live.contentTabs)
    assert.equal(live.thoracicDetailUltrasoundLesson(structure, tab), undefined, `${structure.id}:${tab}`);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
for (const identity of pinned) {
  const refuse = (bad, label) => {
    assert.equal(live.thoracicDetailUltrasoundLesson(bad, 'ultrasound'), undefined, label);
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

// Admit exactly the ten slots at the feature commit. Independent later
// teaching edits remain free to evolve; current target source pins still bind.
const featureCommit = git(['log', '--diff-filter=A', '-1', '--format=%H', '--',
  'content/thoracic-mediastinal-ultrasound.ts']).trim();
const feature = featureCommit ? await exactSourceHistoryApi(featureCommit, 'review-security') : live;
const featureRaw = featureCommit ? JSON.parse(gitBytes(featureCommit, catalogPath)) : raw;
const featureCatalog = feature.bodyDisplayCatalog(featureRaw);
for (const path of pinPaths)
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
      previousPacket.topics.filter(row => row.tab !== 'ultrasound'));
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
        'oai-authenticated-user-id': 'SYNTHETIC_THORACIC_DETAIL_ULTRASOUND'}, body: JSON.stringify(input),
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
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [10, 9926, 10, 1094]);
assert.deepEqual([malformed, stale, forgedSaves, forgedApprovals, storageCalls], [60, 30, 10, 10, 0]);
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
