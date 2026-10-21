// Main-owned, terminal-gated admission of the reviewed spinal save-boundary proof.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const previous='F:/VisibleMedicine/staging/20261021-clinical-retry';
const proposal='F:/VisibleMedicine/staging/20261021-spinal-ct-save-refusal-proposal';
const stage='F:/VisibleMedicine/staging/20261021-spinal-save-application';
const prior=json(previous+'/RESULT.json'),receipt=json(previous+'/ACTUAL_CLINICAL_REPAIRS.json');
assert([0,1].includes(prior.code));assert.equal(prior.signal,null);assert.equal(prior.inputDrift,false);
assert.equal(prior.receiptSha256,sha(read(previous+'/ACTUAL_CLINICAL_REPAIRS.json')));
assert.equal(sha(read(receipt.log)),receipt.logSha256);assert.equal(receipt.code,prior.code);
const prep=json(previous+'/PREPARATION.json'),inputs=json(previous+'/source-inputs-after.json');
assert.equal(inputs.length,5082);
for(const row of inputs)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path+' stable preceding input');
const files=[
 {path:'tests/atlas-spinal-muscle-xray.test.mjs',sha256:'075354d9e1da283b5209c39478eb89e6f5fc9243441d0cd25701f84f43ea564a',beforeSha256:'c0fee664ecbf5bbbc1665138891eb2253bf71d6d7aff083757fe39b6095c9faa'},
 {path:'tests/spinal-ct-save-refusal-preservation.test.mjs',sha256:'0192f1a2056b1b176dafa1148a806ea3f63d341faa74bf2f3ba3a720c3ba9cab',beforeSha256:null},
];
for(const row of files){
 const source=proposal+'/'+row.path,target=prep.site+'/'+row.path;
 assert.equal(sha(read(source)),row.sha256,row.path+' reviewed postimage');
 assert(!read(source).includes(13),'reviewed executable LF');
 assert.equal(fs.existsSync(target)?sha(read(target)):null,row.beforeSha256,row.path+' preimage');
}
const fixture='tests/fixtures/atlas-spinal-muscle-xray-original.raw';
assert.equal(sha(read(prep.site+'/'+fixture)),'af693d2d1d351ef98ef763ea950fd7450a781ac69172648d908591fb7fa0bb13');
assert.deepEqual(read(prep.site+'/'+fixture),read(proposal+'/'+fixture),'original fixture unchanged');
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'98d7f17e2d120b031633e59e47fc50c82d44b2d0');
assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const save=(relative,bytes)=>{const target=stage+'/'+relative;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});};
save('previous-terminal.json',read(previous+'/RESULT.json'));
for(const row of files){if(row.beforeSha256)save('originals/'+row.path,read(prep.site+'/'+row.path));fs.copyFileSync(proposal+'/'+row.path,prep.site+'/'+row.path);assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256);}
const attrPath=prep.site+'/.gitattributes',attributes=read(attrPath);
const rule='tests/spinal-ct-save-refusal-preservation.test.mjs text eol=lf\n';
assert(!attributes.toString().includes(rule.trim()));save('originals/.gitattributes',attributes);
const newAttributes=Buffer.concat([attributes,Buffer.from((attributes.at(-1)===10?'':'\n')+rule)]);
fs.writeFileSync(attrPath,newAttributes);
files.push({path:'.gitattributes',sha256:sha(newAttributes),beforeSha256:sha(attributes)});
const after=new Map(inputs.map(row=>[row.path,row]));
for(const row of files)after.set(row.path,{path:row.path,bytes:read(prep.site+'/'+row.path).length,sha256:row.sha256});
const rows=[...after.values()].sort((a,b)=>a.path.localeCompare(b.path));assert.equal(rows.length,5083);
const verify=()=>{for(const row of rows)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path+' spinal input');};verify();
save('source-inputs-after.json',Buffer.from(JSON.stringify(rows,null,2)+'\n'));
save('PREPARATION.json',Buffer.from(JSON.stringify({...prep,stage,scope:'Actual spinal corpus and stale revision save-boundary refusal plus exact inverse. 5083 inputs guarded; owner preview unchanged.'},null,2)+'\n'));
const args=['--test','--experimental-strip-types','--test-concurrency=1','tests/atlas-spinal-muscle-xray.test.mjs','tests/spinal-ct-save-refusal-preservation.test.mjs'];
const coordinator=path.dirname(fileURLToPath(import.meta.url));
const child=spawn(process.execPath,[coordinator+'/run-visible-medicine-check.mjs',stage,'ACTUAL_SPINAL_SAVE',process.execPath,...args],{cwd:coordinator,windowsHide:true,stdio:'inherit'});
save('STARTED.json',Buffer.from(JSON.stringify({at:new Date().toISOString(),driverPid:process.pid,wrapperPid:child.pid,args,files,sourceInputs:5083,canonicalInstalled:false},null,2)+'\n'));
const done=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
const r=json(stage+'/ACTUAL_SPINAL_SAVE.json');assert.equal(r.code,done.code);assert.equal(r.signal,done.signal);assert.equal(sha(read(r.log)),r.logSha256);
let inputDrift=false,error=null;try{verify();}catch(cause){inputDrift=true;error=String(cause);}
const result={at:new Date().toISOString(),...done,inputDrift,error,footer:r.footer,receiptSha256:sha(read(stage+'/ACTUAL_SPINAL_SAVE.json')),
 actualSpinalSaveBoundaryPass:done.code===0&&done.signal===null&&!inputDrift,wholeWebsiteSuitePass:false,canonicalInstalled:false,clinicalApproval:false};
save('RESULT.json',Buffer.from(JSON.stringify(result,null,2)+'\n'));console.log(JSON.stringify(result));process.exitCode=inputDrift?1:done.code??1;
