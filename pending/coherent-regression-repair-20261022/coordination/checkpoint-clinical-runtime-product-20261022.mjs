// Recoverable local coordination only; never edits a website or a private record.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const staging='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const root='F:/VisibleMedicine/recovery/checkpoints/20261022-clinical-runtime-product-verified';assert(!fs.existsSync(root));
const queuePath='F:/VisibleMedicine/staging/20261022-clinical-runtime-family-consolidated/QUEUE.json';
assert.equal(sha(read(queuePath)),'23d98d1a329bedd8d9007518f5d6fd0a1143553dfea9edaf16e571269d946993');
const queue=json(queuePath),sourcePath=staging+'/PRODUCT_SOURCE_V3.json',source=json(sourcePath);
const native=json(staging+'/native-mri-runtime-v3/TERMINAL.json'),types=json(staging+'/quality-types-v3/TERMINAL.json'),build=json(staging+'/quality-build-v3/TERMINAL.json');
assert.deepEqual(native.counts,{tests:404,pass:404,fail:0,cancelled:0,skipped:0,todo:0});
for(const result of [native,types,build]){assert.equal(result.code,0);assert.deepEqual(result.sourceDrift,[]);}
const backupPath='F:/VisibleMedicine/recovery/checkpoints/20261022-clinical-runtime-product-source-backup/github-backup.json',backup=json(backupPath);
assert(backup.sourceBackupVerified&&backup.strictIntegrity);assert.equal(backup.privateDataBackup,false);assert.equal(backup.wholeProjectBackup,false);
const finalFullPath='F:/VisibleMedicine/staging/20261022-coherent-full-regression/TERMINAL.json',finalFull=json(finalFullPath);
assert(finalFull.terminal&&finalFull.suiteCompleted);assert.deepEqual(finalFull.closedSourceDrift,[]);
const triage='F:/VisibleMedicine/staging/20261022-full-regression-terminal-triage/EVIDENCE.json';
assert.equal(sha(read(triage)),'9752935070518ccf7ec2721c74c9e9ebd7a900458f272d77452adcbb61651cc7');
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),queue.source);
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');
assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
fs.mkdirSync(root,{recursive:true});fs.copyFileSync('CURRENT_CHECKPOINT.json',root+'/pointer.before.json');fs.copyFileSync('WORKSPACE_MAP.md',root+'/WORKSPACE_MAP.before.md');
const sourceBackup={receipt:backupPath,receiptSha256:sha(read(backupPath)),head:backup.head,tree:backup.tree,sourcePaths:backup.sourcePaths,
 restoredSelectedPaths:backup.restoredPaths,independentFetchTreeBytesRestoreVerified:true,wholeProjectOrPrivateOrRunnableBackup:false};
const result={at:new Date().toISOString(),milestone:'Independent exact runtime-family MRI/3D links, teaching and correction contexts verified in isolation',
 queue:queuePath,queueSha256:sha(read(queuePath)),selectedTestRepairs:161,additionalCodePaths:65,queueAllNativeRootsRerun:false,
 sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),sourcePaths:source.sourceRows.length,
 native:{receipt:staging+'/native-mri-runtime-v3/TERMINAL.json',sha256:sha(read(staging+'/native-mri-runtime-v3/TERMINAL.json')),entryFiles:53,counts:native.counts},
 types:{receipt:staging+'/quality-types-v3/TERMINAL.json',passed:true},build:{receipt:staging+'/quality-build-v3/TERMINAL.json',passed:true,prebuildChecks:build.completedSteps.slice(0,-1)},
 originalFullRegression:{terminal:finalFullPath,sha256:sha(read(finalFullPath)),counts:finalFull.counts,passing:false,allFailuresRetained:true,triage,triageSha256:sha(read(triage))},
 sourceBackup,installedAtlas:queue.source,installedReview:'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59',candidateReview:queue.review,
 canonicalInstalled:false,ownerPreviewChanged:false,ownerFormsRefreshed:false,freshSavedDraftRestartAnswerPending:true,
 full71AndEightIdeasPreserved:true,clinicalApproval:false,patientRegistration:false,privateUpload:false,publicDeployment:false,desktopPacsEdited:false,
 next:'Keep the full goal active. Verify the five staged head-review real-guard harness repairs in a new closed-source followup; continue remaining terminal-failure families and original affected native roots without dropping history. The MRI/3D product correction is verified, not installed. Obtain fresh draft-safe local-switch clearance before touching the owner preview; do not stall independent useful work or infer clinical/spatial/public approval.',
 nextHeadHarness:{stage:'F:/VisibleMedicine/staging/20261022-head-review-guard-harness',sourceOnlyProof:'cc03ab4e3788947bb99f07fcb8c1ea2edc3282144916b05cdb933d83f325a024',paths:5,nativeRerun:false},
};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json'),old=pointer.activeWork.pendingRegressionRepairQueue;
pointer.activeWork.pendingRegressionRepairQueue={receipt:queuePath,sha256:sha(read(queuePath)),proposedFiles:161,wholeSourceInversesVerified:161,additionalCodeAndProofPaths:65,
 nativeRootsRerun:false,canonicalInstalled:false,frozenCandidateEdited:false,sourceBackupIncludesThisWholeBatch:true,sourceBackup,
 priorVerifiedSourceBackup:old.sourceBackup,checkpoint:root+'/checkpoint.json',checkpointSha256:sha(read(root+'/checkpoint.json')),
 terminalFailureTriage:triage,next:result.next};
pointer.activeWork.pendingRegionalMriRuntimeLinking=result;
Object.assign(pointer.activeWork.runningFullAssurance,{live:false,terminal:true,countsAreTerminal:true,authoritativeCounts:finalFull.counts,
 terminalReceipt:finalFullPath,terminalReceiptSha256:sha(read(finalFullPath)),passingClaim:false,terminalFailureTriage:triage});
pointer.activeWork.updated=result.at;
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),native:native.counts,sourceBackup,canonicalInstalled:false}));
