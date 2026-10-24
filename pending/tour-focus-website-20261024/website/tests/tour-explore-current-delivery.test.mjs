import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {emittedTeachingSearch} from './atlas-emitted-teaching.ts';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

// The original 5e75 theorem executes against its immutable completed Website.
const site='F:/VisibleMedicine/staging/20261024-tour-explore-website/website';
const parent='F:/VisibleMedicine/staging/20261024-review-queue-short-desktop/website';
const parentReceipt='F:/VisibleMedicine/staging/20261024-review-queue-short-desktop/SOURCE_BOUND.json';
const nativeReceipt='F:/VisibleMedicine/staging/20261024-tour-explore/SOURCE_BOUND.json';
const atlas='F:/VisibleMedicine/staging/20261024-tour-explore/atlas';
const source='5e75b9ce7e46fed291748108edd7565c97dee101';
const tree='005b7656f517efbd86e32a282e3d7880fc052bfe';
const predecessor='aa13c067197cad87bd0a9b2da5549bc4b33bfdf7';
const modules=['head-neck','shoulder','lower-limb','female-pelvis'];
const changed=['app/body-explorer.tsx','app/regional-guided-learning.tsx','app/whole-body-guided-learning.tsx','lib/tour-explore.ts'];
const unchanged=['lib/reasoning-questions.ts','lib/lower-arterial-reasoning.ts','content/lower-arterial-reasoning-pins.json'];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=(base,path)=>readFileSync(resolve(base,path));
const json=path=>JSON.parse(readFileSync(path));
const native=path=>execFileSync('git',['show',`${source}:${path}`],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});

test('the native registered-stop source and exact four-module delivery share one new epoch',()=>{
 assert.equal(sha(readFileSync(nativeReceipt)),'c2bb9a2b66420a989cc6b0df029ba0eb97832168fe190992008f0801c7372854');
 assert.equal(sha(readFileSync(parentReceipt)),'41c2b65e9e163089cb5d6ae8d5190dce7b0c3d6affb751151111a5eb1845f2df');
 const receipt=json(nativeReceipt),baseline=json(parentReceipt);
 const pin=validateCurrentAtlasDelivery({
  pin:json(resolve(site,'tests/fixtures/current-atlas-delivery.json')),root:site
 });
 assert.equal(receipt.atlasHead,source);assert.equal(receipt.atlasTree,tree);
 assert.equal(receipt.parentHead,predecessor);assert.equal(baseline.atlasHead,predecessor);
 assert.deepEqual(receipt.changedAuthoredPaths,[
  'app/body-explorer.tsx','app/regional-guided-learning.tsx','app/whole-body-guided-learning.tsx',
  'scripts/test-whole-body-guided-learning.mjs','scripts/test-initial-regional-tour-picker.mjs',
  'scripts/test-renderer-review-scope.mjs']);
 assert.deepEqual(receipt.newPaths,['lib/tour-explore.ts','scripts/test-tour-explore.mjs']);
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:atlas,encoding:'utf8',windowsHide:true}).trim(),source);
 assert.equal(execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:atlas,encoding:'utf8',windowsHide:true}).trim(),tree);
 assert.equal(pin.source,source);assert.equal(pin.sourceTree,tree);
 for(const module of modules){
  const manifest=json(resolve(site,`public/atlas-runtime/${module}/manifest.json`));
  assert.equal(pin.runtimeSources[module],source,module);
  assert.equal(manifest.sourceCommit,source,module);
  assert.equal(manifest.patientDataIncluded,false,module);
  assert.notEqual(manifest.clinicalApproved,true,module);
 }
 const review=json(resolve(site,'atlas-review/manifest.json'));
 const binding=json(resolve(site,'atlas-review/integration-inputs.json'));
 const viewer=json(resolve(site,'public/atlas-review-viewer/manifest.json'));
 assert.equal(review.revision,source);assert.equal(binding.sourceCommit,source);
 assert.equal(review.websiteIntegrationSha256,binding.sha256);
 assert.equal(viewer.sourceCommit,source);assert.equal(viewer.personalRecordsIncluded,false);
 const old=json(resolve(parent,'tests/fixtures/current-atlas-delivery.json'));
 assert.equal(old.source,predecessor);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:old,root:site}));
 for(const path of changed){
  const bytes=native(path),imported=read(site,`atlas-review/${path}`);
  assert.equal(sha(bytes),receipt.sourceRows.find(row=>row.path===path)?.sha256,path);
  assert.equal(review.files.find(row=>row.path===path)?.sourceSha256,sha(bytes),path);
  assert.equal(review.files.find(row=>row.path===path)?.importedSha256,sha(imported),path);
  assert.equal(binding.inputs.find(row=>row.path===`atlas-review/${path}`)?.sha256,sha(imported),path);
  assert.equal(imported.toString().replaceAll('\r\n','\n').replaceAll('@/atlas-review/','@/'),
   bytes.toString().replaceAll('\r\n','\n'),`Only the documented local import prefix may change: ${path}`);
 }
 const learnerInputs=json(resolve(site,'public/atlas-runtime/head-neck/source-inputs.json'));
 for(const path of changed)assert.equal(learnerInputs.find(row=>row.path===path)?.sha256,sha(native(path)),`Learner ${path}`);
 const emitted=emittedTeachingSearch(resolve(site,'public/atlas-runtime/head-neck')+'/',json(resolve(site,'public/atlas-runtime/head-neck/manifest.json')).files);
 const protectedViewer=emittedTeachingSearch(resolve(site,'public/atlas-review-viewer')+'/',viewer.files);
 for(const needle of ['Explore this structure','Exit tour']){
  assert(emitted.includes(needle),`Learner omitted ${needle}`);
  assert(protectedViewer.includes(needle),`Review omitted ${needle}`);
 }
});

test('new tour action is scoped to an exact source stop and revokes guided playback',()=>{
 const engine=read(site,'atlas-review/lib/tour-explore.ts').toString();
 const player=read(site,'atlas-review/app/regional-guided-learning.tsx').toString();
 const library=read(site,'atlas-review/app/whole-body-guided-learning.tsx').toString();
 const explorer=read(site,'atlas-review/app/body-explorer.tsx').toString();
 for(const needle of ['registered.get(tour)','sourceCanonical(tour)','sourceCanonical(catalog)','request.catalog!==catalog','request.stepId!==step.id','sourceCanonical(request.sourceRecord)','regionalTourFrame(catalog,request.tour,request.stepIndex)'])
  assert(engine.includes(needle),`Exact tour source guard: ${needle}`);
 for(const needle of ['!isCurrentAction()','exploreConsumed.current','!active||!ready||playing','quickCheckOpen||document.hidden','pausedImaging?.suspend();revokePlayback();','Explore this structure','Exit tour'])
  assert(player.includes(needle),`Player transition: ${needle}`);
 assert(library.includes('request.tour===committedTour.current'));
 for(const needle of ['guidedScopeRetired.current','resolveTourExplore(current.catalog,current.region,request)','current.exam||current.inlineStudy','sourceScope.filter(s=>s.id===target.structure.id).length!==1','changeGuidedLearning(false,\'mode-switch\')','chooseWorkspaceMode(\'explore\')','applySelection(target.structure.id,false,sourceScope)','onExit={()=>changeGuidedLearning(false)}'])
  assert(explorer.includes(needle),`Explorer transfer or Exit: ${needle}`);
});

test('the new source retains exact existing reasoning, catalog and teaching scope',()=>{
 const receipt=json(nativeReceipt),baseline=json(parentReceipt);
 assert.equal(receipt.all1104CompleteWorksheetsAnd222Concepts404SessionsPreserved,true);
 assert.equal(receipt.modelsDependenciesLicencesSourceHoldsUnchanged,true);
 assert.equal(receipt.clinicalApproval,false);assert.equal(receipt.patientSpaceRegistration,false);
 assert.equal(receipt.installed,false);
 for(const path of unchanged){
  const old=baseline.sourceRows.find(row=>row.path===`atlas-review/${path}`);
  const now=read(site,`atlas-review/${path}`);
  assert(old,`Parent scope ${path}`);
  assert.equal(sha(now),old.sha256,`Existing teaching ${path}`);
 }
 assert.deepEqual(read(site,'atlas-review/public/models/bodyparts3d/full-body/catalog.json'),
  read(parent,'atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 const inventory=json(resolve(site,'lib/atlas-model-inventory.json'));
 const former=json(resolve(parent,'lib/atlas-model-inventory.json'));
 assert.deepEqual(inventory.models,former.models);
 assert.equal(inventory.models.length,137);
 assert.equal(inventory.models.flatMap(row=>row.paths).length,144);
});
