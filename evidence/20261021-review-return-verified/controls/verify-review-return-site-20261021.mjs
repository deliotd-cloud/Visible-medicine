import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-review-return-application',prep=json(stage+'/PREPARATION.json');
const buildOnly=process.argv[2]==='--build-only';assert(process.argv.length===2||buildOnly);
const snapshot=stage+'/SOURCE_INPUTS_AFTER.json',inputs=json(snapshot);
const verify=()=>{
 assert.equal(inputs.length,5155);for(const row of inputs)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path);
 const bound=json(prep.site+'/atlas-review/integration-inputs.json');assert.equal(bound.sha256,prep.review);assert.equal(bound.inputs.length,1710);
 for(const row of bound.inputs)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path);
};verify();
const commands=[
 ['ACTUAL_REVIEW_UI',['--test','--test-concurrency=1','tests/clinical-review-inbox-return-context.test.mjs',...prep.unchangedExistingTests.map(row=>row.path)]],
 ['FRESH_FULL_TYPES',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']],
 ['VERIFY_REVIEW',['scripts/verify-clinical-review.mjs']],
 ['VERIFY_DELIVERY',['scripts/verify-atlas-delivery-policy.mjs']],
 ['PRODUCTION_BUILD',['node_modules/vinext/dist/cli.js','build']],
].slice(buildOnly?2:0);
const results=[];
for(const [label,args]of commands){
 verify();const log=stage+'/'+label+'.log',stream=fs.createWriteStream(log,{flags:'wx'}),begin=Date.now();
 const child=spawn(process.execPath,args,{cwd:prep.site,windowsHide:true,env:{...process.env,VM_ATLAS_SOURCE_REPO:prep.atlas,NODE_OPTIONS:'--max-old-space-size=4096',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},stdio:['ignore','pipe','pipe']});
 child.stdout.pipe(stream,{end:false});child.stderr.pipe(stream,{end:false});
 fs.writeFileSync(stage+'/'+label+'.STARTED.json',JSON.stringify({at:new Date().toISOString(),driver:process.pid,pid:child.pid,args},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({phase:label,pid:child.pid}));
 const result=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await new Promise(resolve=>stream.end(resolve));let inputError=null;try{verify();}catch(error){inputError=String(error);}
 const receipt={label,args,...result,durationMs:Date.now()-begin,log,logSha256:sha(read(log)),sourceInputsUnchanged:inputError===null,inputError,
  source:prep.source,review:prep.review,namedInputs:5155,canonicalInstalled:false,ownerPreviewChanged:false};
 fs.writeFileSync(stage+'/'+label+'.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});results.push(receipt);console.log(JSON.stringify(receipt));
 if(result.code!==0||inputError){process.exitCode=1;break;}
}
fs.writeFileSync(stage+'/'+(buildOnly?'BUILD_VERIFICATION.json':'SITE_VERIFICATION.json'),JSON.stringify({at:new Date().toISOString(),results,passed:results.length===commands.length&&results.every(row=>row.code===0&&row.sourceInputsUnchanged),buildOnly,freshTypesStillRequired:buildOnly,sourceSnapshot:snapshot,sourceSnapshotSha256:sha(read(snapshot)),canonicalInstalled:false,browserAcceptance:false},null,2)+'\n',{flag:'wx'});
