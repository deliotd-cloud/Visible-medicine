import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const parentCommit = 'd81bbe14def4249d9d081de6a9f9f823e4fad69a';
const pinsPath = 'content/median-cubital-xray-pins.json';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
// SHA-256 of JSON.stringify(parsed canonical pin record), independent of checkout newlines.
const requiredPinsHash = '51d7af412398ac05921db91cd74b9c70dafae26428c2f2825d0fb8135a921459';
const families = {
  medianCubital: [['right', 'median-cubital-vein', 'FMA22964'],
    ['left', 'median-cubital-vein', 'FMA22965']],
};
const expected = new Map(Object.entries(families).flatMap(([family, pairs]) => pairs.map(
  ([side, vessel, fma]) => [
    `vm:anatomy:body:forearm:${side}:vessel:${side}-${vessel}`,
    {family, side, fma},
  ],
)));
assert.equal(expected.size, 2);
const git = (args, encoding = 'utf8') => execFileSync('git', args, {
  windowsHide: true, encoding, maxBuffer: 64e6,
  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
});
const gitBytes = path => git(['show', `${parentCommit}:${path}`], null);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const pinsBytes = readFileSync(pinsPath);
assert.match(requiredPinsHash, /^[a-f0-9]{64}$/, 'Freeze the completed pin-file hash before testing');
const pins = JSON.parse(pinsBytes);
assert.equal(sha256(JSON.stringify(pins)), requiredPinsHash, 'Completed pin record must remain exact');
const pinsLf = pinsBytes.toString('utf8').replaceAll('\r\n', '\n');
assert.equal(sha256(JSON.stringify(JSON.parse(pinsLf))), requiredPinsHash, 'LF checkout preserves pin record');
assert.equal(sha256(JSON.stringify(JSON.parse(pinsLf.replaceAll('\n', '\r\n')))), requiredPinsHash,
  'CRLF checkout preserves pin record');
assert.equal(pins.parentCommit, parentCommit);
assert.equal(pins.entries.length, 2);
assert.deepEqual(new Set(pins.entries.map(row => row.identity.id)), new Set(expected.keys()));
assert.deepEqual(new Set(pins.entries.map(row => row.family)), new Set(Object.keys(families)));

const compiled = await build({stdin: {contents:
  "export {medianCubitalXrayLesson} from './lib/median-cubital-xray';" +
  "export {medianCubitalXrayTeaching,medianCubitalXrayReferences,medianCubitalXrayNote} from './content/median-cubital-xray';" +
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
  resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false,
  platform: 'node', format: 'esm'});
const now = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const before = await exactSourceHistoryApi(parentCommit, 'review-security');
const raw = JSON.parse(readFileSync(catalogPath, 'utf8'));
assert.deepEqual(readFileSync(catalogPath), gitBytes(catalogPath), 'Catalog bytes unchanged');
const catalog = now.bodyDisplayCatalog(raw);
assert.deepEqual(catalog, before.bodyDisplayCatalog(JSON.parse(gitBytes(catalogPath))));
assert.equal(sha256(Buffer.from(JSON.stringify(catalog))), pins.catalogHash);
assert.deepEqual(catalog.coordinateSystem, pins.coordinateSystem);
assert.deepEqual(now.structures, before.structures);
assert.deepEqual(now.dissectionProfiles, before.dissectionProfiles);
assert.deepEqual(now.regionalTours, before.regionalTours);
assert.deepEqual(now.contentTabs, before.contentTabs);
assert.equal(catalog.structures.length, 1104);
assert.equal(now.contentTabs.length, 9);
assert.equal(catalog.structures.length * now.contentTabs.length, 9936);
assert.equal(now.regionalTours.length, 47);
assert.equal(now.regionalTours.reduce((n, tour) => n + tour.steps.length, 0), 282);
for (const path of ['app/anatomy-data.ts', 'app/dissection-data.ts', 'lib/regional-tours.ts'])
  assert.deepEqual(readFileSync(path), gitBytes(path), `${path}: source unchanged`);
assert.deepEqual(new Set(pins.bundles.map(bundle => bundle.id)),
  new Set(['cubital-veins']));
assert.equal(pins.bundles.length, 1);
for (const bundle of catalog.bundles) {
  const path = `public${bundle.url.split('?')[0]}`;
  const bytes = readFileSync(path);
  assert.deepEqual(bytes, gitBytes(path), `${path}: geometry unchanged`);
  assert.equal(bytes.length, bundle.bytes, path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  if (pins.bundles.some(row => row.id === bundle.id))
    assert.deepEqual(pins.bundles.find(row => row.id === bundle.id), bundle);
}

const refs = now.medianCubitalXrayReferences;
const teaching = now.medianCubitalXrayTeaching;
assert.deepEqual(Object.keys(teaching).sort(), Object.keys(families).sort());
assert(refs && typeof refs === 'object');
assert.deepEqual(Object.keys(refs).sort(), ['variation', 'venography']);
assert.equal(refs.venography, 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12338226/');
assert.equal(refs.variation, 'https://pubmed.ncbi.nlm.nih.gov/23377482/');
for (const url of Object.values(refs)) assert.match(url, /^https:\/\//);
assert.match(now.medianCubitalXrayNote, /revision.bound radiologist/i);
assert.match(now.medianCubitalXrayNote, /registration/i);
assert.match(now.medianCubitalXrayNote, /independent/i);
const rows = new Map(pins.entries.map(row => [row.identity.id, row]));
const cleanLessons = new Map();
for (const [id, row] of rows) {
  const spec = expected.get(id), s = row.identity;
  assert.equal(row.family, spec.family, id);
  assert.equal(s.fmaId, spec.fma, id);
  assert.equal(s.nodeName, spec.fma, id);
  assert.equal(s.region, 'forearm', id);
  assert.equal(s.laterality, spec.side, id);
  assert.equal(s.system, 'vessels', id);
  assert.equal(s.category, 'vessel', id);
  assert.equal(s.bundle, 'cubital-veins', id);
  assert.equal(s.validation.status, 'unvalidated', id);
  assert.equal(s.validation.anatomicalReview, false, id);
  assert.deepEqual(catalog.structures.find(item => item.id === id), s, id);
  assert.deepEqual(row.previous, before.bodyLesson(s, 'xray'), id);
  assert.equal(row.previous.readiness, 'pending', id);
  const lesson = now.medianCubitalXrayLesson(s, 'xray');
  assert.deepEqual(now.bodyLesson(s, 'xray'), lesson, id);
  assert.equal(lesson.readiness, 'draft', id);
  assert.equal(lesson.title, `${s.name} · ${teaching[row.family].title} · draft`, id);
  assert.equal(lesson.body, teaching[row.family].body, id);
  assert.deepEqual(lesson.bullets, [...teaching[row.family].bullets], id);
  assert.deepEqual(lesson.citations, teaching[row.family].citations.map(key => refs[key]), id);
  assert(lesson.bullets.length >= 2 && lesson.bullets.every(value => typeof value === 'string' && value.trim()));
  assert(lesson.citations.length >= 1 && lesson.citations.every(url => /^https:\/\//.test(url)));
  assert.equal(lesson.note, now.medianCubitalXrayNote);
  const prose = [lesson.title, lesson.body, ...lesson.bullets, lesson.note].join(' ');
  assert.doesNotMatch(prose, /approved for clinical use|safe needle route|recommended catheter route|diagnostic threshold is/i, id);
  assert.match(prose, /plain.{0,40}(?:radiograph|film|X.ray)/i, id);
  assert.match(prose, /does not support identifying the normal superficial venous course on a plain film/i, id);
  assert.match(prose, /contrast|venograph/i, id);
  assert.match(prose, /(?:two|2).{0,90}(?:dialysis|haemodialysis|hemodialysis)|(?:dialysis|haemodialysis|hemodialysis).{0,90}(?:two|2)/i, id);
  assert.match(prose, /Jo and colleagues/i, id);
  assert.match(prose, /inject.{0,100}(?:median cubital|access)|(?:median cubital|access).{0,100}inject/i, id);
  assert.match(prose, /(?:not|no|cannot|does not).{0,120}(?:segment|depict|demonstrat|visuali)|(?:segment|depict|demonstrat|visuali).{0,120}(?:not|no|cannot|does not)/i, id);
  assert.match(prose, /(?:variation|varia|nomenclature|nam)/i, id);
  assert.match(prose, /Ukoha.{0,130}(?:surface|tourniquet)/i, id);
  assert.match(prose, /135 young adults/i, id);
  assert.match(prose, /(?:no|not).{0,80}(?:procedural recommendation|cannulation route|acquisition protocol)/i, id);
  assert.match(prose, /(?:not|no|neither).{0,100}(?:patency|flow|continuity|registration)/i, id);
  assert.doesNotMatch(prose, /safe needle route|recommended catheter route|diagnostic threshold is|normal population rate/i, id);
  const {readiness, ...shown} = lesson;
  assert.deepEqual(now.bodyContent(s, 'xray'), shown);
  cleanLessons.set(id, structuredClone(lesson));
  lesson.bullets.push('foreign'); lesson.citations.push('https://foreign.example');
  assert.deepEqual(now.medianCubitalXrayLesson(s, 'xray'), cleanLessons.get(id), 'Fresh arrays');
  for (const tab of now.contentTabs.filter(tab => tab !== 'xray'))
    assert.equal(now.medianCubitalXrayLesson(s, tab), undefined);
}
for (const s of catalog.structures) if (!rows.has(s.id))
  assert.equal(now.medianCubitalXrayLesson(s, 'xray'), undefined, s.id);
assert.equal(now.medianCubitalXrayLesson({id: 'foreign'}, 'xray'), undefined);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let identityRefusals = 0;
for (const {identity} of pins.entries) {
  const refuse = (bad, label) => {
    assert.equal(now.medianCubitalXrayLesson(bad, 'xray'), undefined,
      `${identity.id}:${label}`);
    identityRefusals++;
  };
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
    const key = path.at(-1), original = parent[key];
    parent[key] = typeof original === 'string' ? `${original}-foreign`
      : typeof original === 'number' ? original + 0.01
      : original === null ? 'foreign' : !original;
    refuse(bad, path.join('.'));
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const bad = structuredClone(identity); at(bad, path).push('foreign');
    refuse(bad, `${path.join('.')}: appended array entry`);
    if (at(identity, path).length > 1) {
      const reordered = structuredClone(identity); at(reordered, path).reverse();
      if (JSON.stringify(at(reordered, path)) !== JSON.stringify(at(identity, path)))
        refuse(reordered, `${path.join('.')}: reordered array`);
    }
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const bad = structuredClone(identity); at(bad, path).unexpected = true;
    refuse(bad, `${path.join('.') || '<root>'}: extra field`);
    for (const key of Object.keys(at(identity, path))) {
      const omitted = structuredClone(identity); delete at(omitted, path)[key];
      refuse(omitted, [...path, key].join('.') + ': omitted');
    }
  }
}
assert(identityRefusals > 50);

const earlierForearmPins = JSON.parse(gitBytes('content/forearm-vascular-xray-pins.json'));
assert.equal(earlierForearmPins.entries.length, 8);
for (const {identity} of earlierForearmPins.entries)
  assert.deepEqual(now.bodyLesson(identity, 'xray'), before.bodyLesson(identity, 'xray'),
    `${identity.id}: prior forearm vascular X-ray preserved`);

const earlierElbowPins = JSON.parse(gitBytes('content/elbow-arterial-us-followup-pins.json'));
assert.equal(earlierElbowPins.entries.length, 6);
for (const {identity} of earlierElbowPins.entries)
  assert.deepEqual(now.bodyLesson(identity, 'ultrasound'), before.bodyLesson(identity, 'ultrasound'),
    `${identity.id}: prior elbow ultrasound preserved`);

let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let malformed = 0, stale = 0, forgedSaves = 0, forgedApprovals = 0, storageCalls = 0;
for (const s of catalog.structures) {
  for (const tab of now.contentTabs) {
    const oldLesson = before.bodyLesson(s, tab), lesson = now.bodyLesson(s, tab);
    if (rows.has(s.id) && tab === 'xray') {
      assert.deepEqual(oldLesson, rows.get(s.id).previous);
      assert.deepEqual(lesson, cleanLessons.get(s.id));
      changed++;
    } else {
      assert.deepEqual(lesson, oldLesson, `${s.id}:${tab}: prior teaching preserved`);
      preserved++;
    }
  }
  const oldPacket = await before.bodyReviewMaterial(s.id);
  const packet = await now.bodyReviewMaterial(s.id);
  assert.equal(packet.approval, false);
  if (rows.has(s.id)) {
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], oldPacket[key], `${s.id}:${key}`);
    assert.deepEqual(packet.topics.find(topic => topic.tab === 'quiz'),
      oldPacket.topics.find(topic => topic.tab === 'quiz'), `${s.id}: primary quiz preserved`);
    assert.deepEqual(packet.topics.filter(topic => topic.tab !== 'xray'),
      oldPacket.topics.filter(topic => topic.tab !== 'xray'));
    assert.deepEqual(packet.topics.find(topic => topic.tab === 'xray'),
      {tab: 'xray', ...cleanLessons.get(s.id)});
    assert.equal(packet.fingerprints.source, oldPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, oldPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, oldPacket.materialHash);
    assert.deepEqual(await now.parseBodyReviewResponse(packet, s.id), packet);
    assert.equal(await now.parseBodyReviewResponse(oldPacket, s.id), null);
    for (const edit of [
      value => { value.topics.find(topic => topic.tab === 'xray').body += ' foreign'; },
      value => { value.topics.find(topic => topic.tab === 'xray').citations = ['https://foreign.example']; },
      value => { value.source.structure.sources[0].sha256 = '0'.repeat(64); },
      value => { value.topics.find(topic => topic.tab === 'xray').readiness = 'approved'; },
      value => { value.topics.splice(value.topics.findIndex(topic => topic.tab === 'xray'), 1); },
    ]) {
      const altered = structuredClone(packet); edit(altered);
      assert.equal(await now.parseBodyReviewResponse(altered, s.id), null);
      malformed++;
    }
    const previousContext = await before.bodyReviewContext(s.id);
    const context = await now.bodyReviewContext(s.id);
    assert.equal(context.sourceHash, previousContext.sourceHash);
    assert.notEqual(context.revisions.teaching, previousContext.revisions.teaching);
    const decision = {catalogScope: context.catalogScope, structureId: s.id,
      track: 'teaching', expectedVersion: 0, materialHash: context.materialHash,
      revisionHash: context.revisions.teaching, checklistVersion: context.checklistVersion,
      draft: now.blankBodyReview(context, 'teaching')};
    const save = async input => now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_MEDIAN_CUBITAL_XRAY'},
      body: JSON.stringify(input),
    }), {prepare() { storageCalls++; throw Error('Invalid decision reached storage'); }});
    for (const hashes of [
      {materialHash: previousContext.materialHash, revisionHash: previousContext.revisions.teaching},
      {materialHash: previousContext.materialHash},
      {revisionHash: previousContext.revisions.teaching},
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
    assert.deepEqual(packet, oldPacket, `${s.id}: unrelated packet preserved`);
    preservedPackets++;
  }
}
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [2, 9934, 2, 1102]);
assert.deepEqual([malformed, stale, forgedSaves, forgedApprovals, storageCalls], [10, 6, 2, 2, 0]);
const pendingForearm = catalog.structures.filter(s =>
  s.id.startsWith('vm:anatomy:body:forearm:') && s.system === 'vessels' && !rows.has(s.id));
assert.equal(pendingForearm.length, 22);
for (const s of pendingForearm) if (!earlierForearmPins.entries.some(row => row.identity.id === s.id))
  assert.equal(now.bodyLesson(s, 'xray').readiness, 'pending');
const pendingUncovered = pendingForearm.filter(s =>
  !earlierForearmPins.entries.some(row => row.identity.id === s.id));
assert.equal(pendingUncovered.length, 14);
assert.equal(pendingUncovered.filter(s => s.id.endsWith('-artery')).length, 12);
assert.equal(pendingUncovered.filter(s => s.id.endsWith('-median-antebrachial-vein')).length, 2);
const middle = catalog.structures.filter(s => s.id.includes('middle-collateral-branch-of-') &&
  s.id.includes('-deep-brachial-artery'));
assert.equal(middle.length, 2);
for (const s of middle) assert.equal(now.bodyLesson(s, 'ultrasound').readiness, 'pending');
console.log(JSON.stringify({parentCommit, requiredPinsHash, changed, preserved,
  changedPackets, preservedPackets, identityRefusals, malformed, stale,
  forgedSaves, forgedApprovals, storageCalls, toursPreserved: 47, tourStopsPreserved: 282,
  forearmVesselsXrayPending: 14, middleCollateralUltrasoundPending: 2,
  sourceBundlesUnchanged: catalog.bundles.length, clinicalApproval: false}));
