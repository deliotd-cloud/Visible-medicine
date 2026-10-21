import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import {assertTonguePalateQuizTransition} from './tongue-palate-quiz-transition.mjs';
import {assertIleocolicUltrasoundTransition,ileocolicIdentity} from './ileocolic-ultrasound-transition.mjs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

// Run with `node --test <this file>` from the imported candidate or canonical site.
// The coordinator supplies this exact committed identity after completing Atlas.
const root = process.cwd();
const currentPin=validateCurrentAtlasDelivery();
const source = {source:CURRENT_ATLAS_REVISION,sourceTree:currentPin.sourceTree,
  baseline:'4e9f53851cdc55b89ca8bfc1b6d07e19445fc2ad'};
const priorSource='f1dc0ccc54ec82aa774720db3c822d3e0ea9c418';
const handBaseline='8d32653eaac8b86521618c824214dd6af8e35e29';
const ultrasoundEpoch='589263554141ba94548f9073327d4e51674bc33b';
const footEpoch='bc925194ce3b388d4b6d9f73b4b3362ed4f2ad5f';
const evidenceEpoch='0ac11ca2eb8effe47f2b6927f7987a9a36c7e3a2';
const pharyngealEpoch='3e66d2a7cb1807f792929cbe292a4cfc81e4e79e';
const ctParent='46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd';
const ctEpoch='2e67298f33a74ba4f45c868e10605ddd9b567af2';
const medianParent='3dcdf94a46db44202e72641be9fbcf1274ce5364';
const medianEpoch='c237fa215f061147975e91b01fa830b3f44458c7';
const deepPlantarParent='7b3e678ae4b8059aadb84459048ebd05f7abe7b9';
const deepPlantarEpoch='70260f13b1878272c6b0797dd72395ed10bc4f29';
const lacrimalParent=deepPlantarEpoch;
const lacrimalEpoch='c5a09df8939dfaeaf76119ba5507c552721c3a30';
const abdominalEusParent=lacrimalEpoch;
const abdominalEusEpoch='6ba0dd43c0512ce8d5b0dae7150ae605f176c2fb';
const superficialPlantarParent=abdominalEusEpoch;
const superficialPlantarEpoch='46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd';
const checkMriParent='509b01da5d72f33bd774e4a59d63e2406af1f2ff';
const checkMriEpoch='f5052a1906bf9b87e5235bda57d367b1103729db';
const archXrayParent=checkMriEpoch;
const archXrayEpoch='f5097af8493701d64a8e2a2b5797df380f3b348a';
const tonguePalateParent='a2475a37201bdd5fdd12f5849fc8ee043412d02f';
const tonguePalateEpoch='6036a7a59dcc1fd75eee4a23af34ca2a568d86b6';
const ileocolicParent='bd5465ee3b94c66c3d5701e7749099d07e8f40d3';
const ileocolicEpoch='aaa8a6a428e74a2055310630f9dfee8731fe0eee';
const corpusXrayParent='f5097af8493701d64a8e2a2b5797df380f3b348a';
const corpusXrayEpoch='fa52f00de861addac64eda5842a352f3e332d28f';
const thyroidMraParent='6036a7a59dcc1fd75eee4a23af34ca2a568d86b6';
const thyroidMraEpoch='87ed7e343260c7df48a40d53503f25bbfd34cfa5';
const corpusCtParent=thyroidMraEpoch;
const corpusCtEpoch='9296d0f940e25581162f8d8fe738a1aad40c72b8';
assert.match(source.source, /^[a-f0-9]{40}$/);
assert.match(source.sourceTree, /^[a-f0-9]{40}$/);
assert.equal(source.baseline, '4e9f53851cdc55b89ca8bfc1b6d07e19445fc2ad');
assert.equal(source.source, CURRENT_ATLAS_REVISION, 'exact current Atlas epoch');
const atlas = currentAtlasDeliveryRoot();
const requireSite = createRequire(resolve(root, 'package.json'));
const { build } = requireSite('esbuild');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(readFileSync(new URL('./fixtures/atlas-spinal-muscle-xray-8d32653e.txt',import.meta.url))),
  '1a73706634292dc168aa61a5b15a78032c58f8cbc284ca258c728aa2d025cff0',
  'Frozen 8d spinal integration test');
assert.equal(sha(readFileSync(new URL('./fixtures/atlas-spinal-muscle-xray-f1dc0ccc.txt',import.meta.url))),
  '72d101f8f136d677737e31721667c3d841c83886e3ba4bf6e6a3c53cda60bee3',
  'Frozen f1 spinal and hand integration test');
assert.equal(sha(readFileSync(new URL('./fixtures/atlas-spinal-muscle-xray-original.raw',import.meta.url))),
  'af693d2d1d351ef98ef763ea950fd7450a781ac69172648d908591fb7fa0bb13',
  'Whole original spinal integration contract retained');
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
for (const epoch of [ultrasoundEpoch,footEpoch,evidenceEpoch,pharyngealEpoch,
  ctParent,ctEpoch,medianParent,medianEpoch,deepPlantarParent,deepPlantarEpoch,
  lacrimalEpoch,abdominalEusEpoch,superficialPlantarEpoch,checkMriParent,
  checkMriEpoch,archXrayEpoch]) {
  assert.equal(git('rev-parse', `${epoch}^{commit}`).toString().trim(),epoch);
}
assert.equal(git('rev-parse',`${tonguePalateEpoch}^`).toString().trim(),tonguePalateParent,
  'tongue-palate quiz was introduced directly after a247');
assert.equal(git('rev-parse',`${tonguePalateEpoch}^{tree}`).toString().trim(),
  '6da62962106cfab9419b09618547a9da5e3aafc6','exact 6036 introduction tree');
assert.equal(git('rev-parse',`${tonguePalateParent}^{tree}`).toString().trim(),
  '97957a35788028b319df4f5d60c68a95e71320d7','exact a247 predecessor tree');
assert.equal(git('merge-base',tonguePalateEpoch,source.source).toString().trim(),
  tonguePalateEpoch,'quiz introduction precedes current delivery');
assert.equal(git('rev-parse',`${ileocolicEpoch}^`).toString().trim(),ileocolicParent,
  'ileocolic lesson has exact immediate parent');
assert.equal(git('rev-parse',`${ileocolicEpoch}^{tree}`).toString().trim(),
  '7c0b886d66d2adf64d6d29e44938f39d8cd61046','ileocolic introduction tree');
assert.equal(git('rev-parse',`${ileocolicParent}^{tree}`).toString().trim(),
  '44ca83bf391164c09f43f4169d25dcacf4b2559d','ileocolic predecessor tree');
assert.equal(git('merge-base',ileocolicEpoch,source.source).toString().trim(),
  ileocolicEpoch,'ileocolic introduction precedes current delivery');
assert.equal(git('rev-parse',`${ctEpoch}^`).toString().trim(),ctParent);
assert.equal(git('rev-parse',`${ctEpoch}^{tree}`).toString().trim(),
  '64776e3c967cbca29577b8db2bc01a129d31da3e');
assert.equal(git('rev-parse',`${medianEpoch}^`).toString().trim(),medianParent);
assert.equal(git('rev-parse',`${medianEpoch}^{tree}`).toString().trim(),
  '29fb723e34279d3e586f52f380128b430cd07325');
for(const [parent,epoch] of [[deepPlantarParent,deepPlantarEpoch],[lacrimalParent,lacrimalEpoch],
  [abdominalEusParent,abdominalEusEpoch],[superficialPlantarParent,superficialPlantarEpoch]])
  assert.equal(git('rev-parse',`${epoch}^`).toString().trim(),parent,
    `${epoch} genuine immediate introduction parent`);
for(const [epoch,expected] of [
  [deepPlantarEpoch,'ee3e9bfdf528c40bbd7049145e88cdf08e7c5076'],
  [lacrimalEpoch,'dbc2f38825775991ea4d9428a33ce9375699280a'],
  [abdominalEusEpoch,'4ce7882a2748d2f190e4b4f8783af6416c7cf44b'],
  [superficialPlantarEpoch,'83720d136f899876bd947323e6552c4d3e171210']])
  assert.equal(git('rev-parse',`${epoch}^{tree}`).toString().trim(),expected,
    `${epoch} exact introduction tree`);
for(const epoch of [ctEpoch,medianEpoch,deepPlantarEpoch,lacrimalEpoch,
  abdominalEusEpoch,superficialPlantarEpoch])
  assert.equal(git('merge-base',epoch,source.source).toString().trim(),epoch);
for(const [parent,epoch,expectedTree] of [
  [checkMriParent,checkMriEpoch,'36381d525f7c6886743bcec00fcee96931d65c58'],
  [archXrayParent,archXrayEpoch,'fba69dff6f83e7f092ccdab4c9a37f05c090c98b'],
  [corpusXrayParent,corpusXrayEpoch,'81346e47895a2fcd7dfc79852d81195abb8822a4'],
  [thyroidMraParent,thyroidMraEpoch,'bfcfa898ace1d25083f21b681274c5bc816564d7'],
  [corpusCtParent,corpusCtEpoch,'c948253b3a80788d8a06e7ff90f2114402d6e986']]){
  assert.equal(git('rev-parse',`${epoch}^`).toString().trim(),parent,
    `${epoch} genuine immediate predecessor`);
  assert.equal(git('rev-parse',`${epoch}^{tree}`).toString().trim(),expectedTree,
    `${epoch} exact committed tree`);
  assert.equal(git('merge-base',epoch,source.source).toString().trim(),epoch);
}
for (const [before,after] of [[priorSource,ultrasoundEpoch],[ultrasoundEpoch,footEpoch],
  [footEpoch,evidenceEpoch],[evidenceEpoch,pharyngealEpoch],[pharyngealEpoch,source.source]])
  assert.equal(git('merge-base',before,after).toString().trim(),before,`${before} precedes ${after}`);
const review = json('atlas-review/manifest.json');
const regions = ['head-neck', 'shoulder', 'lower-limb', 'female-pelvis'];
const wanted = new Set(review.files.map(row => row.path));
for (const region of regions) for (const row of json(`public/atlas-runtime/${region}/source-inputs.json`)) wanted.add(row.path);
const objectCache = new Map();
const treeByCommit = new Map([[source.source, currentTree], [source.baseline, priorTree],
  ...[ultrasoundEpoch,footEpoch,evidenceEpoch,pharyngealEpoch,
    ctParent,ctEpoch,medianParent,medianEpoch,deepPlantarParent,deepPlantarEpoch,
    lacrimalEpoch,abdominalEusEpoch,superficialPlantarEpoch,
    checkMriParent,checkMriEpoch,archXrayEpoch,corpusXrayEpoch,thyroidMraEpoch,corpusCtEpoch,tonguePalateEpoch,
    ileocolicParent,ileocolicEpoch]
    .map(epoch=>[epoch,tree(epoch)])]);
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
  "export {spinalMuscleXrayLesson} from './lib/spinal-muscle-xray';",
  "export * from './content/spinal-muscle-xray';",
  "export {handVesselXrayLesson} from './lib/hand-vessel-xray';",
  "export {intracranialArterialUsLesson} from './lib/intracranial-arterial-us';",
  "export {footArterialProjectionXrayLesson} from './lib/foot-arterial-projection-xray';",
  "export {arterialEvidenceLimitLesson} from './lib/arterial-evidence-limits';",
  "export {salpingopharyngeusMriLesson} from './lib/salpingopharyngeus-mri';",
  "export {craniofacialCalcificationCtLesson} from './lib/craniofacial-calcification-ct';",
  "export {medianAntebrachialXrayLesson} from './lib/median-antebrachial-xray';",
  "export {deepPlantarUltrasoundLesson} from './lib/deep-plantar-ultrasound';",
  "export {lacrimalDrainageUltrasoundLesson} from './lib/lacrimal-drainage-ultrasound';",
  "export {abdominalRadialEusLesson} from './lib/abdominal-radial-eus';",
  "export {superficialMedialPlantarUltrasoundLesson} from './lib/superficial-medial-plantar-ultrasound';",
  "export {orbitalSupportMriLesson} from './lib/orbital-support-mri';",
  "export {footVenousArchXrayLesson} from './lib/foot-venous-arch-xray';",
  "export {tonguePalateQuizLesson} from './lib/tongue-palate-quiz';",
  "export {ileocolicArteryUltrasoundLesson} from './lib/ileocolic-artery-ultrasound';",
  "export {corpusSpongiosumXrayLesson} from './lib/corpus-spongiosum-xray-v2';",
  "export {corpusImagingLesson} from './lib/corpus-imaging';",
  "export {bodyReviewMaterial} from './lib/body-review-material';",
  "export {bodyReviewContext} from './lib/body-review-context';",
  "export {parseBodyReviewResponse} from './lib/body-review-response';",
  "export {postBodyDecision} from './lib/body-review-api';",
  "export {blankBodyReview} from './lib/body-review-decisions';",
].join('');
async function importedApi() {
  const built = await build({ stdin: { contents: apiEntry.replaceAll("'./", "'./atlas-review/"), resolveDir: root, loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external' });
  const module = { exports: {} };
  runInNewContext(built.outputFiles[0].text, { module, exports: module.exports, require: requireSite,
    crypto, TextEncoder, TextDecoder, Request, Response, URL, URLSearchParams, structuredClone });
  return module.exports;
}

test('spinal X-ray source, Review, four runtime manifests and emitted teaching remain exact', async () => {
  assert.equal(review.revision, source.source);
  assert.equal(new Set(review.files.map(row => row.path)).size, review.files.length);
  const required = ['app/body-content.ts', 'lib/spinal-muscle-xray.ts', 'content/spinal-muscle-xray.ts',
    'content/spinal-muscle-xray-pins.json', 'content/regional-teaching/spine.json'];
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

  const pins = json('atlas-review/content/spinal-muscle-xray-pins.json');
  assert.equal(pins.baseline, source.baseline);
  assert.equal(pins.entries.length, 56);
  assert.equal(new Set(pins.entries.map(row => row.identity.id)).size, 56);
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
  assert.equal(Object.keys(api.spinalMuscleXrayFacts).length, 32);
  const selected = new Map(pins.entries.map(row => [row.identity.id, row]));
  const handPins=json('atlas-review/content/hand-vessel-xray-pins.json');
  assert.equal(handPins.baseline,handBaseline);
  assert.equal(handPins.entries.length,36);
  const handSelected=new Map(handPins.entries.map(row=>[row.identity.id,row]));
  assert.equal(handSelected.size,36);
  const oldHand=await import(pathToFileURL(resolve(atlas,'scripts/exact-source-history-api.mjs')).href)
    .then(module=>module.exactSourceHistoryApi(handBaseline,'review-security'));
  const usPins=json('atlas-review/content/intracranial-arterial-us-pins.json');
  assert.equal(usPins.baseline,priorSource);
  assert.equal(usPins.entries.length,8);
  same(usPins.entries.map(row=>row.identity.fmaId).sort(),
    ['FMA50029','FMA50030','FMA50082','FMA50085','FMA50086','FMA50169','FMA50584','FMA50585'],
    'exact eight ultrasound identities');
  const usSelected=new Map(usPins.entries.map(row=>[row.identity.id,row]));
  assert.equal(usSelected.size,8);
  const historical=await import(pathToFileURL(resolve(atlas,'scripts/exact-source-history-api.mjs')).href)
    .then(module=>module.exactSourceHistoryApi(ultrasoundEpoch,'review-security'));
  const footAtCommit=await import(pathToFileURL(resolve(atlas,'scripts/exact-source-history-api.mjs')).href)
    .then(module=>module.exactSourceHistoryApi(footEpoch,'review-security'));
  const evidenceAtCommit=await import(pathToFileURL(resolve(atlas,'scripts/exact-source-history-api.mjs')).href)
    .then(module=>module.exactSourceHistoryApi(evidenceEpoch,'review-security'));
  const pharyngealAtCommit=await import(pathToFileURL(resolve(atlas,'scripts/exact-source-history-api.mjs')).href)
    .then(module=>module.exactSourceHistoryApi(pharyngealEpoch,'review-security'));
  const ctBefore=await import(pathToFileURL(resolve(atlas,'scripts/exact-source-history-api.mjs')).href)
    .then(module=>module.exactSourceHistoryApi(ctParent,'review-security'));
  const ctAtCommit=await import(pathToFileURL(resolve(atlas,'scripts/exact-source-history-api.mjs')).href)
    .then(module=>module.exactSourceHistoryApi(ctEpoch,'review-security'));
  const medianBefore=await import(pathToFileURL(resolve(atlas,'scripts/exact-source-history-api.mjs')).href)
    .then(module=>module.exactSourceHistoryApi(medianParent,'review-security'));
  const medianAtCommit=await import(pathToFileURL(resolve(atlas,'scripts/exact-source-history-api.mjs')).href)
    .then(module=>module.exactSourceHistoryApi(medianEpoch,'review-security'));
  const sourceHistory=await import(pathToFileURL(resolve(atlas,'scripts/exact-source-history-api.mjs')).href);
  const checkMriBefore=await sourceHistory.exactSourceHistoryApi(checkMriParent,'review-security');
  const checkMriAtCommit=await sourceHistory.exactSourceHistoryApi(checkMriEpoch,'review-security');
  const archXrayBefore=await sourceHistory.exactSourceHistoryApi(archXrayParent,'review-security');
  const archXrayAtCommit=await sourceHistory.exactSourceHistoryApi(archXrayEpoch,'review-security');
  const tonguePalateBefore=await sourceHistory.exactSourceHistoryApi(tonguePalateParent,'review-security');
  const tonguePalateAtCommit=await sourceHistory.exactSourceHistoryApi(tonguePalateEpoch,'review-security');
  const ileocolicBefore=await sourceHistory.exactSourceHistoryApi(ileocolicParent,'review-security');
  const ileocolicAtCommit=await sourceHistory.exactSourceHistoryApi(ileocolicEpoch,'review-security');
  const corpusXrayBefore=archXrayAtCommit;
  const corpusXrayAtCommit=await sourceHistory.exactSourceHistoryApi(corpusXrayEpoch,'review-security');
  assert.equal(thyroidMraParent,tonguePalateEpoch,'Exact6036 MRA predecessor API reused');
  const thyroidMraBefore=tonguePalateAtCommit;
  const thyroidMraAtCommit=await sourceHistory.exactSourceHistoryApi(thyroidMraEpoch,'review-security');
  const corpusCtBefore=thyroidMraAtCommit;
  const corpusCtAtCommit=await sourceHistory.exactSourceHistoryApi(corpusCtEpoch,'review-security');
  const additionalUsEpochs=[
    {name:'deep-plantar-ultrasound',parent:deepPlantarParent,epoch:deepPlantarEpoch,
      count:2,resolver:api.deepPlantarUltrasoundLesson},
    {name:'lacrimal-drainage-ultrasound',parent:lacrimalParent,epoch:lacrimalEpoch,
      count:4,resolver:api.lacrimalDrainageUltrasoundLesson},
    {name:'abdominal-radial-eus',parent:abdominalEusParent,epoch:abdominalEusEpoch,
      count:4,resolver:api.abdominalRadialEusLesson},
    {name:'superficial-medial-plantar-ultrasound',parent:superficialPlantarParent,
      epoch:superficialPlantarEpoch,count:2,resolver:api.superficialMedialPlantarUltrasoundLesson},
  ];
  const exactPins=(path,epoch)=>{
    const imported=json(`atlas-review/${path}`);
    batch(epoch,[path]);batch(source.source,[path]);
    same(imported,JSON.parse(blob(epoch,path)),`${path} exact feature-commit pins`);
    same(imported,JSON.parse(blob(source.source,path)),`${path} exact current pins`);
    return imported;
  };
  const footPins=exactPins('content/foot-arterial-projection-xray-pins.json',footEpoch);
  assert.equal(footPins.parentCommit,ultrasoundEpoch);
  assert.equal(footPins.entries.length,12);
  const footSelected=new Map(footPins.entries.map(row=>[row.identity.id,row]));
  assert.equal(footSelected.size,12);
  const evidencePins=exactPins('content/arterial-evidence-limits-pins.json',evidenceEpoch);
  assert.equal(evidencePins.baseline,footEpoch);
  assert.equal(evidencePins.entries.length,4);
  const evidenceSelected=new Map(evidencePins.entries.map(row=>[row.identity.id,row]));
  assert.equal(evidenceSelected.size,4);
  const pharyngealPins=exactPins('content/pharyngeal-muscle-teaching-pins.json',pharyngealEpoch);
  const mriRows=pharyngealPins.entries.filter(row=>row.family==='salpingo');
  assert.equal(mriRows.length,2);
  const mriSelected=new Map(mriRows.map(row=>[row.identity.id,row]));
  assert.equal(mriSelected.size,2);
  const featureBytes=(epoch,paths)=>{
    batch(epoch,paths);batch(source.source,paths);
    for(const path of paths){
      same(blob(source.source,path),blob(epoch,path),`${path} exact introduced and current Git bytes`);
      const record=review.files.find(row=>row.path===path);
      assert.ok(record,`${path} imported into Review`);
      assert.equal(record.sourceSha256,sha(blob(epoch,path)),`${path} Review source hash`);
      const importedBytes=readFileSync(resolve(root,'atlas-review',path));
      same(importedBytes,blob(epoch,path),`${path} exact introduced Review bytes`);
      assert.equal(record.importedSha256,sha(importedBytes),`${path} Review imported hash`);
    }
  };
  featureBytes(ctEpoch,['content/craniofacial-calcification-ct-pins.json',
    'content/craniofacial-calcification-ct.ts','lib/craniofacial-calcification-ct.ts']);
  featureBytes(medianEpoch,['content/median-antebrachial-xray-pins.json',
    'content/median-antebrachial-xray.ts','lib/median-antebrachial-xray.ts']);
  const additionalUsSelected=new Map();
  for(const group of additionalUsEpochs){
    assert.equal(typeof group.resolver,'function',`${group.name} current resolver exported`);
    const pinsPath=`content/${group.name}-pins.json`;
    const paths=[`content/${group.name}.ts`,`lib/${group.name}.ts`,
      group.name==='abdominal-radial-eus'
        ?'content/abdominal-branch-imaging-pins.json':pinsPath];
    featureBytes(group.epoch,paths);
    let featurePins;
    if(group.name==='abdominal-radial-eus'){
      // Its dedicated admission pins are Atlas-only; the resolver imports the separate
      // abdominal-branch pins, which featureBytes checked against current Review.
      batch(group.epoch,[pinsPath]);batch(source.source,[pinsPath]);
      same(blob(source.source,pinsPath),blob(group.epoch,pinsPath),
        'EUS dedicated introduction pins retained in current Atlas Git');
      featurePins=JSON.parse(blob(group.epoch,pinsPath));
      assert.equal(review.files.some(row=>row.path===pinsPath),false,
        'EUS dedicated admission pins are not a Review import');
    }else featurePins=exactPins(pinsPath,group.epoch);
    assert.equal(featurePins.parentCommit,group.parent,`${group.name} true parent pin`);
    assert.equal(featurePins.entries.length,group.count,`${group.name} exact cardinality`);
    if(group.name!=='superficial-medial-plantar-ultrasound'){
      const transitionPath=`content/${group.name}-transition.json`;
      batch(group.epoch,[transitionPath]);batch(source.source,[transitionPath]);
      same(blob(source.source,transitionPath),blob(group.epoch,transitionPath),
        `${group.name} exact transition retained`);
      const transition=JSON.parse(blob(group.epoch,transitionPath));
      assert.equal(transition.parentCommit,group.parent);
      assert.equal(transition.pinsHash,sha(JSON.stringify(featurePins)));
      assert.equal(transition.changed,group.count);
      assert.equal(transition.preserved,9936-group.count);
      same(transition.entries.map(row=>row.id).sort(),
        featurePins.entries.map(row=>row.identity.id).sort(),
        `${group.name} transition names every selected cell`);
    }
    group.before=await sourceHistory.exactSourceHistoryApi(group.parent,'review-security');
    group.introduced=await sourceHistory.exactSourceHistoryApi(group.epoch,'review-security');
    group.rows=new Map(featurePins.entries.map(row=>[row.identity.id,row]));
    assert.equal(group.rows.size,group.count,`${group.name} unique complete source identities`);
    for(const row of featurePins.entries){
      assert.equal(row.previous.readiness,'pending',`${row.identity.id} pinned pending predecessor`);
      assert.equal(additionalUsSelected.has(row.identity.id),false,
        `${row.identity.id} belongs to one additional ultrasound introduction`);
      additionalUsSelected.set(row.identity.id,{group,row});
    }
  }
  assert.equal(additionalUsSelected.size,12,'four genuine epochs introduce twelve exact ultrasound cells');
  const ctPins=exactPins('content/craniofacial-calcification-ct-pins.json',ctEpoch);
  assert.equal(ctPins.entries.length,4);
  const ctSelected=new Map(ctPins.entries.map(row=>[row.identity.id,row]));
  assert.equal(ctSelected.size,4);
  const ctTransitionPath='content/craniofacial-calcification-ct.transition.json';
  batch(ctEpoch,[ctTransitionPath]);batch(source.source,[ctTransitionPath]);
  same(blob(source.source,ctTransitionPath),blob(ctEpoch,ctTransitionPath),
    'CT transition retains exact introduction bytes');
  const ctTransition=JSON.parse(blob(ctEpoch,ctTransitionPath));
  assert.equal(ctTransition.baseline,ctParent);
  assert.equal(ctTransition.pinsSha256,sha(blob(ctEpoch,'content/craniofacial-calcification-ct-pins.json')));
  assert.equal(ctTransition.changedPlacements,4);
  assert.equal(ctTransition.preservedPlacements,9932);
  assert.equal(ctTransition.geometryChanged,false);
  assert.equal(ctTransition.clinicalApproval,false);
  same(ctTransition.changes.map(row=>row.id),ctPins.entries.map(row=>row.identity.id),
    'four exact CT transition identities');
  const ctChangesById=new Map(ctTransition.changes.map(row=>[row.id,row]));
  const medianPins=exactPins('content/median-antebrachial-xray-pins.json',medianEpoch);
  assert.equal(medianPins.baselineCommit,medianParent);
  assert.equal(medianPins.entries.length,2);
  const medianSelected=new Map(medianPins.entries.map(row=>[row.identity.id,row]));
  assert.equal(medianSelected.size,2);
  batch(medianParent,[medianPins.sourcePath]);batch(medianEpoch,[medianPins.sourcePath]);
  same(blob(medianEpoch,medianPins.sourcePath),blob(medianParent,medianPins.sourcePath),
    'median source catalog retained at introduction');
  assert.equal(sha(blob(medianEpoch,medianPins.sourcePath)),medianPins.sourceSha256);
  const checkMriPins=exactPins('content/orbital-support-mri-pins.json',checkMriEpoch);
  const checkMriRows=checkMriPins.entries.filter(row=>
    row.family==='lateralCheck'||row.family==='medialCheck');
  assert.equal(checkMriRows.length,4,'two check-ligament MRI families, both sides');
  const checkMriSelected=new Map(checkMriRows.map(row=>[row.identity.id,row]));
  assert.equal(checkMriSelected.size,4,'four distinct check-ligament source identities');
  featureBytes(checkMriEpoch,['content/orbital-support-mri.ts','lib/orbital-support-mri.ts']);
  const archXrayPins=exactPins('content/foot-venous-arch-xray-pins.json',archXrayEpoch);
  assert.equal(archXrayPins.parentCommit,archXrayParent);
  assert.equal(archXrayPins.entries.length,2);
  const archXraySelected=new Map(archXrayPins.entries.map(row=>[row.identity.id,row]));
  assert.equal(archXraySelected.size,2,'two distinct dorsal-arch source identities');
  featureBytes(archXrayEpoch,['content/foot-venous-arch-xray.ts','lib/foot-venous-arch-xray.ts']);
  featureBytes(tonguePalateEpoch,['content/tongue-palate-quiz-pins.json',
    'content/tongue-palate-quiz.ts','lib/tongue-palate-quiz.ts']);
  featureBytes(ileocolicEpoch,['lib/ileocolic-artery-ultrasound.ts']);
  featureBytes(thyroidMraEpoch,['content/arterial-evidence-limits.ts','lib/arterial-evidence-limits.ts']);
  const thyroidMraRows=Array.from(evidenceSelected.values()).filter(row=>row.family==='inferiorThyroidMri');
  assert.equal(thyroidMraRows.length,2,'Only bilateral inferior thyroid MRI is revised within the four-cell evidence feature');
  same(thyroidMraRows.map(row=>[row.identity.laterality,row.identity.fmaId,row.tab]).sort(),
    [['left','FMA10680','mri'],['right','FMA10697','mri']],'Exact two MRA identities');
  featureBytes(corpusXrayEpoch,['content/corpus-spongiosum-xray-v2.ts',
    'lib/corpus-spongiosum-xray-v2.ts']);
  const corpusPinsPath='content/corpus-spongiosum-xray-v2.pins.json';
  const corpusTransitionPath='content/corpus-spongiosum-xray-v2.transition.json';
  batch(corpusXrayEpoch,[corpusPinsPath,corpusTransitionPath,'app/body-content.ts']);
  batch(source.source,[corpusPinsPath,corpusTransitionPath]);
  batch(corpusXrayParent,['app/body-content.ts']);
  same(blob(source.source,corpusPinsPath),blob(corpusXrayEpoch,corpusPinsPath),
    'corpus admission pins remain exact in current Git');
  same(blob(source.source,corpusTransitionPath),blob(corpusXrayEpoch,corpusTransitionPath),
    'corpus transition remains exact in current Git');
  const corpusPins=JSON.parse(blob(corpusXrayEpoch,corpusPinsPath));
  const corpusTransition=JSON.parse(blob(corpusXrayEpoch,corpusTransitionPath));
  assert.equal(corpusPins.parentCommit,corpusXrayParent);
  assert.equal(corpusPins.entries.length,1);
  assert.equal(corpusTransition.parentCommit,corpusXrayParent);
  assert.equal(corpusTransition.pinsHash,sha(JSON.stringify(corpusPins)));
  assert.equal(corpusTransition.totalPlacements,9936);
  assert.equal(corpusTransition.changed.length,1);
  assert.equal(corpusTransition.unchangedPlacements,9935);
  assert.equal(corpusTransition.clinicalApproval,false);
  assert.equal(corpusTransition.registration,false);
  const corpusRow=corpusPins.entries[0];
  const corpusId=corpusRow.identity.id;
  const corpusCtPinsPath='content/corpus-imaging-ct.pins.json';
  const corpusCtTransitionPath='content/corpus-imaging-ct.transition.json';
  batch(corpusCtEpoch,[corpusCtPinsPath,corpusCtTransitionPath]);
  batch(source.source,[corpusCtPinsPath,corpusCtTransitionPath]);
  same(blob(source.source,corpusCtPinsPath),blob(corpusCtEpoch,corpusCtPinsPath),
    'corpus CT source pins retain exact introduction bytes');
  same(blob(source.source,corpusCtTransitionPath),blob(corpusCtEpoch,corpusCtTransitionPath),
    'corpus CT transition retains exact introduction bytes');
  featureBytes(corpusCtEpoch,['content/corpus-imaging.ts','lib/corpus-imaging.ts']);
  const corpusCtPins=JSON.parse(blob(corpusCtEpoch,corpusCtPinsPath));
  const corpusCtTransition=JSON.parse(blob(corpusCtEpoch,corpusCtTransitionPath));
  assert.equal(corpusCtPins.parentCommit,corpusCtParent);
  assert.equal(corpusCtPins.parentTree,'bfcfa898ace1d25083f21b681274c5bc816564d7');
  assert.equal(corpusCtPins.entries.length,1);
  assert.equal(corpusCtTransition.parentCommit,corpusCtParent);
  assert.equal(corpusCtTransition.sourcePinsHash,sha(JSON.stringify(corpusCtPins)));
  assert.equal(corpusCtTransition.entries.length,1);
  const corpusCtRow=corpusCtPins.entries[0];
  same(corpusCtRow.identity,corpusRow.identity,'same complete corpus source identity');
  same(corpusCtRow.topics,['ct'],'one CT topic pinned');
  same(corpusCtTransition.entries.map(row=>[row.id,row.tab]),[[corpusId,'ct']],
    'single source-authored corpus CT cell');
  assert.equal(corpusCtTransition.entries[0].fmaId,corpusCtRow.identity.fmaId);
  same(corpusCtBefore.bodyLesson(corpusCtRow.identity,'ct'),corpusCtRow.previous.ct,
    'complete pinned corpus CT predecessor');
  assert.equal(corpusCtTransition.entries[0].previousHash,
    sha(JSON.stringify(corpusCtRow.previous.ct)));
  assert.equal(corpusCtTransition.entries[0].currentHash,
    sha(JSON.stringify(corpusCtTransition.entries[0].current)));
  assert.notEqual(corpusCtTransition.reviewBefore.teaching,corpusCtTransition.reviewAfter.teaching);
  assert.equal(corpusCtTransition.reviewBefore.source,corpusCtTransition.reviewAfter.source);
  assert.equal(corpusCtTransition.reviewBefore.checklist,corpusCtTransition.reviewAfter.checklist);
  same(corpusTransition.changed,[{id:corpusId,tab:'xray'}],
    'single source-authored corpus X-ray cell');
  same(corpusTransition.entries.map(row=>`${row.id}/${row.tab}`),[`${corpusId}/xray`]);
  same(corpusRow.previous.xray,corpusXrayBefore.bodyLesson(corpusRow.identity,'xray'),
    'complete pinned corpus predecessor');
  const corpusImport="import { corpusSpongiosumXrayLesson } from '../lib/corpus-spongiosum-xray-v2';\n";
  const corpusBranch='  const corpusSpongiosumXray = corpusSpongiosumXrayLesson(s, tab);\n  if (corpusSpongiosumXray) return corpusSpongiosumXray;\n';
  const corpusParentDispatch=blob(corpusXrayParent,'app/body-content.ts').toString().replaceAll('\r\n','\n');
  const corpusIntroducedDispatch=blob(corpusXrayEpoch,'app/body-content.ts').toString().replaceAll('\r\n','\n');
  assert.equal(corpusIntroducedDispatch.split(corpusImport).length,2);
  assert.equal(corpusIntroducedDispatch.split(corpusBranch).length,2);
  assert.equal(corpusIntroducedDispatch.replace(corpusImport,'').replace(corpusBranch,''),
    corpusParentDispatch,'complete prior corpus dispatch restored by exact inverse');
  const currentCorpusDispatch=blob(source.source,'app/body-content.ts').toString().replaceAll('\r\n','\n');
  assert.equal(currentCorpusDispatch.split(corpusImport).length,2);
  assert.equal(currentCorpusDispatch.split(corpusBranch).length,2);
  assert.equal(sha(blob(ileocolicEpoch,'lib/ileocolic-artery-ultrasound.ts')),
    sha(blob(source.source,'lib/ileocolic-artery-ultrasound.ts')),
    'original authored ileocolic bytes retained in current Atlas');
  batch(ileocolicParent,['app/body-content.ts']);
  batch(ileocolicEpoch,['app/body-content.ts']);
  const ileocolicImport="import { ileocolicArteryUltrasoundLesson } from '../lib/ileocolic-artery-ultrasound';\n";
  const ileocolicBranch='  const ileocolicUltrasound = ileocolicArteryUltrasoundLesson(s, tab);\n  if (ileocolicUltrasound) return ileocolicUltrasound;\n';
  const parentDispatch=blob(ileocolicParent,'app/body-content.ts').toString().replaceAll('\r\n','\n');
  const introducedDispatch=blob(ileocolicEpoch,'app/body-content.ts').toString().replaceAll('\r\n','\n');
  assert.equal(introducedDispatch.split(ileocolicImport).length,2,'single authored import');
  assert.equal(introducedDispatch.split(ileocolicBranch).length,2,'single authored branch');
  assert.equal(introducedDispatch.replace(ileocolicImport,'').replace(ileocolicBranch,''),
    parentDispatch,'complete prior dispatch restored by exact source inverse');
  assert.ok(introducedDispatch.indexOf('if(arterialEvidenceLimit)return arterialEvidenceLimit;')<
    introducedDispatch.indexOf(ileocolicBranch),'source evidence holds remain first');
  const currentDispatch=blob(source.source,'app/body-content.ts').toString().replaceAll('\r\n','\n');
  assert.equal(currentDispatch.split(ileocolicImport).length,2,'current dispatch retains import');
  assert.equal(currentDispatch.split(ileocolicBranch).length,2,'current dispatch retains branch');
  assert.ok(currentDispatch.indexOf('if(arterialEvidenceLimit)return arterialEvidenceLimit;')<
    currentDispatch.indexOf(ileocolicBranch),'current source evidence holds remain first');
  const tonguePalatePins=exactPins('content/tongue-palate-quiz-pins.json',tonguePalateEpoch);
  assert.equal(sha(blob(tonguePalateEpoch,'content/tongue-palate-quiz-pins.json')),
    '150fae10b5b29dd10659040a820de8ff0a9eeccd7012406b2d0ed0bd9200ab32',
    'dedicated 6036 quiz pin bytes');
  assert.equal(tonguePalatePins.parentCommit,tonguePalateParent);
  assert.equal(tonguePalatePins.entries.length,8);
  const tonguePalateSelected=new Map(tonguePalatePins.entries.map(row=>[row.identity.id,row]));
  assert.equal(tonguePalateSelected.size,8,'eight distinct tongue and palate identities');
  const ileocolicId=ileocolicIdentity.id;
  const ileocolicMatches=catalog.structures.filter(row=>row.id===ileocolicId);
  assert.equal(ileocolicMatches.length,1,'one named ileocolic source structure');
  same(ileocolicMatches[0],ileocolicIdentity,'complete fixed ileocolic catalogue identity');
  for(const row of tonguePalatePins.entries)
    assert.equal(row.previous.readiness,'generated-identification',
      `${row.identity.id} pinned generated-identification predecessor`);
  const archTransitionPath='content/foot-venous-arch-xray-transition.json';
  batch(archXrayEpoch,[archTransitionPath]);
  const archTransition=JSON.parse(blob(archXrayEpoch,archTransitionPath));
  assert.equal(archTransition.parentCommit,archXrayParent);
  assert.equal(archTransition.pinsHash,sha(JSON.stringify(archXrayPins)));
  assert.equal(archTransition.changed,2);
  assert.equal(archTransition.unchanged,9934);
  assert.equal(archTransition.clinicalApproval,false);
  assert.equal(archTransition.imagesImported,false);
  same(archTransition.entries.map(row=>`${row.id}/${row.tab}`).sort(),
    archXrayPins.entries.map(row=>`${row.identity.id}/xray`).sort(),
    'exact dorsal-arch transition cells');
  assert.equal(new Set([...selected.keys(),...handSelected.keys(),...usSelected.keys(),
    ...footSelected.keys(),...evidenceSelected.keys(),...mriSelected.keys(),
    ...ctSelected.keys(),...medianSelected.keys(),...additionalUsSelected.keys()]).size,132,
    'four ultrasound additions reuse protected foot identities without changing their X-ray cells');
  const introducedCells=[...ctSelected.keys()].map(id=>`${id}/ct`)
    .concat([...medianSelected.keys()].map(id=>`${id}/xray`),
      [...additionalUsSelected.keys()].map(id=>`${id}/ultrasound`));
  const protectedCells=[...selected.keys(),...handSelected.keys(),...footSelected.keys()]
    .map(id=>`${id}/xray`)
    .concat([...usSelected.keys()].map(id=>`${id}/ultrasound`),
      [...mriSelected.keys()].map(id=>`${id}/mri`),
      [...evidenceSelected.values()].map(row=>`${row.identity.id}/${row.tab}`));
  assert.equal(new Set(protectedCells).size,118,'all original protected feature cells stay distinct');
  assert.equal(new Set(introducedCells).size,18,'eighteen distinct introduction cells');
  assert.equal(new Set([...protectedCells,...introducedCells]).size,
    new Set(protectedCells).size+18,'introduced modality cells do not overlap protected cells');
  const laterSixCells=[...checkMriSelected.keys()].map(id=>`${id}/mri`)
    .concat([...archXraySelected.keys()].map(id=>`${id}/xray`));
  const tonguePalateCells=[...tonguePalateSelected.keys()].map(id=>`${id}/quiz`);
  const ileocolicCell=`${ileocolicId}/ultrasound`;
  assert.equal(new Set([...selected.keys(),...handSelected.keys(),...usSelected.keys(),
    ...footSelected.keys(),...evidenceSelected.keys(),...mriSelected.keys(),
    ...ctSelected.keys(),...medianSelected.keys(),...additionalUsSelected.keys(),
    ...checkMriSelected.keys(),...archXraySelected.keys()]).size,138,
    'six later cells add six complete identities to the original 132 unique identities');
  assert.equal(new Set(laterSixCells).size,6,'four MRI updates and two X-ray introductions');
  assert.equal(new Set([...protectedCells,...introducedCells,...laterSixCells]).size,
    118+18+6,'the later six cells are disjoint from all earlier protected cells');
  assert.equal(new Set([...protectedCells,...introducedCells,...laterSixCells,...tonguePalateCells]).size,
    118+18+6+8,'the eight quiz cells do not overlap any other protected transition');
  assert.equal(new Set([...protectedCells,...introducedCells,...laterSixCells,
    ...tonguePalateCells,ileocolicCell]).size,118+18+6+8+1,
    'the single ileocolic ultrasound cell is distinct');
  assert.equal(new Set([...protectedCells,...introducedCells,...laterSixCells,
    ...tonguePalateCells,ileocolicCell,`${corpusId}/xray`]).size,118+18+6+8+1+1,
    'the corpus X-ray cell is distinct from all earlier protected cells');
  assert.equal(new Set([...protectedCells,...introducedCells,...laterSixCells,
    ...tonguePalateCells,ileocolicCell,`${corpusId}/xray`,`${corpusId}/ct`]).size,
    118+18+6+8+1+1+1,'the corpus CT cell is distinct from earlier protected cells');
  const spine = api.decodeRegionalTeachingSnapshot(json('atlas-review/content/regional-teaching/spine.json'), 'spine');
  let changed = 0, preserved = 0, changedWorksheets = 0, handChanges=0, handWorksheets=0;
  let usChanges=0,usWorksheets=0,currentPreserved=0,currentVsOldPreserved=0;
  let footChanges=0,evidenceChanges=0,mriChanges=0;
  let ctChanges=0,medianChanges=0,additionalUsChanges=0,checkMriChanges=0,archXrayChanges=0;
  let tonguePalateChanges=0,ileocolicChanges=0,corpusXrayChanges=0,corpusCtChanges=0,thyroidMraExpanded=0;
  const additionalUsCounts=new Map(additionalUsEpochs.map(group=>[group.name,0]));
  for (const structure of catalog.structures) {
    const oldWorksheet = await old.bodyReviewMaterial(structure.id);
    const priorWorksheet = await prior.bodyReviewMaterial(structure.id);
    const historicalWorksheet = await historical.bodyReviewMaterial(structure.id);
    const worksheet = await api.bodyReviewMaterial(structure.id);
    assert.equal(worksheet.approval, false, `${structure.id} has no carried approval`);
    for (const tab of api.contentTabs) {
      const before = old.bodyLesson(structure, tab);
      const after = api.bodyLesson(structure, tab);
      const priorTopic = oldWorksheet.topics.find(topic => topic.tab === tab);
      const topic = worksheet.topics.find(topic => topic.tab === tab);
      const priorLesson=prior.bodyLesson(structure,tab);
      const priorCurrentTopic=priorWorksheet.topics.find(item=>item.tab===tab);
      const historicalLesson=historical.bodyLesson(structure,tab);
      const historicalTopic=historicalWorksheet.topics.find(item=>item.tab===tab);
      const footRow=footSelected.get(structure.id);
      const evidenceRow=evidenceSelected.get(structure.id);
      const mriRow=mriSelected.get(structure.id);
      const ctRow=ctSelected.get(structure.id);
      const medianRow=medianSelected.get(structure.id);
      const additionalUs=additionalUsSelected.get(structure.id);
      const checkMriRow=checkMriSelected.get(structure.id);
      const archXrayRow=archXraySelected.get(structure.id);
      const tonguePalateRow=tonguePalateSelected.get(structure.id);
      if (!((selected.has(structure.id)||handSelected.has(structure.id))&&tab==='xray')&&
        !(usSelected.has(structure.id)&&tab==='ultrasound')) {
        same(historicalLesson,before,`${structure.id}/${tab} original 589 lesson preserved`);
        same(historicalTopic,priorTopic,`${structure.id}/${tab} original 589 worksheet preserved`);
        preserved++;
      }
      if(usSelected.has(structure.id)&&tab==='ultrasound'){
        const row=usSelected.get(structure.id);
        same(structure,row.identity,`${structure.id} complete ultrasound identity`);
        same(priorLesson,row.previous,`${structure.id} exact f1 pending lesson`);
        same(before,row.previous,`${structure.id} exact older pending lesson`);
        assert.equal(after.readiness,'draft');
        same(after,api.intracranialArterialUsLesson(structure,tab),`${structure.id} ultrasound resolver`);
        same(topic,{tab,...after},`${structure.id} ultrasound Review worksheet`);
        same(historicalLesson,after,`${structure.id} immutable 589 ultrasound lesson`);
        same(historicalTopic,topic,`${structure.id} immutable 589 ultrasound worksheet`);
        assert.notDeepEqual(topic,priorCurrentTopic);
        usChanges++;
      }else if(footRow&&tab==='xray'){
        same(structure,footRow.identity,`${structure.id} exact foot source identity`);
        same(priorLesson,historicalLesson,`${structure.id} f1-to-589 foot lesson unchanged`);
        const predecessor=footAtCommit.bodyLesson(structure,tab);
        assert.equal(predecessor.readiness,'draft',`${structure.id} foot feature draft`);
        assert.equal(historicalLesson.readiness,'pending',`${structure.id} foot predecessor pending`);
        same(after,predecessor,`${structure.id} current exact foot feature lesson`);
        same(after,api.footArterialProjectionXrayLesson(structure,tab),`${structure.id} current foot resolver`);
        same(topic,{tab,...after},`${structure.id} current foot worksheet`);
        const featureTopic=(await footAtCommit.bodyReviewMaterial(structure.id)).topics.find(item=>item.tab===tab);
        same(topic,featureTopic,`${structure.id} exact foot feature worksheet`);
        assert.notDeepEqual(topic,historicalTopic);
        footChanges++;
      }else if(evidenceRow&&tab===evidenceRow.tab){
        same(structure,evidenceRow.identity,`${structure.id} exact arterial-limit identity`);
        same(historicalLesson,footAtCommit.bodyLesson(structure,tab),`${structure.id} pre-limit lesson`);
        same(footAtCommit.bodyLesson(structure,tab),evidenceRow.previous,`${structure.id} pinned predecessor`);
        const feature=evidenceAtCommit.bodyLesson(structure,tab);
        assert.equal(feature.readiness,'pending',`${structure.id} evidence remains pending`);
        assert.notDeepEqual(feature,evidenceRow.previous,`${structure.id} teaching changed`);
        if(evidenceRow.family==='inferiorThyroidMri'){
          same(thyroidMraBefore.bodyLesson(structure,tab),feature,
            `${structure.id} complete original lesson retained through6036`);
          const expanded=thyroidMraAtCommit.bodyLesson(structure,tab);
          assert.equal(expanded.readiness,'pending','MRA expansion is not readiness promotion');
          assert.notDeepEqual(expanded,feature,'Actual later source-authored evidence expansion');
          same(after,expanded,`${structure.id} exact87ed MRA lesson`);
          same(after.citations,['https://doi.org/10.7727/wimj.2015.288','https://pubmed.ncbi.nlm.nih.gov/25770593/']);
          assert.match(after.body,/selected cases do not establish routine visibility/);
          assert.match(after.note,/revision-bound radiologist sign-off remain pending/);
          same(topic,(await thyroidMraAtCommit.bodyReviewMaterial(structure.id)).topics.find(item=>item.tab===tab),
            `${structure.id} full87ed MRA worksheet`);
          assert.equal(await api.parseBodyReviewResponse(await thyroidMraBefore.bodyReviewMaterial(structure.id),structure.id),null,
            'Pre-expansion source-bound worksheet cannot approve the new revision');
          thyroidMraExpanded++;
        }else same(after,feature,`${structure.id} current exact arterial-limit lesson`);
        same(after,api.arterialEvidenceLimitLesson(structure,tab),`${structure.id} current arterial-limit resolver`);
        same(topic,{tab,...after},`${structure.id} current arterial-limit worksheet`);
        const originalFeatureTopic=(await evidenceAtCommit.bodyReviewMaterial(structure.id)).topics.find(item=>item.tab===tab);
        if(evidenceRow.family==='inferiorThyroidMri'){
          same((await thyroidMraBefore.bodyReviewMaterial(structure.id)).topics.find(item=>item.tab===tab),
            originalFeatureTopic,`${structure.id} complete historical feature worksheet retained through6036`);
        }else same(topic,originalFeatureTopic,`${structure.id} exact arterial-limit feature worksheet`);
        assert.notDeepEqual(topic,historicalTopic);
        evidenceChanges++;
      }else if(mriRow&&tab==='mri'){
        same(structure,mriRow.identity,`${structure.id} exact salpingopharyngeus identity`);
        same(priorLesson,historicalLesson,`${structure.id} f1-to-589 MRI unchanged`);
        same(historicalLesson,footAtCommit.bodyLesson(structure,tab),`${structure.id} foot epoch MRI unchanged`);
        same(historicalLesson,evidenceAtCommit.bodyLesson(structure,tab),`${structure.id} evidence epoch MRI unchanged`);
        assert.equal(historicalLesson.readiness,'pending',`${structure.id} MRI predecessor pending`);
        const feature=pharyngealAtCommit.bodyLesson(structure,tab);
        assert.equal(feature.readiness,'draft',`${structure.id} MRI feature draft`);
        same(after,feature,`${structure.id} current exact MRI feature lesson`);
        same(after,api.salpingopharyngeusMriLesson(structure,tab),`${structure.id} current MRI resolver`);
        same(topic,{tab,...after},`${structure.id} current MRI worksheet`);
        same(topic,(await pharyngealAtCommit.bodyReviewMaterial(structure.id)).topics.find(item=>item.tab===tab),
          `${structure.id} exact MRI feature worksheet`);
        assert.notDeepEqual(topic,historicalTopic);
        mriChanges++;
      }else if(ctRow&&tab==='ct'){
        const transition=ctChangesById.get(structure.id);
        assert.ok(transition,`${structure.id} genuine CT transition`);
        same(structure,ctRow.identity,`${structure.id} exact CT source identity`);
        same(ctBefore.bodyLesson(structure,tab),transition.previous,
          `${structure.id} exact 46c pending CT predecessor`);
        same(before,transition.previous,`${structure.id} protected old CT lesson`);
        assert.equal(transition.previous.readiness,'pending');
        const feature=ctAtCommit.bodyLesson(structure,tab);
        same(feature,transition.current,`${structure.id} exact introduced CT lesson`);
        assert.equal(feature.readiness,'draft');
        same(after,feature,`${structure.id} current exact CT feature lesson`);
        same(after,api.craniofacialCalcificationCtLesson(structure,tab),
          `${structure.id} current CT resolver`);
        same(topic,{tab,...after},`${structure.id} current CT worksheet`);
        same(topic,(await ctAtCommit.bodyReviewMaterial(structure.id)).topics.find(item=>item.tab===tab),
          `${structure.id} exact introduced CT worksheet`);
        same((await ctBefore.bodyReviewMaterial(structure.id)).topics.find(item=>item.tab===tab),
          {tab,...transition.previous},`${structure.id} exact 46c CT worksheet`);
        assert.notDeepEqual(topic,historicalTopic);
        ctChanges++;
      }else if(medianRow&&tab==='xray'){
        same(structure,medianRow.identity,`${structure.id} exact median forearm source identity`);
        const predecessor=medianBefore.bodyLesson(structure,tab);
        assert.equal(predecessor.readiness,medianRow.previousReadiness);
        assert.equal(predecessor.readiness,'pending');
        same(before,predecessor,`${structure.id} protected old X-ray lesson`);
        const feature=medianAtCommit.bodyLesson(structure,tab);
        assert.equal(feature.readiness,'draft');
        same(after,feature,`${structure.id} current exact median X-ray feature lesson`);
        same(after,api.medianAntebrachialXrayLesson(structure,tab),
          `${structure.id} current median X-ray resolver`);
        same(topic,{tab,...after},`${structure.id} current median X-ray worksheet`);
        same(topic,(await medianAtCommit.bodyReviewMaterial(structure.id)).topics.find(item=>item.tab===tab),
          `${structure.id} exact introduced median X-ray worksheet`);
        same((await medianBefore.bodyReviewMaterial(structure.id)).topics.find(item=>item.tab===tab),
          {tab,...predecessor},`${structure.id} exact median predecessor worksheet`);
        assert.notDeepEqual(topic,historicalTopic);
        medianChanges++;
      }else if(additionalUs&&tab==='ultrasound'){
        const {group,row}=additionalUs;
        same(structure,row.identity,`${structure.id} complete ${group.name} source identity`);
        const predecessor=group.before.bodyLesson(structure,tab);
        same(predecessor,row.previous,`${structure.id} genuine ${group.name} predecessor`);
        same(priorLesson,predecessor,`${structure.id} f1 pending lesson`);
        same(before,predecessor,`${structure.id} protected old pending lesson`);
        assert.equal(predecessor.readiness,'pending');
        same((await group.before.bodyReviewMaterial(structure.id)).topics.find(item=>item.tab===tab),
          {tab,...predecessor},`${structure.id} genuine predecessor worksheet`);
        const introduced=group.introduced.bodyLesson(structure,tab);
        assert.equal(introduced.readiness,'draft');
        same(after,introduced,`${structure.id} exact introduced and current ${group.name} lesson`);
        same(after,group.resolver(structure,tab),`${structure.id} current ${group.name} resolver`);
        same(topic,{tab,...after},`${structure.id} current ${group.name} worksheet`);
        same(topic,(await group.introduced.bodyReviewMaterial(structure.id)).topics.find(item=>item.tab===tab),
          `${structure.id} exact introduced ${group.name} worksheet`);
        assert.notDeepEqual(topic,priorCurrentTopic);
        assert.notDeepEqual(topic,historicalTopic);
        additionalUsChanges++;
        additionalUsCounts.set(group.name,additionalUsCounts.get(group.name)+1);
      }else if(checkMriRow&&tab==='mri'){
        same(structure,checkMriRow.identity,`${structure.id} complete check-ligament source identity`);
        const predecessor=checkMriBefore.bodyLesson(structure,tab);
        assert.equal(predecessor.readiness,'draft',`${structure.id} MRI was already draft`);
        same(priorLesson,predecessor,`${structure.id} previously drafted MRI lesson`);
        same((await checkMriBefore.bodyReviewMaterial(structure.id)).topics.find(item=>item.tab===tab),
          {tab,...predecessor},`${structure.id} exact MRI predecessor worksheet`);
        const revised=checkMriAtCommit.bodyLesson(structure,tab);
        assert.equal(revised.readiness,'draft',`${structure.id} MRI remains draft`);
        assert.notDeepEqual(revised,predecessor,`${structure.id} source-backed MRI revision`);
        same(after,revised,`${structure.id} exact current MRI revision`);
        same(after,api.orbitalSupportMriLesson(structure,tab),
          `${structure.id} current check-ligament resolver`);
        same(topic,{tab,...after},`${structure.id} current MRI worksheet`);
        same(topic,(await checkMriAtCommit.bodyReviewMaterial(structure.id)).topics.find(item=>item.tab===tab),
          `${structure.id} exact MRI revision worksheet`);
        assert.notDeepEqual(topic,priorCurrentTopic);
        checkMriChanges++;
      }else if(archXrayRow&&tab==='xray'){
        same(structure,archXrayRow.identity,`${structure.id} complete dorsal-arch source identity`);
        assert.deepEqual(archXrayRow.topics,['xray']);
        const predecessor=archXrayBefore.bodyLesson(structure,tab);
        assert.equal(predecessor.readiness,'pending',`${structure.id} X-ray predecessor pending`);
        same(predecessor,archXrayRow.previous.xray,`${structure.id} pinned X-ray predecessor`);
        same(priorLesson,predecessor,`${structure.id} earlier X-ray unchanged`);
        same((await archXrayBefore.bodyReviewMaterial(structure.id)).topics.find(item=>item.tab===tab),
          {tab,...predecessor},`${structure.id} exact X-ray predecessor worksheet`);
        const introduced=archXrayAtCommit.bodyLesson(structure,tab);
        assert.equal(introduced.readiness,'draft',`${structure.id} X-ray introduced draft`);
        same(after,introduced,`${structure.id} exact current dorsal-arch X-ray lesson`);
        same(after,api.footVenousArchXrayLesson(structure,tab),
          `${structure.id} current dorsal-arch resolver`);
        same(topic,{tab,...after},`${structure.id} current X-ray worksheet`);
        same(topic,(await archXrayAtCommit.bodyReviewMaterial(structure.id)).topics.find(item=>item.tab===tab),
          `${structure.id} exact introduced X-ray worksheet`);
        assert.notDeepEqual(topic,priorCurrentTopic);
        archXrayChanges++;
      }else if(tonguePalateRow&&tab==='quiz'){
        const predecessor=tonguePalateBefore.bodyLesson(structure,tab);
        const introduced=tonguePalateAtCommit.bodyLesson(structure,tab);
        const predecessorTopic=(await tonguePalateBefore.bodyReviewMaterial(structure.id))
          .topics.find(item=>item.tab===tab);
        const introducedTopic=(await tonguePalateAtCommit.bodyReviewMaterial(structure.id))
          .topics.find(item=>item.tab===tab);
        assertTonguePalateQuizTransition({row:tonguePalateRow,structure,tab,priorLesson,
          before,predecessor,predecessorTopic,after,introduced,topic,introducedTopic,
          currentResolver:api.tonguePalateQuizLesson,worksheet});
        assert.notDeepEqual(topic,priorCurrentTopic);
        tonguePalateChanges++;
      }else if(structure.id===ileocolicId&&tab==='ultrasound'){
        const predecessor=ileocolicBefore.bodyLesson(structure,tab);
        const introduced=ileocolicAtCommit.bodyLesson(structure,tab);
        const predecessorTopic=(await ileocolicBefore.bodyReviewMaterial(structure.id))
          .topics.find(item=>item.tab===tab);
        const introducedTopic=(await ileocolicAtCommit.bodyReviewMaterial(structure.id))
          .topics.find(item=>item.tab===tab);
        assertIleocolicUltrasoundTransition({structure,tab,priorLesson,before,
          predecessor,predecessorTopic,after,introduced,topic,introducedTopic,
          currentResolver:api.ileocolicArteryUltrasoundLesson,worksheet});
        assert.notDeepEqual(topic,priorCurrentTopic);
        assert.notDeepEqual(topic,historicalTopic);
        ileocolicChanges++;
      }else if(structure.id===corpusId&&tab==='xray'){
        same(structure,corpusRow.identity,`${corpusId} complete corpus source identity`);
        const predecessor=corpusXrayBefore.bodyLesson(structure,tab);
        const introduced=corpusXrayAtCommit.bodyLesson(structure,tab);
        same(predecessor,corpusRow.previous.xray,`${corpusId} exact pending predecessor`);
        same(priorLesson,predecessor,`${corpusId} f1 lesson preserved to introduction`);
        assert.equal(predecessor.readiness,'pending');
        assert.equal(introduced.readiness,'draft');
        same(introduced,corpusTransition.entries[0].current,`${corpusId} authored transition`);
        same(after,introduced,`${corpusId} exact current corpus lesson`);
        same(after,api.corpusSpongiosumXrayLesson(structure,tab),`${corpusId} current resolver`);
        same((await corpusXrayBefore.bodyReviewMaterial(corpusId)).topics.find(item=>item.tab===tab),
          {tab,...predecessor},`${corpusId} complete predecessor worksheet`);
        same(topic,(await corpusXrayAtCommit.bodyReviewMaterial(corpusId)).topics.find(item=>item.tab===tab),
          `${corpusId} exact introduced worksheet`);
        same(topic,{tab,...after},`${corpusId} current worksheet`);
        assert.notDeepEqual(topic,priorCurrentTopic);
        corpusXrayChanges++;
      }else if(structure.id===corpusId&&tab==='ct'){
        same(structure,corpusCtRow.identity,`${corpusId} complete corpus CT identity`);
        const predecessor=corpusCtBefore.bodyLesson(structure,tab);
        const introduced=corpusCtAtCommit.bodyLesson(structure,tab);
        same(predecessor,corpusCtRow.previous.ct,`${corpusId} exact pending CT predecessor`);
        same(priorLesson,predecessor,`${corpusId} f1 CT lesson preserved to introduction`);
        assert.equal(predecessor.readiness,'pending');
        assert.equal(introduced.readiness,'draft');
        same(introduced,corpusCtTransition.entries[0].current,`${corpusId} authored CT transition`);
        same(after,introduced,`${corpusId} exact current CT lesson`);
        same(after,api.corpusImagingLesson(structure,tab),`${corpusId} current CT resolver`);
        const oldPacket=await corpusCtBefore.bodyReviewMaterial(corpusId);
        const introducedPacket=await corpusCtAtCommit.bodyReviewMaterial(corpusId);
        same(oldPacket.topics.find(item=>item.tab===tab),{tab,...predecessor},
          `${corpusId} exact predecessor CT worksheet`);
        same(introducedPacket.topics.find(item=>item.tab===tab),{tab,...introduced},
          `${corpusId} exact introduced CT worksheet`);
        same(topic,introducedPacket.topics.find(item=>item.tab===tab),
          `${corpusId} exact current CT worksheet`);
        same(topic,{tab,...after},`${corpusId} current CT worksheet`);
        same(oldPacket.fingerprints,corpusCtTransition.reviewBefore,
          `${corpusId} predecessor Review fingerprints`);
        same(introducedPacket.fingerprints,corpusCtTransition.reviewAfter,
          `${corpusId} introduced Review fingerprints`);
        assert.equal(oldPacket.materialHash,corpusCtTransition.reviewBeforeMaterialHash);
        assert.equal(introducedPacket.materialHash,corpusCtTransition.reviewAfterMaterialHash);
        assert.notDeepEqual(introducedPacket,oldPacket,
          `${corpusId} CT introduction changes its Review packet`);
        const restoredPacket=structuredClone(introducedPacket);
        const ctTopicIndex=restoredPacket.topics.findIndex(item=>item.tab==='ct');
        assert.ok(ctTopicIndex>=0);
        restoredPacket.topics[ctTopicIndex]=oldPacket.topics[ctTopicIndex];
        restoredPacket.fingerprints=oldPacket.fingerprints;
        restoredPacket.materialHash=oldPacket.materialHash;
        same(restoredPacket,oldPacket,
          `${corpusId} only CT teaching and bound Review hashes change at introduction`);
        assert.equal(worksheet.approval,false);
        assert.equal(worksheet.status,'worksheet-not-submitted');
        same(worksheet.fingerprints,introducedPacket.fingerprints,
          `${corpusId} current Review fingerprints`);
        assert.equal(worksheet.materialHash,introducedPacket.materialHash);
        assert.notDeepEqual(topic,priorCurrentTopic);
        corpusCtChanges++;
      }else{
        same(after,priorLesson,`${structure.id}/${tab} current lesson unchanged since f1`);
        same(topic,priorCurrentTopic,`${structure.id}/${tab} current worksheet unchanged since f1`);
        currentPreserved++;
      }
      if (selected.has(structure.id) && tab === 'xray') {
        const row = selected.get(structure.id);
        same(structure, row.identity, `${structure.id} complete source identity`);
        same(before, row.previous, `${structure.id} exact historical pending lesson`);
        assert.equal(before.readiness, 'pending');
        assert.equal(after.readiness, 'draft');
        same(after, api.spinalMuscleXrayLesson(structure, tab), `${structure.id} resolver`);
        const fact = api.spinalMuscleXrayFacts[row.family];
        assert.ok(fact, `${row.family} source fact`);
        same([after.body, ...after.bullets], [fact.body, fact.distinction, fact.projection,
          ...api.spinalMuscleXrayLimitations], `${structure.id} original teaching`);
        same(after.citations, fact.references, `${structure.id} references`);
        assert.match(after.note, /revision-bound radiologist review pending/i);
        assert.match(after.note, /No acquired image, clinical approval, diagnosis/i);
        assert.ok(spine.accepts(structure));
        same(spine.bodyLesson(structure, tab), after, `${structure.id} regional reader`);
        same(topic, { tab, ...after }, `${structure.id} Review worksheet`);
        same(historicalLesson,after,`${structure.id} original spinal lesson at 589`);
        same(historicalTopic,topic,`${structure.id} original spinal worksheet at 589`);
        assert.notDeepEqual(topic, priorTopic);
        changed++;
      } else if(handSelected.has(structure.id)&&tab==='xray') {
        const row=handSelected.get(structure.id);
        same(structure,row.identity,`${structure.id} complete hand source identity`);
        same(oldHand.bodyLesson(structure,tab),row.previous,`${structure.id} exact 8d hand predecessor`);
        same(before,row.previous,`${structure.id} exact older pending hand lesson`);
        assert.equal(before.readiness,'pending');
        assert.equal(after.readiness,'draft');
        same(after,api.handVesselXrayLesson(structure,tab),`${structure.id} hand resolver`);
        same(topic,{tab,...after},`${structure.id} hand Review worksheet`);
        same(historicalLesson,after,`${structure.id} original hand lesson at 589`);
        same(historicalTopic,topic,`${structure.id} original hand worksheet at 589`);
        assert.notDeepEqual(topic,priorTopic);
        handChanges++;
      } else if((usSelected.has(structure.id)&&tab==='ultrasound')||
        (footRow&&tab==='xray')||(evidenceRow&&tab===evidenceRow.tab)||(mriRow&&tab==='mri')||
        (ctRow&&tab==='ct')||(medianRow&&tab==='xray')||(additionalUs&&tab==='ultrasound')||
        (checkMriRow&&tab==='mri')||(archXrayRow&&tab==='xray')||
        (tonguePalateRow&&tab==='quiz')||(structure.id===ileocolicId&&tab==='ultrasound')||
        (structure.id===corpusId&&(tab==='xray'||tab==='ct'))) {
        // Each exact feature transition and its worksheet were checked above.
      } else {
        same(after,before,`${structure.id}/${tab} current lesson preserved versus baseline`);
        same(topic,priorTopic,`${structure.id}/${tab} current worksheet preserved versus baseline`);
        currentVsOldPreserved++;
      }
    }
    if (selected.has(structure.id)) changedWorksheets++;
    if (handSelected.has(structure.id)) handWorksheets++;
    if (usSelected.has(structure.id)) usWorksheets++;
  }
  assert.equal(changed, 56);
  assert.equal(handChanges,36);
  assert.equal(usChanges,8);
  assert.equal(footChanges,12);
  assert.equal(evidenceChanges,4);
  assert.equal(mriChanges,2);
  assert.equal(ctChanges,4);
  assert.equal(medianChanges,2);
  assert.equal(additionalUsChanges,12);
  assert.equal(checkMriChanges,4);
  assert.equal(archXrayChanges,2);
  assert.equal(tonguePalateChanges,8);
  assert.equal(ileocolicChanges,1);
  assert.equal(corpusXrayChanges,1);
  assert.equal(corpusCtChanges,1);
  assert.equal(thyroidMraExpanded,2,'Two expanded MRA cells already counted in the original four evidence changes');
  for(const group of additionalUsEpochs)assert.equal(additionalUsCounts.get(group.name),group.count,
    `${group.name} exact introduced cells visited`);
  assert.equal(currentPreserved,9875);
  assert.equal(currentPreserved+ctChanges+medianChanges+additionalUsChanges+
    checkMriChanges+archXrayChanges+tonguePalateChanges+ileocolicChanges+corpusXrayChanges+corpusCtChanges,9910,
    '9910 current-preservation cells include exact ileocolic, corpus X-ray and CT changes');
  assert.equal(preserved, 9836);
  assert.equal(currentVsOldPreserved,9783);
  assert.equal(currentVsOldPreserved+ctChanges+medianChanges+additionalUsChanges+
    checkMriChanges+archXrayChanges+tonguePalateChanges+ileocolicChanges+corpusXrayChanges+corpusCtChanges,9818,
    '9818 baseline-preservation cells include exact ileocolic, corpus X-ray and CT changes');
  assert.equal(changedWorksheets, 56);
  assert.equal(handWorksheets,36);
  assert.equal(usWorksheets,8);

  const cervical = json('atlas-review/content/cervical-projection-xray-pins.json');
  assert.equal(cervical.entries.length, 6);
  for (const row of cervical.entries) {
    const structure = catalog.structures.find(item => item.id === row.identity.id);
    assert.ok(structure);
    same(api.bodyLesson(structure, 'xray'), old.bodyLesson(structure, 'xray'), `${structure.id} prior cervical lesson`);
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
  for(const [selectedSet,tab,resolver] of [
    [ctSelected,'ct',api.craniofacialCalcificationCtLesson],
    [medianSelected,'xray',api.medianAntebrachialXrayLesson],
    [checkMriSelected,'mri',api.orbitalSupportMriLesson],
    [archXraySelected,'xray',api.footVenousArchXrayLesson],
    [tonguePalateSelected,'quiz',api.tonguePalateQuizLesson],
    [new Map([[ileocolicId,{identity:ileocolicIdentity}]]),'ultrasound',
      api.ileocolicArteryUltrasoundLesson],
    [new Map([[corpusId,corpusRow]]),'xray',api.corpusSpongiosumXrayLesson],
    [new Map([[corpusId,corpusCtRow]]),'ct',api.corpusImagingLesson],
    ...additionalUsEpochs.map(group=>[group.rows,'ultrasound',group.resolver]),
  ])for(const row of selectedSet.values()){
    const id=row.identity.id;
    const packet=await api.bodyReviewMaterial(id);
    assert.equal(packet.approval,false,`${id} has no carried approval`);
    assert.equal(packet.status,'worksheet-not-submitted',`${id} is an unsigned worksheet`);
    assert.ok(await api.parseBodyReviewResponse(packet,id),`${id} exact current worksheet parses`);
    const altered=structuredClone(packet);
    altered.topics.find(topic=>topic.tab===tab).body+=' altered';
    assert.equal(await api.parseBodyReviewResponse(altered,id),null,`${id} tampered teaching refused`);
    if(id===ileocolicId||id===corpusId){
      const stale=await (id===ileocolicId?ileocolicBefore:corpusXrayBefore).bodyReviewMaterial(id);
      assert.equal(await api.parseBodyReviewResponse(stale,id),null,
        'pre-introduction ileocolic worksheet cannot carry approval');
      for(const mutate of [
        topic=>{topic.citations[0]='https://invalid.example/';},
        topic=>{topic.readiness='approved';},
        topic=>{topic.extra='foreign';},
      ]){
        const changed=structuredClone(packet);
        mutate(changed.topics.find(topic=>topic.tab===tab));
        assert.equal(await api.parseBodyReviewResponse(changed,id),null,
          'altered ileocolic Review material refused');
      }
    }
    assert.equal(resolver({id,name:row.identity.name,fmaId:row.identity.fmaId},tab),undefined,
      `${id} partial source identity refused`);
    const changedIdentity=structuredClone(row.identity);
    changedIdentity.fmaId+='-foreign';
    assert.equal(resolver(changedIdentity,tab),undefined,`${id} altered source identity refused`);
  }

  const corpusCtPacket=await api.bodyReviewMaterial(corpusId);
  const corpusCtStale=await corpusCtBefore.bodyReviewMaterial(corpusId);
  assert.equal(await api.parseBodyReviewResponse(corpusCtStale,corpusId),null,
    'pre-CT corpus worksheet cannot carry approval');
  same(corpusCtPacket.fingerprints,corpusCtTransition.reviewAfter,
    'current corpus CT Review revision stays introduction-bound');
  assert.equal(corpusCtPacket.materialHash,corpusCtTransition.reviewAfterMaterialHash);
  for(const mutate of [
    packet=>{packet.topics.find(topic=>topic.tab==='ct').citations[0]='https://invalid.example/';},
    packet=>{packet.topics.find(topic=>topic.tab==='ct').readiness='approved';},
    packet=>{packet.topics.find(topic=>topic.tab==='ct').extra='foreign';},
  ]){
    const altered=structuredClone(corpusCtPacket);mutate(altered);
    assert.equal(await api.parseBodyReviewResponse(altered,corpusId),null,
      'altered corpus CT Review material refused');
  }
  // A transport fingerprint is not display evidence. Save-time revision hashes
  // are checked against the trusted current context before storage is touched.
  const beforeCtContext=await corpusCtBefore.bodyReviewContext(corpusId);
  const currentCtContext=await api.bodyReviewContext(corpusId);
  assert(beforeCtContext&&currentCtContext,'both CT review contexts exist');
  assert.equal(beforeCtContext.sourceHash,currentCtContext.sourceHash);
  assert.notEqual(beforeCtContext.revisions.teaching,currentCtContext.revisions.teaching);
  assert.notEqual(beforeCtContext.materialHash,currentCtContext.materialHash);
  assert.equal(currentCtContext.materialHash,corpusCtPacket.materialHash);
  assert.equal(currentCtContext.teachingHash,corpusCtTransition.reviewAfter.teaching);
  assert.equal(beforeCtContext.teachingHash,corpusCtTransition.reviewBefore.teaching);
  const ctSaveRequest=revisionHash=>new Request('https://review.test/api/body-review/decisions',{
    method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
      'oai-authenticated-user-id':'SYNTHETIC_CORPUS_CT_REVIEW'},
    body:JSON.stringify({catalogScope:currentCtContext.catalogScope,structureId:corpusId,
      track:'teaching',expectedVersion:0,materialHash:currentCtContext.materialHash,
      revisionHash,checklistVersion:currentCtContext.checklistVersion,
      draft:api.blankBodyReview(currentCtContext,'teaching')}),
  });
  let storageCalls=0;
  const forbiddenStorage={prepare(){storageCalls++;throw Error('Stale CT save reached storage');}};
  const staleCtSave=await api.postBodyDecision(
    ctSaveRequest(beforeCtContext.revisions.teaching),forbiddenStorage);
  assert.equal(staleCtSave.status,409,'pre-CT teaching revision refused at save boundary');
  assert.equal(storageCalls,0,'stale CT save refused before storage');
  const currentCtSave=await api.postBodyDecision(
    ctSaveRequest(currentCtContext.revisions.teaching),undefined);
  assert.equal(currentCtSave.status,503,'valid current revision proceeds to storage availability');
  assert.match((await currentCtSave.json()).error,/Body review storage is unavailable/);

  const { emittedTeaching } = await import(pathToFileURL(resolve(root, 'tests/atlas-emitted-teaching.ts')).href);
  const base = 'public/atlas-runtime/head-neck/';
  const emitted = emittedTeaching(base, json(base + 'manifest.json').files, true,
    path => readFileSync(resolve(root, path)));
  const contains = line => emitted.includes(line) || emitted.includes(JSON.stringify(line).slice(1, -1));
  for (const fact of Object.values(api.spinalMuscleXrayFacts)) {
    for (const line of [fact.body, fact.distinction, fact.projection, ...fact.references])
      assert.ok(contains(line), `emitted fact/reference: ${line.slice(0, 50)}`);
  }
  for (const line of api.spinalMuscleXrayLimitations) assert.ok(contains(line), 'emitted limitation');
  for (const row of pins.entries) assert.ok(emitted.includes(row.identity.id), `emitted ${row.identity.fmaId}`);
  assert.match(emitted, /revision-bound radiologist review pending/);
  const emittedCurrent=[emitted,...['public/atlas-runtime/shoulder/','public/atlas-review-viewer/']
    .map(base=>emittedTeaching(base,json(base+'manifest.json').files,true,
      path=>readFileSync(resolve(root,path))))];
  for(const [selectedSet,tab] of [[ctSelected,'ct'],[medianSelected,'xray'],
    [checkMriSelected,'mri'],[archXraySelected,'xray'],
    [new Map([[ileocolicId,{identity:ileocolicIdentity}]]),'ultrasound'],
    [new Map([[corpusId,corpusRow]]),'xray'],
    [new Map([[corpusId,corpusCtRow]]),'ct'],
    ...additionalUsEpochs.map(group=>[group.rows,'ultrasound'])])
    for(const row of selectedSet.values()){
      const lesson=api.bodyLesson(row.identity,tab);
      for(const line of [lesson.title,lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
        for(const chunk of emittedCurrent)
          assert.ok(chunk.includes(line)||chunk.includes(JSON.stringify(line).slice(1,-1)),
            `${row.identity.id}/${tab} exact introduced teaching emitted`);
    }

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
    preserved, changedWorksheets, handChanges, handWorksheets,usChanges,usWorksheets,currentPreserved,
    footChanges,evidenceChanges,mriChanges,ctChanges,medianChanges,additionalUsChanges,
    checkMriChanges,archXrayChanges,tonguePalateChanges,ileocolicChanges,corpusXrayChanges,corpusCtChanges,thyroidMraExpanded,
    additionalUsCounts:Object.fromEntries(additionalUsCounts),currentVsOldPreserved,
    families: 32, pins: 56, cervicalUnchanged: 6,
    runtimes: regions.length, reviewFiles: review.files.length, modelBundlesUnchanged: 86,
    clinicalApproval: false, patientRegistration: false }));
});
