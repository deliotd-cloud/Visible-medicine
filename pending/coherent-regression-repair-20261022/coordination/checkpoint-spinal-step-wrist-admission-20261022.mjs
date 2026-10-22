import assert from 'node:assert/strict';
import {existsSync,mkdirSync,copyFileSync,writeFileSync} from 'node:fs';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';

const root='F:/VisibleMedicine/recovery/checkpoints/20261022-spinal-step-wrist-verified';assert(!existsSync(root));
const queuePath='F:/VisibleMedicine/staging/20261022-spinal-step-wrist-consolidated/QUEUE.json';
assert.equal(sha(read(queuePath)),'9de5a86b16d6cd39e935a566ae94c38fdebe2015cb74517c86541b8768c1d62d');const queue=json(queuePath);
const backupPath='F:/VisibleMedicine/recovery/checkpoints/20261022-spinal-step-wrist-admission-source-backup/github-backup.json';
assert.equal(sha(read(backupPath)),'dbd3fb779c0f2e1b70d7c38aa2761a77d6fa1579595b318a4538ec04b241fcbd');
const backup=json(backupPath);assert(backup.sourceBackupVerified&&backup.strictIntegrity);assert.equal(backup.restoredPaths,2927);
const restored='F:/VisibleMedicine/recovery/checkpoints/20261022-spinal-step-wrist-admission-source-backup/remote-source-restored/pending/coherent-regression-repair-20261022/website/';
for(const row of queue.repairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(queue.website+'/'+row.path)),row.beforeSha256);assert.equal(sha(read(restored+row.path)),row.proposalSha256);}
for(const row of queue.additionalFiles)assert.equal(sha(read(restored+row.path)),row.sha256);
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),queue.source);
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');
assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
const pointer=json('CURRENT_CHECKPOINT.json'),running=pointer.activeWork.runningFullAssurance,observation=json(running.latestObservation);
assert.equal(running.session,92110);assert(observation.live&&!observation.terminal);
const tap=read(observation.output+'/child.tap'),direct=new Set(queue.repairs.map(row=>row.path));
const helpers={
 'tests/atlas-coronary-arterial-study.test.ts':['tests/atlas-coronary-arterial-study-checks.mjs'],
 'tests/atlas-coronary-venous-context.test.ts':['tests/atlas-coronary-venous-context-checks.mjs'],
 'tests/atlas-foot-surface-imaging.test.ts':['tests/atlas-foot-surface-imaging-checks.mjs'],
 'tests/atlas-foot-ultrasound-followup.test.ts':['tests/atlas-foot-ultrasound-followup-checks.mjs','tests/atlas-foot-ultrasound-followup-current.mjs'],
 'tests/atlas-hyoid-epiglottis-ultrasound.test.ts':['tests/atlas-hyoid-epiglottis-ultrasound-checks.mjs'],
 'tests/atlas-pelvic-reproductive-core.test.ts':['tests/atlas-pelvic-reproductive-core-checks.mjs'],
 'tests/atlas-respiratory-core-depth.test.ts':['tests/atlas-respiratory-core-depth-checks.mjs'],
 'tests/atlas-thoracoabdominal-quiz.test.ts':['tests/atlas-thoracoabdominal-quiz-checks.mjs'],
};
for(const stem of ['main-bronchus-xray','nested-practice','orbital-ultrasound','pelvic-update','pes-anserine-study','posterior-mediastinal','practice-navigation','proper-digital-teaching','projection-ultrasound','pulmonary-hilar','pulmonary-vein-ultrasound','search-study-handoff'])helpers['tests/atlas-'+stem+'.test.ts']=['tests/atlas-nonregional-release-fixture.ts'];
const failures=[...tap.toString().matchAll(/^not ok ([^\r\n]+)\r?\n([\s\S]*?)^  \.\.\.\r?$/gm)].map(match=>{
 const location=match[2].match(/location: '([^'\r\n]+)'/);assert(location);
 const name=location[1].replaceAll('\\\\','/').split('/website/')[1]?.replace(/:\d+:\d+$/,'');assert(name?.startsWith('tests/'));
 const proposals=direct.has(name)?[name]:helpers[name]??[];
 return {label:match[1],path:name,proposalPaths:proposals,status:proposals.length?'Reviewed source-only proposal exists; actual original native rerun required':'Further triage required',passingClaim:false};
});
const remaining=[...new Set(failures.filter(row=>!row.proposalPaths.length).map(row=>row.path))];
mkdirSync(root,{recursive:true});copyFileSync('CURRENT_CHECKPOINT.json',root+'/pointer.before.json');copyFileSync('WORKSPACE_MAP.md',root+'/WORKSPACE_MAP.before.md');
const snapshot={at:new Date().toISOString(),output:observation.output,tapBytesAtSnapshot:tap.length,tapSha256AtSnapshot:sha(tap),completedFailureBlocksAtSnapshot:failures.length,countsAreTerminal:false,failures,remainingTriagePaths:remaining,moreEntriesStillRunning:true,passingClaim:false};
writeFileSync(root+'/OBSERVED_FAILURE_SNAPSHOT.json',JSON.stringify(snapshot,null,2)+'\n',{flag:'wx'});
const sourceBackup={receipt:backupPath,receiptSha256:sha(read(backupPath)),head:backup.head,tree:backup.tree,restoredSelectedPaths:2927,sourcePaths:2924,includesAll58RepairProposalsAndCodePreimages:true,includesAllSixAdditionalCodeProofPaths:true,independentFetchTreeBytesRestoreVerified:true,wholeProjectOrPrivateOrRunnableBackup:false};
const result={at:new Date().toISOString(),previousGoalTurnClassification:'progress',thisMilestone:{newUniqueReviewedSourcePaths:6,completeOriginalSourceInverses:58,additionalCodeProofPaths:6,actualVerifiedSourceBackup:true,validTourRetryUnchanged:true,duplicateDiscProposalNotSelected:true,exactLicenseRepresentationNotBroadlyNormalised:true},
 installedAtlas:queue.source,installedReview:'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59',candidateReview:queue.review,queue:queuePath,queueSha256:sha(read(queuePath)),sourceBackup,
 fullRegression:{root:running.root,session:92110,live:true,terminal:false,latestObservation:running.latestObservation,latestObservationSha256:sha(read(running.latestObservation)),entries:1143,namedInputs:5632,countsAreTerminal:false,passingClaim:false},
 priorityReassessment:{at:new Date().toISOString(),priority:'Finish the coherent website/Atlas regression and source-role repairs before owner UI cutover; advance independent source-backed roadmap work while this single heavy process is live.',full71AndEightIdeasPreserved:true,clinicalReviewNotADevelopmentStall:true},
 observedFailureSnapshot:root+'/OBSERVED_FAILURE_SNAPSHOT.json',furtherTriagePaths:remaining,freshSavedDraftRestartAnswerPending:true,
 ownerPreviewChanged:false,ownerFormsRefreshed:false,clinicalApproval:false,publicDeployment:false,privateUpload:false,desktopPacsEdited:false,next:queue.next};
writeFileSync(root+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
Object.assign(pointer.activeWork.pendingRegressionRepairQueue,{sourceBackupIncludesThisWholeBatch:true,sourceBackup,checkpoint:root+'/checkpoint.json',checkpointSha256:sha(read(root+'/checkpoint.json')),observedFailureSnapshot:result.observedFailureSnapshot,furtherTriagePaths:remaining});
pointer.activeWork.regressionRepairSourceBackup=sourceBackup;pointer.activeWork.updated=result.at;
writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),sourceBackedUpProposals:58,newUniqueReviewedPaths:6,fullRegressionStillLive:true,furtherTriagePaths:remaining,countsAreTerminal:false,ownerFormsRefreshed:false}));
