import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = 'aa7437abd793a0c2dac7260555097204864cf45c';
// This expectation is independent of the resolver's mutable target list.
const expected = new Map([
  ['FMA50029', 'anteriorCerebral'], ['FMA50030', 'anteriorCerebral'],
  ['FMA50169', 'anteriorCommunicating'],
  ['FMA50584', 'posteriorCerebral'], ['FMA50585', 'posteriorCerebral'],
  ['FMA50085', 'posteriorCommunicating'], ['FMA50086', 'posteriorCommunicating'],
  ['FMA50082', 'middleCerebral'],
  ['FMA50519', 'posteriorInferiorCerebellar'], ['FMA50520', 'posteriorInferiorCerebellar'],
  ['FMA50574', 'superiorCerebellar'], ['FMA50575', 'superiorCerebellar'],
]);
const pinsPath = 'content/cerebral-arterial-quiz-pins.json';
const arteriesPath = 'public/models/bodyparts3d/cranial-arteries/catalog.json';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const git = (args, options = {}) => execFileSync('git', args, {
  windowsHide: true, encoding: 'utf8', maxBuffer: 32e6, ...options,
});
const gitBytes = (commit, path) => git(['show', `${commit}:${path}`], {encoding: null});
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
for (const path of [pinsPath, arteriesPath, catalogPath])
  assert.deepEqual(readFileSync(path), gitBytes(baseline, path), `${path} source bytes unchanged`);

const pins = JSON.parse(readFileSync(pinsPath, 'utf8'));
const arteries = JSON.parse(readFileSync(arteriesPath, 'utf8'));
assert.equal(pins.entries.length, 8, 'Seven targets plus the excluded basilar pin');
assert.equal(arteries.structures.length, 5);
const selectedPins = pins.entries.filter(entry => entry.group !== 'basilar');
assert.equal(selectedPins.length, 7);
assert.equal(pins.entries.filter(entry => entry.group === 'basilar').length, 1);
const entries = [
  ...selectedPins.map(({identity, group}) => ({identity, group})),
  ...arteries.structures.map(identity => ({identity, group: expected.get(identity.fmaId)})),
];
assert.equal(entries.length, 12);
assert.deepEqual(new Map(entries.map(({identity, group}) => [identity.fmaId, group])), expected);
const identities = new Map(entries.map(({identity}) => [identity.id, identity]));
assert.equal(identities.size, 12);
for (const {identity, group} of entries) {
  assert.equal(identity.fmaId, identity.nodeName);
  assert.equal(identity.system, 'vessels');
  assert.equal(identity.category, 'vessel');
  assert.equal(identity.region, 'head-neck');
  assert.equal(identity.bundle,
    selectedPins.some(entry => entry.identity.id === identity.id)
      ? 'head-neck-vessels-recovery' : 'cranial-arteries');
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
  assert.equal(group, expected.get(identity.fmaId));
}
for (const fmaId of ['FMA50584', 'FMA50585'])
  assert.equal(entries.find(e => e.identity.fmaId === fmaId).identity.sources.length, 9);
for (const fmaId of ['FMA50519', 'FMA50520']) {
  const source = entries.find(e => e.identity.fmaId === fmaId).identity;
  assert.equal(source.sources.length, 13);
  assert.match(source.coverageNote, /fourteen components.*[Dd]isconnected/s);
}
const rightMca = entries.find(e => e.identity.fmaId === 'FMA50082').identity;
assert.equal(rightMca.sources.length, 3);
assert.match(rightMca.coverageNote, /six components.*no matching left MCA/s);
for (const fmaId of ['FMA50574', 'FMA50575']) {
  const source = entries.find(e => e.identity.fmaId === fmaId).identity;
  assert.equal(source.sources.length, 1);
  assert.match(source.coverageNote, /proximal portion crosses the source midline.*without reflection/s);
}

const old = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({
  stdin: {
    contents: "export {intracranialArterialXrayLesson} from './lib/intracranial-arterial-xray';" +
      "export {intracranialArterialXrayTopics} from './content/intracranial-arterial-xray';" +
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
    resolveDir: process.cwd(), loader: 'ts',
  }, bundle: true, write: false, platform: 'node', format: 'esm',
});
const current = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
assert.deepEqual(Object.keys(current.intracranialArterialXrayTopics).sort(),
  [...new Set(expected.values())].sort());
for (const group of new Set(expected.values())) {
  const topic = current.intracranialArterialXrayTopics[group];
  assert.equal(typeof topic.title, 'string'); assert(topic.title.trim());
  assert.equal(typeof topic.body, 'string'); assert(topic.body.trim());
  assert(Array.isArray(topic.bullets) && topic.bullets.length > 0);
  assert(topic.bullets.every(b => typeof b === 'string' && b.trim()));
  assert(Array.isArray(topic.citations) && topic.citations.length > 0);
  assert(topic.citations.every(url => /^https:\/\//.test(url)));
  assert.equal(new Set(topic.citations).size, topic.citations.length);
}
const sourceLimits = {
  anteriorCerebral: [/A1\/A2/i, /not separately selectable/i, /no arterial territory/i],
  anteriorCommunicating: [/274 angiography patients/i, /not a normal.population prevalence/i,
    /neither a complete donor circle nor collateral adequacy/i],
  posteriorCerebral: [/nine original parts remain one PCA selection/i, /no independent segment labels/i],
  posteriorCommunicating: [/neither lumen patency nor the functional completeness/i],
  middleCerebral: [/three original PART.OF files form six components/i,
    /no left counterpart is reconstructed or mirrored/i, /separately sourced left MCA/i],
  posteriorInferiorCerebellar: [/thirteen original files form fourteen components/i,
    /disconnected pieces remain visible/i, /neither a continuous lumen/i],
  superiorCerebellar: [/proximal portion crosses the source midline/i,
    /laterality is retained without reflection/i],
};
for (const [group, patterns] of Object.entries(sourceLimits)) {
  const topic = current.intracranialArterialXrayTopics[group];
  const prose = [topic.title, topic.body, ...topic.bullets].join(' ');
  for (const pattern of patterns) assert.match(prose, pattern, `${group}: ${pattern}`);
}

const raw = JSON.parse(readFileSync(catalogPath, 'utf8'));
const catalog = current.bodyDisplayCatalog(raw);
assert.deepEqual(catalog.structures.filter(s => identities.has(s.id)).map(s => s.id).sort(),
  [...identities.keys()].sort(), 'Exactly twelve existing display structures');
for (const {identity, group} of entries) {
  const display = catalog.structures.find(s => s.id === identity.id);
  assert.deepEqual(display, identity, `${identity.fmaId}: exact retained source record`);
  const topic = current.intracranialArterialXrayTopics[group];
  assert.equal(old.bodyLesson(identity, 'xray').readiness, 'pending');
  const selected = current.intracranialArterialXrayLesson(identity, 'xray');
  const shown = current.bodyLesson(identity, 'xray');
  assert.deepEqual(shown, selected);
  assert.equal(shown.readiness, 'draft');
  assert.equal(shown.body, topic.body);
  assert.deepEqual(shown.citations, topic.citations);
  assert(shown.bullets.length >= topic.bullets.length);
  assert(topic.bullets.every(b => shown.bullets.includes(b)));
  const prose = [shown.title, shown.body, ...shown.bullets, shown.note].join(' ');
  assert.match(prose, /(?:contrast|catheter).*(?:angiograph|x-ray|fluoroscop)|(?:angiograph|x-ray|fluoroscop).*(?:contrast|catheter)/i);
  assert.match(shown.note, /revision.bound radiologist.{0,40}pending/i);
  assert.doesNotMatch(prose, /(?:clinically approved|approved for clinical use|validated patient registration|diagnostic threshold is|recommended catheter route|validated procedural route)/i);
  assert.doesNotMatch(prose, /(?:is a patent junction|measured flow is supplied|is a complete vascular tree|patient.space registration is validated)/i);
  const {readiness, ...content} = shown;
  assert.deepEqual(current.bodyContent(identity, 'xray'), content);
  for (const tab of current.contentTabs) if (tab !== 'xray')
    assert.equal(current.intracranialArterialXrayLesson(identity, tab), undefined);
  const clean = structuredClone(selected);
  selected.bullets.push('foreign'); selected.citations.push('https://foreign.example');
  assert.deepEqual(current.intracranialArterialXrayLesson(identity, 'xray'), clean,
    'Fresh lesson arrays');
}
assert.equal(current.intracranialArterialXrayLesson(
  pins.entries.find(e => e.group === 'basilar').identity, 'xray'), undefined);
const leftMca = catalog.structures.find(s => s.fmaId === 'FMA50083');
if (leftMca) assert.equal(current.intracranialArterialXrayLesson(leftMca, 'xray'), undefined);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
for (const identity of identities.values()) {
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
    const key = path.at(-1), original = parent[key];
    parent[key] = typeof original === 'string' ? original + '-foreign'
      : typeof original === 'number' ? original + 0.01
        : original === null ? 'foreign' : !original;
    assert.equal(current.intracranialArterialXrayLesson(bad, 'xray'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const bad = structuredClone(identity); at(bad, path).push('foreign');
    assert.equal(current.intracranialArterialXrayLesson(bad, 'xray'), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const bad = structuredClone(identity); at(bad, path).unexpected = true;
    assert.equal(current.intracranialArterialXrayLesson(bad, 'xray'), undefined, path.join('.') || '<root>');
    refusedIdentities++;
  }
}

const featureCommit = git(['log', '--diff-filter=A', '-1', '--format=%H', '--',
  'content/intracranial-arterial-xray.ts']).trim();
// Replay the exact feature commit once it lands; later unrelated teaching cannot
// change this whole-catalog transition assertion.
const feature = featureCommit
  ? await exactSourceHistoryApi(featureCommit, 'review-security') : current;
const featureRaw = featureCommit
  ? JSON.parse(gitBytes(featureCommit, catalogPath)) : raw;
const featureCatalog = feature.bodyDisplayCatalog(featureRaw);
const oldRaw = JSON.parse(gitBytes(baseline, catalogPath));
assert.deepEqual(featureCatalog, old.bodyDisplayCatalog(oldRaw));
assert.deepEqual(feature.structures, old.structures);
assert.deepEqual(feature.dissectionProfiles, old.dissectionProfiles);
assert.deepEqual(feature.regionalTours, old.regionalTours);
assert.deepEqual(feature.contentTabs, old.contentTabs);
assert.equal(featureCatalog.structures.length * feature.contentTabs.length, 9936);
assert.equal(featureCatalog.bundles.length, 109);
let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let malformed = 0, stale = 0, forgedSaves = 0, forgedApprovals = 0, storageCalls = 0;
for (const structure of featureCatalog.structures) {
  for (const tab of feature.contentTabs) {
    const previous = old.bodyLesson(structure, tab), lesson = feature.bodyLesson(structure, tab);
    if (identities.has(structure.id) && tab === 'xray') {
      assert.equal(previous.readiness, 'pending');
      assert.equal(lesson.readiness, 'draft');
      changed++;
    } else {
      assert.deepEqual(lesson, previous, `${structure.id}:${tab}`);
      preserved++;
    }
  }
  const previousPacket = await old.bodyReviewMaterial(structure.id);
  const packet = await feature.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval, false);
  assert.deepEqual(packet.reasoning, previousPacket.reasoning, `${structure.id}: reasoning`);
  if (identities.has(structure.id)) {
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      assert.deepEqual(packet[key], previousPacket[key], `${structure.id}:${key}`);
    assert.equal(packet.fingerprints.source, previousPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, previousPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, previousPacket.materialHash);
    assert.deepEqual(packet.topics.find(row => row.tab === 'xray'),
      {tab: 'xray', ...feature.bodyLesson(structure, 'xray')});
    assert.deepEqual(await feature.parseBodyReviewResponse(packet, structure.id), packet);
    assert.equal(await feature.parseBodyReviewResponse(previousPacket, structure.id), null);
    for (const edit of [
      value => { value.topics.find(row => row.tab === 'xray').body += ' foreign'; },
      value => { value.topics.find(row => row.tab === 'xray').bullets[0] += ' foreign'; },
      value => { value.topics.find(row => row.tab === 'xray').citations = ['https://foreign.example']; },
      value => { value.topics.find(row => row.tab === 'xray').readiness = 'approved'; },
      value => { value.topics.splice(value.topics.findIndex(row => row.tab === 'xray'), 1); },
    ]) {
      const forged = structuredClone(packet); edit(forged);
      assert.equal(await feature.parseBodyReviewResponse(forged, structure.id), null);
      malformed++;
    }
    const priorContext = await old.bodyReviewContext(structure.id);
    const context = await feature.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash, priorContext.sourceHash);
    assert.equal(context.sourceFrame, priorContext.sourceFrame);
    assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
    const decision = {
      catalogScope: context.catalogScope, structureId: structure.id, track: 'teaching',
      expectedVersion: 0, materialHash: context.materialHash,
      revisionHash: context.revisions.teaching, checklistVersion: context.checklistVersion,
      draft: feature.blankBodyReview(context, 'teaching'),
    };
    const save = async input => feature.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_INTRACRANIAL_ARTERIAL_XRAY'}, body: JSON.stringify(input),
    }), {prepare() { storageCalls++; throw Error('Invalid decision reached storage'); }});
    for (const hashes of [
      {materialHash: priorContext.materialHash, revisionHash: priorContext.revisions.teaching},
      {materialHash: priorContext.materialHash},
      {revisionHash: priorContext.revisions.teaching},
    ]) {
      assert.equal((await save({...decision, ...hashes})).status, 409);
      stale++;
    }
    const forged = structuredClone(decision); forged.draft.checks.foreign = true;
    assert.equal((await save(forged)).status, 422);
    const approval = structuredClone(decision); approval.draft.status = 'approved';
    assert.equal((await save(approval)).status, 422);
    forgedApprovals++; forgedSaves++; changedPackets++;
  } else {
    assert.deepEqual(packet, previousPacket, `${structure.id}: Review packet`);
    preservedPackets++;
  }
}
assert.equal(changed, 12);
assert.equal(preserved, 9924);
assert.equal(changedPackets, 12);
assert.equal(preservedPackets, 1092);
assert.equal(malformed, 60);
assert.equal(stale, 36);
assert.equal(forgedSaves, 12);
assert.equal(forgedApprovals, 12);
assert.equal(storageCalls, 0);
for (const bundle of featureCatalog.bundles) {
  const path = 'public' + bundle.url.split('?')[0];
  const bytes = featureCommit ? gitBytes(featureCommit, path) : readFileSync(path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  assert.deepEqual(bytes, gitBytes(baseline, path), `${path} remains unchanged`);
}
console.log(JSON.stringify({baseline, featureCommit: featureCommit || 'working-tree',
  changed, preserved, changedPackets, preservedPackets, refusedIdentities,
  malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale,
  forgedSavesRefusedBeforeStorage: forgedSaves,
  forgedApprovalsRefusedBeforeStorage: forgedApprovals, storageCalls,
  sourceBundlesUnchanged: featureCatalog.bundles.length, clinicalApproval: false}));
