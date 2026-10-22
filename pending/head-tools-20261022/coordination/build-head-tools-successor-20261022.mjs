// Actual producer/build for the isolated viewer batch. No canonical writes or installation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-tools-bound-successor',website=root+'/website',preparedPath=root+'/PRE_BIND_SOURCE.json',prepared=json(preparedPath);
assert.equal(prepared.website,website);assert.equal(prepared.boundInputs,1724);assert.equal(prepared.importedSources,1558);
const original=json(prepared.previousSource);assert.equal(sha(read(prepared.previousSource)),prepared.previousSourceSha256);
for(const row of prepared.sourceRows)assert.equal(sha(read(website+'/'+row.path)),row.sha256,row.path);
const evidence=root+'/quality';assert(!fs.existsSync(evidence));fs.mkdirSync(evidence);
const environment=nativeAtlasEnvironment({atlas:'F:/VisibleMedicine/atlas',revision:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',tree:'e9165d7122361f809a267af1414b337b69097fe2'}),results=[];
function update(value){const pointer=json('CURRENT_CHECKPOINT.json');assert.equal(pointer.activeWork.current.ownerPreviewPolicy.websiteCutoverPermitted,false);pointer.activeWork.current.viewerToolsBuild={...value,evidence,website,preparedSource:preparedPath,preparedSourceSha256:sha(read(preparedPath)),ownerPreviewChanged:false};fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');}
async function run(label,args){
 const out=fs.createWriteStream(evidence+'/'+label+'.stdout.log',{flags:'wx'}),err=fs.createWriteStream(evidence+'/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd:website,env:environment,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);
 update({at:new Date().toISOString(),phase:label,pid:child.pid,heavyJobRunning:true,terminal:false});console.log(JSON.stringify({phase:label,pid:child.pid}));
 const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,signal:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([out,err].map(stream=>new Promise(resolve=>stream.closed?resolve():stream.once('close',resolve))));
 const result={at:new Date().toISOString(),label,args,...outcome,stdoutSha256:sha(read(evidence+'/'+label+'.stdout.log')),stderrSha256:sha(read(evidence+'/'+label+'.stderr.log'))};
 fs.writeFileSync(evidence+'/'+label+'.TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});results.push(result);console.log(JSON.stringify(result));assert.equal(result.code,0,'Preserve failure and stop: '+label);
}
const viewerRoot=website+'/public/atlas-review-viewer';assert(!fs.lstatSync(viewerRoot).isSymbolicLink());
const walk=(dir,prefix='')=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{assert(!entry.isSymbolicLink());return entry.isDirectory()?walk(dir+'/'+entry.name,prefix+entry.name+'/'):[prefix+entry.name];});
const beforeViewer=json(viewerRoot+'/manifest.json'),oldPin=json(website+'/tests/fixtures/current-atlas-delivery.json');
const beforeFiles=walk(viewerRoot).map(relative=>{const bytes=read(viewerRoot+'/'+relative),to=evidence+'/viewer-before/'+relative;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(viewerRoot+'/'+relative,to,fs.constants.COPYFILE_EXCL);return{path:relative,bytes:bytes.length,sha256:sha(bytes)};});
fs.writeFileSync(evidence+'/viewer-before.json',JSON.stringify(beforeFiles,null,2)+'\n',{flag:'wx'});fs.copyFileSync(website+'/tests/fixtures/current-atlas-delivery.json',evidence+'/current-pin.before.json',fs.constants.COPYFILE_EXCL);
let failure=null,sourceRows=null,retained=0;
try{
 await run('bind',['scripts/bind-clinical-review.mjs']);
 for(const row of prepared.proposedBindingFiles)assert.equal(sha(read(website+'/'+row.path)),row.afterSha256,'Real binder must equal virtual proposal: '+row.path);
 assert.equal(json(website+'/atlas-review/integration-inputs.json').sha256,prepared.proposedReview);
 await run('viewer',['scripts/build-clinical-review-viewer.mjs']);
 const viewer=json(viewerRoot+'/manifest.json');
 assert.equal(viewer.websiteIntegrationSha256,prepared.proposedReview);assert.equal(viewer.sourceCommit,beforeViewer.sourceCommit);assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.files.length,46);assert.equal(viewer.packages.length,22);
 assert.deepEqual(viewer.packages.toSorted((a,b)=>a.name.localeCompare(b.name)),beforeViewer.packages.toSorted((a,b)=>a.name.localeCompare(b.name)));
 assert.equal(sha(read(viewerRoot+'/THIRD_PARTY_NOTICES.txt')),sha(read(evidence+'/viewer-before/THIRD_PARTY_NOTICES.txt')),'No dependency or licence delta');
 for(const row of viewer.files)assert.equal(sha(read(viewerRoot+'/'+row.path)),row.sha256,row.path);
 for(const row of beforeFiles.filter(row=>/^assets\/.+\.(js|css)$/.test(row.path))){const to=viewerRoot+'/'+row.path;if(fs.existsSync(to))assert.equal(sha(read(to)),row.sha256,'No hash-name collision');else{fs.copyFileSync(evidence+'/viewer-before/'+row.path,to,fs.constants.COPYFILE_EXCL);retained++;}}
 const pin=structuredClone(oldPin);pin.reviewIntegration=prepared.proposedReview;
 for(const doc of Object.keys(pin.documents))pin.documents[doc]=sha(read(website+'/'+doc));
 assert.deepEqual(Object.keys(pin.documents).filter(doc=>pin.documents[doc]!==oldPin.documents[doc]).sort(),['atlas-review/integration-inputs.json','atlas-review/manifest.json','public/atlas-review-viewer/manifest.json']);
 assert.equal(pin.schema,'vm-current-atlas-test-delivery-2');assert.deepEqual(pin.runtimeSources,oldPin.runtimeSources);assert.equal(pin.source,oldPin.source);assert.equal(pin.sourceTree,oldPin.sourceTree);
 fs.writeFileSync(website+'/tests/fixtures/current-atlas-delivery.json',JSON.stringify(pin,null,2)+'\n');
 await run('bind-idempotence',['scripts/bind-clinical-review.mjs']);
 for(const row of prepared.proposedBindingFiles)assert.equal(sha(read(website+'/'+row.path)),row.afterSha256,'Producer idempotence: '+row.path);
 await run('review',['scripts/verify-clinical-review.mjs']);
 await run('models',['scripts/atlas-model-inventory.mjs','--check']);
 await run('delivery',['--experimental-strip-types','scripts/verify-atlas-delivery-policy.mjs']);
 await run('lectures',['scripts/lecture-body-catalog.mjs','--check']);
 await run('types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']);
 await run('website',['node_modules/vinext/dist/cli.js','build']);
 const allowed=new Set([...prepared.proposedBindingFiles.map(row=>row.path),'tests/fixtures/current-atlas-delivery.json']);
 for(const row of prepared.sourceRows)if(!allowed.has(row.path)&&!row.path.startsWith('public/atlas-review-viewer/'))assert.equal(sha(read(website+'/'+row.path)),row.sha256,'No unrelated source mutation: '+row.path);
 for(const row of original.sourceRows)assert.equal(sha(read(original.website+'/'+row.path)),row.sha256,'Predecessor immutable: '+row.path);
 for(const row of beforeFiles.filter(row=>/^assets\/.+\.(js|css)$/.test(row.path)))assert.equal(sha(read(viewerRoot+'/'+row.path)),row.sha256,'Compatibility asset unchanged');
 const paths=new Set([...prepared.sourceRows.map(row=>row.path),...walk(viewerRoot).map(relative=>'public/atlas-review-viewer/'+relative)]);
 sourceRows=[...paths].sort((a,b)=>a.localeCompare(b)).map(relative=>{const bytes=read(website+'/'+relative);return{path:relative,bytes:bytes.length,sha256:sha(bytes)};});
}catch(error){failure=String(error);}
const result={at:new Date().toISOString(),terminal:true,code:failure?1:0,failure,website,review:prepared.proposedReview,previousSource:preparedPath,previousSourceSha256:sha(read(preparedPath)),
 sourceRows,sourcePaths:sourceRows?.length??null,results,boundInputs:1724,importedSources:1558,viewerFiles:46,viewerPackages:22,retainedCompatibilityAssets:retained,
 changedProductPaths:prepared.changedProductPaths,actualRebindPerformed:results.some(row=>row.label==='bind'&&row.code===0),allBuildStepsPassed:!failure,
 nativeAccepted:false,browserAccepted:false,ownerPreviewChanged:false,canonicalInstalled:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(evidence+'/TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
if(!failure)fs.writeFileSync(root+'/BUILT_SOURCE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
update({at:result.at,phase:failure?'failed-preserved':'built-awaiting-native-qa',pid:null,heavyJobRunning:false,terminal:true,result:evidence+'/TERMINAL.json',sourceReceipt:failure?null:root+'/BUILT_SOURCE.json',code:result.code});
console.log(JSON.stringify({result:evidence+'/TERMINAL.json',sha256:sha(read(evidence+'/TERMINAL.json')),sourcePaths:result.sourcePaths,review:result.review,code:result.code,ownerPreviewChanged:false}));if(failure)process.exitCode=1;
