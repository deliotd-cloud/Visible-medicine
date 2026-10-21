// Admit only reviewed repair layers, then execute all four failed clinical modules.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const parent='F:/VisibleMedicine/staging/20261021-current-contract-application';
const stage='F:/VisibleMedicine/staging/20261021-clinical-retry';
const prep=json(parent+'/PREPARATION.json'),result=json(parent+'/RESULT.json');
assert.equal(result.code,1);assert.equal(result.signal,null);assert.equal(result.inputDrift,false);
assert(result.footer.some(v=>v.endsWith('tests 11'))&&result.footer.some(v=>v.endsWith('fail 1')));
const proof=json(parent+'/FOUR_REPAIR_PRESERVATION.json');assert.equal(proof.code,0);assert.equal(sha(read(proof.log)),proof.logSha256);assert(proof.footer.some(v=>v.endsWith('pass 6')));
const inputs=json(parent+'/source-inputs-after.json');assert.equal(inputs.length,5082);
for(const row of inputs)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path+' previous stable input');
const files=[
 ['elbow-forearm-tour-epoch-repair','clinical-review-elbow-us-followup.test.ts','9b0b950ead7cc57f0dfe069d1a359a65b96e15a51aa004dca536f52e0ed3b443','666eadec1b2b71bed584db21d022a5af97d4e6f5e8b589ab0c7d77704b63800e'],
 ['elbow-forearm-tour-epoch-repair','clinical-review-forearm-vascular-xray.test.ts','108d94b7a5b0ead7e302ab576b2f295d44eb7cd7c2229de686115402379b6778','1e609a7bd8a18d032a3d586c1bab99cc3ebed8f4c4b5477bcf0e055110eeb058'],
 ['elbow-forearm-tour-epoch-repair','elbow-us-followup-preservation.test.mjs','00c2bbcf29ab8ad3dfa3f1032643e302a17bb4bf70e9fe59a12b7ed3dcd1b166','b2127dac886e0811462cfef39cd885e3d118cb13db442e01a573d307d1a9dff5'],
 ['elbow-forearm-tour-epoch-repair','forearm-xray-preservation.test.mjs','3d9822101754c23bd6a7d7e3645a30743f0ce0fc0299771c630634032f16a205','41b999b07c36480e8b4fa85a34e532218c9a2666022d5a6a4543aff3f0b2a791'],
 ['salivary-later-ct-repair','clinical-review-salivary-stylohyoid-quiz.test.ts','fe9bbfe9e64286d36f1f373fd18475e91cdaf7a2ba6c504a0a71c7e483666dd5','13e34a676028b2f622f9f703d4f196da3810c4c3108475b82c2c5146155f124f'],
 ['salivary-later-ct-repair','clinical-review-git-root-preservation.test.mjs','0e244cfc0601dd9fd085e27e1ed6e75d04c30b1fac2fb6d2a0af18dff58b9c7d','872c394d575408abedc9a6944d2823451eb19edf865e5194508f4e022054f72e'],
 ['hepatic-xray-contract-proposal','clinical-review-hepatic-venous-xray.test.ts','9d598a559ec9543a6be1bfa9521559c61d9531519aadc2483efc8b1f529e0b6c','182d5a2130226f0deaa4b32ae8458c804a8a05f72d44bb619fa62b786b29edb5'],
 ['hepatic-xray-contract-proposal','hepatic-xray-preservation.test.mjs','528541621527a51ddb49af89aa24761c27778835df0445c00f5eafe14aef3a23','e425bc21bc5f8046da4a4d49b3f07af27486a24994a4546be332119cfbf7099d'],
];
const origins=files.map(([folder,p,post,old])=>({path:'tests/'+p,origin:'F:/VisibleMedicine/staging/20261021-'+folder+'/tests/'+p,sha256:post,beforeSha256:old}));
for(const row of origins){assert.equal(sha(read(row.origin)),row.sha256);assert.equal(sha(read(prep.site+'/'+row.path)),row.beforeSha256);assert(!read(row.origin).includes(13),'Reviewed LF executable');}
assert(!fs.existsSync(stage));fs.mkdirSync(stage);const save=(p,b)=>{const to=stage+'/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,b,{flag:'wx'});};
save('previous-current-contract-result.json',read(parent+'/RESULT.json'));
for(const row of origins){save('originals/'+row.path,read(prep.site+'/'+row.path));fs.copyFileSync(row.origin,prep.site+'/'+row.path);assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256);}
const after=new Map(inputs.map(row=>[row.path,row]));for(const row of origins)after.set(row.path,{path:row.path,bytes:read(prep.site+'/'+row.path).length,sha256:row.sha256});
const rows=[...after.values()].sort((a,b)=>a.path.localeCompare(b.path));assert.equal(rows.length,5082);
const verify=()=>{for(const row of rows)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path+' repair input');};verify();
save('source-inputs-after.json',Buffer.from(JSON.stringify(rows,null,2)+'\n'));
save('PREPARATION.json',Buffer.from(JSON.stringify({...prep,stage,scope:'Actual four previouslyfailed clinical modules plus four exact preservation guards;5082before/after guard; owner website unchanged.'},null,2)+'\n'));
const args=['--test','--experimental-strip-types','--test-concurrency=1',...origins.map(row=>row.path)];
const coordinator=path.dirname(fileURLToPath(import.meta.url));
const child=spawn(process.execPath,[coordinator+'/run-visible-medicine-check.mjs',stage,'ACTUAL_CLINICAL_REPAIRS',process.execPath,...args],{cwd:coordinator,windowsHide:true,stdio:'inherit'});
save('STARTED.json',Buffer.from(JSON.stringify({at:new Date().toISOString(),driverPid:process.pid,wrapperPid:child.pid,args,files:origins,sourceInputs:5082,canonicalInstalled:false},null,2)+'\n'));
const done=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
const r=json(stage+'/ACTUAL_CLINICAL_REPAIRS.json');assert.equal(r.code,done.code);assert.equal(r.signal,done.signal);assert.equal(sha(read(r.log)),r.logSha256);
let inputDrift=false,error=null;try{verify();}catch(cause){inputDrift=true;error=String(cause);}
const final={at:new Date().toISOString(),...done,inputDrift,error,footer:r.footer,receiptSha256:sha(read(stage+'/ACTUAL_CLINICAL_REPAIRS.json')),
 actualFourClinicalRepairsPass:done.code===0&&done.signal===null&&!inputDrift,wholeWebsiteSuitePass:false,canonicalInstalled:false,clinicalApproval:false};
save('RESULT.json',Buffer.from(JSON.stringify(final,null,2)+'\n'));console.log(JSON.stringify(final));process.exitCode=inputDrift?1:done.code??1;
