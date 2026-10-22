// Finish only outstanding checks after the exact tour-revision expectation repair.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-renal-tour-source-candidate',atlas=stage+'/atlas';
const previous=json(stage+'/verification-bound/TERMINAL.json');
assert.equal(previous.code,1);assert.equal(previous.commands.length,6);assert.equal(previous.commands[5].label,'wholebody');
assert(previous.commands.slice(0,5).every(r=>r.code===0));
assert(read(stage+'/verification-bound/wholebody.stderr.log').toString().includes('renal-organs-arteries-orientation-v1'));
const out=stage+'/verification-final';assert(!fs.existsSync(out));fs.mkdirSync(out);
const before=runGit(['-C',atlas,'ls-files','-z','--cached','--others','--exclude-standard']).toString().split('\0').filter(Boolean).sort().map(p=>({path:p,bytes:read(atlas+'/'+p).length,sha256:sha(read(atlas+'/'+p))}));
fs.writeFileSync(out+'/INPUTS.json',JSON.stringify({at:new Date().toISOString(),before,previous:stage+'/verification-bound/TERMINAL.json',previousSha256:sha(read(stage+'/verification-bound/TERMINAL.json'))},null,2)+'\n',{flag:'wx'});
const jobs=[['admission',['scripts/test-renal-tour-wholebody-admission.mjs']],['wholebody',['scripts/test-whole-body-guided-learning.mjs']],
 ['camera',['scripts/test-tour-camera.mjs']],['source-holds',['scripts/validate-current-source-holds.mjs']],['renderer',['scripts/body-renderer-revisions.mjs','--check']],
 ['display',['scripts/generate-body-review-display-pins.mjs','--check']],['shoulder',['scripts/review-revisions.mjs','--check']],
 ['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']],['build',['C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js','run','build']]];
const commands=[];let failure=null;
try{for(const[label,args]of jobs){
 const stdout=fs.createWriteStream(out+'/'+label+'.stdout.log',{flags:'wx'}),stderr=fs.createWriteStream(out+'/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd:atlas,env:{...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(stdout);child.stderr.pipe(stderr);
 const p=json('CURRENT_CHECKPOINT.json');Object.assign(p.activeWork.current.pendingRenalTour,{at:new Date().toISOString(),label,pid:child.pid,terminal:false});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');console.log(JSON.stringify({label,pid:child.pid}));
 const result=await new Promise(resolve=>{child.once('error',e=>resolve({code:null,error:String(e)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([stdout,stderr].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
 commands.push({label,args,...result,stdoutSha256:sha(read(stdout.path)),stderrSha256:sha(read(stderr.path))});assert.equal(result.code,0,label);
}}catch(error){failure=String(error);}
const sourceDrift=before.filter(r=>sha(read(atlas+'/'+r.path))!==r.sha256).map(r=>r.path);if(sourceDrift.length)failure??='Source drift';
assert.equal(runGit(['-C',atlas,'diff','--name-only','--','public/models']).toString().trim(),'');
const result={at:new Date().toISOString(),terminal:true,code:failure?1:0,failure,commands,sourceDrift,priorSuccessfulChecksUnchanged:true,
 priorRegistration:stage+'/verification-bound/registration.stdout.log',priorPlayer:stage+'/verification-bound/tour-player.stdout.log',ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(out+'/TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const p=json('CURRENT_CHECKPOINT.json');Object.assign(p.activeWork.current.pendingRenalTour,{pid:null,terminal:true,code:result.code,result:out+'/TERMINAL.json'});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');console.log(JSON.stringify(result));if(failure)process.exitCode=1;
