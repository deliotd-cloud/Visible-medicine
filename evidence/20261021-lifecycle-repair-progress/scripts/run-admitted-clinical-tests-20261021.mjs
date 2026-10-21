// One actual sequential corpus job with an exact complete-input before/after guard.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-clinical-assurance-application';
const candidate='F:/VisibleMedicine/staging/20261021-clinical-assurance-ready';
const manifest=json(candidate+'/MANIFEST.json'),admission=json(stage+'/ADMISSION.json');
assert.equal(sha(read(candidate+'/MANIFEST.json')),admission.candidateManifestSha256);
assert.equal(sha(read(stage+'/ADMISSION.json')),'7d38cd688c8c4cb14367c4a925fd0fb130cf8df7ec3937bc4f8310f2cf3221af');
assert.equal(manifest.actualModules.length,20);assert.equal(manifest.pureModules.length,7);
const inputs=json(stage+'/source-inputs-after.json');assert.equal(inputs.length,5081);
assert.equal(sha(read(stage+'/source-inputs-after.json')),admission.afterInputsSha256);
const verify=()=>{for(const row of inputs)assert.equal(sha(read(manifest.site+'/'+row.path)),row.sha256,row.path+' complete candidate input');};
verify();assert(!fs.existsSync(stage+'/ACTUAL_CLINICAL_STARTED.json'));
const args=['--test','--experimental-strip-types','--test-concurrency=1',...manifest.actualModules,...manifest.pureModules];
const coordinator=path.dirname(fileURLToPath(import.meta.url));
const child=spawn(process.execPath,[coordinator+'/run-visible-medicine-check.mjs',stage,'ACTUAL_CLINICAL_CORPUS',process.execPath,...args],
 {cwd:coordinator,windowsHide:true,stdio:'inherit'});
fs.writeFileSync(stage+'/ACTUAL_CLINICAL_STARTED.json',JSON.stringify({at:new Date().toISOString(),driverPid:process.pid,wrapperPid:child.pid,
 actualCorpusModules:manifest.actualModules,pureModules:manifest.pureModules,args,sourceInputs:5081,
 admissionSha256:sha(read(stage+'/ADMISSION.json')),canonicalInstalled:false},null,2)+'\n',{flag:'wx'});
const result=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
const receipt=json(stage+'/ACTUAL_CLINICAL_CORPUS.json');assert.equal(receipt.code,result.code);assert.equal(receipt.signal,result.signal);assert.equal(sha(read(receipt.log)),receipt.logSha256);
let inputDrift=false,error=null;try{verify();}catch(cause){inputDrift=true;error=String(cause);}
const final={at:new Date().toISOString(),...result,receipt:stage+'/ACTUAL_CLINICAL_CORPUS.json',receiptSha256:sha(read(stage+'/ACTUAL_CLINICAL_CORPUS.json')),
 actualCorpusModules:20,pureModules:7,sourceInputs:5081,inputDrift,error,footer:receipt.footer,
 actualAffectedModulesPass:result.code===0&&result.signal===null&&!inputDrift,
 wholeWebsiteSuitePass:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false};
fs.writeFileSync(stage+'/ACTUAL_CLINICAL_RESULT.json',JSON.stringify(final,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(final));process.exitCode=inputDrift?1:result.code??1;
