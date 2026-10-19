// Exact initial transition plus current feature wiring. The historical theorem
// replays its real introduction commit; it never writes review decisions.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const here = dirname(fileURLToPath(import.meta.url));
const atlas = existsSync(resolve(here, '../package.json'))
  ? resolve(here, '..') : resolve(here, '../../../atlas');
const baselineCommit = '3dcdf94a46db44202e72641be9fbcf1274ce5364';
const pinsPath = 'content/median-antebrachial-xray-pins.json';
const fullCatalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const requiredPinsHash = '77a0e9f37d22a6a49f84f73a98deb15bb70c29914f35e657fff0356ef4126e89';
const readLive = path => readFileSync(resolve(atlas, path));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (args, encoding = 'utf8') => execFileSync('git', args, {
  cwd: atlas, windowsHide: true, encoding, maxBuffer: 64e6,
  env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});
const gitBytes = path => git(['show', `${baselineCommit}:${path}`], null);
assert.equal(git(['rev-parse', `${baselineCommit}^{commit}`]).trim(), baselineCommit);
assert.deepEqual(git(['check-attr','-z','text','--',pinsPath]).split('\0'),
  [pinsPath,'text','unset',''],'Source-pin bytes must survive checkout');
const head=git(['rev-parse','HEAD']).trim();
let featureCommit=null;
if(head!==baselineCommit){
  featureCommit=git(['log','--diff-filter=A','--format=%H','--',pinsPath]).trim().split(/\r?\n/).at(-1);
  assert.match(featureCommit,/^[a-f0-9]{40}$/,'Real feature introduction is required');
  assert.equal(git(['rev-parse',featureCommit+'^']).trim(),baselineCommit);
  assert.equal(git(['merge-base',featureCommit,head]).trim(),featureCommit);
  assert.deepEqual(readLive(pinsPath),git(['show',featureCommit+':'+pinsPath],null),'Immutable introduced pins');
}
const read=path=>featureCommit?git(['show',featureCommit+':'+path],null):readLive(path);

const pins = JSON.parse(read(pinsPath));
assert.equal(sha256(JSON.stringify(pins)), requiredPinsHash, 'Pinned record changed');
assert.equal(pins.baselineCommit, baselineCommit);
assert.equal(pins.sourcePath, 'public/models/bodyparts3d/cubital-veins/catalog.json');
assert.equal(pins.entries.length, 2);
assert.equal(sha256(read(pins.sourcePath)), pins.sourceSha256);
assert.deepEqual(read(pins.sourcePath), gitBytes(pins.sourcePath));
const sourceCatalog = JSON.parse(read(pins.sourcePath));
assert.deepEqual(pins.coordinateSystem, sourceCatalog.coordinateSystem);
assert.deepEqual(pins.bundles, sourceCatalog.bundles);
assert.equal(pins.license, 'CC-BY-4.0');
assert.equal(sourceCatalog.license, pins.license);
const expected = new Map([
  ['vm:anatomy:body:forearm:right:vessel:right-median-antebrachial-vein', ['right', 'FMA22968']],
  ['vm:anatomy:body:forearm:left:vessel:left-median-antebrachial-vein', ['left', 'FMA22969']],
]);
const pinned = new Map(pins.entries.map(row => [row.identity.id, row]));
assert.deepEqual(new Set(pinned.keys()), new Set(expected.keys()));
for (const [id, row] of pinned) {
  const [side, fma] = expected.get(id);
  assert.equal(row.previousReadiness, 'pending');
  assert.equal(row.identity.laterality, side);
  assert.equal(row.identity.fmaId, fma);
  assert.equal(row.identity.nodeName, fma);
  assert.equal(row.identity.bundle, 'cubital-veins');
  assert.equal(row.identity.validation.anatomicalReview, false);
  assert.deepEqual(sourceCatalog.structures.filter(s => s.id === id), [row.identity]);
}

const { build } = await import(pathToFileURL(resolve(atlas, 'scripts/workspace-test-build.mjs')).href);
const { exactSourceHistoryApi } = await import(pathToFileURL(resolve(atlas, 'scripts/exact-source-history-api.mjs')).href);
const before = await exactSourceHistoryApi(baselineCommit, 'review-security');
const compiled = await build({ stdin: { contents:
  "export {medianAntebrachialXrayLesson} from './lib/median-antebrachial-xray';" +
  "export {medianAntebrachialXrayTeaching,medianAntebrachialXrayReferences,medianAntebrachialXrayNote} from './content/median-antebrachial-xray';" +
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
  resolveDir: atlas, loader: 'ts' }, bundle: true, write: false,
  platform: 'node', format: 'esm' });
const live = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const now=featureCommit?await exactSourceHistoryApi(featureCommit,'median-antebrachial-xray'):live;
const liveCatalog=live.bodyDisplayCatalog(JSON.parse(readLive(fullCatalogPath)));
for(const {identity} of pins.entries){
  const source=liveCatalog.structures.find(row=>row.id===identity.id);
  assert(source,identity.id+' remains in the current source catalogue');
  const lesson=live.medianAntebrachialXrayLesson(source,'xray');
  assert(lesson,identity.id+' current source identity remains exact');
  assert.equal(lesson.readiness,'draft');
  assert.deepEqual(live.bodyLesson(source,'xray'),lesson,identity.id+' current dispatch remains connected');
}

assert.deepEqual(read(fullCatalogPath), gitBytes(fullCatalogPath), 'Original catalogue bytes changed');
const raw = JSON.parse(read(fullCatalogPath));
const catalog = now.bodyDisplayCatalog(raw);
assert.deepEqual(catalog, before.bodyDisplayCatalog(JSON.parse(gitBytes(fullCatalogPath))));
assert.deepEqual(catalog.coordinateSystem, pins.coordinateSystem);
assert.deepEqual(now.structures, before.structures);
assert.deepEqual(now.dissectionProfiles, before.dissectionProfiles);
assert.deepEqual(now.regionalTours, before.regionalTours);
assert.deepEqual(now.contentTabs, before.contentTabs);
assert.equal(catalog.structures.length, 1104);
assert.equal(now.contentTabs.length, 9);
assert.equal(catalog.structures.length * now.contentTabs.length, 9936);
for (const path of ['app/anatomy-data.ts', 'app/dissection-data.ts', 'lib/regional-tours.ts'])
  assert.deepEqual(read(path), gitBytes(path), `${path}: anatomy/frame source changed`);
for (const bundle of catalog.bundles) {
  const path = `public${bundle.url.split('?')[0]}`;
  const bytes = read(path);
  assert.deepEqual(bytes, gitBytes(path), `${path}: original GLB bytes changed`);
  assert.equal(bytes.length, bundle.bytes, path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  const pin = pins.bundles.find(row => row.id === bundle.id);
  if (pin) assert.deepEqual(bundle, pin);
}
assert.equal(pins.bundles.length, 1);
assert.deepEqual(new Set(pins.bundles.map(row => row.id)), new Set(['cubital-veins']));

const cleanLessons = new Map();
for (const [id, row] of pinned) {
  const identity = row.identity;
  const prior = before.bodyLesson(identity, 'xray');
  assert.equal(prior.readiness, row.previousReadiness, id);
  const lesson = now.medianAntebrachialXrayLesson(identity, 'xray');
  assert.deepEqual(now.bodyLesson(identity, 'xray'), lesson);
  assert.equal(lesson.readiness, 'draft');
  assert.equal(lesson.title, `${identity.name} · ${now.medianAntebrachialXrayTeaching.title} · draft`);
  assert.equal(lesson.body, now.medianAntebrachialXrayTeaching.body);
  assert.deepEqual(lesson.bullets, [...now.medianAntebrachialXrayTeaching.bullets]);
  assert.deepEqual(lesson.citations, Object.values(now.medianAntebrachialXrayReferences));
  assert.equal(lesson.note, now.medianAntebrachialXrayNote);
  assert.match(lesson.body, /15 fresh cadavers.*injection/i);
  assert.match(lesson.body, /not evidence.*ordinary unenhanced radiograph/i);
  assert.match(lesson.bullets.join(' '), /median antebrachial and median cubital veins distinct/i);
  assert.match(lesson.note, /revision-bound radiologist review/i);
  assert.doesNotMatch([lesson.title, lesson.body, ...lesson.bullets, lesson.note].join(' '),
    /approved for clinical use|safe needle route|recommended catheter route|diagnostic threshold is/i);
  cleanLessons.set(id, structuredClone(lesson));
  const { readiness, ...shown } = lesson;
  assert.deepEqual(now.bodyContent(identity, 'xray'), shown);
  lesson.bullets.push('foreign');
  assert.deepEqual(now.medianAntebrachialXrayLesson(identity, 'xray'), cleanLessons.get(id));
  for (const tab of now.contentTabs.filter(tab => tab !== 'xray'))
    assert.equal(now.medianAntebrachialXrayLesson(identity, tab), undefined);
}
const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let identityRefusals = 0;
for (const { identity } of pins.entries) {
  const refuse = (bad, label) => {
    assert.equal(now.medianAntebrachialXrayLesson(bad, 'xray'), undefined, `${identity.id}:${label}`);
    identityRefusals++;
  };
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const bad = structuredClone(identity), parent = at(bad, path.slice(0, -1));
    const key = path.at(-1), value = parent[key];
    parent[key] = typeof value === 'string' ? `${value}-foreign`
      : typeof value === 'number' ? value + 0.01 : value === null ? 'foreign' : !value;
    refuse(bad, path.join('.'));
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const bad = structuredClone(identity); at(bad, path).push('foreign');
    refuse(bad, `${path.join('.')}: appended`);
    if (at(identity, path).length > 1) {
      const reversed = structuredClone(identity); at(reversed, path).reverse();
      if (JSON.stringify(at(reversed, path)) !== JSON.stringify(at(identity, path)))
        refuse(reversed, `${path.join('.')}: reordered`);
    }
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const bad = structuredClone(identity); at(bad, path).foreign = true;
    refuse(bad, `${path.join('.')}: extra field`);
    for (const key of Object.keys(at(identity, path))) {
      const omitted = structuredClone(identity); delete at(omitted, path)[key];
      refuse(omitted, `${[...path, key].join('.')}: omitted`);
    }
  }
  assert.equal(now.medianAntebrachialXrayLesson({ id: identity.id, name: identity.name, fmaId: identity.fmaId }, 'xray'), undefined);
}
assert(identityRefusals > 100);
for (const s of catalog.structures) if (!pinned.has(s.id))
  assert.equal(now.medianAntebrachialXrayLesson(s, 'xray'), undefined, s.id);

const oldCubital = catalog.structures.filter(s =>
  s.id.endsWith('-median-cubital-vein') && s.region === 'forearm');
assert.equal(oldCubital.length, 2);
for (const s of oldCubital) {
  assert.equal(before.bodyLesson(s, 'xray').readiness, 'draft');
  assert.deepEqual(now.bodyLesson(s, 'xray'), before.bodyLesson(s, 'xray'));
}
let changedTopics = 0, preservedTopics = 0, changedPackets = 0, preservedPackets = 0;
let malformedPackets = 0, staleSaves = 0, forgedSaves = 0, refusedApprovals = 0, storageCalls = 0;
for (const s of catalog.structures) {
  for (const tab of now.contentTabs) {
    const previous = before.bodyLesson(s, tab), current = now.bodyLesson(s, tab);
    if (pinned.has(s.id) && tab === 'xray') {
      assert.equal(previous.readiness, 'pending');
      assert.deepEqual(current, cleanLessons.get(s.id));
      changedTopics++;
    } else {
      assert.deepEqual(current, previous, `${s.id}/${tab}: teaching changed`);
      preservedTopics++;
    }
  }
  const previousPacket = await before.bodyReviewMaterial(s.id);
  const packet = await now.bodyReviewMaterial(s.id);
  assert.equal(packet.approval, false);
  if (!pinned.has(s.id)) {
    assert.deepEqual(packet, previousPacket, `${s.id}: unrelated Review packet changed`);
    preservedPackets++;
    continue;
  }
  for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
    assert.deepEqual(packet[key], previousPacket[key], `${s.id}:${key}`);
  assert.deepEqual(packet.topics.filter(topic => topic.tab !== 'xray'),
    previousPacket.topics.filter(topic => topic.tab !== 'xray'));
  assert.deepEqual(packet.topics.find(topic => topic.tab === 'xray'),
    { tab: 'xray', ...cleanLessons.get(s.id) });
  assert.equal(packet.fingerprints.source, previousPacket.fingerprints.source);
  assert.notEqual(packet.fingerprints.teaching, previousPacket.fingerprints.teaching);
  assert.notEqual(packet.materialHash, previousPacket.materialHash);
  assert.deepEqual(await now.parseBodyReviewResponse(packet, s.id), packet);
  assert.equal(await now.parseBodyReviewResponse(previousPacket, s.id), null);
  for (const edit of [
    value => { value.topics.find(topic => topic.tab === 'xray').body += ' foreign'; },
    value => { value.topics.find(topic => topic.tab === 'xray').citations = ['https://foreign.example']; },
    value => { value.source.structure.sources[0].sha256 = '0'.repeat(64); },
    value => { value.topics.find(topic => topic.tab === 'xray').readiness = 'approved'; },
    value => { value.topics.splice(value.topics.findIndex(topic => topic.tab === 'xray'), 1); },
  ]) {
    const altered = structuredClone(packet); edit(altered);
    assert.equal(await now.parseBodyReviewResponse(altered, s.id), null);
    malformedPackets++;
  }
  const previousContext = await before.bodyReviewContext(s.id);
  const context = await now.bodyReviewContext(s.id);
  assert.equal(context.sourceHash, previousContext.sourceHash);
  assert.notEqual(context.teachingHash, previousContext.teachingHash);
  assert.notEqual(context.revisions.teaching, previousContext.revisions.teaching);
  // Geometry revisions include the independently versioned renderer; never
  // infer unchanged geometry approval from this teaching-only transition.
  const decision = { catalogScope: context.catalogScope, structureId: s.id,
    track: 'teaching', expectedVersion: 0, materialHash: context.materialHash,
    revisionHash: context.revisions.teaching, checklistVersion: context.checklistVersion,
    draft: now.blankBodyReview(context, 'teaching') };
  const save = async input => now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
    method: 'POST', headers: { origin: 'https://atlas.test', 'content-type': 'application/json',
      'oai-authenticated-user-id': 'SYNTHETIC_MEDIAN_ANTEBRACHIAL_XRAY' },
    body: JSON.stringify(input),
  }), { prepare() { storageCalls++; throw Error('Invalid decision reached storage'); } });
  for (const hashes of [
    { materialHash: previousContext.materialHash, revisionHash: previousContext.revisions.teaching },
    { materialHash: previousContext.materialHash },
    { revisionHash: previousContext.revisions.teaching },
  ]) {
    assert.equal((await save({ ...decision, ...hashes })).status, 409);
    staleSaves++;
  }
  const forged = structuredClone(decision); forged.draft.checks.foreign = true;
  assert.throws(() => now.validateBodyReviewDraft(forged.draft, context.checklists.teaching),
    /Checklist does not match/);
  assert.equal((await save(forged)).status, 422); forgedSaves++;
  const unattested = structuredClone(decision); unattested.draft.status = 'approved';
  Object.keys(unattested.draft.checks).forEach(key => { unattested.draft.checks[key] = true; });
  Object.assign(unattested.draft, { reviewer: 'Synthetic Reviewer', qualification: 'Synthetic role',
    scope: 'Synthetic scope for refusal testing only',
    evidence: [{ title: 'Synthetic evidence', url: 'https://example.test/evidence', note: '' }] });
  const parsedUnattested = now.validateBodyReviewDraft(unattested.draft, context.checklists.teaching);
  assert.deepEqual(now.bodyApprovalProblems(parsedUnattested, context, 'teaching'),
    ['Attest that you personally performed this review.']);
  assert.deepEqual(now.bodyApprovalProblems({ ...parsedUnattested, attested: true }, context, 'teaching'), [],
    'No other approval problem may mask the missing-attestation refusal');
  const refusedUnattested = await save(unattested);
  assert.equal(refusedUnattested.status, 422);
  assert.equal((await refusedUnattested.json()).error, 'Attest that you personally performed this review.');
  refusedApprovals++;
  const forgedApproval = structuredClone(decision);
  forgedApproval.draft.status = 'approved'; forgedApproval.draft.attested = true;
  forgedApproval.draft.checks.foreign = true;
  assert.equal((await save(forgedApproval)).status, 422); refusedApprovals++;
  changedPackets++;
}
assert.deepEqual([changedTopics, preservedTopics, changedPackets, preservedPackets], [2, 9934, 2, 1102]);
assert.deepEqual([malformedPackets, staleSaves, forgedSaves, refusedApprovals, storageCalls], [10, 6, 2, 4, 0]);
console.log(JSON.stringify({ baselineCommit, featureCommit, requiredPinsHash, changedTopics, preservedTopics,
  changedPackets, preservedPackets, identityRefusals, malformedPackets, staleSaves,
  forgedSaves, refusedApprovals, storageCalls, sourceBundlesPreserved: catalog.bundles.length,
  clinicalApproval: false }));
