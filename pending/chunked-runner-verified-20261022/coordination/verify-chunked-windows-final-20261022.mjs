import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-release-chunked-runner-revision2';
const env={...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1',NODE_OPTIONS:'--max-old-space-size=256'};delete env.NODE_TEST_CONTEXT;
for(const mode of ['final-run','final-resume']){
 const run=spawnSync(process.execPath,['--max-old-space-size=256','probe-chunked-windows-child-20261022.mjs',mode],{env,windowsHide:true,maxBuffer:2e6});
 for(const[name,bytes]of [['stdout.log',run.stdout??''],['stderr.log',run.stderr??'']])fs.writeFileSync(stage+'/WINDOWS_'+mode+'.'+name,bytes,{flag:'wx'});
 assert.equal(run.status,0,String(run.stderr));const receipt=json(stage+'/MAIN_WINDOWS_'+mode+'.json');assert.equal(receipt.error,undefined);assert.equal(receipt.code,0);
 const result=JSON.parse(receipt.output[0]);assert.equal(result.compositePassingClaim,true);assert.deepEqual(result.counts,{tests:1,pass:1,fail:0,cancelled:0,skipped:0,todo:0});
 console.log(JSON.stringify({mode,code:receipt.code,pid:receipt.realWindowsProcessIdentity.pid,batch:result.batch,counts:result.counts}));
}
const a=json(stage+'/MAIN_WINDOWS_final-run.json'),b=json(stage+'/MAIN_WINDOWS_final-resume.json'),first=JSON.parse(a.output[0]),second=JSON.parse(b.output[0]);assert.notEqual(a.realWindowsProcessIdentity.pid,b.realWindowsProcessIdentity.pid);assert.equal(second.batch,first.batch);
const dir=first.batch+'/attempts/chunk-0000',attempts=fs.readdirSync(dir);assert.equal(attempts.length,1);
const start=json(dir+'/'+attempts[0]+'/started.json'),receipt=json(dir+'/'+attempts[0]+'/receipt.json');assert.equal(start.runner.pid,a.realWindowsProcessIdentity.pid);assert.equal(start.child.state,'alive');assert.equal(receipt.reusable,true);
const result={at:new Date().toISOString(),batch:first.batch,firstCoordinatorPid:a.realWindowsProcessIdentity.pid,secondCoordinatorPid:b.realWindowsProcessIdentity.pid,actualRecordedChildIdentity:start.child,attempts:1,counts:second.counts,scope:'Actual default Windows process inspector, same short-lived synthetic test root and identical inherited environment. Two separate real coordinators pass and reuse exactly one native attempt. Not an actual Website batch or uninterrupted stock gate.',firstSha256:sha(read(stage+'/MAIN_WINDOWS_final-run.json')),resumeSha256:sha(read(stage+'/MAIN_WINDOWS_final-resume.json')),previewChanged:false};
fs.writeFileSync(stage+'/MAIN_WINDOWS_FINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:stage+'/MAIN_WINDOWS_FINAL.json',sha256:sha(read(stage+'/MAIN_WINDOWS_FINAL.json')),attempts:1,counts:result.counts}));
