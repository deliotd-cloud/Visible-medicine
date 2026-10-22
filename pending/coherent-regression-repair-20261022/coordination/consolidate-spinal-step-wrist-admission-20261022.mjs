import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';

const root='F:/VisibleMedicine/staging/20261022-spinal-step-wrist-consolidated';assert(!existsSync(root));
const previousPath='F:/VisibleMedicine/staging/20261022-xray-quiz-reflow-consolidated/QUEUE.json';
assert.equal(sha(read(previousPath)),'5ce445a78c28cf5aa8e987387681a6391e11a75d1267fe440105b9f56adc8097');
const previous=json(previousPath),website=previous.website,closedPath=website+'/../VERIFIED_SOURCE.json';
assert.equal(sha(read(closedPath)),'1b38f47acd68bd9765d442f356a3390bda69f305007887739e03b362b480a9a3');
const closed=new Map(json(closedPath).sourceRows.map(row=>[row.path,row]));
const step='F:/VisibleMedicine/staging/20261022-step-wrist-family-admission',spinal='F:/VisibleMedicine/staging/20261022-spinal-family-admission';
const specs=[
 ['atlas-tour-step-navigation.test.ts',step+'/tests/atlas-tour-step-navigation.test.ts',step+'/tests/preimages/atlas-tour-step-navigation.test.ts.raw','d28269ffa5b667a7f039468a4c26e53f5e494ec2e5525eb96f9dcf39bd7b0534','d30957715cf6d525f058682564c158ac9ca43fde4eeefb6a4136377297a2abe3'],
 ['atlas-wrist-imaging-correction.test.ts',step+'/tests/atlas-wrist-imaging-correction.test.ts',step+'/tests/preimages/atlas-wrist-imaging-correction.test.ts.raw','a25df4cfcfde998403b55aa8016626451b164625e4606b0f3c002b8e800da7a4','80885a37bd0edeb9525fbf75551bf9afc8c8b8c6e16c9984851d053ebc773025'],
 ['atlas-spinal-muscle-xray.test.mjs',spinal+'/atlas-spinal-muscle-xray.test.mjs',spinal+'/atlas-spinal-muscle-xray.test.mjs.preimage.bin','6c202daf177a84a4cfd210673dd8a3975bc47cd77bcd47754139a9bffd6bdddc','46feb48a3d91439396e47fa739df407ea95a3eacca0900c742fd4fe1ed6adf44'],
];
const additions=specs.map(([name,proposal,beforePath,beforeSha256,proposalSha256])=>({path:'tests/'+name,proposal,beforePath,beforeSha256,proposalSha256,wholeSourceInverse:true,nativeRootRerun:false}));
const repairs=[...previous.repairs,...additions];assert.equal(repairs.length,58);assert.equal(new Set(repairs.map(row=>row.path)).size,58);
assert.equal(repairs.find(row=>row.path==='tests/atlas-spinal-disc-function.test.ts').proposalSha256,'597a95e1a8aef11b35790265c4527004a1abdf7cd7c4b8b79190e17470a568ec');
for(const row of repairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(row.beforePath)),row.beforeSha256);assert.equal(sha(read(website+'/'+row.path)),row.beforeSha256);assert.equal(closed.get(row.path)?.sha256,row.beforeSha256);}
for(const row of previous.additionalFiles){assert.equal(sha(read(row.from)),row.sha256);assert(!existsSync(website+'/'+row.path));}
const sourceProofs=[...previous.sourceProofs,...[step+'/SOURCE_PROOF.mjs',spinal+'/SOURCE_ONLY_AUDIT.ps1',spinal+'/SOURCE_ONLY_INVERSE.ps1'].map(script=>({script,sha256:sha(read(script)),mainReadAndExecuted:true,nativeWebsiteModulesExecuted:false}))];
mkdirSync(root,{recursive:true});
const result={at:new Date().toISOString(),website,source:previous.source,review:previous.review,previousQueue:previousPath,previousQueueSha256:sha(read(previousPath)),repairs,additionalFiles:previous.additionalFiles,completeOriginalSourceInverses:58,mainReviewedNewPaths:3,newReviewedSinceBackedUp52:6,sourceProofs,noEditTourRetry:previous.noEditTourRetry,
 duplicateProposalNotSelected:{path:'tests/atlas-spinal-disc-function.test.ts',existingSelectedSha256:'597a95e1a8aef11b35790265c4527004a1abdf7cd7c4b8b79190e17470a568ec',refusedAttempt:'F:/VisibleMedicine/staging/20261022-spinal-step-wrist-preflight-refusal/REFUSAL.json'},
 exactLicenseRepresentation:{path:'LICENSES/bodyparts3d-license-evidence.html',committedBytes:14682,workingBytes:14694,crlfPairs:12,committedSha256:'7a873d9c6ed62578a7ee5603d68d6a8fbf6e3ccc0b52db6a3ad8b952f8cf7271',workingSha256:'90dea95329aea5015ce339e430d9f342090617c82ee48613e15dd2240f08b746',blanketNormalisationAllowed:false},
 reusedTextAudit:{path:'F:/VisibleMedicine/staging/20261022-historic-schema-repairs-consolidated/TEXT_INPUT_AUDIT.json',sha256:sha(read('F:/VisibleMedicine/staging/20261022-historic-schema-repairs-consolidated/TEXT_INPUT_AUDIT.json')),textRows:2874,excludedPngInputs:2,notNativeAcceptance:true},
 originalHistoricalTestsAndTitlesPreserved:true,currentReviewAndRuntimeSourceRolesIndependent:true,strictValidatorAndPinUnchanged:true,
 frozenOrCanonicalEdited:false,nativeRootsRerun:false,wholeSuitePassing:false,clinicalApproval:false,publicDeployment:false,sourceBackupIncludesAll58:false,
 next:'Keep the actual1143-entry frozen run alive to authoritative terminal. Classify every remaining failure, then assemble one separate coherent repair candidate with this58-path queue and6 CODE/proof additions. Run affected original native roots/full types/build/current strict refusals with one heavy job. Source-only byte proofs are not native/browser/clinical acceptance. Keep the fresh owner saved-draft/restart gate and full71/eight roadmap.'};
writeFileSync(root+'/QUEUE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.pendingRegressionRepairQueue={receipt:root+'/QUEUE.json',sha256:sha(read(root+'/QUEUE.json')),proposedFiles:58,wholeSourceInversesVerified:58,additionalCodeAndProofPaths:6,nativeRootsRerun:false,canonicalInstalled:false,frozenCandidateEdited:false,sourceBackupIncludesThisWholeBatch:false,sourceBackup:pointer.activeWork.regressionRepairSourceBackup,next:result.next};pointer.activeWork.updated=result.at;writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({queue:root+'/QUEUE.json',sha256:sha(read(root+'/QUEUE.json')),proposals:58,newReviewedSinceBackup:6,exactLicenseRepresentationNotNormalised:true,nativeRootsRerun:false,ownerFormsRefreshed:false}));
