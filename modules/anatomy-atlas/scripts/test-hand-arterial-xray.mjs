import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = '5d34da55a8cab5a9a0751ac0afa56437bee79cb9';
const gitBytes = path => execFileSync('git', ['show', `${baseline}:${path}`],
  {windowsHide: true, maxBuffer: 32e6, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}});
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const pinsPath = 'content/hand-arterial-ultrasound-pins.json';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const pinsBytes = readFileSync(pinsPath), catalogBytes = readFileSync(catalogPath);
assert.deepEqual(pinsBytes, gitBytes(pinsPath), 'Original 28 source pins must be byte exact');
assert.deepEqual(catalogBytes, gitBytes(catalogPath), 'Source catalog must be byte exact');
for (const path of [
  'content/exports/shoulder.v2.json',
  'content/limb-vascular-recipe-transition.json',
  'content/longus-colli-recipe-transition.json',
  'content/tentorium-recipe-transition.json',
  'lib/regional-tours.ts',
  'lib/shoulder-tours.ts',
]) assert.deepEqual(readFileSync(path), gitBytes(path), `${path}: unrelated source preserved`);
const pins = JSON.parse(pinsBytes), rawCatalog = JSON.parse(catalogBytes);
const expectedGroups = {superficialArch: 2, deepArch: 2, metacarpal: 2,
  princeps: 2, radialis: 2, commonDigital: 8, properDigital: 10};
const selectedGroups = ['superficialArch', 'deepArch', 'princeps'];
assert.deepEqual(Object.fromEntries(Object.keys(expectedGroups).map(group =>
  [group, pins.entries.filter(entry => entry.group === group).length])), expectedGroups);
assert.equal(pins.entries.length, 28);
assert.equal(new Set(pins.entries.map(entry => entry.identity.id)).size, 28);
assert.equal(pins.entries.filter(entry => entry.group === 'properDigital' &&
  entry.identity.laterality === 'right').length, 6);
assert.equal(pins.entries.filter(entry => entry.group === 'properDigital' &&
  entry.identity.laterality === 'left').length, 4);
const identities = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
const selections = new Map(pins.entries.filter(entry => selectedGroups.includes(entry.group))
  .map(entry => [entry.identity.id, entry]));
assert.equal(selections.size, 6);
assert.equal([...identities.keys()].filter(id => !selections.has(id)).length, 22);
for (const {identity, group} of pins.entries) {
  assert.equal(identity.region, 'hand');
  assert.equal(identity.system, 'vessels');
  assert.equal(identity.category, 'vessel');
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
  assert(['right', 'left'].includes(identity.laterality));
  assert.equal(identity.nodeName, identity.fmaId);
  assert(identity.name.toLowerCase().includes(identity.laterality));
  assert(Object.hasOwn(expectedGroups, group));
  if (group === 'princeps' || group === 'radialis') assert.equal(identity.sources.length, 2);
}
for (const bundle of pins.bundles) {
  const path = 'public' + bundle.url.split('?')[0];
  const bytes = readFileSync(path);
  assert.deepEqual(bytes, gitBytes(path), `${bundle.id}: original geometry bytes`);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(sha256(bytes), bundle.sha256);
}

const compiled = await build({stdin: {contents:
  "export {handArterialXrayLesson} from './lib/hand-arterial-xray';" +
  "export * from './content/hand-arterial-xray';" +
  "export {bodyLesson,bodyContent} from './app/body-content';" +
  "export {bodyDisplayCatalog} from './lib/body-display-catalog';" +
  "export {contentTabs} from './lib/content-types';" +
  "export {regionalTours} from './lib/regional-tours';" +
  "export {structures} from './app/anatomy-data';" +
  "export {dissectionProfiles} from './app/dissection-data';" +
  "export * from './lib/body-review-material';" +
  "export * from './lib/body-review-context';" +
  "export * from './lib/body-review-response';" +
  "export * from './lib/body-review-api';" +
  "export * from './lib/body-review-decisions';",
  resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false,
  platform: 'node', format: 'esm'});
const live = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const old = await exactSourceHistoryApi(baseline, 'review-security');
const catalog = live.bodyDisplayCatalog(rawCatalog);
assert.deepEqual(catalog, old.bodyDisplayCatalog(rawCatalog));
assert.deepEqual(live.contentTabs, old.contentTabs);
assert.deepEqual(live.regionalTours, old.regionalTours);
assert.deepEqual(live.structures, old.structures);
assert.deepEqual(live.dissectionProfiles, old.dissectionProfiles);
assert.equal(catalog.structures.length * live.contentTabs.length, 9936);
assert.equal(catalog.structures.length, 1104);
for (const {identity} of pins.entries)
  assert.deepEqual(catalog.structures.find(structure => structure.id === identity.id), identity);

assert.equal(typeof live.handArterialXrayNote, 'string');
assert.equal(typeof live.handArterialXrayReferences, 'object');
assert(Object.keys(live.handArterialXrayReferences).length > 0);
for (const reference of Object.values(live.handArterialXrayReferences))
  assert.equal(new URL(reference).protocol, 'https:');
assert.deepEqual(Object.keys(live.handArterialXrayTeaching).sort(), [...selectedGroups].sort());
for (const group of selectedGroups)
  assert.equal(typeof live.handArterialXrayTeaching[group], 'object');

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
for (const {identity} of selections.values()) {
  assert.equal(live.handArterialXrayLesson(identity, 'xray')?.readiness, 'draft');
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
    const key = path.at(-1), original = parent[key];
    parent[key] = typeof original === 'string' ? original + '-foreign'
      : typeof original === 'number' ? original + 0.01
        : original === null ? 'foreign' : !original;
    assert.equal(live.handArterialXrayLesson(bad, 'xray'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const bad = structuredClone(identity); at(bad, path).push('foreign');
    assert.equal(live.handArterialXrayLesson(bad, 'xray'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const bad = structuredClone(identity); at(bad, path).unexpected = true;
    assert.equal(live.handArterialXrayLesson(bad, 'xray'), undefined, path.join('.') || '<root>');
    refusedIdentities++;
  }
}

let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let malformed = 0, stale = 0, forged = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  const entry = selections.get(structure.id);
  for (const tab of live.contentTabs) {
    const previous = old.bodyLesson(structure, tab), lesson = live.bodyLesson(structure, tab);
    if (entry && tab === 'xray') {
      assert.equal(previous.readiness, 'pending');
      assert.equal(lesson.readiness, 'draft');
      assert.deepEqual(lesson, live.handArterialXrayLesson(structure, tab));
      assert(lesson.title.startsWith(structure.name));
      const prose = [lesson.title, lesson.body, ...lesson.bullets, lesson.note].join(' ');
      assert.match(prose, /plain.{0,30}radiograph|plain x[- ]ray/i);
      assert.match(prose, /not (?:an? )?(?:arterial|vascular) map|cannot (?:map|show|depict) (?:the )?arter/i);
      assert.match(prose, /contrast angiograph|contrast angiogram|arteriograph/i);
      assert.match(prose, /projection/i);
      assert.match(prose, /variable filling/i);
      assert.match(prose, /patency/i);
      assert.match(prose, /complete (?:arterial|vascular|branch)/i);
      assert.match(lesson.note, /review pending for this exact source and teaching revision|revision-bound radiologist/i);
      assert.match(lesson.note, /No (?:patient )?imaging study|No patient images/i);
      assert.match(lesson.note, /access remain independent/i);
      assert.doesNotMatch(prose, /approved for clinical use|diagnostic threshold is|registered to (?:a )?patient/i);
      if (entry.group === 'superficialArch' || entry.group === 'deepArch')
        assert.match(prose, /arch/i);
      if (entry.group === 'princeps') assert.match(prose, /thumb|pollicis/i);
      const {readiness, ...content} = lesson;
      assert.deepEqual(live.bodyContent(structure, tab), content);
      const copy = structuredClone(lesson);
      lesson.bullets.push('foreign'); lesson.citations.push('https://foreign.example');
      assert.deepEqual(live.handArterialXrayLesson(structure, tab), copy, 'Detached lesson');
      changed++;
    } else {
      assert.deepEqual(lesson, previous, `${structure.id}:${tab}`);
      assert.equal(live.handArterialXrayLesson(structure, tab), undefined,
        'No identity or modality leakage');
      preserved++;
    }
  }
  const previousPacket = await old.bodyReviewMaterial(structure.id);
  const packet = await live.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval, false);
  if (entry) {
    assert.deepEqual(packet.topics.filter(row => row.tab !== 'xray'),
      previousPacket.topics.filter(row => row.tab !== 'xray'));
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], previousPacket[key], `${structure.id}:${key}`);
    assert.equal(packet.fingerprints.source, previousPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, previousPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, previousPacket.materialHash);
    assert.deepEqual(packet.topics.find(row => row.tab === 'xray'),
      {tab: 'xray', ...live.bodyLesson(structure, 'xray')});
    assert.deepEqual(await live.parseBodyReviewResponse(packet, structure.id), packet);
    assert.equal(await live.parseBodyReviewResponse(previousPacket, structure.id), null);
    for (const edit of [
      value => { value.topics.find(row => row.tab === 'xray').body += ' foreign'; },
      value => { value.topics.find(row => row.tab === 'xray').citations = ['https://foreign.example']; },
      value => { value.source.structure.sources[0].sha256 = '0'.repeat(64); },
      value => { value.topics.find(row => row.tab === 'xray').readiness = 'approved'; },
      value => { value.topics.splice(value.topics.findIndex(row => row.tab === 'xray'), 1); },
    ]) {
      const altered = structuredClone(packet); edit(altered);
      assert.equal(await live.parseBodyReviewResponse(altered, structure.id), null);
      malformed++;
    }
    const priorContext = await old.bodyReviewContext(structure.id);
    const context = await live.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash, priorContext.sourceHash);
    assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
    const decision = {catalogScope: context.catalogScope, structureId: structure.id,
      track: 'teaching', expectedVersion: 0, materialHash: context.materialHash,
      revisionHash: context.revisions.teaching, checklistVersion: context.checklistVersion,
      draft: live.blankBodyReview(context, 'teaching')};
    const save = input => live.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_HAND_ARTERIAL_XRAY'}, body: JSON.stringify(input),
    }), {prepare() { storageCalls++; throw Error('Rejected decision reached storage'); }});
    for (const delta of [
      {materialHash: priorContext.materialHash, revisionHash: priorContext.revisions.teaching},
      {materialHash: priorContext.materialHash},
      {revisionHash: priorContext.revisions.teaching},
    ]) {
      assert.equal((await save({...decision, ...delta})).status, 409); stale++;
    }
    const forgedDecision = structuredClone(decision);
    forgedDecision.draft.status = 'approved';
    assert.equal((await save(forgedDecision)).status, 422); forged++;
    changedPackets++;
  } else {
    assert.deepEqual(packet, previousPacket, `${structure.id}: unrelated review packet`);
    preservedPackets++;
  }
}
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [6, 9930, 6, 1098]);
assert.deepEqual([malformed, stale, forged, storageCalls], [30, 18, 6, 0]);
console.log(JSON.stringify({baseline, pinsSha256: sha256(pinsBytes), catalogSha256: sha256(catalogBytes),
  changed, preserved, changedPackets, preservedPackets, refusedIdentities,
  malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale,
  forgedApprovalRefusalsBeforeStorage: forged, storageCalls,
  geometryBundlesByteExact: pins.bundles.length, clinicalApproval: false}));
