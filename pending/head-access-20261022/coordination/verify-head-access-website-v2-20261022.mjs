// Freeze and verify the coherent unpublished website; never installs or restarts it.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-model-access-candidate',state=json(root+'/SOURCE_IMPORT_V2.json'),site=state.website;
const prep=json(root+'/WEBSITE_PREPARED.json'),previous=json(prep.sourceReceipt),prior=previous.website,admission=json(root+'/DELIVERY_ADMISSION.json');
assert.equal(state.code,0);assert.equal(state.source,'ea70b126efc1b9a4e9c9b576587f922650145e53');assert.equal(admission.source,state.source);
assert.equal(sha(read(prep.sourceReceipt)),prep.sourceReceiptSha256);assert(!fs.existsSync(root+'/SOURCE_WEBSITE_V2.json'));assert(!fs.existsSync(root+'/website-verification-v2'));
assert.equal(json(root+'/consumer-rebind/TERMINAL.json').code,0);
const paths=new Set(previous.sourceRows.map(row=>row.path));
for(const row of json(root+'/SOURCE_WEBSITE.json').sourceRows)paths.add(row.path);
for(const[base,manifest]of [['atlas-review/',json(site+'/atlas-review/manifest.json')],['public/atlas-review-viewer/',json(site+'/public/atlas-review-viewer/manifest.json')],['public/atlas-runtime/head-neck/',json(site+'/public/atlas-runtime/head-neck/manifest.json')]])for(const row of manifest.files)paths.add(base+row.path);
for(const p of [admission.testFixture,admission.pinFixture,'tests/head-model-access-integration.test.mjs','tests/head-model-access-navigation.test.ts'])paths.add(p);
const sourceRows=[...paths].sort().map(p=>{containedTarget(site,p);const bytes=read(site+'/'+p);return{path:p,bytes:bytes.length,sha256:sha(bytes)};});
const before=new Map(previous.sourceRows.map(row=>[row.path,row.sha256])),changed=sourceRows.filter(r=>before.has(r.path)&&before.get(r.path)!==r.sha256).map(r=>r.path),added=sourceRows.filter(r=>!before.has(r.path)).map(r=>r.path);
const hostAllowed=new Set(['components/HeadAtlasInlineComparison.tsx','components/HeadAtlasGuidedModel.tsx','components/HeadAtlasLinkedModel.tsx','components/HeadAtlasComparisonNavigation.tsx','lib/head-live-selection.ts','lib/atlas-delivery-policy.ts','scripts/check-anatomy-coverage.mjs','scripts/import-clinical-review.mjs']);
for(const p of changed)if(!/^(?:atlas-review\/|public\/atlas-(?:runtime|review-viewer)\/|docs\/anatomy-coverage\/|lib\/(?:atlas-model-inventory|lecture-body-catalog|anatomy-coverage-view)\.(?:json|ts)|tests\/)/.test(p))assert(hostAllowed.has(p),p);
for(const row of json(root+'/SOURCE.json').hostChanges)assert.equal(sha(read(site+'/'+row.path)),row.afterSha256,row.path);
assert.deepEqual(read(site+'/tests/current-atlas-delivery.mjs'),read(prior+'/tests/current-atlas-delivery.mjs'));
const source={at:new Date().toISOString(),website:site,atlas:state.atlas,atlasHead:state.source,atlasTree:state.tree,sourceRows,sourcePaths:sourceRows.length,
 review:state.review,boundInputs:state.boundInputs,importedSources:state.importedSources,previousSource:prep.sourceReceipt,previousSourceSha256:prep.sourceReceiptSha256,
 changedPaths:changed,addedPaths:added,sourceImportSha256:sha(read(root+'/SOURCE_IMPORT_V2.json')),deliveryAdmissionSha256:sha(read(root+'/DELIVERY_ADMISSION.json')),firstSourceReceiptSha256:sha(read(root+'/SOURCE_WEBSITE.json')),consumerCorrectionSha256:sha(read(root+'/consumer-rebind/TERMINAL.json')),
 canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,nativeAccepted:false,typesPassed:false,websiteBuilt:false};
const receipt=root+'/SOURCE_WEBSITE_V2.json',evidence=root+'/website-verification-v2';fs.writeFileSync(receipt,JSON.stringify(source,null,2)+'\n',{flag:'wx'});fs.mkdirSync(evidence);
const env=nativeAtlasEnvironment({atlas:source.atlas,revision:source.atlasHead,tree:source.atlasTree});
const tests=['tests/current-atlas-delivery.test.mjs','tests/head-model-access-integration.test.mjs',
 'tests/head-live-selection.test.ts','tests/head-inline-frame.test.ts','tests/head-inline-commit-lifecycle.test.ts','tests/head-comparison-parent-commit.test.ts','tests/head-tour-inline-confirmation.test.ts','tests/head-inline-comparison-loader.test.ts',
 'tests/head-atlas-links.test.ts','tests/head-mri-only-links.test.ts','tests/head-guided-3d-fallback.test.ts',
 'tests/head-live-model.test.ts','tests/head-guided-model.test.ts','tests/head-guided-model-commit.test.ts','tests/head-guided-model-playback.test.ts','tests/head-atlas-comparison.test.ts','tests/head-linked-navigation-regressions-20261009.test.ts','tests/head-comparison-revision.test.ts','tests/head-model-access-navigation.test.ts'];
const jobs=[['native',['--test','--experimental-strip-types','--test-concurrency=1','--test-reporter=tap',...tests]],
 ['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']],['website-build',['node_modules/vinext/dist/cli.js','build']]];
const commands=[];let failure=null;
try{for(const[label,args]of jobs){
 const out=fs.createWriteStream(evidence+'/'+label+'.stdout.log',{flags:'wx'}),err=fs.createWriteStream(evidence+'/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd:site,env,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);console.log(JSON.stringify({label,pid:child.pid}));
 const p=json('CURRENT_CHECKPOINT.json');p.activeWork.current.headAccessWebsiteRun={at:new Date().toISOString(),sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),label,pid:child.pid,terminal:false,ownerPreviewChanged:false};fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');
 const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
 const counts=Object.fromEntries([...read(out.path).toString().matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(m=>[m[1],Number(m[2])]));
 const result={label,args,...outcome,counts,stdoutSha256:sha(read(out.path)),stderrSha256:sha(read(err.path))};commands.push(result);fs.writeFileSync(evidence+'/'+label+'.TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));assert.equal(outcome.code,0,label);
 if(label==='native'){assert(counts.tests>0);assert.equal(counts.tests,counts.pass);assert.equal(counts.fail,0);assert.equal(counts.skipped,0);assert.equal(counts.cancelled,0);}
}}catch(error){failure=String(error);}
const drift=sourceRows.filter(row=>sha(read(site+'/'+row.path))!==row.sha256).map(row=>row.path),priorDrift=previous.sourceRows.filter(row=>sha(read(prior+'/'+row.path))!==row.sha256).map(row=>row.path);
if(drift.length||priorDrift.length)failure??='Source drift';assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
const result={at:new Date().toISOString(),terminal:true,code:failure?1:0,failure,commands,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),sourcePaths:sourceRows.length,
 sourceDrift:drift,priorSourceDrift:priorDrift,review:source.review,wholeSuitePassing:false,newHostBrowserAcceptance:false,canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(evidence+'/TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});const p=json('CURRENT_CHECKPOINT.json');Object.assign(p.activeWork.current.headAccessWebsiteRun,{pid:null,terminal:true,code:result.code,result:evidence+'/TERMINAL.json'});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');
console.log(JSON.stringify({receipt:evidence+'/TERMINAL.json',sha256:sha(read(evidence+'/TERMINAL.json')),code:result.code,failure,sourcePaths:sourceRows.length}));if(failure)process.exitCode=1;
