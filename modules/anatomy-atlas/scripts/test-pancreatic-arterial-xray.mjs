import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = '0587c30bbc43c000ca617d63b9400d6939e51b47';
const expected = new Map([
  ['vm:anatomy:body:abdomen:unspecified:vessel:anterior-superior-pancreaticoduodenal-artery', 'FMA14782'],
  ['vm:anatomy:body:abdomen:unspecified:vessel:posterior-superior-pancreaticoduodenal-artery', 'FMA14784'],
  ['vm:anatomy:body:abdomen:unspecified:vessel:dorsal-pancreatic-artery', 'FMA14787'],
  ['vm:anatomy:body:abdomen:unspecified:vessel:inferior-pancreatic-artery', 'FMA14790'],
  ['vm:anatomy:body:abdomen:unspecified:vessel:great-pancreatic-artery', 'FMA14792'],
  ['vm:anatomy:body:abdomen:unspecified:vessel:caudal-pancreatic-artery', 'FMA14793'],
  ['vm:anatomy:body:abdomen:unspecified:vessel:inferior-pancreaticoduodenal-artery', 'FMA14805'],
  ['vm:anatomy:body:abdomen:unspecified:vessel:anterior-inferior-pancreaticoduodenal-artery', 'FMA70479'],
  ['vm:anatomy:body:abdomen:unspecified:vessel:posterior-inferior-pancreaticoduodenal-artery', 'FMA70480'],
]);
const sourceFiles = new Map([
  ['FMA14782', ['FJ3409']], ['FMA14784', ['FJ3557']],
  ['FMA14787', ['FJ3430']], ['FMA14790', ['FJ3444']],
  ['FMA14792', ['FJ3433']], ['FMA14793', ['FJ3419']],
  ['FMA14805', ['FJ3446']], ['FMA70479', ['FJ3401']],
  ['FMA70480', ['FJ3546']],
]);
const bundles = new Map([...sourceFiles.keys()].map(fma => [fma, 'abdomen-vessels-visceral-detail']));
const pinsPath = 'content/abdominal-arterial-pins.json';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const git = (args, options = {}) => execFileSync('git', args, {
  windowsHide: true, encoding: 'utf8', maxBuffer: 32e6, ...options,
});
const gitBytes = (commit, path) => git(['show', `${commit}:${path}`], {encoding: null});
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
// Local text checkouts may have CRLF; preserve complete JSON comparison against Git.
const pinText = bytes => Buffer.from(bytes).toString('utf8').replaceAll('\r\n', '\n');
assert.equal(pinText(readFileSync(pinsPath)), pinText(gitBytes(baseline, pinsPath)),
  'The full abdominal arterial source pin file remains unchanged');
const pins = JSON.parse(readFileSync(pinsPath, 'utf8'));
const identities = pins.entries.filter(identity => expected.has(identity.id));
assert.equal(identities.length, 9);
assert.deepEqual(new Map(identities.map(identity => [identity.id, identity.fmaId])), expected);
for (const identity of identities) {
  assert.equal(identity.nodeName, expected.get(identity.id));
  assert.equal(identity.region, 'abdomen');
  assert.equal(identity.laterality, identity.id.split(':')[4]);
  assert.equal(identity.system, 'vessels');
  assert.equal(identity.category, 'vessel');
  assert.deepEqual(identity.sources.map(source => source.file), sourceFiles.get(identity.fmaId));
  assert.equal(identity.bundle, bundles.get(identity.fmaId));
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
}

function assertTeachingSemantics(prose, group) {
  assert.match(prose, /plain.{0,80}(?:radiograph|X.ray)/i);
  assert.match(prose, /(?:contrast.{0,100}(?:catheter|angiograph|DSA)|(?:catheter|angiograph|DSA).{0,100}contrast)/i);
  assert.match(prose, /(?:digital subtraction|\bDSA\b)/i);
  assert.match(prose, /\bCTA\b|CT angiograph/i);
  assert.match(prose, /\bMRA\b|MR angiograph/i);
  assert.match(prose, /projection/i);
  assert.match(prose, /(?:source|retained).{0,100}(?:laterality|unspecified|side)/i);
  assert.match(prose, /patient.side marker/i);
  assert.match(prose, /screen.{0,100}(?:not|no).{0,60}patient.side marker/i);
  assert.match(prose, /colou?r/i);
  assert.match(prose, /(?:no|not|without).{0,100}acquired/i);
  assert.match(prose, /(?:no|not|without).{0,140}(?:registration|patient.space)/i);
  assert.match(prose, /(?:no|not|cannot|does not).{0,140}(?:flow|perfusion)/i);
  assert.match(prose, /(?:no|not|cannot|does not).{0,140}(?:procedur|route|catheter.placement)/i);
  assert.match(prose, /(?:no|not|cannot|does not).{0,140}clinical approval/i);
  assert.match(prose, /revision.bound radiologist.{0,60}pending/i);
  assert.match(prose, /independent/i);
  assert.match(prose, /Atlas/i); assert.match(prose, /case/i); assert.match(prose, /lecture/i);
  assert.doesNotMatch(prose, /approved for clinical use|recommended catheter route|diagnostic threshold is/i);
  if (/superior-pancreaticoduodenal/.test(group) || /inferior-pancreaticoduodenal/.test(group)) {
    assert.match(prose, /anterior|posterior/i);
    assert.match(prose, /arcade|pancreaticoduodenal/i);
  }
  if (group === 'dorsal-pancreatic-artery') {
    assert.match(prose, /(?:not always|variable|inconsistent|may not).{0,100}(?:seen|visible|visualiz|identif|depict)/i);
    assert.match(prose, /inverted.?T/i);
    assert.match(prose, /(?:not|no|non.mandatory|variable).{0,100}inverted.?T|inverted.?T.{0,100}(?:not|no|non.mandatory|variable)/i);
  }
  if (group === 'inferior-pancreatic-artery')
    assert.match(prose, /(?:not the|distinct|different|separate).{0,100}inferior pancreaticoduodenal|inferior pancreaticoduodenal.{0,100}(?:distinct|different|separate)/i);
  if (group === 'great-pancreatic-artery') assert.match(prose, /pancreatica magna/i);
  if (group === 'caudal-pancreatic-artery') assert.match(prose, /tail/i);
  if (group === 'inferior-pancreaticoduodenal-artery') {
    assert.match(prose, /(?:trunk|parent)/i);
    assert.match(prose, /anterior/i); assert.match(prose, /posterior/i);
    assert.match(prose, /jejunal/i); assert.match(prose, /separate inferior branches/i);
  }
  assert.doesNotMatch(prose, /always visible|universally patent|mandatory inverted.?T|routine intravenous CTA.{0,50}Okahara/i);
}

function assertStudyLimits(prose, citations, group) {
  if (citations.some(url => /PMC5596604/i.test(url))) {
    assert.match(prose, /39.patient selective arteriograph/i, `${group}: selective series scope`);
    assert.match(prose, /(?:not|does not).{0,120}(?:universal|always|every)/i,
      `${group}: series is not universal visibility or patency evidence`);
  }
  if (citations.some(url => /19777288/.test(url))) {
    assert.match(prose, /226 selective angiograph/i, `${group}: selective angiography cohort`);
    assert.match(prose, /CT.during.selective.arteriograph/i,
      `${group}: CT was during selective arteriography`);
    assert.match(prose, /not routine intravenous CTA/i, `${group}: no routine IV CTA inference`);
  }
  if (citations.some(url => /PMC8816990/i.test(url))) {
    assert.match(prose, /100.patient dual.energy CT/i, `${group}: DECT cohort`);
    assert.match(prose, /(?:CT|cross.sectional).{0,100}(?:not|does not).{0,100}(?:catheter|DSA)/i,
      `${group}: CT findings are not catheter DSA evidence`);
  }
}

const old = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({
  stdin: {contents:
    "export {pancreaticArterialXrayLesson} from './lib/pancreatic-arterial-xray';" +
    "export {pancreaticArterialXrayTopics} from './content/pancreatic-arterial-xray';" +
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
assert.deepEqual(readFileSync(catalogPath), gitBytes(baseline, catalogPath),
  'Live source catalog unchanged');
const catalog = current.bodyDisplayCatalog(raw);
assert.deepEqual(new Map(catalog.structures.filter(s => expected.has(s.id)).map(s => [s.id, s])),
  new Map(identities.map(s => [s.id, s])));
assert.deepEqual(Object.keys(current.pancreaticArterialXrayTopics).sort(),
  [...expected.keys()].map(id => id.split(':').at(-1)).sort());
const cleanLessons = new Map();
for (const identity of identities) {
  const group = identity.id.split(':').at(-1);
  const selected = current.pancreaticArterialXrayLesson(identity, 'xray');
  const topic = current.pancreaticArterialXrayTopics[group];
  assert.deepEqual(current.bodyLesson(identity, 'xray'), selected);
  assert.equal(selected.readiness, 'draft');
  assert.equal(selected.title, `${identity.name} · ${topic.title} · draft`);
  assert.equal(selected.body, topic.body);
  assert(topic.bullets.every(bullet => selected.bullets.includes(bullet)));
  assert.deepEqual(selected.citations, topic.citations);
  assert(selected.title && selected.body && selected.bullets.length >= 2);
  assert(selected.bullets.every(bullet => typeof bullet === 'string' && bullet.trim()));
  assert(selected.citations.includes('https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-abdomen/'), group + ': UAMS anatomy');
  assert(selected.citations.includes('https://www.radiologyinfo.org/en/info/angiocath'), group + ': ACR/RSNA catheter angiography');
  if (/\b(?:Kulenovic|39.patient selective)/i.test([selected.body, ...selected.bullets].join(' ')))
    assert(selected.citations.some(url => /PMC5596604/i.test(url)), group + ': Kulenovic 2010');
  if (/\b(?:Okahara|226 selective angiograph)/i.test([selected.body, ...selected.bullets].join(' ')))
    assert(selected.citations.some(url => /19777288/.test(url)), group + ': Okahara 2010');
  if (/\b(?:dual.energy|DECT|100 patients)/i.test([selected.body, ...selected.bullets].join(' ')))
    assert(selected.citations.some(url => /PMC8816990/i.test(url)), group + ': DECT source');
  assert(selected.citations.every(url => /^https:\/\//.test(url)));
  assert.equal(new Set(selected.citations).size, selected.citations.length);
  const prose = [selected.title, selected.body, ...selected.bullets, selected.note].join(' ');
  assertTeachingSemantics(prose, group);
  assertStudyLimits(prose, selected.citations, group);
  const {readiness, ...content} = selected;
  assert.deepEqual(current.bodyContent(identity, 'xray'), content);
  const clean = structuredClone(selected);
  cleanLessons.set(identity.id, clean);
  selected.bullets.push('foreign'); selected.citations.push('https://foreign.example');
  assert.deepEqual(current.pancreaticArterialXrayLesson(identity, 'xray'), clean, 'Fresh lesson arrays');
  for (const tab of current.contentTabs) if (tab !== 'xray')
    assert.equal(current.pancreaticArterialXrayLesson(identity, tab), undefined);
}
for (const structure of catalog.structures) if (!expected.has(structure.id))
  for (const tab of current.contentTabs)
    assert.equal(current.pancreaticArterialXrayLesson(structure, tab), undefined, `${structure.id}:${tab}`);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
const refuse = (bad, label) => {
  assert.equal(current.pancreaticArterialXrayLesson(bad, 'xray'), undefined, label);
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

// Replay the completed admission after commit. Later independent teaching may evolve.
const featureCommit = git(['log', '--diff-filter=A', '-1', '--format=%H', '--',
  'content/pancreatic-arterial-xray.ts']).trim();
const feature = featureCommit ? await exactSourceHistoryApi(featureCommit, 'review-security') : current;
const featureRaw = featureCommit ? JSON.parse(gitBytes(featureCommit, catalogPath)) : raw;
const featureCatalog = feature.bodyDisplayCatalog(featureRaw);
const featurePins = featureCommit ? gitBytes(featureCommit, pinsPath) : readFileSync(pinsPath);
assert.equal(pinText(featurePins), pinText(gitBytes(baseline, pinsPath)),
  'Admission source pins unchanged');
assert.deepEqual(featureRaw, JSON.parse(gitBytes(baseline, catalogPath)));
assert.deepEqual(featureCatalog, old.bodyDisplayCatalog(JSON.parse(gitBytes(baseline, catalogPath))));
assert.deepEqual(feature.structures, old.structures);
assert.deepEqual(feature.dissectionProfiles, old.dissectionProfiles);
assert.deepEqual(feature.regionalTours, old.regionalTours);
assert.deepEqual(feature.contentTabs, old.contentTabs);
for (const path of ['app/anatomy-data.ts', 'app/dissection-data.ts', 'lib/regional-tours.ts']) {
  const bytes = featureCommit ? gitBytes(featureCommit, path) : readFileSync(path);
  assert.deepEqual(bytes, gitBytes(baseline, path), `${path}: admission guide/source bytes unchanged`);
  assert.deepEqual(readFileSync(path), bytes, `${path}: live guide/source bytes unchanged`);
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
        'oai-authenticated-user-id': 'SYNTHETIC_PANCREATIC_ARTERIAL_XRAY'}, body: JSON.stringify(input),
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
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [9, 9927, 9, 1095]);
assert.deepEqual([malformed, stale, forgedSaves, forgedApprovals, storageCalls], [54, 27, 9, 9, 0]);
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
