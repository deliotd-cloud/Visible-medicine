import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';

const base='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const sourcePath=base+'/PRODUCT_SOURCE_V6.json',planPath='F:/VisibleMedicine/staging/20261022-terminal-source-continuation/PLAN.json';
assert.equal(sha(read(sourcePath)),'44b20981b029abc59f4a5efcaa2c8e6a9fbddb7e2e00886c0db914646681169c');
assert.equal(sha(read(planPath)),'c434483f2f05fba330d3412655716a7fb76c3b8c50294509571fe024260fa46f');
const source=json(sourcePath),plan=json(planPath);
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
const oldSource=json(base+'/PRODUCT_SOURCE_V5.json');
assert.deepEqual(source.sourceRows.filter(row=>!row.path.startsWith('tests/')),oldSource.sourceRows.filter(row=>!row.path.startsWith('tests/')));
for(const row of plan.repairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(row.beforePath)),row.beforeSha256);assert.equal(sha(read(source.website+'/'+row.path)),row.proposalSha256);}
for(const row of plan.additionalFiles)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256);
const backupPath='F:/VisibleMedicine/recovery/checkpoints/20261022-terminal-source-continuation-source-backup/github-backup.json';
assert.match(process.argv[2]??'',/^[a-f0-9]{64}$/);assert.equal(sha(read(backupPath)),process.argv[2]);
const backup=json(backupPath);assert(backup.sourceBackupVerified&&backup.strictIntegrity);assert.equal(backup.privateDataBackup,false);
const gitHead=repo=>runGit(['-C',repo,'rev-parse','HEAD']).toString().trim();
assert.equal(gitHead('F:/VisibleMedicine/website'),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert.equal(gitHead('F:/VisibleMedicine/atlas'),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');
const pointer=json('CURRENT_CHECKPOINT.json'),current=pointer.activeWork.current;
assert.equal(current.ownerPreviewPolicy.websiteCutoverPermitted,false);assert.equal(current.ownerPreviewPolicy.goalPaused,false);
const nativeEvidence=base+'/native-terminal-followups-v6';
const terminalPath=nativeEvidence+'/TERMINAL.json';
const nativeTerminal=fs.existsSync(terminalPath)?json(terminalPath):null;
const result={at:new Date().toISOString(),goalTurnClassification:'progress',
 milestone:'All31 actual V5 terminal failures source-diagnosed;68 test/helper repairs plus7 additions coherently overlaid in isolation;101-root native verification started; selected source backup independently restored.',
 installed:{website:'b953ff3f5f1891599cb6e91cb91311d9d6006270',atlas:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',review:'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59'},
 sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),sourcePaths:6049,
 planPath,planSha256:sha(read(planPath)),repairs:68,additions:7,nextNativeRoots:101,nonTestProductBytesChanged:0,
 diagnosticReview:base+'/native-selected-repairs-v5/DIAGNOSTIC_REVIEW.json',
 diagnosticReviewSha256:sha(read(base+'/native-selected-repairs-v5/DIAGNOSTIC_REVIEW.json')),
 priorActualTerminal:json(base+'/native-selected-repairs-v5/TERMINAL.json'),
 sourceProofs:'Main reviewed actual diffs and executed source-only history/inverse/refusal proofs.15 real UI lifecycle/admission/disclosure callbacks plus three source-mutation refusals pass in the isolated module harness. Proof-helper loader/count diagnostics and all original buffers are retained, not erased.',
 sourceProofsAreNotNativeAcceptance:true,
 nativeRun:{...current.nativeRun,evidence:nativeEvidence,terminal:!!nativeTerminal,result:nativeTerminal},
 nativeInputsSha256:sha(read(nativeEvidence+'/INPUTS.json')),
 sourceBackup:{receipt:backupPath,receiptSha256:sha(read(backupPath)),head:backup.head,tree:backup.tree,
  sourcePaths:backup.sourcePaths,restoredPaths:backup.restoredPaths,independentlyVerified:true,
  selectedCodeAndRawPreimagesIncluded:true,generatedMetadataAndRawLogsRemainLocal:true,wholePrivateOrRunnableBackup:false},
 ownerPreviewPolicy:current.ownerPreviewPolicy,canonicalChanged:false,ownerPreviewChanged:false,ownerFormsRefreshed:false,
 full71AndEightIdeasPreserved:true,original5860And280FailuresRetained:true,
 clinicalApproval:false,patientRegistration:false,publicDeployment:false,
 next:'Keep V6 source immutable while the101-root job runs; no second heavy job. Inspect actual terminal and every failure before further overlay, then full types. Continue independent safe source work; normal preview/cutover/tab-refresh hold remains. No whole-suite/clinical/spatial/public approval is implied.'};
const directory='F:/VisibleMedicine/recovery/checkpoints/20261022-terminal-source-continuation-verified';
assert(!fs.existsSync(directory));fs.mkdirSync(directory);
fs.copyFileSync('CURRENT_CHECKPOINT.json',directory+'/pointer.before.json');fs.copyFileSync('WORKSPACE_MAP.md',directory+'/WORKSPACE_MAP.before.md');
fs.writeFileSync(directory+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
pointer.activeWork.current={...current,at:result.at,checkpoint:directory+'/checkpoint.json',
 checkpointSha256:sha(read(directory+'/checkpoint.json')),sourceBackup:result.sourceBackup,
 proposalCodeSourceBackedUp:true,repairs:68,additions:7,nextNativeRoots:101,
 beforeFurtherWork:result.next,next:result.next,pendingWorkers:[]};
pointer.activeWork.updated=result.at;fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({checkpoint:directory+'/checkpoint.json',sha256:sha(read(directory+'/checkpoint.json')),sourceBackup:result.sourceBackup,nativeTerminal:!!nativeTerminal,ownerPreviewChanged:false}));
