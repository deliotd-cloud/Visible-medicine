import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const base='F:/VisibleMedicine/staging/20261021-',stage=base+'plexus-history-application';
const proposal=base+'plexus-historical-replay-proposal',previous=base+'review-final-retry';
const modules=json(base+'four-module-admission-v2/RESULT.json');assert(modules.passed&&modules.exports.length===4);
const prep=json(previous+'/PREPARATION.json'),inputs=json(previous+'/source-inputs-after.json');assert.equal(inputs.length,5084);
for(const row of inputs)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path+' stable previous input');
assert.equal(sha(read('F:/VisibleMedicine/recovery/checkpoints/20261017-head-incremental-checksum-verified/source/lib/plexus-review-manifest.json')),'8b5ea2560fb44648b5ea322e315e90858c44e768ccc8e044922739ee9282d32d','Genuine private historical metadata stays external/local');
const rows=[
 {path:'tests/plexus-dependency-rebind.test.mjs',beforeSha256:'955ed7714219f50d192f499973dcaf04465f2e562181af655631a75b6fc700a0',sha256:'f0b6e9dc3dd155d67338253f94ba68fd73f16f3ca40b7fe711525e70444953e7'},
 {path:'tests/plexus-presentation-rebind.test.mjs',beforeSha256:'763bf21c4f15455688833baa684dc12bcb16c2a4d0af288156bcccf4f1d09164',sha256:'e10677129e441c7d962b997f89bb957c75eb6e6e74d449142d1752dbfdf342cc'},
 {path:'tests/plexus-historical-source.mjs',beforeSha256:null,sha256:'39ac1003c637bfcde874755e32736a8c35b09f722eb8aefba2cb61a27a218c49'},
 {path:'tests/fixtures/plexus-dependency-rebind.test.mjs.raw',beforeSha256:null,sha256:'955ed7714219f50d192f499973dcaf04465f2e562181af655631a75b6fc700a0'},
 {path:'tests/fixtures/plexus-presentation-rebind.test.mjs.raw',beforeSha256:null,sha256:'763bf21c4f15455688833baa684dc12bcb16c2a4d0af288156bcccf4f1d09164'},
];
for(const row of rows){assert.equal(sha(read(proposal+'/'+row.path)),row.sha256);assert.equal(fs.existsSync(prep.site+'/'+row.path)?sha(read(prep.site+'/'+row.path)):null,row.beforeSha256);}
const once=(text,a,b)=>{assert.equal(text.split(a).length,2,'exact declared historical seam');return text.replace(a,b);};
let dep=read(proposal+'/'+rows[0].path).toString(),presentation=read(proposal+'/'+rows[1].path).toString();
dep=once(dep,"import {readHistoricalWebsite,readPostLockCheckpoint} from './plexus-historical-source.mjs';\n",'');
dep=once(dep,"const read=relative=>relative==='package-lock.json'?afterLock:readHistoricalWebsite(relative);","const read=relative=>readFileSync(relative);");
dep=once(dep," assert.deepEqual(result.packet,readPostLockCheckpoint());\n assert.equal(plexusHash(result.moduleText),'c9c6fbcb71502709b87fefee105bde32cce51cdf88065ec550caa6d8a665bec6');"," assert.deepEqual(result.packet,current);assert.equal(result.moduleText,actual);");
const seam="test('later 16-to-18 presentation dependency extension is separate from the immutable lock transition',()=>{";
assert.equal(dep.split(seam).length,2);dep=dep.slice(0,dep.indexOf(seam));
presentation=once(presentation,"import {readHistoricalWebsite} from './plexus-historical-source.mjs';\n",'');
presentation=once(presentation,"const read=p=>p==='package-lock.json'?historicalLock:readHistoricalWebsite(p);","const read=p=>p==='package-lock.json'?historicalLock:readFileSync(p);");
assert.equal(sha(Buffer.from(dep)),rows[0].beforeSha256,'Whole dependency original retained');
assert.equal(sha(Buffer.from(presentation)),rows[1].beforeSha256,'Whole presentation original retained');
assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const save=(p,bytes)=>{const target=stage+'/'+p;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});};
for(const row of rows)if(row.beforeSha256)save('originals/'+row.path,read(prep.site+'/'+row.path));
const attributes=read(prep.site+'/.gitattributes');save('originals/.gitattributes',attributes);
const rules=rows.map(row=>row.path+(row.path.endsWith('.raw')?' -text':' text eol=lf')).filter(rule=>!attributes.toString().split(/\r?\n/).includes(rule));
const changedAttributes=Buffer.concat([attributes,Buffer.from((attributes.at(-1)===10?'':'\n')+rules.join('\n')+'\n')]);
for(const row of rows)fs.copyFileSync(proposal+'/'+row.path,prep.site+'/'+row.path);
fs.writeFileSync(prep.site+'/.gitattributes',changedAttributes);rows.push({path:'.gitattributes',beforeSha256:sha(attributes),sha256:sha(changedAttributes)});
const all=new Map(inputs.map(row=>[row.path,row]));for(const row of rows)all.set(row.path,{path:row.path,bytes:read(prep.site+'/'+row.path).length,sha256:row.sha256});
const after=[...all.values()].sort((a,b)=>a.path.localeCompare(b.path));assert.equal(after.length,5087);
const verify=()=>{for(const row of after)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path+' current provenance input');};verify();
save('PREPARATION.json',Buffer.from(JSON.stringify({...prep,stage,scope:'Actual historical and later current plexus source-provenance transitions;private immutable manifest remains local outside repo. No runtime/importer/rights/approval changes.'},null,2)+'\n'));
save('source-inputs-after.json',Buffer.from(JSON.stringify(after,null,2)+'\n'));
save('SOURCE_PRESERVATION.json',Buffer.from(JSON.stringify({at:new Date().toISOString(),wholeOriginalTests:2,originalRegistrations:6,addedCurrentTheorem:1,externalPrivateArtifactNotCopied:true},null,2)+'\n'));
const args=['--test','--test-concurrency=1',rows[0].path,rows[1].path],coordinator=path.dirname(fileURLToPath(import.meta.url));
const child=spawn(process.execPath,[coordinator+'/run-visible-medicine-check.mjs',stage,'ACTUAL_PLEXUS_HISTORY',process.execPath,...args],{cwd:coordinator,windowsHide:true,stdio:'inherit'});
save('STARTED.json',Buffer.from(JSON.stringify({at:new Date().toISOString(),driverPid:process.pid,wrapperPid:child.pid,args,files:rows,sourceInputs:5087,canonicalInstalled:false},null,2)+'\n'));
const done=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
const receipt=json(stage+'/ACTUAL_PLEXUS_HISTORY.json');assert.equal(receipt.code,done.code);assert.equal(receipt.signal,done.signal);assert.equal(sha(read(receipt.log)),receipt.logSha256);
let inputDrift=false,error=null;try{verify();}catch(cause){inputDrift=true;error=String(cause);}
const result={at:new Date().toISOString(),...done,inputDrift,error,footer:receipt.footer,receiptSha256:sha(read(stage+'/ACTUAL_PLEXUS_HISTORY.json')),actualPlexusHistoryPass:done.code===0&&done.signal===null&&!inputDrift,fullWebsiteSuitePass:false,canonicalInstalled:false,rightsApproval:false,clinicalApproval:false};
save('RESULT.json',Buffer.from(JSON.stringify(result,null,2)+'\n'));console.log(JSON.stringify(result));process.exitCode=inputDrift?1:done.code??1;
