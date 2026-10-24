import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
const root='F:/VisibleMedicine/recovery/checkpoints/20261024-guided-review-completeness';
const c=json(root+'/checkpoint.json'),p=json('CURRENT_CHECKPOINT.json'),before=json(root+'/CURRENT_BEFORE.json');
const s=p.activeWork.current.pendingGuidedReviewCompleteness;
const write=(name,value)=>fs.writeFileSync(root+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const copy=(from,to)=>fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);
assert.equal(hash(s.sourceReceipt),s.sourceReceiptSha256);
for(const key of ['goal','safety','historyArchive'])assert.deepEqual(p[key],before[key]);
for(const key of ['ownerPreviewPolicy','currentInstalled','activeExecutionSessions','latestWebsiteCandidate'])assert.deepEqual(p.activeWork.current[key],before.activeWork.current[key]);
assert.equal(p.activeWork.current.activeExecutionSessions.length,0);
assert.equal(p.goal.requirements,71);assert.equal(p.goal.optionalIdeas,8);assert.equal(p.goal.status,'active');
for(const[at,head]of [['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1']])assert.equal(execFileSync('git',['-C',at,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true,stdio:'pipe'}).trim(),head);
const documents=[];let prefix;
for(const[file,saved]of [['WORKSPACE_MAP.md','WORKSPACE_MAP.before.md'],['F:/VisibleMedicine/website/docs/master-plan.md','master-plan.before.md']]){
 const old=fs.readFileSync(root+'/'+saved),now=fs.readFileSync(file),offset=now.indexOf(old);assert(offset>0&&offset+old.length===now.length);
 const head=now.subarray(0,offset);assert(head.toString().startsWith('## Current: guided Review completeness and historical regression audit'));
 if(prefix)assert.deepEqual(head,prefix);else prefix=head;
 for(const text of ['Keep current preview unchanged','1,104','320','414','69','NOT installed','5e75'])assert(head.includes(text),text);
 documents.push({file,sha256:hash(file),priorSha256:hash(root+'/'+saved),wholePriorPreserved:true});copy(file,root+'/'+saved.replace('.before.','.after.'));
}
const register='F:/VisibleMedicine/website/docs/completion-checklist.json',old=json(register);assert.equal(old.revision,177);assert.equal(old.items.length,71);
copy(register,root+'/completion-checklist.before.json');
const next=structuredClone(old);next.revision=178;next.updatedAt='2026-10-24';
next.changeLog.unshift({revision:178,date:'2026-10-24',summary:'Tests-only current5f3guided Review completeness:1104structures/320guided/414placements,414rehashed-omission refusals and69othermutations.2freshcases pass with1127actual imported closure files. Independent audit authenticates24test-only edits/16historical5e75roots37cases and190ashoulder fixture provenance; no current-source broad-suite acceptance or integration claimed. Application6496inheritedsourcebytes and current preview unchanged.',checkpoint:root+'/checkpoint.json',checkpointSha256:hash(root+'/checkpoint.json'),sourceReceipt:s.sourceReceipt,sourceReceiptSha256:s.sourceReceiptSha256,previewChanged:false,clinicalApproval:false,patientSpaceRegistration:false});
const inverse=structuredClone(next);inverse.revision=old.revision;inverse.updatedAt=old.updatedAt;inverse.changeLog.shift();assert.deepEqual(inverse,old);
fs.writeFileSync(register,JSON.stringify(next,null,2)+'\n');copy(register,root+'/completion-checklist.after.json');
const sourceBackupVerified=c.sourceBackup.independentlyVerified;
if(sourceBackupVerified){const backup=json(c.sourceBackup.receipt);assert.equal(hash(c.sourceBackup.receipt),c.sourceBackup.receiptSha256);assert(backup.sourceBackupVerified&&backup.strictIntegrity);assert.equal(backup.removedPaths,0);assert.equal(backup.sourcePaths,5985);assert.equal(backup.restoredPaths,5988);assert.equal(backup.gitParentAncestryIncluded,true);}
const receipt={at:new Date().toISOString(),checkpoint:root+'/checkpoint.json',checkpointSha256:hash(root+'/checkpoint.json'),sourceReceipt:s.sourceReceipt,sourceReceiptSha256:s.sourceReceiptSha256,documents,checklistRevision:178,all71AndEightStatusesAndBaselinesPreserved:true,filteredSourceBackupVerified:sourceBackupVerified,wholePrivateOrRunnableOffDeviceBackup:false,historicalProposalIntegrated:false,currentCompleteWebsiteCandidateUnchanged:true,previewChanged:false,installed:false,wholeSuitePassing:false,clinicalApproval:false,patientSpaceRegistration:false,laterCoordinationRemotelyBackedUp:false};
write('COORDINATION.json',receipt);copy('finish-guided-review-proof-20261024.mjs',root+'/finish-guided-review-proof-20261024.mjs');
p.activeWork.current.latestCoordination={receipt:root+'/COORDINATION.json',sha256:hash(root+'/COORDINATION.json')};p.activeWork.current.latestChecklistUpdate={...p.activeWork.current.latestCoordination,revision:178};
p.goal.previousTurn='progress';p.activeWork.updated=receipt.at;p.next=c.pending;p.activeWork.current.next=c.pending;p.activeWork.current.beforeFurtherWork=c.pending;
const text=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(text)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',text);copy('CURRENT_CHECKPOINT.json',root+'/CURRENT_AFTER.json');
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',coordinationSha256:hash(root+'/COORDINATION.json'),checklistRevision:178,indexBytes:Buffer.byteLength(text),filteredSourceBackupVerified:sourceBackupVerified,previewChanged:false,goalActive:true}));
