import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,sha,json} from './source-only-backup-20261019.mjs';
const batch='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v7';
const prep=json(batch+'/PREPARATION.json'),old=json('F:/VisibleMedicine/staging/20261021-revision-guard-batch-v5/PREPARATION.json');
const previous=json('review-return-proposal-checkpoint-20261021.json');
const files=[];const add=(from,path)=>files.push({from,path});
const previousPaths=new Set(old.changes.map(row=>row.path));
for(const row of prep.changes.filter(row=>!previousPaths.has(row.path))){
 add(row.from,'proposed-website/'+row.path);
 if(row.beforeSha256)add(prep.site+'/'+row.path,'preimages/'+row.path);
}
assert.equal(prep.changes.length-old.changes.length,15);
for(const root of ['F:/VisibleMedicine/staging/20261021-clinical-girdle-history-native-proof','F:/VisibleMedicine/staging/20261021-clinical-desktop-epoch-native-proof','F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-d-native-proof']){
 const name=root.split('/').at(-1);add(root+'/PREPARATION.json','evidence/'+name+'/PREPARATION.json');
 const receipt=prep.receipts.find(row=>row.file.startsWith(root+'/'));assert(receipt);add(receipt.file,'evidence/'+name+'/receipt.json');
}
for(const p of ['prepare-clinical-girdle-history-proof-20261021.mjs','prepare-clinical-desktop-epoch-proof-20261021.mjs','prepare-clinical-batch-d-proof-20261021.mjs','prepare-revision-guard-batch-v6-20261021.mjs','prepare-revision-guard-batch-v7-20261021.mjs','admit-revision-guard-batch-20261021.mjs','prepare-current-epoch-checkpoint-20261021.mjs'])add(p,'scripts/'+p);
add('F:/VisibleMedicine/staging/20261021-clinical-girdle-history-epoch-proposal/HANDOFF.md','evidence/GIRDLE_HANDOFF.md');
add('F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-d/HANDOFF.md','evidence/BATCH_D_HANDOFF.md');
add('F:/VisibleMedicine/staging/20261021-ultrasound-rights-candidate/SEARCH_SCREENING.json','rights-candidates/SEARCH_SCREENING.json');
const parentRoot='F:/VisibleMedicine/recovery/checkpoints/20261021-review-return-proposal-verified-backup';
const parent=json(parentRoot+'/github-backup.json');assert.equal(parent.head,'2ff71885ec8b8aab14c66408a6a155e9b138171a');
const config={...previous,batch,checkpointRoot:'F:/VisibleMedicine/recovery/checkpoints/20261021-current-epoch-proofs-verified',parentRoot,parentHead:parent.head,prefix:'evidence/20261021-current-epoch-proofs-verified',backupRepo:'F:/VisibleMedicine/history/website-work/github-current-epoch-proofs-20261021.git',branch:'backup/current-epoch-proofs-20261021',expectedBoundedPasses:55,includeProposalSources:false,files,
 proof:{summary:'Seventeen new bounded native checks pass in three distinct runs:7 desktop metadata/layout,5 girdle/Git-root whole-source inverses,3 batch-D exact historical inverses and2 actual-source controlled model-inspection cases. V7 has38test-only proposed paths,22existing/16new,projected5123inputs. Source candidate5107/1710 stays frozen. Fifty-five outer native registrations across11 distinct runs plus4 coverage historical children are not a whole-suite result; UI40 is a separate already-verified scope. Expensive current dental/spinal,girdle,elbow/forearm,orbital sensory and pancreatic actual teaching modules remain unrun and explicitly gate admission. New C/E worker proposals remain separate, incomplete and unadmitted. No learner/UI/runtime/model/auth/clinical edits or owner refresh.',canonicalDeveloperToolingInstalled:true,canonicalDeveloperToolingUnchangedFromParent:true,canonicalAtlasUiInstalled:false,reviewQueueUiInstalled:false,reviewQueueNativePasses:40,correctedComponentBrowserAcceptance:false,sourceCandidateAndReviewBindingsUnchanged:true,unchangedModelObjects:137,all71ItemsAndEightIdeasPreserved:true,fullSuiteSession:37113,runnerPid:263984,testPid:271752,ownerPreviewPid:260328,fullSuitePrefixFailureMarkersAtObservation:60,countingNote:'60 is a buffered prefix observation, not final counts and not a reduction of the original144-failure baseline. V7 is a proposal batch only. New screening metadata rejects Commons-footer false positives; no image or other asset acquired, accepted or installed.'},
 next:'Keep the identical native37113 run/source5107/Review1710 intact. Finish C/E handoffs and preserve exact immutable historical/current proofs; classify every genuine terminal failure before admission. Run all required actual current modules after the heavy slot releases, then actual-site checks/fresh full types and real browser acceptance for the separate40-case review-return UI. Measure exact later named inputs and regenerate guarded recoverable cutover plan with current coordinator and canonical preimages, specialist ownership and open-draft protection. No public release/private upload/desktopPACS/clinical approval.'};
const target='current-epoch-proofs-checkpoint-20261021.json';assert(!fs.existsSync(target));fs.writeFileSync(target,JSON.stringify(config,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({config:target,sha256:sha(read(target)),selectedDeltaFiles:files.length,expectedBoundedPasses:55,applicationInstalled:false}));
