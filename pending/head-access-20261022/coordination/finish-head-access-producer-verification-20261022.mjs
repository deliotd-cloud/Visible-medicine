// Diagnose the unrelated specimen failure at the exact baseline, then finish outstanding gates.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-model-access-candidate',atlas=root+'/atlas',baseline='F:/VisibleMedicine/staging/20261022-renal-canonical-checkout/atlas',out=root+'/producer-verification-v3';
const priorPath=root+'/producer-verification-v2/TERMINAL.json',prior=json(priorPath);
assert.equal(sha(read(priorPath)),'e630fdba25ae97d6130c614020b20cd7654e746f6862e7a93030a4390ee73198');assert.equal(prior.code,1);assert.equal(prior.commands.at(-1).label,'specimen-access');assert.deepEqual(prior.sourceDrift,[]);assert.equal(prior.productionDependencyTopologyRestored,true);
assert.equal(runGit(['-C',baseline,'rev-parse','HEAD']).toString().trim(),'4f20ae0b62b9e0dab5936b430575a983dcdd934e');assert.equal(runGit(['-C',baseline,'status','--porcelain']).toString().trim(),'');
for(const p of ['scripts/test-specimen-model-access.mjs','app/um-knee-study.tsx','app/um-limb-learning.tsx','lib/model-load-failure.ts','scripts/workspace-component-test-build.mjs'])assert.deepEqual(read(atlas+'/'+p),read(baseline+'/'+p),'unchanged relevant source '+p);
assert(!fs.existsSync(out));fs.mkdirSync(out);const before=json(root+'/producer-verification/INPUTS.json').before;
for(const r of before)assert.equal(sha(read(atlas+'/'+r.path)),r.sha256,r.path);
const commands=[];let failure=null,baselineFailureReproduced=false;
try{for(const[label,args,cwd]of [
 ['baseline-specimen-access',['--test','--experimental-strip-types','--test-reporter=tap','scripts/test-specimen-model-access.mjs'],baseline],
 ['renderer-check',['scripts/body-renderer-revisions.mjs','--check'],atlas],['display-check',['scripts/generate-body-review-display-pins.mjs','--check'],atlas],['shoulder',['scripts/review-revisions.mjs','--check'],atlas],
 ['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false'],atlas],['build',['C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js','run','build'],atlas],
]){
 const stdout=fs.createWriteStream(out+'/'+label+'.stdout.log',{flags:'wx'}),stderr=fs.createWriteStream(out+'/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd,env:{...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(stdout);child.stderr.pipe(stderr);console.log(JSON.stringify({label,pid:child.pid}));
 const p=json('CURRENT_CHECKPOINT.json');Object.assign(p.activeWork.current.headModelAccessRun,{at:new Date().toISOString(),label,pid:child.pid,terminal:false});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');
 const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([stdout,stderr].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
 const output=read(stdout.path).toString(),counts=Object.fromEntries([...output.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(m=>[m[1],Number(m[2])]));
 commands.push({label,args,cwd,...outcome,counts,stdoutSha256:sha(read(stdout.path)),stderrSha256:sha(read(stderr.path))});
 if(label==='baseline-specimen-access'){
  assert.equal(outcome.code,1);assert.deepEqual(counts,{tests:6,pass:5,fail:1,cancelled:0,skipped:0,todo:0});
  assert(output.includes('actual specimen dissection retains controls, gates practice, and clears access reasons on retry'));
  assert(output.includes("assert(!h.button('Practise identification').disabled)"));
  baselineFailureReproduced=true;
 }else assert.equal(outcome.code,0,label);
}}catch(error){failure=String(error);}
const drift=before.filter(r=>sha(read(atlas+'/'+r.path))!==r.sha256).map(r=>r.path);if(drift.length)failure??='Source drift';
assert.equal(runGit(['-C',baseline,'status','--porcelain']).toString().trim(),'');assert.equal(runGit(['-C',atlas,'diff','--name-only','--','public/models']).toString().trim(),'');
const result={at:new Date().toISOString(),terminal:true,code:failure?1:0,failure,commands,sourceDrift:drift,baselineFailureReproduced,
 retainedSpecimenFailure:{receipt:priorPath,sha256:sha(read(priorPath)),tests:6,pass:5,fail:1,unchangedTestAndKneeSources:true,notCountedAsPass:true,notFixedOrSuppressed:true},
 focusedProducerAndHost:{receipt:root+'/focused/TERMINAL.json',sha256:sha(read(root+'/focused/TERMINAL.json')),hostTests:51,hostPass:51,accessClassifierTests:5,accessClassifierPass:5},
 wholeSuitePassing:false,sourceCommitPending:true,websiteImportAndRebindPending:true,ownerPreviewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(out+'/TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const p=json('CURRENT_CHECKPOINT.json');Object.assign(p.activeWork.current.headModelAccessRun,{pid:null,terminal:true,code:result.code,result:out+'/TERMINAL.json'});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');
console.log(JSON.stringify({receipt:out+'/TERMINAL.json',sha256:sha(read(out+'/TERMINAL.json')),code:result.code,failure,baselineFailureReproduced,sourceDrift:drift}));if(failure)process.exitCode=1;
