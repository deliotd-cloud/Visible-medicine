import assert from 'node:assert/strict';
import {existsSync,writeFileSync,mkdirSync} from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-regression-repair-queue';assert(!existsSync(root));
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const cranial='F:/VisibleMedicine/staging/20261022-cranial-cubital-admission-diagnostic',coronary='F:/VisibleMedicine/staging/20261022-coronary-loader-diagnostic';
const unique=(text,from,to)=>{assert.equal(text.split(from).length,2,'Unique complete-source inverse: '+from.slice(0,65));return text.replace(from,to);};
const specs=[
 ['atlas-cranial-bone-quiz.test.ts',cranial+'/atlas-cranial-bone-quiz.test.ts.raw',cranial+'/atlas-cranial-bone-quiz.test.ts.proposed','74aec9f0f2c65b808ecd01e0cf3594be5878b9df89ae21c3a71f78c3c5ea6885',[
  ['pin.runtimeSources[region]','currentSource'],
 ]],
 ['atlas-cubital-venous-ultrasound.test.ts',cranial+'/atlas-cubital-venous-ultrasound.test.ts.raw',cranial+'/atlas-cubital-venous-ultrasound.test.ts.proposed','9f5ad34cc941b068f0beb83723c22ebb0f8a7d0348999bf62d3b199ba279b648',[
  ['import {currentAtlasDeliveryRoot,CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery}', 'import {currentAtlasDeliveryRoot,CURRENT_ATLAS_REVISION}'],
  [' const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,source);\n',''],
  ['manifest.sourceCommit,pin.runtimeSources[name],name','manifest.sourceCommit,source,name'],
 ]],
 ['atlas-coronary-arterial-study-checks.mjs',coronary+'/atlas-coronary-arterial-study-checks.raw.mjs',coronary+'/atlas-coronary-arterial-study-checks.proposed.mjs','dc0238df4a4f4d855b7ab300e28391b32bf28a2a88e72369b7bc158818792fe9',[
  ['import { currentAtlasDeliveryRoot, validateCurrentAtlasDelivery }','import { currentAtlasDeliveryRoot }'],
  ['const runtimeSources = validateCurrentAtlasDelivery().runtimeSources;\n',''],
  ['manifest.sourceCommit, runtimeSources[name], name','manifest.sourceCommit, revision, name'],
 ]],
 ['atlas-coronary-venous-context-checks.mjs',coronary+'/atlas-coronary-venous-context-checks.raw.mjs',coronary+'/atlas-coronary-venous-context-checks.proposed.mjs','529b81c53c28cfb5c9407c3be54c7da8720b1e498e87bb52c60f6177dab2123c',[
  ['import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery}','import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot}'],
  ['const runtimeSources = validateCurrentAtlasDelivery().runtimeSources;\n',''],
  ['manifest.sourceCommit, runtimeSources[name], name','manifest.sourceCommit, deliveryRevision, name'],
 ]],
];
const inverses=[];
for(const[name,beforePath,proposal,expected,edits]of specs){
 const before=read(beforePath),after=read(proposal);assert.equal(sha(after),expected);assert.deepEqual(read(website+'/tests/'+name),before,'Frozen input '+name);
 const newline=after.includes(Buffer.from('\r\n'))?'\r\n':'\n';
 let inverse=after.toString();for(const[from,to]of edits)inverse=unique(inverse,from.replaceAll('\n',newline),to.replaceAll('\n',newline));assert.equal(inverse,before.toString(),'Complete original assertions '+name);
 inverses.push({path:'tests/'+name,beforePath,beforeSha256:sha(before),proposal,proposalSha256:expected,wholeSourceInverse:true,nativeRootRerun:false});
}
const cssRoot='F:/VisibleMedicine/staging/20261022-css-notice-admission-proposal',cssProof=json(cssRoot+'/SOURCE_PROOF.json');
assert.equal(cssProof.inverseRows.length,2);assert.equal(cssProof.families.length,4);assert(cssProof.cssExactPrefixAndAppend&&cssProof.protectedViewerCompleteHistoricalDependencyTailRetained);
for(const row of cssProof.inverseRows)inverses.push({path:row.path,beforePath:cssRoot+'/before/'+row.path.slice(6)+'.raw',beforeSha256:row.originalSha256,proposal:cssRoot+'/'+row.path,proposalSha256:row.proposedSha256,wholeSourceInverse:row.completeOriginalInverse,nativeRootRerun:false});
for(const row of inverses){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(website+'/'+row.path)),row.beforeSha256);}
const arterialProof='F:/VisibleMedicine/staging/20261022-arterial-history-main-proof/RESULT.json',arterial=json(arterialProof);assert(arterial.exactEntireHarnessInverse&&arterial.allFourExpectedOutcomes);assert.equal(sha(read(arterial.proposal)),arterial.proposalSha256);
inverses.push({path:'tests/arterial-history-preservation.test.mjs',beforePath:website+'/tests/arterial-history-preservation.test.mjs',beforeSha256:arterial.originalHarnessSha256,proposal:arterial.proposal,proposalSha256:arterial.proposalSha256,wholeSourceInverse:true,nativeRootRerun:false,pureFourExpectedOutcomes:true});
const corruptPatch=coronary+'/coronary-runtime-epochs.patch';assert.equal(sha(read(corruptPatch)),'2407f4bc602e526e06c9f7545eb158361d166ddd49242ce239ae08ea8dd5fcc8');
const backupPath='F:/VisibleMedicine/recovery/checkpoints/20261022-coherent-regression-proposal-backup/github-backup.json',backup=json(backupPath);assert(backup.sourceBackupVerified&&backup.strictIntegrity);assert.equal(backup.restoredPaths,2756);
const sourceAudit='F:/VisibleMedicine/staging/20261022-cerebellar-link-source-audit/RESULT.json',audit=json(sourceAudit);assert.equal(audit.sourceGeometryChanged,false);assert.equal(audit.imageConcepts.length,3);
const receipt={at:new Date().toISOString(),website,source:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',review:'4db82d92f6de502a342396d290380253aff46ef754b23e6161672d40c9abce99',repairs:inverses,additionalFiles:[{path:'tests/fixtures/drawable-space-css-append.css.raw',from:cssRoot+'/tests/fixtures/drawable-space-css-append.css.raw',sha256:'36d9b0ef6c2786e3752508ee721361be88585db0ca574c8f9734c356469c6404'}],fullOriginalAssertionsPreserved:true,cssAndNoticesSourceProof:cssRoot+'/SOURCE_PROOF.json',cssAndNoticesSourceProofSha256:sha(read(cssRoot+'/SOURCE_PROOF.json')),initialCoronaryPatchRefusal:{path:corruptPatch,sha256:sha(read(corruptPatch)),applied:false,cause:'Read-only git apply --check refused corrupt line26; complete-file V2 proposals reviewed instead'},sourceBackup:{receipt:backupPath,head:backup.head,tree:backup.tree,restoredSelectedPaths:2756,includesOnlyEarlierArterialProposalAndListedHelpers:true,includesWholeLaterSevenFileBatch:false,wholePrivateRunnableBackup:false},cerebellarLinkAudit:{receipt:sourceAudit,sha256:sha(read(sourceAudit)),decision:audit.decision},canonicalInstalled:false,frozenCandidateEdited:false,nativeRootsRerun:false,fullRegressionStillActive:true,wholeSuitePassing:false,clinicalApproval:false,publicDeployment:false,next:'Keep the full1143-entry run frozen until authoritative terminal. Preserve all its failures, then adopt the seven complete proposals and exact CSS fixture into a new controlled candidate with byte-exact preimages/full inverses; run actual affected native roots and current-delivery refusals once with heavy slot free. No proof/source-only metadata substitutes for native, browser, clinical or full-regression acceptance. Further observed failures remain to classify.'};
mkdirSync(root);writeFileSync(root+'/QUEUE.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.pendingRegressionRepairQueue={receipt:root+'/QUEUE.json',sha256:sha(read(root+'/QUEUE.json')),proposedFiles:7,wholeSourceInversesVerified:7,nativeRootsRerun:false,canonicalInstalled:false,frozenCandidateEdited:false,sourceBackup:receipt.sourceBackup,next:receipt.next};
pointer.activeWork.cerebellarLinkSourceAudit=receipt.cerebellarLinkAudit;
pointer.activeWork.pendingArterialPreservationRepair.latestFilteredGitHubBackupIncludesThisProposal=true;pointer.activeWork.pendingArterialPreservationRepair.sourceBackupReceipt=backupPath;
pointer.activeWork.updated=receipt.at;writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({receipt:root+'/QUEUE.json',sha256:sha(read(root+'/QUEUE.json')),wholeSourceInverses:7,cssAndNoticesActualSourceProof:true,nativeRootsRerun:false,backupHead:backup.head,wholeLaterBatchBackedUp:false,frozenCandidateEdited:false}));
