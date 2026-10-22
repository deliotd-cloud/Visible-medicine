import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';

const root='F:/VisibleMedicine/staging/20261022-tour-reading-consolidated';assert(!existsSync(root));
const previousPath='F:/VisibleMedicine/staging/20261022-spinal-step-wrist-consolidated/QUEUE.json';
assert.equal(sha(read(previousPath)),'9de5a86b16d6cd39e935a566ae94c38fdebe2015cb74517c86541b8768c1d62d');
const previous=json(previousPath),website=previous.website,stage='F:/VisibleMedicine/staging/20261022-tour-reading-family-admission';
const closedPath=website+'/../VERIFIED_SOURCE.json';assert.equal(sha(read(closedPath)),'1b38f47acd68bd9765d442f356a3390bda69f305007887739e03b362b480a9a3');
const closed=new Map(json(closedPath).sourceRows.map(row=>[row.path,row]));
const additions=[
 ['atlas-tour-reading-focus.test.ts','fa381c5f25bb9b9877bbba0bab615c2b4a2b96d02005c01bce2c7a75bf5d3246','5934c407f3ca59a9eee8e5d7294deefcd5f4a934c85d285bd85a80e1eee637cd'],
 ['atlas-tour-reference-reading.test.ts','252f5eaa094a6c5943a43cc9f38112fa441d8e309c987007b32e1230ac58e9b1','c1e5cdb42f885ee95a0ce71e371057aab3b07722cd46a50d54445dc3adbc3a24'],
].map(([name,beforeSha256,proposalSha256])=>({path:'tests/'+name,beforePath:stage+'/tests/preimages/'+name+'.raw',beforeSha256,proposal:stage+'/tests/'+name,proposalSha256,wholeSourceInverse:true,nativeRootRerun:false}));
const repairs=[...previous.repairs,...additions];assert.equal(repairs.length,60);assert.equal(new Set(repairs.map(row=>row.path)).size,60);
for(const row of repairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(row.beforePath)),row.beforeSha256);assert.equal(sha(read(website+'/'+row.path)),row.beforeSha256);assert.equal(closed.get(row.path)?.sha256,row.beforeSha256);}
for(const row of previous.additionalFiles){assert.equal(sha(read(row.from)),row.sha256);assert(!existsSync(website+'/'+row.path));}
const script=stage+'/SOURCE_PROOF.mjs',scriptSha256=sha(read(script));
const stdout=execFileSync(process.execPath,[script],{encoding:'utf8',windowsHide:true,maxBuffer:2e6});
assert.equal(sha(read(script)),scriptSha256);const proof=JSON.parse(stdout.trim());assert.equal(proof.status,'PASS_SOURCE_ONLY');assert.equal(proof.inverseSeams,10);assert.equal(proof.mutantRefusals,6);
mkdirSync(root,{recursive:true});writeFileSync(root+'/PURE_SOURCE_PROOF.log',stdout,{flag:'wx'});
const result={at:new Date().toISOString(),website,source:previous.source,review:previous.review,previousQueue:previousPath,previousQueueSha256:sha(read(previousPath)),repairs,additionalFiles:previous.additionalFiles,completeOriginalSourceInverses:60,mainReviewedNewPaths:2,
 sourceProofs:[...previous.sourceProofs,{script,sha256:scriptSha256,mainReadAndExecuted:true,nativeWebsiteModulesExecuted:false}],
 newSourceProof:{path:root+'/PURE_SOURCE_PROOF.log',sha256:sha(read(root+'/PURE_SOURCE_PROOF.log')),wholeOriginalInverses:2,editSeams:10,sourceMutationRefusals:6,nativeRefusalsRerun:false},
 originalHistoricalTestsAndTitlesPreserved:true,currentReviewAndRuntimeSourceRolesIndependent:true,strictValidatorAndPinUnchanged:true,
 frozenOrCanonicalEdited:false,nativeRootsRerun:false,wholeSuitePassing:false,clinicalApproval:false,publicDeployment:false,sourceBackupIncludesAll60:false,
 next:'Keep actual1143-entry frozen regression alive until authoritative terminal, not a quiet log or timeout. Then classify every failure, assemble one new coherent candidate with all60 proposals and6 CODE/proof additions, and run original affected native roots/full types/build/current strict refusals with one heavy job. Source-only proofs are not native/browser/clinical acceptance. Preserve fresh owner saved-draft/restart gate and full71/eight roadmap.'};
writeFileSync(root+'/QUEUE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.pendingRegressionRepairQueue={receipt:root+'/QUEUE.json',sha256:sha(read(root+'/QUEUE.json')),proposedFiles:60,wholeSourceInversesVerified:60,additionalCodeAndProofPaths:6,nativeRootsRerun:false,canonicalInstalled:false,frozenCandidateEdited:false,sourceBackupIncludesThisWholeBatch:false,sourceBackup:pointer.activeWork.regressionRepairSourceBackup,next:result.next};pointer.activeWork.updated=result.at;writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({queue:root+'/QUEUE.json',sha256:sha(read(root+'/QUEUE.json')),proposals:60,newReviewedPaths:2,sourceMutationRefusals:6,nativeRootsRerun:false,ownerFormsRefreshed:false}));
