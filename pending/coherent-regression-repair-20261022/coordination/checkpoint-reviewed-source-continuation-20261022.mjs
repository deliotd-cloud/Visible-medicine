import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const base='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const planPath='F:/VisibleMedicine/staging/20261022-reviewed-source-continuation/PLAN.json';
assert.equal(sha(read(planPath)),'3ea1ec6220680ce72cc6796925b8066107258cc1fbdd3f5328d2df332901aa71');
const plan=json(planPath),source=json(plan.sourceReceipt);
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256);
for(const row of plan.repairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(row.beforePath)),row.beforeSha256);}
const preflight=base+'/REVIEWED_SOURCE_FOLLOWUP_PREFLIGHT.json';
assert.equal(sha(read(preflight)),'6d8aee786ac23d0c317bc2eb8317ff9c25a7a820bf1e495a1fcbf33c1be9d9ec');
const backupPath='F:/VisibleMedicine/recovery/checkpoints/20261022-reviewed-source-continuation-source-backup/github-backup.json';
assert.match(process.argv[2]??'',/^[a-f0-9]{64}$/);assert.equal(sha(read(backupPath)),process.argv[2]);
const backup=json(backupPath);assert(backup.sourceBackupVerified&&backup.strictIntegrity);assert.equal(backup.privateDataBackup,false);
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');
assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
const pointer=json('CURRENT_CHECKPOINT.json'),hold=pointer.activeWork.current.ownerPreviewPolicy;
assert.equal(hold.websiteCutoverPermitted,false);assert.equal(hold.goalPaused,false);
const terminalPath=base+'/native-selected-repairs-v5/TERMINAL.json';
const result={at:new Date().toISOString(),previousGoalTurnClassification:'progress',
 milestone:'47 exact source-reviewed repairs and89-root continuation selected, preflighted and independently source-backed-up; preview hold preserved',
 currentCandidate:source.website,sourceReceipt:plan.sourceReceipt,sourceReceiptSha256:sha(read(plan.sourceReceipt)),sourcePaths:6042,
 planPath,planSha256:sha(read(planPath)),repairs:47,additions:6,nextNativeRoots:89,preflight,preflightSha256:sha(read(preflight)),
 originalFailureCoverage:plan.originalFailureCoverage,partialNativeObservation:plan.partialNativeObservation,
 sourceBackup:{receipt:backupPath,receiptSha256:sha(read(backupPath)),head:backup.head,tree:backup.tree,
  sourcePaths:backup.sourcePaths,restoredPaths:backup.restoredPaths,independentlyVerified:true,
  selectedCodeAndRawPreimagesIncluded:true,generatedMetadataAndRawLogsRemainLocal:true,wholePrivateOrRunnableBackup:false},
 nativeRun:{evidence:base+'/native-selected-repairs-v5',session:14480,pid:308392,
  terminal:fs.existsSync(terminalPath),result:fs.existsSync(terminalPath)?json(terminalPath):null},
 ownerPreviewPolicy:hold,pendingWorkers:[
  {owner:'/root/clinical_runtime_followups_1022',stage:'F:/VisibleMedicine/staging/20261022-current-head-entrypoint-followups',
   ownership:['clinical-review-median-cubital-xray.test.ts','clinical-review-neonatal-cranial-us.test.ts','batch-c-role-inverse.mjs'],
   composition:'V5 RAW helper; selected limb9430 helper retained as PREDECESSOR; virtual graph preserves all8cases. Not selected in47plan or verified backup.'},
  {owner:'/root/uncovered_regression_triage_1022',stage:'F:/VisibleMedicine/staging/20261022-orbital-check-runtime-followup',
   ownership:['clinical-review-orbital-check-evidence.test.mjs'],composition:'Review6d7 versus independent runtime190a; dependent ownership only after main consent. Not selected in47plan or verified backup.'}],
 candidateChanged:false,canonicalChanged:false,ownerFormsRefreshed:false,clinicalApproval:false,patientRegistration:false,
 full71AndEightIdeasPreserved:true,original5860And280FailuresRetained:true,next:plan.next};
const directory='F:/VisibleMedicine/recovery/checkpoints/20261022-reviewed-source-continuation-verified';
assert(!fs.existsSync(directory));fs.mkdirSync(directory);
fs.copyFileSync('CURRENT_CHECKPOINT.json',directory+'/pointer.before.json');fs.copyFileSync('WORKSPACE_MAP.md',directory+'/WORKSPACE_MAP.before.md');
fs.writeFileSync(directory+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
pointer.activeWork.current={...pointer.activeWork.current,at:result.at,checkpoint:directory+'/checkpoint.json',
 checkpointSha256:sha(read(directory+'/checkpoint.json')),proposalCodeSourceBackedUp:true,sourceBackup:result.sourceBackup,
 nativeRun:result.nativeRun,pendingWorkers:result.pendingWorkers,beforeFurtherWork:'Read exact live172-root session14480/terminal. Review the two newly assigned stages before any overlap.47plan is source-reviewed/backed-up, not integrated. Older24/20preparers are superseded. Do not restart or change normal preview.',next:plan.next};
pointer.activeWork.updated=result.at;fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({checkpoint:directory+'/checkpoint.json',sha256:sha(read(directory+'/checkpoint.json')),
  sourceBackup:result.sourceBackup,nativeTerminal:result.nativeRun.terminal,candidateChanged:false}));
