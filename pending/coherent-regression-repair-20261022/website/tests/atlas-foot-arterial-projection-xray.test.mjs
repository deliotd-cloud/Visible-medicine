import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { CURRENT_ATLAS_REVISION, currentAtlasDeliveryRoot, validateCurrentAtlasDelivery } from './current-atlas-delivery.mjs';

// Run from the candidate website after the coordinator closes the delivery pin.
const root = process.cwd();
const introduction = 'bc925194ce3b388d4b6d9f73b4b3362ed4f2ad5f';
const introductionTree = 'a26d0f391021c207f34d3d1449b4ed85f42239f7';
const parent = '589263554141ba94548f9073327d4e51674bc33b';
const parentTree = 'ba724f0a46448132a6e5fc4c24f63730b53540f9';
const modules = ['head-neck', 'shoulder', 'lower-limb', 'female-pelvis'];
const required = ['content/foot-arterial-projection-xray-pins.json',
  'content/foot-arterial-projection-xray.ts', 'lib/foot-arterial-projection-xray.ts'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const read = path => readFileSync(resolve(root, path));
const json = path => JSON.parse(read(path));
const same = (a, b, label) => assert.deepEqual(structuredClone(a), structuredClone(b), label);
const git = (atlas, ...args) => execFileSync('git', ['-C', atlas, ...args], {
  windowsHide: true, maxBuffer: 32e6, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});
const specs = [
  ['dorsal', 'FMA43916', 'right', 'FJ2055', 'foot-vessels-recovery'],
  ['dorsal', 'FMA43917', 'left', 'FJ2073', 'foot-vessels-recovery'],
  ['medial', 'FMA43929', 'right', 'FJ2164', 'foot-vessels-recovery'],
  ['medial', 'FMA43930', 'left', 'FJ2082', 'foot-vessels-recovery'],
  ['lateral', 'FMA43931', 'right', 'FJ2159', 'foot-vessels-recovery'],
  ['lateral', 'FMA43932', 'left', 'FJ2079', 'foot-vessels-recovery'],
  ['arch', 'FMA43943', 'right', 'FJ2169', 'foot-vessels-foot-vascular'],
  ['arch', 'FMA43944', 'left', 'FJ2085', 'foot-vessels-foot-vascular'],
  ['deep', 'FMA69514', 'right', 'FJ2136', 'foot-vessels-foot-vascular'],
  ['deep', 'FMA69515', 'left', 'FJ2068', 'foot-vessels-foot-vascular'],
  ['superficial', 'FMA43937', 'right', 'FJ2179', 'foot-vessels-foot-vascular'],
  ['superficial', 'FMA43938', 'left', 'FJ2089', 'foot-vessels-foot-vascular'],
];

let fixture;
async function setup() {
  if (fixture) return fixture;
  const pin = validateCurrentAtlasDelivery();
  assert.equal(CURRENT_ATLAS_REVISION, pin.source);
  const atlas = currentAtlasDeliveryRoot();
  assert.equal(git(atlas, 'rev-parse', `${introduction}^{commit}`).toString().trim(), introduction);
  assert.equal(git(atlas, 'rev-parse', `${introduction}^{tree}`).toString().trim(), introductionTree);
  assert.equal(git(atlas, 'rev-parse', `${parent}^{tree}`).toString().trim(), parentTree);
  const requireSite = createRequire(resolve(root, 'package.json'));
  const { build } = requireSite('esbuild');
  const entry = [
    "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
    "export {contentTabs} from './atlas-review/lib/content-types';",
    "export {decodeRegionalTeachingSnapshot} from './atlas-review/lib/regional-teaching-snapshot';",
    "export {footArterialProjectionXrayLesson} from './atlas-review/lib/foot-arterial-projection-xray';",
    "export * from './atlas-review/content/foot-arterial-projection-xray';",
    "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
    "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
    "export {blankBodyReview} from './atlas-review/lib/body-review-decisions';",
  ].join('');
  const compiled = await build({ stdin: { contents: entry, resolveDir: root, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node' });
  const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const { exactSourceHistoryApi } = await import(pathToFileURL(resolve(atlas, 'scripts/exact-source-history-api.mjs')).href);
  const prior = await exactSourceHistoryApi(parent, 'review-security');
  const pins = json('atlas-review/content/foot-arterial-projection-xray-pins.json');
  const catalog = api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  const parentCatalog = prior.bodyDisplayCatalog(JSON.parse(git(atlas, 'show', `${parent}:public/models/bodyparts3d/full-body/catalog.json`)));
  const byId = new Map(catalog.structures.map(s => [s.id, s]));
  const parentById = new Map(parentCatalog.structures.map(s => [s.id, s]));
  assert.equal(byId.size, catalog.structures.length, 'Current catalogue IDs are unique');
  assert.equal(parentById.size, parentCatalog.structures.length, 'Parent catalogue IDs are unique');
  fixture = { pin, atlas, api, prior, pins, catalog, byId, parentById };
  return fixture;
}

test('closed admission and imported Review source files agree with the exact Atlas commit', async () => {
  const { atlas, pin } = await setup();
  const review = json('atlas-review/manifest.json');
  assert.equal(review.revision, pin.source);
  assert.equal(review.files.length, pin.reviewSourceFiles);
  for (const path of required) {
    const row = review.files.find(item => item.path === path);
    assert.ok(row, `Review includes ${path}`);
    assert.equal(hash(read(`atlas-review/${path}`)), row.importedSha256);
    assert.equal(hash(git(atlas, 'show', `${pin.source}:${path}`)), row.sourceSha256);
    assert.equal(row.importedSha256, row.sourceSha256);
  }
});

test('all four runtime manifests retain the same source and delivery boundaries', async () => {
  const { pin, atlas } = await setup();
  const inventory = json('lib/atlas-model-inventory.json');
  assert.equal(inventory.models.length, 137);
  assert.equal(inventory.models.flatMap(model => model.paths).length, 144);
  for (const name of modules) {
    const base = `public/atlas-runtime/${name}/`;
    const manifest = json(base + 'manifest.json');
    assert.equal(manifest.sourceCommit, pin.runtimeSources[name], name);
    assert.equal(manifest.patientDataIncluded, false);
    for (const flag of ['clinicalApproved', 'standaloneReviewConnection', 'imagingConnection'])
      assert.ok(manifest[flag] === false || manifest[flag] === undefined, `${name}:${flag}`);
    const inventorySource = inventory.sources.find(row => row.module === name);
    assert.equal(inventorySource.sourceCommit, pin.runtimeSources[name]);
    assert.equal(inventorySource.manifestSha256, hash(read(base + 'manifest.json')));
    const inputs = json(base + 'source-inputs.json');
    for (const path of required) {
      const row = inputs.find(item => item.path === path);
      if (row) assert.equal(row.sha256, hash(git(atlas, 'show', `${pin.runtimeSources[name]}:${path}`)), `${name}:${path}`);
    }
  }
});

test('twelve bilateral identities, six groups and two licensed bundles are exactly parent-bound', async () => {
  const { atlas, pins, catalog, byId, parentById } = await setup();
  assert.equal(pins.parentCommit, parent);
  assert.equal(pins.entries.length, 12);
  same(pins.coordinateSystem, catalog.coordinateSystem);
  same(pins.entries.map(row => [row.group, row.identity.fmaId, row.identity.laterality,
    row.identity.sources[0]?.file, row.identity.bundle]), specs);
  assert.equal(new Set(pins.entries.map(row => row.identity.id)).size, 12);
  for (const row of pins.entries) {
    same(row.identity, parentById.get(row.identity.id), `${row.identity.id} immutable parent identity`);
    same(row.identity, byId.get(row.identity.id), `${row.identity.id} current identity`);
  }
  assert.equal(pins.bundles.length, 2);
  same(pins.bundles, catalog.bundles.filter(bundle => pins.bundles.some(row => row.id === bundle.id)));
  for (const bundle of pins.bundles) {
    const path = `public${bundle.url}`;
    const bytes = read(`public/atlas-runtime/head-neck/${path.slice('public/'.length)}`);
    assert.equal(bytes.length, bundle.bytes);
    assert.equal(hash(bytes), bundle.sha256);
    same(bytes, git(atlas, 'show', `${parent}:${path}`), `${bundle.id} unchanged licensed bytes`);
  }
});

test('production resolver, generated foot reader and Review worksheet teach the same selected drafts', async () => {
  const { api, pins } = await setup();
  const foot = api.decodeRegionalTeachingSnapshot(json('atlas-review/content/regional-teaching/foot.json'), 'foot');
  for (const { identity, group } of pins.entries) {
    const lesson = api.bodyLesson(identity, 'xray');
    same(lesson, api.footArterialProjectionXrayLesson(identity, 'xray'), identity.id);
    same(lesson, foot.bodyLesson(identity, 'xray'), `${identity.id} generated reader`);
    assert.ok(foot.accepts(identity));
    assert.equal(lesson.readiness, 'draft');
    assert.equal(lesson.body, api.footArterialProjectionXrayTopics[group].body);
    same(lesson.bullets, [...api.footArterialProjectionXrayShared]);
    same(lesson.citations, [...new Set([
      ...api.footArterialProjectionXrayTopics[group].references.map(key => api.footArterialProjectionXrayReferences[key]),
      api.footArterialProjectionXrayReferences.calcification])]);
    assert.match(lesson.note, /review pending/i);
    assert.match(lesson.note, /no acquired images/i);
    assert.match(lesson.note, /Ordinary radiography and contrast angiography are distinct/i);
    const { readiness, ...section } = lesson;
    same(api.bodyContent(identity, 'xray'), section);
    const worksheet = await api.bodyReviewMaterial(identity.id);
    assert.equal(worksheet.approval, false);
    same(worksheet.topics.find(topic => topic.tab === 'xray'), { tab: 'xray', ...lesson });
    assert.ok(await api.parseBodyReviewResponse(worksheet, identity.id));
  }
});

test('specialized resolver does not claim any other topic on the selected targets', async () => {
  const { api, pins } = await setup();
  let declined = 0;
  for (const { identity } of pins.entries) {
    for (const tab of api.contentTabs.filter(tab => tab !== 'xray')) {
      assert.equal(api.footArterialProjectionXrayLesson(identity, tab), undefined, `${identity.id}/${tab}`);
      declined++;
    }
  }
  assert.equal(declined, 96);
});

test('specialized resolver declines the six originally excluded neighbour topics', async () => {
  const { api, byId } = await setup();
  let checked = 0;
  for (const side of ['right', 'left']) {
    const vein = byId.get(`vm:anatomy:body:foot:${side}:vessel:dorsal-venous-arch-of-${side}-foot`);
    assert.ok(vein);
    assert.equal(api.footArterialProjectionXrayLesson(vein, 'xray'), undefined);
    checked++;
    for (const suffix of ['deep-plantar-artery', 'superficial-medial-plantar-artery']) {
      const branch = byId.get(`vm:anatomy:body:foot:${side}:vessel:${side}-${suffix}`);
      assert.ok(branch);
      assert.equal(api.footArterialProjectionXrayLesson(branch, 'ultrasound'), undefined);
      checked++;
    }
  }
  assert.equal(checked, 6);
});

test('source identity and topic changes are refused; returned arrays are fresh', async () => {
  const { api, pins } = await setup();
  for (const { identity } of pins.entries) {
    const fresh = api.footArterialProjectionXrayLesson(identity, 'xray');
    const baseline = structuredClone(fresh);
    fresh.bullets.push('foreign');
    fresh.citations.push('https://foreign.example');
    same(api.footArterialProjectionXrayLesson(identity, 'xray'), baseline);
    for (const tab of api.contentTabs.filter(tab => tab !== 'xray'))
      assert.equal(api.footArterialProjectionXrayLesson(identity, tab), undefined);
    for (const mutate of [
      value => { value.id += '-foreign'; },
      value => { value.name += ' foreign'; },
      value => { value.sources[0].sha256 = '0'.repeat(64); },
      value => { value.regions.push('head-neck'); },
      value => { value.center[0] += .001; },
    ]) {
      const altered = structuredClone(identity);
      mutate(altered);
      assert.equal(api.footArterialProjectionXrayLesson(altered, 'xray'), undefined);
    }
  }
});

test('forged worksheet and stale review revision are rejected before storage', async () => {
  const { api, prior, pins } = await setup();
  let storageCalls = 0;
  const fakeStorage = { prepare() { storageCalls++; throw Error('Rejected review reached storage'); } };
  for (const { identity } of pins.entries) {
    const worksheet = await api.bodyReviewMaterial(identity.id);
    const forged = structuredClone(worksheet);
    forged.topics.find(topic => topic.tab === 'xray').body += ' foreign';
    assert.equal(await api.parseBodyReviewResponse(forged, identity.id), null);
    const context = await api.bodyReviewContext(identity.id);
    const old = await prior.bodyReviewContext(identity.id);
    assert.equal(context.sourceHash, old.sourceHash);
    assert.notEqual(context.revisions.teaching, old.revisions.teaching);
    assert.equal(context.revisions.imaging, null);
    const packet = { catalogScope: context.catalogScope, structureId: identity.id,
      track: 'teaching', expectedVersion: 0, materialHash: old.materialHash,
      revisionHash: old.revisions.teaching, checklistVersion: context.checklistVersion,
      draft: api.blankBodyReview(context, 'teaching') };
    const response = await api.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
      method: 'POST', headers: { origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_FOOT_XRAY' }, body: JSON.stringify(packet),
    }), fakeStorage);
    assert.equal(response.status, 409);
  }
  assert.equal(storageCalls, 0);
});
