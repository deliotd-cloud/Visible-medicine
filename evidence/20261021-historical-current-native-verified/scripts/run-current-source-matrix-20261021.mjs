import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage=process.argv[2]??'F:/VisibleMedicine/staging/20261021-current-source-matrix';
assert(/^F:\/VisibleMedicine\/staging\/20261021-(?:current-source-matrix|head-specimen-actual-native|current-source-matrix-followup(?:-v2)?)$/.test(stage),'Explicit owned native matrix only');
const prep=json(stage+'/PREPARATION.json');assert.equal(prep.stage,stage);
const verify=()=>{
 assert.equal(sha(read(prep.frozenSnapshot)),prep.frozenSnapshotSha256);
 assert.equal(sha(read(prep.effectiveSnapshot)),prep.effectiveSnapshotSha256);
 for(const row of json(prep.frozenSnapshot))assert.equal(sha(read(prep.sourceSite+'/'+row.path)),row.sha256,'Frozen source: '+row.path);
 for(const row of json(prep.effectiveSnapshot))assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,'Matrix input: '+row.path);
 const bound=json(prep.sourceSite+'/atlas-review/integration-inputs.json');assert.equal(bound.sha256,prep.review);
 for(const row of bound.inputs){assert.equal(sha(read(prep.sourceSite+'/'+row.path)),row.sha256,row.path);assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path);}
};
verify();assert(!fs.existsSync(stage+'/STARTED.json'));
const log=stage+'/child.log',tap=stage+'/child.tap',stream=fs.createWriteStream(log,{flags:'wx'});
const args=['--test','--test-reporter=spec','--test-reporter-destination=stdout','--test-reporter=tap','--test-reporter-destination='+tap,'--experimental-strip-types','--test-concurrency=1',...prep.actualCurrentModules];
const child=spawn(process.execPath,args,{cwd:prep.site,windowsHide:true,env:{...process.env,VM_ATLAS_SOURCE_REPO:prep.atlas,NODE_OPTIONS:'--max-old-space-size=4096',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},stdio:['ignore','pipe','pipe']});
child.stdout.pipe(stream,{end:false});child.stderr.pipe(stream,{end:false});
fs.writeFileSync(stage+'/STARTED.json',JSON.stringify({at:new Date().toISOString(),driver:process.pid,pid:child.pid,args,source:prep.source,review:prep.review,effectiveInputsSha256:prep.effectiveSnapshotSha256},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,driver:process.pid,pid:child.pid,modules:prep.actualCurrentModules.length,log}));
const result=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});
await new Promise(resolve=>stream.end(resolve));
let inputError=null;try{verify();}catch(error){inputError=String(error);}
const footer=read(log).toString().split(/\r?\n/).filter(line=>/^ℹ (?:tests|pass|fail|cancelled|skipped|todo) \d+$/.test(line));
const counts=Object.fromEntries(footer.map(line=>{const [,key,value]=/^ℹ (\w+) (\d+)$/.exec(line);return[key,Number(value)];}));
const receipt={...result,at:new Date().toISOString(),log,logSha256:sha(read(log)),tap,tapSha256:fs.existsSync(tap)?sha(read(tap)):null,footer,counts,sourceInputsUnchanged:inputError===null,inputError,actualCurrentModules:prep.actualCurrentModules,source:prep.source,review:prep.review,effectiveInputsSha256:prep.effectiveSnapshotSha256,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,fullSuitePassingClaim:false};
fs.writeFileSync(stage+'/MATRIX_RESULT.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,...result,counts,sourceInputsUnchanged:inputError===null,logSha256:receipt.logSha256}));process.exitCode=inputError?2:(result.code??1);
