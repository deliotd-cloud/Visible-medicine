// Exact historical roots run against retained source epochs; current delivery is checked separately.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {isAbsolute,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const currentSite=fileURLToPath(new URL('../',import.meta.url));
const currentSource='c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const lanes={
 'clinical-review-short-ciliary-quiz.test.ts':{
  site:'F:/VisibleMedicine/staging/20261030-release-repair-website/website',
  atlas:'F:/VisibleMedicine/staging/20261030-spleen-native/atlas',
  source:'9cef8900417bf592d3130f6ff92bf3e748cb55fc',tree:'3d71e1e991e8a6cb69e6fac6f085c87ede58afd0',
  receipt:'F:/VisibleMedicine/recovery/checkpoints/20261030-release-repair-verified/SOURCE_CANDIDATE.json',
  receiptSha:'a8df01e3e7a03a0d6fae4eea50526385ca52cc865a6f6f6968f2ba5b023cbacd',
  pinSha:'7b14a7455de0b87e781192d5b1072c9c17c42ab5611c96247a0e7e677b416ac8',
  testSha:'a8a605b6328d8c49d5515d949207921647361e8ac76e640d9c5217c6efd7977f',cases:3,
  currentFiles:{'tests/clinical-review-short-ciliary-quiz.test.ts':'9e7276661973cc4ea1a2f9cab4aa3a5719c97f60edcee61cc7e880e89d3b502d'},
 },
 'head-study-set-display-epoch.test.mjs':{
  site:'F:/VisibleMedicine/staging/20261024-head-study-set-website/website',
  atlas:'F:/VisibleMedicine/staging/20261024-cervical-vascular-draft/atlas',
  source:'b79e110d2d28f18993263926ba35aa7a3f478b20',tree:'0dd97cc55ef9aff3493b91752309d1d661c0b0c8',
  receipt:'F:/VisibleMedicine/staging/20261024-head-study-set-website/SOURCE_BOUND.json',
  receiptSha:'37ea31d0ab36e57311e11dcdb9c01a93770220cbf8c40d439fa35b08aff9c968',
  pinSha:'b1c63fae40fba94266866b6392e7bc50c520fcfcb1e56d65ca2c24e914bf295e',
  testSha:'7affdcc8b4d3c29ef942df8145fa5d756412391fd870cd4f50a4684c546599d4',cases:4,
  currentFiles:{'tests/head-study-set-display-epoch.test.mjs':'b2705a9dde80aa2686485565fe4f094627d408fe8da1510110b1f6a24b915876'},
 },
 'head-study-set-website-composition.test.mjs':{
  site:'F:/VisibleMedicine/staging/20261024-head-study-set-website/website',
  atlas:'F:/VisibleMedicine/staging/20261024-cervical-vascular-draft/atlas',
  source:'b79e110d2d28f18993263926ba35aa7a3f478b20',tree:'0dd97cc55ef9aff3493b91752309d1d661c0b0c8',
  receipt:'F:/VisibleMedicine/staging/20261024-head-study-set-website/SOURCE_BOUND.json',
  receiptSha:'37ea31d0ab36e57311e11dcdb9c01a93770220cbf8c40d439fa35b08aff9c968',
  pinSha:'b1c63fae40fba94266866b6392e7bc50c520fcfcb1e56d65ca2c24e914bf295e',
  testSha:'49a7b31cf1aa3721b3e0e1947d96ee9239e2c3232fb2f0365c175df82d9bb7dc',cases:1,
  currentFiles:{'tests/head-study-set-website-composition.test.mjs':'5dc556d90ad379071256b61e39a67f06b3d8a6fb2861ce4aa937885e598b5238'},
 },
 'imaging-presentation.test.mjs':{
  site:'F:/VisibleMedicine/staging/20261022-head-practice-exit-candidate/website',
  atlas:'F:/VisibleMedicine/staging/20261022-review-traversal-candidate/atlas',
  source:'2381efe43b75f8a7fb768a069eecd7268c508dac',tree:'db21ed3dee259c390878450b3495468996a3af85',
  receipt:'F:/VisibleMedicine/staging/20261022-head-practice-exit-candidate/SOURCE_V2.json',
  receiptSha:'d388db43518ff7ccd443a8e7977e7ac67b2f49a696eb294529992ba64fc4132d',
  pinSha:'9313b2135cb50648751e50e49643479ec8bf83f2fe4f787bc2c25d4a632302a1',
  testSha:'9f118da67ed3d535d5d3611b034eeac97306b4dccd5208f09b22c48b02931383',cases:7,
  currentFiles:{'components/HeadAtlasViewer.tsx':'65407ec32882f84f215f0df3210b0c632452592a0cef63b5c76eb3849c85d159',
   'tests/imaging-presentation.test.mjs':'b8759b92109408ad937727b029b667e3d698d17dcefb8d0194995a5ec81dc5e2'},
 },
};
function git(atlas,...args){return execFileSync('git',['-C',atlas,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}}).trim();}
function authenticate(name,lane){
 const original=join(lane.site,'tests',name),testBytes=readFileSync(original);
 assert.equal(sha(testBytes),lane.testSha,'Exact original test body: '+name);
 const pinBytes=readFileSync(join(lane.site,'tests/fixtures/current-atlas-delivery.json'));
 assert.equal(sha(pinBytes),lane.pinSha,'Historical delivery pin: '+name);
 assert.equal(JSON.parse(pinBytes).source,lane.source,'Historical source pin: '+name);
 const receiptBytes=readFileSync(lane.receipt);
 assert.equal(sha(receiptBytes),lane.receiptSha,'Historical website receipt: '+name);
 const receipt=JSON.parse(receiptBytes);
 assert.equal(resolve(receipt.website),resolve(lane.site));
 assert.equal(resolve(receipt.atlas),resolve(lane.atlas));
 assert.equal(receipt.atlasHead,lane.source);assert.equal(receipt.atlasTree,lane.tree);
 const seen=new Set();
 for(const row of receipt.sourceRows){
  assert(!seen.has(row.path),'Duplicate receipt path');seen.add(row.path);
  assert(!isAbsolute(row.path)&&!row.path.includes(':')&&
   row.path.split(/[\\/]/).every(part=>part&&part!=='.'&&part!=='..'),'Unsafe receipt path');
  const file=readFileSync(join(lane.site,row.path));
  assert.equal(file.length,row.bytes,row.path);assert.equal(sha(file),row.sha256,row.path);
 }
 assert.equal(git(lane.atlas,'rev-parse','HEAD'),lane.source);
 assert.equal(git(lane.atlas,'rev-parse','HEAD^{tree}'),lane.tree);
 assert.equal(git(lane.atlas,'status','--porcelain=v1'),'','Historical Atlas checkout changed');
 return testBytes;
}
function terminalCounts(tap,cases){
 const expected={tests:cases,pass:cases,fail:0,cancelled:0,skipped:0,todo:0};
 for(const [key,value] of Object.entries(expected)){
  const matches=[...tap.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];
  assert.equal(matches.length,1,'One terminal '+key);assert.equal(Number(matches[0][1]),value,key);
 }
 assert(!/^not ok \d+/m.test(tap),'An original historical case failed');
}
export function readPartition6HistoricalTest(name){
 assert(Object.hasOwn(lanes,name),'Undeclared historical root');
 assert.equal(resolve(process.cwd()),resolve(currentSite),'Run from the current website');
 const admitted=validateCurrentAtlasDelivery();
 assert.equal(CURRENT_ATLAS_REVISION,currentSource);assert.equal(admitted.source,currentSource);
 assert.equal(admitted.runtimeSources['head-neck'],currentSource);
 assert.equal(admitted.viewerFiles,54);assert.equal(admitted.viewerPackages,24);
 const lane=lanes[name];
 for(const [path,expected] of Object.entries(lane.currentFiles))
  assert.equal(sha(readFileSync(join(currentSite,path))),expected,'Current delivered source: '+path);
 return authenticate(name,lane);
}
export function replayPartition6History(name){
 const lane=lanes[name],bytes=readPartition6HistoricalTest(name);
 const env={...process.env,VM_ATLAS_SOURCE_REPO:lane.atlas,ATLAS_SOURCE_REPO:lane.atlas,
  VM_WEBSITE_ROOT:lane.site,GIT_NO_REPLACE_OBJECTS:'1'};
 delete env.VM_CURRENT_SOURCE_RECEIPT;delete env.VM_CURRENT_SOURCE_SHA256;delete env.NODE_TEST_CONTEXT;
 const run=spawnSync(process.execPath,['--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',join(lane.site,'tests',name)],
  {cwd:lane.site,env,encoding:'utf8',windowsHide:true,shell:false,maxBuffer:64e6});
 assert.equal(run.error,undefined,String(run.error));assert.equal(run.signal,null);
 assert.equal(run.status,0,run.stderr+'\n'+run.stdout);
 terminalCounts(run.stdout,lane.cases);
 assert.deepEqual(authenticate(name,lane),bytes,'Historical source changed during replay');
 return {originalCases:lane.cases,source:lane.source,current:currentSource,testBytes:bytes};
}

// This older test hardcodes the moving canonical Atlas and predates its focus
// harness. Preserve its exact source witness; execute the full current harness.
// This is deliberately not reported as a passing historical execution.
export function verifyPartition6CurrentShortCiliary(){
 const name='clinical-review-short-ciliary-quiz.test.ts',original=readPartition6HistoricalTest(name);
 const current=readFileSync(join(currentSite,'tests',name));
 const env={...process.env,VM_WEBSITE_ROOT:currentSite};delete env.NODE_TEST_CONTEXT;
 const run=spawnSync(process.execPath,['--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',join(currentSite,'tests',name)],
  {cwd:currentSite,env,encoding:'utf8',windowsHide:true,shell:false,maxBuffer:64e6});
 assert.equal(run.error,undefined,String(run.error));assert.equal(run.signal,null);assert.equal(run.status,0,run.stderr+'\n'+run.stdout);terminalCounts(run.stdout,3);
 assert.deepEqual(readFileSync(join(currentSite,'tests',name)),current,'Current short-ciliary test changed');
 assert.deepEqual(readPartition6HistoricalTest(name),original,'Preserved source witness changed');
 return {testBytes:original,currentCases:3,historicalExecuted:false};
}
