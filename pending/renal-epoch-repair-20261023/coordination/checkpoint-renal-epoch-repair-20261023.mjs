import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {saveProposal,finalizeProposal} from './source-proposal-checkpoint.mjs';
const stage='F:/VisibleMedicine/staging/20261023-renal-epoch-repair',prep=json(stage+'/PREPARATION.json'),site=prep.website,worker=json(stage+'/worker-evidence/RESULT.json');
assert.equal(sha(read(stage+'/worker-evidence/RESULT.json')),'0bf2b76c72c279cfa62129fd56eefa9bccec992a593cda297850fb3e0cf5e2b5');
const green=json(stage+'/main-scoped-green-v2.json');assert.equal(green.pass,7);assert.equal(green.fail,0);
const mainOriginal='tests/clinical-review-lower-limb-connective-xray.test.ts',mainFixes=['tests/clinical-review-current-admission.mjs','tests/renal-tour-epoch-admission.test.mjs'];
const newMain=['tests/lower-limb-display-pin-history.mjs','tests/lower-limb-display-pin-history.test.mjs'];
const sourceNames=[...Object.keys(worker.changedFilesSha256),mainOriginal,...newMain,...Object.keys(worker.preimageSha256).map(p=>'tests/fixtures/renal-epoch-preimage/'+path.basename(p)+'.raw')];assert.equal(sourceNames.length,19);
const rows=sourceNames.map(p=>({path:p,bytes:read(site+'/'+p).length,sha256:sha(read(site+'/'+p))}));
const verify=()=>{
 assert.equal(sha(read(prep.sourceReceipt)),prep.sourceReceiptSha256);
 const originals=new Set([...prep.workerOwned,...prep.mainOwned]);for(const r of prep.selectedInputs){assert.equal(sha(read(prep.frozenSource+'/'+r.path)),r.sha256);if(!originals.has(r.path))assert.equal(sha(read(site+'/'+r.path)),r.sha256);}
 for(const f of ['ADDITIONAL_INPUTS.json','ADDITIONAL_VIEWER_INPUTS.json'])for(const r of json(stage+'/'+f).added)assert.equal(sha(read(site+'/'+r.path)),r.sha256);
 for(const r of rows)assert.equal(sha(read(site+'/'+r.path)),r.sha256);
 for(const[p,digest]of Object.entries(worker.changedFilesSha256))if(!mainFixes.includes(p))assert.equal(sha(read(site+'/'+p)),digest,p);
 for(const[p,digest]of Object.entries(worker.preimageSha256)){assert.equal(sha(read(stage+'/preimage/'+p)),digest);assert.equal(sha(read(site+'/tests/fixtures/renal-epoch-preimage/'+path.basename(p)+'.raw')),digest);}
 assert.equal(sha(read(green.log)),green.sha256);assert.equal(sha(read(stage+'/worker-evidence/SECOND.log')),'1b6eff0ba6d86b7629d7372f2448e5abe921fe9982b86bfb92e1c2277fdc593b');
 assert.equal(runGit(['-C',prep.atlas,'rev-parse','HEAD']).toString().trim(),prep.atlasHead);assert.equal(runGit(['-C',prep.atlas,'status','--porcelain']).toString().trim(),'');
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
};
const report={at:new Date().toISOString(),schema:'vm.renal-epoch-repair-main-review/1',containedWebsite:site,sourceReceipt:prep.sourceReceipt,sourceReceiptSha256:prep.sourceReceiptSha256,sourceRows:rows,
 worker:{receipt:stage+'/worker-evidence/RESULT.json',sha256:sha(read(stage+'/worker-evidence/RESULT.json')),originalScopedCases:3,originalFeatureRootsRun:false},
 main:{cases:7,log:green.log,sha256:green.sha256,sourcePreimageFixturesPortable:true,exactOriginalSourcesRestored:8,onlyTourFieldChanged:'renal revision at index19',tourCount:51,stops:309,pinHistoryGroups:[2,3,5],unknownTourOrPinChangesRejected:true,declaredMixedLearnerScopesAndMissingSourceInputsChecked:true},
 mainCorrections:[{paths:mainFixes,reason:'Replace staging-only preimage paths with seven exact checked-in source-text witnesses; keep old/current runtime expectations separate without admitting any missing source-input row. Preserve worker originals and every complete source inverse.'},
  {log:'main-scoped-green.tap',reason:'The first mixed-source positive assumed the old shoulder package included the root regional library. It does not. Corrected the test to accept genuinely shared inputs and refuse the missing regional input, rather than manufacturing one. The original red is not claimed as a proven product defect.'}],
 fullFeatureValidation:{pendingOriginalRoots:8,attempts:['main-pin-full.tap','main-pin-full-v2.tap','main-pin-full-v3.tap'],diagnostics:['Contained runtime HTML entrypoints were initially absent; admitted four exact existing manifest-bound pages.','Protected Review emitted HTML/JS was also required; admitted36exact existing manifest-bound artifacts, not new builds.','Full retained feature proof exceeded256MiB and exited134. Scope/resource failure, not a source-regression claim.'],
  observedResourceHeadroom:{at:'2026-10-23T00:03:16.7645965Z',freePhysicalKiB:456472,freeCommitKiB:28372668},decision:'Do not raise the heap or start broad checks while physical memory is low and the unmodified stock gate is live. Revalidate actual resources before a single scoped retry. No automatic restart or pass inferred.'},
 pending:'All eight original affected feature roots, combined current-source integration, full release/native inventory/types/build/browser acceptance remain pending. Candidate is source-only, not installed; no content, model, clinical approval or registration change.',
 previewChanged:false,installed:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false};
const localArtifacts=[];for(const f of fs.readdirSync(stage,{withFileTypes:true}))if(f.isFile()&&/\.(?:json|tap)$/.test(f.name))localArtifacts.push([stage+'/'+f.name,f.name]);
for(const f of fs.readdirSync(stage+'/worker-evidence',{withFileTypes:true}))if(f.isFile())localArtifacts.push([stage+'/worker-evidence/'+f.name,'worker/'+f.name]);
const utilities=['prepare-renal-epoch-repair-20261023.mjs','run-lower-limb-pin-repair-20261023.mjs','admit-renal-runtime-html-20261023.mjs','admit-renal-viewer-inputs-20261023.mjs','verify-renal-proposal-review-20261023.mjs','source-proposal-checkpoint.mjs','checkpoint-renal-epoch-repair-20261023.mjs'];
const remoteArtifacts=[...rows.map(r=>['current/'+r.path,site+'/'+r.path]),...[...prep.workerOwned,...prep.mainOwned].map(p=>['preimage/'+p,stage+'/preimage/'+p]),...utilities.map(p=>['coordination/'+p,path.resolve(p)])];
const config={id:'renal-epoch-repair-20261023',root:'F:/VisibleMedicine/recovery/checkpoints/20261023-renal-epoch-repair',stage,site,key:'pendingRenalEpochRepair',rows,localArtifacts,remoteArtifacts,verify,review:report,
 parent:{receipt:'F:/VisibleMedicine/recovery/checkpoints/20261023-release-epoch-repairs-source-backup/github-backup.json',receiptSha256:'000956fe6c1928b62558a9e08db4a9c6e7c7854e30e1f9329c1fad47f4469db9',repo:'F:/VisibleMedicine/history/website-work/github-release-epoch-repairs-20261023.git'},
 backupRepo:'F:/VisibleMedicine/history/website-work/github-renal-epoch-repair-20261023.git',sourceIdentity:{atlas:prep.atlasHead,atlasTree:prep.atlasTree,frozenSourceReceiptSha256:prep.sourceReceiptSha256,sourceRows:rows},
 backupScope:'Inherited independently verified filtered source plus19authored test/helper/source-preimage witness paths, eight original test/helper sources and seven verification/checkpoint utility sources. The seven .raw witnesses contain exact authored source code, not generated anatomy or scan metadata. All raw logs, generated catalogs/Review/runtime documents, private decisions/patient data, binary models, process records and canonical Git ancestry stay local and are excluded. Source-only proposal recovery is not full/private/runnable backup or installed/clinical/spatial/release acceptance. Seven scoped cases pass; all eight original affected feature roots remain unverified after a256MiB resource failure.',
 proof:{scopedNative:7,sourceInverses:8,preimageWitnessesPortable:true,originalFeatureRootsPending:8,heapMiB:256,fullFeatureResourceFailureRetained:true,unknownDifferencesFailClosed:true},
 milestone:'Shared renal tour and exact display-pin epoch repair proposed; seven scoped cases pass, full feature validation resource-gated',pending:report.pending,
 summary:{sourceOnlyNotWholeWebsite:true,scopedNative:7,originalFeatureRootsPending:8,fullFeatureResourceFailureRetained:true,portableSourcePreimages:7},
 coordinationUpdate:{cursor:'09786c67-a526-4f3e-9592-4f73d6c47d39:17',state:'idle/completed; main-reviewed proposal with portability and family-role corrections; full affected roots pending',pendingAssignment:{state:'completed; main combined seven scoped cases pass',cursor:'09786c67-a526-4f3e-9592-4f73d6c47d39:17',result:stage+'/worker-evidence/RESULT.json',resultSha256:sha(read(stage+'/worker-evidence/RESULT.json')),mainReview:stage+'/MAIN_REVIEW.json',mainReviewPending:false}}};
console.log(JSON.stringify(process.argv.includes('--finalize')?finalizeProposal(config):saveProposal(config)));
