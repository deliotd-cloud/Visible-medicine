import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { CURRENT_ATLAS_REVISION, currentAtlasDeliveryRoot, validateCurrentAtlasDelivery } from './current-atlas-delivery.mjs';

// Run with `node --test <this file>` from the imported candidate or canonical site.
// The coordinator supplies this exact committed identity after completing Atlas.
const root = process.cwd();
const currentPin = validateCurrentAtlasDelivery();
const source = { source: CURRENT_ATLAS_REVISION, sourceTree: currentPin.sourceTree,
  baseline: '8d32653eaac8b86521618c824214dd6af8e35e29' };
const priorSource = 'f1dc0ccc54ec82aa774720db3c822d3e0ea9c418';
assert.match(source.source, /^[a-f0-9]{40}$/);
assert.match(source.sourceTree, /^[a-f0-9]{40}$/);
assert.equal(source.baseline, '8d32653eaac8b86521618c824214dd6af8e35e29');
assert.equal(source.source, '589263554141ba94548f9073327d4e51674bc33b');
assert.equal(source.sourceTree, 'ba724f0a46448132a6e5fc4c24f63730b53540f9');
const atlas = currentAtlasDeliveryRoot();
const requireSite = createRequire(resolve(root, 'package.json'));
const { build } = requireSite('esbuild');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(readFileSync(new URL('./fixtures/atlas-hand-vessel-xray-f1dc0ccc.txt', import.meta.url))),
  'c8efd4f95be60c8bf9ecb2c411318636d40bea0aa486f217ab54ad68ac9ab88a',
  'Frozen f1 hand integration proof');
const json = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const same = (a, b, label) => assert.deepEqual(structuredClone(a), structuredClone(b), label);
const git = (...args) => execFileSync('git', ['-C', atlas, ...args], {
  windowsHide: true, maxBuffer: 256e6, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});
assert.equal(realpathSync(atlas), realpathSync(git('rev-parse', '--show-toplevel').toString().trim()));
assert.equal(git('rev-parse', `${source.source}^{commit}`).toString().trim(), source.source);
assert.equal(git('rev-parse', `${source.source}^{tree}`).toString().trim(), source.sourceTree);
assert.equal(git('rev-parse', 'HEAD').toString().trim(), source.source, 'Atlas checkout differs from stage pin');

function tree(commit) {
  const entries = new Map();
  for (const line of git('ls-tree', '-r', '-z', '--full-tree', commit).toString().split('\0')) {
    if (!line) continue;
    const match = /^(100644|100755) blob ([a-f0-9]{40})\t([\s\S]+)$/.exec(line);
    if (match) entries.set(match[3], match[2]);
  }
  return entries;
}
const currentTree = tree(source.source);
const priorTree = tree(source.baseline);
const review = json('atlas-review/manifest.json');
const regions = ['head-neck', 'shoulder', 'lower-limb', 'female-pelvis'];
const wanted = new Set(review.files.map(row => row.path));
for (const region of regions) for (const row of json(`public/atlas-runtime/${region}/source-inputs.json`)) wanted.add(row.path);
const objectCache = new Map();
const treeByCommit = new Map([[source.source, currentTree], [source.baseline, priorTree]]);
function batch(commit, paths) {
  const ids = [...new Set(paths.map(path => {
    const id = treeByCommit.get(commit).get(path);
    assert.ok(id, `${commit} lacks ${path}`);
    return id;
  }))];
  const bytes = execFileSync('git', ['-C', atlas, 'cat-file', '--batch'], {
    input: ids.join('\n') + '\n', windowsHide: true, maxBuffer: 256e6,
    env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
  });
  let offset = 0;
  for (const id of ids) {
    const end = bytes.indexOf(10, offset);
    assert.ok(end > offset);
    const header = /^([a-f0-9]{40}) blob ([0-9]+)$/.exec(bytes.subarray(offset, end).toString());
    assert.ok(header && header[1] === id);
    const length = Number(header[2]);
    assert.ok(Number.isSafeInteger(length) && length >= 0 && length <= 32e6);
    const finish = end + 1 + length;
    assert.ok(finish < bytes.length && bytes[finish] === 10);
    objectCache.set(`${commit}:${id}`, bytes.subarray(end + 1, finish));
    offset = finish + 1;
  }
  assert.equal(offset, bytes.length);
}
function blob(commit, path) {
  const id = treeByCommit.get(commit).get(path);
  assert.ok(id, `${commit} lacks ${path}`);
  const bytes = objectCache.get(`${commit}:${id}`);
  assert.ok(bytes, `${commit} object not batched: ${path}`);
  return bytes;
}
batch(source.source, [...wanted]);

const apiEntry = [
  "export {bodyLesson,bodyContent} from './app/body-content';",
  "export {bodyDisplayCatalog} from './lib/body-display-catalog';",
  "export {contentTabs} from './lib/content-types';",
  "export {decodeRegionalTeachingSnapshot} from './lib/regional-teaching-snapshot';",
  "export {handVesselXrayLesson} from './lib/hand-vessel-xray';",
  "export * from './content/hand-vessel-xray';",
  "export {intracranialArterialUsLesson} from './lib/intracranial-arterial-us';",
  "export {bodyReviewMaterial} from './lib/body-review-material';",
  "export {bodyReviewContext} from './lib/body-review-context';",
  "export {parseBodyReviewResponse} from './lib/body-review-response';",
].join('');
async function importedApi() {
  const built = await build({ stdin: { contents: apiEntry.replaceAll("'./", "'./atlas-review/"), resolveDir: root, loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external' });
  const module = { exports: {} };
  runInNewContext(built.outputFiles[0].text, { module, exports: module.exports, require: requireSite,
    crypto, TextEncoder, TextDecoder, Request, Response, URL, URLSearchParams, structuredClone });
  return module.exports;
}

test('hand vessel X-ray source, Review, four runtime manifests and emitted teaching remain exact', async () => {
  assert.equal(review.revision, source.source);
  assert.equal(new Set(review.files.map(row => row.path)).size, review.files.length);
  const required = ['app/body-content.ts', 'lib/hand-vessel-xray.ts', 'content/hand-vessel-xray.ts',
    'content/hand-vessel-xray-pins.json', 'content/regional-teaching/hand.json'];
  for (const path of required) assert.ok(review.files.some(row => row.path === path), `Review includes ${path}`);
  for (const row of review.files) {
    assert.equal(row.sourceSha256, sha(blob(source.source, row.path)), `Review source ${row.path}`);
    assert.equal(row.importedSha256, sha(readFileSync(resolve(root, 'atlas-review', row.path))), `Review import ${row.path}`);
  }
  for (const region of regions) {
    const base = `public/atlas-runtime/${region}/`;
    const manifest = json(base + 'manifest.json');
    assert.equal(manifest.sourceCommit, source.source, `${region} source`);
    assert.equal(new Set(manifest.files.map(row => row.path)).size, manifest.files.length);
    for (const row of manifest.files) {
      const bytes = readFileSync(resolve(root, base, row.path));
      assert.equal(bytes.length, row.bytes, `${region}/${row.path} length`);
      assert.equal(sha(bytes), row.sha256, `${region}/${row.path} digest`);
    }
    const inputs = json(base + 'source-inputs.json');
    for (const input of inputs) {
      const working = readFileSync(resolve(atlas, input.path));
      const committed = blob(source.source, input.path);
      if (!working.equals(committed)) {
        assert.ok(!working.includes(0) && !committed.includes(0));
        assert.ok(working.includes(Buffer.from('\r\n')));
        assert.ok(Buffer.from(working.toString('utf8').replaceAll('\r\n', '\n')).equals(committed));
      }
      assert.equal(input.sha256, sha(working), `${region} source input ${input.path}`);
    }
    if (region === 'head-neck') for (const path of required)
      assert.deepEqual(inputs.filter(row => row.path === path),
        [{ path, sha256: sha(readFileSync(resolve(atlas, path))) }], `head-neck source closure ${path}`);
    for (const flag of ['clinicalApproved', 'patientDataIncluded', 'standaloneReviewConnection', 'imagingConnection'])
      assert.ok(manifest[flag] === false || manifest[flag] === undefined, `${region} ${flag}`);
  }

  const pins = json('atlas-review/content/hand-vessel-xray-pins.json');
  assert.equal(pins.baseline, source.baseline);
  assert.equal(pins.entries.length, 36);
  assert.equal(new Set(pins.entries.map(row => row.identity.id)).size, 36);
  assert.equal(pins.entries.filter(row => row.identity.bundle === 'hand-vessels-hand-vascular').length, 22);
  assert.equal(pins.entries.filter(row => row.identity.bundle === 'hand-vessels-hand-venous').length, 14);
  const api = await importedApi();
  const old = await import(pathToFileURL(resolve(atlas, 'scripts/exact-source-history-api.mjs')).href)
    .then(module => module.exactSourceHistoryApi(source.baseline, 'review-security'));
  const prior = await import(pathToFileURL(resolve(atlas, 'scripts/exact-source-history-api.mjs')).href)
    .then(module => module.exactSourceHistoryApi(priorSource, 'review-security'));
  const catalog = api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
  batch(source.baseline, [catalogPath]);
  const oldCatalog = old.bodyDisplayCatalog(JSON.parse(blob(source.baseline, catalogPath)));
  same(catalog, oldCatalog, 'complete model catalog unchanged');
  assert.equal(catalog.structures.length, 1104);
  assert.equal(api.contentTabs.length, 9);
  assert.equal(Object.keys(api.handVesselXrayFacts).length, 19);
  const selected = new Map(pins.entries.map(row => [row.identity.id, row]));
  const usPins = json('atlas-review/content/intracranial-arterial-us-pins.json');
  assert.equal(usPins.baseline, priorSource);
  assert.equal(usPins.entries.length, 8);
  same(usPins.entries.map(row => row.identity.fmaId).sort(),
    ['FMA50029','FMA50030','FMA50082','FMA50085','FMA50086','FMA50169','FMA50584','FMA50585'],
    'Only eight exact-source intracranial ultrasound identities');
  const usSelected = new Map(usPins.entries.map(row => [row.identity.id, row]));
  assert.equal(usSelected.size, 8);
  const hand = api.decodeRegionalTeachingSnapshot(json('atlas-review/content/regional-teaching/hand.json'), 'hand');
  let changed = 0, preserved = 0, changedWorksheets = 0;
  let usChanges = 0, usWorksheets = 0, currentPreserved = 0;
  for (const structure of catalog.structures) {
    const oldWorksheet = await old.bodyReviewMaterial(structure.id);
    const priorWorksheet = await prior.bodyReviewMaterial(structure.id);
    const worksheet = await api.bodyReviewMaterial(structure.id);
    assert.equal(worksheet.approval, false, `${structure.id} has no carried approval`);
    for (const tab of api.contentTabs) {
      const before = old.bodyLesson(structure, tab);
      const after = api.bodyLesson(structure, tab);
      const priorTopic = oldWorksheet.topics.find(topic => topic.tab === tab);
      const topic = worksheet.topics.find(topic => topic.tab === tab);
      const f1Lesson = prior.bodyLesson(structure, tab);
      const f1Topic = priorWorksheet.topics.find(item => item.tab === tab);
      if (usSelected.has(structure.id) && tab === 'ultrasound') {
        const row = usSelected.get(structure.id);
        same(structure, row.identity, `${structure.id} exact ultrasound identity`);
        same(f1Lesson, row.previous, `${structure.id} f1 ultrasound predecessor`);
        same(before, row.previous, `${structure.id} 8d ultrasound predecessor`);
        assert.equal(after.readiness, 'draft');
        same(after, api.intracranialArterialUsLesson(structure, tab), `${structure.id} ultrasound resolver`);
        same(topic, { tab, ...after }, `${structure.id} ultrasound worksheet`);
        assert.notDeepEqual(topic, f1Topic);
        usChanges++;
      } else {
        same(after, f1Lesson, `${structure.id}/${tab} lesson unchanged since f1`);
        same(topic, f1Topic, `${structure.id}/${tab} worksheet unchanged since f1`);
        currentPreserved++;
      }
      if (selected.has(structure.id) && tab === 'xray') {
        const row = selected.get(structure.id);
        same(structure, row.identity, `${structure.id} complete source identity`);
        same(before, row.previous, `${structure.id} exact historical pending lesson`);
        assert.equal(before.readiness, 'pending');
        assert.equal(after.readiness, 'draft');
        same(after, api.handVesselXrayLesson(structure, tab), `${structure.id} resolver`);
        const fact = api.handVesselXrayFacts[row.family];
        assert.ok(fact, `${row.family} source fact`);
        same([after.body, ...after.bullets], [fact.body, ...fact.bullets,
          `Retained source: ${structure.fmaId} · ${structure.laterality} · ${structure.sources.length} recorded component${structure.sources.length === 1 ? '' : 's'}.`,
          `Source limit: ${structure.coverageNote}`,
          ...api.handVesselXrayLimitations], `${structure.id} original teaching`);
        same(after.citations, fact.references, `${structure.id} references`);
        assert.match(after.note, /revision-bound radiologist review/i);
        assert.match(after.note, /No acquired image, patient-space registration, clinical approval/i);
        assert.ok(hand.accepts(structure));
        same(hand.bodyLesson(structure, tab), after, `${structure.id} regional reader`);
        same(topic, { tab, ...after }, `${structure.id} Review worksheet`);
        assert.notDeepEqual(topic, priorTopic);
        changed++;
      } else if (usSelected.has(structure.id) && tab === 'ultrasound') {
        // The one independently enumerated current change was checked above.
      } else {
        same(after, before, `${structure.id}/${tab} lesson preserved`);
        same(topic, priorTopic, `${structure.id}/${tab} worksheet preserved`);
        preserved++;
      }
    }
    if (selected.has(structure.id)) changedWorksheets++;
    if (usSelected.has(structure.id)) {
      assert.equal(worksheet.fingerprints.source, priorWorksheet.fingerprints.source);
      assert.equal(worksheet.fingerprints.checklist, priorWorksheet.fingerprints.checklist);
      assert.notEqual(worksheet.fingerprints.teaching, priorWorksheet.fingerprints.teaching);
      usWorksheets++;
    } else same(worksheet, priorWorksheet, `${structure.id} complete worksheet unchanged since f1`);
  }
  assert.equal(changed, 36);
  assert.equal(usChanges, 8);
  assert.equal(currentPreserved, 9928);
  assert.equal(preserved, 9892);
  assert.equal(changedWorksheets, 36);
  assert.equal(usWorksheets, 8);

  const cervical = json('atlas-review/content/cervical-projection-xray-pins.json');
  assert.equal(cervical.entries.length, 6);
  for (const row of cervical.entries) {
    const structure = catalog.structures.find(item => item.id === row.identity.id);
    assert.ok(structure);
    same(api.bodyLesson(structure, 'xray'), old.bodyLesson(structure, 'xray'), `${structure.id} prior cervical lesson`);
  }
  const arterial = json('atlas-review/content/hand-arterial-ultrasound-pins.json');
  const priorHandArteries = arterial.entries.filter(row =>
    ['superficialArch', 'deepArch', 'princeps'].includes(row.group));
  assert.equal(priorHandArteries.length, 6);
  for (const row of priorHandArteries) {
    const structure = catalog.structures.find(item => item.id === row.identity.id);
    assert.ok(structure);
    same(api.bodyLesson(structure, 'xray'), old.bodyLesson(structure, 'xray'), `${structure.id} prior hand artery lesson`);
  }
  for (const row of pins.entries) {
    const worksheet = await api.bodyReviewMaterial(row.identity.id);
    assert.ok(await api.parseBodyReviewResponse(worksheet, row.identity.id));
    const tampered = structuredClone(worksheet);
    tampered.topics.find(topic => topic.tab === 'xray').body += ' altered';
    assert.equal(await api.parseBodyReviewResponse(tampered, row.identity.id), null, `${row.identity.id} tamper refused`);
    const context = await api.bodyReviewContext(row.identity.id);
    const prior = await old.bodyReviewContext(row.identity.id);
    assert.equal(context.sourceHash, prior.sourceHash);
    assert.notEqual(context.revisions.teaching, prior.revisions.teaching);
    assert.equal(context.revisions.imaging, null);
  }

  const { emittedTeaching } = await import(pathToFileURL(resolve(root, 'tests/atlas-emitted-teaching.ts')).href);
  const base = 'public/atlas-runtime/head-neck/';
  const emitted = emittedTeaching(base, json(base + 'manifest.json').files, true,
    path => readFileSync(resolve(root, path)));
  const contains = line => emitted.includes(line) || emitted.includes(JSON.stringify(line).slice(1, -1));
  for (const fact of Object.values(api.handVesselXrayFacts)) {
    for (const line of [fact.body, ...fact.bullets, ...fact.references])
      assert.ok(contains(line), `emitted fact/reference: ${line.slice(0, 50)}`);
  }
  for (const line of api.handVesselXrayLimitations) assert.ok(contains(line), 'emitted limitation');
  for (const row of pins.entries) assert.ok(emitted.includes(row.identity.id), `emitted ${row.identity.fmaId}`);
  assert.match(emitted, /revision-bound radiologist review/);

  const modelPaths = [...currentTree.keys()].filter(path => /^public\/models\/bodyparts3d\/full-body\/[^/]+\.glb$/.test(path));
  assert.equal(modelPaths.length, 86);
  for (const path of modelPaths) assert.equal(currentTree.get(path), priorTree.get(path), `${path} unchanged Git blob`);
  for (const bundle of pins.bundles) {
    const path = `public/models/bodyparts3d/full-body/${bundle.id}.glb`;
    batch(source.source, [path]);
    assert.equal(blob(source.source, path).length, bundle.bytes);
    assert.equal(sha(blob(source.source, path)), bundle.sha256);
    const copies = regions.filter(region => {
      const file = `public/atlas-runtime/${region}/models/bodyparts3d/full-body/${bundle.id}.glb`;
      return json(`public/atlas-runtime/${region}/manifest.json`).files.some(row => row.path === `models/bodyparts3d/full-body/${bundle.id}.glb`)
        && statSync(resolve(root, file)).size === bundle.bytes;
    });
    assert.ok(copies.length >= 1, `${bundle.id} exact model delivered`);
  }
  console.log(JSON.stringify({ source: source.source, sourceTree: source.sourceTree, changed,
    preserved, changedWorksheets, usChanges, usWorksheets, currentPreserved,
    families: 19, pins: 36, cervicalUnchanged: 6, handArterialUnchanged: 6,
    runtimes: regions.length, reviewFiles: review.files.length, modelBundlesUnchanged: 86,
    clinicalApproval: false, patientRegistration: false }));
});
