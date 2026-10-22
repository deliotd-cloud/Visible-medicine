import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-review-loading-bound-successor',website=root+'/website';
const sealed=json(root+'/POST_BIND_TYPE_FAILURE_SOURCE.json'),prepared=json(root+'/PREPARED.json');
const original=json(prepared.previousSource),proposal=json(prepared.bindingProposal);
const relative='tests/tongue-palate-delivery.test.ts';
const raw=read(original.website+'/'+relative),code=read(website+'/'+relative);
assert.equal(sha(raw),original.sourceRows.find(r=>r.path===relative).sha256,'Exact frozen V6 failure preimage');
// The first capture overlapped this one test edit. Retain it as observed,
// not as a pre-edit snapshot; recover the original from immutable V6.
assert.deepEqual(read(root+'/type-source-repair/RAW/'+relative),code,'First late capture retained unchanged');
assert.equal(sha(code),sealed.sourceRows.find(r=>r.path===relative).sha256,'Observed post-edit source receipt');
const before="assert(source.equals(git(atlas, 'show', `${authored}:${path}`)), `${path}: authored 6036 source retained`);";
const after="assert.deepEqual(source, git(atlas, 'show', `${authored}:${path}`), `${path}: authored 6036 source retained`);";
assert.equal(code.toString().split(after).length,2);
assert.deepEqual(Buffer.from(code.toString().replace(after,before)),raw,'Complete test inverse: only type-safe exact Buffer comparison');
const environment=nativeAtlasEnvironment({atlas:'F:/VisibleMedicine/atlas',revision:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',tree:'e9165d7122361f809a267af1414b337b69097fe2'});
for(const p of ['content/tongue-palate-quiz-pins.json','content/tongue-palate-quiz.ts','lib/tongue-palate-quiz.ts']){
 const current=execFileSync('git',['show','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1:'+p],{cwd:'F:/VisibleMedicine/atlas',env:environment,windowsHide:true});
 const historical=execFileSync('git',['show','6036a7a59dcc1fd75eee4a23af34ca2a568d86b6:'+p],{cwd:'F:/VisibleMedicine/atlas',env:environment,windowsHide:true});
 assert(current.equals(historical));assert.deepEqual(current,historical);
 const forged=Buffer.from(historical);forged[0]^=1;
 assert.equal(current.equals(forged),false);assert.throws(()=>assert.deepEqual(current,forged));
}
for(const r of sealed.sourceRows)if(r.path!==relative)assert.equal(sha(read(website+'/'+r.path)),r.sha256,'Sealed built source: '+r.path);
for(const label of ['bind','viewer','bind-idempotence','review','models','delivery','lectures']){
 const result=json(root+'/quality/'+label+'.TERMINAL.json');assert.equal(result.code,0);
 for(const kind of ['stdout','stderr'])assert.equal(sha(read(root+'/quality/'+label+'.'+kind+'.log')),result[kind+'Sha256']);
}
assert.equal(json(root+'/quality/types.TERMINAL.json').code,2);
const stage=root+'/quality-retry-type-safe';assert(!fs.existsSync(stage));fs.mkdirSync(stage);
fs.mkdirSync(root+'/type-source-repair/CODE/tests',{recursive:true});
fs.mkdirSync(root+'/type-source-repair/ORIGINAL-V6/tests',{recursive:true});
fs.copyFileSync(original.website+'/'+relative,root+'/type-source-repair/ORIGINAL-V6/'+relative,fs.constants.COPYFILE_EXCL);
fs.copyFileSync(website+'/'+relative,root+'/type-source-repair/CODE/'+relative,fs.constants.COPYFILE_EXCL);
fs.writeFileSync(root+'/type-source-repair/EVIDENCE.json',JSON.stringify({at:new Date().toISOString(),path:relative,rawSha256:sha(raw),codeSha256:sha(code),
 fullSourceInverse:true,actualThreeGitBuffersCompared:true,bothComparisonsRejectOneByteMutations:true,originalFailurePreserved:true,
 originalSourceAuthority:prepared.previousSource,firstCaptureOverlappedEdit:true,firstRetryRefusedBeforeHeavyWork:true,
 observedReceiptIncludesTypeRepair:true,productSourceChanged:false},null,2)+'\n',{flag:'wx'});
const results=[];
async function run(label,args){
 const out=fs.createWriteStream(stage+'/'+label+'.stdout.log',{flags:'wx'}),err=fs.createWriteStream(stage+'/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd:website,env:environment,windowsHide:true,stdio:['ignore','pipe','pipe']});
 child.stdout.pipe(out);child.stderr.pipe(err);
 const pointer=json('CURRENT_CHECKPOINT.json');Object.assign(pointer.activeWork.current.bindingRepair,{phase:label+'-retry',pid:child.pid,heavyJobRunning:true,buildDriver:'retry-loading-bound-build-20261022.mjs'});
 fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');console.log(JSON.stringify({phase:label,pid:child.pid}));
 const outcome=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
 const terminal={at:new Date().toISOString(),label,args,...outcome,stdoutSha256:sha(read(stage+'/'+label+'.stdout.log')),stderrSha256:sha(read(stage+'/'+label+'.stderr.log'))};
 fs.writeFileSync(stage+'/'+label+'.TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});results.push(terminal);console.log(JSON.stringify(terminal));
 const pointerAfter=json('CURRENT_CHECKPOINT.json');Object.assign(pointerAfter.activeWork.current.bindingRepair,{phase:label+'-retry-terminal',pid:null,heavyJobRunning:false,lastTerminal:stage+'/'+label+'.TERMINAL.json'});
 fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointerAfter,null,2)+'\n');assert.equal(outcome.code,0,'Preserve failed retry: '+label);
}
await run('types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']);
await run('website',['node_modules/vinext/dist/cli.js','build']);
for(const r of sealed.sourceRows)if(r.path!==relative)assert.equal(sha(read(website+'/'+r.path)),r.sha256,'Build did not mutate source: '+r.path);
assert.equal(sha(read(website+'/'+relative)),sha(code));
for(const r of original.sourceRows)assert.equal(sha(read(original.website+'/'+r.path)),r.sha256,'Frozen predecessor remains exact: '+r.path);
const sourceRows=sealed.sourceRows.map(r=>({...r,bytes:read(website+'/'+r.path).length,sha256:sha(read(website+'/'+r.path))}));
const viewer=json(website+'/public/atlas-review-viewer/manifest.json');
for(const row of viewer.files)assert.equal(sha(read(website+'/public/atlas-review-viewer/'+row.path)),row.sha256);
assert.equal(viewer.websiteIntegrationSha256,proposal.proposedReview);
assert.equal(viewer.files.length,46);assert.equal(viewer.packages.length,22);
for(const row of json(root+'/quality/viewer-before.json').filter(r=>/^assets\/.+\.(js|css)$/.test(r.path)))assert.equal(sha(read(website+'/public/atlas-review-viewer/'+row.path)),row.sha256);
const receipt={at:new Date().toISOString(),website,source:viewer.sourceCommit,review:proposal.proposedReview,sourceRows,sourcePaths:sourceRows.length,
 previousSource:prepared.previousSource,previousSourceSha256:prepared.previousSourceSha256,
 postBindingFailureSource:root+'/POST_BIND_TYPE_FAILURE_SOURCE.json',postBindingFailureSourceSha256:sha(read(root+'/POST_BIND_TYPE_FAILURE_SOURCE.json')),
 boundInputs:1724,importedSources:1558,viewerFiles:46,viewerPackages:22,
 successfulProducerSteps:['bind','viewer','bind-idempotence','review','models','delivery','lectures'].map(label=>json(root+'/quality/'+label+'.TERMINAL.json')),
 retryResults:results,typeSafeTestRepair:{path:relative,rawSha256:sha(raw),codeSha256:sha(code)},
 actualBinderIdempotence:true,allBuildStepsPassed:true,firstTypeFailurePreserved:true,
 nativeRegressionAccepted:false,original29NativeFailuresRetained:true,clinicalApproval:false,spatialRegistration:false,ownerPreviewChanged:false,canonicalInstalled:false,publicDeployment:false};
fs.writeFileSync(root+'/BUILT_SOURCE.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');Object.assign(pointer.activeWork.current.bindingRepair,{phase:'built-successor-native-current-role-admission-pending',pid:null,heavyJobRunning:false,
 sourceReceipt:root+'/BUILT_SOURCE.json',sourceReceiptSha256:sha(read(root+'/BUILT_SOURCE.json')),review:receipt.review,allBuildStepsPassed:true,nativeAcceptance:false,ownerPreviewChanged:false});
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({phase:'built-and-source-verified',receipt:root+'/BUILT_SOURCE.json',sha256:sha(read(root+'/BUILT_SOURCE.json')),sourcePaths:receipt.sourcePaths,review:receipt.review,nativeAcceptance:false}));
