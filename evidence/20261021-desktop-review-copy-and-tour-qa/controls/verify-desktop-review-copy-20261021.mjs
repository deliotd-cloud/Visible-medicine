import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const site='F:/VisibleMedicine/website',stage='F:/VisibleMedicine/staging/20261021-desktop-review-copy-application';
const pointer=json('CURRENT_CHECKPOINT.json'),prior=json(pointer.activeWork.sourceSnapshot);
const paths=['components/ClinicalReviewInbox.tsx','tests/clinical-review-inbox-ui.test.mjs'];
const save=(name,value)=>fs.writeFileSync(stage+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const environment=()=>{assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),pointer.activeWork.source);assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain=v1']).toString().trim(),'');const bound=json(site+'/atlas-review/integration-inputs.json');assert.equal(bound.sha256,pointer.activeWork.review);assert.equal(bound.inputs.length,1710);for(const r of bound.inputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);process.kill(266712,0);};
if(process.argv[2]==='prepare'){
 assert.equal(prior.length,5162);assert.equal(sha(read(pointer.activeWork.sourceSnapshot)),pointer.activeWork.sourceSnapshotSha256);for(const r of prior)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);environment();assert(!fs.existsSync(stage));fs.mkdirSync(stage);
 const preserved=pointer.activeWork.preservedSourcePaths.map(p=>({path:p,bytes:read(site+'/'+p).length,sha256:sha(read(site+'/'+p))}));
 for(const p of paths){const to=stage+'/preimages/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(site+'/'+p,to,fs.constants.COPYFILE_EXCL);}
 assert.equal(sha(read(site+'/'+paths[0])),'f7324e4be67bb1027c403c89a85cb84579fa9f5fcf99a8944b27b11b8537642d');
 save('PREPARATION.json',{at:new Date().toISOString(),source:pointer.activeWork.source,review:pointer.activeWork.review,priorSourceSnapshot:pointer.activeWork.sourceSnapshot,priorSourceSnapshotSha256:pointer.activeWork.sourceSnapshotSha256,preserved,paths,ownerPreviewPid:266712,canonicalChanged:false});console.log('Saved exact two-path preimages and current source guards.');
}else{
 assert.equal(process.argv[2],'verify');const plan=json(stage+'/PREPARATION.json'),before=read(stage+'/preimages/'+paths[0]).toString(),after=read(site+'/'+paths[0]).toString();
 const old='No known review items are loaded yet. This scan is incomplete.',next='No known review items need attention in the loaded rows yet. This scan is incomplete.';
 assert.equal(before.split(old).length,2);assert.equal(after,before.replace(old,next));
 const originalTest=read(stage+'/preimages/'+paths[1]),newTest=read(site+'/'+paths[1]);assert.deepEqual(newTest.subarray(0,originalTest.length),originalTest,'Whole original test source retained byte-for-byte');assert(newTest.length>originalTest.length);
 const rows=prior.map(r=>paths.includes(r.path)?{path:r.path,bytes:read(site+'/'+r.path).length,sha256:sha(read(site+'/'+r.path))}:r);
 const guard=()=>{environment();for(const r of [...rows,...plan.preserved])assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);};guard();save('SOURCE_INPUTS_AFTER.json',rows);save('PRESERVED_SOURCE_AFTER.json',plan.preserved);
 const receipts=[];for(const[label,args]of [
  ['native',['--test','--experimental-strip-types','--test-reporter=tap','--test-concurrency=1','tests/clinical-review-inbox-ui.test.mjs','tests/clinical-review-inbox-workbench.test.mjs','tests/clinical-review-inbox-filter-recovery.test.mjs','tests/clinical-review-inbox-scan-focus.test.mjs','tests/clinical-review-inbox-pagination-focus.test.mjs','tests/clinical-review-inbox-return-context.test.mjs','tests/clinical-review-inbox-signin.test.ts']],
  ['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']],
 ]){console.log('Running desktop review '+label+'; stable preview untouched.');guard();const r=spawnSync(process.execPath,args,{cwd:site,env:{...process.env,VM_ATLAS_SOURCE_REPO:'F:/VisibleMedicine/atlas'},windowsHide:true,encoding:'utf8',maxBuffer:16e6}),log=stage+'/'+label+'.log';fs.writeFileSync(log,r.stdout+r.stderr,{flag:'wx'});const counts={};for(const m of r.stdout.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm))counts[m[1]]=Number(m[2]);const receipt={at:new Date().toISOString(),args,code:r.status,signal:r.signal,log,logSha256:sha(read(log)),counts};receipts.push(receipt);save(label+'.json',receipt);guard();assert.equal(r.status,0,'Inspect retained '+label+' failure');assert.equal(r.signal,null);if(label==='native'){assert(counts.tests>20);assert.equal(counts.fail,0);assert.equal(counts.skipped,0);assert.equal(counts.cancelled,0);}}
 const result={at:new Date().toISOString(),source:plan.source,review:plan.review,canonicalSourceInstalled:true,ownerPreviewContainsNewCopy:false,previewRestarted:false,paths,controlledInputs:rows.length,preservedInputs:7,namedInputs:rows.length+7,sourceSnapshot:stage+'/SOURCE_INPUTS_AFTER.json',sourceSnapshotSha256:sha(read(stage+'/SOURCE_INPUTS_AFTER.json')),preservedSnapshot:stage+'/PRESERVED_SOURCE_AFTER.json',receipts,oldSourceTestPrefixExact:true,copyOnlyComponentChange:true,allOtherSourceInputsUnchanged:true,all1710ReviewBindingsUnchanged:true,ownerDecisionsChanged:false,ownerFormsRefreshed:false,fullSuitePassingClaim:false,clinicalApproval:false};save('APPLICATION.json',result);console.log(JSON.stringify(result));
}
