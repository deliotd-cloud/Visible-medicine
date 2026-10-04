import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {atlasExactGitApi} from './atlas-exact-git-api.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const websiteBaseline = '0ffdb0ad6e0b729a4161f3a282389cc1daef1ce8';
const sourceBaseline = '90191b8b236bfed00db7c424dbacde915920460d';
const sourceRevision = 'a1cb14f05b3070b8553e85e3596f634b2bf36a5d';
const atlasSource = 'C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
const tabs = ['ct', 'mri', 'xray'];
const finalBullet = 'Return separation to zero before comparing source wrist relationships. Cutaway and Explode do not generate acquired scan slices, tissue signal or diagnostic measurements.';
const hash = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
const old = path => execFileSync('git', ['show', `${websiteBaseline}:${path}`], {maxBuffer: 32e6, windowsHide: true, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}});
const sourceAt = path => execFileSync('git', ['show', `${sourceRevision}:${path}`], {cwd: atlasSource, maxBuffer: 32e6, windowsHide: true, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}});
const common = "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';export {structures} from './atlas-review/app/anatomy-data';export {dissectionProfiles} from './atlas-review/app/dissection-data';export {regionalTours} from './atlas-review/lib/regional-tours';export {reasoningConcepts} from './atlas-review/lib/reasoning-questions';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';";
const before = await atlasExactGitApi(websiteBaseline, common);
const compiled = await build({stdin: {contents: common + "export * from './atlas-review/lib/wrist-imaging';export * from './atlas-review/content/wrist-imaging-concepts';", resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm'});
const now = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const pins = JSON.parse(sourceAt('content/wrist-imaging-correction-pins.json'));
const transition = JSON.parse(sourceAt('content/wrist-imaging-correction.transition.json'));
const wristPins = JSON.parse(readFileSync('atlas-review/content/wrist-imaging-pins.json'));
assert.equal(hash(pins), '15dfbad1c4484cfb90962ee158c2f12fd113f73edbd2ddb6999f79708668f343');
assert.equal(hash(transition), '74b600dd3a73ac6258c026289fe629f41b16956295a8a73f2d2775867f51abd7');
assert.equal(pins.baseline, sourceBaseline);
assert.equal(transition.baseline, sourceBaseline);
assert.equal(transition.sourcePinsHash, hash(pins));
assert.deepEqual(readFileSync('atlas-review/content/wrist-imaging-pins.json'), sourceAt('content/wrist-imaging-pins.json'));
assert.equal(wristPins.entries.length, 16);
assert.equal(pins.entries.length, 16);
assert.equal(transition.entries.length, 48);
const entries = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
const transitions = new Map(transition.entries.map(entry => [`${entry.id}:${entry.tab}`, entry]));
assert.equal(entries.size, 16);
assert.equal(transitions.size, 48);
for (const entry of wristPins.entries) {
  assert.deepEqual(entry.identity, entries.get(entry.identity.id)?.identity);
}
assert.deepEqual(pins.entries.map(entry => entry.identity.name).sort(), ['Left', 'Right'].flatMap(side => ['capitate', 'hamate', 'lunate', 'pisiform', 'scaphoid', 'trapezium', 'trapezoid', 'triquetral'].map(bone => `${side} ${bone}`)).sort());

const sourceCatalog = JSON.parse(readFileSync('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
const catalog = now.bodyDisplayCatalog(sourceCatalog);
assert.equal(catalog.structures.length, 1104);
assert.equal(catalog.bundles.length, 109);
assert.deepEqual(catalog, before.bodyDisplayCatalog(JSON.parse(old('atlas-review/public/models/bodyparts3d/full-body/catalog.json'))));
for (const key of ['structures', 'dissectionProfiles', 'regionalTours', 'reasoningConcepts', 'contentTabs']) assert.deepEqual(now[key], before[key], key);
assert.equal(now.contentTabs.length, 9);
assert.equal(pins.sourceVersion, sourceCatalog.sourceVersion);
assert.equal(pins.license, sourceCatalog.license);
assert.deepEqual(pins.coordinateSystem, sourceCatalog.coordinateSystem);
assert.deepEqual(pins.bundles, sourceCatalog.bundles.filter(bundle => bundle.id === 'hand-skeleton'));
const snapshot = api => ({catalog, body: catalog.structures.map(structure => ({id: structure.id, topics: Object.fromEntries(api.contentTabs.map(tab => [tab, api.bodyLesson(structure, tab)]))})), shoulder: api.structures, recipes: api.dissectionProfiles});
assert.equal(hash(snapshot(before)), pins.beforeAllTeachingSnapshotHash);
const reconstructed = snapshot(now);
let changed = 0, preserved = 0, identityRefusals = 0, malformed = 0, stale = 0, storageCalls = 0, worksheets = 0;
for (const row of reconstructed.body) {
  const structure = catalog.structures.find(item => item.id === row.id), entry = entries.get(row.id);
  for (const tab of now.contentTabs) {
    const previous = before.bodyLesson(structure, tab);
    if (entry && tabs.includes(tab)) {
      const current = now.bodyLesson(structure, tab), recorded = transitions.get(`${row.id}:${tab}`);
      assert.deepEqual(previous, entry.previous[tab], `${row.id}:${tab}:prior`);
      assert.equal(current.readiness, 'draft');
      assert.deepEqual(current, now.wristImagingLesson(entry.identity, tab));
      assert(recorded);
      assert.equal(recorded.fmaId, structure.fmaId);
      assert.equal(hash(current), recorded.draftHash);
      assert.notDeepEqual(current, previous);
      assert.equal(current.bullets.at(-1), finalBullet);
      if (!['FMA24446', 'FMA24447', 'FMA24448', 'FMA24449'].includes(structure.fmaId)) {
        const restored = structuredClone(current);
        restored.bullets[restored.bullets.length - 1] = previous.bullets.at(-1);
        assert.deepEqual(restored, previous, `${row.id}:${tab}:only shared correction`);
      }
      const {readiness, ...display} = current;
      assert.deepEqual(now.bodyContent(structure, tab), display);
      row.topics[tab] = previous;
      changed++;
    } else {
      assert.deepEqual(row.topics[tab], previous, `${row.id}:${tab}:preserved`);
      preserved++;
    }
  }
}
assert.equal(changed, 48);
assert.equal(preserved, 9888);
assert.equal(hash(reconstructed), pins.beforeAllTeachingSnapshotHash);
const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object' ? Object.entries(value).flatMap(([key, part]) => pathsWhere(part, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
for (const {identity, previous} of pins.entries) {
  assert.deepEqual(catalog.structures.find(structure => structure.id === identity.id), identity);
  assert.deepEqual(Object.keys(previous).sort(), [...tabs].sort());
  const isCapitate = /capitate/i.test(identity.name), isHamate = /hamate/i.test(identity.name);
  for (const tab of tabs) {
    const lesson = now.wristImagingLesson(identity, tab), original = structuredClone(lesson);
    assert.equal(lesson.readiness, 'draft');
    assert.match(lesson.note, /independent anatomy\/radiology review pending/i);
    assert.match(lesson.note, /no patient images, scan registration or paid-lecture access/i);
    assert.equal(lesson.bullets.at(-1), finalBullet);
    assert(![lesson.body, ...lesson.bullets].join(' ').includes('relationswrists'));
    if (isCapitate) assert.doesNotMatch([lesson.body, ...lesson.bullets].join(' '), /\bhook\b/i);
    for (const citation of lesson.citations) assert.equal(new URL(citation).protocol, 'https:');
    lesson.bullets.push('foreign');
    lesson.citations.push('https://foreign.example');
    assert.deepEqual(now.wristImagingLesson(identity, tab), original);
    for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
      const foreign = structuredClone(identity), parent = at(foreign, path.slice(0, -1)), key = path.at(-1), value = parent[key];
      parent[key] = typeof value === 'string' ? `${value}-foreign` : typeof value === 'number' ? value + 0.01 : value === null ? 'foreign' : !value;
      assert.equal(now.wristImagingLesson(foreign, tab), undefined, `${identity.id}:${tab}:${path.join('.')}`);
      identityRefusals++;
    }
    for (const path of pathsWhere(identity, Array.isArray)) {
      const foreign = structuredClone(identity);
      at(foreign, path).push('foreign');
      assert.equal(now.wristImagingLesson(foreign, tab), undefined, `${identity.id}:${tab}:${path.join('.')}`);
      identityRefusals++;
    }
    assert.equal(now.wristImagingLesson({...structuredClone(identity), unexpected: true}, tab), undefined);
    identityRefusals++;
    const priorMaterial = await before.bodyReviewMaterial(identity.id), material = await now.bodyReviewMaterial(identity.id);
    assert.equal(material.approval, false);
    assert(await now.parseBodyReviewResponse(material, identity.id));
    for (const key of ['source', 'reasoning', 'guidedTours']) assert.deepEqual(material[key], priorMaterial[key]);
    assert.deepEqual(material.topics.find(topic => topic.tab === tab), {tab, ...original});
    for (const edit of [
      value => {value.topics.find(topic => topic.tab === tab).body += ' foreign';},
      value => {value.topics.find(topic => topic.tab === tab).readiness = 'approved';},
      value => {value.topics.find(topic => topic.tab === tab).citations = ['https://foreign.example'];},
      value => {value.source.structure.sources = [];},
      value => {value.topics = value.topics.filter(topic => topic.tab !== tab);},
    ]) {
      const foreign = structuredClone(material);
      edit(foreign);
      assert.equal(await now.parseBodyReviewResponse(foreign, identity.id), null);
      malformed++;
    }
    const priorContext = await before.bodyReviewContext(identity.id), context = await now.bodyReviewContext(identity.id);
    assert.equal(context.sourceHash, priorContext.sourceHash);
    assert.notEqual(context.revisions.teaching, priorContext.revisions.teaching);
    assert.equal(context.revisions.imaging, null);
    const packet = {catalogScope: context.catalogScope, structureId: identity.id, track: 'teaching', expectedVersion: 0, materialHash: context.materialHash, revisionHash: context.revisions.teaching, checklistVersion: context.checklistVersion, draft: now.blankBodyReview(context, 'teaching')};
    for (const delta of [
      {materialHash: priorContext.materialHash, revisionHash: priorContext.revisions.teaching},
      {materialHash: priorContext.materialHash},
      {revisionHash: priorContext.revisions.teaching},
    ]) {
      const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_WRIST_CORRECTION'}, body: JSON.stringify({...packet, ...delta})}), {prepare() {storageCalls++; throw Error('Stale decision reached storage');}});
      assert.equal(response.status, 409);
      stale++;
    }
  }
  for (const tab of now.contentTabs.filter(tab => !tabs.includes(tab))) assert.equal(now.wristImagingLesson(identity, tab), undefined);
  if (isCapitate || isHamate) {
    const bodies = tabs.map(tab => now.wristImagingLesson(identity, tab).body);
    assert.equal(new Set(bodies).size, 3);
  }
}
assert.equal(identityRefusals, 1920);
assert.equal(malformed, 240);
assert.equal(stale, 144);
assert.equal(storageCalls, 0);
for (const [capitateFma, hamateFma] of [['FMA24446', 'FMA24448'], ['FMA24447', 'FMA24449']]) {
  const capitate = catalog.structures.find(structure => structure.fmaId === capitateFma), hamate = catalog.structures.find(structure => structure.fmaId === hamateFma);
  assert(capitate && hamate);
  assert.equal(capitate.laterality, hamate.laterality);
  for (const tab of tabs) {
    const capitateLesson = now.wristImagingLesson(capitate, tab), hamateLesson = now.wristImagingLesson(hamate, tab);
    assert.notEqual(capitateLesson.body, hamateLesson.body);
    assert.match(capitateLesson.body, /capitate/i);
    assert.match(hamateLesson.body, /hamate/i);
    assert.match(hamateLesson.body, /hook/i);
  }
  assert.match(now.wristImagingLesson(capitate, 'ct').body, /head.*neck.*body/i);
  assert.match(now.wristImagingLesson(capitate, 'xray').body, /third metacarpal/i);
}
assert.equal(now.wristImagingLesson({id: 'foreign'}, 'ct'), undefined);
for (const structure of catalog.structures) {
  const prior = await before.bodyReviewMaterial(structure.id), current = await now.bodyReviewMaterial(structure.id);
  for (const key of ['source', 'reasoning', 'guidedTours']) assert.deepEqual(current[key], prior[key]);
  assert.equal(current.approval, false);
  if (entries.has(structure.id)) {
    assert.notEqual(current.fingerprints.teaching, prior.fingerprints.teaching);
    worksheets++;
  } else {
    assert.deepEqual(current.topics, prior.topics);
    assert.equal(current.fingerprints.teaching, prior.fingerprints.teaching);
  }
}
assert.equal(worksheets, 16);
for (const bundle of catalog.bundles) {
  const path = `public/atlas-runtime/head-neck${bundle.url.split('?')[0]}`, bytes = readFileSync(path);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(hash(bytes), bundle.sha256);
  assert.deepEqual(bytes, old(path));
}
for (const path of ['package-lock.json', 'atlas-review/app/body-explorer.tsx', 'atlas-review/lib/imaging-sync.ts', 'atlas-review/lib/didanix-atlas-adapter.ts', 'atlas-review/lib/independent-study-links.ts'])
  assert.equal(readFileSync(path, 'utf8').replaceAll('\r\n', '\n'), old(path).toString().replaceAll('\r\n', '\n'), path);
const review = JSON.parse(readFileSync('atlas-review/manifest.json'));
assert.equal(review.revision, sourceRevision);
for (const file of review.files) assert.equal(hash(readFileSync(`atlas-review/${file.path}`)), file.importedSha256, file.path);
for (const path of ['lib/wrist-imaging.ts', 'content/wrist-imaging-concepts.ts', 'content/wrist-imaging-pins.json']) {
  const file = review.files.find(item => item.path === path);
  assert(file, path);
  assert.equal(file.sourceSha256, hash(sourceAt(path)));
}
assert(!review.files.some(file => file.path === 'content/wrist-imaging-correction-pins.json' || file.path === 'content/wrist-imaging-correction.transition.json'));
for (const name of ['head-neck', 'shoulder', 'female-pelvis', 'lower-limb']) {
  const base = `public/atlas-runtime/${name}/`, manifest = JSON.parse(readFileSync(`${base}manifest.json`));
  assert.equal(manifest.sourceCommit, sourceRevision);
  assert.equal(manifest.patientDataIncluded, false);
  assert.equal(manifest.clinicalApproved, false);
  for (const file of manifest.files) {
    const bytes = readFileSync(base + file.path);
    assert.equal(bytes.length, file.bytes);
    assert.equal(hash(bytes), file.sha256);
  }
  const previous = JSON.parse(old(`${base}manifest.json`));
  assert.deepEqual(manifest.files.filter(file => file.path.startsWith('models/')), previous.files.filter(file => file.path.startsWith('models/')));
  const inputs = JSON.parse(readFileSync(`${base}source-inputs.json`));
  for (const path of ['lib/wrist-imaging.ts', 'content/wrist-imaging-concepts.ts', 'content/wrist-imaging-pins.json']) {
    const actual = inputs.find(file => file.path === path), imported = review.files.find(file => file.path === path);
    assert.equal(Boolean(actual), name === 'head-neck' || name === 'shoulder', `${name}:${path}`);
    if (actual) assert.equal(actual.sha256, imported.sourceSha256);
  }
  assert(!inputs.some(file => file.path.startsWith('content/wrist-imaging-correction.')));
  if (name === 'head-neck') {
    const emitted = emittedTeaching(base, manifest.files);
    for (const entry of pins.entries) for (const tab of tabs) {
      const lesson = now.wristImagingLesson(entry.identity, tab);
      for (const value of [entry.identity.id, lesson.body, ...lesson.bullets, lesson.note, ...lesson.citations])
        assert(emitted.includes(value) || emitted.includes(JSON.stringify(value).slice(1, -1)), `learner:${entry.identity.id}:${tab}:${value.slice(0, 40)}`);
    }
  }
}
const reviewBase = 'public/atlas-review-viewer/', reviewManifest = JSON.parse(readFileSync(`${reviewBase}manifest.json`));
assert.equal(reviewManifest.sourceCommit, sourceRevision);
assert.equal(reviewManifest.personalRecordsIncluded, false);
assert.equal(reviewManifest.mode, 'production');
assert.equal(reviewManifest.websiteIntegrationSha256, review.websiteIntegrationSha256);
for (const file of reviewManifest.files) assert.equal(hash(readFileSync(reviewBase + file.path)), file.sha256, `review:${file.path}`);
const emittedReview = emittedTeaching(reviewBase, reviewManifest.files, true);
for (const entry of pins.entries) for (const tab of tabs) {
  const lesson = now.wristImagingLesson(entry.identity, tab);
  for (const value of [entry.identity.id, lesson.body, ...lesson.bullets, lesson.note, ...lesson.citations])
    assert(emittedReview.includes(value) || emittedReview.includes(JSON.stringify(value).slice(1, -1)), `review:${entry.identity.id}:${tab}:${value.slice(0, 40)}`);
}
console.log(JSON.stringify({websiteBaseline, sourceRevision, changed, preserved, identityRefusals, malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale, storageCalls, changedTeachingWorksheets: worksheets, verifiedRuntimes: 4, clinicalApproval: false, browserAcceptance: false}));
