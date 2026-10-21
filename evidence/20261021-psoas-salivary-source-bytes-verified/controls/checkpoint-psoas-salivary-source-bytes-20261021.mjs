import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {backup,read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const site='F:/VisibleMedicine/website',atlas='F:/VisibleMedicine/atlas';
const stage='F:/VisibleMedicine/staging/20261021-psoas-salivary-epoch-application';
const eol='F:/VisibleMedicine/staging/20261021-atlas-source-eol-restoration';
const root='F:/VisibleMedicine/recovery/checkpoints/20261021-psoas-salivary-source-bytes-verified';
const previous='F:/VisibleMedicine/recovery/checkpoints/20261021-runtime-license-build-verified';
const old=json(previous+'/checkpoint.json'),application=json(eol+'/APPLICATION.json');
const inputs=json(application.sourceSnapshot),preserved=json(stage+'/PRESERVED_SOURCE_AFTER.json');
const native=json(stage+'/native.json'),restoration=json(eol+'/RESTORATION.json'),manifest=json(site+'/atlas-review/manifest.json');
assert.deepEqual(native.counts,{tests:17,pass:16,fail:1,cancelled:0,skipped:0,todo:0});assert(native.sourceInputsUnchanged);
assert.equal(application.affectedStrictSourceModuleNative.counts.pass,4);assert.equal(application.freshFullTypes.code,0);
for(const r of [native,application.affectedStrictSourceModuleNative,application.freshFullTypes])assert.equal(sha(read(r.log)),r.logSha256);
const verify=()=>{
 assert.equal(inputs.length,5162);assert.equal(preserved.length,7);for(const r of [...inputs,...preserved])assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 const bound=json(site+'/atlas-review/integration-inputs.json');assert.equal(bound.sha256,application.review);assert.equal(bound.inputs.length,1710);for(const r of bound.inputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),application.source);assert.equal(runGit(['-C',atlas,'status','--porcelain=v1']).toString().trim(),'');assert.equal(runGit(['-C',atlas,'diff','--cached','--numstat']).toString().trim(),'');
 for(const r of manifest.files)assert.equal(sha(read(atlas+'/'+r.path)),r.sourceSha256,r.path);
 assert.equal(runGit(['-C',site,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 const now=json(site+'/docs/completion-checklist.json'),before=json(previous+'/coordination-before/completion-checklist.json');assert.deepEqual(now.items,before.items);assert.deepEqual(now.baseline,before.baseline);
 for(const r of json('F:/VisibleMedicine/recovery/local-cutover/20261021-source190-prepared/PRIVATE_GUARDS_AT_CUTOVER.json'))assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);process.kill(266712,0);
};verify();assert(!fs.existsSync(root));fs.mkdirSync(root);
const selected=[];
function copy(from,p){
 assert(!path.isAbsolute(p)&&!p.includes('..')&&!/[\\\x00-\x1f]/.test(p));assert(fs.lstatSync(from).isFile()&&!fs.lstatSync(from).isSymbolicLink());const bytes=read(from);assert(bytes.length<250000&&!bytes.includes(0));new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 const to=root+'/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,bytes,{flag:'wx'});selected.push({path:p,bytes:bytes.length,sha256:sha(bytes)});
}
const plan=json(stage+'/PREPARATION.json');assert.equal(plan.paths.length,12);
for(const r of plan.paths){assert.equal(sha(read(site+'/'+r.path)),r.after);copy(site+'/'+r.path,'installed-website/'+r.path);}
for(const p of ['PREPARATION.json','native.json','native.log'])copy(stage+'/'+p,'evidence/teaching/'+p);
for(const p of ['RESTORATION.json','APPLICATION.json','native.json','native.log','types.json','types.log'])copy(eol+'/'+p,'evidence/source-bytes/'+p);
copy('F:/VisibleMedicine/staging/20261021-atlas-source-eol-audit/REPORT.md','evidence/source-bytes/AUDIT.md');
for(const p of ['admit-psoas-salivary-epochs-20261021.mjs','restore-atlas-source-eol-20261021.mjs','checkpoint-psoas-salivary-source-bytes-20261021.mjs'])copy(p,'controls/'+p);
const proof={at:new Date().toISOString(),source:application.source,review:application.review,canonicalInstalled:true,installation:old.installation,currentNamedInputs:5169,controlledSourceInputs:5162,preservedSourcePaths:old.preservedSourcePaths,sourceSnapshot:application.sourceSnapshot,sourceSnapshotSha256:application.sourceSnapshotSha256,preservedSnapshot:stage+'/PRESERVED_SOURCE_AFTER.json',preservedSnapshotSha256:sha(read(stage+'/PRESERVED_SOURCE_AFTER.json')),reviewInputs:1710,canonicalDeveloperToolingInstalled:true,
 installedTestPaths:12,addedTestPaths:8,existingTestPathsChanged:4,actualTeachingNative:{receipt:stage+'/native.json',receiptSha256:sha(read(stage+'/native.json')),counts:native.counts,allInputsUnchanged:true,unresolvedCaseAtThatTerminal:'strict Atlas working source bytes; separately corrected without changing tests'},
 strictSourceCorrection:{receipt:eol+'/RESTORATION.json',receiptSha256:sha(read(eol+'/RESTORATION.json')),atlasPaths:9,strictlyCrlfInsertionRemoval:true,semanticEdits:false,committedSourceAdvanced:false,indexStatRefreshWithoutStagedContent:true,all1553WorkingSourceHashesExact:true,native:application.affectedStrictSourceModuleNative},
 freshFullTypes:application.freshFullTypes,wholeOriginalSourcesAndAssertionsRetained:true,historicalAndCurrentContextsSeparate:true,forgedAndStaleRefusalsPreserved:true,noDecisionSaved:true,productionBuildRerun:false,
 previousPackaging24AndAllGatesStillSeparateEvidence:true,all71ItemsAndEightIdeasUnchanged:true,wholeAuditBaselineUnchanged:true,subset289_202_87Retained:true,subsetFailuresNotSubtracted:true,originalFullFailureBaseline:136,originalFullSkips:3,earlierDifferentSourceBaseline:144,allNativeFailuresResolved:false,fullSuitePassingClaim:false,
 ownerPreviewPid:266712,ownerPreviewSession:32652,ownerPreviewRestarted:false,ownerTabsReloaded:false,ownerDecisionsChanged:false,unresolvedBrowserErrorKinds:1,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,privateDataUploaded:false,wholeProjectBackup:false,privateDataBackup:false,fullGoalActive:true};
fs.writeFileSync(root+'/PROOF.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});copy(root+'/PROOF.json','evidence/PROOF.json');
const parentRoot=previous+'-backup',parent=json(parentRoot+'/github-backup.json');assert(parent.sourceBackupVerified);assert.equal(parent.head,'801a095dbb50709a24699a9fe579857094838fdf');
const values=new Map(json(parentRoot+'/remote-source-restored/.source-backup/manifest.json').files.map(r=>{const bytes=read(parentRoot+'/remote-source-restored/'+r.path);assert.equal(sha(bytes),r.sha256);return[r.path,bytes];}));
for(const r of selected)values.set('evidence/20261021-psoas-salivary-source-bytes-verified/'+r.path,read(root+'/'+r.path));
const remote=backup({root:root+'-backup',repo:'F:/VisibleMedicine/history/website-work/github-psoas-salivary-source-bytes-20261021.git',branch:'backup/psoas-salivary-source-bytes-verified-20261021',files:[...values].map(([path,bytes])=>({path,bytes:bytes.length,sha256:sha(bytes)})).sort((a,b)=>a.path.localeCompare(b.path)),bytesFor:p=>values.get(p),verifySource:verify,sourceIdentity:{atlas:application.source,review:application.review,canonicalNamedInputs:5169,canonicalInstalled:true},parent:parent.head,parentTree:parent.tree,parentRepo:parentRoot+'/independent-readback.git',proof,
 scope:'Explicit twelve installed authored developer tests/adapters/full original test fixtures, small native/type receipts/logs, metadata-only nine-path source-byte audit and guarded controls. Previously filtered source-only ancestry only. No raw canonical ancestry, full project, private scans/masks/models/media/datasets/records/references/env/dependencies/browser DOM or full native matrix TAP. Partial source recovery only; not full/private/runnable backup, clinical approval, registration or public deployment.'});
const checkpoint={...proof,site,selectedFiles:selected,backup:{receipt:root+'-backup/github-backup.json',receiptSha256:sha(read(root+'-backup/github-backup.json')),head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths},next:'Use the existing complete87-failure inventory to prioritize remaining real delivery failures and coherent current/historical contract repairs. Retain native17/16/1 terminal and separate post-correction4/4 receipt rather than presenting a whole-suite result. Continue release-essential desktop accessibility and linked CT/MRI/existing3D journeys without awaiting clinical sign-off; no public release or desktop PACS changes.'};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(checkpoint,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),selected:selected.length,head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}));
