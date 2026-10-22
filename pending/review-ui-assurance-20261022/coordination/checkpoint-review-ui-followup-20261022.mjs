// Extend the verified historical assurance checkpoint; renal source and owner preview remain untouched.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/recovery/checkpoints/20261022-review-ui-assurance-verified';assert(!fs.existsSync(root));
const receipt='F:/VisibleMedicine/staging/20261022-review-ui-source-successor/SOURCE.json',source=json(receipt);
assert.equal(sha(read(receipt)),'400dad398f35767645590505fb9af192a5b803e039c96286fbd81875bb85fb21');
const terminalPath=path.dirname(receipt)+'/native-integration/TERMINAL.json',terminal=json(terminalPath);
assert.equal(terminal.code,0);assert.equal(terminal.entryFiles,8);assert.deepEqual(terminal.sourceDrift,[]);
assert.deepEqual(terminal.counts,{tests:80,pass:80,fail:0,cancelled:0,skipped:0,todo:0});
const previousPath='F:/VisibleMedicine/staging/20261022-admission-importer-source-successor/SOURCE.json',previous=json(previousPath);
const previousRows=new Map(previous.sourceRows.map(r=>[r.path,r]));
const delta=source.sourceRows.filter(r=>r.sha256!==previousRows.get(r.path)?.sha256);
assert.deepEqual(delta.map(r=>r.path),['tests/review-navigation-delivery-preservation.test.mjs','tests/ui-teaching-current-delivery.test.mjs']);
assert.equal(source.review,previous.review);assert.equal(source.atlasHead,previous.atlasHead);assert.equal(source.atlasTree,previous.atlasTree);
const selectedPath='F:/VisibleMedicine/staging/20261022-renal-gitbytes-website-candidate/SOURCE_V3.json',selected=json(selectedPath);
const pointer=json('CURRENT_CHECKPOINT.json'),goalHash=sha(Buffer.from(JSON.stringify(pointer.goal)));
assert.equal(pointer.activeWork.current.sourceReceipt,selectedPath);assert.equal(pointer.activeWork.current.ownerPreviewPolicy.websiteCutoverPermitted,false);
const verify=()=>{
 for(const s of [source,previous,selected])for(const r of s.sourceRows)assert.equal(sha(read(s.website+'/'+r.path)),r.sha256,r.path);
 for(const s of [source,selected]){
  assert.equal(runGit(['-C',s.atlas,'rev-parse','HEAD']).toString().trim(),s.atlasHead);
  assert.equal(runGit(['-C',s.atlas,'status','--porcelain']).toString().trim(),'');
 }
 assert.equal(sha(Buffer.from(JSON.stringify(json('CURRENT_CHECKPOINT.json').goal))),goalHash);
};verify();fs.mkdirSync(root);fs.copyFileSync('CURRENT_CHECKPOINT.json',root+'/pointer.before.json');fs.copyFileSync('WORKSPACE_MAP.md',root+'/WORKSPACE_MAP.before.md');
for(const[p,to]of [[receipt,'SOURCE.json'],[terminalPath,'TERMINAL.json']])fs.copyFileSync(p,root+'/'+to);
const parentPath='F:/VisibleMedicine/recovery/checkpoints/20261022-renal-import-admission-source-backup/github-backup.json';
assert.equal(sha(read(parentPath)),'e68d9568a18a3734aff7c4440e029d51171bb4d0ce02ee0a575a1227e4cc490d');
const parent=json(parentPath);assert(parent.sourceBackupVerified&&parent.strictIntegrity);
const parentRepo='F:/VisibleMedicine/history/website-work/github-renal-import-admission-20261022.git';
const manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
const filesByPath=new Map(manifest.files.map(r=>[r.path,path.dirname(parentPath)+'/remote-source-restored/'+r.path]));
for(const r of manifest.files)assert.equal(sha(read(filesByPath.get(r.path))),r.sha256);
const proposal='F:/VisibleMedicine/staging/20261022-review-ui-source-followup',proposalResult=json(proposal+'/RESULT.json');
assert.equal(sha(read(proposal+'/RESULT.json')),'386b9392ae2702a897b855a87158e4d26249bb06972e88936acfa348c5d129fd');
const add=(from,to)=>{
 assert(/\.(?:mjs|ts|raw)$/.test(from)&&!from.endsWith('.json.raw'));
 const b=read(from);assert.deepEqual(Buffer.from(b.toString('utf8')),b);
 const p='pending/review-ui-assurance-20261022/'+to;assert(!filesByPath.has(p));filesByPath.set(p,from);
 const local=root+'/source/'+to;fs.mkdirSync(path.dirname(local),{recursive:true});fs.copyFileSync(from,local,fs.constants.COPYFILE_EXCL);
};
for(const[p,h]of Object.entries({...proposalResult.files,...proposalResult.evidence})){
 assert.equal(sha(read(proposal+'/'+p)),h,p);if(/\.(?:mjs|ts|raw)$/.test(p)&&!p.endsWith('.json.raw'))add(proposal+'/'+p,p);
}
for(const p of ['prepare-review-ui-source-20261022.mjs','checkpoint-review-ui-followup-20261022.mjs'])add(path.resolve(p),'coordination/'+p);
const files=[...filesByPath].map(([path,from])=>({path,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
const verifySource=()=>{verify();for(const r of files)assert.equal(sha(read(filesByPath.get(r.path))),r.sha256,r.path);};
const backupRoot='F:/VisibleMedicine/recovery/checkpoints/20261022-review-ui-assurance-source-backup';let saved,failure;
try{saved=backup({root:backupRoot,repo:'F:/VisibleMedicine/history/website-work/github-review-ui-assurance-20261022.git',branch:'backup/review-ui-assurance-20261022',parent:parent.head,parentRepo,parentTree:parent.tree,
 files,bytesFor:p=>read(filesByPath.get(p)),verifySource,sourceIdentity:{separateAssuranceAtlas:source.atlasHead,assuranceReview:source.review,assuranceReceiptSha256:sha(read(receipt)),selectedRenalAtlas:selected.atlasHead,selectedRenalReview:selected.review},
 scope:'Inherited filtered source plus two exact historical/current Review-navigation and teaching-consumer test repairs, complete source preimages and source-only proof. No product change. Generated bindings/JSON, compiled viewer/runtime, private records/DB/env/decisions/references, held assets, scans/models/masks, media/raw logs and raw canonical ancestry stay local. Not whole/private/runnable recovery or an installed update.',
 proof:{native:terminal.counts,roots:8,wholeOriginalAssertionBodiesRestored:true,currentAndHistoricalRolesSeparate:true,nonTestProductBytesUnchanged:true,selectedRenalCandidateUnchanged:true,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,ownerPreviewChanged:false,publicDeployment:false}});}
catch(error){failure={at:new Date().toISOString(),message:error.message,independentlyVerified:false};fs.mkdirSync(backupRoot,{recursive:true});fs.writeFileSync(backupRoot+'/backup-failure.json',JSON.stringify(failure,null,2)+'\n',{flag:'wx'});}
verifySource();const backupPath=backupRoot+(saved?'/github-backup.json':'/backup-failure.json');
const sourceBackup={receipt:backupPath,receiptSha256:sha(read(backupPath)),head:saved?.head,tree:saved?.tree,sourcePaths:saved?.sourcePaths,restoredPaths:saved?.restoredPaths,independentlyVerified:!!saved,wholePrivateOrRunnableBackup:false,...(failure?{failure}:{})};
const result={at:new Date().toISOString(),goalTurnClassification:'progress',sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),sourcePaths:6187,atlas:source.atlasHead,review:source.review,native:{receipt:terminalPath,sha256:sha(read(terminalPath)),...terminal.counts,roots:8},
 changedTestPaths:delta.map(r=>r.path),nonTestProductBytesUnchanged:true,selectedRenalWebsiteUnchanged:true,sourceBackup,ownerPreviewChanged:false,full71AndEightIdeasPreserved:true,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const latest=json('CURRENT_CHECKPOINT.json');Object.assign(latest.activeWork.current,{at:result.at,separateAssurance:result,sourceBackup,pendingWorkers:[],activeExecutionSessions:[],
 next:'Preserve selected renal Website6222/Atlas4f20/Review9aead and separate older assurance6187/Atlas389/Review811b with80/80native checks. Do not install/restart/refresh the held owner preview. Current import/types/build are verified, not whole-suite/clinical/spatial/public acceptance. Continue remaining P0 applicable regression source-role contracts and useful linked-learning/desktop roadmap work; keep exact historical assertions and independent access. Do not stall independent work for sign-off.',
 assuranceVerifiedFollowup:{path:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json'))}});
latest.activeWork.current.beforeFurtherWork=latest.activeWork.current.next;latest.activeWork.updated=result.at;
assert.equal(sha(Buffer.from(JSON.stringify(latest.goal))),goalHash);fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(latest,null,2)+'\n');
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),native:terminal.counts,sourceBackup,ownerPreviewChanged:false}));
