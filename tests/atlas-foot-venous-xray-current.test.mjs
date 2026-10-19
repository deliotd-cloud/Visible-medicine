import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { CURRENT_ATLAS_REVISION, currentAtlasDeliveryRoot, validateCurrentAtlasDelivery } from './current-atlas-delivery.mjs';

// Additive current-delivery test. Historical introduction and six-topic tests keep their own pins.
const root = process.cwd();
const source = CURRENT_ATLAS_REVISION;
const introduction = 'f5097af8493701d64a8e2a2b5797df380f3b348a';
const introductionTree = 'fba69dff6f83e7f092ccdab4c9a37f05c090c98b';
const parent = 'f5052a1906bf9b87e5235bda57d367b1103729db';
const modules = ['head-neck', 'shoulder', 'lower-limb', 'female-pelvis'];
const required = [
  'content/foot-venous-arch-xray-pins.json',
  'content/foot-venous-arch-xray.ts',
  'lib/foot-venous-arch-xray.ts',
];
const references = [
  'https://pubs.rsna.org/doi/abs/10.1148/radiographics.21.5.g01se281239',
  'https://pubmed.ncbi.nlm.nih.gov/3199035/',
];
const specs = [
  {
    id: 'vm:anatomy:body:foot:right:vessel:dorsal-venous-arch-of-right-foot',
    fmaId: 'FMA44881', side: 'right',
    files: [
      ['FJ2061', '2b349be398677b9dab660a07b4e038b35cb458883e350340ff53a2754aebcc41'],
      ['FJ2062', '4c16febe531c5d2afacf9bb47a899602239f2424ebd6e6d97860691bc9a2669b'],
    ],
  },
  {
    id: 'vm:anatomy:body:foot:left:vessel:dorsal-venous-arch-of-left-foot',
    fmaId: 'FMA44882', side: 'left',
    files: [
      ['FJ2059', '9421947a4511ed928078ee25870fefc51632c373fd3c8918bd9d53c3fc8dd5fb'],
      ['FJ2060', 'f882652c192b3c2e05405273755193989d5b1866dcba53b9c0653e7a1ee2b2f9'],
    ],
  },
];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = path => readFileSync(resolve(root, path));
const json = path => JSON.parse(read(path));
const same = (actual, expected, label) => assert.deepEqual(structuredClone(actual), structuredClone(expected), label);
const git = (atlas, ...args) => execFileSync('git', ['-C', atlas, ...args], {
  windowsHide: true, maxBuffer: 32e6, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});

let fixture;
async function setup() {
  if (fixture) return fixture;
  const delivery = validateCurrentAtlasDelivery();
  assert.equal(CURRENT_ATLAS_REVISION, source);
  assert.equal(delivery.source, source);
  const atlas = currentAtlasDeliveryRoot();
  assert.equal(git(atlas, 'rev-parse', `${source}^{commit}`).toString().trim(), source);
  assert.equal(git(atlas, 'rev-parse', `${parent}^{commit}`).toString().trim(), parent);
  assert.equal(git(atlas, 'rev-parse', `${introduction}^{tree}`).toString().trim(), introductionTree);
  const requireSite = createRequire(resolve(root, 'package.json'));
  const { build } = requireSite('esbuild');
  const compiled = await build({ stdin: { contents: [
    "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
    "export {decodeRegionalTeachingSnapshot} from './atlas-review/lib/regional-teaching-snapshot';",
    "export {footVenousArchXrayLesson} from './atlas-review/lib/foot-venous-arch-xray';",
    "export {footVenousArchXrayTopic,footVenousArchXrayNote} from './atlas-review/content/foot-venous-arch-xray';",
    "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  ].join('\n'), resolveDir: root, loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node' });
  const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const { exactSourceHistoryApi } = await import(pathToFileURL(resolve(atlas, 'scripts/exact-source-history-api.mjs')).href);
  const prior = await exactSourceHistoryApi(parent, 'display');
  const pins = json('atlas-review/content/foot-venous-arch-xray-pins.json');
  const catalog = api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  const oldCatalog = prior.bodyDisplayCatalog(JSON.parse(git(atlas, 'show', `${parent}:public/models/bodyparts3d/full-body/catalog.json`)));
  fixture = { delivery, atlas, api, prior, pins, catalog,
    byId: new Map(catalog.structures.map(row => [row.id, row])),
    oldById: new Map(oldCatalog.structures.map(row => [row.id, row])) };
  return fixture;
}

test('the closed current delivery and all four runtime manifests bind the same source', async () => {
  const { delivery, atlas } = await setup();
  const review = json('atlas-review/manifest.json');
  assert.equal(review.revision, source);
  assert.equal(review.files.length, delivery.reviewSourceFiles);
  for (const path of required) {
    const row = review.files.find(item => item.path === path);
    assert.ok(row, `Review includes ${path}`);
    assert.equal(row.sourceSha256, sha(git(atlas, 'show', `${source}:${path}`)), path);
    assert.equal(row.importedSha256, row.sourceSha256, path);
    assert.equal(sha(read(`atlas-review/${path}`)), row.sourceSha256, path);
  }
  const inventory = json('lib/atlas-model-inventory.json');
  for (const name of modules) {
    const base = `public/atlas-runtime/${name}/`;
    const manifest = json(base + 'manifest.json');
    assert.equal(manifest.sourceCommit, source, name);
    assert.equal(manifest.patientDataIncluded, false, name);
    for (const flag of ['clinicalApproved', 'standaloneReviewConnection', 'imagingConnection'])
      assert.ok(manifest[flag] === false || manifest[flag] === undefined, `${name}: ${flag}`);
    const item = inventory.sources.find(row => row.module === name);
    assert.equal(item.sourceCommit, source);
    assert.equal(item.manifestSha256, sha(read(base + 'manifest.json')));
    const inputs = json(base + 'source-inputs.json');
    for (const path of required) {
      const row = inputs.find(input => input.path === path);
      if (name === 'head-neck' || name === 'shoulder')
        assert.equal(row?.sha256, sha(git(atlas, 'show', `${source}:${path}`)), `${name}: ${path}`);
      else assert.equal(row, undefined, `${name}: unrelated source input ${path}`);
    }
  }
});

test('the two exact archived identities and licensed bundle remain unchanged', async () => {
  const { atlas, pins, catalog, byId, oldById } = await setup();
  assert.equal(pins.parentCommit, parent);
  assert.equal(pins.sourceVersion, '4.0');
  assert.equal(pins.license, 'CC-BY-4.0');
  assert.equal(pins.entries.length, 2);
  same(pins.entries.map(row => row.identity.id), specs.map(spec => spec.id));
  same(pins.coordinateSystem, catalog.coordinateSystem);
  assert.equal(pins.bundles.length, 1);
  assert.equal(pins.bundles[0].id, 'foot-vessels-foot-vascular');
  same(pins.bundles, catalog.bundles.filter(bundle => bundle.id === 'foot-vessels-foot-vascular'));
  for (const [index, { identity, topics, previous }] of pins.entries.entries()) {
    const spec = specs[index];
    same([identity.id, identity.fmaId, identity.laterality, identity.bundle],
      [spec.id, spec.fmaId, spec.side, 'foot-vessels-foot-vascular']);
    same(identity.sources.map(row => [row.file, row.sha256]), spec.files);
    same(identity, oldById.get(spec.id), `${spec.fmaId}: original source identity`);
    same(identity, byId.get(spec.id), `${spec.fmaId}: imported source identity`);
    same(topics, ['xray']);
    assert.equal(identity.validation.status, 'unvalidated');
    assert.equal(identity.validation.anatomicalReview, false);
    assert.equal(previous.xray.readiness, 'pending');
  }
  const bundle = pins.bundles[0];
  const sourcePath = `public${bundle.url.split('?')[0]}`;
  const bytes = read(`public/atlas-runtime/head-neck/${sourcePath.slice('public/'.length)}`);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(sha(bytes), bundle.sha256);
  same(bytes, git(atlas, 'show', `${parent}:${sourcePath}`), 'Unchanged licensed bundle');
});

test('imported resolver, generated foot reader and Review worksheet agree on the X-ray draft', async () => {
  const { api, pins, prior } = await setup();
  const foot = api.decodeRegionalTeachingSnapshot(json('atlas-review/content/regional-teaching/foot.json'), 'foot');
  const topic = api.footVenousArchXrayTopic;
  same(topic.citations, references);
  assert.match(topic.body, /plain radiograph/i);
  assert.match(topic.body, /contrast venogram/i);
  assert.match(api.footVenousArchXrayNote, /not validated scan registration/i);
  for (const { identity, previous } of pins.entries) {
    const id = identity.id;
    same(previous.xray, prior.bodyLesson(identity, 'xray'), `${id}: original pending lesson`);
    for (const tab of ['ct', 'mri', 'ultrasound'])
      same(api.bodyLesson(identity, tab), prior.bodyLesson(identity, tab), `${id}: unchanged ${tab}`);
    const lesson = api.bodyLesson(identity, 'xray');
    same(lesson, api.footVenousArchXrayLesson(identity, 'xray'));
    same(lesson, foot.bodyLesson(identity, 'xray'), `${id}: generated foot reader`);
    assert.ok(foot.accepts(identity));
    assert.equal(lesson.readiness, 'draft');
    assert.equal(lesson.title, `${identity.name} · X-ray venous orientation · draft`);
    assert.equal(lesson.body, topic.body);
    same(lesson.bullets, topic.bullets);
    same(lesson.citations, references);
    assert.equal(lesson.note, api.footVenousArchXrayNote);
    assert.match(lesson.note, /review pending/i);
    const { readiness, ...section } = lesson;
    same(api.bodyContent(identity, 'xray'), section);
    const worksheet = await api.bodyReviewMaterial(id);
    assert.equal(worksheet.approval, false);
    same(worksheet.source.structure, identity);
    same(worksheet.topics.find(row => row.tab === 'xray'), { tab: 'xray', ...lesson });
    assert.ok(await api.parseBodyReviewResponse(worksheet, id));
    const altered = structuredClone(worksheet);
    altered.topics.find(row => row.tab === 'xray').body += ' foreign';
    assert.equal(await api.parseBodyReviewResponse(altered, id), null);
  }
});

test('source-aware helper refuses other identities, changed source leaves and non-X-ray topics', async () => {
  const { api, pins, byId } = await setup();
  for (const { identity } of pins.entries) {
    for (const tab of ['ct', 'mri', 'ultrasound', 'anatomy', 'function', 'pathology', 'clinical', 'quiz'])
      assert.equal(api.footVenousArchXrayLesson(identity, tab), undefined);
    for (const change of [
      value => { value.id += '-foreign'; },
      value => { value.fmaId = 'FMA0'; },
      value => { value.laterality = value.laterality === 'right' ? 'left' : 'right'; },
      value => { value.sources[0].sha256 = '0'.repeat(64); },
      value => { value.regions.push('head-neck'); },
      value => { value.center[0] += .001; },
      value => { value.sources.push(structuredClone(value.sources[0])); },
      value => { value.sources.reverse(); },
      value => { value.bundle += '-foreign'; },
    ]) {
      const altered = structuredClone(identity);
      change(altered);
      assert.equal(api.footVenousArchXrayLesson(altered, 'xray'), undefined);
    }
    const fresh = api.footVenousArchXrayLesson(identity, 'xray');
    const saved = structuredClone(fresh);
    fresh.bullets.push('foreign');
    fresh.citations.push('https://foreign.invalid');
    same(api.footVenousArchXrayLesson(identity, 'xray'), saved);
  }
  const other = byId.get('vm:anatomy:body:foot:right:vessel:right-plantar-arch');
  assert.ok(other);
  assert.equal(api.footVenousArchXrayLesson(other, 'xray'), undefined);
  for (const structure of byId.values())
    if (!specs.some(spec => spec.id === structure.id))
      assert.equal(api.footVenousArchXrayLesson(structure, 'xray'), undefined);
});
