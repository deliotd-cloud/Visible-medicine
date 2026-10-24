// Verify append-only docs and mechanically advance the existing tracker/index.
import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
const root='F:/VisibleMedicine/recovery/checkpoints/20261024-upper-vascular-reasoning';
const c=json(root+'/checkpoint.json'),p=json('CURRENT_CHECKPOINT.json'),before=json(root+'/CURRENT_BEFORE.json'),s=p.activeWork.current.pendingUpperVascularReasoning;
const write=(name,v)=>fs.writeFileSync(root+'/'+name,JSON.stringify(v,null,2)+'\n',{flag:'wx'}),copy=(a,b)=>fs.copyFileSync(a,b,fs.constants.COPYFILE_EXCL);
assert.equal(hash(s.sourceReceipt),s.sourceReceiptSha256);
for(const k of ['goal','safety','historyArchive','coordination'])assert.deepEqual(p[k],before[k]);
for(const k of ['ownerPreviewPolicy','currentInstalled','activeExecutionSessions','latestWebsiteCandidate'])assert.deepEqual(p.activeWork.current[k],before.activeWork.current[k]);
assert.equal(p.activeWork.current.activeExecutionSessions.length,0);assert.equal(p.goal.status,'active');assert.equal(p.goal.requirements,71);assert.equal(p.goal.optionalIdeas,8);
for(const[at,head]of [['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'],[s.atlas,s.atlasHead]])assert.equal(execFileSync('git',['-C',at,'rev-parse','HEAD'],{encoding:'utf8',stdio:'pipe',windowsHide:true}).trim(),head);
assert.equal(hash(c.sourceBackup.receipt),c.sourceBackup.receiptSha256);const backup=json(c.sourceBackup.receipt);assert(backup.sourceBackupVerified&&backup.strictIntegrity);
const documents=[];let prefix;
for(const[file,saved]of [['WORKSPACE_MAP.md','WORKSPACE_MAP.before.md'],['F:/VisibleMedicine/website/docs/master-plan.md','master-plan.before.md']]){
 const old=fs.readFileSync(root+'/'+saved),now=fs.readFileSync(file),offset=now.indexOf(old);assert(offset>0&&offset+old.length===now.length);
 const head=now.subarray(0,offset);assert(head.toString().startsWith('## Current: upper-limb vascular reasoning drafts'));
 if(prefix)assert.deepEqual(head,prefix);else prefix=head;
 for(const expected of ['232','424','3334','Keep current preview unchanged','NOT a complete Website successor'])assert(head.includes(expected));
 documents.push({file,sha256:hash(file),priorSha256:hash(root+'/'+saved),wholePriorPreserved:true});copy(file,root+'/'+saved.replace('.before.','.after.'));
}
const register='F:/VisibleMedicine/website/docs/completion-checklist.json',old=json(register);assert.equal(old.revision,175);assert.equal(old.items.length,71);
copy(register,root+'/completion-checklist.before.json');
const next=structuredClone(old);next.revision=176;next.updatedAt='2026-10-24';
next.changeLog.unshift({revision:176,date:'2026-10-24',summary:'Native upper-limb vascular reasoning:10original draft concepts/20source targets,232concepts424representations; all222prior definitions404sessions and9936lesson payloads retained. Focused4cases,25995practicechecks6721negativeidentities, strict6roots3334actualfiles and stock557output build pass. Source-only backup verified. Not installed or a composed Website successor; all clinical/actual-account/study/AT/performance/full-release gates remain.',checkpoint:root+'/checkpoint.json',checkpointSha256:hash(root+'/checkpoint.json'),sourceReceipt:s.sourceReceipt,sourceReceiptSha256:s.sourceReceiptSha256,previewChanged:false,clinicalApproval:false,patientSpaceRegistration:false});
const inverse=structuredClone(next);inverse.revision=old.revision;inverse.updatedAt=old.updatedAt;inverse.changeLog.shift();assert.deepEqual(inverse,old);
fs.writeFileSync(register,JSON.stringify(next,null,2)+'\n');copy(register,root+'/completion-checklist.after.json');
const receipt={at:new Date().toISOString(),checkpoint:root+'/checkpoint.json',checkpointSha256:hash(root+'/checkpoint.json'),sourceReceipt:s.sourceReceipt,sourceReceiptSha256:s.sourceReceiptSha256,documents,checklistRevision:176,all71AndEightStatusesAndBaselinesPreserved:true,nativeAtlasOnly:true,latestCompleteWebsiteUnchanged:true,filteredSourceBackupVerified:true,wholePrivateOrRunnableOffDeviceBackup:false,previewChanged:false,installed:false,wholeSuitePassing:false,clinicalApproval:false,patientSpaceRegistration:false,laterCoordinationRemotelyBackedUp:false};
write('COORDINATION.json',receipt);copy('finish-upper-vascular-20261024.mjs',root+'/finish-upper-vascular-20261024.mjs');
const source=json(s.sourceReceipt);for(const r of source.checks)assert.equal(r.code,0);
write('VALIDATION_SLOT_RELEASE.json',{at:new Date().toISOString(),authority:'Main serial native validation is terminal; Release Reliability may resume its existing bounded16-root assignment.',checks:source.checks.map(r=>({phase:r.phase,finishedAt:r.finishedAt,code:r.code})),activeMainExecutions:[],previewChanged:false});
p.activeWork.current.latestCoordination={receipt:root+'/COORDINATION.json',sha256:hash(root+'/COORDINATION.json')};p.activeWork.current.latestChecklistUpdate={...p.activeWork.current.latestCoordination,revision:176};p.goal.previousTurn='progress';p.activeWork.updated=receipt.at;
p.next=c.pending;p.activeWork.current.next=c.pending;p.activeWork.current.beforeFurtherWork=c.pending;
const output=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(output)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',output);copy('CURRENT_CHECKPOINT.json',root+'/CURRENT_AFTER.json');
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',coordinationSha256:hash(root+'/COORDINATION.json'),checklistRevision:176,indexBytes:Buffer.byteLength(output),backupHead:backup.head,sourcePaths:backup.sourcePaths,restoredPaths:backup.restoredPaths,previewChanged:false,goalActive:true}));
