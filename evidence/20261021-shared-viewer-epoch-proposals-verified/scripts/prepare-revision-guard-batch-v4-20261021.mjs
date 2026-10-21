import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const oldRoot='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v3',before=json(oldRoot+'/PREPARATION.json');
const shared='F:/VisibleMedicine/staging/20261021-shared-viewer-keyboard-epoch-proposal/v2';
const next=json(shared+'/PREPARATION.json'),receiptPath=shared+'/SHARED_VIEWER_KEYBOARD_EPOCH_V2.json',receipt=json(receiptPath);
assert.equal(receipt.code,0);assert.equal(sha(read(receipt.log)),receipt.logSha256);
for(const value of ['tests 3','pass 3','fail 0','cancelled 0','skipped 0','todo 0'])assert(receipt.footer.includes('ℹ '+value));
assert(next.originalWholeSourceExactlyReconstructed);
assert.equal(sha(read(next.firstFailure)),sha(read('F:/VisibleMedicine/staging/20261021-shared-viewer-keyboard-epoch-proposal/SHARED_VIEWER_KEYBOARD_EPOCH.json')));
const failed=json(next.firstFailure);assert.equal(failed.code,1);assert.equal(sha(read(failed.log)),next.firstFailureLogSha256);
const frozen=json('F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json');
for(const row of frozen)assert.equal(sha(read(before.site+'/'+row.path)),row.sha256,row.path);
const changes=[...before.changes,{path:next.path,from:shared+'/'+next.path,beforeSha256:next.beforeSha256,sha256:next.sha256,bytes:next.bytes}];
assert.equal(new Set(changes.map(row=>row.path)).size,9);assert.equal(changes.filter(row=>!row.beforeSha256).length,2);
for(const row of changes){assert.equal(sha(read(row.from)),row.sha256,row.path);if(row.beforeSha256)assert.equal(sha(read(before.site+'/'+row.path)),row.beforeSha256,row.path);else assert(!fs.existsSync(before.site+'/'+row.path));}
const stage='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v4';assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const prep={...before,at:new Date().toISOString(),stage,changes,receipts:[...before.receipts,{file:receiptPath,sha256:sha(read(receiptPath)),label:receipt.label,footer:receipt.footer,logSha256:receipt.logSha256}],supersedes:oldRoot,
 scope:'Nine test-only paths: seven existing plus two new. Eighteen outer registrations across six separate successful native runs, not one whole-suite pass. Historical coverage wrapper additionally verifies four unchanged child tests. New shared-viewer test retains original emitted assertions at exact f2f7/88cea bytes, uses source-bound current checks independent of minifier local names, and refuses missing emitted step/listener paths. Its first ENOBUFS attempt remains retained; exact historic bundle read now has32MB bounded capacity. Complete original test-source inverse is verified. No application, model, access or clinical data changes.'};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(prep,null,2)+'\n',{flag:'wx'});
// Amend only a virtual test row. Do not repeat the unchanged successful six-
// directory/model-byte inventory, and never treat this as installation.
const planRoot='F:/VisibleMedicine/staging/20261021-source190-virtual-cutover-plan',plan=json(planRoot+'/PLAN.json'),summary=json(planRoot+'/SUMMARY.json');
assert.equal(sha(read(planRoot+'/PLAN.json')),summary.planSha256);
const oldRow=plan.changes.find(row=>row.path===next.path),canonicalPath=plan.target+'/'+next.path;
const beforeSha256=sha(read(canonicalPath));if(oldRow)assert.equal(beforeSha256,oldRow.beforeSha256);else assert.equal(beforeSha256,next.beforeSha256);
const changedNamedPaths=summary.changedNamedPaths+(oldRow?0:1),unchangedNamedPaths=summary.unchangedNamedPaths-(oldRow?0:1);
const overlay={at:new Date().toISOString(),baseSummary:planRoot+'/SUMMARY.json',baseSummarySha256:sha(read(planRoot+'/SUMMARY.json')),basePlanSha256:summary.planSha256,batch:stage+'/PREPARATION.json',batchSha256:sha(read(stage+'/PREPARATION.json')),sourceRevision:before.source,review:before.review,virtualNamedInputs:5109,changedNamedPaths,unchangedNamedPaths,preservedNamedPaths:7,replacedVirtualTestRow:{...changes.at(-1),canonicalBeforeSha256:beforeSha256},generatedScopesUnchanged:6,generatedInventoryRerun:false,unresolvedGeneratedPaths:0,modelsUnchanged:137,sourceAndCanonicalChanged:false,privateDataCopied:false,ownerPreviewStopped:false,requiredGates:summary.requiredGates,note:'V4 supersedes the V3 virtual test row only; generated runtime/Review/model identities remain unchanged and no overlay is installed. Preserve and revalidate current coordinator snapshots at actual cutover.'};
fs.writeFileSync(planRoot+'/V4_TEST_OVERLAY.json',JSON.stringify(overlay,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,paths:9,existing:7,added:2,sourceInputsAfter:5109,currentInputsUnchanged:5107,virtualChangedPaths:changedNamedPaths,wholeOriginalSharedViewerTestReconstructed:true}));
