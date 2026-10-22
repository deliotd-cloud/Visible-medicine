import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const pointer=json('CURRENT_CHECKPOINT.json'),current=pointer.activeWork.current,source=json(current.sourceReceipt);
assert.equal(sha(read(current.sourceReceipt)),current.sourceReceiptSha256);
const backupPath='F:/VisibleMedicine/recovery/checkpoints/20261022-seven-closures-source-backup/github-backup.json',backup=json(backupPath);
assert(backup.sourceBackupVerified&&backup.strictIntegrity&&!backup.privateDataBackup);
const checkPaths={initialSeven:'F:/VisibleMedicine/staging/20261022-seven-final-source-closures/native-current/TERMINAL.json',
 loadingAndTour:'F:/VisibleMedicine/staging/20261022-loading-count-and-tour-closure/native-current/TERMINAL.json',
 historyRetry:'F:/VisibleMedicine/staging/20261022-final-loading-history-closures/native-current/TERMINAL.json',
 types:'F:/VisibleMedicine/staging/20261022-final-closure-verification/types-current/TERMINAL.json'};
const checks=Object.fromEntries(Object.entries(checkPaths).map(([name,path])=>[name,{path,sha256:sha(read(path)),result:json(path)}]));
for(const key of ['historyRetry','types']){assert.equal(checks[key].result.code,0);assert.deepEqual(checks[key].result.sourceDrift,[]);assert.equal(checks[key].result.sourceReceiptSha256,current.sourceReceiptSha256);}
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
for(const [repo,head] of [['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1']])assert.equal(runGit(['-C',repo,'rev-parse','HEAD']).toString().trim(),head);
assert.equal(current.ownerPreviewPolicy.websiteCutoverPermitted,false);
const selectedStage='F:/VisibleMedicine/staging/20261022-final-closure-verification',selectedResult=selectedStage+'/native-selected/TERMINAL.json';
const wider=fs.existsSync(selectedResult)?{terminal:true,path:selectedResult,sha256:sha(read(selectedResult)),result:json(selectedResult)}:{terminal:false,run:current.nativeRun};
const next='Keep the normal preview unchanged. Inspect actual selected native terminal and diagnose any failures without suppressing historical assertions. Preserve all71/eight roadmap scope, exact review/source roles, independent access, specialist masks and desktop PACS boundary; advance useful local work without clinical-signoff stall.';
const result={at:new Date().toISOString(),goalTurnClassification:'progress',milestone:'Seven original targeted failures repaired, exact later loading-bound test roles composed and verified with complete preimages/inverses. Product bytes and the owner preview remain unchanged.',
 sourceReceipt:current.sourceReceipt,sourceReceiptSha256:current.sourceReceiptSha256,sourcePaths:source.sourcePaths,isolatedReview:source.review,checks,wider,
 sourceBackup:{receipt:backupPath,receiptSha256:sha(read(backupPath)),head:backup.head,tree:backup.tree,sourcePaths:backup.sourcePaths,restoredPaths:backup.restoredPaths,independentlyVerified:true,wholePrivateOrRunnableBackup:false},
 installed:{website:'b953ff3f5f1891599cb6e91cb91311d9d6006270',atlas:current.installedAtlas,review:current.installedReview},
 ownerPreviewChanged:false,canonicalInstalled:false,pendingWorkers:[],nonTestProductBytesChanged:0,currentValidatorOrPinChanged:false,
 full71AndEightIdeasPreserved:true,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,next};
const directory='F:/VisibleMedicine/recovery/checkpoints/20261022-seven-closures-verified';assert(!fs.existsSync(directory));fs.mkdirSync(directory);
fs.copyFileSync('CURRENT_CHECKPOINT.json',directory+'/pointer.before.json');fs.copyFileSync('WORKSPACE_MAP.md',directory+'/WORKSPACE_MAP.before.md');
fs.writeFileSync(directory+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
Object.assign(current,{at:result.at,checkpoint:directory+'/checkpoint.json',checkpointSha256:sha(read(directory+'/checkpoint.json')),sourceBackup:result.sourceBackup,
 proposalCodeSourceBackedUp:true,pendingWorkers:[],pendingSourceProposals:[],verification:checks,selectedWiderVerification:wider,next,beforeFurtherWork:next,
 sevenOriginalTargetedRepairsVerified:true,wholeSuitePassing:false});
pointer.activeWork.updated=result.at;fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({checkpoint:directory+'/checkpoint.json',sha256:sha(read(directory+'/checkpoint.json')),widerTerminal:wider.terminal,sourceBackup:result.sourceBackup,ownerPreviewChanged:false}));
