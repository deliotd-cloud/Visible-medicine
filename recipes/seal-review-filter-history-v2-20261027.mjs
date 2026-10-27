import fs from 'node:fs';import assert from 'node:assert/strict';import {hash,json} from './bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-review-filter-scroll',oldFile=stage+'/SOURCE_CANDIDATE.json',old=json(oldFile),site=old.website,parent=json(old.parent);
assert.equal(hash(oldFile),'f4a60ba207766df6a54000080ab7dd90e3b4be15bb61cb89cf9e0a5dece7b024');
const wiring=['tests/inbox-deferred-return-source-role.mjs','tests/review-pager-inbox-history.mjs','tests/clinical-review-inbox-short-desktop.test.mjs','tests/clinical-review-inbox-return-pager-focus.test.mjs'];
const added=['tests/review-filter-scroll-source-role.mjs','tests/fixtures/review-filter-scroll-transition.json','tests/clinical-review-inbox-filter-history.test.mjs'];
for(const row of old.sourceRows)if(!wiring.includes(row.path))assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
for(const row of parent.sourceRows)assert.equal(hash(parent.website+'/'+row.path),row.sha256,row.path);
const paths=[...old.sourceRows.map(r=>r.path),...added].sort();assert.equal(new Set(paths).size,paths.length);
const current={...old,at:new Date().toISOString(),schema:'vm-review-filter-scroll-source/2',sourcePaths:paths.length,sourceRows:paths.map(path=>({path,bytes:fs.statSync(site+'/'+path).size,sha256:hash(site+'/'+path)})),changedPaths:[...old.changedPaths,...wiring],addedPaths:added,historicalTestRoleRepair:{originalSource:{path:oldFile,sha256:hash(oldFile)},failedRun:{path:stage+'/checks/tests-1/RESULT.json',sha256:hash(stage+'/checks/tests-1/RESULT.json')},reason:'Three historical diff assertions pinned earlier source. Exact hash-guarded transition restores only their historical input; original assertions are retained. Actual interaction tests still execute current component.',productSourceUnchangedSinceOriginalSeal:true},unrelatedTestsExact:true};
fs.writeFileSync(stage+'/SOURCE_CANDIDATE_V2.json',JSON.stringify(current,null,2)+'\n',{flag:'wx'});
let qa=fs.readFileSync('verify-review-filter-scroll-20261027.mjs','utf8').replaceAll('SOURCE_CANDIDATE.json','SOURCE_CANDIDATE_V2.json').replaceAll('CONTENT_QA.json','CONTENT_QA_V2.json');
qa=qa.replace('allOtherSourceAndTestsExact:true','allUnrelatedSourceAndTestsExact:true, historicalTestRoleRepair:s.historicalTestRoleRepair');
fs.writeFileSync('verify-review-filter-scroll-v2-20261027.mjs',qa,{flag:'wx'});
let runner=fs.readFileSync('run-review-filter-scroll-20261027.mjs','utf8').replaceAll('SOURCE_CANDIDATE.json','SOURCE_CANDIDATE_V2.json').replaceAll('CONTENT_QA.json','CONTENT_QA_V2.json').replaceAll('ACCEPTED.json','ACCEPTED_V2.json').replaceAll('verify-review-filter-scroll-20261027.mjs','verify-review-filter-scroll-v2-20261027.mjs');
runner=runner.replace('const roots=[','const roots=["tests/clinical-review-inbox-filter-history.test.mjs",');
fs.writeFileSync('run-review-filter-scroll-v2-20261027.mjs',runner,{flag:'wx'});
for(const name of ['build-review-filter-browser-20261027.mjs','finish-review-filter-scroll-20261027.mjs']){
 let text=fs.readFileSync(name,'utf8').replaceAll('SOURCE_CANDIDATE.json','SOURCE_CANDIDATE_V2.json').replaceAll('CONTENT_QA.json','CONTENT_QA_V2.json').replaceAll('ACCEPTED.json','ACCEPTED_V2.json').replaceAll('f4a60ba207766df6a54000080ab7dd90e3b4be15bb61cb89cf9e0a5dece7b024',hash(stage+'/SOURCE_CANDIDATE_V2.json')).replaceAll('tests.roots.length,19','tests.roots.length,20').replaceAll('across19 inbox roots','across20 inbox roots').replaceAll('focused19-root suite','focused20-root suite');
 if(name.startsWith('finish'))text=text.replace('const recipes=[','const recipes=["prepare-review-filter-history-20261027.py","seal-review-filter-history-v2-20261027.mjs","verify-review-filter-scroll-v2-20261027.mjs","run-review-filter-scroll-v2-20261027.mjs",').replace('unrelatedTestsExact:true,all1835','unrelatedTestsExact:true,historicalTestRoleRepair:s.historicalTestRoleRepair,all1835');
 fs.writeFileSync(name,text);
}
console.log(JSON.stringify({source:stage+'/SOURCE_CANDIDATE_V2.json',sha256:hash(stage+'/SOURCE_CANDIDATE_V2.json'),paths:paths.length,changed:current.changedPaths,added}));
