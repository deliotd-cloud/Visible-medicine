import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
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
for (const epoch of [ultrasoundEpoch,footEpoch,evidenceEpoch,pharyngealEpoch]) {
  assert.equal(git('rev-parse', `${epoch}^{commit}`).toString().trim(),epoch);
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
  ...[ultrasoundEpoch,footEpoch,evidenceEpoch,pharyngealEpoch].map(epoch=>[epoch,tree(epoch)])]);
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
  assert.equal(new Set([...selected.keys(),...handSelected.keys(),...usSelected.keys(),
    ...footSelected.keys(),...evidenceSelected.keys(),...mriSelected.keys()]).size,118,
    'protected historical and later pin sets do not overlap');
  const spine = api.decodeRegionalTeachingSnapshot(json('atlas-review/content/regional-teaching/spine.json'), 'spine');
  let changed = 0, preserved = 0, changedWorksheets = 0, handChanges=0, handWorksheets=0;
  let usChanges=0,usWorksheets=0,currentPreserved=0,currentVsOldPreserved=0;
  let footChanges=0,evidenceChanges=0,mriChanges=0;
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
        same(after,feature,`${structure.id} current exact arterial-limit lesson`);
        same(after,api.arterialEvidenceLimitLesson(structure,tab),`${structure.id} current arterial-limit resolver`);
        same(topic,{tab,...after},`${structure.id} current arterial-limit worksheet`);
        same(topic,(await evidenceAtCommit.bodyReviewMaterial(structure.id)).topics.find(item=>item.tab===tab),
          `${structure.id} exact arterial-limit feature worksheet`);
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
        (footRow&&tab==='xray')||(evidenceRow&&tab===evidenceRow.tab)||(mriRow&&tab==='mri')) {
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
  assert.equal(currentPreserved,9910);
  assert.equal(preserved, 9836);
  assert.equal(currentVsOldPreserved,9818);
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
    footChanges,evidenceChanges,mriChanges,currentVsOldPreserved,
    families: 32, pins: 56, cervicalUnchanged: 6,
    runtimes: regions.length, reviewFiles: review.files.length, modelBundlesUnchanged: 86,
    clinicalApproval: false, patientRegistration: false }));
});
