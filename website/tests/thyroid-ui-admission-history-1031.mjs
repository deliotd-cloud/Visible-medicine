// Exact retained 2381 admission, followed by a distinct current C32 delivery check.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {isAbsolute,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const stage='F:/VisibleMedicine/staging/20261022-current-source-closure-assurance';
const site=join(stage,'website');
const atlas='F:/VisibleMedicine/staging/20261022-review-traversal-candidate/atlas';
const receiptPath=join(stage,'SOURCE_V2.json');
const receiptSha='92403824dc9ebcce2f8efe6bb02ed10db642ab646fbdc9cff983d48cfe9a0a07';
const source='2381efe43b75f8a7fb768a069eecd7268c508dac';
const tree='db21ed3dee259c390878450b3495468996a3af85';
const current='c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3';
const currentTree='d7ead7f3673ddf5c4b68db755b559b08b921eec6';
const original={
 thyroid:['inferior-thyroid-mra-current-delivery.test.mjs','7f28ac68d9e7ac522b20b9122c9760ba497c61775238fc952d8ff4541990e618'],
 ui:['ui-teaching-admission-contract.test.mjs','b57e611a7ee77263da554141708e3d3acc5bd8da2aed2664b19a185f6e41f3ab'],
};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}}).trim();
function authenticate(kind){
 const [name,hash]=original[kind]??[];assert(name,'Known admission');
 const receiptBytes=readFileSync(receiptPath);
 assert.equal(sha(receiptBytes),receiptSha,'Retained source receipt');
 const receipt=JSON.parse(receiptBytes);
 assert.equal(resolve(receipt.website),resolve(site));assert.equal(resolve(receipt.atlas),resolve(atlas));
 assert.equal(receipt.atlasHead,source);assert.equal(receipt.atlasTree,tree);
 assert.equal(receipt.review,'1a48d6bc674a007b4e6be7ebdb777810ca0f2ee3e373d58b53d22a43ba9babfc');
 assert.equal(receipt.boundInputs,1729);assert.equal(receipt.importedSources,1562);
 const seen=new Set();
 for(const row of receipt.sourceRows){
  assert(!seen.has(row.path),'Duplicate historical path');seen.add(row.path);
  assert(!isAbsolute(row.path)&&!row.path.includes(':')&&row.path.split(/[\\/]/).every(part=>part&&part!=='.'&&part!=='..'),'Unsafe historical path');
  const bytes=readFileSync(join(site,row.path));
  assert.equal(bytes.length,row.bytes,row.path);assert.equal(sha(bytes),row.sha256,row.path);
 }
 assert.equal(sha(readFileSync(join(site,'tests',name))),hash,'Original complete root');
 assert.equal(git(atlas,'rev-parse','HEAD'),source);assert.equal(git(atlas,'rev-parse','HEAD^{tree}'),tree);
 assert.equal(git(atlas,'status','--porcelain=v1'),'','Retained Atlas changed');
 const pin=JSON.parse(readFileSync(join(site,'tests/fixtures/current-atlas-delivery.json')));
 assert.equal(pin.source,source);assert.equal(pin.sourceTree,tree);
 assert.equal(pin.reviewIntegration,receipt.review);assert.equal(pin.reviewSourceFiles,1562);
 return name;
}
export function replayAdmissionEpoch(kind){
 const currentSite=fileURLToPath(new URL('../',import.meta.url));
 assert.notEqual(resolve(currentSite),resolve(site),'Replay is only for successor website');
 const name=authenticate(kind);
 const env={...process.env,VM_ATLAS_SOURCE_REPO:atlas,ATLAS_SOURCE_REPO:atlas,VM_WEBSITE_ROOT:site,GIT_NO_REPLACE_OBJECTS:'1'};
 delete env.VM_CURRENT_SOURCE_RECEIPT;delete env.VM_CURRENT_SOURCE_SHA256;delete env.NODE_TEST_CONTEXT;
 const run=spawnSync(process.execPath,['--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',join(site,'tests',name)],
  {cwd:site,env,encoding:'utf8',windowsHide:true,shell:false,maxBuffer:64e6});
 assert.equal(run.error,undefined,String(run.error));assert.equal(run.signal,null);assert.equal(run.status,0,run.stderr+'\n'+run.stdout);
 for(const [field,count] of Object.entries({tests:2,pass:2,fail:0,cancelled:0,skipped:0,todo:0})){
  const matches=[...run.stdout.matchAll(new RegExp('^# '+field+' (\\d+)\\r?$','gm'))];
  assert.equal(matches.length,1,'One terminal '+field);assert.equal(Number(matches[0][1]),count,field);
 }
 assert(!/^not ok \d+/m.test(run.stdout));
 authenticate(kind);
}
export async function checkCurrentAdmission(kind,pin,atlasRoot){
 assert(original[kind]);
 assert.equal(pin.source,current);assert.equal(pin.sourceTree,currentTree);
 assert.equal(git(atlasRoot,'rev-parse','HEAD'),current);
 assert.equal(git(atlasRoot,'rev-parse','HEAD^{tree}'),currentTree);
 assert.equal(git(atlasRoot,'merge-base',source,current),source,'Historical source precedes C32');
 assert.equal(pin.reviewIntegration,'d98623af51b216359fdd7385148ca0beaa46f0c3866ae9f867202a48770d5799');
 assert.equal(pin.reviewSourceFiles,1647);
 for(const module of ['head-neck','shoulder','lower-limb','female-pelvis'])assert.equal(pin.runtimeSources[module],current);
 const root=fileURLToPath(new URL('../',import.meta.url));
 const review=JSON.parse(readFileSync(join(root,'atlas-review/manifest.json')));
 const inputs=JSON.parse(readFileSync(join(root,'atlas-review/integration-inputs.json')));
 assert.equal(review.revision,current);assert.equal(review.files.length,1647);
 assert.equal(inputs.sourceCommit,current);assert.equal(inputs.sha256,pin.reviewIntegration);
 assert.equal(inputs.inputs.length,1862,'Exact C32 input count');
 assert.equal(inputs.inputs.length,new Set(inputs.inputs.map(row=>row.path)).size,'Unique current inputs');
 for(const row of inputs.inputs){
  assert(!isAbsolute(row.path)&&!row.path.includes(':')&&row.path.split(/[\\/]/).every(part=>part&&part!=='.'&&part!=='..'),'Unsafe current input path');
  assert.equal(sha(readFileSync(join(root,row.path))),row.sha256,row.path);
 }
 const prior=JSON.parse(readFileSync(join(site,'tests/fixtures/current-atlas-delivery.json')));
 assert.notEqual(prior.source,pin.source);assert.notEqual(prior.reviewIntegration,pin.reviewIntegration);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:prior}),'Stale 2381 pin refused');
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,reviewIntegration:'0'.repeat(64)}}),'Forged integration refused');
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,documents:{...pin.documents,'atlas-review/manifest.json':'0'.repeat(64)}}}),'Forged document refused');
 // A historical producer must never be admitted as the current delivery.
 const currentPin=JSON.parse(readFileSync(join(root,'tests/fixtures/current-atlas-delivery.json')));
 assert.deepEqual(currentPin,pin);
 if(kind==='thyroid'){
  const path='content/arterial-evidence-limits.ts';
  const committed=execFileSync('git',['-C',atlasRoot,'show',`${current}:${path}`],{windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  const row=review.files.find(item=>item.path===path);assert(row);
  assert.equal(row.sourceSha256,sha(committed));assert.equal(row.importedSha256,sha(committed));
  assert.deepEqual(readFileSync(join(root,'atlas-review',path)),committed);
  const historical=execFileSync('git',['-C',atlasRoot,'show',`87ed7e343260c7df48a40d53503f25bbfd34cfa5:${path}`],{windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  assert.deepEqual(committed,historical,'MRA topic retained byte exact');
  const requireSite=createRequire(join(root,'package.json'));
  const {build}=requireSite('esbuild');
  const entry=[
   "export {bodyLesson} from './atlas-review/app/body-content';",
   "export {arterialEvidenceLimitLesson} from './atlas-review/lib/arterial-evidence-limits';",
  ].join('');
  const built=await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
  const imported=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
  const {exactSourceHistoryApi}=await import(pathToFileURL(join(atlasRoot,'scripts/exact-source-history-api.mjs')).href);
  const historicalApi=await exactSourceHistoryApi('87ed7e343260c7df48a40d53503f25bbfd34cfa5','review-security');
  const currentApi=await exactSourceHistoryApi(current,'review-security');
  const oldPins=JSON.parse(execFileSync('git',['-C',atlasRoot,'show','87ed7e343260c7df48a40d53503f25bbfd34cfa5:content/arterial-evidence-limits-pins.json'],{windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
  const livePins=JSON.parse(readFileSync(join(root,'atlas-review/content/arterial-evidence-limits-pins.json')));
  const selected=livePins.entries.filter(row=>row.family==='inferiorThyroidMri');
  const oldSelected=oldPins.entries.filter(row=>row.family==='inferiorThyroidMri');
  assert.equal(selected.length,2);assert.deepEqual(selected,oldSelected,'Two original identities and tabs retained');
  assert.deepEqual(selected.map(row=>[row.identity.laterality,row.identity.fmaId,row.tab]),[['left','FMA10680','mri'],['right','FMA10697','mri']]);
  for(const row of selected){
   const identity=row.identity,tab=row.tab;
   const lesson=historicalApi.bodyLesson(identity,tab);
   assert.equal(lesson.readiness,'pending');
   assert.deepEqual(currentApi.bodyLesson(identity,tab),lesson,'Current Git dispatcher retains historical pending MRA lesson');
   assert.deepEqual(imported.bodyLesson(identity,tab),lesson,'Current imported dispatcher retains historical pending MRA lesson');
   assert.deepEqual(imported.arterialEvidenceLimitLesson(identity,tab),lesson,'Current imported resolver retains historical pending MRA lesson');
   assert.equal(imported.arterialEvidenceLimitLesson({...identity,foreign:true},tab),undefined,'Forged identity refused');
   assert.equal(imported.arterialEvidenceLimitLesson(identity,'ct'),undefined,'Wrong tab refused');
  }
 }
}
