import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-head-review-commit-candidate',site=stage+'/website',label=process.argv[2];
assert(['worker-red','main-green'].includes(label));const evidence=stage+'/'+label;assert(!fs.existsSync(evidence));fs.mkdirSync(evidence);
const tests=label==='worker-red'?['tests/head-practice-review-commit-controls.test.mjs']:
 ['tests/head-practice-review-commit-controls.test.mjs','tests/head-practice-focused-review-ui.test.ts','tests/head-review-study-set-ui.test.ts','tests/head-practice-review.test.ts','tests/head-practice-review-filters.test.ts','tests/head-practice-focused-review.test.ts','tests/head-practice-commit-lifecycle.test.ts','tests/head-atlas-practice.test.ts'];
const sourcePaths=['components/HeadAtlasPracticeReview.tsx',...tests],before=sourcePaths.map(path=>({path,sha256:sha(read(site+'/'+path))}));
const args=['--test','--experimental-strip-types','--test-concurrency=1','--test-reporter=tap',...tests],result=spawnSync(process.execPath,args,{cwd:site,windowsHide:true,maxBuffer:16e6,env:{...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'}});
fs.writeFileSync(evidence+'/stdout.log',result.stdout??'',{flag:'wx'});fs.writeFileSync(evidence+'/stderr.log',result.stderr??'',{flag:'wx'});
const output=(result.stdout??Buffer.from('')).toString(),counts=Object.fromEntries([...output.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(m=>[m[1],+m[2]]));
for(const row of before)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path);
const receipt={at:new Date().toISOString(),label,args,code:result.status,signal:result.signal,error:result.error?.message,counts,sourcePaths:before,stdoutSha256:sha(read(evidence+'/stdout.log')),stderrSha256:sha(read(evidence+'/stderr.log')),failed:[...output.matchAll(/^not ok \d+ - (.*)$/gm)].map(m=>m[1]),browserAcceptance:false,reviewBindingPending:true,fullTypesPending:true};
fs.writeFileSync(evidence+'/RESULT.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:evidence+'/RESULT.json',code:receipt.code,counts,failed:receipt.failed}));
if(label==='worker-red'){assert.equal(receipt.code,1);assert.deepEqual(counts,{tests:9,pass:6,fail:3,cancelled:0,skipped:0,todo:0});}else{assert.equal(receipt.code,0);assert.equal(counts.tests,counts.pass);for(const key of ['fail','cancelled','skipped','todo'])assert.equal(counts[key],0);}
