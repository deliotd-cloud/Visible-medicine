import assert from 'node:assert/strict';
import {existsSync,mkdirSync,copyFileSync,writeFileSync} from 'node:fs';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/recovery/checkpoints/20261022-historic-schema-repairs-verified';assert(!existsSync(root));
const queuePath='F:/VisibleMedicine/staging/20261022-historic-schema-repairs-consolidated/QUEUE.json';assert.equal(sha(read(queuePath)),'12b41b14c55905a49b5e5f87a2bd362749ba8fcd7baae8814b6b3634d9f1af7f');const queue=json(queuePath);
const backupPath='F:/VisibleMedicine/recovery/checkpoints/20261022-historic-schema-repairs-source-backup/github-backup.json';assert.equal(sha(read(backupPath)),'2440351e272a2666ffdc953c0ebac05cb5b3975f5e6dafbc401312375c65b11e');const backup=json(backupPath);assert(backup.sourceBackupVerified&&backup.strictIntegrity);assert.equal(backup.restoredPaths,2855);
for(const row of queue.repairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(queue.website+'/'+row.path)),row.beforeSha256);assert.equal(sha(read('F:/VisibleMedicine/recovery/checkpoints/20261022-historic-schema-repairs-source-backup/remote-source-restored/pending/coherent-regression-repair-20261022/website/'+row.path)),row.proposalSha256);}
assert.equal(sha(read(queue.sourceTextAudit.path)),queue.sourceTextAudit.sha256);assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),queue.source);assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');
const pointer=json('CURRENT_CHECKPOINT.json'),running=pointer.activeWork.runningFullAssurance,observation=json(running.latestObservation);assert.equal(running.session,92110);assert(observation.live&&!observation.terminal);
const tap=read(observation.output+'/child.tap'),direct=new Set(queue.repairs.map(row=>row.path));
const helperProposals={
 'tests/atlas-coronary-arterial-study.test.ts':['tests/atlas-coronary-arterial-study-checks.mjs'],
 'tests/atlas-coronary-venous-context.test.ts':['tests/atlas-coronary-venous-context-checks.mjs'],
 'tests/atlas-foot-surface-imaging.test.ts':['tests/atlas-foot-surface-imaging-checks.mjs'],
 'tests/atlas-foot-ultrasound-followup.test.ts':['tests/atlas-foot-ultrasound-followup-checks.mjs','tests/atlas-foot-ultrasound-followup-current.mjs'],
};
const failures=[...tap.toString().matchAll(/^not ok ([^\r\n]+)\r?\n([\s\S]*?)^  \.\.\.\r?$/gm)].map(match=>{
 const location=match[2].match(/location: '([^'\r\n]+)'/);assert(location);const normalized=location[1].replaceAll('\\\\','/'),p=normalized.split('/website/')[1]?.replace(/:\d+:\d+$/,'');assert(p?.startsWith('tests/'));
 const proposals=direct.has(p)?[p]:helperProposals[p]??[];for(const q of proposals)assert(direct.has(q));
 return{label:match[1],path:p,proposalPaths:proposals,status:proposals.length?'Source-only proposal exists; native rerun pending':'Further triage required',passingClaim:false};
});
const remaining=[...new Set(failures.filter(row=>!row.proposalPaths.length).map(row=>row.path))];
mkdirSync(root,{recursive:true});copyFileSync('CURRENT_CHECKPOINT.json',root+'/pointer.before.json');copyFileSync('WORKSPACE_MAP.md',root+'/WORKSPACE_MAP.md');
writeFileSync(root+'/OBSERVED_FAILURE_SNAPSHOT.json',JSON.stringify({at:new Date().toISOString(),output:observation.output,tapBytesAtSnapshot:tap.length,tapSha256AtSnapshot:sha(tap),completedFailureBlocksAtSnapshot:failures.length,countsAreTerminal:false,failures,remainingTriagePaths:remaining,passingClaim:false},null,2)+'\n',{flag:'wx'});
const sourceBackup={receipt:backupPath,receiptSha256:sha(read(backupPath)),head:backup.head,tree:backup.tree,restoredSelectedPaths:2855,sourcePaths:2852,includesAll39RepairProposalsAndCodePreimages:true,independentFetchTreeBytesRestoreVerified:true,wholeProjectOrPrivateOrRunnableBackup:false};
const result={at:new Date().toISOString(),purpose:'39 unintegrated source-preserving test/helper proposals; no product cutover or native passing claim',installedAtlas:queue.source,installedReview:'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59',candidateReview:queue.review,queue:queuePath,queueSha256:sha(read(queuePath)),proposedPaths:39,wholeOriginalSourceInverses:39,sourceTextAudit:queue.sourceTextAudit,oldChecksumRefusalPreserved:true,sourceBackup,fullRegression:{root:running.root,session:92110,live:true,terminal:false,latestObservation:running.latestObservation,latestObservationSha256:sha(read(running.latestObservation)),entries:1143,namedInputs:5632,countsAreTerminal:false,passingClaim:false},observedFailureSnapshot:root+'/OBSERVED_FAILURE_SNAPSHOT.json',observedFailureSnapshotSha256:sha(read(root+'/OBSERVED_FAILURE_SNAPSHOT.json')),furtherTriagePaths:remaining,ownerPreviewChangedByThisMilestone:false,ownerFormsRefreshed:false,cancelledOldTestConfirmationIsNotNewDraftSafeCutoverPermission:true,clinicalApproval:false,publicDeployment:false,privateUpload:false,desktopPacsEdited:false,next:queue.next};
writeFileSync(root+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
Object.assign(pointer.activeWork.pendingRegressionRepairQueue,{sourceBackupIncludesThisWholeBatch:true,sourceBackup,checkpoint:root+'/checkpoint.json',checkpointSha256:sha(read(root+'/checkpoint.json')),observedFailureSnapshot:result.observedFailureSnapshot,furtherTriagePaths:remaining});pointer.activeWork.regressionRepairSourceBackup=sourceBackup;pointer.activeWork.updated=result.at;writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),sourceBackedUpProposals:39,fullRegressionStillLive:true,furtherTriagePaths:remaining,ownerFormsRefreshed:false}));
