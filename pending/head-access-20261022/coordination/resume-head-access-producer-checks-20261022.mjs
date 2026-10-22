// Resume after the verified dependency-junction refusal; retain the original failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {localizeHeadTestDependencies,restoreHeadProductionDependencies} from './head-access-test-dependencies-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-model-access-candidate',atlas=root+'/atlas',priorPath=root+'/producer-verification/TERMINAL.json',prior=json(priorPath),out=root+'/producer-verification-v2';
assert.equal(sha(read(priorPath)),'27f68e608db8e286a723c323caccab0c6dd228f0ba300105d32e649e2836929a');
assert.equal(prior.code,1);assert.equal(prior.commands.at(-1).label,'selection');assert.deepEqual(prior.sourceDrift,[]);
assert(read(root+'/producer-verification/selection.stderr.log').toString().includes('Test module is outside the checkout'));
assert(!fs.existsSync(out));fs.mkdirSync(out);
const before=json(root+'/producer-verification/INPUTS.json').before;for(const r of before)assert.equal(sha(read(atlas+'/'+r.path)),r.sha256,r.path);
const commands=[];let failure=null,localized=false,restored=false;
try{
 localizeHeadTestDependencies();localized=true;
 for(const[label,args]of [
  ['selection',['scripts/validate-selection-visibility.mjs']],['nested-order',['scripts/test-nested-selection-order.mjs']],
  ['specimen-access',['--test','--experimental-strip-types','scripts/test-specimen-model-access.mjs']],
  ['renderer-check',['scripts/body-renderer-revisions.mjs','--check']],['display-check',['scripts/generate-body-review-display-pins.mjs','--check']],['shoulder',['scripts/review-revisions.mjs','--check']],
  ['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']],['build',['C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js','run','build']],
 ]){
  if(label==='renderer-check'){restoreHeadProductionDependencies();restored=true;}
  const stdout=fs.createWriteStream(out+'/'+label+'.stdout.log',{flags:'wx'}),stderr=fs.createWriteStream(out+'/'+label+'.stderr.log',{flags:'wx'});
  const child=spawn(process.execPath,args,{cwd:atlas,env:{...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(stdout);child.stderr.pipe(stderr);console.log(JSON.stringify({label,pid:child.pid}));
  const p=json('CURRENT_CHECKPOINT.json');Object.assign(p.activeWork.current.headModelAccessRun,{at:new Date().toISOString(),label,pid:child.pid,terminal:false});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');
  const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});
  await Promise.all([stdout,stderr].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
  commands.push({label,args,...outcome,stdoutSha256:sha(read(stdout.path)),stderrSha256:sha(read(stderr.path))});assert.equal(outcome.code,0,label);
 }
}catch(error){failure=String(error);}finally{if(localized&&!restored){restoreHeadProductionDependencies();restored=true;}}
const drift=before.filter(r=>sha(read(atlas+'/'+r.path))!==r.sha256).map(r=>r.path);if(drift.length)failure??='Source drift';
assert.equal(runGit(['-C',atlas,'diff','--name-only','--','public/models']).toString().trim(),'');
const result={at:new Date().toISOString(),terminal:true,code:failure?1:0,failure,commands,sourceDrift:drift,priorReceipt:priorPath,priorReceiptSha256:sha(read(priorPath)),
 priorSuccessfulChecksReused:prior.commands.slice(0,-1).map(c=>c.label),testResolverUnchanged:true,dependencyCopiesByteIdentical:true,productionDependencyTopologyRestored:restored,
 sourceCommitPending:true,websiteImportAndRebindPending:true,ownerPreviewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(out+'/TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const p=json('CURRENT_CHECKPOINT.json');Object.assign(p.activeWork.current.headModelAccessRun,{pid:null,terminal:true,code:result.code,result:out+'/TERMINAL.json'});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');
console.log(JSON.stringify({receipt:out+'/TERMINAL.json',sha256:sha(read(out+'/TERMINAL.json')),code:result.code,failure,sourceDrift:drift,restored}));if(failure)process.exitCode=1;
