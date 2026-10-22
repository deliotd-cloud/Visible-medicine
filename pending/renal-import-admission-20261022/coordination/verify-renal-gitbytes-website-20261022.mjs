// Exact-source focused integration and serial production checks; no installation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-renal-gitbytes-website-candidate',imported=json(root+'/SOURCE_IMPORT.json'),admission=json(root+'/DELIVERY_ADMISSION.json'),site=imported.website;
assert.equal(imported.code,0);assert.equal(admission.source,imported.source);assert(!fs.existsSync(root+'/verification'));assert(!fs.existsSync(root+'/SOURCE.json'));
const prepared=json(root+'/WEBSITE_PREPARED.json'),previous=json(prepared.sourceReceipt),prior=previous.website;
assert.equal(sha(read(prepared.sourceReceipt)),prepared.sourceReceiptSha256);
const paths=new Set(previous.sourceRows.map(row=>row.path));
const manifest=json(site+'/atlas-review/manifest.json'),viewer=json(site+'/public/atlas-review-viewer/manifest.json'),runtime=json(site+'/public/atlas-runtime/head-neck/manifest.json');
for(const row of manifest.files)paths.add('atlas-review/'+row.path);
for(const row of viewer.files)paths.add('public/atlas-review-viewer/'+row.path);
for(const row of runtime.files)paths.add('public/atlas-runtime/head-neck/'+row.path);
for(const p of ['tests/atlas-renal-source-tour.test.mjs','tests/atlas-renal-delivery-transition.test.mjs',admission.testFixture,admission.pinFixture])paths.add(p);
const sourceRows=[...paths].sort().map(p=>{containedTarget(site,p);const bytes=read(site+'/'+p);return{path:p,bytes:bytes.length,sha256:sha(bytes)};});
const beforeByPath=new Map(previous.sourceRows.map(row=>[row.path,row.sha256]));
const changed=sourceRows.filter(row=>beforeByPath.has(row.path)&&beforeByPath.get(row.path)!==row.sha256).map(row=>row.path),added=sourceRows.filter(row=>!beforeByPath.has(row.path)).map(row=>row.path);
// No unrelated authored UI, access implementation, dependency or style changes.
const productAllowed=new Set(['scripts/import-clinical-review.mjs','scripts/check-anatomy-coverage.mjs','lib/anatomy-coverage-view.ts','lib/atlas-delivery-policy.ts']);
for(const p of changed)if(!/^(?:atlas-review\/|public\/atlas-(?:runtime|review-viewer)\/|docs\/anatomy-coverage\/|lib\/(?:atlas-model-inventory|lecture-body-catalog)\.json|tests\/)/.test(p))assert(productAllowed.has(p),p);
assert.deepEqual(read(site+'/tests/current-atlas-delivery.mjs'),read(prior+'/tests/current-atlas-delivery.mjs'),'Current validator stays exact');
const source={at:new Date().toISOString(),website:site,atlas:imported.atlas,atlasHead:imported.source,atlasTree:imported.tree,sourceRows,sourcePaths:sourceRows.length,
 review:imported.review,boundInputs:imported.boundInputs,importedSources:imported.importedSources,previousSource:prepared.sourceReceipt,previousSourceSha256:prepared.sourceReceiptSha256,
 changedPaths:changed,addedPaths:added,sourceImportSha256:sha(read(root+'/SOURCE_IMPORT.json')),deliveryAdmissionSha256:sha(read(root+'/DELIVERY_ADMISSION.json')),
 canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,publicDeployment:false,nativeAccepted:false,typesPassed:false,websiteBuilt:false};
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});fs.mkdirSync(root+'/verification');
const environment=nativeAtlasEnvironment({atlas:source.atlas,revision:source.atlasHead,tree:source.atlasTree});
const inbox=sourceRows.map(row=>row.path).filter(p=>/^tests\/clinical-review-inbox(?:-[a-z-]+)?\.test\.(?:mjs|ts)$/.test(p));assert.equal(inbox.length,15);
const tests=['tests/current-atlas-delivery.test.mjs','tests/atlas-renal-source-tour.test.mjs','tests/atlas-renal-delivery-transition.test.mjs','tests/anatomy-coverage-preflight.test.mjs',
 'tests/atlas-body-learning-selection.test.mjs','tests/atlas-body-learning-component.test.mjs','tests/atlas-body-learning-space.test.mjs',
 'tests/lecture-body-reference.test.mjs','tests/lecture-body-content.test.mjs','tests/lecture-body-related.test.mjs','tests/lecture-body-ui.test.mjs',
 'tests/atlas-delivery-policy-preflight.test.mjs','tests/atlas-delivery-route.test.mjs',
 'tests/head-atlas-links.test.ts','tests/head-mri-only-links.test.ts','tests/head-guided-3d-fallback.test.ts',...inbox];
const nodeTest=['--test','--experimental-strip-types','--test-concurrency=1','--test-reporter=tap'];
const priorGate=json(path.dirname(prepared.sourceReceipt)+'/native-integration/TERMINAL.json');assert.equal(priorGate.code,0);assert.equal(priorGate.counts.pass,77);
const jobs=[['current-native',[...nodeTest,...tests],site,environment],
 ['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false'],site,environment],
 ['review',['scripts/verify-clinical-review.mjs'],site,environment],['models',['scripts/atlas-model-inventory.mjs','--check'],site,environment],
 ['policy',['--experimental-strip-types','scripts/verify-atlas-delivery-policy.mjs'],site,environment],
 ['catalog',['scripts/lecture-body-catalog.mjs','--check'],site,environment],['coverage',['scripts/check-anatomy-coverage.mjs','--source-root',source.atlas,'--check'],site,environment],
 ['website',['node_modules/vinext/dist/cli.js','build'],site,environment]];
const commands=[];let failure=null;
try{for(const[label,args,cwd,env]of jobs){
 const out=fs.createWriteStream(root+'/verification/'+label+'.stdout.log',{flags:'wx'}),err=fs.createWriteStream(root+'/verification/'+label+'.stderr.log',{flags:'wx'});
 const start=Date.now(),child=spawn(process.execPath,args,{cwd,env,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);
 console.log(JSON.stringify({label,pid:child.pid}));
 const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.current.renalWebsiteRun={at:new Date().toISOString(),stage:root,sourceReceipt:root+'/SOURCE.json',sourceReceiptSha256:sha(read(root+'/SOURCE.json')),label,pid:child.pid,terminal:false,ownerPreviewChanged:false};fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
 const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([out,err].map(stream=>new Promise(resolve=>stream.closed?resolve():stream.once('close',resolve))));
 const counts=Object.fromEntries([...read(out.path).toString().matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(m=>[m[1],Number(m[2])]));
 const result={label,args,cwd,...outcome,elapsedMs:Date.now()-start,counts,stdoutSha256:sha(read(out.path)),stderrSha256:sha(read(err.path))};commands.push(result);
 fs.writeFileSync(root+'/verification/'+label+'.TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));assert.equal(outcome.code,0,label);
 if(label.endsWith('native')){assert(counts.tests>0);assert.equal(counts.tests,counts.pass);assert.equal(counts.fail,0);assert.equal(counts.skipped,0);assert.equal(counts.cancelled,0);}
 }}catch(error){failure=String(error);}
const drift=sourceRows.filter(row=>sha(read(site+'/'+row.path))!==row.sha256).map(row=>row.path);
const priorDrift=previous.sourceRows.filter(row=>sha(read(prior+'/'+row.path))!==row.sha256).map(row=>row.path);
if(drift.length||priorDrift.length)failure??='Source drift';
assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
const terminal={at:new Date().toISOString(),terminal:true,code:failure?1:0,failure,commands,sourceReceipt:root+'/SOURCE.json',sourceReceiptSha256:sha(read(root+'/SOURCE.json')),
 sourcePaths:sourceRows.length,sourceDrift:drift,priorSourceDrift:priorDrift,review:source.review,allNamedChecksPassed:!failure,wholeSuitePassing:false,
 canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/verification/TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');Object.assign(pointer.activeWork.current.renalWebsiteRun,{pid:null,terminal:true,code:terminal.code,result:root+'/verification/TERMINAL.json'});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({code:terminal.code,failure,sourcePaths:sourceRows.length,sourceDrift:drift,receipt:root+'/verification/TERMINAL.json'}));if(failure)process.exitCode=1;
