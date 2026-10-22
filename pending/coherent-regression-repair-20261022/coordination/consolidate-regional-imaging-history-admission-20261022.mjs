import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-regional-imaging-history-consolidated';assert(!existsSync(root));
const previousPath='F:/VisibleMedicine/staging/20261022-guided-clinical-shared-consolidated/QUEUE.json';
assert.equal(sha(read(previousPath)),'31565e5a62ea302bf4c6b05afdf7391658d511b126f1fed7cae99b47b6e889df');
const previous=json(previousPath),website=previous.website;
const basePath=website+'/../VERIFIED_SOURCE.json';assert.equal(sha(read(basePath)),'1b38f47acd68bd9765d442f356a3390bda69f305007887739e03b362b480a9a3');
const base=new Map(json(basePath).sourceRows.map(row=>[row.path,row]));
const packets=[
 {stem:'clinical-study-tour-face-family-admission',code:'CODE',raw:'RAW',proof:'SOURCE_PROOF.mjs',
  names:['clinical-review-desktop-study-identity.test.ts','clinical-review-guided-learning.test.ts','clinical-review-digestive-tract-tour.test.ts','clinical-review-facial-bone-xray.test.ts','next-six-admission-contract.test.mjs'],
  extras:['tests/next-six-family-source-adapter.mjs','tests/fixtures/next-six-family-current/clinical-review-digestive-tract-tour.test.ts.raw','tests/fixtures/next-six-family-current/clinical-review-facial-bone-xray.test.ts.raw']},
 {stem:'clinical-femoral-girdle-family-admission',code:'proposal',raw:'original',proof:'prove-inverse.mjs',
  names:['clinical-review-femoral-arterial-xray.test.ts','clinical-review-femoral-venous-xray.test.ts','clinical-review-girdle-muscle-xray.test.ts','clinical-review-femoral-arterial-admission-56-closed.test.mjs','clinical-review-femoral-venous-admission-56-closed.test.mjs','clinical-review-girdle-history-preservation.test.mjs'],
  extras:['tests/clinical-family-prior-current-inverse.mjs','tests/fixtures/clinical-review-femoral-arterial-xray.test.ts.prior-current.raw','tests/fixtures/clinical-review-femoral-venous-xray.test.ts.prior-current.raw','tests/fixtures/clinical-review-girdle-muscle-xray.test.ts.prior-current.raw']},
 {stem:'genicular-family-current-admission',code:'proposal',raw:'original',proof:'prove-inverse.mjs',names:['clinical-review-genicular-ultrasound.test.ts','genicular-current-preservation.test.mjs'],
  extras:['tests/genicular-prior-current-inverse.mjs','tests/fixtures/clinical-review-genicular-ultrasound.prior-current.ts.raw']},
 {stem:'imaging-status-navigation-epoch-admission',code:'CODE',raw:'RAW',proof:'SOURCE_PROOF.mjs',names:['clinical-review-imaging-status.test.ts','historical-navigation-43-epoch.mjs'],extras:['tests/imaging-status-body-source-inverse.mjs']},
 {stem:'elbow-forearm-current-epoch-admission',code:'CODE',raw:'RAW',proof:'SOURCE_PROOF.mjs',names:['clinical-review-elbow-us-followup.test.ts','clinical-review-forearm-vascular-xray.test.ts','elbow-us-followup-preservation.test.mjs','forearm-xray-preservation.test.mjs'],
  extras:['tests/current-epoch-source-adapter.mjs','tests/fixtures/current-epoch-prior/clinical-review-elbow-us-followup.test.ts.raw','tests/fixtures/current-epoch-prior/clinical-review-forearm-vascular-xray.test.ts.raw']},
];
const additions=[],extras=[],proofs=[];
for(const packet of packets){
 const stage='F:/VisibleMedicine/staging/20261022-'+packet.stem;
 for(const name of packet.names){
  const path='tests/'+name,beforePath=stage+'/'+packet.raw+'/'+path,proposal=stage+'/'+packet.code+'/'+path;
  const beforeSha256=sha(read(beforePath)),proposalSha256=sha(read(proposal));
  assert.equal(base.get(path)?.sha256,beforeSha256);assert.equal(sha(read(website+'/'+path)),beforeSha256);assert.notEqual(proposalSha256,beforeSha256);
  additions.push({path,beforePath,beforeSha256,proposal,proposalSha256,wholeSourceInverse:true,nativeRootRerun:false});
 }
 for(const path of packet.extras){const from=stage+'/'+packet.code+'/'+path;assert(!existsSync(website+'/'+path));extras.push({path,from,sha256:sha(read(from)),kind:'Pure source adapter or complete authentic CODE preimage'});}
 const script=stage+'/'+packet.proof;proofs.push({script,sha256:sha(read(script)),mainReadAndExecuted:true,nativeWebsiteModulesExecuted:false});
}
const repairs=[...previous.repairs,...additions],additionalFiles=[...previous.additionalFiles,...extras];
assert.equal(additions.length,19);assert.equal(repairs.length,97);assert.equal(new Set(repairs.map(item=>item.path)).size,97);
assert.equal(extras.length,13);assert.equal(additionalFiles.length,24);assert.equal(new Set(additionalFiles.map(item=>item.path)).size,24);
for(const item of repairs){assert.equal(sha(read(item.proposal)),item.proposalSha256);assert.equal(sha(read(item.beforePath)),item.beforeSha256);assert.equal(sha(read(website+'/'+item.path)),item.beforeSha256);}
for(const item of additionalFiles){assert.equal(sha(read(item.from)),item.sha256);assert(!existsSync(website+'/'+item.path));}
const result={at:new Date().toISOString(),website,source:previous.source,review:previous.review,previousQueue:previousPath,previousQueueSha256:sha(read(previousPath)),repairs,additionalFiles,sourceProofs:[...previous.sourceProofs,...proofs],completeOriginalSourceInverses:97,mainReviewedNewPaths:19,
 originalHistoricalTestsAndTitlesPreserved:true,strictValidatorAndPinUnchanged:true,currentReviewAndRuntimeSourceRolesIndependent:true,
 historicalValidator:'Exact hash-bound closed56 schema1 module used for closed41/42/43 metadata; current schema2 validator unchanged, native acceptance deferred',
 bodySourceHold:{originalBytes:125142,currentBytes:125813,exactNewChannelBytes:671,wholeSourceInverse:true,actualPureAdapterAndMutantsExecuted:true,imagingAndConsentSourcesHeld:true},
 earlierSourceEpochsComposedNotRepinned:true,frozenOrCanonicalEdited:false,nativeRootsRerun:false,wholeSuitePassing:false,clinicalApproval:false,publicDeployment:false,sourceBackupIncludesAll97:false,
 next:'Keep actual1143-entry full regression and Atlas6d7 frozen until authoritative terminal. Classify every failure and all latent dependent source witnesses; no source-only proposal is a native pass. Then assemble one exact coherent candidate with all97 proposals and24 CODE additions, run original affected native roots/dependents/types/build/strict refusals sequentially, and retain the fresh owner draft-safe cutover gate. Continue full71/eight goal; no private upload, fees, public deployment, mask or desktopPACS edit.'};
mkdirSync(root);writeFileSync(root+'/QUEUE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.pendingRegressionRepairQueue={receipt:root+'/QUEUE.json',sha256:sha(read(root+'/QUEUE.json')),proposedFiles:97,wholeSourceInversesVerified:97,additionalCodeAndProofPaths:24,nativeRootsRerun:false,canonicalInstalled:false,frozenCandidateEdited:false,sourceBackupIncludesThisWholeBatch:false,sourceBackup:pointer.activeWork.regressionRepairSourceBackup,next:result.next};pointer.activeWork.updated=result.at;writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({queue:root+'/QUEUE.json',sha256:sha(read(root+'/QUEUE.json')),proposals:97,newReviewedPaths:19,additionalCodePaths:24,nativeRootsRerun:false}));
