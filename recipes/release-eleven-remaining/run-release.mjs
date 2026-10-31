import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {finished} from 'node:stream/promises';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {runController} from './runner.mjs';

const root='G:/VisibleMedicine-temp/staging/20261031-release-partition11-final/verification-remaining';
const cwd='C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2';
const stage='G:/VisibleMedicine-temp/staging/20261031-release-partition11-final';
const source={path:stage+'/SOURCE.json',sha256:'c0c16e3aeee38b41e1796237be9c8d0bc24ad651965803b4913d0996c9c6b75c'};
const steps=[
 {id:'adjacent',command:'--experimental-strip-types --test --test-concurrency=1 --test-reporter=tap tests/clinical-review-femoral-arterial-xray.test.ts'},
 {id:'partition-11',command:'scripts/run-website-tests.mjs --run --partition 11/32'},
];
const ref=p=>({path:p,sha256:hash(p)});
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const planFile=root+'/PLAN.json';
if(process.argv[2]==='--seal'){
 assert.equal(process.argv.length,3);assert.equal(hash(source.path),source.sha256);
 const codeFiles=['runner.mjs','runner.test.mjs','run-release.mjs','guarded-step.mjs'].map(p=>ref(root+'/'+p));
 for(const p of ['run-native-build-balanced-guarded-20261025.mjs','native-website-integration-stage-20261025.mjs','seal-simple-website-successor.mjs','bounded-source-hash-20261026.mjs'])codeFiles.push(ref(cwd+'/'+p));
 codeFiles.push(ref('F:/VisibleMedicine/staging/20261025-wave4-memory-repro-v2-proposal/supervise.ps1'));
 write(planFile,{schema:'vm-resumable-release-plan/1',at:new Date().toISOString(),root,source,steps,codeFiles,minimumMiB:4096,aggregateJobMiB:2048,heapMiB:1024,freeReserveMiB:2048,wholeSuitePassing:false,installed:false});
 console.log(JSON.stringify({sealed:ref(planFile)}));
}else{
 assert.equal(process.argv[2],'--run');assert.equal(process.argv.length,3);
 const plan=json(planFile),fingerprint=hash(planFile),receipt=json(source.path);
 assert.deepEqual(plan.source,source);assert.deepEqual(plan.steps,steps);assert.equal(plan.root,root);
 assert.equal(plan.minimumMiB,4096);assert.equal(plan.aggregateJobMiB,2048);assert.equal(plan.heapMiB,1024);assert.equal(plan.freeReserveMiB,2048);
 fs.mkdirSync(root+'/attempts',{recursive:true});fs.mkdirSync(root+'/tmp',{recursive:true});
 const verifySource=()=>{
  assert.equal(hash(planFile),fingerprint);for(const row of plan.codeFiles)assert.equal(hash(row.path),row.sha256,row.path);
  assert.equal(hash(source.path),source.sha256);
  assert.equal(hash(receipt.historicalEnvironment.path),receipt.historicalEnvironment.sha256);
  for(const row of receipt.sourceRows)assert.equal(hash(receipt.website+'/'+row.path),row.sha256,row.path);
  return fingerprint;
 };
 const confined=p=>{assert.equal(typeof p,'string');const rel=path.relative(root+'/attempts',p);assert(rel&&!path.isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+path.sep));return p;};
 const checkHash=r=>{assert(r&&typeof r.sha256==='string');assert.equal(hash(confined(r.path)),r.sha256);};
 const inspectCounts=(id,dir)=>{
  const output=fs.readFileSync(dir+'/runner.stdout.log','utf8');
  if(id==='adjacent'){
   const counts={};for(const key of ['tests','pass','fail','cancelled','skipped','todo']){const matches=[...output.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];assert.equal(matches.length,1,'Unambiguous TAP summary '+key);counts[key]=Number(matches[0][1]);}return {counts};
  }
  const out=JSON.parse(output);assert.equal(typeof out.output,'string');
  const file=path.resolve(out.output,'receipt.json');const check=json(file);
  assert.equal(check.testInputDrift,false);assert.equal(check.publicPreviewAssetDrift,false);
  return {counts:check.counts,stockReceipt:ref(file)};
 };
 const validateReceipt=(id,r,fp)=>{
  assert.equal(fp,fingerprint);assert.equal(r.step,id);assert.equal(r.fingerprint,fp);assert.equal(r.source.sha256,source.sha256);
  checkHash(r.guarded);checkHash(r.stdout);checkHash(r.stderr);checkHash(r.process);
  const result=json(r.guarded.path),terminal=json(r.process.path);
  assert(result.passing&&result.supervisor.code===0&&!result.supervisor.error&&!result.supervisor.signal);
  assert(terminal.terminalObserved&&!terminal.interrupted&&terminal.exitCode===0);assert.deepEqual(result.process,terminal);
  const fresh=inspectCounts(id,path.dirname(r.stdout.path));assert.deepEqual(r.counts,fresh.counts);
  if(fresh.stockReceipt){assert.deepEqual(r.stockReceipt,fresh.stockReceipt);}
  assert(Number.isInteger(r.counts.tests)&&r.counts.tests>0&&r.counts.tests===r.counts.pass);
  for(const key of ['fail','cancelled','skipped','todo'])assert.equal(r.counts[key],0);
  return true;
 };
 const execute=async(id,fp)=>{
  const attempt=fs.mkdtempSync(root+'/attempts/'+id+'-'),input={plan:{path:planFile,sha256:fp},step:id,attempt,evidence:attempt+'/evidence'};
  write(attempt+'/INPUT.json',input);
  const out=fs.createWriteStream(attempt+'/child.stdout.log',{flags:'wx'}),err=fs.createWriteStream(attempt+'/child.stderr.log',{flags:'wx'});
  const child=spawn(process.execPath,['--max-old-space-size=192',root+'/guarded-step.mjs',attempt+'/INPUT.json'],{cwd,windowsHide:true,shell:false,stdio:['ignore','pipe','pipe']});
  child.stdout.pipe(out);child.stderr.pipe(err);
  write(attempt+'/HANDLE.json',{at:new Date().toISOString(),pid:child.pid,parentPid:process.pid});
  console.log(JSON.stringify({started:id,pid:child.pid,attempt}));
  const result=await new Promise(resolve=>{let error;child.once('error',e=>error=String(e));child.once('close',(code,signal)=>resolve({code,signal,error:error??null}));});
  await Promise.all([finished(out),finished(err)]);write(attempt+'/TERMINAL.json',{...result,at:new Date().toISOString(),observed:true});
  if(result.code===75&&!result.signal&&!result.error&&!fs.existsSync(input.evidence)){
   const refusal=JSON.parse(fs.readFileSync(attempt+'/child.stdout.log','utf8'));
   assert.equal(refusal.admitted,false);assert.equal(refusal.minimumMiB,4096);
   assert(Number.isFinite(refusal.memory.AvailableMBytes)&&Number.isFinite(refusal.memory.PercentCommittedBytesInUse));
   assert(refusal.memory.AvailableMBytes<4096||refusal.memory.PercentCommittedBytesInUse>90);
   return {kind:'deferred',reason:{admission:refusal,terminal:ref(attempt+'/TERMINAL.json'),stdout:ref(attempt+'/child.stdout.log'),noSupervisorStarted:true}};
  }
  if(result.code!==0||result.signal||result.error)return {code:result.code??1,receipt:{attempt,result}};
  const measured=inspectCounts(id,input.evidence);
  return {code:0,receipt:{step:id,fingerprint:fp,source,guarded:ref(attempt+'/GUARDED_RESULT.json'),stdout:ref(input.evidence+'/runner.stdout.log'),stderr:ref(input.evidence+'/runner.stderr.log'),process:ref(input.evidence+'/PROCESS-TERMINAL.json'),...measured}};
 };
 const stateFile=root+'/STATE.json';
 const state=await runController({steps:steps.map(x=>x.id),fingerprint,verifySource,execute,validateReceipt,
  loadState:()=>fs.existsSync(stateFile)?json(stateFile):null,
  writeState:state=>{
   const temporary=stateFile+'.'+process.pid+'.tmp';
   const fd=fs.openSync(temporary,'w');
   try{fs.writeFileSync(fd,JSON.stringify({...state,coordinatorPid:process.pid},null,2)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
   fs.renameSync(temporary,stateFile);
  }
 });
 console.log(JSON.stringify({status:state.status,terminal:state.terminal,completed:state.completed.length,state:stateFile,wholeSuitePassing:false,installed:false}));
 process.exitCode=state.status==='passed'?0:state.status==='deferred'?2:1;
}
