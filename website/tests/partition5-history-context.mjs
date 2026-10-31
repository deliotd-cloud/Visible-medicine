// Replay exact historical test bodies against their own retained delivery epochs.
// The current contract is checked independently before every replay.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync,execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {isAbsolute,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const currentSite=fileURLToPath(new URL('../',import.meta.url));
const currentSource='c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const lanes={
 'atlas-runtime-expansion-binding.test.mjs':{
  site:'F:/VisibleMedicine/staging/20261028-binder-final/website',
  atlas:'F:/VisibleMedicine/staging/20261027-quadriceps-tour/atlas',
  source:'44516d0ab85be6c6d6a3accec42b1e7372a0886b',tree:'751918d281359cef629b37288697e3a9beec4d3e',
  pinSha:'0a8226a96a8a490572c92750800c3a6aff3129f2711b3c75b92ab6d459e1ea5c',
  receipt:'F:/VisibleMedicine/staging/20261028-binder-final/SOURCE_CANDIDATE.json',
  receiptSha:'0a561e67bbc2c2942e043dd06d637c7d046a21b2eedb917d5c5a8bfed67f0469',
  testSha:'677c3de6998d62abde30e5a72935bf5742ad67d9140ef2af0dd21e8b69ebd7df',cases:4},
 'clinical-review-nasal-bone-surface-imaging.test.ts':{
  site:'F:/VisibleMedicine/staging/20261026-adjacent-composition-context-v2/website',
  atlas:'F:/VisibleMedicine/staging/20261025-nasal-bone-imaging-native/atlas',
  source:'7e2552a300df29faf346be146929ffc727880ec5',tree:'c756d5a038cca7d8fac429b908925c63915dc519',
  pinSha:'2f825bbe14328151d2f547bfce54ef679f9e8cfc7e42c0724bb9981f3a10556e',
  receipt:'F:/VisibleMedicine/staging/20261026-adjacent-composition-context-v2/SOURCE_CANDIDATE.json',
  receiptSha:'b94cfe0f5ba7183b4a2316d34cc08d3ab8847ecd8f68e97185184476d186727f',
  testSha:'f549a6b815fc91c83a1faa04600cb69e694461fa47496ffa1c6bc37ba7599bc2',cases:1},
 'colic-fa1-historical-closure.test.mjs':{
  site:'F:/VisibleMedicine/staging/20261021-body-learning-website-candidate/website',
  atlas:'F:/VisibleMedicine/staging/20261021-body-learning-website-candidate/atlas',
  source:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',tree:'e9165d7122361f809a267af1414b337b69097fe2',
  pinSha:'3e69cdcae68524ad65a6b542fa7c7d51180c676a3f43b187dcb39d55de95ddeb',
  testSha:'876b8724409357c48ba44fb88fe467be04b53ff27a62c7b618a3b15d72be64b8',cases:2},
 'current-atlas-delivery-help-transition.test.mjs':{
  site:'F:/VisibleMedicine/staging/20261026-current-delivery-advance/website',
  atlas:'F:/VisibleMedicine/staging/20261025-regional-title-native/atlas',
  source:'a01ea4a00740dee0905204a33893761b8ae1ff1e',tree:'362941c8dd6348d985622c4a21686bbf14c135f7',
  pinSha:'d2f9892e3e7f32552d546098b438cad2e6242f8d1652b4a432809f964a5ed9bb',
  receipt:'F:/VisibleMedicine/staging/20261026-current-delivery-advance/SOURCE_CANDIDATE.json',
  receiptSha:'9da49fa0b687608c86fdee92459eb3693b39426789fbe6e86595f1ff18a03e43',
  testSha:'eb306c49103e818e72c5390ac0c7cfac898dd8a370fb7c5edd059780bdb7aef3',cases:4},
};

function git(atlas,...args){return execFileSync('git',['-C',atlas,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}}).trim();}
function authenticate(name,lane){
 const original=join(lane.site,'tests',name);
 assert.equal(sha(readFileSync(original)),lane.testSha,'Exact original test body: '+name);
 const pinBytes=readFileSync(join(lane.site,'tests/fixtures/current-atlas-delivery.json'));
 assert.equal(sha(pinBytes),lane.pinSha,'Historical delivery pin: '+name);
 assert.equal(JSON.parse(pinBytes).source,lane.source,'Historical source pin: '+name);
 if(lane.receipt){
  const bytes=readFileSync(lane.receipt);
  assert.equal(sha(bytes),lane.receiptSha,'Historical website receipt: '+name);
  const receipt=JSON.parse(bytes);
  assert.equal(resolve(receipt.website),resolve(lane.site));
  assert.equal(resolve(receipt.atlas),resolve(lane.atlas));
  assert.equal(receipt.atlasHead,lane.source);
  assert.equal(receipt.atlasTree,lane.tree);
  const seen=new Set();
  for(const row of receipt.sourceRows){
   assert(!seen.has(row.path),'Duplicate receipt path');seen.add(row.path);
   assert(!isAbsolute(row.path)&&!row.path.includes(':')&&
    row.path.split(/[\\/]/).every(part=>part&&part!=='.'&&part!=='..'),'Unsafe receipt path');
   const file=readFileSync(join(lane.site,row.path));
   assert.equal(file.length,row.bytes,row.path);assert.equal(sha(file),row.sha256,row.path);
  }
 }
 assert.equal(git(lane.atlas,'rev-parse','HEAD'),lane.source);
 assert.equal(git(lane.atlas,'rev-parse','HEAD^{tree}'),lane.tree);
 assert.equal(git(lane.atlas,'status','--porcelain=v1'),'','Historical Atlas checkout changed');
}
function terminalCounts(tap,cases){
 const expected={tests:cases,pass:cases,fail:0,cancelled:0,skipped:0,todo:0};
 for(const [key,value] of Object.entries(expected)){
  const matches=[...tap.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];
  assert.equal(matches.length,1,'One terminal '+key);assert.equal(Number(matches[0][1]),value,key);
 }
 assert(!/^not ok \d+/m.test(tap),'An original historical case failed');
}
export function replayPartition5History(name){
 assert(Object.hasOwn(lanes,name),'Undeclared historical root');
 assert.equal(resolve(process.cwd()),resolve(currentSite),'Run from the current website');
 const admitted=validateCurrentAtlasDelivery();
 assert.equal(CURRENT_ATLAS_REVISION,currentSource);
 assert.equal(admitted.source,currentSource);
 assert.equal(admitted.runtimeSources['head-neck'],currentSource);
 assert.equal(admitted.viewerFiles,54);assert.equal(admitted.viewerPackages,24);
 const lane=lanes[name];authenticate(name,lane);
 const env={...process.env,VM_ATLAS_SOURCE_REPO:lane.atlas,ATLAS_SOURCE_REPO:lane.atlas,
  VM_WEBSITE_ROOT:lane.site,GIT_NO_REPLACE_OBJECTS:'1'};
 delete env.VM_CURRENT_SOURCE_RECEIPT;delete env.VM_CURRENT_SOURCE_SHA256;delete env.NODE_TEST_CONTEXT;
 const run=spawnSync(process.execPath,['--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',join(lane.site,'tests',name)],
  {cwd:lane.site,env,encoding:'utf8',windowsHide:true,shell:false,maxBuffer:64e6});
 assert.equal(run.error,undefined,String(run.error));assert.equal(run.signal,null);
 assert.equal(run.status,0,run.stderr+'\n'+run.stdout);
 terminalCounts(run.stdout,lane.cases);
 authenticate(name,lane);
 return {originalCases:lane.cases,source:lane.source,current:currentSource};
}
