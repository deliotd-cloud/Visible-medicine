// Stock shoulder revision closure, four sequential builds and fresh local exports.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const base='F:/VisibleMedicine/staging/20261021-',failed=base+'four-module-admission',stage=base+'four-module-admission-v2';
const source=base+'atlas-combined-source',parent='5c7ed0612f94b9a3ad99d9e49566c655495b98a6';
const checked=json(base+'atlas-source-assembly/ACTUAL_SHOULDER_REVISION_CHECK.json');
assert.equal(checked.code,1);assert.equal(checked.signal,null);assert.equal(sha(read(checked.log)),checked.logSha256);
assert(read(checked.log).toString().includes('Review fingerprints are stale. Run npm run reviews:revisions.'));
const checkpoint=json('F:/VisibleMedicine/recovery/checkpoints/20261021-combined-source-verified/checkpoint.json');
assert.equal(checkpoint.source.commit,parent);assert(checkpoint.regionalModuleBuildPass);
const git=(...args)=>runGit(['-C',source,...args]);
assert.equal(git('rev-parse','HEAD').toString().trim(),parent);
const priorFailure=json(failed+'/FAILURE.json');assert(priorFailure.error.includes('EEXIST')&&priorFailure.error.includes('CURRENT_STEP.json'));
assert.equal(priorFailure.steps.length,1);assert.equal(priorFailure.steps[0].code,0);
const priorGeneration=json(failed+'/GENERATE_SHOULDER_REVISIONS.json');assert.equal(priorGeneration.code,0);assert.equal(priorGeneration.signal,null);assert.equal(sha(read(priorGeneration.log)),priorGeneration.logSha256);
assert.equal(git('status','--porcelain=v1','--untracked-files=all').toString().trim(),'M content/review-revisions.json','Only the known completed generator output may be dirty');
for(const row of checkpoint.sourceFiles)assert.equal(sha(read(source+'/'+row.path)),row.sha256,row.path);
const kinds=['head-neck','shoulder','female-pelvis','lower-limb'];
const oldBuild=path.resolve(source,'.sites-runtime/head-neck-module');
assert(oldBuild.startsWith(path.resolve(source)+path.sep));assert(fs.lstatSync(oldBuild).isDirectory()&&!fs.lstatSync(oldBuild).isSymbolicLink());
assert.equal(json(oldBuild+'/selection-channel.json').sourceCommit,parent);
for(const kind of kinds.slice(1))assert(!fs.existsSync(path.resolve(source,'.sites-runtime/'+kind+'-module')),'Preserve unexpected prior build: '+kind);
assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const save=(p,bytes)=>{const target=stage+'/'+p;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});};
const record=(p,value)=>save(p,Buffer.from(JSON.stringify(value,null,2)+'\n'));
record('PREPARATION.json',{stage,site:source,atlas:source,source:parent,canonicalInstalled:false,scope:'Stock generated shoulder-only display revision,source commit,four builds and four create-only local exports. No owner website or private review decisions.'});
const reviewPath='content/review-revisions.json',rendererPath='content/body-renderer-revision.json';
const before=json(failed+'/originals/'+reviewPath);
assert.equal(sha(Buffer.from(read(failed+'/originals/'+reviewPath).toString().replaceAll('\r\n','\n'))),sha(git('show',parent+':'+reviewPath)),'Genuine parent shoulder document');
for(const p of [reviewPath,rendererPath])save('originals/'+p,read(failed+'/originals/'+p));
const coordinator=path.dirname(fileURLToPath(import.meta.url)),steps=[];
const run=async(label,args)=>{
 const child=spawn(process.execPath,[coordinator+'/run-visible-medicine-check.mjs',stage,label,process.execPath,...args],{cwd:coordinator,windowsHide:true,stdio:'inherit'});
 const started={at:new Date().toISOString(),driverPid:process.pid,wrapperPid:child.pid,label,args};
 record(label+'-STARTED.json',started);
 fs.writeFileSync(stage+'/CURRENT_STEP.json',JSON.stringify(started,null,2)+'\n');
 const done=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
 const receipt=json(stage+'/'+label+'.json');assert.equal(receipt.code,done.code);assert.equal(receipt.signal,done.signal);assert.equal(sha(read(receipt.log)),receipt.logSha256);
 steps.push({label,...done,receiptSha256:sha(read(stage+'/'+label+'.json'))});assert.equal(done.code,0,label);assert.equal(done.signal,null);return receipt;
};
try{
 // Reuse the terminal unchanged generator result; verify its exact material below.
 steps.push({label:'GENERATE_SHOULDER_REVISIONS_REUSED',code:0,signal:null,receipt:failed+'/GENERATE_SHOULDER_REVISIONS.json',receiptSha256:sha(read(failed+'/GENERATE_SHOULDER_REVISIONS.json'))});
 const after=json(source+'/'+reviewPath),inverse=structuredClone(after);
 assert.deepEqual(Object.keys(after),Object.keys(before));assert.equal(after.modelHash,before.modelHash);assert.equal(after.schemaVersion,before.schemaVersion);
 assert.deepEqual(after.display.map(row=>row[0]),before.display.map(row=>row[0]));
 const sourceSet=new Set(checkpoint.sourceFiles.map(row=>row.path)),changedDisplay=[];
 for(let i=0;i<after.display.length;i++){
  const [p,digest]=after.display[i];
  assert.equal(sha(Buffer.from(read(source+'/'+p).toString().replaceAll('\r\n','\n'))),digest,p+' actual normalized display source');
  if(digest!==before.display[i][1]){assert(sourceSet.has(p),'Only verified source batch changes display: '+p);changedDisplay.push(p);inverse.display[i]=before.display[i];}
 }
 assert(changedDisplay.length>0);assert.deepEqual(Object.keys(after.revisions),Object.keys(before.revisions));
 assert.equal(Object.keys(after.revisions).length,9);
 for(const id of Object.keys(after.revisions)){
  assert.equal(after.revisions[id].teaching,before.revisions[id].teaching,id+' teaching unchanged');
  assert.equal(after.revisions[id].imaging,null);assert.equal(before.revisions[id].imaging,null);
  assert.notEqual(after.revisions[id].geometry,before.revisions[id].geometry,id+' renderer revision changes');
  inverse.revisions[id].geometry=before.revisions[id].geometry;
 }
 assert.deepEqual(inverse,before,'Whole prior shoulder revision document restored by exact display/geometry fields');
 await run('CHECK_SHOULDER_REVISIONS',['scripts/review-revisions.mjs','--check']);
 await run('GENERATE_FINAL_BODY_RENDERER',['scripts/body-renderer-revisions.mjs']);
 await run('CHECK_FINAL_BODY_RENDERER',['scripts/body-renderer-revisions.mjs','--check']);
 await run('CHECK_FINAL_NESTED_BINDINGS',['scripts/generate-nested-review-bindings.mjs','--check']);
 await run('CHECK_FINAL_DISPLAY_PINS',['scripts/generate-body-review-display-pins.mjs','--check']);
 await run('CHECK_FINAL_TEACHING_SNAPSHOTS',['scripts/regional-teaching-snapshots.mjs','--check']);
 const changed=git('diff','--name-only').toString().trim().split(/\r?\n/).filter(Boolean).sort();
 assert(changed.includes(reviewPath));assert(changed.every(p=>p===reviewPath||p===rendererPath));
 const files=changed.map(p=>({path:p,bytes:read(source+'/'+p).length,sha256:sha(read(source+'/'+p))}));
 record('SHOULDER_INVERSE.json',{at:new Date().toISOString(),parent,changedDisplay,changedGeometryRevisions:9,modelHash:after.modelHash,teachingUnchanged:true,imagingRevisionsNull:true,wholeDocumentInverse:true,files,clinicalApproval:false});
 git('add','--',...changed);git('-c','user.name=Visible Medicine source coordination','-c','user.email=source-backup@users.noreply.github.com','commit','-m','Atlas: close shoulder display revisions for keyboard camera controls');
 const commit=git('rev-parse','HEAD').toString().trim(),tree=git('rev-parse','HEAD^{tree}').toString().trim();assert.equal(git('rev-parse','HEAD^').toString().trim(),parent);
 record('COMMITTED.json',{at:new Date().toISOString(),commit,tree,parent,files,canonicalInstalled:false});
 const archived=path.resolve(stage,'prior-head-neck-module');assert(archived.startsWith(path.resolve(stage)+path.sep));assert(!fs.existsSync(archived));
 // Move only our verified generated build; preserve it instead of Vite clearing it.
 fs.renameSync(oldBuild,archived);record('PRESERVED_BUILD.json',{from:oldBuild,to:archived,sourceCommit:parent,recoverable:true});
 console.log(JSON.stringify({phase:'complete-generated-source-committed',commit,tree,changedDisplay,canonicalInstalled:false}));
 const exports=[];
 for(const kind of kinds){
  const label=kind.toUpperCase().replaceAll('-','_');
  await run('BUILD_'+label,['node_modules/vite/bin/vite.js','build','--config','integration/'+kind+'/vite.config.mjs']);
 }
 for(const kind of kinds){
  const label=kind.toUpperCase().replaceAll('-','_'),target=path.resolve(stage,'export/public/atlas-runtime',kind);
  assert(target.startsWith(path.resolve(stage,'export')+path.sep));assert(!fs.existsSync(target));
  await run('EXPORT_'+label,['scripts/export-'+kind+'-module.mjs',target]);
  const manifest=json(target+'/manifest.json');assert.equal(manifest.sourceCommit,commit);assert.equal(manifest.patientDataIncluded,false);assert.equal(manifest.clinicalApproved,false);assert.equal(manifest.standaloneReviewConnection,false);
  assert.equal(new Set(manifest.files.map(row=>row.path)).size,manifest.files.length);
  let bytes=0;for(const row of manifest.files){
   const p=path.resolve(target,row.path);assert(p.startsWith(target+path.sep));assert(fs.lstatSync(p).isFile()&&!fs.lstatSync(p).isSymbolicLink());
   const b=read(p);assert.equal(b.length,row.bytes);assert.equal(sha(b),row.sha256);bytes+=b.length;
  }
  exports.push({kind,target,sourceCommit:commit,manifestSha256:sha(read(target+'/manifest.json')),files:manifest.files.length,bytes,patientDataIncluded:false});
 }
 assert.equal(git('rev-parse','HEAD').toString().trim(),commit);assert.equal(git('status','--porcelain=v1','--untracked-files=all').toString().trim(),'');
 const result={at:new Date().toISOString(),commit,tree,parent,files,steps,exports,passed:true,canonicalInstalled:false,websiteImported:false,fullWebsiteSuitePass:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
 record('RESULT.json',result);console.log(JSON.stringify(result));
}catch(error){record('FAILURE.json',{at:new Date().toISOString(),steps,error:String(error),passed:false,canonicalInstalled:false});throw error;}
