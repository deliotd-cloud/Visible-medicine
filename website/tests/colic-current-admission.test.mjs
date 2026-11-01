import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,realpathSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import test from 'node:test';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {historicalReviewAe84Read,historicalReviewAe84Pin} from './historical-review-ae84.mjs';
import {authenticateColicRoleContext} from './colic-role-contract-20261101.mjs';

const currentWebsite=resolve(process.env.VM_WEBSITE_ROOT ?? process.cwd());
const website=resolve('F:/VisibleMedicine/staging/20261021-body-learning-website-candidate/website');
const source=resolve('F:/VisibleMedicine/staging/20261021-body-learning-source-candidate/atlas');
const frozen=join(dirname(fileURLToPath(import.meta.url)),'fixtures/colic-fa1-preimage');
const readLive=path=>readFileSync(join(website,path));
const read=path=>historicalReviewAe84Read(path,readLive);
const readOld=path=>readFileSync(join(frozen,path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(readFileSync(join(website,'tests/current-atlas-delivery.mjs'))),
 '52551fd5ec16154a78b94f78e0cdfbfee6a1bea629f70714f3dd5f93ccb81bb5');
assert.equal(sha(readFileSync(join(website,'tests/atlas-source-repo.mjs'))),
 '45be52da6f2a93fdff2276235b357d6e491385af8a84ab8e0193905f6d49f356');
assert.equal(sha(readFileSync(join(website,'tests/fixtures/current-atlas-delivery.json'))),
 '3e69cdcae68524ad65a6b542fa7c7d51180c676a3f43b187dcb39d55de95ddeb');
const fa='fa1bf9a233c6989fef42b533bbbac9d6ab034311';
const current='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
const tree='e9165d7122361f809a267af1414b337b69097fe2';
const review='ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59';
const independent='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const oldPin=JSON.parse(readOld('current-atlas-delivery.json.raw'));
const pinBytes=read('tests/fixtures/current-atlas-delivery.json');
const pin=historicalReviewAe84Pin(readLive);
const changedDocuments=[
 'atlas-review/manifest.json','atlas-review/integration-inputs.json',
 'public/atlas-review-viewer/manifest.json','lib/atlas-model-inventory.json',
 'public/atlas-runtime/head-neck/manifest.json','public/atlas-runtime/head-neck/source-inputs.json',
];
const addedBindings=[
 'atlas-review/content/colic-artery-ultrasound.ts','atlas-review/lib/colic-artery-ultrasound.ts',
];
const changedBindings=[
 'atlas-review/app/body-content.ts','atlas-review/content/body-review-display-pins.json',
 'atlas-review/content/regional-teaching/abdomen.json','docs/anatomy-coverage/index.json',
 'lib/anatomy-coverage-view.ts','scripts/import-clinical-review.mjs',
];
const addedImports=['lib/colic-artery-ultrasound.ts','content/colic-artery-ultrasound.ts'];
const changedImports=[
 'app/body-content.ts','content/body-renderer-revision.json','content/review-revisions.json',
 'content/body-review-display-pins.json','content/regional-teaching/abdomen.json',
];
const ids=[
 'vm:anatomy:body:abdomen:midline:vessel:middle-colic-artery',
 'vm:anatomy:body:abdomen:right:vessel:right-colic-artery',
];
const delivery=await import(pathToFileURL(join(website,'tests/current-atlas-delivery.mjs')).href);
const currentDelivery=await import(pathToFileURL(join(currentWebsite,'tests/current-atlas-delivery.mjs')).href);

test('corrected 6d7 current pin admits exact clean source and keeps fa1 as history',()=>{
 assert.equal(sha(pinBytes),'3e69cdcae68524ad65a6b542fa7c7d51180c676a3f43b187dcb39d55de95ddeb');
 assert.equal(pin.schema,'vm-current-atlas-test-delivery-2');
 assert.equal(pin.source,current);assert.equal(pin.sourceTree,tree);
 assert.equal(pin.reviewIntegration,review);assert.equal(pin.reviewSourceFiles,1558);
 assert.equal(pin.viewerFiles,46);assert.equal(pin.viewerPackages,22);
 assert.deepEqual(pin.runtimeSources,{'head-neck':current,shoulder:independent,
  'lower-limb':independent,'female-pelvis':independent});
 assert.deepEqual(Object.keys(pin.documents),Object.keys(oldPin.documents));
 assert.deepEqual(Object.keys(pin.documents).filter(path=>pin.documents[path]!==oldPin.documents[path]),changedDocuments);
 for(const path of Object.keys(pin.documents)){
  const old=readOld('documents/'+path+'.raw'),now=read(path);
  assert.equal(sha(old),oldPin.documents[path],path+' fa1');
  assert.equal(sha(now),pin.documents[path],path+' current');
  if(!changedDocuments.includes(path))assert(now.equals(old),path+' independent runtime bytes');
 }
 assert.equal(delivery.CURRENT_ATLAS_REVISION,current);
 assert.deepEqual(delivery.validateCurrentAtlasDelivery({pin,read}),pin);
 authenticateColicRoleContext({pin,read,source});
 const git=(...args)=>execFileSync('git',['-C',source,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
 assert.equal(git('rev-parse','HEAD'),current);assert.equal(git('rev-parse','HEAD^{tree}'),tree);
 assert.equal(git('status','--porcelain=v1'),'');
 const historicalRoot=execFileSync(process.execPath,['--input-type=module','-e',
  `import {currentAtlasDeliveryRoot} from ${JSON.stringify(pathToFileURL(join(website,'tests/current-atlas-delivery.mjs')).href)};process.stdout.write(currentAtlasDeliveryRoot());`],
  {encoding:'utf8',windowsHide:true,env:{...process.env,VM_ATLAS_SOURCE_REPO:source,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
 assert.equal(realpathSync(historicalRoot),realpathSync(source));
 assert.throws(()=>delivery.validateCurrentAtlasDelivery({pin:oldPin,read}),
  'Complete prior fa1 pin cannot silently become current 6d7 admission');
});

test('Review adds exactly two source files and binding inputs; all former declarations persist',()=>{
 const before=JSON.parse(readOld('documents/atlas-review/integration-inputs.json.raw'));
 const after=JSON.parse(read('atlas-review/integration-inputs.json'));
 assert.equal(before.sha256,oldPin.reviewIntegration);assert.equal(after.sha256,review);
 assert.equal(before.inputs.length,1719);assert.equal(after.inputs.length,1721);
 const prior=new Map(before.inputs.map(row=>[row.path,row.sha256]));
 assert.deepEqual(after.inputs.filter(row=>!prior.has(row.path)).map(row=>row.path),addedBindings);
 assert.deepEqual(after.inputs.filter(row=>prior.has(row.path)&&prior.get(row.path)!==row.sha256).map(row=>row.path),changedBindings);
 for(const row of before.inputs){
  const old=changedBindings.includes(row.path)?readOld('binding-inputs/'+row.path+'.raw'):read(row.path);
  assert.equal(sha(old),row.sha256,row.path+' fa1 source byte');
 }
 for(const row of after.inputs)assert.equal(sha(read(row.path)),row.sha256,row.path+' current source byte');
 const oldReview=JSON.parse(readOld('documents/atlas-review/manifest.json.raw'));
 const newReview=JSON.parse(read('atlas-review/manifest.json'));
 assert.equal(oldReview.files.length,1556);assert.equal(newReview.files.length,1558);
 const priorFiles=new Map(oldReview.files.map(row=>[row.path,row]));
 assert.deepEqual(newReview.files.filter(row=>!priorFiles.has(row.path)).map(row=>row.path),addedImports);
 assert.deepEqual(newReview.files.filter(row=>priorFiles.has(row.path)&&
  row.importedSha256!==priorFiles.get(row.path).importedSha256).map(row=>row.path),changedImports);
 for(const row of newReview.files){
  assert.equal(sha(read('atlas-review/'+row.path)),row.importedSha256,row.path+' imported byte');
  if(priorFiles.has(row.path)){
   const old=changedImports.includes(row.path)?readOld('imported-sources/'+row.path+'.raw'):read('atlas-review/'+row.path);
   assert.equal(sha(old),priorFiles.get(row.path).importedSha256,row.path+' old import authenticated');
   if(!changedImports.includes(row.path))assert.equal(row.importedSha256,priorFiles.get(row.path).importedSha256,row.path+' old import retained');
  }
  else assert.equal(sha(readFileSync(join(source,row.path))),row.sourceSha256,row.path+' new source byte');
 }
 const oldInventory=JSON.parse(readOld('documents/lib/atlas-model-inventory.json.raw'));
 const inventory=JSON.parse(read('lib/atlas-model-inventory.json'));
 assert.deepEqual(inventory.models,oldInventory.models,'All 137 models and 144 paths unchanged');
 assert.deepEqual(inventory.sources.filter(row=>row.module!=='head-neck'),
  oldInventory.sources.filter(row=>row.module!=='head-neck'),'Three independent runtime families unchanged');
});

test('only the two exact colic US lessons and review packets change; coverage facts remain',()=>{
 const oldAbdomen=JSON.parse(readOld('binding-inputs/atlas-review/content/regional-teaching/abdomen.json.raw'));
 const abdomen=JSON.parse(read('atlas-review/content/regional-teaching/abdomen.json'));
 assert.equal(oldAbdomen.entries.length,74);assert.equal(abdomen.entries.length,74);
 assert.deepEqual(abdomen.entries.map(row=>row.identity),oldAbdomen.entries.map(row=>row.identity));
 assert.deepEqual(abdomen.entries.filter((row,i)=>JSON.stringify(row)!==JSON.stringify(oldAbdomen.entries[i]))
  .map(row=>JSON.parse(row.identity).id),ids);
 for(const id of ids){
  const at=abdomen.entries.findIndex(row=>JSON.parse(row.identity).id===id);
  const before=oldAbdomen.entries[at],after=abdomen.entries[at];
  assert.equal(before.lessons.ultrasound.readiness,'pending');
  assert.equal(after.lessons.ultrasound.readiness,'draft');
  assert.deepEqual(Object.fromEntries(Object.entries(after.lessons).filter(([key])=>key!=='ultrasound')),
   Object.fromEntries(Object.entries(before.lessons).filter(([key])=>key!=='ultrasound')),id+' other tabs');
  assert.match(after.lessons.ultrasound.note,/radiologist review pending/i);
  assert.match(after.lessons.ultrasound.note,/No routine transabdominal/i);
  assert.match(after.lessons.ultrasound.note,/separate/i);
 }
 assert.match(abdomen.entries.find(row=>JSON.parse(row.identity).id===ids[0]).lessons.ultrasound.title,/Linear endoscopic ultrasound \(EUS\)/);
 assert.match(abdomen.entries.find(row=>JSON.parse(row.identity).id===ids[1]).lessons.ultrasound.title,/Intraoperative ultrasound \(IOUS\)/);
 const left='vm:anatomy:body:abdomen:left:vessel:left-colic-artery';
 assert.equal(abdomen.entries.find(row=>JSON.parse(row.identity).id===left).lessons.ultrasound.readiness,'pending');
 const oldPins=JSON.parse(readOld('binding-inputs/atlas-review/content/body-review-display-pins.json.raw'));
 const pins=JSON.parse(read('atlas-review/content/body-review-display-pins.json'));
 assert.equal(oldPins.pins.length,1104);assert.equal(pins.pins.length,1104);
 assert.deepEqual(pins.pins.filter((row,i)=>JSON.stringify(row)!==JSON.stringify(oldPins.pins[i])).map(row=>row.structureId),ids);
 const oldCoverage=JSON.parse(readOld('coverage-index.json.raw'));
 const coverage=JSON.parse(read('docs/anatomy-coverage/index.json'));
 assert.equal(oldCoverage.sourceRevision,fa);assert.equal(coverage.sourceRevision,current);
 for(const key of Object.keys(oldCoverage).filter(key=>!['sourceRevision','sourceArtifacts'].includes(key)))
  assert.deepEqual(coverage[key],oldCoverage[key],key+' unchanged coverage fact');
 assert.deepEqual(coverage.sourceArtifacts.map(row=>row.path),oldCoverage.sourceArtifacts.map(row=>row.path));
});

test('wrong-family, stale-Review, missing-document and private additions are refused',()=>{
 for(const family of ['shoulder','lower-limb','female-pelvis']){
  const bad=structuredClone(pin);bad.runtimeSources[family]=current;
  assert.throws(()=>delivery.validateCurrentAtlasDelivery({pin:bad,read}),family);
 }
 const stale=structuredClone(pin);stale.reviewIntegration=oldPin.reviewIntegration;
 assert.throws(()=>delivery.validateCurrentAtlasDelivery({pin:stale,read}));
 const missing=structuredClone(pin);delete missing.documents['atlas-review/manifest.json'];
 assert.throws(()=>delivery.validateCurrentAtlasDelivery({pin:missing,read}));
 const foreign=structuredClone(pin);foreign.documents['.env.local']='0'.repeat(64);
 assert.throws(()=>delivery.validateCurrentAtlasDelivery({pin:foreign,read}));
});

test('current 0d975 successor admits exact source while rejecting the historical colic pin',()=>{
 const latest=currentDelivery.validateCurrentAtlasDelivery();
 assert.equal(latest.source,'0d9750af66d92aa5a421b34ac6d0c8dd3e5bfd66');
 assert.equal(latest.sourceTree,'495d07f5d9aff482dae7c9c30a962acaa7947b50');
 assert.equal(latest.reviewIntegration,'3b6be0f5de52aef8de09e40ac8126aa6ade717d97246d1fbb5dd04012ed25fad');
 assert.equal(latest.reviewSourceFiles,1683);
 assert.equal(latest.viewerFiles,63);assert.equal(latest.viewerPackages,24);
 assert.deepEqual(latest.runtimeSources,{'head-neck':latest.source,
  shoulder:'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3',
  'lower-limb':'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3',
  'female-pelvis':'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3'});
 const configuredCurrent=resolve(process.env.VM_ATLAS_SOURCE_REPO ?? 'F:/VisibleMedicine/atlas');
 assert.equal(realpathSync(currentDelivery.currentAtlasDeliveryRoot()),realpathSync(configuredCurrent));
 const currentGit=(...args)=>execFileSync('git',['-C',configuredCurrent,...args],
  {encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
 assert.equal(currentGit('rev-parse','HEAD'),latest.source);
 assert.equal(currentGit('rev-parse','HEAD^{tree}'),latest.sourceTree);
 assert.equal(currentGit('status','--porcelain=v1'),'');
 const readCurrent=path=>readFileSync(join(currentWebsite,path));
 authenticateColicRoleContext({pin:latest,read:readCurrent,source:configuredCurrent});
 assert.throws(()=>currentDelivery.validateCurrentAtlasDelivery({pin,root:currentWebsite}),
  'The exact historical 6d7 pin cannot admit the 0d975 website');
 const review=JSON.parse(readFileSync(join(currentWebsite,'atlas-review/manifest.json')));
 assert.equal(review.revision,latest.source);assert.equal(review.files.length,latest.reviewSourceFiles);
 for(const row of review.files)assert.equal(sha(readFileSync(join(currentWebsite,'atlas-review',row.path))),row.importedSha256,row.path);
 for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){
  const manifest=JSON.parse(readFileSync(join(currentWebsite,'public/atlas-runtime',name,'manifest.json')));
  assert.equal(manifest.sourceCommit,latest.runtimeSources[name]);assert.equal(manifest.patientDataIncluded,false);
  assert.equal(manifest.clinicalApproved,false);
 }
 const earlier=JSON.parse(read('atlas-review/content/regional-teaching/abdomen.json'));
 const later=JSON.parse(readFileSync(join(currentWebsite,'atlas-review/content/regional-teaching/abdomen.json')));
 for(const id of ids){
  const lesson=(catalog)=>catalog.entries.find(row=>JSON.parse(row.identity).id===id)?.lessons.ultrasound;
  assert.deepEqual(lesson(later),lesson(earlier),id+' retains the exact admitted colic teaching');
  assert.equal(lesson(later).readiness,'draft');
  assert.match(lesson(later).note,/radiologist review pending/i);
 }
});
