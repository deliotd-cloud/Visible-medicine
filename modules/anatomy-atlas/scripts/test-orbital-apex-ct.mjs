import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = 'ab8f5594df9ff55132d3d8754e9d229a806dc325';
const pinPath = 'content/orbital-nerve-mri-pins.json';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const prefix = 'vm:anatomy:body:head-neck:';
// Exact immutable BodyParts3D identities. The MRI teaching in the pin file has
// no CT authority; only its complete source identities and groups are reused.
const slots = [
  ['left:nerve:superior-branch-of-left-oculomotor-nerve', 'FMA52575', 'FJ1321', 'superior-oculomotor'],
  ['right:nerve:superior-branch-of-right-oculomotor-nerve', 'FMA52574', 'FJ1372', 'superior-oculomotor'],
  ['left:nerve:inferior-branch-of-left-oculomotor-nerve', 'FMA52577', 'FJ1293', 'inferior-oculomotor'],
  ['right:nerve:inferior-branch-of-right-oculomotor-nerve', 'FMA52576', 'FJ1344', 'inferior-oculomotor'],
  ['left:nerve:left-trochlear-nerve', 'FMA50882', 'FJ1330', 'trochlear'],
  ['right:nerve:right-trochlear-nerve', 'FMA50881', 'FJ1381', 'trochlear'],
  ['left:nerve:left-frontal-nerve', 'FMA52640', 'FJ1290', 'frontal'],
  ['right:nerve:right-frontal-nerve', 'FMA52639', 'FJ1341', 'frontal'],
  ['left:nerve:left-lacrimal-nerve', 'FMA52630', 'FJ1300', 'lacrimal'],
  ['right:nerve:right-lacrimal-nerve', 'FMA52629', 'FJ1351', 'lacrimal'],
  ['left:nerve:left-nasociliary-nerve', 'FMA52670', 'FJ1310', 'nasociliary'],
  ['right:nerve:right-nasociliary-nerve', 'FMA52669', 'FJ1361', 'nasociliary'],
  ['left:organ:left-ciliary-ganglion', 'FMA53550', 'FJ1288', 'ciliary-ganglion'],
  ['right:organ:right-ciliary-ganglion', 'FMA53549', 'FJ1339', 'ciliary-ganglion'],
];
const expected = new Map(slots.map(([suffix, fma, file, group]) =>
  [prefix + suffix, {fma, file, group, side: suffix.split(':')[0], category: suffix.split(':')[1]}]));
assert.equal(expected.size, 14);
const git = args => execFileSync('git', args, {encoding: null, windowsHide: true, maxBuffer: 32e6});
const gitBytes = path => git(['show', `${baseline}:${path}`]);
const normalized = bytes => Buffer.from(bytes).toString('utf8').replaceAll('\r\n', '\n');
assert.equal(normalized(readFileSync(pinPath)), normalized(gitBytes(pinPath)), 'Source pins changed');
const pins = JSON.parse(readFileSync(pinPath, 'utf8'));
assert.equal(pins.entries.length, 14, 'Unexpected pin membership');
const pinned = pins.entries.map(row => row.identity);
assert.deepEqual(new Set(pinned.map(row => row.id)), new Set(expected.keys()));
for (const entry of pins.entries) {
  const identity = entry.identity;
  const {fma, file, group, side, category} = expected.get(identity.id);
  assert.equal(entry.group, group);
  assert.equal(identity.fmaId, fma);
  assert.equal(identity.nodeName, fma);
  assert.equal(identity.laterality, side);
  assert.equal(identity.category, category);
  assert.equal(identity.region, 'head-neck');
  assert.equal(identity.system, 'nerves');
  assert.deepEqual(identity.sources.map(source => source.file), [file]);
  assert(identity.sources.every(source => /^[a-f0-9]{64}$/.test(source.sha256)));
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
}

const old = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({
  stdin: {contents:
    "export {orbitalApexCtLesson} from './lib/orbital-apex-ct';" +
    "export {orbitalApexCtTopics,orbitalApexCtReferences,orbitalApexCtScope,orbitalApexCtNote} from './content/orbital-apex-ct';" +
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
const rawBytes = readFileSync(catalogPath);
assert.deepEqual(rawBytes, gitBytes(catalogPath), 'Catalog source changed');
const raw = JSON.parse(rawBytes);
const catalog = live.bodyDisplayCatalog(raw);
assert.deepEqual(new Map(catalog.structures.filter(row => expected.has(row.id)).map(row => [row.id, row])),
  new Map(pinned.map(row => [row.id, row])), 'Catalog and complete pinned identities diverged');
assert.deepEqual(catalog, old.bodyDisplayCatalog(JSON.parse(gitBytes(catalogPath))));
assert.deepEqual(live.structures, old.structures);
assert.deepEqual(live.dissectionProfiles, old.dissectionProfiles);
assert.deepEqual(live.regionalTours, old.regionalTours);
assert.deepEqual(live.contentTabs, old.contentTabs);
for (const path of ['app/anatomy-data.ts', 'app/dissection-data.ts', 'lib/regional-tours.ts'])
  assert.deepEqual(readFileSync(path), gitBytes(path), `${path}: source changed`);
assert.equal(catalog.structures.length, 1104);
assert.equal(live.contentTabs.length, 9);

const active = pins.entries.filter(row => row.group !== 'ciliary-ganglion');
assert.equal(active.length, 12);
assert.deepEqual(new Set(active.map(row => row.group)),
  new Set(['superior-oculomotor','inferior-oculomotor','trochlear','frontal','lacrimal','nasociliary']));
assert.deepEqual(Object.keys(live.orbitalApexCtTopics).sort(), [...new Set(pins.entries.map(row => row.group))].sort());
const cleanLessons = new Map();
for (const entry of pins.entries) {
  const identity = entry.identity;
  const selected = live.orbitalApexCtLesson(identity, 'ct');
  if (entry.group === 'ciliary-ganglion') {
    assert.equal(selected, undefined, `${identity.id}: ganglion must remain pending through fallback`);
    continue;
  }
  const topic = live.orbitalApexCtTopics[entry.group];
  assert.equal(topic.readiness, 'draft');
  assert.deepEqual(live.bodyLesson(identity, 'ct'), selected, `${identity.id}: CT dispatch`);
  assert.equal(selected.readiness, 'draft');
  assert.equal(selected.title, `${identity.name} · CT orientation · draft`);
  assert.equal(selected.body, topic.body);
  assert.deepEqual(selected.bullets, [live.orbitalApexCtScope, ...topic.bullets]);
  assert.deepEqual(selected.citations, topic.citations);
  assert.equal(selected.note, live.orbitalApexCtNote);
  assert(selected.citations.length >= 2 && selected.citations.every(url => /^https:\/\//.test(url)));
  const prose = [selected.title, selected.body, ...selected.bullets, selected.note].join(' ');
  assert.match(prose, /optic strut/i);
  assert.match(prose, /optic canal/i);
  assert.match(prose, /superior orbital fissure/i);
  assert.match(prose, /annul/i);
  assert.match(prose, /not.*(CT|visible|resolved|finding)|does not.*(visibility|visualization)/i);
  assert.match(prose, /revision-bound radiologist review and sign-off are pending/i);
  assert.match(prose, /Atlas, imaging-case and paid-lecture access remain independent/i);
  assert.doesNotMatch(prose, /approved for clinical use|diagnostic sensitivity (?:is|of)|acquisition protocol (?:is|of)/i);
  const {readiness, ...content} = selected;
  assert.deepEqual(live.bodyContent(identity, 'ct'), content);
  const clean = structuredClone(selected);
  cleanLessons.set(identity.id, clean);
  selected.bullets.push('foreign'); selected.citations.push('https://foreign.example');
  assert.deepEqual(live.orbitalApexCtLesson(identity, 'ct'), clean, 'Fresh arrays');
  for (const tab of live.contentTabs) if (tab !== 'ct')
    assert.equal(live.orbitalApexCtLesson(identity, tab), undefined);
}
for (const structure of catalog.structures) if (!expected.has(structure.id))
  for (const tab of live.contentTabs)
    assert.equal(live.orbitalApexCtLesson(structure, tab), undefined, `${structure.id}:${tab}`);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
for (const {identity} of active) {
  const refuse = (bad, label) => {
    assert.equal(live.orbitalApexCtLesson(bad, 'ct'), undefined, `${identity.id}:${label}`);
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

let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let malformed = 0, stale = 0, forgedSaves = 0, forgedApprovals = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  for (const tab of live.contentTabs) {
    const previous = old.bodyLesson(structure, tab), lesson = live.bodyLesson(structure, tab);
    if (cleanLessons.has(structure.id) && tab === 'ct') {
      assert.equal(previous.readiness, 'pending');
      assert.deepEqual(lesson, cleanLessons.get(structure.id));
      changed++;
    } else {
      assert.deepEqual(lesson, previous, `${structure.id}:${tab}`);
      preserved++;
    }
  }
  const previousPacket = await old.bodyReviewMaterial(structure.id);
  const packet = await live.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval, false);
  if (cleanLessons.has(structure.id)) {
    const id = structure.id;
    assert.deepEqual(packet.topics.filter(row => row.tab !== 'ct'),
      previousPacket.topics.filter(row => row.tab !== 'ct'));
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], previousPacket[key], `${id}:${key}`);
    assert.equal(packet.fingerprints.source, previousPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, previousPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, previousPacket.materialHash);
    assert.deepEqual(packet.topics.find(row => row.tab === 'ct'),
      {tab: 'ct', ...live.bodyLesson(structure, 'ct')});
    assert.deepEqual(await live.parseBodyReviewResponse(packet, id), packet);
    assert.equal(await live.parseBodyReviewResponse(previousPacket, id), null);
    for (const edit of [
      value => { value.topics.find(row => row.tab === 'ct').body += ' foreign'; },
      value => { value.topics.find(row => row.tab === 'ct').bullets[0] += ' foreign'; },
      value => { value.topics.find(row => row.tab === 'ct').citations = ['https://foreign.example']; },
      value => { value.topics.find(row => row.tab === 'ct').readiness = 'approved'; },
      value => { value.topics.splice(value.topics.findIndex(row => row.tab === 'ct'), 1); },
      value => { value.source.structure.sources[0].sha256 = '0'.repeat(64); },
    ]) {
      const forged = structuredClone(packet); edit(forged);
      assert.equal(await live.parseBodyReviewResponse(forged, id), null);
      malformed++;
    }
    const priorContext = await old.bodyReviewContext(id), context = await live.bodyReviewContext(id);
    assert.equal(context.sourceHash, priorContext.sourceHash);
    assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
    const decision = {
      catalogScope: context.catalogScope, structureId: id, track: 'teaching', expectedVersion: 0,
      materialHash: context.materialHash, revisionHash: context.revisions.teaching,
      checklistVersion: context.checklistVersion, draft: live.blankBodyReview(context, 'teaching'),
    };
    const save = async input => live.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_ORBITAL_APEX_CT'}, body: JSON.stringify(input),
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
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [12, 9924, 12, 1092]);
assert.deepEqual([malformed, stale, forgedSaves, forgedApprovals, storageCalls], [72, 36, 12, 12, 0]);
for (const bundle of catalog.bundles) {
  const path = 'public' + bundle.url.split('?')[0];
  const bytes = readFileSync(path);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256, path);
  assert.deepEqual(bytes, gitBytes(path), `${path}: geometry unchanged`);
}
console.log(JSON.stringify({baseline, changed, preserved, changedPackets, preservedPackets,
  refusedIdentities, malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale,
  forgedSavesRefusedBeforeStorage: forgedSaves, forgedApprovalsRefusedBeforeStorage: forgedApprovals,
  storageCalls, sourceBundlesUnchanged: catalog.bundles.length, clinicalApproval: false}));
