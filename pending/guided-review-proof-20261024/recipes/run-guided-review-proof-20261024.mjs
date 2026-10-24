import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';

const stage='F:/VisibleMedicine/staging/20261024-guided-review-completeness';
const attempt=process.argv[2]??'attempt-2';assert(/^attempt-[2-9][0-9]*$/.test(attempt));
const evidence=stage+'/'+attempt;assert(!fs.existsSync(evidence));fs.mkdirSync(evidence);
const prep=JSON.parse(fs.readFileSync(stage+'/PREPARATION.json'));
const parent=JSON.parse(fs.readFileSync(prep.parentReceipt));
const sha=b=>createHash('sha256').update(b).digest('hex');
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
assert.equal(sha(fs.readFileSync(prep.parentReceipt)),prep.parentReceiptSha256);
const git=(...args)=>execFileSync('git',['-C',prep.atlas,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
const inputs=()=>{
 assert.equal(git('rev-parse','HEAD'),prep.atlasHead);assert.equal(git('rev-parse','HEAD^{tree}'),prep.atlasTree);assert.equal(git('status','--porcelain'),'');
 return [...parent.sourceRows,...prep.plannedNewPaths.map(p=>({path:p}))].map(row=>{
  const b=fs.readFileSync(prep.website+'/'+row.path),hash=sha(b);
  if(row.sha256)assert.equal(hash,row.sha256,row.path);
  return {path:row.path,bytes:b.length,sha256:hash};
 });
};
const before=inputs();write(evidence+'/SOURCE_INPUTS.json',before);
// Read-only process inventory, restricted to possible heavy validation owners.
const ps="@(Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -match '(--test|vinext.*build|tsc|run-focused|run-website-tests)' } | Select-Object ProcessId,ParentProcessId,CommandLine) | ConvertTo-Json -Compress";
const pwsh='C:/Users/delio/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe';
const observed=JSON.parse(execFileSync(pwsh,['-NoProfile','-NonInteractive','-Command',ps],{encoding:'utf8',windowsHide:true})||'[]');
assert.equal(observed.length,0,'Do not overlap an active heavy validation');
write(evidence+'/VALIDATION_SLOT_ACQUIRED.json',{at:new Date().toISOString(),observed,scope:'new current-source guide completeness proof only; no build/browser/cutover'});
const checks=evidence+'/checks';fs.mkdirSync(checks);
const root='tests/guided-review-completeness.test.mjs';
const args=['--max-old-space-size=768','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',root];
const stdout=fs.createWriteStream(checks+'/stdout.log',{flags:'wx'}),stderr=fs.createWriteStream(checks+'/stderr.log',{flags:'wx'});
const startedAt=new Date().toISOString();
const child=spawn(process.execPath,args,{cwd:prep.website,windowsHide:true,
 env:{...process.env,VM_ATLAS_SOURCE_REPO:prep.atlas},stdio:['ignore','pipe','pipe']});
write(checks+'/STARTED.json',{startedAt,pid:child.pid,parentPid:process.pid,executable:process.execPath,cwd:prep.website,args,sourceInputsSha256:sha(fs.readFileSync(evidence+'/SOURCE_INPUTS.json'))});
child.stdout.pipe(stdout);child.stderr.pipe(stderr);
const exit=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',(code,signal)=>resolve({code,signal}));});
await Promise.all([new Promise(r=>stdout.end(r)),new Promise(r=>stderr.end(r))]);
const output=fs.readFileSync(checks+'/stdout.log','utf8');
const count=k=>Number(output.match(new RegExp('^# '+k+' (\\d+)','m'))?.[1]??-1);
const after=inputs();assert.deepEqual(after,before,'Entire source closure unchanged across actual execution');
const terminal={at:new Date().toISOString(),startedAt,pid:child.pid,...exit,
 counts:Object.fromEntries(['tests','pass','fail','skipped','cancelled'].map(k=>[k,count(k)])),
 sourcePaths:before.length,sourceInputsSha256:sha(fs.readFileSync(evidence+'/SOURCE_INPUTS.json')),
 entireSourceClosureUnchanged:true,stdoutSha256:sha(fs.readFileSync(checks+'/stdout.log')),stderrSha256:sha(fs.readFileSync(checks+'/stderr.log'))};
write(checks+'/TERMINAL.json',terminal);
write(evidence+'/VALIDATION_SLOT_RELEASE.json',{at:terminal.at,pid:child.pid,terminal:checks+'/TERMINAL.json',terminalSha256:sha(fs.readFileSync(checks+'/TERMINAL.json')),childTerminal:true});
console.log(JSON.stringify(terminal));
assert.equal(exit.code,0);assert.equal(count('tests'),2);assert.equal(count('pass'),2);assert.equal(count('fail'),0);assert.equal(count('skipped'),0);assert.equal(count('cancelled'),0);
