import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-buffer-type-application',prep=json(stage+'/PREPARATION.json');
const source=json('F:/VisibleMedicine/staging/20261021-review-return-application/PREPARATION.json');
const snapshot=stage+'/SOURCE_INPUTS_AFTER.json',inputs=json(snapshot);
const verify=()=>{
 assert.equal(inputs.length,5155);for(const r of inputs)assert.equal(sha(read(prep.site+'/'+r.path)),r.sha256,r.path);
 const bound=json(prep.site+'/atlas-review/integration-inputs.json');assert.equal(bound.sha256,prep.review);assert.equal(bound.inputs.length,1710);
 for(const r of bound.inputs)assert.equal(sha(read(prep.site+'/'+r.path)),r.sha256,r.path);
 assert.equal(sha(read(prep.site+'/tests/elbow-current-lifecycle-preservation.test.mjs')),prep.excludedPreexistingElbowGuard.guardSha256);
};verify();
const argsForTests=['--test','--test-reporter=spec','--experimental-strip-types','--test-concurrency=1',...prep.changes.filter(r=>r.path.endsWith('.ts')).map(r=>r.path),'tests/clinical-epoch-batch-e-preservation.test.mjs'];
const commands=[['AFFECTED_NATIVE',argsForTests],['FRESH_FULL_TYPES',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']],['VERIFY_REVIEW',['scripts/verify-clinical-review.mjs']],['VERIFY_DELIVERY',['scripts/verify-atlas-delivery-policy.mjs']],['PRODUCTION_BUILD',['node_modules/vinext/dist/cli.js','build']]];
const results=[];
for(const [label,args]of commands){
 verify();const log=stage+'/'+label+'.log',stream=fs.createWriteStream(log,{flags:'wx'}),begin=Date.now();
 const child=spawn(process.execPath,args,{cwd:prep.site,windowsHide:true,env:{...process.env,VM_ATLAS_SOURCE_REPO:source.atlas,NODE_OPTIONS:'--max-old-space-size=4096',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},stdio:['ignore','pipe','pipe']});
 child.stdout.pipe(stream,{end:false});child.stderr.pipe(stream,{end:false});
 fs.writeFileSync(stage+'/'+label+'.STARTED.json',JSON.stringify({at:new Date().toISOString(),driver:process.pid,pid:child.pid,args},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({phase:label,pid:child.pid}));
 const result=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await new Promise(resolve=>stream.end(resolve));let inputError=null;try{verify();}catch(e){inputError=String(e);}
 const text=read(log).toString(),footer=text.split(/\r?\n/).filter(l=>/^[ℹ#] (?:tests|pass|fail|cancelled|skipped|todo) \d+$/.test(l));
 const receipt={label,args,...result,durationMs:Date.now()-begin,log,logSha256:sha(read(log)),footer,sourceInputsUnchanged:inputError===null,inputError,source:source.source,review:prep.review,namedInputs:5155,canonicalInstalled:false,ownerPreviewChanged:false};
 fs.writeFileSync(stage+'/'+label+'.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});results.push(receipt);console.log(JSON.stringify(receipt));
 if(result.code!==0||inputError){process.exitCode=1;break;}
}
fs.writeFileSync(stage+'/VERIFICATION.json',JSON.stringify({at:new Date().toISOString(),results,passed:results.length===commands.length&&results.every(r=>r.code===0&&r.sourceInputsUnchanged),sourceSnapshot:snapshot,sourceSnapshotSha256:sha(read(snapshot)),historicalFullSuiteFailuresRetained:136,fullSuitePassingClaim:false,canonicalInstalled:false},null,2)+'\n',{flag:'wx'});
