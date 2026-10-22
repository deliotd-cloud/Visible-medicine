// Risk-matched producer checks/build, sequential and source-bound; never installs the runtime.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-model-access-candidate',atlas=root+'/atlas',out=root+'/producer-verification';
assert(!fs.existsSync(out));assert.equal(json(root+'/focused/TERMINAL.json').code,0);fs.mkdirSync(out);
const commands=[];let failure=null,before=null;
const env={...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'};
const capture=()=>runGit(['-C',atlas,'ls-files','-z','--cached','--others','--exclude-standard']).toString().split('\0').filter(Boolean).sort().map(path=>({path,bytes:read(atlas+'/'+path).length,sha256:sha(read(atlas+'/'+path))}));
try{for(const[label,args]of [
 ['renderer-producer',['scripts/body-renderer-revisions.mjs']],['display-producer',['scripts/generate-body-review-display-pins.mjs']],
 ['resource-channel',['scripts/test-head-resource-channel.mjs']],['resource-scopes',['scripts/test-head-resource-scopes.mjs']],
 ['source-holds',['scripts/validate-current-source-holds.mjs']],['renderer',['scripts/validate-scene-recovery.mjs']],['selection',['scripts/validate-selection-visibility.mjs']],
 ['nested-order',['scripts/test-nested-selection-order.mjs']],['specimen-access',['--test','--experimental-strip-types','scripts/test-specimen-model-access.mjs']],
 ['renderer-check',['scripts/body-renderer-revisions.mjs','--check']],['display-check',['scripts/generate-body-review-display-pins.mjs','--check']],['shoulder',['scripts/review-revisions.mjs','--check']],
 ['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']],['build',['C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js','run','build']],
]){
 if(label==='resource-channel'){
  before=capture();fs.writeFileSync(out+'/INPUTS.json',JSON.stringify({at:new Date().toISOString(),atlas,base:'4f20ae0b62b9e0dab5936b430575a983dcdd934e',before},null,2)+'\n',{flag:'wx'});
 }
 const stdout=fs.createWriteStream(out+'/'+label+'.stdout.log',{flags:'wx'}),stderr=fs.createWriteStream(out+'/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd:atlas,env,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(stdout);child.stderr.pipe(stderr);console.log(JSON.stringify({label,pid:child.pid}));
 const p=json('CURRENT_CHECKPOINT.json');p.activeWork.current.headModelAccessRun={at:new Date().toISOString(),stage:root,label,pid:child.pid,terminal:false,ownerPreviewChanged:false};fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');
 const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([stdout,stderr].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
 commands.push({label,args,...outcome,stdoutSha256:sha(read(stdout.path)),stderrSha256:sha(read(stderr.path))});assert.equal(outcome.code,0,label);
}}catch(error){failure=String(error);}
const drift=before?before.filter(r=>sha(read(atlas+'/'+r.path))!==r.sha256).map(r=>r.path):null;if(drift?.length)failure??='Source drift';
assert.equal(runGit(['-C',atlas,'diff','--name-only','--','public/models']).toString().trim(),'');
const result={at:new Date().toISOString(),terminal:true,code:failure?1:0,failure,commands,sourceDrift:drift,sourceCommitPending:true,websiteImportAndRebindPending:true,ownerPreviewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(out+'/TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const p=json('CURRENT_CHECKPOINT.json');Object.assign(p.activeWork.current.headModelAccessRun,{pid:null,terminal:true,code:result.code,result:out+'/TERMINAL.json'});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');
console.log(JSON.stringify({receipt:out+'/TERMINAL.json',sha256:sha(read(out+'/TERMINAL.json')),code:result.code,failure,sourceDrift:drift}));if(failure)process.exitCode=1;
