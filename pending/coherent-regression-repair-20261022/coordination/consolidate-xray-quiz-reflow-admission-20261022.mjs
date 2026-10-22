import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';

const root='F:/VisibleMedicine/staging/20261022-xray-quiz-reflow-consolidated';assert(!existsSync(root));
const previousPath='F:/VisibleMedicine/staging/20261022-extra-expansion-family-consolidated/QUEUE.json';
assert.equal(sha(read(previousPath)),'d6866177d47b9d485ec112eb147f2251ffa701226a885e84bb876b857a46b4b7');
const previous=json(previousPath),website=previous.website;
const closedPath=website+'/../VERIFIED_SOURCE.json';assert.equal(sha(read(closedPath)),'1b38f47acd68bd9765d442f356a3390bda69f305007887739e03b362b480a9a3');
const closed=new Map(json(closedPath).sourceRows.map(row=>[row.path,row]));
const xray='F:/VisibleMedicine/staging/20261022-shoulder-xray-tour-retry-admission';
const thoraco='F:/VisibleMedicine/staging/20261022-thoraco-tour-reflow-family-admission';
const additions=[
 {path:'tests/atlas-shoulder-soft-xray-delivery.test.ts',proposal:xray+'/tests/atlas-shoulder-soft-xray-delivery.test.ts',proposalSha256:'b037ecec7035ebfa1c7f78be8e38a6e1f02778a42b85725ed6a42c50f0c6ffe3',beforePath:xray+'/tests/preimages/atlas-shoulder-soft-xray-delivery.test.ts.raw',beforeSha256:'1427c2be2e3123b70c425be26cdc962356e0a08588f8ee3f60454915c5e4208e'},
 {path:'tests/atlas-thoracoabdominal-quiz-checks.mjs',proposal:thoraco+'/atlas-thoracoabdominal-quiz-checks.mjs',proposalSha256:'f3ca5163de8acd839a68dd97c3d5cec6f950991dabeba6f8fec6f6470eeda40b',beforePath:thoraco+'/atlas-thoracoabdominal-quiz-checks.mjs.preimage.bin',beforeSha256:'0bb48b7d723c1d87262ccdf1eaa41e757c3d93f38c7fb1af8dce3bd6cc9ff6b7'},
 {path:'tests/atlas-tour-reflow.test.ts',proposal:thoraco+'/atlas-tour-reflow.test.ts',proposalSha256:'3859a760e44fee758e2e8d1e09268dcda4022839d2e0f1b1b86dfeb40a7c572b',beforePath:thoraco+'/atlas-tour-reflow.test.ts.preimage.bin',beforeSha256:'42a2a808862f5564bf0856cd4b23076e96d882d1ff2fc6f5817365c32d71d500'},
].map(row=>({...row,wholeSourceInverse:true,nativeRootRerun:false}));
const repairs=[...previous.repairs,...additions];assert.equal(repairs.length,55);assert.equal(new Set(repairs.map(row=>row.path)).size,55);
for(const row of repairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(row.beforePath)),row.beforeSha256);assert.equal(sha(read(website+'/'+row.path)),row.beforeSha256);assert.equal(closed.get(row.path)?.sha256,row.beforeSha256);}
for(const row of previous.additionalFiles){assert.equal(sha(read(row.from)),row.sha256);assert(!existsSync(website+'/'+row.path));}
const sourceProofs=[...previous.sourceProofs,...[xray+'/SOURCE_PROOF.mjs',thoraco+'/SOURCE_ONLY_AUDIT.ps1',thoraco+'/SOURCE_ONLY_INVERSE.ps1'].map(script=>({script,sha256:sha(read(script)),mainReadAndExecuted:true,nativeWebsiteModulesExecuted:false}))];
const tourRetryPath='tests/atlas-tour-retry.test.ts',tourRetryHash='62573605849a788dc50c68a9e2a2bae8537653d2448e19a4ab67951b21067e75';
assert.equal(sha(read(website+'/'+tourRetryPath)),tourRetryHash);assert.equal(sha(read(xray+'/tests/preimages/atlas-tour-retry.test.ts.raw')),tourRetryHash);
mkdirSync(root,{recursive:true});
const result={at:new Date().toISOString(),website,source:previous.source,review:previous.review,previousQueue:previousPath,previousQueueSha256:sha(read(previousPath)),repairs,additionalFiles:previous.additionalFiles,completeOriginalSourceInverses:55,mainReviewedNewPaths:3,sourceProofs,
 noEditTourRetry:{path:tourRetryPath,sha256:tourRetryHash,reason:'Its actual head-neck family equals current Review source; three current source inputs independently match exact Git bytes. A blanket family rewrite is not justified.'},
 originalHistoricalTestsAndTitlesPreserved:true,currentReviewAndRuntimeSourceRolesIndependent:true,strictValidatorAndPinUnchanged:true,
 frozenOrCanonicalEdited:false,nativeRootsRerun:false,wholeSuitePassing:false,clinicalApproval:false,publicDeployment:false,sourceBackupIncludesAll55:false,
 next:'Keep the actual1143-entry frozen run alive until its authoritative terminal result. After all failures are classified, assemble one separate coherent repair candidate, retain complete preimages and run affected original native roots/full types/build/current strict refusals with only one heavy job. This55-path source queue and6 CODE/proof additions are not integrated or native-passing. Preserve the fresh owner saved-draft/restart gate and full71/eight roadmap.'};
writeFileSync(root+'/QUEUE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.pendingRegressionRepairQueue={receipt:root+'/QUEUE.json',sha256:sha(read(root+'/QUEUE.json')),proposedFiles:55,wholeSourceInversesVerified:55,additionalCodeAndProofPaths:6,nativeRootsRerun:false,canonicalInstalled:false,frozenCandidateEdited:false,sourceBackupIncludesThisWholeBatch:false,sourceBackup:pointer.activeWork.regressionRepairSourceBackup,next:result.next};pointer.activeWork.updated=result.at;writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({queue:root+'/QUEUE.json',sha256:sha(read(root+'/QUEUE.json')),proposals:55,newReviewedPaths:3,validTourRetryUnchanged:true,nativeRootsRerun:false,ownerFormsRefreshed:false}));
