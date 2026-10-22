// Local-only quality gates for the exact queue successor; never installs or serves it.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';

const root='F:/VisibleMedicine/staging/20261022-review-queue-accessibility-successor';
const sourcePath=root+'/SOURCE.json',sourceHash='c70dfa42798aba75ae16e37d8bb9c96765bc71ff00642db65c4c0814fc86c6b0';
assert.equal(sha(read(sourcePath)),sourceHash);
const source=json(sourcePath),website=source.website;
assert.equal(website,root+'/website');assert.equal(source.sourcePaths,6072);
assert.deepEqual(source.changedProductPaths,['components/ClinicalReviewInbox.tsx']);
const checkSources=()=>source.sourceRows.filter(row=>sha(read(website+'/'+row.path))!==row.sha256).map(row=>row.path);
assert.deepEqual(checkSources(),[]);
for(const label of ['native-inbox','types-current']){
 const result=json(root+'/'+label+'/TERMINAL.json');
 assert.equal(result.sourceReceiptSha256,sourceHash);assert.equal(result.code,0);assert.deepEqual(result.sourceDrift,[]);
}
const binding=json(website+'/atlas-review/integration-inputs.json');
assert.equal(binding.sha256,source.review);
// This product change is outside the bound Review renderer. No rebind or pin rewrite.
assert(!JSON.stringify(binding).includes('components/ClinicalReviewInbox.tsx'));
const environment=nativeAtlasEnvironment({atlas:'F:/VisibleMedicine/atlas',revision:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',tree:'e9165d7122361f809a267af1414b337b69097fe2'});
const evidence=root+'/quality-build';assert(!fs.existsSync(evidence));fs.mkdirSync(evidence);
const results=[];
function updatePointer(value){
 const pointer=json('CURRENT_CHECKPOINT.json');
 assert.equal(pointer.activeWork.current.ownerPreviewPolicy.websiteCutoverPermitted,false);
 pointer.activeWork.current.queueBuildRun={...value,evidence,sourceReceipt:sourcePath,sourceReceiptSha256:sourceHash,ownerPreviewChanged:false};
 fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
}
async function run(label,args){
 assert.deepEqual(checkSources(),[],'Input vector unchanged before '+label);
 const output=fs.createWriteStream(evidence+'/'+label+'.stdout.log',{flags:'wx'});
 const error=fs.createWriteStream(evidence+'/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd:website,env:environment,windowsHide:true,stdio:['ignore','pipe','pipe']});
 child.stdout.pipe(output);child.stderr.pipe(error);
 updatePointer({at:new Date().toISOString(),phase:label,pid:child.pid,terminal:false,heavyJobRunning:true});
 console.log(JSON.stringify({phase:label,pid:child.pid}));
 const outcome=await new Promise(resolve=>{
  child.once('error',e=>resolve({code:null,signal:null,error:String(e)}));
  child.once('close',(code,signal)=>resolve({code,signal}));
 });
 await Promise.all([output,error].map(stream=>new Promise(resolve=>stream.closed?resolve():stream.once('close',resolve))));
 const result={at:new Date().toISOString(),label,args,...outcome,sourceDrift:checkSources(),stdoutSha256:sha(read(evidence+'/'+label+'.stdout.log')),stderrSha256:sha(read(evidence+'/'+label+'.stderr.log'))};
 fs.writeFileSync(evidence+'/'+label+'.TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});results.push(result);
 console.log(JSON.stringify(result));
 assert.equal(result.code,0,'Retain failed gate and stop: '+label);assert.deepEqual(result.sourceDrift,[],'Build may not mutate declared source inputs');
}
let failure=null;
try{
 await run('review',['scripts/verify-clinical-review.mjs']);
 await run('models',['scripts/atlas-model-inventory.mjs','--check']);
 await run('delivery',['--experimental-strip-types','scripts/verify-atlas-delivery-policy.mjs']);
 await run('lectures',['scripts/lecture-body-catalog.mjs','--check']);
 await run('website',['node_modules/vinext/dist/cli.js','build']);
}catch(error){failure=String(error);}
const terminal={at:new Date().toISOString(),terminal:true,sourceReceipt:sourcePath,sourceReceiptSha256:sourceHash,sourcePaths:source.sourcePaths,review:source.review,
 results,code:failure?1:0,failure,sourceDrift:checkSources(),allGatesPassed:!failure&&results.length===5,
 fullTypesReusedFrom:root+'/types-current/TERMINAL.json',queueNativeChecks:root+'/native-inbox/TERMINAL.json',
 boundReviewUnchanged:true,paneLabelProposalUnapplied:true,ownerPreviewChanged:false,canonicalInstalled:false,
 browserOrAssistiveAcceptance:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(evidence+'/TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});
updatePointer({at:terminal.at,phase:failure?'failed-preserved':'quality-built',pid:null,terminal:true,heavyJobRunning:false,result:evidence+'/TERMINAL.json',code:terminal.code,sourceDrift:terminal.sourceDrift});
console.log(JSON.stringify({terminal:evidence+'/TERMINAL.json',sha256:sha(read(evidence+'/TERMINAL.json')),code:terminal.code,sourceDrift:terminal.sourceDrift,ownerPreviewChanged:false}));
if(failure)process.exitCode=1;
