import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,sha,json} from './source-only-backup-20261019.mjs';
const batch='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v8',prep=json(batch+'/PREPARATION.json');
const previous=json('current-epoch-proofs-checkpoint-20261021.json');
const old=json('F:/VisibleMedicine/staging/20261021-revision-guard-batch-v7/PREPARATION.json');
const oldPaths=new Set(old.changes.map(row=>row.path)),files=[];const add=(from,path)=>files.push({from,path});
for(const row of prep.changes.filter(row=>!oldPaths.has(row.path))){add(row.from,'proposed-website/'+row.path);if(row.beforeSha256)add(prep.site+'/'+row.path,'preimages/'+row.path);}
assert.equal(prep.changes.length-old.changes.length,36);
for(const [root,label]of [
 ['F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-c-v4-native-proof','BATCH_C_V4_WHOLE_SOURCE'],
 ['F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-e-v5-native-proof','BATCH_E_V5_WHOLE_SOURCE'],
]){const name=root.split('/').at(-1);add(root+'/PREPARATION.json','evidence/'+name+'/PREPARATION.json');add(root+'/'+label+'.json','evidence/'+name+'/receipt.json');}
add('F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-e-v4-native-proof/BATCH_E_V4_WHOLE_SOURCE.json','evidence/E4_FIRST_FAILURE.json');
add('F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-e-v5-native-proof/BINDING_RECONSTRUCTION.json','evidence/RENDERER_RECONSTRUCTION.json');
for(const [from,p]of [
 ['F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-c-v4/HANDOFF.md','C4_HANDOFF.md'],
 ['F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-e-v5/HANDOFF.md','E5_HANDOFF.md'],
 ['F:/VisibleMedicine/staging/20261021-source190-complete-suite/TERMINAL.json','COMPLETE_NATIVE_TERMINAL.json'],
 ['F:/VisibleMedicine/staging/20261021-source190-complete-suite/TERMINAL_FAILURE_CLASSIFICATION.json','COMPLETE_NATIVE_FAILURE_CLASSIFICATION.json'],
 ['F:/VisibleMedicine/staging/20261021-complete-suite-tail-triage/TRIAGE.json','REMAINING_FIRST_FAILURE_TRIAGE.json'],
 ['F:/VisibleMedicine/staging/20261021-complete-suite-tail-triage/HANDOFF.md','REMAINING_FIRST_FAILURE_HANDOFF.md'],
 ['F:/VisibleMedicine/staging/20261021-current-source-matrix/PREPARATION.json','CURRENT_MATRIX_PREPARATION.json'],
 ['F:/VisibleMedicine/staging/20261021-current-source-matrix/STARTED.json','CURRENT_MATRIX_STARTED.json'],
])add(from,'evidence/'+p);
for(const p of ['prepare-revision-guard-batch-v8-20261021.mjs','admit-revision-guard-batch-20261021.mjs','prepare-owned-source-guard-harness.mjs','prepare-current-source-matrix-20261021.mjs','run-current-source-matrix-20261021.mjs','record-source190-terminal-triage-20261021.mjs','verify-9f-renderer-reconstruction-20261021.mjs','checkpoint-owned-proposal-batch.mjs','prepare-current-matrix-checkpoint-20261021.mjs'])add(p,'scripts/'+p);
const parentRoot='F:/VisibleMedicine/recovery/checkpoints/20261021-current-epoch-proofs-verified-backup',parent=json(parentRoot+'/github-backup.json');assert.equal(parent.head,'e907bb45af7308746183ed9a53c95bdca24f64d7');
const config={...previous,batch,checkpointRoot:'F:/VisibleMedicine/recovery/checkpoints/20261021-current-matrix-source-verified',parentRoot,parentHead:parent.head,prefix:'evidence/20261021-current-matrix-source-verified',backupRepo:'F:/VisibleMedicine/history/website-work/github-current-matrix-source-20261021.git',branch:'backup/current-matrix-source-20261021',expectedBoundedPasses:66,includeProposalSources:false,files,
 nativeWork:{started:'F:/VisibleMedicine/staging/20261021-current-source-matrix/STARTED.json',result:'F:/VisibleMedicine/staging/20261021-current-source-matrix/MATRIX_RESULT.json'},
 proof:{summary:'Genuine full native source190 run TERMINAL5547tests/5408pass/136fail/3skip/0cancelled, no frozen-source or preview-asset drift. Every136failure individually accounted for:45covered by staged V8 paths,91first-failure diagnoses in67other modules, NOT resolved or permission to repin. V8 has74test-only proposed paths/35existing/39new/projected5146inputs; actual source5107/Review1710 unchanged. C4 source inverse1 and E5guards10pass; V8total66bounded outer registrations across13distinct runs,4coverage historical children separate. E4first9pass/1fail retained: RegExp.test was mistaken for a Node registration; only new guard corrected. Renderer729B metadata reconstructs206963B exact independent old artifact locally; full renderer/dependency manifest excluded. Main-owned isolated20-module current matrix is executing source/Review/emitted-teaching/corpus/refusal proofs. It is not whole-suite green, application install or clinical/spatial approval.',
 canonicalDeveloperToolingInstalled:true,canonicalDeveloperToolingUnchangedFromParent:true,canonicalAtlasUiInstalled:false,reviewQueueUiInstalled:false,reviewQueueNativePasses:40,correctedComponentBrowserAcceptance:false,fullNativeCounts:{tests:5547,pass:5408,fail:136,cancelled:0,skipped:3,todo:0},allNativeFailuresAccountedFor:true,allNativeFailuresResolved:false,originalFailureBaselineRetained:144,baselineComparable:false,sourceCandidateAndReviewBindingsUnchanged:true,unchangedModelObjects:137,all71ItemsAndEightIdeasPreserved:true,focusedMatrixSession:55850,focusedMatrixDriver:278608,focusedMatrixTestPid:259616,ownerPreviewPid:260328},
 next:'Revalidate actual matrix55850/278608/259616/result; do not rerun whole complete suite or restart on observation timeout. On genuine matrix terminal inspect every actual failure and input guard, then admit only source-bound verified changes; unresolved historical cases stay explicit. Finish main risk review of independent head-neck asset and specimen playback proposals. Complete strict current module gates, actual-site tests/fresh types/build and real browser review-return acceptance before recoverable owner-preview cutover. Recompute final named input/preimage plan at current coordinator revision100-or-later, preserve owner drafts/specialist boundaries/137models, all71items/eightideas/full goal. No private/full-runtimes/raw-Git-history uploads, public deployment, desktopPACS or approvals.'};
const target='current-matrix-source-checkpoint-20261021.json';assert(!fs.existsSync(target));fs.writeFileSync(target,JSON.stringify(config,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({config:target,selectedDeltaPaths:files.length,verifiedBoundedRegistrations:66,nativeFullAllGreen:false}));
