import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const base='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const planPath='F:/VisibleMedicine/staging/20261022-native-runtime-followups-consolidated/PLAN.json';
assert.equal(sha(read(planPath)),'e46623e9018cf718ca2dcfacb0f9d9f06cff867870b19ea8c8d094a5446047f1');
const plan=json(planPath),source=json(plan.sourceReceipt);
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256);
for(const row of plan.repairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(row.beforePath)),row.beforeSha256);}
const preflight=base+'/NATIVE_SOURCE_FOLLOWUP_PREFLIGHT.json';assert.equal(sha(read(preflight)),'96d65da46ca0e00e78abda5090f954a3b13e848a154aebf2554f5de04d79793d');
const backupPath='F:/VisibleMedicine/recovery/checkpoints/20261022-native-source-followups-source-backup/github-backup.json';
assert.match(process.argv[2]??'',/^[a-f0-9]{64}$/);assert.equal(sha(read(backupPath)),process.argv[2]);
const backup=json(backupPath);assert(backup.sourceBackupVerified&&backup.strictIntegrity);assert.equal(backup.privateDataBackup,false);
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');
assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
const terminal=base+'/native-selected-repairs-v5/TERMINAL.json';
const result={at:new Date().toISOString(),previousGoalTurnClassification:'progress',
 milestone:'Three actual native failure followups fully source-proved and filtered-source-backed-up; immutable172-root run continues',
 currentCandidate:source.website,sourceReceipt:plan.sourceReceipt,sourceReceiptSha256:sha(read(plan.sourceReceipt)),sourcePaths:6042,
 planPath,planSha256:sha(read(planPath)),repairs:24,additions:5,nextNativeRoots:35,preflight,preflightSha256:sha(read(preflight)),
 partialRunFollowups:plan.partialRunFollowups,sourceOnlyRuntimeRecordsVerified:2876,sourceOnlyGitBlobsVerified:1617,
 sourceBackup:{receipt:backupPath,receiptSha256:sha(read(backupPath)),head:backup.head,tree:backup.tree,sourcePaths:backup.sourcePaths,restoredPaths:backup.restoredPaths,
  independentlyVerified:true,all24RepairCodeAndFullPreimagesIncluded:true,firstLicenseOnlyProposalPreserved:true,generatedMetadataFixturesStillLocal:true,
  wholePrivateOrRunnableBackup:false},
 nativeRun:{evidence:base+'/native-selected-repairs-v5',session:14480,pid:308392,terminal:fs.existsSync(terminal),result:fs.existsSync(terminal)?json(terminal):null},
 candidateChanged:false,canonicalChanged:false,ownerPreviewChanged:false,ownerFormsRefreshed:false,clinicalApproval:false,patientRegistration:false,
 full71AndEightIdeasPreserved:true,original5860And280FailuresRetained:true,next:plan.next};
const directory='F:/VisibleMedicine/recovery/checkpoints/20261022-native-source-followups-verified';assert(!fs.existsSync(directory));fs.mkdirSync(directory);
fs.copyFileSync('CURRENT_CHECKPOINT.json',directory+'/pointer.before.json');fs.copyFileSync('WORKSPACE_MAP.md',directory+'/WORKSPACE_MAP.before.md');
fs.writeFileSync(directory+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.current={...pointer.activeWork.current,at:result.at,checkpoint:directory+'/checkpoint.json',
 checkpointSha256:sha(read(directory+'/checkpoint.json')),followupPlan:planPath,followupPlanSha256:sha(read(planPath)),
 partialRunFollowups:plan.partialRunFollowups,proposalCodeSourceBackedUp:true,next:plan.next};
pointer.activeWork.current.latestPartialDiagnostics={...pointer.activeWork.current.latestPartialDiagnostics,
 state:'Allthree observed failure markers have main-reviewed staged source corrections. Initial license-only proposal was incomplete and is preserved; select the runtime-family V2 instead.',
 selectedPlan:planPath,sourceOnlyNotNativeAcceptance:true};
pointer.activeWork.pendingReviewTourFollowups={...pointer.activeWork.pendingReviewTourFollowups,proposalsOffDeviceBackedUp:true,
 newFourSourceRepairsOffDeviceBackedUp:true,sourceBackup:result.sourceBackup,checkpoint:directory+'/checkpoint.json'};
pointer.activeWork.pendingRegressionRepairQueue.latestVerifiedSourceBackup=result.sourceBackup;pointer.activeWork.updated=result.at;
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({checkpoint:directory+'/checkpoint.json',sha256:sha(read(directory+'/checkpoint.json')),sourceBackup:result.sourceBackup,nativeTerminal:result.nativeRun.terminal,candidateChanged:false}));
