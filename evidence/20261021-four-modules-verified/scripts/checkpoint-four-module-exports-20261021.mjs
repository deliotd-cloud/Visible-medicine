import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {backup,read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const base='F:/VisibleMedicine/staging/20261021-',stage=base+'four-module-admission-v2',result=json(stage+'/RESULT.json');
assert(result.passed);assert.equal(result.exports.length,4);assert.equal(result.commit,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
const source=base+'atlas-combined-source',root='F:/VisibleMedicine/recovery/checkpoints/20261021-four-modules-verified';
const paths=runGit(['-C',source,'diff','--name-only','485df97c2530e8e81a8d39a5ee61073ce76d93db',result.commit]).toString().trim().split(/\r?\n/).sort();assert.equal(paths.length,23);
const sourceFiles=paths.map(p=>({path:p,bytes:read(source+'/'+p).length,sha256:sha(read(source+'/'+p))}));
const testStage=base+'review-final-retry',prep=json(testStage+'/PREPARATION.json'),inputs=json(testStage+'/source-inputs-after.json');assert.equal(inputs.length,5084);
const verify=()=>{
 for(const row of sourceFiles)assert.equal(sha(read(source+'/'+row.path)),row.sha256,row.path);
 for(const row of inputs)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path+' unchanged Website test input');
 for(const item of result.exports)assert.equal(sha(read(item.target+'/manifest.json')),item.manifestSha256,item.kind);
 assert.equal(runGit(['-C',source,'rev-parse','HEAD']).toString().trim(),result.commit);assert.equal(runGit(['-C',source,'rev-parse','HEAD^{tree}']).toString().trim(),result.tree);
 assert.equal(runGit(['-C',source,'status','--porcelain=v1','--untracked-files=all']).toString().trim(),'');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'98d7f17e2d120b031633e59e47fc50c82d44b2d0');
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
};verify();assert(!fs.existsSync(root));fs.mkdirSync(root);
const selected=[];
const copy=(from,p)=>{const bytes=read(from),target=root+'/'+p;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});assert.equal(sha(read(target)),sha(bytes));selected.push({path:p,bytes:bytes.length,sha256:sha(bytes)});};
for(const row of sourceFiles)copy(source+'/'+row.path,'atlas/'+row.path);
for(const row of result.files)copy(stage+'/originals/'+row.path,'preimages/'+row.path);
for(const name of ['COMMITTED.json','RESULT.json','SHOULDER_INVERSE.json','PRESERVED_BUILD.json'])copy(stage+'/'+name,'evidence/'+name);
for(const step of result.steps){const from=step.receipt??stage+'/'+step.label+'.json',receipt=json(from);assert.equal(receipt.code,0);assert.equal(receipt.signal,null);assert.equal(sha(read(receipt.log)),receipt.logSha256);assert.equal(sha(read(from)),step.receiptSha256);copy(from,'evidence/receipts/'+step.label+'.json');}
for(const item of result.exports){const m=json(item.target+'/manifest.json');assert.equal(m.sourceCommit,result.commit);assert.equal(m.patientDataIncluded,false);assert.equal(m.clinicalApproved,false);copy(item.target+'/manifest.json','evidence/module-manifests/'+item.kind+'.json');}
copy(base+'four-module-admission/FAILURE.json','evidence/retained-control-file-collision.json');
for(const name of ['close-shoulder-and-export-modules-20261021.mjs','checkpoint-four-module-exports-20261021.mjs'])copy(name,'scripts/'+name);
const summary={at:new Date().toISOString(),source:{commit:result.commit,tree:result.tree,parent:result.parent,introduction:'30135cdd1849115a75c036dd6897d76e3d91e231',base:'485df97c2530e8e81a8d39a5ee61073ce76d93db',clean:true,paths:23},sourceFiles,
 progress:'Stock shoulder revision generation updates exact verified display-source rows and9geometry renderer fingerprints only. Model hash,all9teaching revisions and absent imaging revisions preserved; no review decision changed. Body renderer,nested source bindings,display pins and regional teaching gates pass. All4Vite module builds and4stock create-only exports pass at the same real source190a6323;every recorded exported file byte/hash checked. Prior5c regional build preserved locally by confined rename,not deleted. Source model geometry unchanged; no scan/mask/private decisions exported.',
 priorVerified:'Whole original hip,75tour-player cases,fresh types; complete old/current elbow/private-storage and MRI form7case retry,spinal2case retry and full dental28/9908topic/28/1076packet transition remain scoped passes from prior checkpoint. New changes are generated revision metadata only,not new teaching,geometry or clinical approval. Original full5502/5355pass/144fail/3skip is retained and not a pass.',
 exportedModules:result.exports,
 correction:'First delivery driver stopped on create-only CURRENT_STEP collision after successful stock generator; failure retained. No other process was left live at retry. Reused the verified terminal generator result,read genuine parent preimage,changed control to immutable per-step events plus own mutable pointer. V2 actual remaining gates/builds/exports pass. No safety gate skipped.',
 next:'Preserve closed485Website import for historical tests,then stock export Review and import all4new source190runtimes into an unpublished Website candidate with source/revision/protected-model/inventory checks. Keep owner3000/forms/98d7 unchanged. Continue exact current/historical test-contract repairs and full Website/type/build/browser gates,including semantic CT/MRI/3D links,without claiming spatial registration. Worker plexus historical-replay proposal is local-only,not admitted; read actual handoff before any overlap. Keep all71/eight roadmap items intact.',
 sourceOnlyLocalRecovery:true,fourModulesExported:true,websiteImported:false,canonicalInstalled:false,fullWebsiteSuitePass:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,fullGoalActive:true};
fs.writeFileSync(root+'/MAIN_REVIEW.json',JSON.stringify(summary,null,2)+'\n',{flag:'wx'});copy(root+'/MAIN_REVIEW.json','evidence/MAIN_REVIEW.json');
const parentRoot='F:/VisibleMedicine/recovery/checkpoints/20261021-combined-source-verified-backup',parent=json(parentRoot+'/github-backup.json');assert(parent.sourceBackupVerified);assert.equal(parent.head,'69d6458384ad5dc5250adffb441f4c98ca605505');
const old=json(parentRoot+'/remote-source-restored/.source-backup/manifest.json');
const values=new Map(old.files.map(row=>{const bytes=read(parentRoot+'/remote-source-restored/'+row.path);assert.equal(sha(bytes),row.sha256);return[row.path,bytes];}));
for(const row of selected)values.set('evidence/20261021-four-modules-verified/'+row.path,read(root+'/'+row.path));
const remoteRoot=root+'-backup';
backup({root:remoteRoot,repo:'F:/VisibleMedicine/history/website-work/github-four-modules-verified-20261021.git',branch:'backup/atlas-four-modules-20261021',
 files:[...values].map(([path,bytes])=>({path,bytes:bytes.length,sha256:sha(bytes)})).sort((a,b)=>a.path.localeCompare(b.path)),bytesFor:p=>values.get(p),verifySource:verify,
 sourceIdentity:summary.source,parent:parent.head,parentTree:parent.tree,parentRepo:parentRoot+'/independent-readback.git',
 proof:{fourBuildsPass:true,fourStockExportsPass:true,allLocalExportedFilesByteVerified:true,geometryUnchanged:true,noApprovalMigration:true,websiteImported:false,canonicalInstalled:false},
 scope:'Selected23Atlas source/generated-teaching/revision paths,exact2metadata preimages,4module MANIFESTS ONLY,small actual receipts/main scripts on prior filtered source-only ancestry. Full runtime files/model geometry and all private artifacts,patient scans/masks/decisions/inbox,raw canonical ancestry,dependencies and browser media remain local/excluded. Not a complete runnable/private-data backup,hosted release or clinical/spatial approval.'});
const remote=json(remoteRoot+'/github-backup.json');
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify({...summary,selectedFiles:selected,backup:{receipt:remoteRoot+'/github-backup.json',receiptSha256:sha(read(remoteRoot+'/github-backup.json')),head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),selectedNewPaths:selected.length,source:result.commit,backup:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}));
