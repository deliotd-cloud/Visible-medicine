// Main-owned local checkpoint; no website or Atlas mutation and no remote write.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,copyFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';

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

export function checkpointReviewedRegressionQueue({stem,queuePath,queueSha256,expectedProposals,backupPath,backupSha256,milestone}){
 assert.match(stem,/^[a-z][a-z0-9-]{1,65}$/);
 const root='F:/VisibleMedicine/recovery/checkpoints/20261022-'+stem;assert(!existsSync(root));
 assert.equal(sha(read(queuePath)),queueSha256);const queue=json(queuePath);
 assert.equal(queue.repairs.length,expectedProposals);assert.equal(queue.completeOriginalSourceInverses,expectedProposals);
 assert.equal(sha(read(backupPath)),backupSha256);const backup=json(backupPath);
 assert(backup.sourceBackupVerified&&backup.strictIntegrity);assert.equal(backup.proof.proposedTestAndHelperPaths,expectedProposals);
 assert.equal(backup.privateDataBackup,false);assert.equal(backup.wholeProjectBackup,false);
 const restored=path.dirname(backupPath)+'/remote-source-restored/pending/coherent-regression-repair-20261022/website/';
 for(const row of queue.repairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(queue.website+'/'+row.path)),row.beforeSha256);assert.equal(sha(read(restored+row.path)),row.proposalSha256);}
 for(const row of queue.additionalFiles)assert.equal(sha(read(restored+row.path)),row.sha256);
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),queue.source);
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 const pointer=json('CURRENT_CHECKPOINT.json'),running=pointer.activeWork.runningFullAssurance,observation=json(running.latestObservation);
 assert.equal(running.session,92110);assert(observation.live&&!observation.terminal,'Use the actual terminal driver receipt if the observed run has finished');
 const tap=read(observation.output+'/child.tap'),direct=new Set(queue.repairs.map(row=>row.path));
 const failures=[...tap.toString().matchAll(/^not ok ([^\r\n]+)\r?\n([\s\S]*?)^  \.\.\.\r?$/gm)].map(match=>{
  const location=match[2].match(/location: '([^'\r\n]+)'/);assert(location);
  const name=location[1].replaceAll('\\\\','/').split('/website/')[1]?.replace(/:\d+:\d+$/,'');assert(name?.startsWith('tests/'));
  let proposals=direct.has(name)?[name]:(helpers[name]??[]).filter(p=>direct.has(p));
  let route=direct.has(name)?'direct test proposal':proposals.length?'previously inspected helper consumer':null;
  const shared='tests/clinical-review-current-admission.mjs',details=match[2].replaceAll('\\\\','/');
  if(!proposals.length&&direct.has(shared)&&details.includes('/'+shared+':')
    &&details.includes('190a63238eadcf906abe89dcbb6a67c88afe70b9')&&details.includes('6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1')){
   proposals=[shared];route='actual observed family-revision mismatch in shared admission stack';
  }
  return {label:match[1],path:name,proposalPaths:proposals,route,status:proposals.length?'Reviewed source-only proposal exists; actual native rerun required':'Further triage required',passingClaim:false};
 });
 const remaining=[...new Set(failures.filter(row=>!row.proposalPaths.length).map(row=>row.path))];
 mkdirSync(root,{recursive:true});copyFileSync('CURRENT_CHECKPOINT.json',root+'/pointer.before.json');copyFileSync('WORKSPACE_MAP.md',root+'/WORKSPACE_MAP.before.md');
 const snapshot={at:new Date().toISOString(),output:observation.output,tapBytesAtSnapshot:tap.length,tapSha256AtSnapshot:sha(tap),completedFailureBlocksAtSnapshot:failures.length,countsAreTerminal:false,failures,remainingTriagePaths:remaining,moreEntriesStillRunning:true,passingClaim:false};
 writeFileSync(root+'/OBSERVED_FAILURE_SNAPSHOT.json',JSON.stringify(snapshot,null,2)+'\n',{flag:'wx'});
 const sourceBackup={receipt:backupPath,receiptSha256:backupSha256,head:backup.head,tree:backup.tree,restoredSelectedPaths:backup.restoredPaths,sourcePaths:backup.sourcePaths,includesAllSelectedRepairProposalsAndCodePreimages:expectedProposals,includesAllAdditionalCodeProofPaths:queue.additionalFiles.length,independentFetchTreeBytesRestoreVerified:true,wholeProjectOrPrivateOrRunnableBackup:false};
 const result={at:new Date().toISOString(),previousGoalTurnClassification:'progress',thisMilestone:milestone,installedAtlas:queue.source,installedReview:'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59',candidateReview:queue.review,queue:queuePath,queueSha256,sourceBackup,
  fullRegression:{root:running.root,session:92110,liveAtObservation:true,terminalAtObservation:false,latestObservation:running.latestObservation,latestObservationSha256:sha(read(running.latestObservation)),entries:1143,namedInputs:5632,countsAreTerminal:false,passingClaim:false},
  observedFailureSnapshot:root+'/OBSERVED_FAILURE_SNAPSHOT.json',furtherTriagePaths:remaining,freshSavedDraftRestartAnswerPending:true,
  ownerPreviewChanged:false,ownerFormsRefreshed:false,clinicalApproval:false,publicDeployment:false,privateUpload:false,desktopPacsEdited:false,full71AndEightIdeasPreserved:true,next:queue.next};
 writeFileSync(root+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 Object.assign(pointer.activeWork.pendingRegressionRepairQueue,{sourceBackupIncludesThisWholeBatch:true,sourceBackup,checkpoint:root+'/checkpoint.json',checkpointSha256:sha(read(root+'/checkpoint.json')),observedFailureSnapshot:result.observedFailureSnapshot,furtherTriagePaths:remaining});
 pointer.activeWork.regressionRepairSourceBackup=sourceBackup;pointer.activeWork.updated=result.at;
 writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
 console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),sourceBackedUpProposals:expectedProposals,furtherTriagePaths:remaining,countsAreTerminal:false,ownerFormsRefreshed:false}));
 return result;
}
