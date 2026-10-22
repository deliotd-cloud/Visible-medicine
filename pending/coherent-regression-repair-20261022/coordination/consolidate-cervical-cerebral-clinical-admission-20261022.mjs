import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';

const root='F:/VisibleMedicine/staging/20261022-cervical-cerebral-clinical-consolidated';assert(!existsSync(root));
const previousPath='F:/VisibleMedicine/staging/20261022-tour-reading-consolidated/QUEUE.json';
assert.equal(sha(read(previousPath)),'bb6464ab3973dad317a12081eaf96d068b09264774e0854c373c3f7f4e22a415');
const previous=json(previousPath),website=previous.website;
const closedPath=website+'/../VERIFIED_SOURCE.json';assert.equal(sha(read(closedPath)),'1b38f47acd68bd9765d442f356a3390bda69f305007887739e03b362b480a9a3');
const closed=new Map(json(closedPath).sourceRows.map(row=>[row.path,row]));
const cervical='F:/VisibleMedicine/staging/20261022-cervical-preservation-admission';
const clinical='F:/VisibleMedicine/staging/20261022-clinical-abdominal-adductor-family-admission';
const cardiac='F:/VisibleMedicine/staging/20261022-clinical-cardiac-canal-family-admission';
const main='F:/VisibleMedicine/staging/20261022-completion-cerebral-checkout-admission';
const additions=[
 [cervical,'cervical-current-history-context-contract.test.mjs','942386357c90782e6d357d936f3d2b7646597e5313d0e126221448f0ee3af6b3','82d6299acf09abc68b9cccf7e38324dac7a4bd643b65441eb38011d55ec17cb1'],
 [cervical,'cervical-history-preservation.test.mjs','a184ea1af69fb04164ea0da8d85a1829331dd7f77598e622b5649b1280eb3ed3','2ce808d7439d976065fa6942c7db369228c282eb2c76773f7fa8d6ee006976a0'],
 [clinical,'clinical-review-abdominal-detail-xray.test.ts','64bfa1d4ffd9c1024902a322a42a273022066a911d5d0c79b6ace7a05523e819','e08feb5b2cb2aa52c5302eec5ae4b643347e3007ad2aa0c9ac183defc0318c88'],
 [clinical,'clinical-review-adductor-longus-xray.test.ts','072e48ac0d6db57ef78ca5f485777ebabfdd64a24c357a612d078622bb04143a','3bc694fbf7e99b76e47d2e83b6bb9c4e72871ec36f7b290c84600b8ac3403f03'],
 [cardiac,'clinical-review-cardiac-venous-ultrasound.test.ts','6244743f927b0122de884698902df0dcc974eb2eddb29342062251f81bbf4f6d','138a20badf8513c33c527ff894f1d490aff268d0d861ecf2af3ab0ecab3153a6'],
 [cardiac,'clinical-review-central-canal-imaging.test.ts','aa8cffb8e364b7b20aa958bfe0576b99aca3c84e3da50d0d4fe8dfa28b5f62ce','9b40ff08a6e1db77021aa7cb6c89e4a4008803fa4377732ba18cb8774606c7a4'],
 [cardiac,'clinical-review-central-canal-xray.test.ts','8d233a9e711b0f8fb93002b930dbd6201843363a9ae98d6ddd99c42edfd8887d','d64e332fd7e3e20bb4424c69d6174b579b8f3debddd50fe99c9269511e6d4e00'],
 ...['atlas-tour-completion.test.mjs','cerebral-checkout-epoch-preservation.test.mjs'].map(name=>[main,name,sha(read(main+'/RAW/tests/'+name)),sha(read(main+'/CODE/tests/'+name))]),
].map(([stage,name,beforeSha256,proposalSha256])=>({path:'tests/'+name,beforePath:stage===clinical?stage+'/'+name+'.preimage.bin':stage+'/RAW/tests/'+name,beforeSha256,proposal:stage===clinical?stage+'/'+name:stage+'/CODE/tests/'+name,proposalSha256,wholeSourceInverse:true,nativeRootRerun:false}));
const repairs=[...previous.repairs,...additions];assert.equal(repairs.length,69);assert.equal(new Set(repairs.map(row=>row.path)).size,69);
for(const row of repairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(row.beforePath)),row.beforeSha256);assert.equal(sha(read(website+'/'+row.path)),row.beforeSha256);assert.equal(closed.get(row.path)?.sha256,row.beforeSha256);}
const extraPath='tests/cerebral-checkout-current-adapter.mjs',extraFrom=main+'/CODE/'+extraPath;
const additionalFiles=[...previous.additionalFiles,{path:extraPath,from:extraFrom,sha256:sha(read(extraFrom)),kind:'Pure exact-source composition and single-path licence-checkout guard'}];
assert.equal(additionalFiles.length,7);assert.equal(new Set(additionalFiles.map(row=>row.path)).size,7);
for(const row of additionalFiles){assert.equal(sha(read(row.from)),row.sha256);assert(!existsSync(website+'/'+row.path));}
const scripts=[cervical+'/SOURCE_PROOF.mjs',clinical+'/SOURCE_ONLY_INVERSE.ps1',clinical+'/SOURCE_ONLY_AUDIT.ps1',cardiac+'/SOURCE_PROOF.mjs',main+'/SOURCE_PROOF.mjs'];
// Main read the complete scripts and executed each once against these exact bytes;
// this consolidator authenticates that reviewed set, not a rerun of native tests.
const sourceProofs=[...previous.sourceProofs,...scripts.map(script=>({script,sha256:sha(read(script)),mainReadAndExecuted:true,nativeWebsiteModulesExecuted:false}))];
mkdirSync(root,{recursive:true});
const result={at:new Date().toISOString(),website,source:previous.source,review:previous.review,previousQueue:previousPath,previousQueueSha256:sha(read(previousPath)),repairs,additionalFiles,sourceProofs,
 completeOriginalSourceInverses:69,mainReviewedNewPaths:9,mainSourceProof:{completeOriginalInverses:2,sourceTransitions:4,originalCheckoutTransitions:2,currentMetadataRecords:9,mutationRefusals:33,nativeRootRerun:false},
 clinicalSourceAudit:{selectedFamilyGitInputs:20,rawNotices:32,priorTextRowAudit:2874,distinctShoulderBodySourcePreserved:true},
 duplicatePreflight:{paths:['clinical-review-abdominal-eus.test.ts','clinical-review-abdominal-fold-ultrasound.test.ts','clinical-review-abdominal-spatial-reasoning.test.ts','clinical-review-abdominal-vessel-reasoning.test.ts'],existingSelectedProposalsRetained:true,newEditsOrCompetingStage:false},
 originalHistoricalTestsAndTitlesPreserved:true,currentReviewAndRuntimeSourceRolesIndependent:true,strictValidatorAndPinUnchanged:true,frozenOrCanonicalEdited:false,nativeRootsRerun:false,wholeSuitePassing:false,clinicalApproval:false,publicDeployment:false,sourceBackupIncludesAll69:false,
 next:'Preserve the exact live1143-entry regression candidate and Atlas6d7 until actual terminal, not silence. Then classify every failure, assemble one new coherent candidate with these69 reviewed proposals plus7 CODE/proof additions, and run original affected native roots/full types/build/current strict refusals with one heavy job. No native, browser, clinical or release passing claim from pure source proofs. Owner preview/forms and fresh saved-draft/restart gate remain unchanged; continue the full71/eight roadmap.'};
writeFileSync(root+'/QUEUE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.pendingRegressionRepairQueue={receipt:root+'/QUEUE.json',sha256:sha(read(root+'/QUEUE.json')),proposedFiles:69,wholeSourceInversesVerified:69,additionalCodeAndProofPaths:7,nativeRootsRerun:false,canonicalInstalled:false,frozenCandidateEdited:false,sourceBackupIncludesThisWholeBatch:false,sourceBackup:pointer.activeWork.regressionRepairSourceBackup,next:result.next};pointer.activeWork.updated=result.at;writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({queue:root+'/QUEUE.json',sha256:sha(read(root+'/QUEUE.json')),proposals:69,newReviewedPaths:9,additionalCodeAndProofPaths:7,nativeRootsRerun:false,ownerFormsRefreshed:false}));
