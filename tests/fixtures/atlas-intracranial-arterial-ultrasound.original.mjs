import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync, realpathSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import {CURRENT_ATLAS_REVISION, currentAtlasDeliveryRoot, validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

// Run from the candidate website checkout after the four normal exports and
// Review import have completed. All review requests below use synthetic data.
const root = process.cwd();
const source = '589263554141ba94548f9073327d4e51674bc33b';
const sourceTree = 'ba724f0a46448132a6e5fc4c24f63730b53540f9';
const baseline = 'f1dc0ccc54ec82aa774720db3c822d3e0ea9c418';
const pin = validateCurrentAtlasDelivery();
assert.equal(CURRENT_ATLAS_REVISION, source);
assert.equal(pin.source, source);
assert.equal(pin.sourceTree, sourceTree);
const atlas = currentAtlasDeliveryRoot();
const requireSite = createRequire(resolve(root, 'package.json'));
const {build} = requireSite('esbuild');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const same = (actual, expected, label) => assert.deepEqual(structuredClone(actual), structuredClone(expected), label);
const git = (...args) => execFileSync('git', ['-C', atlas, ...args], {
  windowsHide: true, maxBuffer: 256e6, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
});
assert.equal(realpathSync(atlas), realpathSync(git('rev-parse', '--show-toplevel').toString().trim()));
assert.equal(git('rev-parse', `${source}^{tree}`).toString().trim(), sourceTree);
assert.equal(git('rev-parse', 'HEAD').toString().trim(), source);
assert.equal(git('rev-parse', `${baseline}^{commit}`).toString().trim(), baseline);

// Independently enumerated from the archived display catalogue. The right MCA
// is the separate cranial-arteries entry; neither a left MCA nor P1/P2 is added.
const specs = [
  ['aca', 'FMA50029', 'Right anterior cerebral artery', 'right', ['FJ1654']],
  ['aca', 'FMA50030', 'Left anterior cerebral artery', 'left', ['FJ1654M']],
  ['acom', 'FMA50169', 'Anterior communicating artery', 'midline', ['FJ1655']],
  ['pca', 'FMA50584', 'Right posterior cerebral artery', 'right',
    ['FJ1661','FJ1675','FJ1677','FJ1678','FJ1680','FJ1687','FJ1691','FJ1720','FJ1727']],
  ['pca', 'FMA50585', 'Left posterior cerebral artery', 'left',
    ['FJ1661M','FJ1675M','FJ1677M','FJ1678M','FJ1680M','FJ1687M','FJ1691M','FJ1720M','FJ1727M']],
  ['pcom', 'FMA50085', 'Right posterior communicating artery', 'right', ['FJ1713']],
  ['pcom', 'FMA50086', 'Left posterior communicating artery', 'left', ['FJ1713M']],
  ['mca', 'FMA50082', 'Right middle cerebral artery', 'right', ['FJ1662','FJ1663','FJ1692']],
];
const expected = new Map(specs.map(([family, fma, name, side, files]) => [fma, {family, name, side, files}]));
assert.equal(expected.size, 8);
const regions = ['head-neck', 'shoulder', 'lower-limb', 'female-pelvis'];
const review = json('atlas-review/manifest.json');
const selectedPaths = ['app/body-content.ts', 'lib/intracranial-arterial-us.ts',
  'content/intracranial-arterial-us.ts', 'content/intracranial-arterial-us-pins.json',
  'content/regional-teaching/head-neck.json'];

function tree(commit) {
  const entries = new Map();
  for (const line of git('ls-tree', '-r', '-z', '--full-tree', commit).toString().split('\0')) {
    const match = /^(100644|100755) blob ([a-f0-9]{40})\t([\s\S]+)$/.exec(line);
    if (match) entries.set(match[3], match[2]);
  }
  return entries;
}
const currentTree = tree(source), priorTree = tree(baseline);
const objectCache = new Map();
function batch(paths) {
  const ids = [...new Set(paths.map(path => {
    const id = currentTree.get(path); assert.ok(id, `Source tree lacks ${path}`); return id;
  }))].filter(id => !objectCache.has(id));
  if (!ids.length) return;
  const bytes = execFileSync('git', ['-C', atlas, 'cat-file', '--batch'], {
    input: ids.join('\n') + '\n', windowsHide: true, maxBuffer: 256e6,
    env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
  });
  let offset = 0;
  for (const id of ids) {
    const end = bytes.indexOf(10, offset);
    const header = /^([a-f0-9]{40}) blob ([0-9]+)$/.exec(bytes.subarray(offset, end).toString());
    assert.ok(header && header[1] === id);
    const finish = end + 1 + Number(header[2]);
    assert.equal(bytes[finish], 10);
    objectCache.set(id, bytes.subarray(end + 1, finish));
    offset = finish + 1;
  }
  assert.equal(offset, bytes.length);
}
function sourceBlob(path) { const id = currentTree.get(path); assert.ok(objectCache.has(id), path); return objectCache.get(id); }

async function importedApi() {
  const exports = [
    "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
    "export {contentTabs} from './atlas-review/lib/content-types';",
    "export {decodeRegionalTeachingSnapshot} from './atlas-review/lib/regional-teaching-snapshot';",
    "export {intracranialArterialUsLesson} from './atlas-review/lib/intracranial-arterial-us';",
    "export * from './atlas-review/content/intracranial-arterial-us';",
    "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
    "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
    "export {blankBodyReview} from './atlas-review/lib/body-review-decisions';",
  ].join('');
  const compiled = await build({stdin: {contents: exports, resolveDir: root, loader: 'ts'},
    bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external'});
  const module = {exports: {}};
  runInNewContext(compiled.outputFiles[0].text, {module, exports: module.exports, require: requireSite,
    crypto, TextEncoder, TextDecoder, Request, Response, URL, URLSearchParams, structuredClone});
  return module.exports;
}

test('exact intracranial ultrasound delivery, lesson transition and Review refusal', async () => {
  assert.equal(review.revision, source);
  for (const path of selectedPaths) assert.ok(review.files.some(row => row.path === path), `Review includes ${path}`);
  assert.equal(new Set(review.files.map(row => row.path)).size, review.files.length);
  batch(review.files.map(row => row.path));
  for (const row of review.files) {
    assert.equal(row.sourceSha256, sha(sourceBlob(row.path)), `Review source ${row.path}`);
    assert.equal(row.importedSha256, sha(readFileSync(resolve(root, 'atlas-review', row.path))), `Review import ${row.path}`);
  }
  for (const region of regions) {
    const base = `public/atlas-runtime/${region}/`;
    const manifest = json(base + 'manifest.json');
    assert.equal(manifest.sourceCommit, source);
    assert.equal(new Set(manifest.files.map(row => row.path)).size, manifest.files.length);
    for (const row of manifest.files) {
      const bytes = readFileSync(resolve(root, base, row.path));
      assert.equal(bytes.length, row.bytes, `${region}/${row.path} bytes`);
      assert.equal(sha(bytes), row.sha256, `${region}/${row.path} digest`);
    }
    const inputs = json(base + 'source-inputs.json');
    batch(inputs.map(row => row.path));
    for (const row of inputs) {
      const working = readFileSync(resolve(atlas, row.path));
      const committed = sourceBlob(row.path);
      // Windows text checkout may have CRLF; the imported hash follows working bytes.
      assert.ok(working.equals(committed) ||
        Buffer.from(working.toString('utf8').replaceAll('\r\n', '\n')).equals(committed), row.path);
      assert.equal(row.sha256, sha(working), `${region} input ${row.path}`);
    }
    if (region === 'head-neck') for (const path of selectedPaths)
      same(inputs.filter(row => row.path === path),
        [{path, sha256: sha(readFileSync(resolve(atlas, path)))}], `head-neck source closure ${path}`);
    for (const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])
      assert.ok(manifest[flag] === false || manifest[flag] === undefined, `${region}/${flag}`);
  }

  const pins = json('atlas-review/content/intracranial-arterial-us-pins.json');
  assert.equal(pins.baseline, baseline);
  assert.equal(json('tests/fixtures/current-atlas-delivery-f1dc0ccc.json').source, baseline,
    'Archived delivery fixture retains the predecessor epoch');
  assert.equal(json('tests/fixtures/anatomy-coverage-f1dc0ccc.json').sourceRevision, baseline,
    'Archived coverage fixture retains the predecessor epoch');
  assert.equal(pins.entries.length, 8);
  same(new Set(pins.entries.map(row => row.identity.fmaId)), new Set(expected.keys()));
  assert.equal(new Set(pins.entries.map(row => row.identity.id)).size, 8);
  const api = await importedApi();
  const history = await import(pathToFileURL(resolve(atlas, 'scripts/exact-source-history-api.mjs')).href);
  const old = await history.exactSourceHistoryApi(baseline, 'review-security');
  const raw = json('atlas-review/public/models/bodyparts3d/full-body/catalog.json');
  const catalog = api.bodyDisplayCatalog(raw);
  const oldCatalog = old.bodyDisplayCatalog(JSON.parse(git('show', `${baseline}:public/models/bodyparts3d/full-body/catalog.json`)));
  same(catalog, oldCatalog, 'whole source display catalogue');
  assert.equal(catalog.structures.length, 1104);
  assert.equal(api.contentTabs.length, 9);
  assert.equal(catalog.structures.length * api.contentTabs.length, 9936);
  const selected = new Map(pins.entries.map(row => [row.identity.id, row]));
  assert.equal(selected.size, 8);
  same(pins.bundles, catalog.bundles.filter(bundle =>
    pins.entries.some(entry => entry.identity.bundle === bundle.id)), 'only two selected bundles');
  assert.equal(pins.bundles.length, 2);
  assert.equal(catalog.bundles.length, 109);
  for (const row of pins.entries) {
    const id = row.identity, spec = expected.get(id.fmaId);
    assert.ok(spec);
    assert.equal(row.family, spec.family);
    same([id.name,id.laterality,id.region,id.system,id.category,id.nodeName],
      [spec.name,spec.side,'head-neck','vessels','vessel',id.fmaId]);
    same(id.sources.map(part => part.file), spec.files);
    same(catalog.structures.filter(s => s.fmaId === id.fmaId), [id], `${id.fmaId} canonical identity`);
    assert.equal(id.validation.status, 'unvalidated');
    assert.equal(id.validation.anatomicalReview, false);
  }
  assert.equal(pins.entries.filter(row => row.family === 'pca').length, 2);
  assert.equal(pins.entries.filter(row => row.family === 'mca').length, 1);
  const head = api.decodeRegionalTeachingSnapshot(json('atlas-review/content/regional-teaching/head-neck.json'), 'head-neck');
  let changed = 0, preserved = 0, changedWorksheets = 0, preservedWorksheets = 0;
  const readiness = new Map();
  const request = packet => new Request('https://atlas.test/api/body-decisions', {
    method: 'POST', headers: {origin: 'https://atlas.test', 'content-type': 'application/json',
      'oai-authenticated-user-id': 'SYNTHETIC_INTRACRANIAL_US'}, body: JSON.stringify(packet),
  });
  let storageCalls = 0;
  const storage = {prepare() { storageCalls++; throw Error('Stale decision reached storage'); }};
  for (const structure of catalog.structures) {
    const row = selected.get(structure.id);
    for (const tab of api.contentTabs) {
      const before = old.bodyLesson(structure, tab), after = api.bodyLesson(structure, tab);
      readiness.set(after.readiness, (readiness.get(after.readiness) || 0) + 1);
      if (row && tab === 'ultrasound') {
        same(before, row.previous, `${structure.id} exact old lesson`);
        assert.equal(before.readiness, 'pending');
        assert.equal(after.readiness, 'draft');
        same(after, api.intracranialArterialUsLesson(structure, tab));
        const fact = api.intracranialArterialUsFacts[row.family];
        same(after.bullets, [...fact.bullets,
          `Retained source: ${structure.fmaId} · ${structure.laterality} · ${structure.sources.length} source file${structure.sources.length === 1 ? '' : 's'}.`,
          `Source limit: ${structure.coverageNote}`, ...api.intracranialArterialUsLimitations]);
        same([after.body, after.citations, after.note],
          [fact.body, fact.references, api.intracranialArterialUsNote]);
        same(head.bodyLesson(structure, tab), after, `${structure.id} regional reader`);
        assert.match(after.note, /revision.bound radiologist review/i);
        assert.match(after.note, /clinical approval is not supplied/i);
        assert.match(after.note, /Case, Atlas and lecture access remain independent/i);
        const prose = [after.title,after.body,...after.bullets,after.note].join(' ');
        assert.doesNotMatch(prose, /(?:model|mesh|source).{0,55}(?:shows|proves|confirms|measures).{0,35}(?:flow|patency|stenosis|velocity)/i);
        assert.doesNotMatch(prose, /(?:we supply|included|provided|attached).{0,35}(?:patient|acquired).{0,20}(?:ultrasound|Doppler|image|scan)/i);
        assert.doesNotMatch(prose, /(?:%|percent|cm\/s|mmHg).{0,30}(?:stenosis|velocity)|(?:stenosis|velocity).{0,30}(?:%|percent|cm\/s|mmHg)/i);
        if (row.family === 'pca') assert.match(prose, /nine retained source files.*not validated P1\/P2 assignments/i);
        if (row.family === 'mca') assert.match(prose, /three original PART-OF files.*six source components.*right/i);
        changed++;
      } else {
        same(after, before, `${structure.id}/${tab} unaffected`);
        assert.equal(api.intracranialArterialUsLesson(structure, tab), undefined);
        preserved++;
      }
    }
    const oldPacket = await old.bodyReviewMaterial(structure.id);
    const packet = await api.bodyReviewMaterial(structure.id);
    assert.equal(packet.approval, false);
    assert.equal(packet.status, 'worksheet-not-submitted');
    if (!row) {
      same(packet, oldPacket, `${structure.id} unaffected worksheet`);
      preservedWorksheets++;
      continue;
    }
    for (const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])
      same(packet[key], oldPacket[key], `${structure.id}/${key} preserved`);
    same(packet.topics.filter(topic => topic.tab !== 'ultrasound'),
      oldPacket.topics.filter(topic => topic.tab !== 'ultrasound'));
    same(packet.topics.find(topic => topic.tab === 'ultrasound'),
      {tab: 'ultrasound', ...api.intracranialArterialUsLesson(structure, 'ultrasound')});
    assert.equal(packet.fingerprints.source, oldPacket.fingerprints.source);
    assert.equal(packet.fingerprints.checklist, oldPacket.fingerprints.checklist);
    assert.notEqual(packet.fingerprints.teaching, oldPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, oldPacket.materialHash);
    same(await api.parseBodyReviewResponse(packet, structure.id), packet);
    assert.equal(await api.parseBodyReviewResponse(oldPacket, structure.id), null, 'old worksheet refused');
    for (const edit of [
      p => {p.topics.find(topic => topic.tab === 'ultrasound').body += ' foreign';},
      p => {p.topics.find(topic => topic.tab === 'ultrasound').citations = ['https://foreign.example'];},
      p => {p.topics.find(topic => topic.tab === 'ultrasound').readiness = 'approved';},
      p => {p.source.structure.sources = [];},
      p => {p.source.structure.validation.anatomicalReview = true;},
      p => {p.topics.splice(p.topics.findIndex(topic => topic.tab === 'ultrasound'), 1);},
    ]) {
      const forged = structuredClone(packet); edit(forged);
      assert.equal(await api.parseBodyReviewResponse(forged, structure.id), null, 'forged worksheet refused');
    }
    const previous = await old.bodyReviewContext(structure.id);
    const context = await api.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash, previous.sourceHash);
    // Geometry review also binds the normal renderer epoch. Unchanged meshes
    // must not silently migrate an approval across this regenerated renderer.
    const currentRenderer = json('atlas-review/content/body-renderer-revision.json');
    const oldRenderer = JSON.parse(git('show', `${baseline}:content/body-renderer-revision.json`));
    assert.equal(context.rendererHash, currentRenderer.sha256);
    assert.equal(previous.rendererHash, oldRenderer.sha256);
    assert.notEqual(context.rendererHash, previous.rendererHash);
    same(context.checklists.geometry, previous.checklists.geometry, 'geometry checks unchanged');
    for (const bound of [context, previous]) {
      assert.equal(bound.revisions.geometry, sha(JSON.stringify({
        catalogScope: bound.catalogScope, structureId: bound.structureId,
        checklistVersion: bound.checklistVersion, source: bound.sourceHash,
        renderer: bound.rendererHash, checks: bound.checklists.geometry,
      })), 'exact source/renderer/checklist-bound geometry revision');
    }
    assert.notEqual(context.revisions.geometry, previous.revisions.geometry);
    assert.equal(context.revisions.imaging, null);
    assert.notEqual(context.revisions.teaching, previous.revisions.teaching);
    const decision = {catalogScope: previous.catalogScope, structureId: structure.id,
      track: 'teaching', expectedVersion: 0, materialHash: previous.materialHash,
      revisionHash: previous.revisions.teaching, checklistVersion: previous.checklistVersion,
      draft: api.blankBodyReview(previous, 'teaching')};
    assert.equal((await api.postBodyDecision(request(decision), storage)).status, 409,
      `${structure.id} stale decision refused before storage`);
    changedWorksheets++;
  }
  same([changed,preserved,changedWorksheets,preservedWorksheets], [8,9928,8,1096]);
  same(Object.fromEntries(readiness), {draft: 9302, pending: 595, 'generated-identification': 39});
  assert.equal(storageCalls, 0);

  for (const row of pins.entries) {
    const forged = structuredClone(row.identity);
    forged.sources[0].sha256 = '0'.repeat(64);
    assert.equal(api.intracranialArterialUsLesson(forged, 'ultrasound'), undefined);
    const renamed = structuredClone(row.identity);
    renamed.name += ' foreign';
    assert.equal(api.intracranialArterialUsLesson(renamed, 'ultrasound'), undefined);
  }
  const {emittedTeaching} = await import(pathToFileURL(resolve(root, 'tests/atlas-emitted-teaching.ts')).href);
  const base = 'public/atlas-runtime/head-neck/';
  const emitted = emittedTeaching(base, json(base + 'manifest.json').files, true,
    path => readFileSync(resolve(root, path)));
  const contains = line => emitted.includes(line) || emitted.includes(JSON.stringify(line).slice(1, -1));
  for (const fact of Object.values(api.intracranialArterialUsFacts))
    for (const line of [fact.body, ...fact.bullets, ...fact.references])
      assert.ok(contains(line), `emitted teaching/citation: ${line.slice(0, 50)}`);
  for (const line of [...api.intracranialArterialUsLimitations, api.intracranialArterialUsNote])
    assert.ok(contains(line), `emitted limit: ${line.slice(0, 50)}`);
  for (const row of pins.entries) assert.ok(emitted.includes(row.identity.id), `emitted ${row.identity.fmaId}`);

  const sourceGlbs = [...currentTree.keys()].filter(path => /\.glb$/.test(path));
  assert.equal(sourceGlbs.length, 146);
  assert.equal(sourceGlbs.filter(path => path.startsWith('public/')).length, 140);
  assert.equal(sourceGlbs.filter(path => /^public\/models\/bodyparts3d\/full-body\/[^/]+\.glb$/.test(path)).length, 86);
  for (const path of sourceGlbs) assert.equal(currentTree.get(path), priorTree.get(path), `${path} unchanged`);
  const inventory = json('lib/atlas-model-inventory.json');
  assert.equal(inventory.models.length, 137);
  assert.equal(inventory.models.flatMap(model => model.paths).length, 144);
  console.log(JSON.stringify({source, sourceTree, changed, preserved, changedWorksheets,
    preservedWorksheets, readiness: Object.fromEntries(readiness), runtimes: regions.length,
    reviewFiles: review.files.length, sourceGlbsUnchanged: sourceGlbs.length,
    displayBundles: catalog.bundles.length, websiteModels: inventory.models.length,
    storageCalls, clinicalApproval: false}));
});
