import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, relative, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';
import test from 'node:test';
import { emittedTeaching } from './atlas-emitted-teaching.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {assertCurrentCervicalSource} from './cervical-delivery-roles.mjs';

const revision = CURRENT_ATLAS_REVISION;
const featureRevision = '589263554141ba94548f9073327d4e51674bc33b';
const priorRevision = 'f1dc0ccc54ec82aa774720db3c822d3e0ea9c418';
const baseline = '408759d57644b05402e98a937e7cf6338b5509cf';
const handBaseline = '8d32653eaac8b86521618c824214dd6af8e35e29';
const sourceRepo = currentAtlasDeliveryRoot();
const runtimeEpochs = validateCurrentAtlasDelivery().runtimeSources;
const root = process.cwd();
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(readFileSync(new URL('./fixtures/atlas-cervical-projection-xray-8d32653e.txt',import.meta.url))),
  'd0663535db65aa702aac31e9c473c604bd2110b12ec5a5f43e0df884cf7f5392',
  'Frozen 8d cervical integration test');
assert.equal(sha(readFileSync(new URL('./fixtures/atlas-cervical-projection-xray-f1dc0ccc.txt',import.meta.url))),
  '6c4a30e015cf96dda06b910e3ed5f420c320cca1ffe8fcc8dd4bb1f57ea21d8b',
  'Frozen f1 cervical and hand integration test');
const json = path => JSON.parse(readFileSync(path, 'utf8'));
const same = (actual, expected, label) => assert.deepEqual(structuredClone(actual), structuredClone(expected), label);
const committed = new Map();
const git = (commit, path) => {
  const key = `${commit}:${path}`;
  if (!committed.has(key)) committed.set(key, execFileSync('git', ['-C', sourceRepo, 'show', key], {
    windowsHide: true, maxBuffer: 32e6, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
  }));
  return committed.get(key);
};
// Batch exact immutable Git objects once. Thousands of per-file Windows process
// launches add no source evidence; each returned object identity/type/length is
// still checked against the exact commit's regular-file tree before caching.
const wanted = new Set(json('atlas-review/manifest.json').files.map(row => row.path));
for (const region of ['head-neck','shoulder','lower-limb','female-pelvis'])
  for (const row of json(`public/atlas-runtime/${region}/source-inputs.json`)) wanted.add(row.path);
for (const commit of new Set([baseline,featureRevision,revision,priorRevision,handBaseline,
  ...Object.values(runtimeEpochs)])) {
  const tree = execFileSync('git', ['-C',sourceRepo,'ls-tree','-r','-z',commit], {
    windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},
  }).toString().split('\0').filter(Boolean).flatMap(row=>{
    const match=/^(?:100644|100755) blob ([a-f0-9]{40})\t([\s\S]+)$/.exec(row);
    return match&&wanted.has(match[2])?[[match[2],match[1]]]:[];
  });
  const ids=[...new Set(tree.map(([,id])=>id))];
  const batch=execFileSync('git',['-C',sourceRepo,'cat-file','--batch'],{
    input:ids.join('\n')+'\n',windowsHide:true,maxBuffer:256e6,
    env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},
  });
  let offset=0;const objects=new Map();
  for(const id of ids){
    const end=batch.indexOf(10,offset);assert.ok(end>offset);
    const header=/^([a-f0-9]{40}) blob ([0-9]+)$/.exec(batch.subarray(offset,end).toString());
    assert.ok(header);assert.equal(header[1],id);const length=Number(header[2]);
    assert.ok(Number.isSafeInteger(length)&&length>=0&&length<=32e6);
    const start=end+1,finish=start+length;assert.ok(finish<batch.length);assert.equal(batch[finish],10);
    objects.set(id,batch.subarray(start,finish));offset=finish+1;
  }
  assert.equal(offset,batch.length);
  for(const [path,id]of tree)committed.set(`${commit}:${path}`,objects.get(id));
}
// Runtime source inputs belong to each validated family's committed source epoch.
const committedDigest = (commit, path) => sha(git(commit, path));
function assertExactCheckoutBytes(path, working, committed) {
  assert.ok(working.equals(committed), `Current Atlas checkout differs from exact Git source: ${path}`);
}
function witnessLicenceCheckout() {
  const path = 'LICENSES/bodyparts3d-license-evidence.html';
  const committed = git(revision, path);
  const working = readFileSync(resolve(sourceRepo, path));
  assert.equal(sha(committed), '7a873d9c6ed62578a7ee5603d68d6a8fbf6e3ccc0b52db6a3ad8b952f8cf7271');
  assert.equal(committed.length, 14682);
  // An exact raw checkout is valid too. Only this one authenticated Windows
  // representation may differ; never normalize arbitrary licence/source bytes.
  if (!working.equals(committed)) {
    assert.equal(working.length, 14694);
    assert.equal(sha(working), '90dea95329aea5015ce339e430d9f342090617c82ee48613e15dd2240f08b746');
    assert.equal((working.toString('utf8').match(/\r\n/g) || []).length, 12);
    assert.ok(Buffer.from(working.toString('utf8').replaceAll('\r\n', '\n')).equals(committed),
      'Only the documented twelve checkout CRLF pairs differ from the exact committed licence');
  }
  return { path, sha256: sha(committed) };
}

const apiEntry = [
  "export {bodyLesson,bodyContent} from './app/body-content';",
  "export {bodyDisplayCatalog} from './lib/body-display-catalog';",
  "export {contentTabs} from './lib/content-types';",
  "export {decodeRegionalTeachingSnapshot} from './lib/regional-teaching-snapshot';",
  "export {cervicalProjectionXrayLesson} from './lib/cervical-projection-xray';",
  "export * from './content/cervical-projection-xray';",
  "export {handVesselXrayLesson} from './lib/hand-vessel-xray';",
  "export {bodyReviewMaterial} from './lib/body-review-material';",
  "export {bodyReviewContext} from './lib/body-review-context';",
  "export {parseBodyReviewResponse} from './lib/body-review-response';",
].join('');

async function sourceApi(commit) {
  let entry = apiEntry;
  if (commit === baseline) entry = entry
    .replace("export {cervicalProjectionXrayLesson} from './lib/cervical-projection-xray';", '')
    .replace("export * from './content/cervical-projection-xray';", '');
  if (commit !== featureRevision && commit !== revision && commit !== priorRevision) entry = entry
    .replace("export {handVesselXrayLesson} from './lib/hand-vessel-xray';", '');
  const files = new Set(execFileSync('git', ['-C', sourceRepo, 'ls-tree', '-r', '--name-only', commit], {
    encoding: 'utf8', windowsHide: true, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
  }).split(/\r?\n/));
  const built = await build({ stdin: { contents: entry, resolveDir: sourceRepo, loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external',
    plugins: [{ name: 'exact-atlas-history', setup(plugin) {
      plugin.onResolve({ filter: /.*/ }, args => {
        if (!args.path.startsWith('.') && !args.path.startsWith('@/')) return;
        const target = args.path.startsWith('@/')
          ? resolve(sourceRepo, args.path.slice(2)) : resolve(args.resolveDir, args.path);
        const path = relative(sourceRepo, target).replaceAll('\\', '/');
        assert.ok(!path.startsWith('..'), `historical import outside Atlas: ${path}`);
        for (const suffix of ['', '.ts', '.tsx', '.json', '/index.ts'])
          if (files.has(path + suffix))
            return { path: resolve(sourceRepo, path + suffix), namespace: 'exact-atlas-history' };
        throw Error(`Missing historical Atlas module: ${path}`);
      });
      plugin.onLoad({ filter: /.*/, namespace: 'exact-atlas-history' }, args => {
        const path = relative(sourceRepo, args.path).replaceAll('\\', '/');
        return { contents: git(commit, path).toString(),
          loader: ({ '.ts': 'ts', '.tsx': 'tsx', '.json': 'json' })[extname(path)] || 'js',
          resolveDir: dirname(args.path) };
      });
    } }] });
  return evaluate(built.outputFiles[0].text, sourceRepo);
}

function evaluate(code, directory) {
  const module = { exports: {} };
  runInNewContext(code, { module, exports: module.exports,
    require: createRequire(directory + '/package.json'), crypto, TextEncoder, TextDecoder,
    Request, Response, URL, URLSearchParams, structuredClone });
  return module.exports;
}

async function importedApi() {
  const entry = apiEntry.replaceAll("'./", "'./atlas-review/");
  const built = await build({ stdin: { contents: entry, resolveDir: root, loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external' });
  return evaluate(built.outputFiles[0].text, root);
}

test('six source-pinned cervical X-ray drafts reach learner, Review and four intact runtimes', async () => {
  assertCurrentCervicalSource();
  const paths = ['app/body-content.ts', 'lib/cervical-projection-xray.ts',
    'content/cervical-projection-xray.ts', 'content/cervical-projection-xray-pins.json'];
  const review = json('atlas-review/manifest.json');
  assert.equal(review.revision, revision);
  assert.equal(new Set(review.files.map(row => row.path)).size, review.files.length);
  for (const row of review.files) {
    assert.equal(row.sourceSha256, sha(git(revision, row.path)), `Review committed source ${row.path}`);
    assert.equal(row.importedSha256, sha(readFileSync(`atlas-review/${row.path}`)), `Review import ${row.path}`);
  }
  for (const path of paths) assert.ok(review.files.some(row => row.path === path), `Review includes ${path}`);

  const runtimes = ['head-neck', 'shoulder', 'lower-limb', 'female-pelvis'];
  const delivery = validateCurrentAtlasDelivery();
  assert.deepEqual(delivery.runtimeSources, runtimeEpochs);
  assert.equal(delivery.source, revision);
  assert.equal(revision, '727ed5b451ae940a01e56272c8fbc703ea3b0095', 'Exact current native source');
  assert.equal(delivery.reviewIntegration,
    'c535c60256f6f09d348369e7c24cfa4e04663406c392c4b245465138dc2d7a68',
    'Exact current protected Review integration');
  assert.deepEqual(delivery.runtimeSources, {
    'head-neck': revision,
    shoulder: revision,
    'lower-limb': revision,
    'female-pelvis': revision,
  }, 'Exact validated runtime source epochs');
  const mixedFamily = structuredClone(delivery);
  mixedFamily.runtimeSources.shoulder = '190a63238eadcf906abe89dcbb6a67c88afe70b9';
  assert.throws(() => validateCurrentAtlasDelivery({ pin: mixedFamily }),
    'Historical shoulder runtime cannot masquerade as current 727 delivery');
  const forgedReview = structuredClone(delivery);
  forgedReview.reviewIntegration = '0'.repeat(64);
  assert.throws(() => validateCurrentAtlasDelivery({ pin: forgedReview }),
    'Forged current Review integration refused');
  const licence = witnessLicenceCheckout();
  const checkedCheckout = new Set([licence.path]);
  for (const region of runtimes) {
    const base = `public/atlas-runtime/${region}/`;
    const manifest = json(base + 'manifest.json');
    const inputs = json(base + 'source-inputs.json');
    assert.equal(manifest.sourceCommit, delivery.runtimeSources[region], `${region} source commit`);
    assert.equal(new Set(manifest.files.map(row => row.path)).size, manifest.files.length, `${region} unique files`);
    for (const row of manifest.files) {
      const bytes = readFileSync(base + row.path);
      assert.equal(bytes.length, row.bytes, `${region}/${row.path} bytes`);
      assert.equal(sha(bytes), row.sha256, `${region}/${row.path} hash`);
    }
    for (const input of inputs) {
      if (!checkedCheckout.has(input.path)) {
        assertExactCheckoutBytes(input.path, readFileSync(resolve(sourceRepo, input.path)), git(revision, input.path));
        checkedCheckout.add(input.path);
      }
      assert.equal(input.sha256, committedDigest(manifest.sourceCommit, input.path),
        `${region} committed input ${input.path}`);
    }
    if (region === 'head-neck') {
      assert.deepEqual(inputs.filter(row => row.path === licence.path), [licence], 'Exact committed licence input');
      const emittedLicence = manifest.files.find(row => row.path === licence.path);
      assert.ok(emittedLicence, 'Learner ships the licence evidence');
      assert.equal(emittedLicence.sha256, licence.sha256, 'Emitted licence bytes equal the exact committed source');
      for (const path of paths) assert.deepEqual(inputs.filter(row => row.path === path),
        [{ path, sha256: committedDigest(revision, path) }], `${region} new input ${path}`);
    }
    for (const flag of ['clinicalApproved', 'patientDataIncluded', 'standaloneReviewConnection', 'imagingConnection'])
      assert.ok(manifest[flag] === false || manifest[flag] === undefined, `${region} ${flag}`);
  }

  const pins = json('atlas-review/content/cervical-projection-xray-pins.json');
  assert.equal(pins.baseline, baseline);
  assert.equal(pins.entries.length, 6);
  same(pins.entries.map(row => row.identity.fmaId).sort(),
    ['FMA46309', 'FMA46310', 'FMA46313', 'FMA46314', 'FMA46317', 'FMA46318'], 'six exact sources');
  same(Object.fromEntries(pins.entries.map(row => [row.identity.fmaId, row.family])), {
    FMA46309: 'longusCapitis', FMA46310: 'longusCapitis',
    FMA46313: 'rectusAnterior', FMA46314: 'rectusAnterior',
    FMA46317: 'rectusLateralis', FMA46318: 'rectusLateralis',
  }, 'three bilateral families');
  const api = await importedApi();
  const old = await sourceApi(baseline);
  const source = await sourceApi(featureRevision);
  const currentGit = await sourceApi(revision);
  const prior = await sourceApi(priorRevision);
  const catalog = api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  same(catalog, old.bodyDisplayCatalog(JSON.parse(git(baseline, 'public/models/bodyparts3d/full-body/catalog.json'))),
    'unchanged complete model catalog');
  same(catalog, currentGit.bodyDisplayCatalog(JSON.parse(git(revision, 'public/models/bodyparts3d/full-body/catalog.json'))),
    'current imported and exact Git catalogs');
  assert.equal(catalog.structures.length, 1104);
  assert.equal(api.contentTabs.length, 9);
  const selected = new Set(pins.entries.map(row => row.identity.id));
  assert.equal(selected.size, 6);
  const byId = new Map(pins.entries.map(row => [row.identity.id, row]));
  const spinalPins = json('atlas-review/content/spinal-muscle-xray-pins.json');
  assert.equal(spinalPins.baseline,'4e9f53851cdc55b89ca8bfc1b6d07e19445fc2ad');
  assert.equal(spinalPins.entries.length,56);
  const spinalById = new Map(spinalPins.entries.map(row=>[row.identity.id,row]));
  assert.equal(spinalById.size,56);
  const handPins = json('atlas-review/content/hand-vessel-xray-pins.json');
  assert.equal(handPins.baseline,handBaseline);
  assert.equal(handPins.entries.length,36);
  const handById = new Map(handPins.entries.map(row=>[row.identity.id,row]));
  assert.equal(handById.size,36);
  const priorHand = await sourceApi(handBaseline);
  const usPins = json('atlas-review/content/intracranial-arterial-us-pins.json');
  assert.equal(usPins.baseline, priorRevision);
  assert.equal(usPins.entries.length, 8);
  same(usPins.entries.map(row => row.identity.fmaId).sort(),
    ['FMA50029','FMA50030','FMA50082','FMA50085','FMA50086','FMA50169','FMA50584','FMA50585'], 'eight exact ultrasound identities');
  const usById = new Map(usPins.entries.map(row => [row.identity.id, row]));
  assert.equal(usById.size, 8);
  let currentCompared = 0;
  for (const structure of catalog.structures) for (const tab of api.contentTabs) {
    same(api.bodyLesson(structure, tab), currentGit.bodyLesson(structure, tab),
      `${structure.id}/${tab} current imported versus exact Git source`);
    currentCompared++;
  }
  assert.equal(currentCompared, 9936);
  let changed = 0, preserved = 0, supplemental = 0, handChanges = 0, usChanges = 0, currentPreserved = 0;
  for (const structure of catalog.structures) for (const tab of api.contentTabs) {
    const before = old.bodyLesson(structure, tab);
    const after = source.bodyLesson(structure, tab);
    if (usById.has(structure.id) && tab === 'ultrasound') {
      const row = usById.get(structure.id);
      same(structure, row.identity, `${structure.id} exact ultrasound source identity`);
      same(prior.bodyLesson(structure, tab), row.previous, `${structure.id} exact f1 predecessor`);
      same(before, row.previous, `${structure.id} exact old pending lesson`);
      assert.equal(after.readiness, 'draft');
      assert.notDeepEqual(after, row.previous);
      usChanges++;
    } else {
      same(after, prior.bodyLesson(structure, tab), `${structure.id}/${tab} unchanged since f1`);
      currentPreserved++;
    }
    if (selected.has(structure.id) && tab === 'xray') {
      same(before, byId.get(structure.id).previous, `${structure.id} exact pending baseline`);
      assert.equal(before.readiness, 'pending');
      assert.equal(after.readiness, 'draft');
      same(after, source.cervicalProjectionXrayLesson(structure, tab), 'learner dispatch');
      const { readiness, ...section } = after;
      same(source.bodyContent(structure, tab), section, 'learner section');
      changed++;
    } else if(spinalById.has(structure.id)&&tab==='xray'){
      same(structure,spinalById.get(structure.id).identity,'Exact later spinal source, not a broad exemption');
      same(before,spinalById.get(structure.id).previous,'Exact pending predecessor');
      assert.equal(before.readiness,'pending');assert.equal(after.readiness,'draft');supplemental++;
    } else if(handById.has(structure.id)&&tab==='xray'){
      const row=handById.get(structure.id);
      same(structure,row.identity,'Exact hand source, not a broad exemption');
      same(priorHand.bodyLesson(structure,tab),row.previous,'Exact 8d hand predecessor');
      same(before,row.previous,'Exact earlier pending predecessor');
      assert.equal(before.readiness,'pending');assert.equal(after.readiness,'draft');
      same(after,source.handVesselXrayLesson(structure,tab),'Exact hand resolver');
      handChanges++;
    } else if(usById.has(structure.id)&&tab==='ultrasound'){
      // The exact f1-to-589 ultrasound change was checked above.
    } else { same(after, before, `${structure.id}/${tab} preserved`); preserved++; }
  }
  assert.equal(changed, 6);
  assert.equal(supplemental,56);
  assert.equal(handChanges,36);
  assert.equal(usChanges,8);
  assert.equal(currentPreserved,9928);
  assert.equal(preserved, 9830);

  const spine = json('atlas-review/content/regional-teaching/spine.json');
  const decoder = api.decodeRegionalTeachingSnapshot(spine, 'spine');
  for (const row of pins.entries) {
    const structure = catalog.structures.find(item => item.id === row.identity.id);
    same(structure, row.identity, `${row.identity.fmaId} complete source record`);
    assert.equal(structure.sources.length, 1);
    assert.equal(structure.bundle, 'spine-muscles');
    assert.ok(decoder.accepts(structure), `${row.identity.fmaId} regional reader accepts source`);
    same(decoder.bodyLesson(structure, 'xray'), api.bodyLesson(structure, 'xray'), 'current regional snapshot lesson');
    const lesson = source.bodyLesson(structure, 'xray');
    assert.match(lesson.note, /revision-bound radiologist review pending/i);
    assert.match(lesson.note, /No acquired image, clinical approval, diagnosis/i);
    assert.match(lesson.note, /patient-space registration/i);
    assert.match(lesson.note, /Atlas, imaging-case and lecture access remain independent/i);
    const fact = source.cervicalProjectionXrayFacts[row.family];
    same([lesson.body, ...lesson.bullets], [fact.body, fact.distinction, fact.projection,
      ...source.cervicalProjectionXrayLimitations], 'source teaching lines');
    same(lesson.citations, source.cervicalProjectionXrayReferences, 'source citations');
    const worksheet = await source.bodyReviewMaterial(structure.id);
    assert.equal(worksheet.approval, false);
    same(worksheet.topics.find(topic => topic.tab === 'xray'), { tab: 'xray', ...lesson }, 'Review worksheet');
    assert.ok(await source.parseBodyReviewResponse(worksheet, structure.id));
    const prior = await old.bodyReviewContext(structure.id);
    const featureContext = await source.bodyReviewContext(structure.id);
    assert.equal(featureContext.sourceHash, prior.sourceHash, 'source identity unchanged');
    assert.notEqual(featureContext.revisions.teaching, prior.revisions.teaching, 'teaching revision changed');
    assert.equal(featureContext.revisions.imaging, null, 'no acquired-image approval');
  }
  const base = 'public/atlas-runtime/head-neck/';
  const emitted = emittedTeaching(base, json(base + 'manifest.json').files, true);
  const emittedFiles = json(base + 'manifest.json').files;
  assert.throws(() => emittedTeaching(base, emittedFiles, true, path =>
    path === base + 'index.html' ? Buffer.concat([readFileSync(path), Buffer.from('forged')]) : readFileSync(path)),
    'A changed emitted learner entry is refused before teaching admission');
  for (const fact of Object.values(source.cervicalProjectionXrayFacts))
    for (const line of Object.values(fact))
      assert.ok(emitted.includes(line) || emitted.includes(JSON.stringify(line).slice(1, -1)),
        `emitted original teaching line: ${line.slice(0, 40)}`);
  for (const line of source.cervicalProjectionXrayLimitations)
    assert.ok(emitted.includes(line) || emitted.includes(JSON.stringify(line).slice(1, -1)), 'emitted caution');
  for (const row of pins.entries) assert.ok(emitted.includes(row.identity.id), `emitted ${row.identity.fmaId}`);
  assert.match(emitted, /revision-bound radiologist review pending/);
  assert.match(emitted, /patient-space registration/);

  const sourceBundle = pins.bundles[0];
  const sourceModel = git(featureRevision, `public/models/bodyparts3d/full-body/${sourceBundle.id}.glb`);
  assert.equal(sourceModel.length, sourceBundle.bytes);
  assert.equal(sha(sourceModel), sourceBundle.sha256);
  let modelCopies = 0;
  for (const region of runtimes) {
    const base = `public/atlas-runtime/${region}/`;
    const model = `${base}models/bodyparts3d/full-body/${sourceBundle.id}.glb`;
    const manifest = json(base + 'manifest.json');
    const row = manifest.files.find(file => file.path === `models/bodyparts3d/full-body/${sourceBundle.id}.glb`);
    if (!row) continue;
    assert.equal(statSync(model).size, sourceBundle.bytes);
    assert.equal(row.sha256, sourceBundle.sha256, `${region} source model digest`);
    modelCopies++;
  }
  assert.ok(modelCopies >= 1, 'head-neck runtime ships the exact source muscle bundle');
  console.log(JSON.stringify({ revision, featureRevision, baseline, changed, preserved, supplemental,
    handChanges, usChanges, currentPreserved, currentCompared, sourcePins: 6,
    runtimes: runtimes.length, review: true, clinicalApproval: false, patientRegistration: false }));
});
