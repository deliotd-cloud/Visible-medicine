import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {finished} from 'node:stream/promises';

const proposal='F:/VisibleMedicine/staging/20261025-studio-access-error-proposal';
const baseline='F:/VisibleMedicine/staging/20261025-ultrasound-panels-website/website';
const receipt=path.resolve(baseline,'../SOURCE_CANDIDATE_V2.json');
const expectedReceipt='1efb21d5ab75469815d1169a0e8c15e7b0dd91908a74e11a6d79b5013e20a74d';
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report=JSON.parse(fs.readFileSync(proposal+'/REPORT.json','utf8'));
const save=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
assert.equal(hash(receipt),expectedReceipt);
for(const row of report.files){
  assert.equal(hash(proposal+'/'+row.path),row.sha256,row.path);
  if(row.preimageSha256)assert.equal(hash(baseline+'/'+row.path),row.preimageSha256,row.path);
}
const audit=JSON.parse(fs.readFileSync('F:/VisibleMedicine/staging/20261025-studio-access-error-audit/REPORT.json','utf8'));
for(const row of audit.sources)assert.equal(hash(baseline+'/'+row.path),row.sha256,row.path);
const evidence=proposal+'/main-checks-attempt-1';
assert(!fs.existsSync(evidence),'No reuse or automatic retry');
fs.mkdirSync(evidence);
// This is one small in-memory synthetic route root, not a graph/build/browser job.
const observation=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command','Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory | Select-Object AvailableMBytes,PercentCommittedBytesInUse | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}).replace(/^\uFEFF/,''));
save(evidence+'/RESOURCES.json',observation);
assert(observation.AvailableMBytes>=1024&&observation.PercentCommittedBytesInUse<=90);
let env={};
for(const [key,value] of Object.entries(process.env))if(/^(?:path|systemroot|windir|comspec|pathext|temp|tmp)$/i.test(key))env[key]=value;
Object.assign(env,{NODE_OPTIONS:'--max-old-space-size=256',STUDIO_ACCESS_PRODUCT_ROOT:baseline,NO_COLOR:'1',GOMAXPROCS:'1',GOMEMLIMIT:'64MiB'});
const results=[];
for(const kind of ['baseline','proposal']){
  const routeRoot=kind==='baseline'?baseline:proposal;
  const child=spawn(process.execPath,['--test','--test-reporter=tap',proposal+'/tests/studio-platform-access-errors.test.mjs'],{env:{...env,STUDIO_ACCESS_ROUTE_ROOT:routeRoot},windowsHide:true,shell:false,stdio:['ignore','pipe','pipe']});
  const out=fs.createWriteStream(evidence+'/'+kind+'.tap',{flags:'wx'}),err=fs.createWriteStream(evidence+'/'+kind+'.stderr.log',{flags:'wx'});
  child.stdout.pipe(out);child.stderr.pipe(err);
  save(evidence+'/'+kind+'-STARTED.json',{pid:child.pid,routeRoot,productRoot:baseline,at:new Date().toISOString()});
  const terminal=await new Promise(resolve=>{child.once('error',error=>resolve({error:String(error)}));child.once('close',(exitCode,signal)=>resolve({exitCode,signal}));});
  await Promise.all([finished(out),finished(err)]);
  const tap=fs.readFileSync(evidence+'/'+kind+'.tap','utf8'),counts=Object.fromEntries([...tap.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)$/gm)].map(m=>[m[1],Number(m[2])]));
  const record={kind,...terminal,counts,tapSha256:hash(evidence+'/'+kind+'.tap')};
  save(evidence+'/'+kind+'-TERMINAL.json',record);results.push(record);
}
for(const row of audit.sources)assert.equal(hash(baseline+'/'+row.path),row.sha256,row.path);
for(const row of report.files)assert.equal(hash(proposal+'/'+row.path),row.sha256,row.path);
assert.equal(hash(receipt),expectedReceipt);
const [old,current]=results;
assert.equal(old.exitCode,1);assert.equal(old.signal,null);
assert.deepEqual(old.counts,{tests:8,pass:3,fail:5,cancelled:0,skipped:0,todo:0});
assert.equal(current.exitCode,0);assert.equal(current.signal,null);
assert.deepEqual(current.counts,{tests:8,pass:8,fail:0,cancelled:0,skipped:0,todo:0});
const terminal={at:new Date().toISOString(),parentReceiptSha256:expectedReceipt,results,baselineBugReproduced:true,proposalPassing:true,sourceStable:true,oneInMemoryRoot:true,fullStockDiagnosticNotModified:true,integrated:false,installed:false,liveIdentityOrDatabaseUsed:false,clinicalApproval:false};
save(evidence+'/TERMINAL.json',terminal);
console.log(JSON.stringify({terminal:evidence+'/TERMINAL.json',baseline:old.counts,proposal:current.counts,sourceStable:true}));
