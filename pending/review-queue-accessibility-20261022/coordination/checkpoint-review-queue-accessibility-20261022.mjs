import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-review-queue-accessibility-successor',sourcePath=stage+'/SOURCE.json',source=json(sourcePath);
const backupPath='F:/VisibleMedicine/recovery/checkpoints/20261022-review-queue-a11y-source-backup/github-backup.json',backup=json(backupPath);
assert(backup.sourceBackupVerified&&backup.strictIntegrity&&!backup.privateDataBackup);
const paths={wide:'F:/VisibleMedicine/staging/20261022-final-closure-verification/native-selected/TERMINAL.json',retry:'F:/VisibleMedicine/staging/20261022-final-two-epoch-comparisons/native-current/TERMINAL.json',inbox:stage+'/native-inbox/TERMINAL.json',types:stage+'/types-current/TERMINAL.json'};
const checks=Object.fromEntries(Object.entries(paths).map(([name,path])=>[name,{path,sha256:sha(read(path)),result:json(path)}]));
for(const name of ['retry','inbox','types']){assert.equal(checks[name].result.code,0);assert.deepEqual(checks[name].result.sourceDrift,[]);}
for(const name of ['inbox','types'])assert.equal(checks[name].result.sourceReceiptSha256,sha(read(sourcePath)));
assert.equal(checks.wide.result.counts.fail,2);assert.equal(checks.retry.result.counts.pass,13);
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
const pointer=json('CURRENT_CHECKPOINT.json'),current=pointer.activeWork.current;assert.equal(current.ownerPreviewPolicy.websiteCutoverPermitted,false);
const next='Keep the normal preview unchanged. Run the isolated queue successor production build and applicable stock Review/model/delivery checks, then independent desktop/assistive QA when permitted. Retain360/358/2 and exact13/13 retry without claiming one360-test green run or whole-suite completion. Pane-label proposal remains unapplied and needs its own bound viewer integration. Continue all71/eight roadmap scope without clinical-signoff stall.';
const result={at:new Date().toISOString(),goalTurnClassification:'progress',sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),sourcePaths:source.sourcePaths,isolatedReview:source.review,
 milestone:'The108-root regression produced360tests/358pass/2fail; both failed tests and named consumers now pass13/13. Queue-only successor adds stable same-row accessible descriptions and preserves all original behavior; focused inbox acceptance and full TypeScript pass.',checks,
 changedProductPaths:source.changedProductPaths,reviewBindingUnchanged:true,paneLabelsUnapplied:true,queueWebsiteBuildPending:true,ownerPreviewChanged:false,canonicalInstalled:false,
 sourceBackup:{receipt:backupPath,receiptSha256:sha(read(backupPath)),head:backup.head,tree:backup.tree,sourcePaths:backup.sourcePaths,restoredPaths:backup.restoredPaths,independentlyVerified:true,wholePrivateOrRunnableBackup:false},
 full71AndEightIdeasPreserved:true,wholeSuitePassing:false,browserOrAssistiveAcceptance:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,next};
const directory='F:/VisibleMedicine/recovery/checkpoints/20261022-review-queue-a11y-verified';assert(!fs.existsSync(directory));fs.mkdirSync(directory);
fs.copyFileSync('CURRENT_CHECKPOINT.json',directory+'/pointer.before.json');fs.copyFileSync('WORKSPACE_MAP.md',directory+'/WORKSPACE_MAP.before.md');fs.writeFileSync(directory+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
Object.assign(current,{at:result.at,checkpoint:directory+'/checkpoint.json',checkpointSha256:sha(read(directory+'/checkpoint.json')),currentCandidate:source.website,sourceReceipt:sourcePath,sourceReceiptSha256:result.sourceReceiptSha256,sourcePaths:source.sourcePaths,
 sourceBackup:result.sourceBackup,proposalCodeSourceBackedUp:true,pendingWorkers:[],activeExecutionSessions:{},verification:checks,next,beforeFurtherWork:next,
 pendingUiProposals:[{stage:'F:/VisibleMedicine/staging/20261022-head-pane-accessible-labels',applied:false,sourceProof:'SOURCE_PROOF.json',needsReviewRebind:true}],queueWebsiteBuildPending:true});
pointer.activeWork.updated=result.at;fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({checkpoint:directory+'/checkpoint.json',sha256:sha(read(directory+'/checkpoint.json')),sourcePaths:6072,inboxChecks:checks.inbox.result.counts,sourceBackup:result.sourceBackup,ownerPreviewChanged:false}));
