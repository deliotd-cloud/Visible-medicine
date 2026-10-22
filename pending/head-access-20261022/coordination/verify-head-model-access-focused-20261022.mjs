// Serial executable checks against the actual isolated producer and receiver.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-model-access-candidate',prepared=json(root+'/PREPARATION.json'),evidence=root+'/focused';
assert(!fs.existsSync(evidence));fs.mkdirSync(evidence);
const base=json(prepared.sourceReceipt),admission=json(root+'/source-admission/RESULT.json');
const allowed=new Set(['components/HeadAtlasInlineComparison.tsx','lib/head-live-selection.ts','tests/head-inline-frame.test.ts','tests/head-live-selection.test.ts']);
const rows=base.sourceRows.map(row=>{
 const b=read(prepared.website+'/'+row.path);if(!allowed.has(row.path))assert.equal(sha(b),row.sha256,row.path);
 return {path:row.path,bytes:b.length,sha256:sha(b)};
});
const producerRows=admission.changed.map(row=>({path:row.path,sha256:sha(read(prepared.atlas+'/'+row.path))}));
fs.writeFileSync(evidence+'/INPUTS.json',JSON.stringify({at:new Date().toISOString(),sourceReceipt:prepared.sourceReceipt,sourceReceiptSha256:prepared.sourceReceiptSha256,website:prepared.website,atlas:prepared.atlas,websiteRows:rows,producerRows,reviewRebindPending:true,notANewFullDeliveryPin:true},null,2)+'\n',{flag:'wx'});
const env={...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},commands=[];let failure=null;
try{for(const[label,args,cwd]of [
 ['scene-branches',['head-model-access-scene-branches-20261022.mjs'],process.cwd()],
 ['atlas-head-channel',['scripts/test-head-selection-channel.mjs'],prepared.atlas],
 ['atlas-access-classifier',['--test','--experimental-strip-types','--test-reporter=tap','scripts/test-model-load-failure.mjs'],prepared.atlas],
 ['host-comparison',['--test','--experimental-strip-types','--test-concurrency=1','--test-reporter=tap',
  'tests/head-live-selection.test.ts','tests/head-inline-frame.test.ts','tests/head-inline-commit-lifecycle.test.ts','tests/head-comparison-parent-commit.test.ts','tests/head-tour-inline-confirmation.test.ts','tests/head-inline-comparison-loader.test.ts'],prepared.website],
]){
 const out=fs.createWriteStream(evidence+'/'+label+'.stdout.log',{flags:'wx'}),err=fs.createWriteStream(evidence+'/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd,env,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);console.log(JSON.stringify({label,pid:child.pid}));
 const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
 const counts=Object.fromEntries([...read(out.path).toString().matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(m=>[m[1],Number(m[2])]));
 commands.push({label,args,cwd,...outcome,counts,stdoutSha256:sha(read(out.path)),stderrSha256:sha(read(err.path))});assert.equal(outcome.code,0,label);
 if('tests'in counts){assert.equal(counts.fail,0);assert.equal(counts.skipped,0);assert.equal(counts.cancelled,0);}
}}catch(error){failure=String(error);}
const drift=rows.filter(row=>sha(read(prepared.website+'/'+row.path))!==row.sha256).map(row=>row.path);
const producerDrift=producerRows.filter(row=>sha(read(prepared.atlas+'/'+row.path))!==row.sha256).map(row=>row.path);
if(drift.length||producerDrift.length)failure??='Source drift';
fs.writeFileSync(evidence+'/TERMINAL.json',JSON.stringify({at:new Date().toISOString(),terminal:true,code:failure?1:0,failure,commands,inputsSha256:sha(read(evidence+'/INPUTS.json')),sourceDrift:drift,producerDrift,reviewRebindPending:true,fullTypesAndBuildPending:true,sourceCommitPending:true,ownerPreviewChanged:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:evidence+'/TERMINAL.json',sha256:sha(read(evidence+'/TERMINAL.json')),code:failure?1:0,failure,sourceDrift:drift,producerDrift}));if(failure)process.exitCode=1;
