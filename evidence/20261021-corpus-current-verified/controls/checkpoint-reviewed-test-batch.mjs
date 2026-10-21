// Main-owned, create-only recovery for a verified test-only batch. No raw Git
// ancestry, native logs, runtime assets, patient data or private state is copied.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {backup,read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const configPath=process.argv[2],c=json(configPath);
const site='F:/VisibleMedicine/website',atlas='F:/VisibleMedicine/atlas';
const {root,stage,previous,proposal}=c;
assert(root.startsWith('F:/VisibleMedicine/recovery/checkpoints/20261021-'));
assert(stage.startsWith('F:/VisibleMedicine/staging/20261021-')&&proposal.startsWith('F:/VisibleMedicine/staging/20261021-'));
assert(previous.startsWith('F:/VisibleMedicine/recovery/checkpoints/')&&[root,stage,previous,proposal].every(p=>!p.includes('..')));
const a=json(stage+'/APPLICATION.json'),old=json(previous+'/checkpoint.json'),rows=json(a.sourceSnapshot),preserved=json(a.preservedSnapshot),n=a.native;
assert.equal(a.canonicalSourceInstalled,true);assert.equal(a.changedPaths.length,c.changedPaths);
assert(a.changedPaths.every(r=>/^tests\/[A-Za-z0-9_./-]+\.(?:mjs|ts|raw)$/.test(r.path)&&!r.path.includes('..')));
assert.equal(n.code,c.nativeCode);assert.deepEqual(n.counts,c.nativeCounts);assert.equal(sha(read(n.log)),n.logSha256);
assert.equal(n.counts.cancelled,0);assert.equal(n.counts.skipped,0);
assert.equal(a.allOtherSourceInputsUnchanged,true);assert.equal(a.all1710ReviewBindingsUnchanged,true);
const verify=()=>{
 assert.equal(rows.length,c.controlledInputs);assert.equal(preserved.length,7);assert.equal(sha(read(a.sourceSnapshot)),a.sourceSnapshotSha256);
 for(const r of [...rows,...preserved])assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 assert.equal(runGit(['-C',site,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),a.source);
 assert.equal(runGit(['-C',atlas,'status','--porcelain=v1']).toString().trim(),'');
 const binding=json(site+'/atlas-review/integration-inputs.json');assert.equal(binding.sha256,a.review);assert.equal(binding.inputs.length,1710);
 for(const r of binding.inputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 const sources=json(site+'/atlas-review/manifest.json').files;assert.equal(sources.length,1553);
 for(const r of sources)assert.equal(sha(read(atlas+'/'+r.path)),r.sourceSha256,r.path);
 const before=json(previous+'/coordination-after/completion-checklist.json'),now=json(site+'/docs/completion-checklist.json');
 assert.equal(now.revision,c.checklistRevision);assert.deepEqual(now.items,before.items);assert.deepEqual(now.baseline,before.baseline);
 for(const r of json('F:/VisibleMedicine/recovery/local-cutover/20261021-source190-prepared/PRIVATE_GUARDS_AT_CUTOVER.json'))assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 process.kill(266712,0);
};
verify();assert(!fs.existsSync(root));fs.mkdirSync(root);
const selected=[];
function copy(from,p){
 assert(!path.isAbsolute(p)&&!p.includes('..')&&!/[\\\x00-\x1f]/.test(p));
 assert(!/\.(?:tap|log|glb|dcm|nii|nrrd|sqlite|db|png|jpg|mp4)$/i.test(p));
 const stat=fs.lstatSync(from);assert(stat.isFile()&&!stat.isSymbolicLink());const b=read(from);
 assert(b.length<250000&&!b.includes(0));new TextDecoder('utf-8',{fatal:true}).decode(b);
 const to=root+'/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,b,{flag:'wx'});
 selected.push({path:p,bytes:b.length,sha256:sha(b)});
}
for(const r of a.changedPaths){
 assert.equal(sha(read(site+'/'+r.path)),r.candidateSha256);copy(site+'/'+r.path,'installed-website/'+r.path);
 if(r.preimageSha256)copy(stage+'/preimages/'+r.path,'preimages/'+r.path);
}
copy(proposal+'/PROPOSAL.json','proposal/PROPOSAL.json');
copy(stage+'/APPLICATION.json','evidence/APPLICATION.json');copy(stage+'/native.json','evidence/native.json');
copy('checkpoint-reviewed-test-batch.mjs','controls/checkpoint-reviewed-test-batch.mjs');copy(configPath,'controls/checkpoint-config.json');
for(const r of c.extraFiles??[])copy(r.from,r.to);
const proof={at:new Date().toISOString(),source:a.source,review:a.review,canonicalInstalled:true,installation:old.installation,
 currentNamedInputs:rows.length+7,controlledSourceInputs:rows.length,preservedSourcePaths:old.preservedSourcePaths,
 sourceSnapshot:a.sourceSnapshot,sourceSnapshotSha256:a.sourceSnapshotSha256,preservedSnapshot:a.preservedSnapshot,preservedSnapshotSha256:sha(read(a.preservedSnapshot)),
 reviewInputs:1710,canonicalDeveloperToolingInstalled:true,installedTestOnlyPaths:a.changedPaths.length,
 existingEditedTestPaths:a.changedPaths.filter(r=>r.preimageSha256).length,actualNativeCode:n.code,actualNativeCounts:n.counts,actualNativeFailures:n.failures,
 originalFullFailureBaseline:136,originalFullSkips:3,earlierDifferentSourceBaseline:144,subset289_202_87Retained:true,
 allOtherSourceInputsAndBindingsUnchanged:true,all1553AtlasWorkingSourceBytesExact:true,all71ItemsAndEightIdeasUnchanged:true,wholeAuditBaselineUnchanged:true,
 milestone:c.milestone,fullSuitePassingClaim:false,rawNativeLogExcludedFromBackup:true,
 ownerPreviewPid:266712,ownerPreviewSession:32652,ownerFormsRefreshed:false,ownerDecisionsChanged:false,previewBuildOrRestartRan:false,
 reviewCopyPreviewBuildPending:true,productSourceChangedByThisRepair:false,unresolvedBrowserErrorKinds:1,
 clinicalApproval:false,spatialRegistration:false,publicDeployment:false,privateDataUploaded:false,wholeProjectBackup:false,privateDataBackup:false,fullGoalActive:true};
fs.writeFileSync(root+'/PROOF.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});copy(root+'/PROOF.json','evidence/PROOF.json');
const parentRoot=previous+'-backup',parent=json(parentRoot+'/github-backup.json');assert(parent.sourceBackupVerified);assert.equal(parent.head,c.parentHead);
const values=new Map(json(parentRoot+'/remote-source-restored/.source-backup/manifest.json').files.map(r=>{const b=read(parentRoot+'/remote-source-restored/'+r.path);assert.equal(sha(b),r.sha256);return[r.path,b];}));
for(const r of selected)values.set('evidence/'+path.basename(root)+'/'+r.path,read(root+'/'+r.path));
const remote=backup({root:root+'-backup',repo:c.repo,branch:c.branch,files:[...values].map(([path,b])=>({path,bytes:b.length,sha256:sha(b)})).sort((a,b)=>a.path.localeCompare(b.path)),bytesFor:p=>values.get(p),verifySource:verify,
 sourceIdentity:{atlas:a.source,review:a.review,canonicalNamedInputs:rows.length+7,canonicalInstalled:true,reviewCopyPreviewBuildPending:true},parent:parent.head,parentTree:parent.tree,parentRepo:parentRoot+'/independent-readback.git',proof,
 scope:c.scope+' Prior filtered source ancestry only. No scans/masks, private reports/coordinates/identifiers/notes/decisions/env, dependencies, model assets, raw TAP/browser DOM/media or raw canonical ancestry. Partial selected-source recovery, not whole/private/runnable backup or whole-suite/clinical/spatial/public-release approval.'});
const checkpoint={...proof,site,selectedFiles:selected,nativeResult:stage+'/native.json',nativeResultSha256:sha(read(stage+'/native.json')),backup:{receipt:root+'-backup/github-backup.json',receiptSha256:sha(read(root+'-backup/github-backup.json')),head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths},next:c.next};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(checkpoint,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),selected:selected.length,head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}));
