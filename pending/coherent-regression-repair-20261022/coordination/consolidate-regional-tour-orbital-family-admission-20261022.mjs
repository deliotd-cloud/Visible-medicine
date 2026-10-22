// Select only reviewed CODE and complete CODE preimages; no running/canonical edits.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readdirSync,writeFileSync} from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-regional-tour-orbital-family-consolidated';
assert(!existsSync(root));
const previousPath='F:/VisibleMedicine/staging/20261022-regional-imaging-history-consolidated/QUEUE.json';
assert.equal(sha(read(previousPath)),'69bf8a07fe2b7bee6357169d4ae03127c59958290784ec0de2588eb4795f602b');
const previous=json(previousPath),website=previous.website;
const basePath=website+'/../VERIFIED_SOURCE.json';
assert.equal(sha(read(basePath)),'1b38f47acd68bd9765d442f356a3390bda69f305007887739e03b362b480a9a3');
const base=new Map(json(basePath).sourceRows.map(row=>[row.path,row]));
const packets=[
 {stem:'regional-tour-runtime-family-admission',code:'CODE',raw:'RAW',
  names:['clinical-review-elbow-arterial-tour.test.ts','clinical-review-lower-venous-tour-v2.test.ts','clinical-review-medial-thigh-tour.test.ts','clinical-review-portal-hepatic-tour.test.ts','clinical-review-pulmonary-venous-tour.test.ts','clinical-review-regional-tour.test.ts','elbow-current-lifecycle-preservation.test.mjs','regional-tour-role-preservation-20261021.test.mjs'],
  exclude:['tests/clinical-epoch-batch-c-originals.test.mjs'],proofs:[['SOURCE_PROOF.mjs','dd9244ee0b05d2173cd475377a33455bf7c162eaaaf8f3a16a5510bf790f951e']]},
 {stem:'branch-hip-iliac-hepatic-family-admission',code:'proposal',raw:'original',
  names:['clinical-review-forearm-branch-xray.test.ts','clinical-review-hepatic-arterial-xray.test.ts','clinical-review-hip-muscle-xray.test.ts','clinical-review-iliac-venous-xray.test.ts','clinical-review-intracranial-arterial-xray.test.ts'],
  proofs:[['prove-source.mjs','917602d9916da84cd82d168ddf09ebac7e3b63407f8f5e391a6e40c0dd790e3f']]},
 {stem:'leg-vessel-source-family-admission',code:'CODE',raw:'RAW',names:['clinical-review-leg-arterial-xray.test.ts','clinical-review-leg-venous-xray.test.ts'],proofs:[]},
 {stem:'clinical-batch-c-family-closure',code:'CODE',raw:'RAW',
  names:['clinical-review-limb-nerve-quiz.test.ts','clinical-review-longus-colli-quiz.test.ts','clinical-review-median-cubital-xray.test.ts','clinical-review-mesenteric-vessel-teaching.test.ts','clinical-epoch-batch-c-originals.test.mjs'],
  proofs:[['SOURCE_PROOF.mjs','4570ff52d915fa048603f599ca8ba84fa3b2c48f50b96db89db70ee480c02068']]},
 {stem:'orbital-neonatal-family-admission',code:'proposal',raw:'original',
  names:['clinical-review-neonatal-cranial-us.test.ts','clinical-review-orbital-apex-ct.test.ts','clinical-review-orbital-ring-ct.test.ts','clinical-review-orbital-sensory-mri.test.ts','clinical-review-short-ciliary-quiz.test.ts','clinical-epoch-batch-d-preservation.test.mjs','clinical-question-role-preservation-20261021.test.mjs'],
  proofs:[['prove-source.mjs','52f213e773fb36583c53e454a9c676c4cf0a1b67e978f9d7522edf21713485b2'],['prove-witness-source.mjs','51d6b0996e47fc4900f4c8e9983793655029b638164828591ba5a17fac024246']]},
];
const repairs=[...previous.repairs],additionalFiles=[...previous.additionalFiles],sourceProofs=[...previous.sourceProofs];
function walk(rootPath,relative=''){
 return readdirSync(rootPath+'/'+relative,{withFileTypes:true}).flatMap(item=>{
  const p=relative?relative+'/'+item.name:item.name;
  assert(!item.isSymbolicLink());return item.isDirectory()?walk(rootPath,p):[p];
 });
}
for(const packet of packets){
 const stage='F:/VisibleMedicine/staging/20261022-'+packet.stem,codeRoot=stage+'/'+packet.code;
 const selected=new Set(packet.names.map(n=>'tests/'+n));
 for(const path of selected){
  const beforePath=stage+'/'+packet.raw+'/'+path,proposal=codeRoot+'/'+path;
  const beforeSha256=sha(read(beforePath)),proposalSha256=sha(read(proposal));
  assert.equal(beforeSha256,base.get(path)?.sha256);assert.equal(beforeSha256,sha(read(website+'/'+path)));
  assert.notEqual(proposalSha256,beforeSha256);assert(!repairs.some(row=>row.path===path),'No duplicate selected proposal: '+path);
  repairs.push({path,beforePath,beforeSha256,proposal,proposalSha256,wholeSourceInverse:true,nativeRootRerun:false});
 }
 for(const path of walk(codeRoot)){
  if(selected.has(path)||packet.exclude?.includes(path))continue;
  assert.match(path,/^tests\/(?:[a-z0-9-]+\.mjs|fixtures\/[a-z0-9-]+\/[a-z0-9.-]+\.raw)$/);
  assert(!existsSync(website+'/'+path),'No existing path hidden as an addition');
  assert(!additionalFiles.some(row=>row.path===path),'No duplicate helper/fixture addition');
  const from=codeRoot+'/'+path,bytes=read(from);assert.deepEqual(Buffer.from(bytes.toString()),bytes);
  additionalFiles.push({path,from,sha256:sha(bytes),kind:'Pure source-role inverse adapter or complete authentic CODE preimage'});
 }
 for(const [name,digest] of packet.proofs){
  const script=stage+'/'+name;assert.match(digest,/^[a-f0-9]{64}$/);assert.equal(sha(read(script)),digest);
  sourceProofs.push({script,sha256:digest,mainReadAndExecuted:true,nativeWebsiteModulesExecuted:false});
 }
}
const legProof=json('F:/VisibleMedicine/staging/20261022-leg-vessel-source-family-admission/SOURCE_PROOF_RESULT.json');
assert.equal(legProof.nativeExecuted,false);assert.equal(legProof.wholeOriginalInverses,2);assert.equal(legProof.mutationRefusals,6);
const legScript='verify-leg-vessel-source-family-admission-20261022.mjs';
sourceProofs.push({script:legScript,sha256:sha(read(legScript)),mainReadAndExecuted:true,nativeWebsiteModulesExecuted:false});
assert.equal(repairs.length,124);assert.equal(new Set(repairs.map(r=>r.path)).size,124);
assert.equal(additionalFiles.length,39);assert.equal(new Set(additionalFiles.map(r=>r.path)).size,39);
for(const row of repairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(row.beforePath)),row.beforeSha256);}
const result={at:new Date().toISOString(),website,source:previous.source,review:previous.review,previousQueue:previousPath,previousQueueSha256:sha(read(previousPath)),repairs,additionalFiles,sourceProofs,completeOriginalSourceInverses:124,mainReviewedNewPaths:27,
 originalHistoricalTestsAndTitlesPreserved:true,strictValidatorAndPinUnchanged:true,currentReviewAndRuntimeSourceRolesIndependent:true,
 batchCEightCompleteHistoricalCasesPreserved:true,intermediateBatchCWitnessNotSelected:true,earlierSourceEpochsComposedNotRepinned:true,
 staleWorkerSourceProofRefusedAndReplaced:true,frozenOrCanonicalEdited:false,nativeRootsRerun:false,wholeSuitePassing:false,clinicalApproval:false,publicDeployment:false,sourceBackupIncludesAll124:false,
 next:'Keep actual1143-entry regression and clean Atlas6d7/frozen5811 candidate unchanged until real terminal; retain every diagnostic and finish remaining triage. Then assemble one coherent candidate with all124 selected test/helper proposals and39 CODE additions, run original affected native roots/helpers/types/build/strict refusals sequentially. Full71/eight goal remains active; keep fresh owner draft-safe cutover gate, separate access and specialist/private boundaries. No public deployment, fees, private uploads or desktopPACS changes.'};
mkdirSync(root);writeFileSync(root+'/QUEUE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.pendingRegressionRepairQueue={receipt:root+'/QUEUE.json',sha256:sha(read(root+'/QUEUE.json')),proposedFiles:124,wholeSourceInversesVerified:124,additionalCodeAndProofPaths:39,nativeRootsRerun:false,canonicalInstalled:false,frozenCandidateEdited:false,sourceBackupIncludesThisWholeBatch:false,sourceBackup:pointer.activeWork.regressionRepairSourceBackup,next:result.next};pointer.activeWork.updated=result.at;writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({queue:root+'/QUEUE.json',sha256:sha(read(root+'/QUEUE.json')),proposals:124,newReviewedPaths:27,additionalCodePaths:39,nativeRootsRerun:false}));
