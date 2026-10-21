// Sequential current485 assurance, after the actual clinical batch has terminated.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const previous='F:/VisibleMedicine/staging/20261021-clinical-assurance-application';
const stage='F:/VisibleMedicine/staging/20261021-current-contract-application';
const prep=json(previous+'/PREPARATION.json'),done=json(previous+'/ACTUAL_CLINICAL_RESULT.json');
assert.equal(done.code,1);assert.equal(done.signal,null);assert.equal(done.inputDrift,false);
assert(done.footer.some(v=>v.endsWith('tests 38'))&&done.footer.some(v=>v.endsWith('fail 4')));
const inputs=json(previous+'/source-inputs-after.json');assert.equal(inputs.length,5081);
for(const row of inputs)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256);
const proposals='F:/VisibleMedicine/staging/20261021-';
const files=[
 ['coverage-arterial-contract-proposal','tests/anatomy-coverage-revision-admission.test.mjs','8ee56ade2e3b70c5e5b50ee6a629d411635da3c5ff5b89a5670181a47b80edb1','3611dc20929cac9bb27c5ac4aac85c27498d4862b2feb5a5a716f3ed4f2b95a0'],
 ['coverage-arterial-contract-proposal','tests/atlas-arterial-evidence-limits.test.mjs','840d4ecb8bef4c4bf725f1cecd39fa6e53dfa9a7c4d2922a750851509806451a','7b105f5146aab1653aedca9a7150a73733575f87e7e848063cb07e8faea9b843'],
 ['spinal-ct-contract-proposal','tests/atlas-spinal-muscle-xray.test.mjs','c0fee664ecbf5bbbc1665138891eb2253bf71d6d7aff083757fe39b6095c9faa','af693d2d1d351ef98ef763ea950fd7450a781ac69172648d908591fb7fa0bb13'],
 ['spinal-ct-contract-proposal','tests/fixtures/atlas-spinal-muscle-xray-original.raw','af693d2d1d351ef98ef763ea950fd7450a781ac69172648d908591fb7fa0bb13',null],
];
assert(!fs.existsSync(stage));
for(const [origin,p,post,old] of files){assert.equal(sha(read(proposals+origin+'/'+p)),post,p);assert.equal(fs.existsSync(prep.site+'/'+p)?sha(read(prep.site+'/'+p)):null,old,p);}
fs.mkdirSync(stage);const save=(p,b)=>{const to=stage+'/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,b,{flag:'wx'});};
save('previous-clinical-terminal.json',read(previous+'/ACTUAL_CLINICAL_RESULT.json'));
for(const [origin,p,post,old] of files){if(old)save('originals/'+p,read(prep.site+'/'+p));fs.mkdirSync(path.dirname(prep.site+'/'+p),{recursive:true});fs.copyFileSync(proposals+origin+'/'+p,prep.site+'/'+p);assert.equal(sha(read(prep.site+'/'+p)),post);}
const attrs=read(prep.site+'/.gitattributes');save('originals/.gitattributes',attrs);
fs.appendFileSync(prep.site+'/.gitattributes','\n# Exact coverage admission proof uses LF independently of host autocrlf.\ntests/anatomy-coverage-revision-admission.test.mjs text eol=lf\n');
const after=new Map(inputs.map(row=>[row.path,row]));
for(const [,p,post] of files)after.set(p,{path:p,bytes:read(prep.site+'/'+p).length,sha256:post});
after.set('.gitattributes',{path:'.gitattributes',bytes:read(prep.site+'/.gitattributes').length,sha256:sha(read(prep.site+'/.gitattributes'))});
assert.equal(after.size,5082);const rows=[...after.values()].sort((a,b)=>a.path.localeCompare(b.path));
const verify=()=>{for(const row of rows)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path+' current assurance input');};verify();
save('source-inputs-after.json',Buffer.from(JSON.stringify(rows,null,2)+'\n'));
save('PREPARATION.json',Buffer.from(JSON.stringify({...prep,stage,scope:'Actual three original485coverage/arterial/spinal assurance modules; source5082before/after guard. Owner preview unchanged.'},null,2)+'\n'));
const coordinator=path.dirname(fileURLToPath(import.meta.url));
const args=['--test','--test-concurrency=1',...files.filter(([,p])=>p.endsWith('.test.mjs')).map(([,p])=>p)];
const child=spawn(process.execPath,[coordinator+'/run-visible-medicine-check.mjs',stage,'ACTUAL_CURRENT_CONTRACTS',process.execPath,...args],{cwd:coordinator,windowsHide:true,stdio:'inherit'});
save('STARTED.json',Buffer.from(JSON.stringify({at:new Date().toISOString(),driverPid:process.pid,wrapperPid:child.pid,args,sourceInputs:5082,files:files.map(([origin,p,post,old])=>({path:p,origin:proposals+origin+'/'+p,sha256:post,beforeSha256:old})),attributesSha256:after.get('.gitattributes').sha256,canonicalInstalled:false},null,2)+'\n'));
const result=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
const receipt=json(stage+'/ACTUAL_CURRENT_CONTRACTS.json');assert.equal(receipt.code,result.code);assert.equal(receipt.signal,result.signal);assert.equal(sha(read(receipt.log)),receipt.logSha256);
let inputDrift=false,error=null;try{verify();}catch(cause){inputDrift=true;error=String(cause);}
const proof={at:new Date().toISOString(),...result,inputDrift,error,footer:receipt.footer,receiptSha256:sha(read(stage+'/ACTUAL_CURRENT_CONTRACTS.json')),actualCurrentContractsPass:result.code===0&&result.signal===null&&!inputDrift,wholeWebsiteSuitePass:false,canonicalInstalled:false};
save('RESULT.json',Buffer.from(JSON.stringify(proof,null,2)+'\n'));console.log(JSON.stringify(proof));process.exitCode=inputDrift?1:result.code??1;
