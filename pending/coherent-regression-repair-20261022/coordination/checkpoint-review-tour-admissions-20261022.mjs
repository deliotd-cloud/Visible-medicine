import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const base='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const planPath='F:/VisibleMedicine/staging/20261022-reviewed-native-followup-consolidated/PLAN.json';
assert.equal(sha(read(planPath)),'23b5b61d15d76ba96963efa4a20a97ea20476c02006a75f364afa0eb2b011228');
const plan=json(planPath),source=json(plan.sourceReceipt);
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256);
for(const row of plan.repairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(row.beforePath)),row.beforeSha256);}
assert.equal(sha(read(base+'/FOLLOWUP_PREFLIGHT.json')),'1c0c4dce009d5bbb1a4503c396f2128a045d2881493f28d4c16c0cc660279882');
const backupPath='F:/VisibleMedicine/recovery/checkpoints/20261022-review-tour-followups-source-backup/github-backup.json';
assert.equal(sha(read(backupPath)),'6950a0535ac0c683f2e9cb5a03e4e77d1363285fdd30d904b03688b2097c7301');
const backup=json(backupPath);assert(backup.sourceBackupVerified&&backup.strictIntegrity);assert.equal(backup.privateDataBackup,false);
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');
assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
const terminalPath=base+'/native-selected-repairs-v5/TERMINAL.json';
const result={at:new Date().toISOString(),previousGoalTurnClassification:'progress',
 milestone:'20 remaining source/history test proposals reviewed, independently source-composed, preflighted and filtered-source-backed-up',
 installedAtlas:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',installedReview:'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59',
 currentCandidate:source.website,currentSourceReceipt:plan.sourceReceipt,currentSourceReceiptSha256:plan.sourceReceiptSha256,sourcePaths:6042,
 proposalPlan:planPath,proposalPlanSha256:sha(read(planPath)),proposals:20,additions:5,nextNativeRoots:29,
 preflight:{receipt:base+'/FOLLOWUP_PREFLIGHT.json',sha256:sha(read(base+'/FOLLOWUP_PREFLIGHT.json')),allExactPreimagesAndCodeVerified:true,candidateChanged:false},
 sourceComposition:plan.sourceComposition,allHistoricalCasesAndRefusalsRetained:true,
 sourceBackup:{receipt:backupPath,receiptSha256:sha(read(backupPath)),head:backup.head,tree:backup.tree,sourcePaths:backup.sourcePaths,restoredPaths:backup.restoredPaths,
  independentlyVerified:true,all20ProposalCodeAndRawPreimagesIncluded:true,rawGeneratedIntegrationAndPinFixturesExcluded:true,
  wholePrivateOrRunnableBackup:false,laterLocalCoordinationScriptsNotIncluded:true},
 nativeRun:{evidence:base+'/native-selected-repairs-v5',session:14480,pid:308392,terminal:fs.existsSync(terminalPath),
  result:fs.existsSync(terminalPath)?json(terminalPath):null},
 canonicalChanged:false,ownerPreviewChanged:false,ownerFormsRefreshed:false,clinicalApproval:false,patientRegistration:false,publicDeployment:false,
 all71AndEightIdeasPreserved:true,original5860RunAnd280FailuresRetained:true,
 next:plan.next,
};
const directory='F:/VisibleMedicine/recovery/checkpoints/20261022-review-tour-admissions-verified';assert(!fs.existsSync(directory));fs.mkdirSync(directory);
fs.copyFileSync('CURRENT_CHECKPOINT.json',directory+'/pointer.before.json');fs.copyFileSync('WORKSPACE_MAP.md',directory+'/WORKSPACE_MAP.before.md');
fs.writeFileSync(directory+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');
pointer.activeWork.pendingReviewTourFollowups={...pointer.activeWork.pendingReviewTourFollowups,proposalsOffDeviceBackedUp:true,
 sourceBackup:result.sourceBackup,checkpoint:directory+'/checkpoint.json',checkpointSha256:sha(read(directory+'/checkpoint.json'))};
pointer.activeWork.pendingSixClinicalRuntimeAdmission={...pointer.activeWork.pendingSixClinicalRuntimeAdmission,
 phase:'corrected exact30-MRI snapshot inverse verified independently; included in20-proposal unintegrated plan',sourceCompositionAccepted:true};
pointer.activeWork.pendingRegressionRepairQueue.latestVerifiedSourceBackup=result.sourceBackup;
pointer.activeWork.pendingColicUltrasound.takesPrecedenceForActiveWork=false;
pointer.activeWork.inflight.takesPrecedenceOverSavedCheckpointNarrative=false;
const current={readFirst:true,at:result.at,checkpoint:directory+'/checkpoint.json',checkpointSha256:sha(read(directory+'/checkpoint.json')),
 installedAtlas:result.installedAtlas,installedReview:result.installedReview,currentCandidate:result.currentCandidate,
 sourceReceipt:result.currentSourceReceipt,sourceReceiptSha256:result.currentSourceReceiptSha256,nativeRun:result.nativeRun,
 followupPlan:planPath,followupPlanSha256:result.proposalPlanSha256,proposalCodeSourceBackedUp:true,
 beforeFurtherWork:'Poll exact live session14480. No candidate overlay or second heavy job until actual172-root terminal. Do not reread historical checkpoints or restart a live slow job. Only inspect later failures or advance a genuinely independent scoped item.',next:result.next};
pointer.activeWork={current,...pointer.activeWork};pointer.activeWork.current=current;pointer.activeWork.updated=result.at;pointer.activeWork.next=result.next;
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({checkpoint:directory+'/checkpoint.json',sha256:sha(read(directory+'/checkpoint.json')),sourceBackup:result.sourceBackup,nativeRunTerminal:result.nativeRun.terminal,candidateChanged:false}));
