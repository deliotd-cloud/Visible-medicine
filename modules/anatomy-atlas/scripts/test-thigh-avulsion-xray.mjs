import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = '280c701c9cc21c540b7b496f58e2d1c4214e7865';
const featureCommit = '363dc85cf12b07b380ba5da3b91031dbddc6bd02';
const git = args => execFileSync('git', args, {
  windowsHide: true, maxBuffer: 32e6, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
});
const gitBytes = path => execFileSync('git', ['show', `${baseline}:${path}`], {
  windowsHide: true, maxBuffer: 32e6, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
});
assert.equal(git(['rev-parse', `${featureCommit}^{commit}`]).toString().trim(), featureCommit);
assert.equal(git(['merge-base', featureCommit, 'HEAD']).toString().trim(), featureCommit);
for (const path of ['content/thigh-avulsion-xray.ts', 'lib/thigh-avulsion-xray.ts'])
  assert.deepEqual(readFileSync(path), git(['show', `${featureCommit}:${path}`]),
    `${path}: current implementation matches its exact feature epoch`);
const pinsPath = 'content/hip-imaging-pins.json';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
assert.deepEqual(readFileSync(pinsPath), gitBytes(pinsPath), 'Reuse exact original hip source pins');
assert.deepEqual(readFileSync(catalogPath), gitBytes(catalogPath), 'Do not change source catalogue');
const pins = JSON.parse(readFileSync(pinsPath, 'utf8'));
const expected = new Map([
  ['FMA38928', ['rectus', 'right', 'Right rectus femoris']],
  ['FMA38929', ['rectus', 'left', 'Left rectus femoris']],
  ['FMA22322', ['iliopsoas', 'right', 'Right iliacus']],
  ['FMA22323', ['iliopsoas', 'left', 'Left iliacus']],
  ['FMA22448', ['hamstrings', 'right', 'Right semimembranosus']],
  ['FMA22449', ['hamstrings', 'left', 'Left semimembranosus']],
  ['FMA22358', ['hamstrings', 'right', 'Right semitendinosus']],
  ['FMA22359', ['hamstrings', 'left', 'Left semitendinosus']],
  ['FMA45888', ['hamstrings', 'right', 'Long head of right biceps femoris']],
  ['FMA45889', ['hamstrings', 'left', 'Long head of left biceps femoris']],
]);
const entries = pins.entries.filter(e => expected.has(e.identity?.fmaId));
assert.equal(entries.length, 10);
assert.deepEqual(new Set(entries.map(e => e.identity.fmaId)), new Set(expected.keys()));
const identities = new Map(entries.map(e => [e.identity.id, e.identity]));
assert.equal(identities.size, 10);
const groups = new Map(entries.map(e => [e.identity.id, e.group]));
const kinds = new Map([
  ['FMA38928', 'rectus'], ['FMA38929', 'rectus'],
  ['FMA22322', 'iliacus'], ['FMA22323', 'iliacus'],
  ['FMA22448', 'semimembranosus'], ['FMA22449', 'semimembranosus'],
  ['FMA22358', 'semitendinosus'], ['FMA22359', 'semitendinosus'],
  ['FMA45888', 'bicepsLong'], ['FMA45889', 'bicepsLong'],
]);
for (const {identity, group} of entries) {
  const [wantedGroup, wantedSide, wantedName] = expected.get(identity.fmaId);
  assert.equal(group, wantedGroup);
  assert.equal(identity.name, wantedName);
  assert.equal(identity.laterality, wantedSide);
  assert.equal(identity.region, 'thigh');
  assert.equal(identity.system, 'muscles');
  assert.equal(identity.category, 'muscle');
  assert.equal(identity.validation.status, 'unvalidated');
  assert.equal(identity.validation.anatomicalReview, false);
}
for (const bundle of new Set(entries.map(e => e.identity.bundle))) {
  const descriptor = pins.bundles.find(b => b.id === bundle);
  assert(descriptor, `Existing bundle: ${bundle}`);
  const path = 'public' + descriptor.url.split('?')[0];
  assert.deepEqual(readFileSync(path), gitBytes(path), `${bundle} geometry unchanged`);
}

const compiled = await build({
  stdin: {contents:
    "export {thighAvulsionXrayLesson} from './lib/thigh-avulsion-xray';" +
    "export * from './content/thigh-avulsion-xray';" +
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
    resolveDir: process.cwd(), loader: 'ts'},
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const live = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const old = await exactSourceHistoryApi(baseline, 'review-security');
const feature = await exactSourceHistoryApi(featureCommit, 'review-security');
const rawCatalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const catalog = live.bodyDisplayCatalog(rawCatalog);
assert.deepEqual(catalog, old.bodyDisplayCatalog(JSON.parse(gitBytes(catalogPath))));
assert.deepEqual(catalog, feature.bodyDisplayCatalog(rawCatalog));
assert.deepEqual(live.contentTabs, feature.contentTabs);
assert.deepEqual(live.contentTabs, old.contentTabs);
assert.deepEqual(live.regionalTours, old.regionalTours);
assert.deepEqual(live.structures, old.structures);
assert.deepEqual(live.dissectionProfiles, old.dissectionProfiles);
assert.equal(catalog.structures.length, 1104);
assert.equal(catalog.structures.length * live.contentTabs.length, 9936);
assert.deepEqual(catalog.structures.filter(s => identities.has(s.id))
  .sort((a, b) => a.id.localeCompare(b.id)),
  [...identities.values()].sort((a, b) => a.id.localeCompare(b.id)));
const primaryCitations = {
  rectus: ['11357449', '16738911'],
  iliacus: ['34306849', '34347120'],
  semimembranosus: ['11357449', '24859732', '22669443'],
  semitendinosus: ['11357449', '24859732', '22669443'],
  bicepsLong: ['11357449', '24859732', '22669443'],
};
for (const [kind, pmids] of Object.entries(primaryCitations))
  assert.deepEqual(live.thighAvulsionXrayTeaching[kind].citations,
    pmids.map(id => `https://pubmed.ncbi.nlm.nih.gov/${id}/`),
    `${kind}: original primary references`);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
for (const identity of identities.values()) {
  assert.equal(live.thighAvulsionXrayLesson(identity, 'xray').readiness, 'draft');
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
    const key = path.at(-1), original = parent[key];
    parent[key] = typeof original === 'string' ? original + '-foreign'
      : typeof original === 'number' ? original + 0.01
        : original === null ? 'foreign' : !original;
    assert.equal(live.thighAvulsionXrayLesson(bad, 'xray'), undefined,
      `${identity.id}:${path.join('.')}`);
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const bad = structuredClone(identity); at(bad, path).push('foreign');
    assert.equal(live.thighAvulsionXrayLesson(bad, 'xray'), undefined,
      `${identity.id}:${path.join('.')}`);
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const bad = structuredClone(identity); at(bad, path).unexpected = true;
    assert.equal(live.thighAvulsionXrayLesson(bad, 'xray'), undefined,
      `${identity.id}:${path.join('.') || '<root>'}`);
    refusedIdentities++;
  }
}

let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let stale = 0, forgedDecisions = 0, malformed = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  for (const tab of live.contentTabs) {
    const previous = old.bodyLesson(structure, tab), lesson = feature.bodyLesson(structure, tab);
    if (identities.has(structure.id))
      assert.deepEqual(live.bodyLesson(structure, tab), lesson,
        `${structure.id}:${tab}: current avulsion target retained`);
    if (identities.has(structure.id) && tab === 'xray') {
      assert.equal(previous.readiness, 'pending');
      assert.equal(lesson.readiness, 'draft');
      assert.deepEqual(lesson, live.thighAvulsionXrayLesson(structure, tab));
      const teaching = live.thighAvulsionXrayTeaching[kinds.get(structure.fmaId)];
      assert.equal(lesson.body, teaching.body);
      assert.deepEqual(lesson.citations, teaching.citations);
      assert(lesson.bullets.includes(teaching.anatomy));
      assert(lesson.bullets.includes(teaching.limits));
      assert(lesson.bullets.includes(live.thighAvulsionXrayLimits.cohort));
      assert(lesson.bullets.includes(live.thighAvulsionXrayLimits.comparison));
      const prose = [lesson.title, lesson.body, ...lesson.bullets, lesson.note].join(' ');
      assert.match(prose, /radiograph|plain film|x[- ]ray/i);
      assert.match(prose, /indirect.{0,100}bon(?:e|y)|bon(?:e|y).{0,100}indirect/i);
      assert.match(prose, /attach(?:ment)?/i);
      assert.match(prose, /(?:cannot|does not|do not|not).{0,130}(?:individual|selected).{0,70}muscle/i);
      assert.match(prose, /(?:cannot|does not|do not|not).{0,130}tendon.{0,70}tear/i);
      assert.match(prose, /adolescen/i);
      assert.match(prose, /(?:cannot|does not|do not|not).{0,130}(?:adult|general population|population-wide)/i);
      if (groups.get(structure.id) === 'rectus') {
        assert.match(prose, /AIIS|anterior inferior iliac spine/i);
        assert.match(prose, /direct head/i);
        assert.match(prose, /not proof that only one head is injured/i);
        assert.match(prose, /rest of rectus femoris is intact/i);
      } else if (groups.get(structure.id) === 'iliopsoas') {
        assert.match(prose, /iliopsoas/i);
        assert.match(prose, /(?:shared|common).{0,80}(?:attachment|tendon|insertion)/i);
        assert.match(prose, /(?:not|cannot|does not).{0,130}(?:isolat|iliacus alone|specif(?:y|ic)).{0,80}iliacus|iliacus.{0,80}(?:not|cannot|does not).{0,100}isolat/i);
      } else {
        assert.match(prose, /ischial tuberosity/i);
        assert.match(prose, /(?:cannot distinguish which proximal hamstring|cannot isolate semitendinosus|do not make an ischial fragment specific)/i);
      }
      assert.match(lesson.note, /review pending/i);
      assert.match(lesson.note, /(?:revision.bound|exact source and teaching revision)/i);
      assert.match(lesson.note, /(?:No|without).{0,80}(?:X[- ]ray|imaging|acquired).{0,80}(?:image|study)/i);
      assert.match(lesson.note, /(?:No|without).{0,100}(?:patient.space )?registration/i);
      assert.match(lesson.note, /Atlas, imaging-case and paid-lecture access remain independent/i);
      assert.doesNotMatch(prose, /approved for clinical use|diagnostic threshold is|treatment threshold is|registered to (?:a )?patient/i);
      assert(lesson.citations.length > 0);
      for (const citation of lesson.citations)
        assert.match(citation, /^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/,
          'Use only original primary PubMed references');
      const {readiness, ...content} = lesson;
      assert.deepEqual(live.bodyContent(structure, tab), content);
      const copy = structuredClone(lesson);
      lesson.bullets.push('foreign'); lesson.citations.push('https://foreign.example');
      assert.deepEqual(live.thighAvulsionXrayLesson(structure, tab), copy, 'Lesson must be detached');
      for (const other of live.contentTabs) if (other !== 'xray')
        assert.equal(live.thighAvulsionXrayLesson(structure, other), undefined);
      changed++;
    } else {
      assert.deepEqual(lesson, previous, `${structure.id}:${tab}`);
      preserved++;
      assert.equal(live.thighAvulsionXrayLesson(structure, tab), undefined,
        'No modality or identity leakage');
    }
  }
  const previousPacket = await old.bodyReviewMaterial(structure.id);
  const packet = await feature.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval, false);
  if (identities.has(structure.id)) {
    assert.deepEqual(await live.bodyReviewMaterial(structure.id), packet,
      `${structure.id}: current Review material matches feature epoch`);
    const liveContext = await live.bodyReviewContext(structure.id);
    const featureContext = await feature.bodyReviewContext(structure.id);
    const stableContext = ({rendererHash, revisions: {geometry, ...revisions}, ...rest}) =>
      ({...rest, revisions});
    assert.deepEqual(stableContext(liveContext), stableContext(featureContext),
      `${structure.id}: current source/teaching context retained`);
    assert.equal(liveContext.rendererHash,
      JSON.parse(readFileSync('content/body-renderer-revision.json', 'utf8')).sha256);
    const geometryInput = {catalogScope: liveContext.catalogScope,
      structureId: structure.id, checklistVersion: liveContext.checklistVersion,
      source: liveContext.sourceHash, renderer: liveContext.rendererHash,
      checks: liveContext.checklists.geometry};
    assert.equal(liveContext.revisions.geometry,
      createHash('sha256').update(JSON.stringify(geometryInput)).digest('hex'));
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
      value => { value.topics.find(row => row.tab === 'xray').readiness = 'approved'; },
      value => { value.source.structure.sources = []; },
    ]) {
      const forged = structuredClone(packet);
      edit(forged);
      assert.equal(await live.parseBodyReviewResponse(forged, structure.id), null);
      malformed++;
    }
    const priorContext = await old.bodyReviewContext(structure.id);
    const context = await live.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash, priorContext.sourceHash);
    assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
    const decision = {
      catalogScope: context.catalogScope, structureId: structure.id, track: 'teaching',
      expectedVersion: 0, materialHash: priorContext.materialHash,
      revisionHash: priorContext.revisions.teaching, checklistVersion: context.checklistVersion,
      draft: live.blankBodyReview(context, 'teaching'),
    };
    const request = value => new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_THIGH_AVULSION_XRAY'}, body: JSON.stringify(value),
    });
    const db = {prepare() { storageCalls++; throw Error('Rejected decision reached storage'); }};
    assert.equal((await live.postBodyDecision(request(decision), db)).status, 409);
    const forgedDecision = structuredClone(decision);
    forgedDecision.materialHash = context.materialHash;
    forgedDecision.revisionHash = context.revisions.teaching;
    forgedDecision.draft.status = 'approved';
    assert.equal((await live.postBodyDecision(request(forgedDecision), db)).status, 422);
    stale++; forgedDecisions++; changedPackets++;
  } else {
    assert.deepEqual(packet, previousPacket, `${structure.id}: Review packet`);
    preservedPackets++;
  }
}
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [10, 9926, 10, 1094]);
assert.equal(malformed, 40);
assert.equal(storageCalls, 0);
console.log(JSON.stringify({baseline, featureCommit, originalTransitionEpochPinned: true,
  currentTargetsRetained: 10, currentTargetTopicPlacementsRetained: 90,
  currentReviewPacketsRetained: 10, changed, preserved, changedPackets, preservedPackets,
  refusedIdentities, malformedPacketsRefused: malformed,
  staleRefusalsBeforeStorage: stale, forgedApprovalRefusalsBeforeStorage: forgedDecisions,
  storageCalls, clinicalApproval: false}));
