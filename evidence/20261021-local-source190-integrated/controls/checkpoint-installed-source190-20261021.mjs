// Filtered source-only recovery; private/native state and complete runtime trees stay F-local.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {backup,read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/recovery/checkpoints/20261021-local-source190-integrated';
const cutover='F:/VisibleMedicine/recovery/local-cutover/20261021-source190-prepared',installed=json(cutover+'/INSTALLATION.json');
const app='F:/VisibleMedicine/staging/20261021-elbow-history-application',applied=json(app+'/APPLICATION.json'),inputs=json(app+'/SOURCE_INPUTS_AFTER.json');
const site=installed.site,plan=json(json(cutover+'/PREPARED.json').planFile),qa=json(cutover+'/INSTALLED_BROWSER_QA.json'),preview=json(cutover+'/PREVIEW_STARTED.json');
assert(installed.applied&&applied.canonicalInstalled);assert.equal(inputs.length,5150);assert.equal(applied.totalNamedInputs,5157);assert(Object.values(qa.checks).every(v=>v===true));
const actual=json(app+'/ACTUAL_NATIVE_PASSED.json'),first=json(app+'/FIRST_NATIVE_FAILED.json');assert.equal(actual.code,0);assert.equal(first.code,1);
for(const r of [actual,first])assert.equal(sha(read(r.log)),r.logSha256);
for(const label of ['tests 1','pass 1','fail 0','cancelled 0','skipped 0'])assert(actual.footer.includes('ℹ '+label));
const tested='F:/VisibleMedicine/staging/20261021-buffer-type-application';assert(json(tested+'/VERIFICATION.json').passed);
const candidateInputs=json(tested+'/SOURCE_INPUTS_AFTER.json');const typedInputs=candidateInputs.filter(r=>/\.(?:ts|tsx|mts)$/.test(r.path));
const verify=()=>{
 for(const r of inputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 for(const r of typedInputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256,'Unchanged fully typechecked input: '+r.path);
 const bound=json(site+'/atlas-review/integration-inputs.json');assert.equal(bound.sha256,installed.review);assert.equal(bound.inputs.length,1710);for(const r of bound.inputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 assert.equal(runGit(['-C',installed.atlas,'rev-parse','HEAD']).toString().trim(),installed.sourceAtlas);assert.equal(runGit(['-C',installed.atlas,'status','--porcelain=v1']).toString().trim(),'');
 assert.equal(runGit(['-C',site,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 for(const r of json(cutover+'/PRIVATE_GUARDS_AT_CUTOVER.json'))assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 for(const p of plan.preservedNamedPaths.filter(p=>p!=='docs/completion-checklist.json'&&p!=='docs/completion-checklist.md')){const old=json(cutover+'/PREPARED.json').preservedPaths.find(r=>r.path===p);assert.equal(sha(read(site+'/'+p)),old.sha256,p);}
 process.kill(preview.pid,0);
};verify();assert(!fs.existsSync(root));fs.mkdirSync(root);
const selected=[];function copy(from,p){assert(!path.isAbsolute(p)&&!/[\\\x00-\x1f]/.test(p)&&p.split('/').every(v=>v&&v!=='.'&&v!=='..'));assert(!/(^|\/)(?:\.env|\.local|private|node_modules|\.git)(?:\/|$)|\.(?:glb|db|sqlite|png|jpg|dcm|nii)$/i.test(p));const bytes=read(from);assert(bytes.length<250000&&!bytes.includes(0));const target=root+'/'+p;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});selected.push({path:p,bytes:bytes.length,sha256:sha(bytes)});}
// Newly installed own code, not generated anatomy/geometry or full coverage datasets.
for(const r of plan.operations.filter(r=>!r.scope&&!r.path.startsWith('tests/')&&!/^docs\/anatomy-coverage\/.*\.json$/.test(r.path)))copy(site+'/'+r.path,'installed-website/'+r.path);
for(const r of json(app+'/PREPARATION.json').changes)copy(site+'/'+r.path,'installed-website/'+r.path);
copy(app+'/preimages/tests/elbow-current-lifecycle-preservation.test.mjs','preimages/elbow-current-lifecycle-preservation.test.mjs');
for(const [from,p]of [
 [cutover+'/INSTALLATION.json','cutover/INSTALLATION.json'],[cutover+'/OPEN_DRAFT_GATE.json','cutover/OPEN_DRAFT_GATE.json'],[cutover+'/PREVIEW_STARTED.json','cutover/PREVIEW_STARTED.json'],[cutover+'/INSTALLED_BROWSER_QA.json','cutover/INSTALLED_BROWSER_QA.json'],
 [app+'/PREPARATION.json','elbow/PREPARATION.json'],[app+'/APPLICATION.json','elbow/APPLICATION.json'],[app+'/FIRST_NATIVE_FAILED.json','elbow/FIRST_NATIVE_FAILED.json'],[app+'/ACTUAL_NATIVE_PASSED.json','elbow/ACTUAL_NATIVE_PASSED.json'],
 ['F:/VisibleMedicine/staging/20261021-elbow-history-guard-proposal/STAGING_EVIDENCE.json','elbow/STAGING_EVIDENCE.json'],
 ['F:/VisibleMedicine/staging/20261021-observer-attribution/ATTRIBUTION.md','browser/ATTRIBUTION.md'],
 ['F:/VisibleMedicine/staging/20261021-cutover-plan-5155/INSTALLER_REVIEW.json','cutover/INSTALLER_REVIEW.json'],['F:/VisibleMedicine/staging/20261021-cutover-plan-5155/INSTALLER_REVIEW_V2.json','cutover/INSTALLER_REVIEW_V2.json'],
 ])copy(from,'evidence/'+p);
for(const p of ['prepare-recoverable-cutover-20261021.mjs','install-prepared-source190-20261021.mjs','launch-installed-source190-20261021.mjs','record-source190-open-draft-gate-20261021.mjs','record-installed-source190-qa-20261021.mjs','admit-elbow-history-guard-20261021.mjs','checkpoint-installed-source190-20261021.mjs','emit-coordination-checkpoint.mjs','snapshot-coordination.mjs'])copy(p,'controls/'+p);
const proof={at:new Date().toISOString(),source:installed.sourceAtlas,review:installed.review,currentNamedInputs:5157,controlledSourceInputs:5150,preservedSourcePaths:plan.preservedNamedPaths,reviewInputs:1710,
 canonicalInstalled:true,installation:{file:cutover+'/INSTALLATION.json',sha256:sha(read(cutover+'/INSTALLATION.json'))},canonicalDeveloperToolingInstalled:true,sourceSnapshot:app+'/SOURCE_INPUTS_AFTER.json',sourceSnapshotSha256:sha(read(app+'/SOURCE_INPUTS_AFTER.json')),
 atlasFastForwardOnly:true,websiteGitHeadUnchanged:true,ownerPreviewPid:preview.pid,ownerPreviewSession:32652,ownerTabsReloaded:false,ownerDecisionsChanged:false,independentSpecialistStatesChecked:true,
 fullTypesPassedOnIdenticalTypedInputs:true,identicalTypedInputs:typedInputs.length,productionBuildPassedBeforeMechanicalImport:true,installedReviewAndDeliveryVerifiersPassed:true,actualUiPasses:40,affectedFeatureAndPreservationPasses:17,separateActualElbowGuardPasses:1,
 actualBrowserChecks:qa.checks,semanticComparisonOnly:true,spatialRegistration:false,unresolvedBrowserErrors:qa.capturedBrowserErrors,
 originalFullFailureBaseline:144,currentFullNativeFailureBaseline:136,fullSuitePassingClaim:false,allNativeFailuresResolved:false,clinicalApproval:false,publicDeployment:false,privateDataUploaded:false,wholeProjectBackup:false,privateDataBackup:false,fullGoalActive:true,
 previousGoalTurn:'progress: applied candidate UI/test repairs, fresh types/build/browser acceptance and source backup; not a wait/status-only turn',priorityReassessment:'Main UI simplification is now installed locally; continue release-essential regression repairs and real desktop/CT-MRI-existing3D journeys. Clinical review remains independent; do not stall.'};
fs.writeFileSync(root+'/PROOF.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});copy(root+'/PROOF.json','evidence/PROOF.json');
const parentRoot='F:/VisibleMedicine/recovery/checkpoints/20261021-review-return-verified-backup',parent=json(parentRoot+'/github-backup.json');assert(parent.sourceBackupVerified);assert.equal(parent.head,'b1b70e0cc4af26b3e5172bf35d7140529e965be1');
const values=new Map(json(parentRoot+'/remote-source-restored/.source-backup/manifest.json').files.map(r=>{const bytes=read(parentRoot+'/remote-source-restored/'+r.path);assert.equal(sha(bytes),r.sha256);return[r.path,bytes];}));
for(const r of selected)values.set('evidence/20261021-local-source190-integrated/'+r.path,read(root+'/'+r.path));
backup({root:root+'-backup',repo:'F:/VisibleMedicine/history/website-work/github-local-source190-integrated-20261021.git',branch:'backup/local-source190-integrated-20261021',files:[...values].map(([path,bytes])=>({path,bytes:bytes.length,sha256:sha(bytes)})).sort((a,b)=>a.path.localeCompare(b.path)),bytesFor:p=>values.get(p),verifySource:verify,sourceIdentity:{atlas:installed.sourceAtlas,review:installed.review,canonicalNamedInputs:5157,canonicalInstalled:true},parent:parent.head,parentTree:parent.tree,parentRepo:parentRoot+'/independent-readback.git',proof,
 scope:'Explicit newly installed own Website code, three historical guard/fixture paths, small source-bound installation/browser/native proof and main controls only on previously filtered source-only ancestry. No raw canonical Git ancestry, full manifests/coverage datasets/runtime/geometry, private D1/DO/R2/env/identifiers/notes/decisions, scans/masks, dependencies, raw browser DOM/logs/media or private references. Not a complete runnable/private backup, public release, clinical approval or patient-space registration.'});
const remote=json(root+'-backup/github-backup.json');const checkpoint={...proof,site,selectedFiles:selected,backup:{receipt:root+'-backup/github-backup.json',receiptSha256:sha(read(root+'-backup/github-backup.json')),head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths},next:'Continue bounded connective and pelvic/portal epoch proposals, actual native checks, remaining release-essential UX and browser-error attribution; keep owner forms and specialist boundaries intact.'};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(checkpoint,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),selected:selected.length,head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}));
