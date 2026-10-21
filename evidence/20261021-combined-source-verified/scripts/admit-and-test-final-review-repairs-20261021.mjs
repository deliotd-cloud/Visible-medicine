// Final bounded retry: exact elbow playback history and MRI test context adapter.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const base='F:/VisibleMedicine/staging/20261021-',previous=base+'review-harness-and-elbow-application';
const stage=base+'review-final-retry',result=json(previous+'/RESULT.json');
assert.equal(result.code,1);assert.equal(result.signal,null);assert.equal(result.inputDrift,false);
assert(result.footer.some(line=>line.endsWith('tests 33'))&&result.footer.some(line=>line.endsWith('fail 3')));
const sourceResult=json(base+'committed-source-admission/RESULT.json');assert.equal(typeof sourceResult.passed,'boolean','Source job terminal before next heavy run');
const prep=json(previous+'/PREPARATION.json'),inputs=json(previous+'/source-inputs-after.json');assert.equal(inputs.length,5084);
for(const row of inputs)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path+' before retry');
const rows=[
 {path:'tests/clinical-review-elbow-us-followup.test.ts',origin:base+'elbow-playback-packet-repair/tests/clinical-review-elbow-us-followup.test.ts',beforeSha256:'cdd84bd2693941783da9f058cc4860ac7a32361913e687dab1699f66fa9a0f1f',sha256:'52ebcddab39cc165bf4c3c94dee0659abfea6814c92e55f85bf86f25eb6c57d8'},
 {path:'tests/elbow-us-followup-preservation.test.mjs',origin:base+'elbow-playback-packet-repair/tests/elbow-us-followup-preservation.test.mjs',beforeSha256:'7ca1c0796278bd08cc9c7d60493c2ff79202772f5dd38608666c8a0cf537c009',sha256:'63f4f423ece0998e8bd169d76aee2c46fe653e47593ee7f89cdc49fce2d29f4a'},
 {path:'tests/head-mri-independent-review-ui.test.ts',origin:base+'mri-review-context-test/tests/head-mri-independent-review-ui.test.ts',beforeSha256:'ba1cb6a494877390ebea5420827ef6b2f01f97ed4ab1a7492a2c29c198df640c',sha256:'fe94de89865a008b971a74611be60b73db2021e4252a149aec6fe066b56ccc31'},
];
for(const row of rows){assert.equal(sha(read(row.origin)),row.sha256);assert.equal(sha(read(prep.site+'/'+row.path)),row.beforeSha256);}
let mri=read(rows[2].origin).toString();
for(const seam of [
 'getClinicalReviewContext:()=>null,',
 " assert.match(renderToStaticMarkup(draw()),/No saved notes yet/,'initial history fully loaded without a missing-context mock error');\n",
]){assert.equal(mri.split(seam).length,2);mri=mri.replace(seam,'');}
assert.equal(sha(Buffer.from(mri)),rows[2].beforeSha256,'MRI full original behavior assertions retained');
for(const [name,digest] of [['elbow-admission-import-history.mjs','f994bb22c3e12330d82fe9c25d33e1a48a2bee8dd9ebf47a3b5d222ca004232d'],['fixtures/clinical-review-elbow-us-followup.original.ts.raw','aad244f03fc81cec834dbed52eed7681f8a680f6d6d52cc82a9c17cde84fab0c']])assert.equal(sha(read(prep.site+'/tests/'+name)),digest);
assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const save=(relative,bytes)=>{const target=stage+'/'+relative;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});};
for(const row of rows)save('originals/'+row.path,read(prep.site+'/'+row.path));
for(const row of rows){fs.copyFileSync(row.origin,prep.site+'/'+row.path);assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256);}
const all=new Map(inputs.map(row=>[row.path,row]));for(const row of rows)all.set(row.path,{path:row.path,bytes:read(prep.site+'/'+row.path).length,sha256:row.sha256});
const after=[...all.values()].sort((a,b)=>a.path.localeCompare(b.path));assert.equal(after.length,5084);
const verify=()=>{for(const row of after)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path+' final retry input');};verify();
save('source-inputs-after.json',Buffer.from(JSON.stringify(after,null,2)+'\n'));
save('PREPARATION.json',Buffer.from(JSON.stringify({...prep,stage,scope:'Actual two formerly failing clinical/UI modules and elbow exact inverse; no runtime/auth/approval changes.5084inputs guarded; source job released heavy slot.'},null,2)+'\n'));
const args=['--test','--experimental-strip-types','--test-concurrency=1',...rows.map(row=>row.path)];
const coordinator=path.dirname(fileURLToPath(import.meta.url));
const child=spawn(process.execPath,[coordinator+'/run-visible-medicine-check.mjs',stage,'ACTUAL_FINAL_REVIEW_RETRY',process.execPath,...args],{cwd:coordinator,windowsHide:true,stdio:'inherit'});
save('STARTED.json',Buffer.from(JSON.stringify({at:new Date().toISOString(),driverPid:process.pid,wrapperPid:child.pid,args,files:rows,sourceInputs:5084,canonicalInstalled:false},null,2)+'\n'));
const done=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
const receipt=json(stage+'/ACTUAL_FINAL_REVIEW_RETRY.json');assert.equal(receipt.code,done.code);assert.equal(receipt.signal,done.signal);assert.equal(sha(read(receipt.log)),receipt.logSha256);
let inputDrift=false,error=null;try{verify();}catch(cause){inputDrift=true;error=String(cause);}
const final={at:new Date().toISOString(),...done,inputDrift,error,footer:receipt.footer,receiptSha256:sha(read(stage+'/ACTUAL_FINAL_REVIEW_RETRY.json')),
 actualTwoClinicalModulesAndGuardPass:done.code===0&&done.signal===null&&!inputDrift,wholeWebsiteSuitePass:false,canonicalInstalled:false,clinicalApproval:false};
save('RESULT.json',Buffer.from(JSON.stringify(final,null,2)+'\n'));console.log(JSON.stringify(final));process.exitCode=inputDrift?1:done.code??1;
