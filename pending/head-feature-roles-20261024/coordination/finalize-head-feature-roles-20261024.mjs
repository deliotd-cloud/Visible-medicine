import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {hash,json} from './seal-simple-website-successor.mjs';
const root='F:/VisibleMedicine/recovery/checkpoints/20261024-head-feature-roles',c=json(root+'/checkpoint.json'),p=json('CURRENT_CHECKPOINT.json'),before=json(root+'/CURRENT_BEFORE.json'),s=p.activeWork.current.latestWebsiteCandidate;
const copy=(a,b)=>fs.copyFileSync(a,b,fs.constants.COPYFILE_EXCL),write=(name,value)=>fs.writeFileSync(root+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
assert.equal(s.sourceReceiptSha256,'89711b205a711008b0fcc1524acb15d5fa2d16e752fc5962fcce679d6375f6b7');assert.equal(hash(s.sourceReceipt),s.sourceReceiptSha256);
for(const key of ['goal','safety','historyArchive','coordination'])assert.deepEqual(p[key],before[key]);
for(const key of ['ownerPreviewPolicy','currentInstalled','activeExecutionSessions'])assert.deepEqual(p.activeWork.current[key],before.activeWork.current[key]);
assert.equal(p.activeWork.current.ownerPreviewPolicy.restartPermitted,false);assert.equal(p.activeWork.current.activeExecutionSessions.length,0);
assert.equal(p.goal.status,'active');assert.equal(p.goal.requirements,71);assert.equal(p.goal.optionalIdeas,8);
for(const [dir,head] of [['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'],[s.atlas,s.atlasHead]])assert.equal(execFileSync('git',['-C',dir,'rev-parse','HEAD'],{encoding:'utf8',stdio:'pipe',windowsHide:true}).trim(),head);
const documents=[];
for(const [file,saved] of [['WORKSPACE_MAP.md','WORKSPACE_MAP.before.md'],['F:/VisibleMedicine/website/docs/master-plan.md','master-plan.before.md']]){
 const old=fs.readFileSync(root+'/'+saved),now=fs.readFileSync(file),offset=now.indexOf(old);assert(offset>0&&offset+old.length===now.length);
 documents.push({file,sha256:hash(file),priorSha256:hash(root+'/'+saved),wholePriorPreserved:true});copy(file,root+'/'+saved.replace('.before.','.after.'));
}
const prior='F:/VisibleMedicine/recovery/checkpoints/20261024-head-tools-proof/completion-checklist.after.json',register='F:/VisibleMedicine/website/docs/completion-checklist.json',old=json(prior),next=json(register),inverse=structuredClone(next);
assert.equal(old.revision,166);assert.equal(next.revision,167);assert.equal(next.items.length,71);assert.equal(next.updatedAt,'2026-10-24');
inverse.revision=old.revision;inverse.updatedAt=old.updatedAt;assert.equal(inverse.changeLog.shift().revision,167);assert.deepEqual(inverse,old);
copy(prior,root+'/completion-checklist.before.json');copy(register,root+'/completion-checklist.after.json');
assert.equal(hash(c.sourceBackup.receipt),c.sourceBackup.receiptSha256);const backup=json(c.sourceBackup.receipt);assert(backup.sourceBackupVerified&&backup.strictIntegrity);assert.equal(backup.sourcePaths,5931);assert.equal(backup.restoredPaths,5934);
assert.equal(c.proof.focusedCasesPassed,42);assert.equal(c.proof.adjacent.preExistingFailuresUnresolved,8);
const receipt={at:new Date().toISOString(),checkpoint:root+'/checkpoint.json',checkpointSha256:hash(root+'/checkpoint.json'),sourceReceipt:s.sourceReceipt,sourceReceiptSha256:s.sourceReceiptSha256,documents,checklistRevision:167,all71AndEightStatusesAndBaselinesPreserved:true,fullWebsiteCandidate:true,testOnlySuccessor:true,fourOriginalFeatureRootsPass:true,focusedCasesPassed:42,pairedAdjacent:{tests:19,pass:11,fail:8,sameAsParent:true},preExistingAdjacentFailuresUnresolved:true,allNonTestProductBytesIdentical:true,productionBuildReusedByExactIdentity:true,newBuildProcessRun:false,allFourLearnerRuntimesAndReviewUnchanged:true,uiAuditSourceOnly:true,filteredSourceBackupVerified:true,wholePrivateOrRunnableOffDeviceBackup:false,previewChanged:false,installed:false,wholeSuitePassing:false,clinicalApproval:false,patientSpaceRegistration:false,laterCoordinationRemotelyBackedUp:false};
write('COORDINATION.json',receipt);copy('finalize-head-feature-roles-20261024.mjs',root+'/finalize-head-feature-roles-20261024.mjs');
p.activeWork.current.latestCoordination={receipt:root+'/COORDINATION.json',sha256:hash(root+'/COORDINATION.json')};p.activeWork.current.latestChecklistUpdate={...p.activeWork.current.latestCoordination,revision:167};
p.goal.previousTurn='progress';p.activeWork.updated=receipt.at;p.next=c.pending;p.activeWork.current.next=c.pending;p.activeWork.current.beforeFurtherWork=c.pending;
const text=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(text)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',text);copy('CURRENT_CHECKPOINT.json',root+'/CURRENT_AFTER.json');
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',checkpointSha256:receipt.checkpointSha256,coordinationSha256:hash(root+'/COORDINATION.json'),checklistRevision:167,indexBytes:Buffer.byteLength(text),sourceBackupHead:backup.head,sourceBackupReceiptSha256:c.sourceBackup.receiptSha256,filteredSourcePaths:backup.sourcePaths,restoredPaths:backup.restoredPaths,goalActive:true,previewChanged:false}));
