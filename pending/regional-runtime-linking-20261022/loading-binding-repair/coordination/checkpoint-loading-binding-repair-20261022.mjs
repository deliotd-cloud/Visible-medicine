import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-review-loading-bound-successor';
const sourcePath=root+'/TEST_READY_SOURCE.json',source=json(sourcePath);
const terminalPath=root+'/native-loading-binding/TERMINAL.json',terminal=json(terminalPath);
assert.equal(terminal.code,0);assert.equal(terminal.counts.pass,7);assert.equal(terminal.counts.fail,0);assert.deepEqual(terminal.sourceDrift,[]);
assert.equal(terminal.sourceReceiptSha256,sha(read(sourcePath)));
const prior='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/native-terminal-followups-v6/TERMINAL.json';
assert.equal(json(prior).counts.fail,29);assert.deepEqual(json(prior).sourceDrift,[]);
const backupPath='F:/VisibleMedicine/recovery/checkpoints/20261022-loading-binding-repair-source-backup/github-backup.json',backup=json(backupPath);
assert(backup.sourceBackupVerified&&backup.strictIntegrity&&!backup.privateDataBackup);
for(const [directory,commit] of [['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1']])
 assert.equal(runGit(['-C',directory,'rev-parse','HEAD']).toString().trim(),commit);
const pointer=json('CURRENT_CHECKPOINT.json'),current=pointer.activeWork.current;
assert.equal(current.ownerPreviewPolicy.websiteCutoverPermitted,false);
const stages=['median-cubital-runtime-source-closure','spinal-current-colic-semantic-followup','native-focus-current-source-followups',
 'lacrimal-closed50-composition','closed-epoch-preservation','vocal-runtime-epoch','historical-schema-refusals'];
const pending=[];
for(const name of stages){
 const stage='F:/VisibleMedicine/staging/20261022-'+name,walk=(dir,prefix='')=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name,prefix+e.name+'/'):[prefix+e.name]);
 for(const relative of walk(stage+'/CODE')){
  assert(relative.startsWith('tests/')&&/\.(?:mjs|ts)$/.test(relative));
  const before=[stage+'/RAW/'+relative,stage+'/RAW/'+relative+'.raw'].find(fs.existsSync);
  if(before)assert.deepEqual(read(before),read('F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website/'+relative));
  pending.push({path:relative,proposal:stage+'/CODE/'+relative,sha256:sha(read(stage+'/CODE/'+relative)),before:before??null,
   beforeSha256:before?sha(read(before)):null,sourceOnlyMainReviewed:true,nativeAcceptedForNew525Binding:false});
 }
}
assert.equal(new Set(pending.map(row=>row.path)).size,pending.length);assert.equal(pending.length,13);
const next='Keep the normal preview held unchanged. The isolated real loading-source rebind, production viewer, types/build and seven focused native checks now pass. Preserve frozen V6 329/300/29 failures and initial type/capture diagnostics. Next compose the13 named unapplied test/helper sources with exact new525/1724 current-role changes (not historical aliases), diagnose remaining original failures, then run affected native checks serially. Keep the full71/eight roadmap, clinical draft and private/specialist boundaries.';
const checkpoint={at:new Date().toISOString(),goalTurnClassification:'progress',
 milestone:'Genuine missing loading-route binding repaired and rebuilt in isolation; original failing producer/history check and six companion checks pass; source-only followups staged and verified source backup retained.',
 installed:{website:'b953ff3f5f1891599cb6e91cb91311d9d6006270',atlas:source.source,review:'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59'},
 sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),sourcePaths:source.sourcePaths,isolatedReview:source.review,boundInputs:1724,importedSources:1558,
 actualBinderIdempotence:true,fullTypesAndWebsiteBuildPassed:true,focusedNativeTerminal:terminalPath,focusedNativeTerminalSha256:sha(read(terminalPath)),focusedNativeCounts:terminal.counts,
 previousRegressionTerminal:prior,previousRegressionCounts:json(prior).counts,pendingSourceProposals:pending,
 firstTypeFailure:root+'/quality/types.TERMINAL.json',firstCaptureOverlappedOneTestEdit:true,originalTestRecoveredExactlyFromFrozenV6:true,
 typeRepair:json(root+'/type-source-repair/EVIDENCE.json'),
 sourceBackup:{receipt:backupPath,receiptSha256:sha(read(backupPath)),head:backup.head,tree:backup.tree,sourcePaths:backup.sourcePaths,restoredPaths:backup.restoredPaths,independentlyVerified:true,wholePrivateOrRunnableBackup:false},
 ownerPreviewPolicy:current.ownerPreviewPolicy,ownerPreviewChanged:false,ownerFormsRefreshed:false,canonicalInstalled:false,wholeSuitePassing:false,
 full71AndEightIdeasPreserved:true,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,next};
const directory='F:/VisibleMedicine/recovery/checkpoints/20261022-loading-binding-repair-verified';assert(!fs.existsSync(directory));fs.mkdirSync(directory);
fs.copyFileSync('CURRENT_CHECKPOINT.json',directory+'/pointer.before.json');fs.copyFileSync('WORKSPACE_MAP.md',directory+'/WORKSPACE_MAP.before.md');
fs.writeFileSync(directory+'/checkpoint.json',JSON.stringify(checkpoint,null,2)+'\n',{flag:'wx'});
Object.assign(current,{at:checkpoint.at,checkpoint:directory+'/checkpoint.json',checkpointSha256:sha(read(directory+'/checkpoint.json')),
 currentCandidate:source.website,sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),sourcePaths:source.sourcePaths,
 sourceBackup:checkpoint.sourceBackup,pendingSourceProposals:pending,pendingWorkers:[],beforeFurtherWork:next,next,
 proposalCodeSourceBackedUp:true,bindingRepair:{...current.bindingRepair,phase:'verified-isolated-not-installed',pid:null,heavyJobRunning:false,
  sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),focusedNativeCounts:terminal.counts,fullTypesAndBuildPassed:true,canonicalInstalled:false}});
pointer.activeWork.updated=checkpoint.at;fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({checkpoint:directory+'/checkpoint.json',sha256:sha(read(directory+'/checkpoint.json')),sourceBackup:checkpoint.sourceBackup,pendingSourcePaths:pending.length,ownerPreviewChanged:false}));
