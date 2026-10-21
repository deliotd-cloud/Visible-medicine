import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-canonical-local-r2-fix',prep=json(stage+'/PREPARATION.json');
const receipt=json(stage+'/CANONICAL_LOCAL_R2.json');assert.equal(receipt.code,0);assert.equal(sha(read(receipt.log)),receipt.logSha256);
for(const value of ['tests 4','pass 4','fail 0','cancelled 0','skipped 0','todo 0'])assert(receipt.footer.includes('ℹ '+value));
for(const row of prep.changes){assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path);assert.equal(sha(read(prep.source+'/'+row.path)),row.sha256,row.path);}
const guards=json(stage+'/PRIVATE_SOURCE_GUARDS.json');for(const row of guards)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path);
const frozenPath='F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json',frozen=json(frozenPath);
assert.equal(frozen.length,5107);for(const row of frozen)assert.equal(sha(read(prep.source+'/'+row.path)),row.sha256,row.path);
const bound=json(prep.source+'/atlas-review/integration-inputs.json');assert.equal(bound.inputs.length,1710);for(const row of bound.inputs)assert.equal(sha(read(prep.source+'/'+row.path)),row.sha256,row.path);
const installed=json(prep.site+'/atlas-review/integration-inputs.json');assert.equal(installed.sha256,'b2bd971b5bfefdd0760f8f3c8785e372276e15dac9cc293ac8fde4cdfb7dcb54');
assert.equal(runGit(['-C',prep.site,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert.equal(runGit(['-C',prep.atlas,'rev-parse','HEAD']).toString().trim(),'98d7f17e2d120b031633e59e47fc50c82d44b2d0');
const previewPort=execFileSync('powershell',['-NoProfile','-Command','Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object -ExpandProperty OwningProcess'],{windowsHide:true,encoding:'utf8'}).trim();assert.equal(previewPort,'260328');
for(const id of [260328,263984,271752])process.kill(id,0);
const result={at:new Date().toISOString(),stage,site:prep.site,source:prep.source,changes:prep.changes,canonicalDeveloperToolingInstalled:true,canonicalAtlasUiInstalled:false,canonicalHeadUnchanged:true,atlasHeadUnchanged:true,ownerPreviewPidUnchanged:260328,reviewRevisionUnchanged:installed.sha256,frontendAndAuthSourceGuardsUnchanged:true,
 nativeTests:{receipt:stage+'/CANONICAL_LOCAL_R2.json',receiptSha256:sha(read(stage+'/CANONICAL_LOCAL_R2.json')),logSha256:receipt.logSha256,tests:4,pass:4,fail:0,skipped:0,scope:'Synthetic isolated old-vs-fixed R2 dispose/reopen readback, absolute loopback option checks and exact Git-ignore boundaries. The test runner itself does not install source; use this admission receipt for installation state.'},
 sourceCandidateNamedInputsPreserved:5107,sourceCandidateReviewInputsPreserved:1710,sourceCandidateSnapshotSha256:sha(read(frozenPath)),fullSuiteSession:37113,fullSuiteRunningAtObservation:true,
 nativeActualModelStagingExecuted:false,liveR2OrDatabaseMigrated:false,privateDataCopied:false,permissionsChanged:false,clinicalDecisionsTouched:false,ownerPagesRefreshed:false,publicDeployment:false,clinicalApproval:false,spatialRegistration:false,
 references:['https://github.com/cloudflare/workers-sdk/blob/main/packages/miniflare/README.md#persistence','https://developers.cloudflare.com/workers/best-practices/workers-best-practices/'],
 scope:'Four JavaScript developer-tool/test files only. Active runtime/UI/Review, model inventory, environments, dependency versions, package/lock and private state unchanged. Canonical .gitignore was preserved byte-for-byte; its recorded EOL-only difference required explicit normalized-content verification. Initial preflight refusals occurred before any source edit. No assertion or actual private staging command was skipped/executed to obtain this pass.'};
fs.writeFileSync(stage+'/ADMISSION.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const planRoot='F:/VisibleMedicine/staging/20261021-source190-virtual-cutover-plan',v4=json(planRoot+'/V4_TEST_OVERLAY.json');
const update={at:result.at,base:planRoot+'/V4_TEST_OVERLAY.json',baseSha256:sha(read(planRoot+'/V4_TEST_OVERLAY.json')),admission:stage+'/ADMISSION.json',admissionSha256:sha(read(stage+'/ADMISSION.json')),acceptedCanonicalDeveloperPaths:prep.changes,
 virtualNamedInputs:5109,changedNamedPaths:v4.changedNamedPaths-prep.changes.length,unchangedNamedPaths:v4.unchangedNamedPaths+prep.changes.length,preservedNamedPaths:7,
 generatedScopesUnchanged:6,generatedModelsUnchanged:137,unresolvedGeneratedPaths:0,canonicalUiChanged:false,privateStateChanged:false,
 required:'At later local UI cutover, accept these four exact postimages only via this receipt; all other original preimages must still match. Preserve current coordinator snapshots and protect open drafts; full-suite terminal/V4 proposal admission/fresh types gates still apply.'};
assert.equal(update.changedNamedPaths+update.unchangedNamedPaths+update.preservedNamedPaths,5109);
fs.writeFileSync(planRoot+'/LOCAL_TOOLING_ADMISSION_OVERLAY.json',JSON.stringify(update,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({admission:stage+'/ADMISSION.json',sha256:sha(read(stage+'/ADMISSION.json')),developerFilesInstalled:4,tests:4,ownerPreviewUnchanged:true,currentCandidateInputsUnchanged:5107,remainingVirtualChangedPaths:update.changedNamedPaths,privateDataCopied:false}));
