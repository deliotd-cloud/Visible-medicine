import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';

const base='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const priorPath='F:/VisibleMedicine/staging/20261022-reviewed-source-continuation/PLAN.json';
assert.equal(sha(read(priorPath)),'3ea1ec6220680ce72cc6796925b8066107258cc1fbdd3f5328d2df332901aa71');
const prior=json(priorPath),source=json(prior.sourceReceipt);
const rows=new Map(source.sourceRows.map(row=>[row.path,row]));
assert.equal(sha(read(prior.sourceReceipt)),'49a132ab76102e0fb2845df9ab111047630ecdafc0f0a2e61e81fef70a62a03f');
for(const row of rows.values())assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
const packets=[
 ['20261022-current-head-entrypoint-followups',['clinical-review-median-cubital-xray.test.ts','clinical-review-neonatal-cranial-us.test.ts','batch-c-role-inverse.mjs'],['PROVE_SOURCE.mjs']],
 ['20261022-orbital-check-runtime-followup',['clinical-review-orbital-check-evidence.test.mjs'],['PROOF.mjs','SOURCE_PROOF.mjs']],
 ['20261022-current-head-history-closure',['current-head-index-whole-role-transition-20261021.test.mjs'],['SOURCE_PROOF.mjs','MAIN_TEST_SOURCE_INVERSE.mjs']],
 ['20261022-head-pilot-history-followups',['head-neck-pilot-history-preservation.test.mjs','head-pilot-delivery-role-preservation-20261021.test.mjs'],['PROOF.mjs','MAIN_BYTE_INVERSE.json']],
 ['20261022-salpingopharyngeus-runtime-followup',['salpingopharyngeus-mri-delivery.test.mjs'],['SOURCE_PROOF.json']],
 ['20261022-corpus-ui-current-followups',['corpus-xray-v2-current-delivery.test.mjs','corpus-ui-role-preservation.test.mjs','ui-teaching-current-delivery.test.mjs'],['SOURCE_PROOF.mjs','MAIN_BYTE_INVERSE.json']],
 ['20261022-inferior-thyroid-history-followup',['inferior-thyroid-mra-current-delivery.test.mjs'],['PROOF.mjs','MAIN_BYTE_INVERSE.json']],
 ['20261022-transition-terminal-closure',['deep-plantar-current-transition.test.mjs','head-native-history-current-transition.test.mjs','lacrimal-current-transition.test.mjs','head-history-role-preservation.test.mjs'],['SOURCE_PROOF.mjs']],
 ['20261022-admission-terminal-closure',['radial-eus-current-transition.test.mjs','salpingopharyngeus-integration-register.test.mjs','ui-teaching-admission-contract.test.mjs'],['PROVE_SOURCE.mjs']],
 ['20261022-ui-dependent-source-followups',['ui-teaching-lifecycle-contract.test.mjs','current-delivery-admission-485.test.mjs','head-disclosure-current-delivery.test.mjs'],['MAIN_SOURCE_PROOF.json']],
];
const repairs=new Map(prior.repairs.map(row=>[row.path,row]));
const batches=[...prior.batches],overrides=[];
for(const[name,files,proofNames]of packets){
 const stage='F:/VisibleMedicine/staging/'+name;
 for(const name of files){
  const path='tests/'+name,beforePath=stage+'/RAW/'+path,proposal=stage+'/CODE/'+path;
  assert.equal(sha(read(beforePath)),rows.get(path)?.sha256,path+': exact V5 preimage');
  if(repairs.has(path)){
   assert.equal(path,'tests/batch-c-role-inverse.mjs','Only the reviewed later Batch-C composition may replace selected47 CODE');
   assert.equal(repairs.get(path).proposalSha256,'9430a62ffbdc34903db792d3f81760827063f3b2f82e04737ef5ec7190bb9879');
   assert.equal(sha(read(proposal)),'595daaba750d0f6d6a13aa16986ec47cfb2e6dc188c5328bc808ef05417a101b');
   overrides.push({prior:repairs.get(path),reason:'Complete all-eight current→selected-limb→original source inverse; prior CODE retained.'});
  }
  repairs.set(path,{path,beforePath,beforeSha256:sha(read(beforePath)),proposal,proposalSha256:sha(read(proposal))});
 }
 batches.push({stage,tests:files,actualDiffMainReviewed:true,sourceOnlyNotNativeAcceptance:true,
  proofs:proofNames.map(name=>({path:stage+'/'+name,sha256:sha(read(stage+'/'+name)),mainExecutedExitCode:0}))});
}
const additionalFiles=[...prior.additionalFiles,{path:'tests/ui-current-v5-source-inverse.mjs',
 from:'F:/VisibleMedicine/staging/20261022-ui-dependent-source-followups/CODE/tests/ui-current-v5-source-inverse.mjs',
 sha256:sha(read('F:/VisibleMedicine/staging/20261022-ui-dependent-source-followups/CODE/tests/ui-current-v5-source-inverse.mjs'))}];
assert.equal(repairs.size,68);assert.equal(additionalFiles.length,7);
const allPaths=[...repairs.keys(),...additionalFiles.map(row=>row.path)];
assert.equal(new Set(allPaths).size,75);
const proposedNextNativeRoots=[...new Set([...prior.proposedNextNativeRoots,
 ...[...repairs.keys()].filter(path=>/\.test\.[cm]?[jt]sx?$/.test(path)),
 'tests/head-history-role-preservation.test.mjs','tests/ui-teaching-lifecycle-contract.test.mjs',
])].sort();
for(const path of proposedNextNativeRoots)assert(rows.has(path));
const terminalPath=base+'/native-selected-repairs-v5/TERMINAL.json';
const terminal=json(terminalPath),inventory=json(base+'/native-selected-repairs-v5/TERMINAL_FAILURE_INVENTORY.json');
assert.equal(terminal.terminal,true);assert.deepEqual(terminal.sourceDrift,[]);assert.equal(terminal.counts.fail,31);
assert.equal(sha(read(base+'/native-selected-repairs-v5/child.tap')),terminal.tapSha256);
const diagnoses={
 45:'Licence checkout and independent per-runtime source/Git bytes; exact accepted representation, no blanket normalization.',
 73:'Full later colic source inverse before the unchanged six spinal historical theorems.',
 116:'Complete later regional-quiz→prior→original source composition.',
 144:'Exact Review source and independent historical learner-runtime source, with complete original teaching assertions.',
 147:'Dorsal-hand per-runtime exact source import rather than Review-head substitution.',
 150:'Elbow arterial per-runtime exact source import rather than Review-head substitution.',
 167:'Foot-variant per-runtime exact source import, preserving original quiz refusals.',
 168:'Foot venous-arch per-runtime exact source import; all modality evidence retained.',
 183:'Heading root witness composes authenticated later source before original historical theorem.',
 184:'Same heading witness retains mutation/root refusal after exact source composition.',
 197:'Lacrimal quiz independent current Review and retained runtime sources.',
 198:'Laryngeal framework quiz independent current Review and retained runtime sources.',
 199:'Laryngeal muscle quiz independent current Review and retained runtime sources.',
 204:'Limb nerve current entrypoint and complete all-eight Batch-C source inverse.',
 212:'Median-cubital runtime entrypoint source bound to exact runtime Git, not current head Git.',
 216:'Neonatal runtime entrypoint source bound to exact runtime Git; all ten original drafts retained.',
 220:'Ocular quiz per-runtime source binding; original full historical and refusal proofs retained.',
 224:'Orbital check complete current→V5→original source inverse and exact retained runtime Git.',
 227:'Orbital-support quiz per-runtime source binding; original checks retained.',
 233:'Pectoral ultrasound independent Review and retained runtime Git sources.',
 287:'Full current-head later source inverse before original current-atlas historical theorem.',
 291:'Same six-case historical closure authenticates later atlas190 source before original theorem.',
 294:'All1652 closed50 input rows authenticated;43 later checkout fallbacks use exact hash-equal immutable53 bytes, including whole CSS prefix inverse.',
 320:'Actual current6d7 Review with separate retained190a runtime identities; closed53 remains historical.',
 324:'All1655 closed51 input rows authenticated;44 later checkout fallbacks use exact hash-equal immutable53 bytes, including whole CSS prefix inverse.',
 326:'Complete upper-limb quiz current-source inverse composed before original limb/suprahyoid witness.',
 364:'Exact enumerated later .gitattributes policy seams and full old52 inverse, with three policy mutation refusals.',
 365:'Closed52 schema1 pin uses its frozen validator; strict current schema2 admission remains independent and rejects old pin.',
 367:'Current6d7 source plus exact historical87 tree/ancestry; radial teaching and tongue quiz remain independently asserted.',
 376:'Frozen register43 uses frozen schema1 admission; actual current delivery independently uses unchanged strict schema2 validator.',
 385:'Actual current6d7 source/tree/Review/runtime families;6036,59,509b/f509 remain exact historical witnesses.',
};
const failureReviews=inventory.failures.map(row=>{
 const repair=repairs.get(row.path);assert(repair,'Every actual terminal marker needs a selected repair: '+row.id);
 assert(diagnoses[row.id]);
 return {...row,diagnosis:diagnoses[row.id],repairSha256:repair.proposalSha256,repairPath:repair.proposal,
  mainSourceReviewed:true,nativeAcceptancePending:true};
});
assert.equal(failureReviews.length,31);
const output='F:/VisibleMedicine/staging/20261022-terminal-source-continuation';assert(!fs.existsSync(output));fs.mkdirSync(output);
const result={...prior,at:new Date().toISOString(),previous:priorPath,previousSha256:sha(read(priorPath)),
 phase:'68 source-reviewed repairs plus7 additions; actual31 terminal failures diagnosed; native rerun pending',
 repairs:[...repairs.values()],additionalFiles,batches,overrides,proposedNextNativeRoots,
 sourcePathsAfterFutureOverlay:6049,productionBytesChanged:0,candidateChanged:false,ownerPreviewChanged:false,
 sourceOnlyNotNativeAcceptance:true,proposalCodeSourceBackedUp:false,
 partialNativeObservation:undefined,terminalDiagnosis:{terminal:terminalPath,terminalSha256:sha(read(terminalPath)),counts:terminal.counts,
  failureReviews,unhandledFailureMarkers:[],repairsNotYetNativelyAccepted:true},
 next:'Apply exact source-bound isolated overlay only after the diagnostic-review gate, run selected original/consumer roots and full types, save recovery. Never restart/cut over/refresh the owner preview while its hold remains.'};
fs.writeFileSync(output+'/PLAN.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const review={at:result.at,terminalSha256:sha(read(terminalPath)),tapSha256:terminal.tapSha256,
 selectedPlanSha256:sha(read(output+'/PLAN.json')),mainReviewed:true,unhandledFailureMarkers:[],failureReviews,
 scope:'Source diagnosis and named proposed correction of all31 actual failing markers, not a native rerun/pass or complete regression acceptance.',
 ownerPreviewChanged:false,candidateChanged:false,clinicalApproval:false};
fs.writeFileSync(base+'/native-selected-repairs-v5/DIAGNOSTIC_REVIEW.json',JSON.stringify(review,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({plan:output+'/PLAN.json',sha256:sha(read(output+'/PLAN.json')),repairs:repairs.size,additions:additionalFiles.length,
 nextNativeRoots:proposedNextNativeRoots.length,terminalFailuresReviewed:failureReviews.length,
 diagnosticReviewSha256:sha(read(base+'/native-selected-repairs-v5/DIAGNOSTIC_REVIEW.json')),candidateChanged:false}));
