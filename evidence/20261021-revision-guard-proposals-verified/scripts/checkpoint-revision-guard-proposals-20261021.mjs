import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {backup,read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v2',prep=json(stage+'/PREPARATION.json');
const site='F:/VisibleMedicine/staging/20261021-source190-website/website';assert.equal(prep.site,site);
const snapshot='F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json';
const inputs=json(snapshot);assert.equal(inputs.length,5107);
const expected=['tests/anatomy-coverage-revision-admission.test.mjs','tests/current-190-coverage.test.mjs',
 'tests/fixtures/closed485-original/anatomy-coverage-revision-admission.test.mjs.raw',
 'tests/atlas-arterial-evidence-limits.test.mjs','tests/arterial-history-preservation.test.mjs','tests/atlas-guided-camera.test.ts'];
assert.deepEqual(prep.changes.map(r=>r.path).sort(),expected.sort());
const binding=json(site+'/atlas-review/integration-inputs.json');assert.equal(binding.inputs.length,1710);assert.equal(binding.sha256,prep.review);
for(const r of prep.receipts){assert.equal(sha(read(r.file)),r.sha256);const receipt=json(r.file);assert.equal(receipt.code,0);assert.equal(sha(read(receipt.log)),receipt.logSha256);}
function verify(){
 for(const r of inputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 for(const r of binding.inputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 for(const r of prep.changes){assert.equal(sha(read(r.from)),r.sha256);if(r.beforeSha256)assert.equal(sha(read(site+'/'+r.path)),r.beforeSha256);else assert(!fs.existsSync(site+'/'+r.path));}
 assert.equal(runGit(['-C',prep.atlas,'rev-parse','HEAD']).toString().trim(),prep.source);
 assert.equal(runGit(['-C',prep.atlas,'status','--porcelain=v1']).toString().trim(),'');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'98d7f17e2d120b031633e59e47fc50c82d44b2d0');
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 assert.equal(json('F:/VisibleMedicine/website/atlas-review/integration-inputs.json').sha256,'b2bd971b5bfefdd0760f8f3c8785e372276e15dac9cc293ac8fde4cdfb7dcb54');
}verify();
const root='F:/VisibleMedicine/recovery/checkpoints/20261021-revision-guard-proposals-verified';assert(!fs.existsSync(root));fs.mkdirSync(root);
const selected=[];
function copy(from,p){
 assert(!/(^|\/)(?:\.env|\.wrangler|\.local|private|node_modules)(?:\/|$)|\.(?:glb|sqlite|db|jpg|png|dcm|nii)$/i.test(p));
 const bytes=read(from);assert(bytes.length<200000&&!bytes.includes(0));const to=root+'/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,bytes,{flag:'wx'});
 selected.push({path:p,bytes:bytes.length,sha256:sha(bytes)});
}
for(const row of prep.changes){copy(row.from,'proposed-website/'+row.path);if(row.beforeSha256)copy(site+'/'+row.path,'preimages/'+row.path);}
copy(stage+'/PREPARATION.json','evidence/PREPARATION.json');
for(const r of prep.receipts)copy(r.file,'evidence/'+r.label+'.json');
for(const p of ['PREPARATION.json','NEGATIVE_GUARD_PROOF.json','ISOLATED_HISTORY_GUARD.json'])
 copy('F:/VisibleMedicine/staging/20261021-arterial-history-epoch-proposal/'+p,'earlier-guard-only/'+p);
for(const p of ['PREPARATION.json','SOURCE190_HISTORY_GUARD.json'])
 copy('F:/VisibleMedicine/staging/20261021-arterial190-epoch-proposal/'+p,'arterial190/'+p);
copy('F:/VisibleMedicine/staging/20261021-camera-zoom-contract-proposal/PREPARATION.json','camera/PREPARATION.json');
for(const p of ['RESULT.json','PREIMAGE_CLASSIFICATION_V2.json'])copy('F:/VisibleMedicine/staging/20261021-source190-cutover-inventory/'+p,'cutover/'+p);
for(const p of ['prepare-arterial-epoch-proposal-check-20261021.mjs','verify-arterial-proposal-refusals-20261021.mjs',
 'inspect-source190-local-cutover-20261021.mjs','classify-source190-cutover-preimages-20261021.mjs','resolve-source190-installed-preimages-20261021.mjs',
 'prepare-coverage-epoch-native-check-20261021.mjs','prepare-arterial190-epoch-proposal-20261021.mjs','prepare-arterial190-native-witness-20261021.mjs',
 'prepare-camera-zoom-contract-proposal-20261021.mjs','copy-camera-contract-native-check-20261021.mjs',
 'prepare-revision-guard-batch-20261021.mjs','admit-revision-guard-batch-20261021.mjs','checkpoint-revision-guard-proposals-20261021.mjs'])copy(p,'scripts/'+p);
const proof={at:new Date().toISOString(),source:prep.source,review:prep.review,currentWebsiteInputs:5107,proposedWebsiteInputs:5109,
 changes:{existing:4,added:2},boundedNativeRegistrationsPassed:9,boundedNativeSkipped:0,originalHistoricalChildTestsPassed:4,
 countingNote:'Nine outer registrations across four bounded native runs; one wrapper strictly verifies four unchanged original child tests. Distinct units, not one full-suite count.',
 sourcePrefixAndWholeInverses:true,all1710ReviewInputsPreserved:true,candidateEdited:false,canonicalInstalled:false,
 freshTypesRequiredBeforeCutover:true,fullSuiteStillRequiresActualTerminalReceipt:true,originalFullFailureBaseline:144,
 wholeSuitePassingClaim:false,privateDataUploaded:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,
 cutover:{existingPaths:97,knownExactOwnedPreimages:96,remaining:'Previously preserved coverage README; deliberately preserve/merge, no blind overwrite',unchangedModelObjects:137},
 limits:'Test-only proposals, not installed fixes or post-fix full-suite acceptance. Current models, teaching, actual access and user review forms unchanged. No new browser check from these native tests. Earlier source backups remain partial; no model, private-data, raw canonical ancestry or complete runnable-project backup.'};
fs.writeFileSync(root+'/PROOF.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});copy(root+'/PROOF.json','evidence/PROOF.json');
const parentRoot='F:/VisibleMedicine/recovery/checkpoints/20261021-local-storage-loaded-verified-backup',parent=json(parentRoot+'/github-backup.json');
assert(parent.sourceBackupVerified);assert.equal(parent.head,'fd431cc1ea72be76d57fa74c9337252636047a0e');
const values=new Map(json(parentRoot+'/remote-source-restored/.source-backup/manifest.json').files.map(r=>{
 const b=read(parentRoot+'/remote-source-restored/'+r.path);assert.equal(sha(b),r.sha256);return[r.path,b];
}));
for(const row of selected)values.set('evidence/20261021-revision-guard-proposals-verified/'+row.path,read(root+'/'+row.path));
backup({root:root+'-backup',repo:'F:/VisibleMedicine/history/website-work/github-revision-guard-proposals-20261021.git',branch:'backup/revision-guard-proposals-20261021',
 files:[...values].map(([path,b])=>({path,bytes:b.length,sha256:sha(b)})).sort((a,b)=>a.path.localeCompare(b.path)),bytesFor:p=>values.get(p),verifySource:verify,
 sourceIdentity:{atlas:prep.source,review:prep.review,websiteInputCount:5107,proposalOnly:true},parent:parent.head,parentTree:parent.tree,parentRepo:parentRoot+'/independent-readback.git',proof,
 scope:'Six proposed owned test/immutable-original-fixture sources, four exact current test preimages and small explicit proof/control/read-only-cutover metadata on previously filtered ancestry. Proposals NOT installed; fresh types and whole-suite terminal still needed. No scans, masks, private identities/decisions/DB/env, private modules/full manifests, model geometry/full runtimes/dist/dependencies, raw canonical Git ancestry or browser media/DOM. Retained test harness junctions are NOT copied or packaged. Not a complete runnable or private-data backup, public release or clinical/spatial approval.'});
const remote=json(root+'-backup/github-backup.json');
const checkpoint={...proof,stage,site,snapshot,snapshotSha256:sha(read(snapshot)),selectedFiles:selected,
 backup:{receipt:root+'-backup/github-backup.json',receiptSha256:sha(read(root+'-backup/github-backup.json')),head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths},
 nativeFullSuite:{stage:'F:/VisibleMedicine/staging/20261021-source190-complete-suite',sessionId:37113,runnerPid:263984,testPid:271752,
 output:'F:/VisibleMedicine/staging/20261021-source190-website/website/.local/website-test-runs/2026-10-21T05-37-11-497Z-a5ab569e-0361-46d1-91d6-64fd8586c1c0',status:'Revalidate actual handle/receipt; prior observations confirmed live. No restart on timeout.'},
 next:'After genuine full-suite terminal, classify its actual outcome and other failures, run admit-revision-guard-batch-20261021.mjs to emit the guarded V2 patch, apply with apply_patch and verify5109inputs/1710bindings. Focused actual-site tests and fresh TypeScript before local cutover; no public or clinical release. Do not use superseded V1 or the earlier485-only arterial proposal. Preserve all71/eight statuses/baseline.',fullGoalActive:true};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(checkpoint,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),selected:selected.length,head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}));
