import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const base='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const sourcePath=base+'/PRODUCT_SOURCE_V5.json',source=json(sourcePath),v3=json(base+'/PRODUCT_SOURCE_V3.json');
assert.equal(sha(read(sourcePath)),'49a132ab76102e0fb2845df9ab111047630ecdafc0f0a2e61e81fef70a62a03f');
const evidence={head:base+'/native-head-guard/TERMINAL.json',cranio:base+'/native-craniofacial-current/TERMINAL.json',types:base+'/quality-types-v5/TERMINAL.json'};
for(const file of Object.values(evidence)){const result=json(file);assert.equal(result.code,0);assert.deepEqual(result.sourceDrift,[]);}
assert.deepEqual(source.sourceRows.filter(row=>!row.path.startsWith('tests/')),v3.sourceRows.filter(row=>!row.path.startsWith('tests/')));
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256);
const browser=base+'/browser-runtime-qa/FINAL_BROWSER_RESULT.json',escape=base+'/browser-runtime-qa/ESCAPE_RESULT.json';
const b=json(browser),e=json(escape);
assert(b.wrongRevisionVisible404&&b.checks.modelReady&&b.checks.selectedAclVisible&&b.checks.restoreVisible);
assert(e.escapeFromInsideIframeRestoredHost&&e.selectedAclRetained);assert.equal(e.iframeCount,1);
const backupPath='F:/VisibleMedicine/recovery/checkpoints/20261022-head-cranio-controls-source-backup/github-backup.json',backup=json(backupPath);
assert(backup.sourceBackupVerified&&backup.strictIntegrity);assert.equal(backup.privateDataBackup,false);
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');
assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
const root='F:/VisibleMedicine/recovery/checkpoints/20261022-head-cranio-controls-verified';assert(!fs.existsSync(root));fs.mkdirSync(root,{recursive:true});
fs.copyFileSync('CURRENT_CHECKPOINT.json',root+'/pointer.before.json');fs.copyFileSync('WORKSPACE_MAP.md',root+'/WORKSPACE_MAP.before.md');
const result={at:new Date().toISOString(),previousGoalTurnClassification:'progress',milestone:'Head-review real-guard harness and craniofacial source/history checks verified; specimen runtime URL checked in real browser',
 sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),sourcePaths:6042,productionBytesChangedSince404VerifiedProduct:0,
 checks:Object.fromEntries(Object.entries(evidence).map(([key,path])=>[key,{path,sha256:sha(read(path)),result:json(path)}])),
 buildReuse:{receipt:base+'/quality-build-v3/TERMINAL.json',sha256:sha(read(base+'/quality-build-v3/TERMINAL.json')),allNonTestInputsByteIdentical:true},
 browser:{receipt:browser,sha256:sha(read(browser)),escape,escapeSha256:sha(read(escape)),screenshot:base+'/browser-runtime-qa/lower-limb-restored.png',
  screenshotSha256:sha(read(base+'/browser-runtime-qa/lower-limb-restored.png')),fullMriScanWorkflowTested:false,allWritesDenied:true,ownerCookiesChanged:false,
  ownedQaTabClosed:true,ownedProxyAndCandidateStopped:true,productionNodeStartUnsupportedCloudflareScheme:true,developmentPublicAssetWarningsObserved:true},
 sourceBackup:{receipt:backupPath,receiptSha256:sha(read(backupPath)),head:backup.head,tree:backup.tree,sourcePaths:backup.sourcePaths,restoredPaths:backup.restoredPaths,
  independentlyVerified:true,wholePrivateOrRunnableBackup:false},
 canonicalInstalled:false,ownerPreviewChanged:false,ownerFormsRefreshed:false,clinicalApproval:false,patientRegistration:false,privateUpload:false,publicDeployment:false,
 full71AndEightIdeasPreserved:true,fullOriginal5860RunAnd280FailuresRetained:true,all161AffectedNativeRootsRerun:false,
 next:'Continue remaining native source/history assurance and source-bound teaching/UI priorities. Before a coherent local switch, obtain fresh owner saved-draft clearance; do not stall independent safe work. Diagnose the remaining head compact-review binder and live-learning harness preservation roots without dropping original history/refusals. Preserve specialist masks, independent entitlements and desktopPACS boundaries.',
};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');
pointer.activeWork.pendingReviewControlsAssurance={...result,checkpoint:root+'/checkpoint.json',checkpointSha256:sha(read(root+'/checkpoint.json'))};
pointer.activeWork.pendingCraniofacialCurrentFollowup.phase='native-passed-47-of-47';
pointer.activeWork.pendingCraniofacialCurrentFollowup.checkpoint=root+'/checkpoint.json';
pointer.activeWork.pendingRegressionRepairQueue.latestVerifiedSourceBackup=result.sourceBackup;
pointer.activeWork.updated=result.at;
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),head:json(evidence.head).counts,cranio:json(evidence.cranio).counts,sourceBackup:result.sourceBackup,canonicalInstalled:false}));
