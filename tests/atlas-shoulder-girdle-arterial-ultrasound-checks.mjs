import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {resolve} from 'node:path';
import {parse} from 'acorn';
import {build} from 'esbuild';
import {atlasExactGitApi} from './atlas-exact-git-api.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const websiteBaseline = '37e2e9e900ef2cdd1b6b9000fb1a813b69e8495e';
const sourceRevision = 'c5c99ba11e6533d306587e71f5fc2854d882fbd6';
const sourceBaseline = 'bbe33ea6ffff3503ae9cdabc0dd41350cece28cd';
const atlasSource = 'C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
const hash = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
const gitOptions = {maxBuffer: 32e6, windowsHide: true, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}};
const old = path => execFileSync('git', ['show', `${websiteBaseline}:${path}`], gitOptions);
const sourceAt = path => execFileSync('git', ['show', `${sourceRevision}:${path}`], {...gitOptions, cwd: atlasSource});
const common = "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';export {structures} from './atlas-review/app/anatomy-data';export {dissectionProfiles} from './atlas-review/app/dissection-data';export {regionalTours} from './atlas-review/lib/regional-tours';export {reasoningConcepts} from './atlas-review/lib/reasoning-questions';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';";
const before = await atlasExactGitApi(websiteBaseline, common);
const compiled = await build({stdin: {contents: common + "export * from './atlas-review/lib/shoulder-girdle-arterial-ultrasound';export * from './atlas-review/content/shoulder-girdle-arterial-ultrasound';", resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm'});
const now = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const pins = JSON.parse(sourceAt('content/shoulder-girdle-arterial-ultrasound-pins.json'));
const transition = JSON.parse(sourceAt('content/shoulder-girdle-arterial-ultrasound.transition.json'));
assert.equal(hash(pins), '2edc421ca9a85878625dc607e990d1136fbb4be63609c62ba565161ffa09e56d');
assert.equal(hash(transition), 'f8718d1d4428a8301a83bc0332c7e007c646dc579ea98354969c987d5eafd20f');
assert.equal(pins.baseline, sourceBaseline);
assert.equal(transition.baseline, sourceBaseline);
assert.equal(transition.sourcePinsHash, hash(pins));
assert.deepEqual(readFileSync('atlas-review/content/shoulder-girdle-arterial-ultrasound-pins.json'), sourceAt('content/shoulder-girdle-arterial-ultrasound-pins.json'));
const expectedFamilies = {posteriorCircumflexHumeral: 2, circumflexScapular: 2, thyrocervical: 2, costocervical: 2, dorsalScapular: 2};
assert.deepEqual(pins.entries.reduce((counts, entry) => (counts[entry.family] = (counts[entry.family] || 0) + 1, counts), {}), expectedFamilies);
assert.equal(pins.entries.length, 10);
assert.equal(transition.entries.length, 10);
const entries = new Map(pins.entries.map(entry => [entry.identity.id, entry]));
const transitions = new Map(transition.entries.map(entry => [entry.id, entry]));
assert.equal(entries.size, 10);
assert.equal(transitions.size, 10);

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
assert.deepEqual(pins.bundles, sourceCatalog.bundles.filter(bundle => ['shoulder-arm-vessels-recovery', 'shoulder-arm-vessels-inventory'].includes(bundle.id)));
const snapshot = api => ({catalog, body: catalog.structures.map(structure => ({id: structure.id, topics: Object.fromEntries(api.contentTabs.map(tab => [tab, api.bodyLesson(structure, tab)]))})), shoulder: api.structures, recipes: api.dissectionProfiles});
assert.equal(hash(snapshot(before)), pins.beforeAllTeachingSnapshotHash);
const recovered = snapshot(now);
let changed = 0, preserved = 0, identityRefusals = 0, malformed = 0, stale = 0, storageCalls = 0, worksheets = 0;
for (const row of recovered.body) {
  const structure = catalog.structures.find(item => item.id === row.id), entry = entries.get(row.id);
  for (const tab of now.contentTabs) {
    const prior = before.bodyLesson(structure, tab);
    if (entry && tab === 'ultrasound') {
      const lesson = now.bodyLesson(structure, tab), recorded = transitions.get(row.id);
      assert.deepEqual(prior, entry.previous);
      assert.deepEqual(lesson, now.shoulderGirdleArterialUltrasoundLesson(entry.identity, tab));
      assert(recorded);
      assert.equal(recorded.fmaId, structure.fmaId);
      assert.equal(hash(lesson), recorded.draftHash);
      assert.equal(prior.readiness, 'pending');
      assert.equal(lesson.readiness, 'draft');
      const {readiness, ...display} = lesson;
      assert.deepEqual(now.bodyContent(structure, tab), display);
      row.topics[tab] = prior;
      changed++;
    } else {
      assert.deepEqual(row.topics[tab], prior, `${row.id}:${tab}:unchanged`);
      preserved++;
    }
  }
}
assert.equal(changed, 10);
assert.equal(preserved, 9926);
assert.equal(hash(recovered), pins.beforeAllTeachingSnapshotHash);
const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object' ? Object.entries(value).flatMap(([key, part]) => pathsWhere(part, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
for (const {identity, previous, family} of pins.entries) {
  assert.deepEqual(catalog.structures.find(structure => structure.id === identity.id), identity);
  assert.deepEqual(previous, before.bodyLesson(identity, 'ultrasound'));
  assert.equal(previous.readiness, 'pending');
  assert.match(identity.fmaId, /^FMA\d+$/);
  assert.equal(identity.sources.length, family === 'posteriorCircumflexHumeral' ? 2 : 1);
  for (const source of identity.sources) assert.match(source.file, /^FJ\d+[A-Z]?$/);
  const lesson = now.shoulderGirdleArterialUltrasoundLesson(identity, 'ultrasound');
  assert.equal(lesson.readiness, 'draft');
  assert.match(lesson.note, /revision-bound radiologist/i);
  assert.match(lesson.note, /independent/i);
  assert.equal(lesson.body, now.shoulderGirdleArterialUltrasoundTeaching[family].body);
  assert.deepEqual(lesson.bullets, [...now.shoulderGirdleArterialUltrasoundTeaching[family].bullets]);
  assert.deepEqual(lesson.citations, now.shoulderGirdleArterialUltrasoundTeaching[family].citations.map(key => now.shoulderGirdleArterialUltrasoundReferences[key]));
  for (const citation of lesson.citations) assert.equal(new URL(citation).protocol, 'https:');
  const original = structuredClone(lesson);
  lesson.bullets.push('foreign');
  lesson.citations.push('https://foreign.example');
  assert.deepEqual(now.shoulderGirdleArterialUltrasoundLesson(identity, 'ultrasound'), original);
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const foreign = structuredClone(identity), parent = at(foreign, path.slice(0, -1)), key = path.at(-1), value = parent[key];
    parent[key] = typeof value === 'string' ? `${value}-foreign` : typeof value === 'number' ? value + 0.01 : value === null ? 'foreign' : !value;
    assert.equal(now.shoulderGirdleArterialUltrasoundLesson(foreign, 'ultrasound'), undefined, `${identity.id}:${path.join('.')}`);
    identityRefusals++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const foreign = structuredClone(identity);
    at(foreign, path).push('foreign');
    assert.equal(now.shoulderGirdleArterialUltrasoundLesson(foreign, 'ultrasound'), undefined, `${identity.id}:${path.join('.')}`);
    identityRefusals++;
  }
  if (identity.sources.length > 1) {
    const reordered = structuredClone(identity);
    reordered.sources.reverse();
    assert.equal(now.shoulderGirdleArterialUltrasoundLesson(reordered, 'ultrasound'), undefined, `${identity.id}:ordered-sources`);
    identityRefusals++;
  }
  assert.equal(now.shoulderGirdleArterialUltrasoundLesson({...structuredClone(identity), unexpected: true}, 'ultrasound'), undefined);
  identityRefusals++;
  for (const tab of now.contentTabs.filter(tab => tab !== 'ultrasound')) assert.equal(now.shoulderGirdleArterialUltrasoundLesson(identity, tab), undefined);
  const current = await now.bodyReviewMaterial(identity.id), prior = await before.bodyReviewMaterial(identity.id);
  assert.equal(current.approval, false);
  assert(await now.parseBodyReviewResponse(current, identity.id));
  for (const key of ['source', 'reasoning', 'guidedTours']) assert.deepEqual(current[key], prior[key]);
  assert.deepEqual(current.topics.find(topic => topic.tab === 'ultrasound'), {tab: 'ultrasound', ...original});
  for (const edit of [
    value => {value.topics.find(topic => topic.tab === 'ultrasound').body += ' foreign';},
    value => {value.topics.find(topic => topic.tab === 'ultrasound').readiness = 'approved';},
    value => {value.topics.find(topic => topic.tab === 'ultrasound').citations = ['https://foreign.example'];},
    value => {value.source.structure.sources = [];},
    value => {value.topics = value.topics.filter(topic => topic.tab !== 'ultrasound');},
  ]) {
    const foreign = structuredClone(current);
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
    const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_SHOULDER_GIRDLE_US'}, body: JSON.stringify({...packet, ...delta})}), {prepare() {storageCalls++; throw Error('Stale decision reached storage');}});
    assert.equal(response.status, 409);
    stale++;
  }
}
assert.equal(identityRefusals, 416);
assert.equal(malformed, 50);
assert.equal(stale, 30);
assert.equal(storageCalls, 0);
assert.equal(now.shoulderGirdleArterialUltrasoundLesson({id: 'foreign'}, 'ultrasound'), undefined);
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
assert.equal(worksheets, 10);
for (const bundle of catalog.bundles) {
  const path = `public/atlas-runtime/head-neck${bundle.url.split('?')[0]}`, bytes = readFileSync(path);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(hash(bytes), bundle.sha256);
  assert.deepEqual(bytes, old(path));
}
for (const path of ['package-lock.json', 'atlas-review/lib/imaging-sync.ts', 'atlas-review/lib/didanix-atlas-adapter.ts', 'atlas-review/lib/independent-study-links.ts'])
  assert.equal(readFileSync(path, 'utf8').replaceAll('\r\n', '\n'), old(path).toString().replaceAll('\r\n', '\n'), path);
const review = JSON.parse(readFileSync('atlas-review/manifest.json'));
assert.equal(review.revision, sourceRevision);
for (const file of review.files) assert.equal(hash(readFileSync(`atlas-review/${file.path}`)), file.importedSha256, file.path);
const addedPaths = ['lib/shoulder-girdle-arterial-ultrasound.ts', 'content/shoulder-girdle-arterial-ultrasound.ts', 'content/shoulder-girdle-arterial-ultrasound-pins.json'];
for (const path of addedPaths) {
  const file = review.files.find(item => item.path === path);
  assert(file, path);
  assert.equal(file.sourceSha256, hash(sourceAt(path)));
}
assert(!review.files.some(file => file.path === 'content/shoulder-girdle-arterial-ultrasound.transition.json'));
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
  for (const path of addedPaths) {
    const actual = inputs.find(file => file.path === path), imported = review.files.find(file => file.path === path);
    assert.equal(Boolean(actual), name === 'head-neck' || name === 'shoulder', `${name}:${path}`);
    if (actual) assert.equal(actual.sha256, imported.sourceSha256);
  }
  assert(!inputs.some(file => file.path === 'content/shoulder-girdle-arterial-ultrasound.transition.json'));
  if (name === 'head-neck') {
    const emitted = emittedTeaching(base, manifest.files);
    for (const entry of pins.entries) {
      const lesson = now.shoulderGirdleArterialUltrasoundLesson(entry.identity, 'ultrasound');
      for (const value of [entry.identity.id, lesson.body, ...lesson.bullets, lesson.note, ...lesson.citations])
        assert(emitted.includes(value) || emitted.includes(JSON.stringify(value).slice(1, -1)), `learner:${entry.identity.id}:${value.slice(0, 40)}`);
    }
    const teachingFile = manifest.files.find(file => /^assets\/body-content-[^/]+\.js$/.test(file.path));
    assert(teachingFile);
    // The emitted lesson imports the UI entry. Exclude its one pinned mount
    // statement in memory; preserve every lesson and dependency function.
    const teachingBytes = readFileSync(base + teachingFile.path);
    assert.equal(hash(teachingBytes), teachingFile.sha256);
    const indexImport = teachingBytes.toString().match(/from"\.\/(index-[A-Za-z0-9_-]+\.js)"/g) || [];
    assert.equal(indexImport.length, 1, 'One emitted UI-entry dependency');
    const indexName = /index-[A-Za-z0-9_-]+\.js/.exec(indexImport[0])[0];
    const indexPath = `assets/${indexName}`;
    const indexFile = manifest.files.find(file => file.path === indexPath);
    assert(indexFile, indexPath);
    const indexBytes = readFileSync(base + indexPath);
    assert.equal(hash(indexBytes), indexFile.sha256, 'Exact emitted UI entry');
    const indexSource = indexBytes.toString('utf8');
    const statements = parse(indexSource, {ecmaVersion: 'latest', sourceType: 'module'}).body.filter(node => {
      if (node.type !== 'ExpressionStatement') return false;
      const render = node.expression, root = render.callee?.object, selector = root?.arguments?.[0];
      const factory = root?.callee?.expressions?.at(-1);
      return render.type === 'CallExpression' && render.callee?.type === 'MemberExpression' && render.callee.property?.name === 'render'
        && root?.type === 'CallExpression' && factory?.type === 'MemberExpression' && factory.property?.name === 'createRoot'
        && selector?.type === 'CallExpression' && selector.callee?.object?.name === 'document'
        && selector.callee?.property?.name === 'getElementById' && selector.arguments?.length === 1
        && selector.arguments[0]?.type === 'TemplateLiteral' && selector.arguments[0].expressions.length === 0
        && selector.arguments[0].quasis[0].value.cooked === 'root';
    });
    assert.equal(statements.length, 1, 'Exactly one top-level root mount');
    const mount = statements[0];
    const startByte = Buffer.byteLength(indexSource.slice(0, mount.start));
    const endByte = Buffer.byteLength(indexSource.slice(0, mount.end));
    assert.equal(hash(indexBytes.subarray(startByte, endByte)), '3f85eccd2ebce4e57d2a94484816504fefe8c114c1eeae365830a1077e872744', 'Pinned complete root-mount statement');
    const isolatedIndex = indexSource.slice(0, mount.start) + ';' + indexSource.slice(mount.end);
    assert.equal(isolatedIndex.slice(0, mount.start), indexSource.slice(0, mount.start));
    assert.equal(isolatedIndex.slice(mount.start + 1), indexSource.slice(mount.end));
    const actualBundle = await build({entryPoints: [base + teachingFile.path], bundle: true, write: false, platform: 'node', format: 'cjs', plugins: [{name: 'exclude-exact-ui-mount', setup(plugin) {
      plugin.onLoad({filter: /index-[A-Za-z0-9_-]+\.js$/}, args => {
        assert.equal(args.path, resolve(base + indexPath), 'Only the pinned UI entry may be isolated');
        return {contents: isolatedIndex, loader: 'js'};
      });
    }}]});
    const runtimeModule = {exports: {}};
    const documentProbe = {createElement(tag) {
      assert.equal(tag, 'link', 'Unexpected DOM creation while evaluating emitted teaching');
      return {relList: {supports: relation => relation === 'modulepreload'}};
    }};
    runInNewContext(actualBundle.outputFiles[0].text, {
      module: runtimeModule, exports: runtimeModule.exports, document: documentProbe,
      window: {location: {search: ''}},
      Buffer, process, console, URL, URLSearchParams, Request, Response,
    }, {timeout: 60000, filename: teachingFile.path});
    const runtime = runtimeModule.exports;
    assert.equal(typeof runtime.bodyLesson, 'function');
    for (const structure of catalog.structures) for (const tab of now.contentTabs)
      assert.deepEqual(structuredClone(runtime.bodyLesson(structure, tab)), now.bodyLesson(structure, tab), `emitted:${structure.id}:${tab}`);
  }
}
const reviewBase = 'public/atlas-review-viewer/', reviewManifest = JSON.parse(readFileSync(`${reviewBase}manifest.json`));
assert.equal(reviewManifest.sourceCommit, sourceRevision);
assert.equal(reviewManifest.personalRecordsIncluded, false);
assert.equal(reviewManifest.mode, 'production');
assert.equal(reviewManifest.websiteIntegrationSha256, review.websiteIntegrationSha256);
for (const file of reviewManifest.files) assert.equal(hash(readFileSync(reviewBase + file.path)), file.sha256, `review:${file.path}`);
const emittedReview = emittedTeaching(reviewBase, reviewManifest.files, true);
for (const entry of pins.entries) {
  const lesson = now.shoulderGirdleArterialUltrasoundLesson(entry.identity, 'ultrasound');
  for (const value of [entry.identity.id, lesson.body, ...lesson.bullets, lesson.note, ...lesson.citations])
    assert(emittedReview.includes(value) || emittedReview.includes(JSON.stringify(value).slice(1, -1)), `review:${entry.identity.id}:${value.slice(0, 40)}`);
}
console.log(JSON.stringify({websiteBaseline, sourceRevision, changed, preserved, identityRefusals, malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale, storageCalls, changedTeachingWorksheets: worksheets, verifiedRuntimes: 4, emittedTopicsCompared: 9936, clinicalApproval: false, browserAcceptance: false}));
