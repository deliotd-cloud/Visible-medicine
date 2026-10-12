import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { contentContext } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build } from './workspace-test-build.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = '7d77c973aab2a7135635ab2e65a2831f3e7d22c4';
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const pinsPath = 'content/limb-nerve-quiz-pins.json';
const upper = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html';
const lower = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html';
const stem = 'vm:anatomy:body:';
// Independently fixed to the inspected BodyParts3D selections. None is a nerve surface.
const groups = {
  superficialis: { region: 'forearm', bundle: 'forearm-muscles', source: upper, nerve: /median/i, rows: [
    ['right', 'right-flexor-digitorum-superficialis', 'FMA38470', ['FJ1475', 'FJ1499']],
    ['left', 'left-flexor-digitorum-superficialis', 'FMA38471', ['FJ1475M', 'FJ1499M']]] },
  profundus: { region: 'forearm', bundle: 'forearm-muscles', source: upper, nerve: /median|ulnar/i, rows: [
    ['right', 'right-flexor-digitorum-profundus', 'FMA38479', ['FJ1497']],
    ['left', 'left-flexor-digitorum-profundus', 'FMA38480', ['FJ1497M']]] },
  ulnaris: { region: 'forearm', bundle: 'forearm-muscles-dissection', source: upper, nerve: /ulnar/i, rows: [
    ['right', 'humeral-head-of-right-flexor-carpi-ulnaris', 'FMA38617', ['FJ1473']],
    ['left', 'humeral-head-of-left-flexor-carpi-ulnaris', 'FMA38618', ['FJ1473M']],
    ['right', 'ulnar-head-of-right-flexor-carpi-ulnaris', 'FMA38619', ['FJ1518']],
    ['left', 'ulnar-head-of-left-flexor-carpi-ulnaris', 'FMA38620', ['FJ1518M']]] },
  supinator: { region: 'forearm', bundle: 'forearm-muscles', source: upper, nerve: /deep branch.*radial|radial.*deep branch/i, rows: [
    ['right', 'right-supinator', 'FMA38513', ['FJ1505']],
    ['left', 'left-supinator', 'FMA38514', ['FJ1505M']]] },
  adductor: { region: 'thigh', bundle: 'thigh-muscles', source: lower, nerve: /obturator/i, rows: [
    ['right', 'right-adductor-longus', 'FMA22456', ['FJ1402']],
    ['left', 'left-adductor-longus', 'FMA22457', ['FJ1402M']]] },
  sartorius: { region: 'thigh', bundle: 'thigh-muscles', source: lower, nerve: /femoral/i, rows: [
    ['right', 'right-sartorius', 'FMA22354', ['FJ1434']],
    ['left', 'left-sartorius', 'FMA22355', ['FJ1434M']]] },
  posterior: { region: 'leg', bundle: 'leg-muscles', source: lower, nerve: /tibial/i, rows: [
    ['right', 'right-tibialis-posterior', 'FMA65018', ['FJ1440']],
    ['left', 'left-tibialis-posterior', 'FMA65019', ['FJ1440M']]] },
  anterior: { region: 'leg', bundle: 'leg-muscles', source: lower, nerve: /deep fibular|deep peroneal/i, rows: [
    ['right', 'right-tibialis-anterior', 'FMA22544', ['FJ1439']],
    ['left', 'left-tibialis-anterior', 'FMA22545', ['FJ1439M']]] },
};
const expected = new Map(Object.entries(groups).flatMap(([group, g]) => g.rows.map(([side, slug, fma, file]) => [
  `${stem}${g.region}:${side}:muscle:${slug}`, { group, side, fma, file, bundle: g.bundle, region: g.region },
])));
assert.equal(expected.size, 18);
const git = (args, encoding = 'utf8') => execFileSync('git', args, {
  windowsHide: true, encoding, maxBuffer: 64e6,
  env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});
const gitBytes = path => git(['show', `${baseline}:${path}`], null);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const raw = JSON.parse(readFileSync(catalogPath, 'utf8'));
const pins = JSON.parse(readFileSync(pinsPath, 'utf8'));
assert.equal(pins.parentCommit, baseline);
assert.deepEqual(readFileSync(catalogPath), gitBytes(catalogPath), 'Catalogue source bytes unchanged');
const { api, catalog } = await contentContext();
const before = await exactSourceHistoryApi(baseline, 'review-security');
const display = api.bodyDisplayCatalog(catalog);
const oldDisplay = before.bodyDisplayCatalog(raw);
assert.deepEqual(display, oldDisplay);
assert.equal(sha256(Buffer.from(JSON.stringify(display))), pins.catalogHash);
assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
assert.equal(display.structures.length, 1104);
assert.equal(api.contentTabs.length, 9);
assert.equal(display.structures.length * api.contentTabs.length, 9936);
assert.equal(display.structures.filter(s => ['forearm', 'thigh', 'leg'].includes(s.region) &&
  s.category === 'nerve').length, 0, 'No limb nerve surface may be admitted');
assert.deepEqual(api.structures, before.structures);
assert.deepEqual(api.dissectionProfiles, before.dissectionProfiles);
assert.equal(pins.entries.length, 18);
assert.equal(new Set(pins.entries.map(row => row.identity.id)).size, 18);
assert.deepEqual(new Set(pins.entries.map(row => row.group)), new Set(Object.keys(groups)));
assert.equal(pins.bundles.length, 4);
assert.deepEqual(new Set(pins.bundles.map(b => b.id)), new Set([
  'forearm-muscles', 'forearm-muscles-dissection', 'thigh-muscles', 'leg-muscles',
]));
const targets = new Map(pins.entries.map(row => [row.identity.id, row]));
assert.deepEqual(new Set(targets.keys()), new Set(expected.keys()));
for (const row of pins.entries) {
  const id = row.identity.id, spec = expected.get(id);
  assert.equal(row.group, spec.group, id);
  assert.equal(row.identity.fmaId, spec.fma, id);
  assert.equal(row.identity.nodeName, spec.fma, id);
  assert.equal(row.identity.laterality, spec.side, id);
  assert.equal(row.identity.region, spec.region, id);
  assert.equal(row.identity.system, 'muscles', id);
  assert.equal(row.identity.category, 'muscle', id);
  assert.equal(row.identity.bundle, spec.bundle, id);
  assert.deepEqual(row.identity.sources.map(s => s.file), spec.file, id);
  assert.deepEqual(display.structures.find(s => s.id === id), row.identity, id);
  assert.deepEqual(oldDisplay.structures.find(s => s.id === id), row.identity, id);
  assert.deepEqual(row.previous, before.bodyLesson(row.identity, 'quiz'), id);
}
for (const bundle of display.bundles) {
  const file = `public${bundle.url.split('?')[0]}`;
  const bytes = readFileSync(file);
  assert.deepEqual(bytes, gitBytes(file), file);
  assert.equal(bytes.length, bundle.bytes, file);
  assert.equal(sha256(bytes), bundle.sha256, file);
  if (pins.bundles.some(b => b.id === bundle.id))
    assert.deepEqual(pins.bundles.find(b => b.id === bundle.id), bundle);
}

const compiled = await build({ stdin: { contents:
  "export {limbNerveQuizChecks} from './lib/limb-nerve-quiz';" +
  "export {limbNerveQuizQuestions} from './content/limb-nerve-quiz';" +
  "export {bodyLesson,bodyContent} from './app/body-content';" +
  "export {bodyDisplayCatalog} from './lib/body-display-catalog';" +
  "export {contentTabs} from './lib/content-types';" +
  "export {regionalTours} from './lib/regional-tours';" +
  "export * from './lib/body-review-material';" +
  "export * from './lib/body-review-context';" +
  "export * from './lib/body-review-response';" +
  "export * from './lib/body-review-api';" +
  "export * from './lib/body-review-decisions';",
  resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const live = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
assert.deepEqual(live.regionalTours, before.regionalTours);
assert.equal(live.regionalTours.length, 47);
assert.equal(live.regionalTours.reduce((n, tour) => n + tour.steps.length, 0), 282);
assert.deepEqual(Object.keys(live.limbNerveQuizQuestions).sort(), Object.keys(groups).sort());
const checksByGroup = new Map();
for (const [group, spec] of Object.entries(groups)) {
  const q = live.limbNerveQuizQuestions[group];
  assert.equal(q.choices.length, 4, group);
  assert.equal(new Set(q.choices).size, 4, group);
  assert.equal(q.choices.filter(choice => choice === q.correctAnswer).length, 1, group);
  assert.match(q.correctAnswer, spec.nerve, group);
  if (group === 'profundus') {
    assert.match(q.correctAnswer, /median/i);
    assert.match(q.correctAnswer, /ulnar/i);
    assert.match([q.body, q.correctAnswer, q.explanation].join(' '), /radial|lateral|digits? 2.{0,8}3/i);
    assert.match([q.body, q.correctAnswer, q.explanation].join(' '), /ulnar|medial|digits? 4.{0,8}5/i);
  }
  assert.deepEqual(q.references, [spec.source], group);
  assert(q.body?.trim() && q.explanation?.trim(), group);
  const identity = targets.get([...expected].find(([, value]) => value.group === group)[0]).identity;
  const checks = live.limbNerveQuizChecks(identity);
  assert.equal(checks.length, 1, group);
  const check = checks[0];
  assert.equal(check.key, group);
  assert.equal(check.body, q.body);
  assert.deepEqual(check.bullets, q.choices);
  assert.equal(check.correctAnswer, q.correctAnswer);
  assert.equal(check.explanation, q.explanation);
  assert.deepEqual(check.citations, q.references);
  assert.match(check.note, /revision-bound radiologist review pending/i);
  assert.match(check.note, /nerve/i);
  assert.match(check.note, /registration/i);
  assert.deepEqual(Object.keys(check).sort(), [
    'body', 'bullets', 'citations', 'correctAnswer', 'explanation', 'key', 'note',
  ]);
  checksByGroup.set(group, structuredClone(check));
}
assert.equal(new Set([...checksByGroup.values()].map(c => c.key)).size, 8);
for (const fma of ['FMA45888', 'FMA45889', 'FMA45891', 'FMA45892']) {
  const structure = display.structures.find(s => s.fmaId === fma);
  assert(structure, `${fma}: existing sciatic-division Quiz identity`);
  assert.deepEqual(live.bodyLesson(structure, 'quiz'), before.bodyLesson(structure, 'quiz'),
    `${fma}: existing sciatic-division question preserved`);
}

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let identityRefusals = 0;
for (const { identity } of pins.entries) {
  const clean = structuredClone(live.limbNerveQuizChecks(identity));
  clean[0].bullets.push('foreign');
  const again = live.limbNerveQuizChecks(identity);
  assert.deepEqual(again, [checksByGroup.get(targets.get(identity.id).group)]);
  again[0].bullets.push('foreign'); again[0].citations.push('https://foreign.example');
  assert.deepEqual(live.limbNerveQuizChecks(identity), [checksByGroup.get(targets.get(identity.id).group)]);
  const refuse = (bad, label) => {
    assert.equal(live.limbNerveQuizChecks(bad), undefined, `${identity.id}:${label}`);
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
    refuse(bad, `${path.join('.')}: append`);
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const bad = structuredClone(identity); at(bad, path).unexpected = true;
    refuse(bad, `${path.join('.') || '<root>'}: extra field`);
    for (const key of Object.keys(at(identity, path))) {
      const omitted = structuredClone(identity); delete at(omitted, path)[key];
      refuse(omitted, [...path, key].join('.'));
    }
  }
}
for (const structure of display.structures) if (!targets.has(structure.id))
  assert.equal(live.limbNerveQuizChecks(structure), undefined, structure.id);

let changed = 0, preserved = 0, changedPackets = 0, preservedPackets = 0;
let malformed = 0, stale = 0, forgedSaves = 0, forgedApprovals = 0, storageCalls = 0;
for (const structure of display.structures) {
  for (const tab of api.contentTabs) {
    const previous = before.bodyLesson(structure, tab);
    const current = live.bodyLesson(structure, tab);
    assert.deepEqual(api.bodyLesson(structure, tab), current, `${structure.id}:${tab}: current context`);
    const row = targets.get(structure.id);
    if (row && tab === 'quiz') {
      assert.equal(current.readiness, previous.readiness);
      const { additionalChecks, ...primary } = current;
      assert.deepEqual(primary, previous, `${structure.id}: primary Quiz exact`);
      assert.deepEqual(additionalChecks, [checksByGroup.get(row.group)]);
      const { readiness, ...shown } = current;
      assert.deepEqual(live.bodyContent(structure, tab), shown);
      changed++;
    } else {
      assert.deepEqual(current, previous, `${structure.id}:${tab}`);
      preserved++;
    }
  }
  const priorPacket = await before.bodyReviewMaterial(structure.id);
  const packet = await live.bodyReviewMaterial(structure.id);
  if (targets.has(structure.id)) {
    assert.equal(packet.approval, false);
    assert.deepEqual(packet.source, priorPacket.source);
    assert.deepEqual(packet.reasoning, priorPacket.reasoning);
    assert.deepEqual(packet.guidedTours, priorPacket.guidedTours);
    assert.deepEqual(packet.topics.filter(t => t.tab !== 'quiz'), priorPacket.topics.filter(t => t.tab !== 'quiz'));
    assert.deepEqual(packet.topics.find(t => t.tab === 'quiz'),
      { tab: 'quiz', ...live.bodyLesson(structure, 'quiz') });
    assert.equal(packet.fingerprints.source, priorPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, priorPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, priorPacket.materialHash);
    assert.deepEqual(await live.parseBodyReviewResponse(packet, structure.id), packet);
    assert.equal(await live.parseBodyReviewResponse(priorPacket, structure.id), null);
    const edits = [
      p => { p.topics.find(t => t.tab === 'quiz').additionalChecks[0].body += ' foreign'; },
      p => { p.topics.find(t => t.tab === 'quiz').additionalChecks[0].bullets[0] += ' foreign'; },
      p => { p.topics.find(t => t.tab === 'quiz').additionalChecks[0].correctAnswer = 'foreign'; },
      p => { p.topics.find(t => t.tab === 'quiz').additionalChecks[0].explanation += ' foreign'; },
      p => { p.topics.find(t => t.tab === 'quiz').additionalChecks[0].note += ' foreign'; },
      p => { p.topics.find(t => t.tab === 'quiz').additionalChecks[0].citations = ['https://foreign.example']; },
      p => { p.topics.find(t => t.tab === 'quiz').additionalChecks[0].key = 'foreign'; },
      p => { p.topics.find(t => t.tab === 'quiz').additionalChecks[0].unexpected = true; },
      p => { p.topics.find(t => t.tab === 'quiz').additionalChecks.push(structuredClone(p.topics.find(t => t.tab === 'quiz').additionalChecks[0])); },
      p => { delete p.topics.find(t => t.tab === 'quiz').additionalChecks; },
      p => { p.topics.find(t => t.tab === 'quiz').additionalChecks = []; },
      p => { p.source.structure.sources[0].sha256 = '0'.repeat(64); },
    ];
    for (const edit of edits) {
      const altered = structuredClone(packet); edit(altered);
      assert.equal(await live.parseBodyReviewResponse(altered, structure.id), null);
      malformed++;
    }
    const priorContext = await before.bodyReviewContext(structure.id);
    const context = await live.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash, priorContext.sourceHash);
    assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
    const decision = {
      catalogScope: context.catalogScope, structureId: structure.id, track: 'teaching', expectedVersion: 0,
      materialHash: context.materialHash, revisionHash: context.revisions.teaching,
      checklistVersion: context.checklistVersion, draft: live.blankBodyReview(context, 'teaching'),
    };
    const save = async input => live.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: { origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_LIMB_NERVE_QUIZ' }, body: JSON.stringify(input),
    }), { prepare() { storageCalls++; throw Error('Invalid decision reached storage'); } });
    for (const hashes of [
      { materialHash: priorContext.materialHash, revisionHash: priorContext.revisions.teaching },
      { materialHash: priorContext.materialHash },
      { revisionHash: priorContext.revisions.teaching },
    ]) {
      assert.equal((await save({ ...decision, ...hashes })).status, 409);
      stale++;
    }
    const forged = structuredClone(decision); forged.draft.checks.foreign = true;
    assert.equal((await save(forged)).status, 422); forgedSaves++;
    const approval = structuredClone(decision); approval.draft.status = 'approved';
    assert.equal((await save(approval)).status, 422); forgedApprovals++;
    changedPackets++;
  } else {
    assert.deepEqual(packet, priorPacket, `${structure.id}: Review packet`);
    preservedPackets++;
  }
}
assert.deepEqual([changed, preserved, changedPackets, preservedPackets], [18, 9918, 18, 1086]);
assert.deepEqual([malformed, stale, forgedSaves, forgedApprovals, storageCalls], [216, 54, 18, 18, 0]);
console.log(JSON.stringify({ baseline, changed, preserved, changedPackets, preservedPackets,
  identityRefusals, malformed, stale, forgedSaves, forgedApprovals, storageCalls,
  tours: live.regionalTours.length, tourStops: live.regionalTours.reduce((n, t) => n + t.steps.length, 0),
  clinicalApproval: false }));
