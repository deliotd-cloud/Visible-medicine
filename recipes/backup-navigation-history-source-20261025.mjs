import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {backup,read,json,sha} from './source-only-backup-20261019.mjs';

const stage='F:/VisibleMedicine/staging/20261025-navigation-history-website';
const sourceFile=stage+'/SOURCE_CANDIDATE.json',sourceSha='cf8bad61e8e33160f94be74994bf13c270c68dcdf395a9d040b5bdb5c2b164f5';
assert.equal(sha(read(sourceFile)),sourceSha);
const source=json(sourceFile),verificationFile=stage+'/VERIFICATION_SUMMARY.json',verification=json(verificationFile);
assert.equal(sha(read(verificationFile)),'123ba3a5a1e48c37206b2f7aa8ac002fd8292cabd7473b38b7f5db3e3d836bff');
assert(verification.passing&&verification.wholeCases===8&&verification.onlyOneMjsTestChanged);
const files=[];
function add(p,file,restore,expected){
  const b=read(file);assert(!b.includes(0));new TextDecoder('utf8',{fatal:true}).decode(b);
  if(expected)assert.equal(sha(b),expected);
  files.push({path:p,source:file,restore,bytes:b.length,sha256:sha(b)});
}
add('patches/HISTORY_BROWSER_RECIPE.json',verification.recovery.recipe.path,'coordination/HISTORY_BROWSER_RECIPE.json',verification.recovery.recipe.sha256);
for(const p of ['restore-source-recipe.mjs','run-navigation-regression-batch-20261025.mjs','prepare-navigation-history-website-20261025.mjs','seal-navigation-history-20261025.mjs','backup-navigation-history-source-20261025.mjs'])add('recipes/'+p,path.resolve(p),'coordination/'+p);
const priorFile='F:/VisibleMedicine/recovery/checkpoints/20261025-head-review-regression-source/SOURCE_SUPPLEMENT.json';
assert.equal(sha(read(priorFile)),'09764b1c295656403a05f4384ec21d604d7d448fe56da0dbf6b6bf6d050ad39b');
const prior=json(priorFile);assert.equal(sha(read(prior.receipt)),prior.sha256);
function verify(){
  assert.equal(sha(read(sourceFile)),sourceSha);
  assert.equal(sha(read(verificationFile)),'123ba3a5a1e48c37206b2f7aa8ac002fd8292cabd7473b38b7f5db3e3d836bff');
  assert.equal(sha(read(source.website+'/tests/head-view-history-client.test.mjs')),source.historyTestRepair.afterSha256);
  for(const r of files)assert.equal(sha(read(r.source)),r.sha256);
  const i=json('CURRENT_CHECKPOINT.json');assert.equal(i.goal.requirements,71);assert.equal(i.goal.optionalIdeas,8);assert.equal(i.activeWork.current.ownerPreviewPolicy.restartPermitted,false);assert.deepEqual(i.activeWork.current.activeExecutionSessions,[]);
}
verify();
const dir='F:/VisibleMedicine/recovery/checkpoints/20261025-navigation-history-source',target=dir+'-supplement';
assert(!fs.existsSync(dir));fs.mkdirSync(dir,{recursive:true});
const lookup=new Map(files.map(r=>[r.path,r.source])),bytes=files.reduce((n,r)=>n+r.bytes,0);
const result=backup({root:target,repo:'F:/VisibleMedicine/history/website-work/github-navigation-history-source-20261025.git',branch:'backup/navigation-history-source-20261025',files:files.map(({source,...r})=>r),bytesFor:p=>read(lookup.get(p)),sourceIdentity:{candidateReceiptSha256:sourceSha,changedTestSha256:source.historyTestRepair.afterSha256,requiresExactLocalBaselineSha256:source.parentSha256},scope:'Incremental source-only recovery: one exact-preimage browser-harness recipe plus mechanical restoration/check scripts. Requires the exact local baseline and preceding filtered source supplements. No complete medical test fixture, coordinates, generated Review data, raw QA, private configuration, scans, masks, models, dependencies, runtime, database, owner session or canonical/native Git ancestry is included. Not a complete website/private-data/runnable backup.',proof:{wholeUnfilteredRoots:2,wholeCases:8,originalAssertionExpressions:59,finalAssertionExpressions:71,allOriginalAssertionsPreserved:true,actualCompleteLocalRecipeRestorationVerified:true,priorTypeGraphInputsByteExact:6217,newTypeCheckOrBuildExecuted:false,priorSupplementBranch:prior.branch,priorSupplementHead:prior.head,incrementalOnly:true,fullStockSuitePassing:false,ownerPreviewChanged:false,privateDataUploaded:false,clinicalApproval:false},verifySource:verify});
const receipt=target+'/github-backup.json';
const supplement={schema:'vm-filtered-source-supplement/1',at:new Date().toISOString(),receipt,sha256:sha(read(receipt)),branch:result.branch,head:result.head,tree:result.tree,selectedPaths:files.length,restoredPaths:result.restoredPaths,selectedBytes:bytes,requiresPriorSupplement:{path:priorFile,sha256:sha(read(priorFile)),branch:prior.branch,head:prior.head},exactLocalBaselineRequired:true,incrementalOnly:true,wholePrivateOrRunnableBackup:false};
fs.writeFileSync(dir+'/SOURCE_SUPPLEMENT.json',JSON.stringify(supplement,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({supplement:dir+'/SOURCE_SUPPLEMENT.json',sha256:sha(read(dir+'/SOURCE_SUPPLEMENT.json')),branch:result.branch,head:result.head,tree:result.tree,selected:files.length,restored:result.restoredPaths,bytes}));
