import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = '20988a1ba542b7a39d2135cfa5c2e426ab81d593';
const featureCommit = 'fc894122f24b80ad30846b9ffdefc342567bedc2';
const pinPath = 'content/genicular-imaging-pins.json';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const expected = new Map([
  ['right-middle-genicular-artery', ['right', 'FMA22562', 'FJ2167', 'middle']],
  ['left-middle-genicular-artery', ['left', 'FMA22563', 'FJ2084', 'middle']],
  ['right-inferior-lateral-genicular-artery', ['right', 'FMA43892', 'FJ2150', 'inferior-lateral']],
  ['left-inferior-lateral-genicular-artery', ['left', 'FMA43893', 'FJ2076', 'inferior-lateral']],
].map(([name, fields]) => [`vm:anatomy:body:leg:${fields[0]}:vessel:${name}`, fields]));
const git = (args, options = {}) => execFileSync('git', args, {
  encoding: 'utf8', windowsHide: true, maxBuffer: 32e6,
  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}, ...options,
});
const gitBytes = path => git(['show', `${baseline}:${path}`], {encoding: null});
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const normalized = bytes => Buffer.from(bytes).toString('utf8').replaceAll('\r\n', '\n');
const unchangedJson = path => {
  const bytes = readFileSync(path);
  assert.equal(normalized(bytes), normalized(gitBytes(path)), `${path}: historical source unchanged`);
  return JSON.parse(bytes.toString('utf8'));
};

assert.equal(git(['rev-parse', `${baseline}^{commit}`]).trim(), baseline);
assert.equal(git(['rev-parse', `${featureCommit}^{commit}`]).trim(), featureCommit);
assert.equal(git(['merge-base', featureCommit, 'HEAD']).trim(), featureCommit);
for(const path of ['content/genicular-ultrasound.ts','lib/genicular-ultrasound.ts'])
  assert.equal(normalized(readFileSync(path)),normalized(git(['show',`${featureCommit}:${path}`],{encoding:null})),`${path}: current implementation matches its exact feature epoch`);
const pins = unchangedJson(pinPath);
const raw = unchangedJson(catalogPath);
assert.equal(pins.entries.length, 10);
const identities = pins.entries.map(row => row.identity).filter(identity => expected.has(identity.id));
assert.equal(identities.length, 4);
assert.deepEqual(new Set(identities.map(identity => identity.id)), new Set(expected.keys()));
for (const identity of identities) {
  const [side, fma, file, group] = expected.get(identity.id);
  const pin = pins.entries.find(row => row.identity.id === identity.id);
  assert.equal(pin.group, group);
  assert.equal(identity.fmaId, fma);
  assert.equal(identity.nodeName, fma);
  assert.equal(identity.laterality, side);
  assert.equal(identity.region, 'leg');
  assert.equal(identity.system, 'vessels');
  assert.equal(identity.category, 'vessel');
  assert.equal(identity.bundle, 'genicular-arteries');
  assert.equal(identity.sourceTree, 'isa');
  assert.deepEqual(identity.sources.map(source => source.file), [file]);
  assert(identity.sources.every(source => /^[a-f0-9]{64}$/.test(source.sha256)));
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
  assert(identity.bounds && identity.center && identity.anchor);
  assert.match(identity.coverageNote, /two disconnected components/i);
  assert.doesNotMatch(identity.coverageNote, /two (?:validated )?branches/i);
}

const old = await exactSourceHistoryApi(baseline, 'review-security');
const feature = await exactSourceHistoryApi(featureCommit, 'review-security');
const compiled = await build({
  stdin: {contents: [
    "export {genicularUltrasoundLesson} from './lib/genicular-ultrasound';",
    "export {genicularUltrasoundTopics} from './content/genicular-ultrasound';",
    "export {bodyLesson,bodyContent} from './app/body-content';",
    "export {bodyDisplayCatalog} from './lib/body-display-catalog';",
    "export {contentTabs} from './lib/content-types';",
    "export {structures} from './app/anatomy-data';",
    "export {dissectionProfiles} from './app/dissection-data';",
    "export {regionalTours} from './lib/regional-tours';",
    "export * from './lib/body-review-material';",
    "export * from './lib/body-review-context';",
    "export * from './lib/body-review-response';",
    "export * from './lib/body-review-api';",
    "export * from './lib/body-review-decisions';",
  ].join(''), resolveDir: process.cwd(), loader: 'ts'},
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const current = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog = current.bodyDisplayCatalog(raw);
assert.deepEqual(new Map(catalog.structures.filter(s => expected.has(s.id)).map(s => [s.id, s])),
  new Map(identities.map(s => [s.id, s])));
assert.deepEqual(Object.keys(current.genicularUltrasoundTopics).sort(), ['inferior-lateral', 'middle']);
assert.deepEqual(current.structures, old.structures);
assert.deepEqual(current.dissectionProfiles, old.dissectionProfiles);
assert.deepEqual(current.regionalTours, old.regionalTours);
assert.deepEqual(current.contentTabs, old.contentTabs);
assert.deepEqual(catalog, old.bodyDisplayCatalog(JSON.parse(gitBytes(catalogPath))));
assert.equal(catalog.structures.length, 1104);
assert.equal(current.contentTabs.length, 9);
assert.equal(catalog.structures.length * current.contentTabs.length, 9936);
assert.deepEqual(feature.bodyDisplayCatalog(raw),catalog);
assert.deepEqual(feature.contentTabs,current.contentTabs);

const cleanLessons = new Map();
for (const identity of identities) {
  const topic = current.genicularUltrasoundTopics[expected.get(identity.id)[3]];
  const selected = current.genicularUltrasoundLesson(identity, 'ultrasound');
  assert(selected, `${identity.id}: exact pin resolves`);
  assert.deepEqual(current.bodyLesson(identity, 'ultrasound'), selected);
  assert.equal(selected.readiness, 'draft');
  assert.match(selected.title, /ultrasound.*draft/i);
  assert.equal(selected.body, topic.body);
  assert(topic.bullets.every(bullet => selected.bullets.includes(bullet)));
  assert(topic.citations.every(url => selected.citations.includes(url)));
  assert(selected.citations.every(url => /^https:\/\//.test(url)));
  assert.equal(new Set(selected.citations).size, selected.citations.length);
  assert(selected.bullets.every(bullet => typeof bullet === 'string' && bullet.trim()));
  assert(selected.note && selected.note.trim());
  const prose = [selected.title, selected.body, ...selected.bullets, selected.note].join(' ');
  assert.match(prose, /(?:exact.revision|revision.bound) radiologist/i);
  assert.match(prose, /pending/i);
  assert.match(prose, /(?:no|not|without).{0,100}(?:acquired|patient scan|patient image)/i);
  assert.match(prose, /(?:no|not|without).{0,120}(?:registration|patient.space)/i);
  assert.match(prose, /(?:no|not|without).{0,120}clinical approval/i);
  for (const word of ['Atlas', 'case', 'lecture', 'independent']) assert.match(prose, new RegExp(word, 'i'));
  assert.doesNotMatch(prose, /approved for clinical use|diagnostic threshold|recommended (?:catheter|injection|procedural) route/i);
  if (expected.get(identity.id)[3] === 'middle') {
    assert.match(prose, /Watanabe/i);
    assert.match(prose, /ten healthy young men|10 healthy young men/i);
    assert.match(prose, /right knees/i);
    assert.match(prose, /B.mode/i);
    assert.match(prose, /pulsed Doppler/i);
    assert.match(prose, /(?:does not|cannot|no).{0,100}detection rate/i);
    assert.match(prose, /two disconnected components/i);
    assert.doesNotMatch(prose, /two (?:validated )?branches/i);
  } else {
    assert.match(prose, /Karimov and Madrakhimov/i);
    assert.match(prose, /day.one postoperative/i);
    assert.match(prose, /12 selected total.knee.arthroplasty patients/i);
    assert.match(prose, /eight of the 12 knees|8 of 12/i);
    assert.match(prose, /(?:did not|not|no).{0,100}(?:unoperated|normal)/i);
    assert.match(prose, /transillumination/i);
    assert.match(prose, /(?:not|separate).{0,100}ultrasound detection/i);
  }
  const {readiness, ...content} = selected;
  assert.deepEqual(current.bodyContent(identity, 'ultrasound'), content);
  const clean = structuredClone(selected);
  cleanLessons.set(identity.id, clean);
  selected.bullets.push('foreign'); selected.citations.push('https://foreign.example');
  assert.deepEqual(current.genicularUltrasoundLesson(identity, 'ultrasound'), clean, 'Fresh lesson arrays');
  for (const tab of current.contentTabs) if (tab !== 'ultrasound')
    assert.equal(current.genicularUltrasoundLesson(identity, tab), undefined);
}
for (const structure of catalog.structures) if (!expected.has(structure.id))
  for (const tab of current.contentTabs)
    assert.equal(current.genicularUltrasoundLesson(structure, tab), undefined, `${structure.id}:${tab}`);

// Mutate every scalar, array and object level: matching names or FMA IDs cannot replace full sourceCanonical equality.
const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
const refuse = (bad, label) => {
  assert.equal(current.genicularUltrasoundLesson(bad, 'ultrasound'), undefined, label);
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

let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let malformed = 0, stale = 0, forgedSaves = 0, forgedApprovals = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  for (const tab of current.contentTabs) {
    // Prove the complete original transition against its immutable feature epoch.
    // Later, unrelated lessons must not masquerade as genicular regressions.
    const previous = old.bodyLesson(structure, tab), lesson = feature.bodyLesson(structure, tab);
    if(expected.has(structure.id))
      assert.deepEqual(current.bodyLesson(structure,tab),lesson,`${structure.id}:${tab}: current genicular target retained`);
    if (expected.has(structure.id) && tab === 'ultrasound') {
      assert.equal(previous.readiness, 'pending');
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
    assert.deepEqual(await current.bodyReviewMaterial(id),packet,`${id}: current Review material matches feature epoch`);
    const liveContext=await current.bodyReviewContext(id),featureContext=await feature.bodyReviewContext(id);
    // Renderer/geometry decisions bind current code, not an old feature's renderer.
    // All source/material/teaching/checklist fields must still match exactly.
    const stableContext=({rendererHash,revisions:{geometry,...revisions},...rest})=>({...rest,revisions});
    assert.deepEqual(stableContext(liveContext),stableContext(featureContext),`${id}: current source/teaching context retained`);
    assert.equal(liveContext.rendererHash,JSON.parse(readFileSync('content/body-renderer-revision.json','utf8')).sha256);
    const geometryInput={catalogScope:liveContext.catalogScope,structureId:id,
      checklistVersion:liveContext.checklistVersion,source:liveContext.sourceHash,
      renderer:liveContext.rendererHash,checks:liveContext.checklists.geometry};
    assert.equal(liveContext.revisions.geometry,sha256(JSON.stringify(geometryInput)),`${id}: current geometry decision stays renderer-bound`);
    assert.deepEqual(packet.topics.filter(row => row.tab !== 'ultrasound'),
      previousPacket.topics.filter(row => row.tab !== 'ultrasound'));
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], previousPacket[key], `${id}:${key}`);
    assert.equal(packet.fingerprints.source, previousPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, previousPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, previousPacket.materialHash);
    assert.deepEqual(packet.topics.find(row => row.tab === 'ultrasound'),
      {tab: 'ultrasound', ...current.bodyLesson(structure, 'ultrasound')});
    assert.ok(await current.parseBodyReviewResponse(packet, id) === packet);
    assert.equal(await current.parseBodyReviewResponse(previousPacket, id), null);
    for (const edit of [
      value => { value.topics.find(row => row.tab === 'ultrasound').body += ' foreign'; },
      value => { value.topics.find(row => row.tab === 'ultrasound').bullets[0] += ' foreign'; },
      value => { value.topics.find(row => row.tab === 'ultrasound').citations = ['https://foreign.example']; },
      value => { value.topics.find(row => row.tab === 'ultrasound').readiness = 'approved'; },
      value => { value.topics.splice(value.topics.findIndex(row => row.tab === 'ultrasound'), 1); },
      value => { value.source.structure.sources[0].sha256 = '0'.repeat(64); },
    ]) {
      const forged = structuredClone(packet); edit(forged);
      assert.equal(await current.parseBodyReviewResponse(forged, id), null);
      malformed++;
    }
    const priorContext = await old.bodyReviewContext(id), context = await current.bodyReviewContext(id);
    assert.equal(context.sourceHash, priorContext.sourceHash);
    assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
    const decision = {
      catalogScope: context.catalogScope, structureId: id, track: 'teaching', expectedVersion: 0,
      materialHash: context.materialHash, revisionHash: context.revisions.teaching,
      checklistVersion: context.checklistVersion, draft: current.blankBodyReview(context, 'teaching'),
    };
    const save = async input => current.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_GENICULAR_ULTRASOUND'}, body: JSON.stringify(input),
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

for (const path of ['app/anatomy-data.ts', 'app/dissection-data.ts', 'lib/regional-tours.ts'])
  assert.deepEqual(readFileSync(path), gitBytes(path), `${path}: historical anatomy/dissection/tours unchanged`);
const nestedPaths = git(['ls-tree', '-r', '--name-only', baseline, '--', 'app', 'lib', 'content'])
  .split(/\r?\n/).filter(path => /(?:nested|specimen)/i.test(path));
assert(nestedPaths.length > 0);
for (const path of nestedPaths)
  assert.deepEqual(readFileSync(path), gitBytes(path), `${path}: nested/specimen unchanged`);
for (const bundle of catalog.bundles) {
  const path = 'public' + bundle.url.split('?')[0];
  const bytes = readFileSync(path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  assert.deepEqual(bytes, gitBytes(path), `${path}: source geometry unchanged`);
}
console.log(JSON.stringify({baseline, featureCommit, originalTransitionEpochPinned:true,
  currentTargetsRetained:4,currentTargetTopicPlacementsRetained:36,currentReviewPacketsRetained:4,
  changed, preserved, changedPackets, preservedPackets,
  refusedIdentities, malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale,
  forgedSavesRefusedBeforeStorage: forgedSaves,
  forgedApprovalsRefusedBeforeStorage: forgedApprovals, storageCalls,
  sourceBundlesUnchanged: catalog.bundles.length, clinicalApproval: false}));
