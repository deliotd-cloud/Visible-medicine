// Selected source and small proof only; deliberately excludes private manifests and runtime trees.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {backup,read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/recovery/checkpoints/20261021-review-return-verified';
const applied='F:/VisibleMedicine/staging/20261021-buffer-type-application';
const ui='F:/VisibleMedicine/staging/20261021-review-return-application';
const batch='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v11';
const prep=json(applied+'/PREPARATION.json'),source=json(ui+'/PREPARATION.json');
const snapshot=applied+'/SOURCE_INPUTS_AFTER.json',inputs=json(snapshot),verification=json(applied+'/VERIFICATION.json');
assert.equal(verification.passed,true);assert.equal(verification.results.length,5);
const checkReceipt=p=>{const r=json(p);assert.equal(r.code,0);assert.equal(r.sourceInputsUnchanged,true);assert.equal(sha(read(r.log)),r.logSha256);return r;};
const native=checkReceipt(applied+'/AFFECTED_NATIVE.json'),types=checkReceipt(applied+'/FRESH_FULL_TYPES.json');
for(const name of ['VERIFY_REVIEW','VERIFY_DELIVERY','PRODUCTION_BUILD'])checkReceipt(applied+'/'+name+'.json');
const uiNative=checkReceipt(ui+'/ACTUAL_REVIEW_UI.json');
const uiLog=read(uiNative.log).toString();for(const word of ['tests 40','pass 40','fail 0','cancelled 0','skipped 0'])assert(uiLog.includes(word));
const browser=json('F:/VisibleMedicine/staging/20261021-review-return-browser/OBSERVATION.json');
assert(Object.values(browser.checks).every(v=>v===true));assert.equal(browser.componentSha256,sha(read(prep.site+'/components/ClinicalReviewInbox.tsx')));
const previous=new Map(json(ui+'/SOURCE_INPUTS_AFTER.json').map(r=>[r.path,r]));
const changed=inputs.filter(r=>r.sha256!==previous.get(r.path)?.sha256).map(r=>r.path).sort();
assert.deepEqual(changed,prep.changes.map(r=>r.path).sort());assert(changed.every(p=>p.startsWith('tests/')));
const verify=()=>{
 assert.equal(inputs.length,5155);for(const r of inputs)assert.equal(sha(read(prep.site+'/'+r.path)),r.sha256,r.path);
 const bound=json(prep.site+'/atlas-review/integration-inputs.json');assert.equal(bound.sha256,source.review);assert.equal(bound.inputs.length,1710);
 for(const r of bound.inputs)assert.equal(sha(read(prep.site+'/'+r.path)),r.sha256,r.path);
 assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD']).toString().trim(),source.source);
 assert.equal(runGit(['-C',source.atlas,'status','--porcelain=v1']).toString().trim(),'');
 for(const [repo,head]of [['website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['atlas','98d7f17e2d120b031633e59e47fc50c82d44b2d0']])assert.equal(runGit(['-C','F:/VisibleMedicine/'+repo,'rev-parse','HEAD']).toString().trim(),head);
 assert.equal(sha(read('F:/VisibleMedicine/website/components/ClinicalReviewInbox.tsx')),'59605fcb29edecede8f6412842ad8ba760161b928b78657045c52388894984cd');
 const tooling=json('F:/VisibleMedicine/staging/20261021-canonical-local-r2-fix/ADMISSION.json');
 for(const r of tooling.changes)assert.equal(sha(read(tooling.site+'/'+r.path)),r.sha256,r.path);
 for(const r of json(tooling.localOnlyGuardFile??'F:/VisibleMedicine/staging/20261021-canonical-local-r2-fix/PRIVATE_SOURCE_GUARDS.json'))assert.equal(sha(read(tooling.site+'/'+r.path)),r.sha256,r.path);
 process.kill(260328,0);
};verify();assert(!fs.existsSync(root));fs.mkdirSync(root);
const selected=[];
function copy(from,p){
 assert(!path.isAbsolute(p)&&!/[\\\x00-\x1f]/.test(p)&&p.split('/').every(v=>v&&v!=='.'&&v!=='..'));
 assert(!/(^|\/)(?:\.env|\.local|private|node_modules|\.git)(?:\/|$)|\.(?:glb|db|sqlite|png|jpg|dcm|nii)$/i.test(p));
 const bytes=read(from);assert(bytes.length<200000&&!bytes.includes(0));const target=root+'/'+p;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});selected.push({path:p,bytes:bytes.length,sha256:sha(bytes)});
}
const testPaths=new Set([...json(batch+'/PREPARATION.json').changes.map(r=>r.path),...prep.changes.map(r=>r.path)]);
for(const p of testPaths){assert(p.startsWith('tests/'));copy(prep.site+'/'+p,'applied-candidate/'+p);}
for(const r of source.changes)copy(prep.site+'/'+r.path,'applied-candidate/'+r.path);
for(const r of prep.changes)copy(applied+'/preimages/'+r.path,'preimages/buffer/'+r.path);
copy(ui+'/preimages/components/ClinicalReviewInbox.tsx','preimages/ui/components/ClinicalReviewInbox.tsx');
const proofs=[
 [batch+'/PREPARATION.json','v11/PREPARATION.json'],[batch+'/ADMISSION_RESULT.json','v11/ADMISSION_RESULT.json'],[batch+'/CURRENT_MODULES_ADMISSION.json','v11/CURRENT_MODULES_ADMISSION.json'],
 [ui+'/APPLICATION.json','ui/APPLICATION.json'],[ui+'/ACTUAL_REVIEW_UI.json','ui/ACTUAL_REVIEW_UI.json'],[ui+'/FRESH_FULL_TYPES.json','ui/FIRST_TYPES_FAILED.json'],[ui+'/BUILD_VERIFICATION.json','ui/FIRST_BUILD_VERIFICATION.json'],
 [applied+'/PREPARATION.json','buffer/PREPARATION.json'],[applied+'/APPLICATION.json','buffer/APPLICATION.json'],[applied+'/VERIFICATION.json','buffer/VERIFICATION.json'],
 ...['AFFECTED_NATIVE','FRESH_FULL_TYPES','VERIFY_REVIEW','VERIFY_DELIVERY','PRODUCTION_BUILD'].map(n=>[applied+'/'+n+'.json','buffer/'+n+'.json']),
 ['F:/VisibleMedicine/staging/20261021-review-return-browser/OBSERVATION.json','browser/OBSERVATION.json'],
 ['F:/VisibleMedicine/staging/20261021-source190-complete-suite/TERMINAL_FAILURE_CLASSIFICATION.json','baseline/TERMINAL_FAILURE_CLASSIFICATION.json'],
 ['F:/VisibleMedicine/staging/20261021-buffer-type-proposal/STAGING_EVIDENCE.json','buffer/STAGING_EVIDENCE.json'],
 ['F:/VisibleMedicine/staging/20261021-cutover-plan-5155/SUMMARY_V4.json','cutover/SUMMARY_V4.json'],
 ['F:/VisibleMedicine/staging/20261021-cutover-plan-5155/COVERAGE_OVERLAY_V3.json','cutover/COVERAGE_OVERLAY_V3.json'],
];
for(const [from,p]of proofs)copy(from,'evidence/'+p);
for(const p of ['apply-buffer-type-batch-20261021.mjs','verify-buffer-type-batch-20261021.mjs','checkpoint-review-return-verified-20261021.mjs','prepare-review-return-application-20261021.mjs','finish-review-return-application-20261021.mjs','verify-review-return-site-20261021.mjs','record-review-return-browser-20261021.mjs','finish-current-epoch-batch-20261021.mjs','record-current-module-admission-20261021.mjs','emit-coordination-checkpoint.mjs'])copy(p,'controls/'+p);
const proof={at:new Date().toISOString(),source:source.source,review:source.review,currentNamedInputs:5155,reviewInputs:1710,candidateTestPathsApplied:85,reviewUiPathsApplied:2,bufferRepairPathsApplied:6,
 actualReviewUiPasses:40,affectedNativeFooter:native.footer,freshFullTypes:true,productionBuild:true,reviewAndDeliveryChecks:true,browserReturnContext:true,browserApplicationSourceUnchangedAfterTestOnlyFix:true,
 originalFullFailureBaseline:144,currentFullRunFailuresRetained:136,fullSuitePassingClaim:false,allNativeFailuresResolved:false,
 canonicalInstalled:false,canonicalDeveloperToolingInstalled:true,ownerPreviewChanged:false,ownerFormsTouched:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,privateDataUploaded:false,wholeProjectBackup:false,privateDataBackup:false,fullGoalActive:true};
fs.writeFileSync(root+'/PROOF.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});copy(root+'/PROOF.json','evidence/PROOF.json');
const parentRoot='F:/VisibleMedicine/recovery/checkpoints/20261021-historical-current-native-verified-backup',parent=json(parentRoot+'/github-backup.json');assert.equal(parent.head,'0220c554b83249e8c4fdf39f1304bcfebbe8b92a');assert(parent.sourceBackupVerified);
const values=new Map(json(parentRoot+'/remote-source-restored/.source-backup/manifest.json').files.map(r=>{const bytes=read(parentRoot+'/remote-source-restored/'+r.path);assert.equal(sha(bytes),r.sha256);return[r.path,bytes];}));
for(const r of selected)values.set('evidence/20261021-review-return-verified/'+r.path,read(root+'/'+r.path));
backup({root:root+'-backup',repo:'F:/VisibleMedicine/history/website-work/github-review-return-verified-20261021.git',branch:'backup/review-return-verified-20261021',files:[...values].map(([path,bytes])=>({path,bytes:bytes.length,sha256:sha(bytes)})).sort((a,b)=>a.path.localeCompare(b.path)),bytesFor:p=>values.get(p),verifySource:verify,sourceIdentity:{atlas:source.source,review:source.review,websiteInputCount:5155,canonicalInstalled:false},parent:parent.head,parentTree:parent.tree,parentRepo:parentRoot+'/independent-readback.git',proof,
 scope:'Explicit applied candidate test/UI source, six prior test preimages, small source-bound proof and main controls only, on already filtered source-only ancestry. No complete source-input manifests, raw canonical history, scans/masks, private DB/identifiers/decisions/env, full runtimes/models, dependencies or browser media/DOM. Not a complete runnable/private backup, public release, clinical approval or spatial registration.'});
const remote=json(root+'-backup/github-backup.json');
const checkpoint={...proof,site:prep.site,sourceSnapshot:snapshot,sourceSnapshotSha256:sha(read(snapshot)),selectedFiles:selected,backup:{receipt:root+'-backup/github-backup.json',receiptSha256:sha(read(root+'-backup/github-backup.json')),head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths},next:'Coherent local cutover with exact ownership/preimage guards and preserved owner drafts. Continue full71item/eightidea roadmap; no clinical-signoff stall.'};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(checkpoint,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),selected:selected.length,head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}));
