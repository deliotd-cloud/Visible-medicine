import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {backup,read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const site='F:/VisibleMedicine/website',atlas='F:/VisibleMedicine/atlas';
const stage='F:/VisibleMedicine/staging/20261021-admission485-final-application';
const proposal='F:/VisibleMedicine/staging/20261021-admission485-main-portable-proposal';
const root='F:/VisibleMedicine/recovery/checkpoints/20261021-admission485-roles-verified';
const previous='F:/VisibleMedicine/recovery/checkpoints/20261021-current-head-index-roles-and-thorax-qa';
const application=json(stage+'/APPLICATION.json'),old=json(previous+'/checkpoint.json');
const rows=json(application.sourceSnapshot),preserved=json(application.preservedSnapshot),native=application.native;
assert.equal(application.canonicalSourceInstalled,true);assert.equal(application.changedPaths.length,6);
assert.equal(native.code,0);assert.deepEqual(native.counts,{tests:88,pass:88,fail:0,cancelled:0,skipped:0,todo:0});
assert.deepEqual(native.failures,[]);assert.equal(sha(read(native.log)),native.logSha256);
const verify=()=>{
 assert.equal(rows.length,5178);assert.equal(preserved.length,7);
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
 assert.equal(now.revision,112);assert.deepEqual(now.items,before.items);assert.deepEqual(now.baseline,before.baseline);
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
copy(proposal+'/PROPOSAL.json','proposal/main-portable-PROPOSAL.json');
copy('F:/VisibleMedicine/staging/20261021-admission485-role-followup/PROPOSAL.json','proposal/original-worker-PROPOSAL.json');
copy(stage+'/APPLICATION.json','evidence/APPLICATION.json');copy(stage+'/native.json','evidence/native.json');
for(const p of ['admit-closed56-role-repair-20261021.mjs','checkpoint-admission485-roles-20261021.mjs','admission485-final-admission-20261021.json','emit-inflight-patch.mjs','route-regressions-after88-20261021.mjs'])copy(p,'controls/'+p);
copy('F:/VisibleMedicine/staging/20261021-regression-routing-after88/ROUTING.json','evidence/ROUTING.json');
const proof={
 at:new Date().toISOString(),source:application.source,review:application.review,canonicalInstalled:true,
 installation:old.installation,currentNamedInputs:5185,controlledSourceInputs:5178,preservedSourcePaths:old.preservedSourcePaths,
 sourceSnapshot:application.sourceSnapshot,sourceSnapshotSha256:application.sourceSnapshotSha256,
 preservedSnapshot:application.preservedSnapshot,preservedSnapshotSha256:sha(read(application.preservedSnapshot)),
 reviewInputs:1710,canonicalDeveloperToolingInstalled:true,installedTestOnlyPaths:6,existingEditedTestPaths:2,
 mainPortableRootCorrection:true,wholeOriginalAndRoleInverseMutationProofsPassed:true,
 actualTwelveRootNativeCounts:native.counts,actualTwelveRootNativeCode:native.code,currentNativeFailures:[],
 routing:{file:'evidence/ROUTING.json',sha256:sha(read('F:/VisibleMedicine/staging/20261021-regression-routing-after88/ROUTING.json')),originalRows:87,notExercised:79,rootPassedTitleNotComparable:2,laterScopedExactTitlePass:6},
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
assert(parent.sourceBackupVerified);assert.equal(parent.head,'a9e7c368d5ed5b59f5f592da2a9b2329dfcd8327');
const values=new Map(json(parentRoot+'/remote-source-restored/.source-backup/manifest.json').files.map(r=>{
 const b=read(parentRoot+'/remote-source-restored/'+r.path);assert.equal(sha(b),r.sha256);return[r.path,b];
}));
for(const r of selected)values.set('evidence/20261021-admission485-roles-verified/'+r.path,read(root+'/'+r.path));
const remote=backup({root:root+'-backup',repo:'F:/VisibleMedicine/history/website-work/github-admission485-roles-20261021.git',branch:'backup/admission485-roles-20261021',
 files:[...values].map(([path,b])=>({path,bytes:b.length,sha256:sha(b)})).sort((a,b)=>a.path.localeCompare(b.path)),bytesFor:p=>values.get(p),verifySource:verify,
 sourceIdentity:{atlas:application.source,review:application.review,canonicalNamedInputs:5185,canonicalInstalled:true,reviewCopyPreviewBuildPending:true},
 parent:parent.head,parentTree:parent.tree,parentRepo:parentRoot+'/independent-readback.git',proof,
 scope:'Six exact test/raw-witness paths, two original preimages, worker/main proposal provenance, compact actual88/88 native receipts,87-row regression routing and guarded controls. Prior filtered source ancestry only. No scans, masks, private reports/coordinates/identifiers/notes/decisions/env, dependencies, model assets, raw TAP/browser DOM/media or raw canonical ancestry. Partial source recovery, not whole/private/runnable backup or whole-suite/clinical/spatial/public-release approval.'});
const checkpoint={...proof,site,selectedFiles:selected,nativeResult:stage+'/native.json',nativeResultSha256:sha(read(stage+'/native.json')),
 backup:{receipt:root+'-backup/github-backup.json',receiptSha256:sha(read(root+'-backup/github-backup.json')),head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths},
 next:'Main-review the coupled head-disclosure/craniofacial/tour proposal including authentic whole-source witnesses, current bindings and stock-verifier refusal checks. Admit coherent exact paths and execute affected real roots once. Preserve full failure inventory; continue independent useful website work without clinical-review stall. Pending inbox copy awaits a coherent isolated preview; owner forms/private source stay untouched.'};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(checkpoint,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),selected:selected.length,head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}));
