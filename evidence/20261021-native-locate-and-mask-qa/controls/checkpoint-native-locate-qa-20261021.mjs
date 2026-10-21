// Main-owned source-only checkpoint; private mask reports never enter selection.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {backup,read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const site='F:/VisibleMedicine/website',atlas='F:/VisibleMedicine/atlas';
const stage='F:/VisibleMedicine/staging/20261021-head-positive-mask-browser';
const root='F:/VisibleMedicine/recovery/checkpoints/20261021-native-locate-and-mask-qa';
const previous='F:/VisibleMedicine/recovery/checkpoints/20261021-desktop-review-copy-and-tour-qa';
const old=json(previous+'/checkpoint.json'),inputs=json(old.sourceSnapshot);
const oldPreserved=json(old.preservedSnapshot),preserved=oldPreserved.map(r=>({...r,sha256:sha(read(site+'/'+r.path))}));
for(const r of oldPreserved)if(!r.path.startsWith('docs/completion-checklist.'))assert.equal(preserved.find(n=>n.path===r.path).sha256,r.sha256);
const browser=json('head-positive-mask-browser-qa-20261021.json');
const privateAudit=json(stage+'/PRIVATE_MASK_SCORING_AUDIT.json');
assert.equal(privateAudit.neverUpload,true);assert.equal(privateAudit.sourceReadOnly,true);assert.equal(privateAudit.allCheckedFilesReadBack,true);
assert.equal(privateAudit.allEligibleEntriesVisited,true);assert.equal(privateAudit.eligible,306);assert.equal(privateAudit.passed,306);assert.equal(privateAudit.failed,0);
assert.equal(privateAudit.positiveChecks,917);assert.equal(privateAudit.negativeChecks,1836);
assert.equal(privateAudit.imageVolumePixelsLoadedByThisAudit,false);assert.equal(privateAudit.clinicalApproval,false);assert.equal(privateAudit.spatialRegistration,false);
assert.equal(browser.temporaryOwnedTabClosed,true);assert.equal(browser.privateDataUploaded,false);
const checklistBaseline=json(previous+'/coordination-after/completion-checklist.json');
const verify=()=>{
 assert.equal(inputs.length,5162);assert.equal(preserved.length,7);
 for(const r of [...inputs,...preserved])assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),old.source);
 assert.equal(runGit(['-C',atlas,'status','--porcelain=v1']).toString().trim(),'');
 assert.equal(runGit(['-C',site,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 const bound=json(site+'/atlas-review/integration-inputs.json');assert.equal(bound.sha256,old.review);assert.equal(bound.inputs.length,1710);
 for(const r of bound.inputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 const source=json(site+'/atlas-review/manifest.json').files;assert.equal(source.length,1553);
 for(const r of source)assert.equal(sha(read(atlas+'/'+r.path)),r.sourceSha256,r.path);
 for(const r of privateAudit.sourceModules)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 const now=json(site+'/docs/completion-checklist.json');assert.equal(now.revision,109);assert.deepEqual(now.items,checklistBaseline.items);assert.deepEqual(now.baseline,checklistBaseline.baseline);
 for(const r of json('F:/VisibleMedicine/recovery/local-cutover/20261021-source190-prepared/PRIVATE_GUARDS_AT_CUTOVER.json'))assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 process.kill(266712,0);
};
verify();assert(!fs.existsSync(root));fs.mkdirSync(root);
fs.writeFileSync(stage+'/PRESERVED_SOURCE_AT_QA.json',JSON.stringify(preserved,null,2)+'\n',{flag:'wx'});
const selected=[];
function copy(from,p){
 assert(!path.isAbsolute(p)&&!p.includes('..')&&!/[\\\x00-\x1f]/.test(p));
 assert(fs.lstatSync(from).isFile()&&!fs.lstatSync(from).isSymbolicLink());
 const b=read(from);assert(b.length<250000&&!b.includes(0));new TextDecoder('utf-8',{fatal:true}).decode(b);
 const to=root+'/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,b,{flag:'wx'});selected.push({path:p,bytes:b.length,sha256:sha(b)});
}
for(const p of ['prepare-head-positive-mask-qa-20261021.mjs','audit-native-mask-scoring-20261021.mjs','checkpoint-native-locate-qa-20261021.mjs'])copy(p,'controls/'+p);
copy('head-positive-mask-browser-qa-20261021.json','evidence/browser-observations.json');
const proof={at:new Date().toISOString(),source:old.source,review:old.review,canonicalInstalled:true,installation:old.installation,currentNamedInputs:5169,controlledSourceInputs:5162,preservedSourcePaths:old.preservedSourcePaths,sourceSnapshot:old.sourceSnapshot,sourceSnapshotSha256:old.sourceSnapshotSha256,preservedSnapshot:stage+'/PRESERVED_SOURCE_AT_QA.json',preservedSnapshotSha256:sha(read(stage+'/PRESERVED_SOURCE_AT_QA.json')),reviewInputs:1710,canonicalDeveloperToolingInstalled:true,
 nativePositiveLocateBrowserJourneys:2,semanticRevisionBoundHandoffObserved:true,studyQuizResultsIsolated:true,focusedCorrectFeedbackObserved:true,pointerCentredSliceScrollWithoutPageScrollObserved:true,keyboardSliceScrollWithoutPageScrollObserved:true,nativeAllEligibleMaskScoringAuditPassed:true,privateAuditDetailsExcludedFromBackup:true,sourceFilesChanged:false,tourBrowserObservationRetained:true,reviewCopyCanonicalSourceInstalled:true,reviewCopyOwnerPreviewContainsNewBuild:false,previewBuildOrRestartRan:false,
 allOtherSourceInputsAndBindingsUnchanged:true,all1553AtlasWorkingSourceBytesExact:true,all71ItemsAndEightIdeasUnchanged:true,wholeAuditBaselineUnchanged:true,originalFullFailureBaseline:136,originalFullSkips:3,earlierDifferentSourceBaseline:144,subset289_202_87Retained:true,allNativeFailuresResolved:false,fullSuitePassingClaim:false,ownerPreviewPid:266712,ownerPreviewSession:32652,ownerFormsRefreshed:false,ownerDecisionsChanged:false,unresolvedBrowserErrorKinds:1,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,privateDataUploaded:false,wholeProjectBackup:false,privateDataBackup:false,fullGoalActive:true};
fs.writeFileSync(root+'/PROOF.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});copy(root+'/PROOF.json','evidence/PROOF.json');
const parentRoot=previous+'-backup',parent=json(parentRoot+'/github-backup.json');assert(parent.sourceBackupVerified);assert.equal(parent.head,'3746c17a6ee35361fd85f1f2db32322ed358860c');
const values=new Map(json(parentRoot+'/remote-source-restored/.source-backup/manifest.json').files.map(r=>{const b=read(parentRoot+'/remote-source-restored/'+r.path);assert.equal(sha(b),r.sha256);return[r.path,b];}));
for(const r of selected)values.set('evidence/20261021-native-locate-and-mask-qa/'+r.path,read(root+'/'+r.path));
assert(!selected.some(r=>/PRIVATE_|INTERACTION_PLAN|MASK_SCORING_AUDIT/.test(r.path)));
const remote=backup({root:root+'-backup',repo:'F:/VisibleMedicine/history/website-work/github-native-locate-qa-20261021.git',branch:'backup/native-locate-qa-20261021',files:[...values].map(([path,b])=>({path,bytes:b.length,sha256:sha(b)})).sort((a,b)=>a.path.localeCompare(b.path)),bytesFor:p=>values.get(p),verifySource:verify,sourceIdentity:{atlas:old.source,review:old.review,canonicalNamedInputs:5169,canonicalInstalled:true,reviewCopyPreviewBuildPending:true},parent:parent.head,parentTree:parent.tree,parentRepo:parentRoot+'/independent-readback.git',proof,
 scope:'Generic read-only QA controllers and sanitized text-only native practice/handoff/scrolling observations on prior filtered source ancestry. No private audit report, native coordinates/slices/movement plans, masks, pixels, private filenames, scans, models, review decisions/notes/identifiers/references/env/dependencies, raw canonical Git ancestry or raw browser DOM/media. Partial source recovery only, not whole/private/runnable backup, clinical or spatial approval, whole-suite acceptance or public deployment.'});
const checkpoint={...proof,site,selectedFiles:selected,privateLocalEvidence:{neverUpload:true,audit:stage+'/PRIVATE_MASK_SCORING_AUDIT.json',interactionPlan:stage+'/PRIVATE_INTERACTION_PLAN.json'},backup:{receipt:root+'-backup/github-backup.json',receiptSha256:sha(read(root+'-backup/github-backup.json')),head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths},next:'Continue the bounded closed56 historical/current contract repair with preserved originals and exact epoch roles; retain the genuine full regression inventories. Build the queued inbox wording with the next coherent isolated candidate, without touching owner forms. No clinical-review stall or public release.'};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(checkpoint,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),selected:selected.length,head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}));
