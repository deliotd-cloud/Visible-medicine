import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const previous='F:/VisibleMedicine/staging/20261022-native-runtime-followups-consolidated/PLAN.json';
assert.equal(sha(read(previous)),'e46623e9018cf718ca2dcfacb0f9d9f06cff867870b19ea8c8d094a5446047f1');
const prior=json(previous),source=json(prior.sourceReceipt),rows=new Map(source.sourceRows.map(row=>[row.path,row]));
assert.equal(sha(read(prior.sourceReceipt)),'49a132ab76102e0fb2845df9ab111047630ecdafc0f0a2e61e81fef70a62a03f');
for(const row of rows.values())assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
const prefix='F:/VisibleMedicine/staging/';
const packets=[
 {name:'20261022-laryngeal-hand-elbow-runtime-followup',files:[
  'clinical-review-cranial-teaching-batch.test.ts','clinical-review-dorsal-hand-ultrasound.test.ts',
  'clinical-review-elbow-arterial-ultrasound.test.ts','clinical-review-foot-variant-quiz.test.ts',
  'clinical-review-foot-venous-arch-imaging.test.ts','next-five-admission-contract.test.mjs','next-six-admission-contract.test.mjs'],
  proofs:['SOURCE_PROOF.mjs','ORIGINAL_THEOREM_PROOF.mjs','SOURCE_CLOSURE.mjs']},
 {name:'20261022-six-remaining-clinical-runtime-followup',files:[
  'clinical-review-lacrimal-quiz.test.ts','clinical-review-laryngeal-muscle-quiz.test.ts',
  'clinical-review-laryngeal-framework-quiz.test.ts','clinical-review-ocular-support-quiz.test.ts',
  'clinical-review-orbital-support-quiz.test.ts','clinical-review-pectoral-ultrasound.test.ts',
  'clinical-current-quiz-preservation.test.mjs','clinical-current-imaging-preservation.test.mjs'],
  proofs:['SOURCE_PROOF.mjs','SOURCE_CLOSURE.mjs']},
 {name:'20261022-desktop-frame-history-followup',files:[
  'desktop-learning-row-history.test.mjs','drawable-epoch-current-admission.test.mjs'],
  proofs:['SOURCE_PROOF.mjs','ROWS_PROOF.mjs'],
  limits:'Initial colic two-row-only proposal is a retained predecessor, not the selected final colic proof.'},
 {name:'20261022-limb-nerve-entrypoint-followup',files:[
  'clinical-review-limb-nerve-quiz.test.ts','batch-c-role-inverse.mjs'],proofs:['PROVE_SOURCE.mjs'],mainEvidence:'MAIN_SOURCE_PROOF.json'},
 {name:'20261022-heading-root-history-followup',files:[
  'clinical-review-git-root-preservation.test.mjs','salivary-cache-guard-adaptation.test.mjs','salivary-current-family-inverse.mjs'],
  proofs:['SOURCE_PROOF.mjs'],limits:'Only the dependent current-head salivary case was executed source-only; five unrelated epochs still need native diagnosis.'},
 {name:'20261022-colic-complete-source-followup',files:['colic-adapter-inverse.test.mjs'],
  additions:['colic-later-source-inverse.mjs'],proofs:['PROVE_SOURCE.mjs'],mainEvidence:'MAIN_SOURCE_PROOF.json'},
];
const repairs=[...prior.repairs],additionalFiles=[...prior.additionalFiles],batches=[...prior.batches];
for(const packet of packets){
 const stage=prefix+packet.name;
 for(const name of packet.files){
  const path='tests/'+name,beforePath=stage+'/RAW/'+path,proposal=stage+'/CODE/'+path;
  assert.equal(sha(read(beforePath)),rows.get(path)?.sha256,path+': exact V5 preimage');
  repairs.push({path,beforePath,beforeSha256:sha(read(beforePath)),proposal,proposalSha256:sha(read(proposal))});
 }
 for(const name of packet.additions??[]){
  const path='tests/'+name,from=stage+'/CODE/'+path;assert(!rows.has(path));
  additionalFiles.push({path,from,sha256:sha(read(from))});
 }
 batches.push({stage,tests:packet.files,proofs:packet.proofs.map(name=>({path:stage+'/'+name,sha256:sha(read(stage+'/'+name)),mainExecutedExitCode:0})),
  mainEvidence:packet.mainEvidence?{path:stage+'/'+packet.mainEvidence,sha256:sha(read(stage+'/'+packet.mainEvidence))}:null,
  actualDiffMainReviewed:true,sourceOnlyNotNativeAcceptance:true,limits:packet.limits??null});
}
assert.equal(repairs.length,47);assert.equal(additionalFiles.length,6);
assert.equal(new Set([...repairs,...additionalFiles].map(row=>row.path)).size,53);
const coveragePath=prefix+'20261022-original-failure-coverage-triage/EVIDENCE.json';
assert.equal(sha(read(coveragePath)),'ad541955eb85b193fff4049d2b8f5e700ac0da3737c8eb76743bea15089d1c96');
const coverage=json(coveragePath);
const proposedNextNativeRoots=[...new Set([...prior.proposedNextNativeRoots,
 ...repairs.map(row=>row.path).filter(path=>/\.test\.[cm]?[jt]sx?$/.test(path)),
 ...coverage.entries.map(row=>row.path).filter(path=>/\.test\.[cm]?[jt]sx?$/.test(path)),
 'tests/atlas-paused-tour-imaging.test.ts','tests/clinical-epoch-batch-c-originals.test.mjs',
 'tests/current-head-index-whole-role-transition-20261021.test.mjs','tests/atlas190-current-delivery.test.mjs',
])].sort();
for(const path of proposedNextNativeRoots)assert(rows.has(path),path);
const base=source.website.slice(0,-'/website'.length);
const tap=read(base+'/native-selected-repairs-v5/child.tap').toString('utf8');
const partialMarkers=[...tap.matchAll(/^not ok (\d+) - (.+)$/gm)].map(match=>{
 const block=tap.slice(match.index,match.index+2000),location=block.match(/^  location: '([^']+)'/m)?.[1]?.replace(/\\+/g,'/');
 const relative=location?.match(/\/(tests\/.+?):\d+:\d+$/)?.[1];
 return {id:Number(match[1]),title:match[2],path:relative??null,selectedRepair:repairs.some(row=>row.path===relative)};
});
const terminal=base+'/native-selected-repairs-v5/TERMINAL.json';
const pointer=json('CURRENT_CHECKPOINT.json');
assert.equal(pointer.activeWork.current.ownerPreviewPolicy.websiteCutoverPermitted,false);
const result={...prior,at:new Date().toISOString(),previous,previousSha256:sha(read(previous)),repairs,additionalFiles,batches,
 proposedNextNativeRoots,phase:'47 source-reviewed repairs plus6 additions; candidate unchanged; native verification pending',
 sourceOnlyNotNativeAcceptance:true,sourcePathsAfterFutureOverlay:6048,
 originalFailureCoverage:{receipt:coveragePath,sha256:sha(read(coveragePath)),originalFailingPaths:224,
  previouslyUnselectedFiles:33,additionalStandaloneRoots:32,helperCoveredByUnchangedImporter:'tests/atlas-paused-tour-imaging-checks.mjs -> tests/atlas-paused-tour-imaging.test.ts',
  rootSelectionDoesNotProvePass:true,transitiveImportClosureNotClaimed:true},
 partialNativeObservation:{at:new Date().toISOString(),terminal:fs.existsSync(terminal),markers:partialMarkers,notTerminalTotals:true},
 rejectedPausedProposal:{path:prefix+'20261022-paused-tour-runtime-followup/PROPOSAL.json',sha256:sha(read(prefix+'20261022-paused-tour-runtime-followup/PROPOSAL.json')),
  reason:'V5 already has the current runtime-family fix from161queue; new fifth test is redundant, not a demonstrated V5 repair. Preserve diagnostic proposal; rerun unchanged importer.'},
 desktopColicInitialPredecessorPreserved:true,completeColic13SourceRowsMainExecuted:true,
 sharedPinAndValidatorsUnchanged:true,productionBytesChanged:0,candidateChanged:false,ownerPreviewChanged:false,
 proposalCodeSourceBackedUp:false,ownerPreviewPolicy:pointer.activeWork.current.ownerPreviewPolicy,
 supersedesPreparers:['prepare-native-source-followups-20261022.mjs','prepare-review-tour-followups-20261022.mjs'],
 preparer:'prepare-reviewed-source-followups-20261022.mjs',
 next:'Keep V5 immutable until actual172-root terminal. Review every later failure, then select/coherently overlay exact source proposals and run all named original/consumer roots plus types. No normal-preview restart/cutover/tab refresh; wait for new owner instruction. Preserve full71/eight, source/runtime roles, all historical/refusal assertions, original failure baselines, independent access and private/specialist boundaries. Source proofs and root selection are not native, whole-suite, clinical, public or spatial acceptance.'};
const output=prefix+'20261022-reviewed-source-continuation';assert(!fs.existsSync(output));fs.mkdirSync(output);
fs.writeFileSync(output+'/PLAN.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
pointer.activeWork.current={...pointer.activeWork.current,at:result.at,followupPlan:output+'/PLAN.json',
 followupPlanSha256:sha(read(output+'/PLAN.json')),proposalCodeSourceBackedUp:false,repairs:47,additions:6,
 nextNativeRoots:proposedNextNativeRoots.length,partialNativeObservation:result.partialNativeObservation,
 originalFailureCoverage:result.originalFailureCoverage,next:result.next};
pointer.activeWork.updated=result.at;fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({receipt:output+'/PLAN.json',sha256:sha(read(output+'/PLAN.json')),repairs:47,additions:6,
 nextNativeRoots:proposedNextNativeRoots.length,partialFailures:partialMarkers.length,currentlyUnselectedMarkerPaths:partialMarkers.filter(row=>!row.selectedRepair),candidateChanged:false}));
