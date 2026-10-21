import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const batch='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v10',prep=json(batch+'/PREPARATION.json');
const previous=json('current-matrix-source-checkpoint-20261021.json');
const old=json('F:/VisibleMedicine/staging/20261021-revision-guard-batch-v8/PREPARATION.json');
const oldRows=new Map(old.changes.map(row=>[row.path,row])),files=[];
const add=(from,path)=>{assert(!files.some(row=>row.path===path),path);files.push({from,path});};
for(const row of prep.changes.filter(row=>oldRows.get(row.path)?.sha256!==row.sha256)){
 add(row.from,'proposed-website/'+row.path);
 if(row.beforeSha256)add(prep.site+'/'+row.path,'preimages/'+row.path);
}
for(const [root,label]of [
 ['20261021-clinical-epoch-batch-c-v5-native-proof','BATCH_C_V5_WHOLE_SOURCE'],
 ['20261021-clinical-epoch-batch-e-v6-native-proof','BATCH_E_V6_WHOLE_SOURCE'],
 ['20261021-clinical-epoch-batch-c-v6-native-proof','BATCH_C_V6_WHOLE_SOURCE'],
 ['20261021-clinical-epoch-batch-e-v7-native-proof','BATCH_E_V7_WHOLE_SOURCE'],
 ['20261021-head-neck-pilot-history-native-proof','HEAD_NECK_WHOLE_SOURCE'],
 ['20261021-specimen-playback-history-native-proof','SPECIMEN_WHOLE_SOURCE'],
]){
 const dir='F:/VisibleMedicine/staging/'+root;
 add(dir+'/PREPARATION.json','evidence/'+root+'/PREPARATION.json');
 add(dir+'/'+label+'.json','evidence/'+root+'/receipt.json');
}
for(const [from,p]of [
 ['20261021-current-source-matrix/MATRIX_RESULT.json','FIRST_MATRIX_TERMINAL.json'],
 ['20261021-head-specimen-actual-native/MATRIX_RESULT.json','SPECIMEN_PASS_HEAD_HARNESS_FAILURE.json'],
 ['20261021-head-specimen-actual-native/HARNESS_GIT_CONTEXT.json','HEAD_HARNESS_CONTEXT.json'],
 ['20261021-head-specimen-actual-native/HEAD_PILOT_ACTUAL.json','HEAD_PILOT_ACTUAL.json'],
 ['20261021-current-source-matrix-followup/PREPARATION.json','FIRST_FOLLOWUP_PREPARATION.json'],
 ['20261021-current-source-matrix-followup/MATRIX_RESULT.json','FIRST_FOLLOWUP_TERMINAL.json'],
 ['20261021-current-source-matrix-followup-v2/PREPARATION.json','SECOND_FOLLOWUP_PREPARATION.json'],
 ['20261021-current-source-matrix-followup-v2/STARTED.json','SECOND_FOLLOWUP_STARTED.json'],
 ['20261021-clinical-epoch-batch-c-v6/HANDOFF.md','C6_HANDOFF.md'],
 ['20261021-clinical-epoch-batch-e-v7/HANDOFF.md','E7_HANDOFF.md'],
 ['20261021-clinical-epoch-batch-e-v7/E7_SELECTED_SOURCE_PROBE_RESULT.json','E7_SELECTED_SOURCE_PROBE_RESULT.json'],
 ['20261021-clinical-epoch-batch-e-v7/E7_SELECTED_SOURCE_PROBE.mjs','E7_SELECTED_SOURCE_PROBE.mjs'],
 ['20261021-head-neck-pilot-history-proposal/HANDOFF.md','HEAD_PILOT_HANDOFF.md'],
 ['20261021-specimen-playback-history-proposal/HANDOFF.md','SPECIMEN_HANDOFF.md'],
])add('F:/VisibleMedicine/staging/'+from,'evidence/'+p);
// Preserve exactly the five intermediate subjects whose first followup failed,
// not their runtime trees or large assertion logs.
for(const [folder,names]of [
 ['20261021-clinical-epoch-batch-c-v5',['limb-nerve-quiz','lower-venous-tour-v2']],
 ['20261021-clinical-epoch-batch-e-v6',['neonatal-cranial-us','orbital-apex-ct','orbital-ring-ct']],
])for(const name of names){const p='tests/clinical-review-'+name+'.test.ts';add('F:/VisibleMedicine/staging/'+folder+'/'+p,'first-followup-sources/'+folder+'/'+p);}
add('F:/VisibleMedicine/recovery/historical-assets/sha256/1d5cca6d39e99fc8aa1e8c40b7cd10c10cd2b49654314632b66f4990c17d5fea.js.receipt.json','evidence/LOCAL_HISTORICAL_ASSET_RECEIPT.json');
for(const p of ['prepare-owned-source-guard-harness.mjs','preserve-head-neck-historical-scene-20261021.mjs','attach-head-pilot-harness-git-context-20261021.mjs','prepare-head-specimen-actual-20261021.mjs','prepare-corrected-matrix-followup-20261021.mjs','run-current-source-matrix-20261021.mjs','prepare-revision-guard-batch-v9-20261021.mjs','emit-coordination-checkpoint.mjs','prepare-historical-current-native-checkpoint-20261021.mjs'])add(p,'scripts/'+p);
const parentRoot='F:/VisibleMedicine/recovery/checkpoints/20261021-current-matrix-source-verified-backup',parent=json(parentRoot+'/github-backup.json');
assert.equal(parent.head,'60de7a4bc772532df01dfa1fe158bebcb9c94edd');
const config={...previous,batch,checkpointRoot:'F:/VisibleMedicine/recovery/checkpoints/20261021-historical-current-native-verified',parentRoot,parentHead:parent.head,
 prefix:'evidence/20261021-historical-current-native-verified',backupRepo:'F:/VisibleMedicine/history/website-work/github-historical-current-native-20261021.git',branch:'backup/historical-current-native-20261021',
 expectedBoundedPasses:97,includeProposalSources:false,files,nativeWork:{started:'F:/VisibleMedicine/staging/20261021-current-source-matrix-followup-v2/STARTED.json',result:'F:/VisibleMedicine/staging/20261021-current-source-matrix-followup-v2/MATRIX_RESULT.json'},
 proof:{summary:'Historical/current source-role repair advances without changing the Website/Atlas candidate or owner preview. V10 has85test-only proposed paths,38existing/47new,5154projected inputs; actual5107/Review1710 frozen. Pure original preservation and bounded native receipts total97outer registrations across20distinct successful runs, historical coverage4children separate, not a whole-suite pass. First actual20module matrix33/28pass/5fail and followup5modules10/6pass/4fail are retained. Full orbital-ring historical/current theorem, head-neck4 and specimen playback/356-row2 cases now pass at exact sources. First head harness import failure retained and fixed only by explicit object-store read context; historical scene checksum copied F-local, not uploaded. C6 restores true quiz introduction51de and independently bound628 Website source; E7 selected22-ID probe proves only4tour-backed revision changes,18unchanged packets. The four affected actual modules are running in a source-guarded final followup. Separate40-case Review-return UI remains staged; types/build/browser/cutover still pending. No clinical/spatial/public/full-backup claim.',
 canonicalDeveloperToolingInstalled:true,canonicalDeveloperToolingUnchangedFromParent:true,canonicalAtlasUiInstalled:false,reviewQueueUiInstalled:false,reviewQueueNativePasses:40,
 originalFailureBaselineRetained:144,fullNativeCounts:{tests:5547,pass:5408,fail:136,cancelled:0,skipped:3,todo:0},allNativeFailuresAccountedFor:true,allNativeFailuresResolved:false,baselineComparable:false,
 actualFirstMatrix:{tests:33,pass:28,fail:5},actualFirstFollowup:{tests:10,pass:6,fail:4},headActualPasses:4,specimenActualPasses:2,
 currentSourceUnchanged:true,unchangedModelObjects:137,all71ItemsAndEightIdeasPreserved:true,correctedComponentBrowserAcceptance:false,ownerPreviewPid:260328},
 next:'Read actual current-source-matrix-followup-v2 result/session2551/driver267516/test266844, never restart on wait timeout. At true terminal classify every remaining failure, main-review final source inverses and compose only byte-bound case-level evidence; do not call historical baseline green. Then guarded V10-or-later candidate admission, review-return UI integration, fresh full TypeScript/build and browser Back/reopen acceptance before recoverable local cutover. Preserve exact canonical/coordinator preimages at revision101-or-later, owner drafts/137models/specialist boundaries/full71item8idea roadmap. No clinical-review stall, public deployment/private-data upload or desktopPACS changes.'};
for(const row of files){assert(read(row.from).length<200000,row.from);}
const target='historical-current-native-checkpoint-20261021.json';assert(!fs.existsSync(target));
fs.writeFileSync(target,JSON.stringify(config,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({config:target,selectedPaths:files.length,boundedRegistrations:97,sourceInstalled:false}));
