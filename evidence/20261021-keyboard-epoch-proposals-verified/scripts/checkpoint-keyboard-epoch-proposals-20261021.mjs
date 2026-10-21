import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {backup,read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v3',prep=json(stage+'/PREPARATION.json');
const suite='F:/VisibleMedicine/staging/20261021-source190-complete-suite',snapshot=suite+'/SOURCE_INPUTS.json';
const inputs=json(snapshot),binding=json(prep.site+'/atlas-review/integration-inputs.json');
assert.equal(inputs.length,5107);assert.equal(binding.inputs.length,1710);assert.equal(binding.sha256,prep.review);
assert.equal(prep.changes.length,8);assert.equal(prep.changes.filter(r=>!r.beforeSha256).length,2);
for(const row of prep.receipts){assert.equal(sha(read(row.file)),row.sha256);const value=json(row.file);assert.equal(value.code,0);assert.equal(sha(read(value.log)),value.logSha256);}
function verify(){
 for(const row of inputs)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path);
 for(const row of binding.inputs)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path);
 for(const row of prep.changes){assert.equal(sha(read(row.from)),row.sha256,row.path);if(row.beforeSha256)assert.equal(sha(read(prep.site+'/'+row.path)),row.beforeSha256,row.path);else assert(!fs.existsSync(prep.site+'/'+row.path));}
 assert.equal(runGit(['-C',prep.atlas,'rev-parse','HEAD']).toString().trim(),prep.source);
 assert.equal(runGit(['-C',prep.atlas,'status','--porcelain=v1']).toString().trim(),'');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'98d7f17e2d120b031633e59e47fc50c82d44b2d0');
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 assert.equal(json('F:/VisibleMedicine/website/atlas-review/integration-inputs.json').sha256,'b2bd971b5bfefdd0760f8f3c8785e372276e15dac9cc293ac8fde4cdfb7dcb54');
}verify();
const merge='F:/VisibleMedicine/staging/20261021-coverage-prose-merge',mergePrep=json(merge+'/PREPARATION.json');
assert.equal(sha(read(merge+'/README.md')),mergePrep.proposedSha256);assert.equal(sha(read(mergePrep.target)),mergePrep.beforeSha256);
const root='F:/VisibleMedicine/recovery/checkpoints/20261021-keyboard-epoch-proposals-verified';assert(!fs.existsSync(root));fs.mkdirSync(root);
const selected=[];
function copy(from,p){
 assert(!/(^|\/)(?:\.env|\.wrangler|\.local|private|node_modules)(?:\/|$)|\.(?:glb|sqlite|db|jpg|png|dcm|nii)$/i.test(p));
 const bytes=read(from);assert(bytes.length<200000&&!bytes.includes(0));const to=root+'/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,bytes,{flag:'wx'});selected.push({path:p,bytes:bytes.length,sha256:sha(bytes)});
}
for(const row of prep.changes.filter(row=>/atlas-(?:keyboard-modules|label-keyboard)\.test\.ts$/.test(row.path))){copy(row.from,'proposed-website/'+row.path);copy(prep.site+'/'+row.path,'preimages/'+row.path);}
copy(stage+'/PREPARATION.json','evidence/BATCH_V3.json');
for(const prefix of ['20261021-keyboard-epoch-native-proof','20261021-keyboard-epoch-native-proof-v2']){
 const dir='F:/VisibleMedicine/staging/'+prefix;for(const name of ['PREPARATION.json',prefix.endsWith('-v2')?'KEYBOARD_CURRENT_HISTORY_V2.json':'KEYBOARD_CURRENT_HISTORY.json'])copy(dir+'/'+name,'evidence/'+prefix+'/'+name);
}
for(const p of ['PREPARATION.json','README.md','canonical-before.raw','candidate-before.raw'])copy(merge+'/'+p,'coverage-prose/'+p);
copy('F:/VisibleMedicine/staging/20261021-native-test-cost-audit/AUDIT.md','evidence/NATIVE_COST_AUDIT.md');
copy('F:/VisibleMedicine/staging/20261021-keyboard-epoch-proposal/v2/HANDOFF.md','evidence/KEYBOARD_HANDOFF_V2.md');
for(const p of ['prepare-keyboard-native-proof-20261021.mjs','prepare-keyboard-native-proof-v2-20261021.mjs','prepare-revision-guard-batch-v3-20261021.mjs','prepare-coverage-prose-merge-20261021.mjs','admit-revision-guard-batch-20261021.mjs','checkpoint-keyboard-epoch-proposals-20261021.mjs'])copy(p,'scripts/'+p);
for(const id of [263984,271752,260328])process.kill(id,0);
const proof={at:new Date().toISOString(),source:prep.source,review:prep.review,namedInputs:5107,proposedNamedInputs:5109,reviewInputs:1710,
 testOnlyPaths:8,existingTestChanges:6,newCurrentTestOrOriginalFixturePaths:2,boundedNativeRegistrationsPassed:15,originalHistoricalChildTestsPassed:4,
 countingNote:'Fifteen outer native registrations across five separate successful runs; one wrapper additionally proves four unchanged historical children. Not a single post-fix whole-suite result. First six-case keyboard proposal failed4/passed2 and is retained.',
 completeOriginalKeyboardSourcesReconstructed:prep.wholeOriginalKeyboardSourcesReconstructed,
 proseMerge:{proposalOnly:true,exactCanonicalHistoricalTextRetained:true,preimageSha256:mergePrep.beforeSha256,proposedSha256:mergePrep.proposedSha256,required:'Apply only as part of source190 runtime/Review/coverage cutover, not before'},
 nativeEfficiency:{readOnlyAuditOnly:true,benchmarkPerformed:false,speedupClaim:false,proposal:'Measure repeated per-file historical/current bundle transforms before adopting in-process byte reuse; preserve fresh module state and all assertions.'},
 originalFullFailureBaseline:144,fullSuiteRunningAtObservation:true,fullSuiteSession:37113,runnerPid:263984,testPid:271752,ownerPreviewPid:260328,
 candidateChanged:false,canonicalInstalled:false,ownerPagesTouched:false,freshTypesRequired:true,fullSuitePassingClaim:false,
 unchangedModelObjects:137,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,privateDataUploaded:false,fullGoalActive:true};
fs.writeFileSync(root+'/PROOF.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});copy(root+'/PROOF.json','evidence/PROOF.json');
const parentRoot='F:/VisibleMedicine/recovery/checkpoints/20261021-revision-guard-proposals-verified-backup',parent=json(parentRoot+'/github-backup.json');
assert(parent.sourceBackupVerified);assert.equal(parent.head,'dedae72693175b5fda9c01d87642392a736730be');
const values=new Map(json(parentRoot+'/remote-source-restored/.source-backup/manifest.json').files.map(row=>{const bytes=read(parentRoot+'/remote-source-restored/'+row.path);assert.equal(sha(bytes),row.sha256);return[row.path,bytes];}));
for(const row of selected)values.set('evidence/20261021-keyboard-epoch-proposals-verified/'+row.path,read(root+'/'+row.path));
backup({root:root+'-backup',repo:'F:/VisibleMedicine/history/website-work/github-keyboard-epoch-proposals-20261021.git',branch:'backup/keyboard-epoch-proposals-20261021',
 files:[...values].map(([path,bytes])=>({path,bytes:bytes.length,sha256:sha(bytes)})).sort((a,b)=>a.path.localeCompare(b.path)),bytesFor:p=>values.get(p),verifySource:verify,
 sourceIdentity:{atlas:prep.source,review:prep.review,websiteInputCount:5107,proposalOnly:true},parent:parent.head,parentTree:parent.tree,parentRepo:parentRoot+'/independent-readback.git',proof,
 scope:'Two additional owned test-source proposals and exact preimages, source190 prose merge preserving all canonical historical text, eight-path batch proof, native test receipts and small explicit controls/read-only cost audit on previously filtered ancestry. NOT installed. No private records/DB/env/scans/masks, model geometry/full runtimes/private modules/full manifests, raw canonical ancestry, dependencies, browser media or DOM. Harness junctions are never packaged. Not a complete runnable/private backup, public release or clinical/spatial approval.'});
const remote=json(root+'-backup/github-backup.json');
const checkpoint={...proof,stage,site:prep.site,snapshot,snapshotSha256:sha(read(snapshot)),selectedFiles:selected,
 backup:{receipt:root+'-backup/github-backup.json',receiptSha256:sha(read(root+'-backup/github-backup.json')),head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths},
 next:'Revalidate actual full-suite37113 handle/terminal receipt, keep5107inputs frozen. Once genuinely terminal, classify all failures; V3 supersedesV2/V1 and its controller guards all original inputs/1710bindings and eight exact proposed paths before emitting apply_patch. Then verify5109inputs, focused actual-site tests and fresh TypeScript. Coherent local cutover preserves/merges coverage prose from its exact preimage. No automatic public/clinical release; preserve71items/eightideas and original144baseline.'};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(checkpoint,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),selected:selected.length,head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}));
