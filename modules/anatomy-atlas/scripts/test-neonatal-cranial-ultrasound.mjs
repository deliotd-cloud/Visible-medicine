import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const parentCommit = 'c57449c1107a912442c6b0af23e270df41032522';
const pinsPath = 'content/neonatal-cranial-ultrasound-pins.json';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
// SHA-256 of JSON.stringify(parsed pins), independent of checkout newlines.
const requiredPinsHash = 'aa126b609b4a816083ac5c52b30905b6eda7f66d43cd31f90521664dfe6da53a';
const selections = [
  ['caudate', 'left', 'left-caudate-nucleus', 'FMA72827'],
  ['caudate', 'right', 'right-caudate-nucleus', 'FMA72826'],
  ['thalamus', 'left', 'left-thalamus', 'FMA258716'],
  ['thalamus', 'right', 'right-thalamus', 'FMA258714'],
  ['putamen', 'left', 'left-putamen', 'FMA72829'],
  ['putamen', 'right', 'right-putamen', 'FMA72828'],
  ['pallidum', 'left', 'left-globus-pallidus', 'FMA72831'],
  ['pallidum', 'right', 'right-globus-pallidus', 'FMA72830'],
  ['callosum', 'midline', 'corpus-callosum', 'FMA86464'],
  ['plexus', 'midline', 'choroid-plexus-of-cerebral-hemisphere', 'FMA61934'],
];
const expected = new Map(selections.map(([family, side, slug, fma]) => [
  `vm:anatomy:body:head-neck:${side}:organ:${slug}`, {family, side, fma},
]));
assert.equal(expected.size, 10);
const git = (args, encoding = 'utf8') => execFileSync('git', args, {
  windowsHide: true, encoding, maxBuffer: 64e6,
  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
});
const gitBytes = path => git(['show', `${parentCommit}:${path}`], null);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const pinsBytes = readFileSync(pinsPath);
const pins = JSON.parse(pinsBytes);
assert.equal(sha256(JSON.stringify(pins)), requiredPinsHash, 'Completed pin record must remain exact');
const pinsLf = pinsBytes.toString('utf8').replaceAll('\r\n', '\n');
assert.equal(sha256(JSON.stringify(JSON.parse(pinsLf))), requiredPinsHash, 'LF checkout preserves pins');
assert.equal(sha256(JSON.stringify(JSON.parse(pinsLf.replaceAll('\n', '\r\n')))), requiredPinsHash,
  'CRLF checkout preserves pins');
assert.equal(pins.parentCommit, parentCommit);
assert.equal(pins.entries.length, 10);
assert.deepEqual(new Set(pins.entries.map(row => row.identity.id)), new Set(expected.keys()));
assert.deepEqual(new Set(pins.entries.map(row => row.family)), new Set(selections.map(row => row[0])));

const compiled = await build({stdin: {contents:
  "export {neonatalCranialUltrasoundLesson} from './lib/neonatal-cranial-ultrasound';" +
  "export * from './content/neonatal-cranial-ultrasound';" +
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
  new Set(['head-neck-nerves-deep-brain']));
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

const refs = now.neonatalCranialUltrasoundReferences;
const teaching = now.neonatalCranialUltrasoundTeaching;
assert.deepEqual(Object.keys(teaching).sort(), ['callosum', 'caudate', 'pallidum', 'plexus', 'putamen', 'thalamus']);
assert.deepEqual(refs, {
  parameter: 'https://doi.org/10.1002/jum.16551',
  sectorAnatomy: 'https://pubmed.ncbi.nlm.nih.gov/6974980/',
  correlatedAnatomy: 'https://pubmed.ncbi.nlm.nih.gov/6974979/',
  callosalAnatomy: 'https://pubmed.ncbi.nlm.nih.gov/6709917/',
});
assert.match(now.neonatalCranialUltrasoundNote, /open acoustic window/i);
assert.match(now.neonatalCranialUltrasoundNote, /not a validated neonatal model/i);
assert.match(now.neonatalCranialUltrasoundNote, /adult transcranial ultrasound map/i);
assert.match(now.neonatalCranialUltrasoundNote, /registration/i);
assert.match(now.neonatalCranialUltrasoundNote, /revision.bound radiologist sign.off/i);
assert.match(now.neonatalCranialUltrasoundNote, /independent/i);
const rows = new Map(pins.entries.map(row => [row.identity.id, row]));
const cleanLessons = new Map();
for (const [id, row] of rows) {
  const spec = expected.get(id), s = row.identity;
  assert.equal(row.family, spec.family, id);
  assert.equal(s.fmaId, spec.fma, id);
  assert.equal(s.nodeName, spec.fma, id);
  assert.equal(s.region, 'head-neck', id);
  assert.equal(s.laterality, spec.side, id);
  assert.equal(s.system, 'nerves', id);
  assert.equal(s.category, 'organ', id);
  assert.equal(s.bundle, 'head-neck-nerves-deep-brain', id);
  assert.equal(s.validation.status, 'unvalidated', id);
  assert.equal(s.validation.anatomicalReview, false, id);
  assert.deepEqual(catalog.structures.find(item => item.id === id), s, id);
  assert.deepEqual(row.previous, before.bodyLesson(s, 'ultrasound'), id);
  assert.equal(row.previous.readiness, 'pending', id);
  const lesson = now.neonatalCranialUltrasoundLesson(s, 'ultrasound');
  assert.deepEqual(now.bodyLesson(s, 'ultrasound'), lesson, id);
  assert.equal(lesson.readiness, 'draft', id);
  assert.equal(lesson.title, `${s.name} · neonatal/infant ultrasound orientation · draft`, id);
  assert.equal(lesson.body, teaching[row.family].body, id);
  assert.deepEqual(lesson.bullets, [...teaching[row.family].bullets], id);
  assert.deepEqual(lesson.citations, teaching[row.family].citations.map(key => refs[key]), id);
  assert(lesson.bullets.length >= 2 && lesson.bullets.every(value => typeof value === 'string' && value.trim()));
  assert(lesson.citations.length >= 1 && lesson.citations.every(url => /^https:\/\//.test(url)));
  assert.equal(lesson.note, now.neonatalCranialUltrasoundNote);
  const prose = [lesson.title, lesson.body, ...lesson.bullets, lesson.note].join(' ');
  assert.match(prose, /neonatal|infant/i, id);
  assert.match(prose, /fontanelle|acoustic window/i, id);
  assert.match(prose, /not a validated neonatal model/i, id);
  assert.match(prose, /adult transcranial ultrasound map/i, id);
  assert.match(prose, /revision.bound radiologist sign.off/i, id);
  assert.match(prose, /independent/i, id);
  assert.doesNotMatch(prose, /approved for clinical use|diagnostic threshold is|safe procedure|normal population rate/i, id);
  if (row.family === 'plexus') assert.match(prose, /generic source group.*not a pair of separately validated/i);
  if (row.family === 'pallidum') assert.match(prose, /neither an infant.specific reconstruction nor separate validated internal and external pallidal segmentations/i);
  const {readiness, ...shown} = lesson;
  assert.deepEqual(now.bodyContent(s, 'ultrasound'), shown);
  cleanLessons.set(id, structuredClone(lesson));
  lesson.bullets.push('foreign'); lesson.citations.push('https://foreign.example');
  assert.deepEqual(now.neonatalCranialUltrasoundLesson(s, 'ultrasound'), cleanLessons.get(id), 'Fresh arrays');
  for (const tab of now.contentTabs.filter(tab => tab !== 'ultrasound'))
    assert.equal(now.neonatalCranialUltrasoundLesson(s, tab), undefined);
}
for (const s of catalog.structures) if (!rows.has(s.id))
  assert.equal(now.neonatalCranialUltrasoundLesson(s, 'ultrasound'), undefined, s.id);
assert.equal(now.neonatalCranialUltrasoundLesson({id: 'foreign'}, 'ultrasound'), undefined);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let identityRefusals = 0;
for (const {identity} of pins.entries) {
  const refuse = (bad, label) => {
    assert.equal(now.neonatalCranialUltrasoundLesson(bad, 'ultrasound'), undefined,
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
assert(identityRefusals > 250);

let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let malformed = 0, stale = 0, forgedSaves = 0, forgedApprovals = 0, storageCalls = 0;
for (const s of catalog.structures) {
  for (const tab of now.contentTabs) {
    const oldLesson = before.bodyLesson(s, tab), lesson = now.bodyLesson(s, tab);
    if (rows.has(s.id) && tab === 'ultrasound') {
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
    assert.deepEqual(packet.topics.filter(topic => topic.tab !== 'ultrasound'),
      oldPacket.topics.filter(topic => topic.tab !== 'ultrasound'));
    assert.deepEqual(packet.topics.find(topic => topic.tab === 'ultrasound'),
      {tab: 'ultrasound', ...cleanLessons.get(s.id)});
    assert.equal(packet.fingerprints.source, oldPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, oldPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, oldPacket.materialHash);
    assert.deepEqual(await now.parseBodyReviewResponse(packet, s.id), packet);
    assert.equal(await now.parseBodyReviewResponse(oldPacket, s.id), null);
    for (const edit of [
      value => { value.topics.find(topic => topic.tab === 'ultrasound').body += ' foreign'; },
      value => { value.topics.find(topic => topic.tab === 'ultrasound').citations = ['https://foreign.example']; },
      value => { value.source.structure.sources[0].sha256 = '0'.repeat(64); },
      value => { value.topics.find(topic => topic.tab === 'ultrasound').readiness = 'approved'; },
      value => { value.topics.splice(value.topics.findIndex(topic => topic.tab === 'ultrasound'), 1); },
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
        'oai-authenticated-user-id': 'SYNTHETIC_NEONATAL_CRANIAL_US'},
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
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [10, 9926, 10, 1094]);
assert.deepEqual([malformed, stale, forgedSaves, forgedApprovals, storageCalls], [50, 30, 10, 10, 0]);
for (const id of [
  'vm:anatomy:body:head-neck:midline:organ:septum-of-telencephalon',
  'vm:anatomy:body:head-neck:midline:organ:brain',
]) {
  const s = catalog.structures.find(item => item.id === id);
  assert(s, `${id}: broad source selection remains present`);
  assert.deepEqual(now.bodyLesson(s, 'ultrasound'), before.bodyLesson(s, 'ultrasound'));
  assert.equal(now.bodyLesson(s, 'ultrasound').readiness, 'pending');
}
console.log(JSON.stringify({parentCommit, requiredPinsHash, changed, preserved,
  changedPackets, preservedPackets, identityRefusals, malformed, stale,
  forgedSaves, forgedApprovals, storageCalls, toursPreserved: 47, tourStopsPreserved: 282,
  sourceBundlesUnchanged: catalog.bundles.length, clinicalApproval: false}));
