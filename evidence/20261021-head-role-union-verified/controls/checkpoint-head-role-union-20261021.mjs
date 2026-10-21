import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {backup,read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const site='F:/VisibleMedicine/website',atlas='F:/VisibleMedicine/atlas';
const stage='F:/VisibleMedicine/staging/20261021-head-role-union-application';
const proposal='F:/VisibleMedicine/staging/20261021-head-role-union-proposal';
const root='F:/VisibleMedicine/recovery/checkpoints/20261021-head-role-union-verified';
const previous='F:/VisibleMedicine/recovery/checkpoints/20261021-admission485-roles-verified';
const application=json(stage+'/APPLICATION.json'),old=json(previous+'/checkpoint.json');
const rows=json(application.sourceSnapshot),preserved=json(application.preservedSnapshot),native=application.native;
assert.equal(application.canonicalSourceInstalled,true);assert.equal(application.changedPaths.length,10);
assert.equal(native.code,0);assert.deepEqual(native.counts,{tests:52,pass:52,fail:0,cancelled:0,skipped:0,todo:0});
assert.deepEqual(native.failures,[]);assert.equal(sha(read(native.log)),native.logSha256);
const verify=()=>{
 assert.equal(rows.length,5185);assert.equal(preserved.length,7);
 assert.equal(sha(read(application.sourceSnapshot)),application.sourceSnapshotSha256);
 for(const r of [...rows,...preserved])assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),application.source);
 assert.equal(runGit(['-C',atlas,'status','--porcelain=v1']).toString().trim(),'');
 assert.equal(runGit(['-C',site,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 const bound=json(site+'/atlas-review/integration-inputs.json');assert.equal(bound.sha256,application.review);assert.equal(bound.inputs.length,1710);
 for(const r of bound.inputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 const sources=json(site+'/atlas-review/manifest.json').files;assert.equal(sources.length,1553);
 for(const r of sources)assert.equal(sha(read(atlas+'/'+r.path)),r.sourceSha256,r.path);
 const before=json(previous+'/coordination-after/completion-checklist.json'),now=json(site+'/docs/completion-checklist.json');
 assert.equal(now.revision,113);assert.deepEqual(now.items,before.items);assert.deepEqual(now.baseline,before.baseline);
 for(const r of json('F:/VisibleMedicine/recovery/local-cutover/20261021-source190-prepared/PRIVATE_GUARDS_AT_CUTOVER.json'))assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 process.kill(266712,0);
};
verify();assert(!fs.existsSync(root));fs.mkdirSync(root);
const selected=[];
function copy(from,p){
 assert(!path.isAbsolute(p)&&!p.includes('..')&&!/[\\\x00-\x1f]/.test(p));
 assert(fs.lstatSync(from).isFile()&&!fs.lstatSync(from).isSymbolicLink());
 const b=read(from);assert(b.length<250000&&!b.includes(0));new TextDecoder('utf-8',{fatal:true}).decode(b);
 const to=root+'/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,b,{flag:'wx'});
 selected.push({path:p,bytes:b.length,sha256:sha(b)});
}
for(const r of application.changedPaths){
 assert.equal(sha(read(site+'/'+r.path)),r.candidateSha256);
 copy(site+'/'+r.path,'installed-website/'+r.path);
 if(r.preimageSha256)copy(stage+'/preimages/'+r.path,'preimages/'+r.path);
}
for(const p of ['PROPOSAL.json','worker-0-PROPOSAL.json','worker-1-PROPOSAL.json'])copy(proposal+'/'+p,'proposal/'+p);
copy(stage+'/APPLICATION.json','evidence/APPLICATION.json');copy(stage+'/native.json','evidence/native.json');
for(const p of ['admit-closed56-role-repair-20261021.mjs','checkpoint-head-role-union-20261021.mjs','head-role-union-admission-20261021.json','prepare-head-role-union-20261021.mjs','verify-tour-camera-current-20261021.mjs','emit-inflight-patch.mjs'])copy(p,'controls/'+p);
copy('F:/VisibleMedicine/staging/20261021-tour-camera-current-verification/RESULT.json','evidence/tour-camera-RESULT.json');
copy('F:/VisibleMedicine/staging/20261021-tour-camera-current-verification/STARTED.json','evidence/tour-camera-STARTED.json');
copy('atlas-narrow-reflow-search-qa-20261021.json','evidence/narrow-reflow-search-QA.json');
const proof={
 at:new Date().toISOString(),source:application.source,review:application.review,canonicalInstalled:true,
 installation:old.installation,currentNamedInputs:5192,controlledSourceInputs:5185,preservedSourcePaths:old.preservedSourcePaths,
 sourceSnapshot:application.sourceSnapshot,sourceSnapshotSha256:application.sourceSnapshotSha256,
 preservedSnapshot:application.preservedSnapshot,preservedSnapshotSha256:sha(read(application.preservedSnapshot)),
 reviewInputs:1710,canonicalDeveloperToolingInstalled:true,installedTestOnlyPaths:10,existingEditedTestPaths:3,
 coupledDirectReaderAdmission:true,authenticWholeHistoricalDeliveryPortalCorpusAndUiWitnesses:true,wholeOriginalAndRoleInverseMutationProofsPassed:true,
 actualEightRootNativeCounts:native.counts,actualEightRootNativeCode:native.code,currentNativeFailures:[],
 separateTourCameraNativeCounts:json('F:/VisibleMedicine/staging/20261021-tour-camera-current-verification/RESULT.json').counts,
 separateTourCameraDifferentTestInputSnapshot:true,narrow640ReflowKeyboardSearchAndEscapeVerified:true,true200PercentTextZoomOrFullATClaim:false,
 rawNativeLogExcludedFromBackup:true,currentValidatorAndFixtureUnchanged:true,currentTestNowChecksExact190:true,
 allOtherSourceInputsAndBindingsUnchanged:true,all1553AtlasWorkingSourceBytesExact:true,
 all71ItemsAndEightIdeasUnchanged:true,wholeAuditBaselineUnchanged:true,
 originalFullFailureBaseline:136,originalFullSkips:3,earlierDifferentSourceBaseline:144,subset289_202_87Retained:true,
 allNativeFailuresResolved:false,fullSuitePassingClaim:false,
 ownerPreviewPid:266712,ownerPreviewSession:32652,ownerFormsRefreshed:false,ownerDecisionsChanged:false,
 reviewCopyPreviewBuildPending:true,previewBuildOrRestartRan:false,productSourceChangedByThisRepair:false,
 unresolvedBrowserErrorKinds:1,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,
 privateDataUploaded:false,wholeProjectBackup:false,privateDataBackup:false,fullGoalActive:true
};
fs.writeFileSync(root+'/PROOF.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});copy(root+'/PROOF.json','evidence/PROOF.json');
const parentRoot=previous+'-backup',parent=json(parentRoot+'/github-backup.json');
assert(parent.sourceBackupVerified);assert.equal(parent.head,'74e106e0d1a74f5fa0208826c23b5f917cc61fc6');
const values=new Map(json(parentRoot+'/remote-source-restored/.source-backup/manifest.json').files.map(r=>{
 const b=read(parentRoot+'/remote-source-restored/'+r.path);assert.equal(sha(b),r.sha256);return[r.path,b];
}));
for(const r of selected)values.set('evidence/20261021-head-role-union-verified/'+r.path,read(root+'/'+r.path));
const remote=backup({root:root+'-backup',repo:'F:/VisibleMedicine/history/website-work/github-head-role-union-20261021.git',branch:'backup/head-role-union-20261021',
 files:[...values].map(([path,b])=>({path,bytes:b.length,sha256:sha(b)})).sort((a,b)=>a.path.localeCompare(b.path)),bytesFor:p=>values.get(p),verifySource:verify,
 sourceIdentity:{atlas:application.source,review:application.review,canonicalNamedInputs:5192,canonicalInstalled:true,reviewCopyPreviewBuildPending:true},
 parent:parent.head,parentTree:parent.tree,parentRepo:parentRoot+'/independent-readback.git',proof,
 scope:'Ten exact coupled test/raw-witness paths, three original preimages, both worker/main proposal provenance, actual52/52 native receipts, separate17/17 camera/tour receipt, sanitized narrow-reflow keyboard observations and guarded controls. Prior filtered source ancestry only. No scans, masks, private reports/coordinates/identifiers/notes/decisions/env, dependencies, model assets, raw TAP/browser DOM/media or raw canonical ancestry. Partial source recovery, not whole/private/runnable backup or whole-suite/clinical/spatial/public-release approval.'});
const checkpoint={...proof,site,selectedFiles:selected,nativeResult:stage+'/native.json',nativeResultSha256:sha(read(stage+'/native.json')),
 backup:{receipt:root+'-backup/github-backup.json',receiptSha256:sha(read(root+'-backup/github-backup.json')),head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths},
 next:'Main-review the staged current corpus/UI role follow-up and direct preservation readers, preserving authentic complete historical contracts and independent current190 behavior. Keep genuine136full/87subset/different-source144baselines,52focused/17separate/88prior receipts. Continue safe independent development without clinical-review stall. Pending inbox copy awaits a coherent isolated preview; owner forms/private sources stay untouched.'};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(checkpoint,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),selected:selected.length,head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}));
