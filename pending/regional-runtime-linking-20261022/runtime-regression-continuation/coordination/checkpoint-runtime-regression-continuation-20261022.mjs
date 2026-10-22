import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-remaining-runtime-admissions',sourcePath=stage+'/APPLIED_SOURCE.json',source=json(sourcePath);
const backupPath='F:/VisibleMedicine/recovery/checkpoints/20261022-runtime-regression-continuation-source-backup/github-backup.json',backup=json(backupPath);
assert(backup.sourceBackupVerified&&backup.strictIntegrity&&!backup.privateDataBackup);
const paths={combined:'F:/VisibleMedicine/staging/20261022-loading-followup-sources/native-combined/TERMINAL.json',
 consumerRetry:'F:/VisibleMedicine/staging/20261022-closed56-followup-consumers/native-current/TERMINAL.json',
 admissions:stage+'/native-current/TERMINAL.json',types:stage+'/types-current/TERMINAL.json'};
const checks=Object.fromEntries(Object.entries(paths).map(([key,path])=>[key,{path,sha256:sha(read(path)),result:json(path)}]));
assert.equal(checks.combined.result.counts.fail,2);
for(const name of ['consumerRetry','admissions','types']){assert.equal(checks[name].result.code,0);assert.deepEqual(checks[name].result.sourceDrift,[]);}
assert.equal(checks.types.result.sourceReceiptSha256,sha(read(sourcePath)));
const built=json('F:/VisibleMedicine/staging/20261022-review-loading-bound-successor/BUILT_SOURCE.json');
const product=rows=>rows.filter(row=>!row.path.startsWith('tests/')).sort((a,b)=>a.path.localeCompare(b.path));
assert.deepEqual(product(source.sourceRows),product(built.sourceRows));
const initial=json('F:/VisibleMedicine/staging/20261022-review-loading-bound-successor/TEST_READY_SOURCE.json');
const previousRows=new Map(initial.sourceRows.map(row=>[row.path,row.sha256]));
const changedTestPaths=source.sourceRows.filter(row=>previousRows.get(row.path)!==row.sha256).map(row=>row.path);
assert.equal(changedTestPaths.length,24);assert(changedTestPaths.every(path=>path.startsWith('tests/')));
for(const [repo,commit] of [['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1']])assert.equal(runGit(['-C',repo,'rev-parse','HEAD']).toString().trim(),commit);
const pointer=json('CURRENT_CHECKPOINT.json'),current=pointer.activeWork.current;
assert.equal(current.ownerPreviewPolicy.websiteCutoverPermitted,false);
const remaining=[
 {marker:234,path:'tests/limb-suprahyoid-role-preservation-20261021.test.mjs'},
 {marker:252,path:'tests/orbital-inbox-admission-history.test.mjs'},
 {marker:258,path:'tests/plexus-dependency-rebind.test.mjs'},
 {marker:266,path:'tests/radial-eus-current-transition.test.mjs'},
 {marker:303,path:'tests/studio-lineage-integration.test.mjs'},
 {marker:306,path:'tests/tour-discovery-current-delivery.test.mjs'},
 {marker:329,path:'tests/venous-urinary-role-preservation-20261021.test.mjs'},
];
for(const row of remaining)assert(source.sourceRows.some(file=>file.path===row.path));
const next='Keep the owner preview unchanged. Continue the seven named original V6 failures with exact current/historical source composition, plus any newly discovered consumers; preserve65/63/2 and corrected8/8 results, new admission/type evidence and all full71/eight requirements. Run only affected checks with one heavy process, then wider applicable regression scope. No whole-suite, clinical, privacy, spatial or release completion is claimed.';
const result={at:new Date().toISOString(),goalTurnClassification:'progress',milestone:'24 exact test/helper source updates coherently integrated in isolation; original combined65/63/2 failures repaired and8/8 retested; four remaining runtime admissions and changed complete-source consumer verified; full types pass. Product graph remains the genuinely rebuilt loading-bound candidate.',
 installed:{website:'b953ff3f5f1891599cb6e91cb91311d9d6006270',atlas:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',review:'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59'},
 sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),sourcePaths:source.sourcePaths,isolatedReview:source.review,boundInputs:1724,importedSources:1558,
 overlaidTestHelperPaths:24,changedTestPaths,nonTestProductBytesChanged:0,previousProductBuildStillExact:true,checks,
 remainingOriginalV6Failures:remaining,originalV6Regression:'F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/native-terminal-followups-v6/TERMINAL.json',
 firstSourceOnlyProposalsRetainedLocally:true,rejectedNativeSourceRootOverrideRemoved:true,bothOriginalCtLearnerEmissionsPreserved:true,
 sourceBackup:{receipt:backupPath,receiptSha256:sha(read(backupPath)),head:backup.head,tree:backup.tree,sourcePaths:backup.sourcePaths,restoredPaths:backup.restoredPaths,independentlyVerified:true,wholePrivateOrRunnableBackup:false},
 ownerPreviewPolicy:current.ownerPreviewPolicy,ownerPreviewChanged:false,canonicalInstalled:false,pendingWorkers:[],
 full71AndEightIdeasPreserved:true,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,next};
const directory='F:/VisibleMedicine/recovery/checkpoints/20261022-runtime-regression-continuation-verified';assert(!fs.existsSync(directory));fs.mkdirSync(directory);
fs.copyFileSync('CURRENT_CHECKPOINT.json',directory+'/pointer.before.json');fs.copyFileSync('WORKSPACE_MAP.md',directory+'/WORKSPACE_MAP.before.md');
fs.writeFileSync(directory+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
Object.assign(current,{at:result.at,checkpoint:directory+'/checkpoint.json',checkpointSha256:sha(read(directory+'/checkpoint.json')),
 sourceReceipt:sourcePath,sourceReceiptSha256:result.sourceReceiptSha256,sourcePaths:source.sourcePaths,
 sourceBackup:result.sourceBackup,proposalCodeSourceBackedUp:true,pendingWorkers:[],pendingSourceProposals:[],
 verification:checks,remainingOriginalV6Failures:remaining,beforeFurtherWork:next,next});
current.bindingRepair.typesPassed=true;current.bindingRepair.websiteBuildRun=true;
current.bindingRepair.nativeAcceptanceScope='Seven original loading checks; combined65/63/2, exact8/8 repair retry and separate runtime-admission results. Not whole-suite acceptance.';
pointer.activeWork.updated=result.at;fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({checkpoint:directory+'/checkpoint.json',sha256:sha(read(directory+'/checkpoint.json')),sourceBackup:result.sourceBackup,remainingOriginalFailures:remaining.length,ownerPreviewChanged:false}));
