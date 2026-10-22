import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-release-chunked-runner-revision2';
const mode=process.argv[2];assert(['red','green','final'].includes(mode));
const roots=mode==='red'?['tests/website-test-chunks-main.test.mjs']:['tests/website-test-chunks-main.test.mjs','tests/website-test-chunks-review.test.mjs','tests/website-test-chunks.test.mjs','tests/run-website-tests.test.mjs',...(mode==='final'?['tests/website-test-chunks-child-ready.test.mjs']:[])];
if(mode==='final')assert.deepEqual(fs.readdirSync(stage+'/tests').filter(name=>/\.test\.mjs$/.test(name)).map(name=>'tests/'+name).sort(),[...roots].sort());
const sourceRows=['scripts','tests'].flatMap(dir=>fs.readdirSync(stage+'/'+dir).filter(name=>/\.(?:mjs|md)$/.test(name)).map(name=>({path:dir+'/'+name,sha256:sha(fs.readFileSync(stage+'/'+dir+'/'+name))}))).sort((a,b)=>a.path.localeCompare(b.path));
const args=['--max-old-space-size=256','--test','--test-concurrency=1','--test-reporter=tap',...roots];
const env={...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'};delete env.NODE_TEST_CONTEXT;
const started=Date.now(),run=spawnSync(process.execPath,args,{cwd:stage,env,windowsHide:true,maxBuffer:5e6});
for(const[name,b]of [['stdout.log',run.stdout??''],['stderr.log',run.stderr??'']])fs.writeFileSync(stage+'/MAIN_'+mode+'.'+name,b,{flag:'wx'});
const counts=Object.fromEntries([...String(run.stdout).matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(m=>[m[1],Number(m[2])]));
for(const row of sourceRows)assert.equal(sha(fs.readFileSync(stage+'/'+row.path)),row.sha256,'source changed during focused run');
const receipt={at:new Date().toISOString(),args,sourceRows,exit:run.status,signal:run.signal,error:run.error?.message,elapsedMs:Date.now()-started,counts,stdout:stage+'/MAIN_'+mode+'.stdout.log',stdoutSha256:sha(run.stdout??''),stderr:stage+'/MAIN_'+mode+'.stderr.log',stderrSha256:sha(run.stderr??'')};
fs.writeFileSync(stage+'/MAIN_'+mode+'.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
if(mode==='red'){assert.equal(run.status,1);assert.equal(counts.fail,3);}else{assert.equal(run.status,0);const expected=mode==='final'?32:28;assert.deepEqual(counts,{tests:expected,pass:expected,fail:0,cancelled:0,skipped:0,todo:0});}
