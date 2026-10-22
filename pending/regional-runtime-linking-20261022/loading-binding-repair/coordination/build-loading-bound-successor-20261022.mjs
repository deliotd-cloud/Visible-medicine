import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';

const root='F:/VisibleMedicine/staging/20261022-review-loading-bound-successor',website=root+'/website';
const prepared=json(root+'/PREPARED.json');
assert.equal(prepared.website,website);assert.equal(prepared.sourcePaths,6049);
const previous=json(prepared.previousSource),proposal=json(prepared.bindingProposal);
assert.equal(sha(read(prepared.previousSource)),prepared.previousSourceSha256);
assert.equal(sha(read(prepared.bindingProposal)),prepared.bindingProposalSha256);
assert.equal(json(prepared.priorTerminal).terminal,true);
for(const row of previous.sourceRows)assert.equal(sha(read(website+'/'+row.path)),row.sha256,row.path);
const step=root+'/quality';assert(!fs.existsSync(step));fs.mkdirSync(step);
const environment=nativeAtlasEnvironment({atlas:'F:/VisibleMedicine/atlas',revision:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',tree:'e9165d7122361f809a267af1414b337b69097fe2'});
const results=[];
async function run(label,args){
 const stdout=fs.createWriteStream(step+'/'+label+'.stdout.log',{flags:'wx'}),stderr=fs.createWriteStream(step+'/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd:website,env:environment,windowsHide:true,stdio:['ignore','pipe','pipe']});
 child.stdout.pipe(stdout);child.stderr.pipe(stderr);
 console.log(JSON.stringify({phase:label,pid:child.pid,root}));
 const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.current.bindingRepair={...pointer.activeWork.current.bindingRepair,phase:label,pid:child.pid,heavyJobRunning:true,buildDriver:'build-loading-bound-successor-20261022.mjs'};
 fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
 const result=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([stdout,stderr].map(stream=>new Promise(resolve=>stream.closed?resolve():stream.once('close',resolve))));
 const terminal={at:new Date().toISOString(),label,args,...result,stdoutSha256:sha(read(step+'/'+label+'.stdout.log')),stderrSha256:sha(read(step+'/'+label+'.stderr.log'))};
 fs.writeFileSync(step+'/'+label+'.TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});results.push(terminal);
 console.log(JSON.stringify(terminal));assert.equal(result.code,0,'Preserve the failing step; do not continue: '+label);
}
const oldPin=json(website+'/tests/fixtures/current-atlas-delivery.json');
fs.copyFileSync(website+'/tests/fixtures/current-atlas-delivery.json',step+'/current-pin.before.json');
const viewerRoot=website+'/public/atlas-review-viewer';
assert.equal(path.resolve(viewerRoot),path.resolve(root,'website/public/atlas-review-viewer'));
assert(!fs.lstatSync(viewerRoot).isSymbolicLink(),'Builder output must remain within the new isolated candidate');
const walk=(directory,prefix='')=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
 assert(!entry.isSymbolicLink());const relative=prefix+entry.name;
 return entry.isDirectory()?walk(directory+'/'+entry.name,relative+'/'):[relative];
});
const beforeViewer=json(viewerRoot+'/manifest.json');
const beforeFiles=walk(viewerRoot).map(relative=>{
 const bytes=read(viewerRoot+'/'+relative),to=step+'/viewer-before/'+relative;
 fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(viewerRoot+'/'+relative,to);
 return {path:relative,sha256:sha(bytes),bytes:bytes.length};
});
fs.writeFileSync(step+'/viewer-before.json',JSON.stringify(beforeFiles,null,2)+'\n',{flag:'wx'});
await run('bind',['scripts/bind-clinical-review.mjs']);
for(const row of proposal.files)assert.equal(sha(read(website+'/'+row.path)),row.afterSha256,'Actual producer equals the reviewed virtual proposal: '+row.path);
assert.equal(json(website+'/atlas-review/integration-inputs.json').sha256,proposal.proposedReview);
await run('viewer',['scripts/build-clinical-review-viewer.mjs']);
const viewer=json(viewerRoot+'/manifest.json');
assert.equal(viewer.websiteIntegrationSha256,proposal.proposedReview);
assert.equal(viewer.sourceCommit,beforeViewer.sourceCommit);assert.equal(viewer.mode,'production');
assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.files.length,46);assert.equal(viewer.packages.length,22);
const sorted=rows=>[...rows].sort((a,b)=>a.name.localeCompare(b.name));
assert.deepEqual(sorted(viewer.packages),sorted(beforeViewer.packages));
assert.equal(sha(read(viewerRoot+'/THIRD_PARTY_NOTICES.txt')),sha(read(step+'/viewer-before/THIRD_PARTY_NOTICES.txt')));
for(const row of viewer.files)assert.equal(sha(read(viewerRoot+'/'+row.path)),row.sha256);
const retained=[];
for(const row of beforeFiles.filter(row=>/^assets\/.+\.(?:js|css)$/.test(row.path))){
 const to=viewerRoot+'/'+row.path;
 if(fs.existsSync(to))assert.equal(sha(read(to)),row.sha256,'No hashed filename collision: '+row.path);
 else{fs.copyFileSync(step+'/viewer-before/'+row.path,to,fs.constants.COPYFILE_EXCL);retained.push(row);}
}
const pin=structuredClone(oldPin);pin.reviewIntegration=proposal.proposedReview;
for(const doc of Object.keys(pin.documents))pin.documents[doc]=sha(read(website+'/'+doc));
const changedDocuments=Object.keys(pin.documents).filter(doc=>pin.documents[doc]!==oldPin.documents[doc]).sort();
assert.deepEqual(changedDocuments,['atlas-review/integration-inputs.json','atlas-review/manifest.json','public/atlas-review-viewer/manifest.json']);
assert.equal(pin.schema,'vm-current-atlas-test-delivery-2');assert.deepEqual(pin.runtimeSources,oldPin.runtimeSources);
fs.writeFileSync(website+'/tests/fixtures/current-atlas-delivery.json',JSON.stringify(pin,null,2)+'\n');
const afterBinding=proposal.files.map(row=>({path:row.path,sha256:sha(read(website+'/'+row.path))}));
await run('bind-idempotence',['scripts/bind-clinical-review.mjs']);
for(const row of afterBinding)assert.equal(sha(read(website+'/'+row.path)),row.sha256,'Real producer must be idempotent: '+row.path);
await run('review',['scripts/verify-clinical-review.mjs']);
await run('models',['scripts/atlas-model-inventory.mjs','--check']);
await run('delivery',['--experimental-strip-types','scripts/verify-atlas-delivery-policy.mjs']);
await run('lectures',['scripts/lecture-body-catalog.mjs','--check']);
await run('types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']);
await run('website',['node_modules/vinext/dist/cli.js','build']);
const allowed=new Set([...proposal.files.map(row=>row.path),'tests/fixtures/current-atlas-delivery.json']);
const unexpected=previous.sourceRows.filter(row=>!allowed.has(row.path)&&!row.path.startsWith('public/atlas-review-viewer/')&&sha(read(website+'/'+row.path))!==row.sha256);
assert.deepEqual(unexpected,[],'No unrelated source mutation');
// Recheck the unchanged predecessor and every retained compatibility asset.
for(const row of previous.sourceRows)assert.equal(sha(read(previous.website+'/'+row.path)),row.sha256,'Frozen V6 predecessor: '+row.path);
for(const row of beforeFiles.filter(row=>/^assets\/.+\.(?:js|css)$/.test(row.path)))assert.equal(sha(read(viewerRoot+'/'+row.path)),row.sha256);
const sourceNames=new Set([...previous.sourceRows.map(row=>row.path),...walk(viewerRoot).map(name=>'public/atlas-review-viewer/'+name)]);
const sourceRows=[...sourceNames].sort((a,b)=>a.localeCompare(b)).map(relative=>{const bytes=read(website+'/'+relative);return{path:relative,bytes:bytes.length,sha256:sha(bytes)};});
const final={at:new Date().toISOString(),website,source:pin.source,review:pin.reviewIntegration,sourceRows,
 previousSource:prepared.previousSource,previousSourceSha256:prepared.previousSourceSha256,
 sourcePaths:sourceRows.length,boundInputs:1724,importedSources:1558,viewerFiles:46,viewerPackages:22,
 changedDocuments,retainedCompatibilityAssets:retained.length,results,
 actualBinderIdempotence:true,allStepsPassed:results.every(row=>row.code===0),
 nativeRegressionAccepted:false,original29NativeFailuresRetained:true,
 clinicalApproval:false,spatialRegistration:false,ownerPreviewChanged:false,canonicalInstalled:false,publicDeployment:false};
fs.writeFileSync(root+'/BUILT_SOURCE.json',JSON.stringify(final,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.current.bindingRepair={...pointer.activeWork.current.bindingRepair,
 phase:'built-successor-native-current-role-admission-pending',pid:null,heavyJobRunning:false,applied:true,
 sourceReceipt:root+'/BUILT_SOURCE.json',sourceReceiptSha256:sha(read(root+'/BUILT_SOURCE.json')),review:final.review,
 allBuildStepsPassed:true,nativeAcceptance:false,ownerPreviewChanged:false};
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({phase:'built-and-source-verified',receipt:root+'/BUILT_SOURCE.json',sha256:sha(read(root+'/BUILT_SOURCE.json')),
 review:final.review,sourcePaths:final.sourcePaths,nativeRegressionAccepted:false,ownerPreviewChanged:false}));
