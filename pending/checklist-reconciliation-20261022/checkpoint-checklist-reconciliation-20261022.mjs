// Scoped source recovery; tracking data and installation evidence remain local.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-checklist-installed-reconciliation';
const resultPath=stage+'/RESULT.json',result=json(resultPath);
assert.equal(result.verdict,'pass');assert(result.realInstalledEvidenceAccepted);
const pointer=json('CURRENT_CHECKPOINT.json'),goalHash=sha(Buffer.from(JSON.stringify(pointer.goal)));
assert.equal(pointer.goal.status,'active');assert.equal(pointer.activeWork.current.ownerPreviewPolicy.websiteCutoverPermitted,false);
const root='F:/VisibleMedicine/recovery/checkpoints/20261022-checklist-reconciliation-verified';assert(!fs.existsSync(root));fs.mkdirSync(root);
for(const[from,to]of [['CURRENT_CHECKPOINT.json','pointer.before.json'],['WORKSPACE_MAP.md','WORKSPACE_MAP.before.md'],['F:/VisibleMedicine/website/docs/master-plan.md','master-plan.before.md']])fs.copyFileSync(from,root+'/'+to,fs.constants.COPYFILE_EXCL);
const check=spawnSync(process.execPath,['verify-reconciled-checklist-20261022.mjs'],{encoding:null,windowsHide:true});
fs.writeFileSync(root+'/verify.stdout.log',check.stdout??Buffer.alloc(0),{flag:'wx'});fs.writeFileSync(root+'/verify.stderr.log',check.stderr??Buffer.alloc(0),{flag:'wx'});assert.equal(check.status,0);
const checked=JSON.parse(check.stdout.toString());assert.equal(checked.liveBoundInputs,1721);assert.equal(checked.items,71);assert.equal(checked.optional,8);
const parentPath='F:/VisibleMedicine/recovery/checkpoints/20261022-head-practice-exit-source-backup/github-backup.json';
assert.equal(sha(read(parentPath)),'292bd567af1337e83843a890187dfbbff5cb0b45579ca42232aa06a30dd348a8');
const parent=json(parentPath),parentRepo='F:/VisibleMedicine/history/website-work/github-head-practice-exit-20261022.git';assert(parent.sourceBackupVerified&&parent.strictIntegrity);
const inherited=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
const selected=new Map(inherited.files.map(r=>[r.path,path.dirname(parentPath)+'/remote-source-restored/'+r.path]));
for(const row of inherited.files)assert.equal(sha(read(selected.get(row.path))),row.sha256,row.path);
for(const p of ['reconcile-completion-checklist-20261022.mjs','verify-reconciled-checklist-20261022.mjs','checkpoint-checklist-reconciliation-20261022.mjs']){
 const target='pending/checklist-reconciliation-20261022/'+p;assert(!selected.has(target));selected.set(target,path.resolve(p));
 fs.mkdirSync(root+'/source',{recursive:true});fs.copyFileSync(p,root+'/source/'+p,fs.constants.COPYFILE_EXCL);
}
const files=[...selected].map(([p,from])=>({path:p,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
const verifySource=()=>{
 assert.equal(sha(read(resultPath)),sha(Buffer.from(JSON.stringify(result,null,2)+'\n')));
 for(const row of files)assert.equal(sha(read(selected.get(row.path))),row.sha256,row.path);
 assert.equal(sha(Buffer.from(JSON.stringify(json('CURRENT_CHECKPOINT.json').goal))),goalHash);
 for(const row of result.files)assert.equal(sha(read(stage+'/'+row.path)),row.sha256,row.path);
};
const backupRoot='F:/VisibleMedicine/recovery/checkpoints/20261022-checklist-reconciliation-source-backup';let saved,failure;
try{saved=backup({root:backupRoot,repo:'F:/VisibleMedicine/history/website-work/github-checklist-reconciliation-20261022.git',branch:'backup/checklist-reconciliation-20261022',
 parent:parent.head,parentRepo,parentTree:parent.tree,files,bytesFor:p=>read(selected.get(p)),verifySource,
 sourceIdentity:{installedAtlas:result.installedAtlas,installedReview:result.installedReview,trackingDraftRevision:128,inheritedCandidateEvidence:inherited.sourceIdentity},
 scope:'Inherit the independently verified filtered practice-exit source snapshot and add three tracking-reconciliation coordinator scripts. Actual checklist data, installation/binding evidence, generated JSON, compiled runtimes, private state, scans/models/masks and binaries remain local. No installation or public deployment. Source-only, not whole/private/runnable recovery.',
 proof:{realInstalledEvidenceAccepted:true,liveBoundInputsChecked:1721,itemEvidenceReferences:264,items:71,optional:8,statusesChanged:false,
  inheritedCandidateEvidenceNotRerun:true,canonicalChecklistChanged:false,canonicalGeneratorChanged:false,ownerPreviewChanged:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false}});
}catch(error){failure={at:new Date().toISOString(),message:error.message,independentlyVerified:false};fs.mkdirSync(backupRoot,{recursive:true});fs.writeFileSync(backupRoot+'/backup-failure.json',JSON.stringify(failure,null,2)+'\n',{flag:'wx'});}
verifySource();
const savedPath=backupRoot+(saved?'/github-backup.json':'/backup-failure.json');
const sourceBackup={receipt:savedPath,receiptSha256:sha(read(savedPath)),independentlyVerified:!!saved,head:saved?.head,tree:saved?.tree,
 sourcePaths:saved?.sourcePaths,restoredPaths:saved?.restoredPaths,wholePrivateOrRunnableBackup:false,...(failure?{failure}:{})};
const checkpoint={at:new Date().toISOString(),goalTurnClassification:'progress',milestone:'Reconciled standalone revision-128 checklist against authentic installed source and four independent learner runtimes; all requirements and statuses preserved.',
 stage,resultPath,resultSha256:sha(read(resultPath)),verification:checked,verificationStdoutSha256:sha(check.stdout),sourceBackup,
 installedAtlas:result.installedAtlas,installedReview:result.installedReview,selectedProductCandidate:pointer.activeWork.current.currentCandidate,
 selectedProductSourceReceipt:pointer.activeWork.current.sourceReceipt,selectedProductSourceReceiptSha256:pointer.activeWork.current.sourceReceiptSha256,
 canonicalTrackingChanged:false,normalPreviewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,wholeSuitePassing:false,
 next:'Keep the owner preview unchanged. Tracking draft128 is independently reconciled and remains uninstalled. Preserve selected6375/Atlas2381/Review1a48 and its existing verification, without claiming that evidence for canonical6d7/Reviewae84. Advance remaining source-epoch release assurance and safe desktop linked-learning work; retain all71/eight scope and independent-access/privacy/specialist-mask/desktopPACS boundaries. Do not stall for clinical sign-off or repeatedly ask to restart.'};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(checkpoint,null,2)+'\n',{flag:'wx'});
const latest=json('CURRENT_CHECKPOINT.json');Object.assign(latest.activeWork.current,{at:checkpoint.at,checkpoint:root+'/checkpoint.json',checkpointSha256:sha(read(root+'/checkpoint.json')),
 checklistReconciliation:{stage,resultPath,resultSha256:checkpoint.resultSha256,draftRevision:128,realInstalledEvidenceAccepted:true,items:71,optional:8,statusesChanged:false,canonicalTrackingChanged:false,installed:false},
 sourceBackup,next:checkpoint.next,beforeFurtherWork:checkpoint.next,activeExecutionSessions:[],pendingWorkers:[]});
latest.activeWork.current.checklistImportDiagnostic.proposalV2.realInstalledDraftVerified=true;
latest.activeWork.current.checklistImportDiagnostic.proposalV2.mainIntegrationPending=true;
latest.activeWork.updated=checkpoint.at;assert.equal(sha(Buffer.from(JSON.stringify(latest.goal))),goalHash);
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(latest,null,2)+'\n');
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),sourceBackup,canonicalTrackingChanged:false,normalPreviewChanged:false}));
