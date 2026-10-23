import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {saveProposal,finalizeProposal} from './source-proposal-checkpoint.mjs';
const stage='F:/VisibleMedicine/staging/20261023-loader-preservation',prep=json(stage+'/PREPARATION.json'),site=prep.website,green=json(stage+'/candidate-green.json'),red=json(stage+'/baseline-red.json');
const names=[prep.original,prep.archive,'tests/learning-loader-preservation-composition.test.mjs'],rows=names.map(p=>({path:p,bytes:read(site+'/'+p).length,sha256:sha(read(site+'/'+p))}));
const verify=()=>{
 assert.equal(sha(read(prep.sourceReceipt)),prep.sourceReceiptSha256);for(const r of prep.selectedInputs){assert.equal(sha(read(prep.frozenWebsite+'/'+r.path)),r.sha256);if(r.path!==prep.original)assert.equal(sha(read(site+'/'+r.path)),r.sha256);}
 for(const r of rows)assert.equal(sha(read(site+'/'+r.path)),r.sha256);assert.equal(sha(read(site+'/'+prep.archive)),prep.originalSha256);
 for(const r of [green,red])assert.equal(sha(read(r.log)),r.sha256);assert.equal(green.pass,9);assert.equal(green.fail,0);assert.equal(red.pass,4);assert.equal(red.fail,3);
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
};
const review={at:new Date().toISOString(),schema:'vm.learning-loader-preservation-review/1',sourceReceipt:prep.sourceReceipt,sourceReceiptSha256:prep.sourceReceiptSha256,containedWebsite:site,sourceRows:rows,
 diagnosis:'Old learning-loader proof omitted the subsequent exact expansion-loader transition. The existing full-source expansion inverse already describes that transition. Compose that inverse before the old learning inverse instead of changing helpers, original consumers, historical hashes or assertions.',
 change:'One import and two source-reader wrappers in the old proof; one complete authenticated old test-source witness and two additional composition checks. Exact byte inverse restores all old test source and original mutation refusals. Existing expansion proof and its three historical consumer inverses remain byte-exact.',
 checks:{baseline:{pass:4,fail:3,sha256:red.sha256},current:{pass:9,fail:0,sha256:green.sha256},heapMiB:128,completeOldProofInverse:true,originalAccessAndLoaderMutationRefusalsRetained:true,missingDuplicateSubstitutedExpansionRefusalsRetained:true,unchangedCurrentConsumerSources:3},
 scope:'Pure text/hash test-harness preservation only. No component is compiled/rendered by these checks and no production viewer, source hold, model, teaching or runtime data changed. This is not viewer/browser/full-feature/full-release or clinical evidence.',
 pending:'Compose with other reviewed test proposals only in a fresh coherent successor after the frozen stock gate terminates. Original feature, full source/inventory, build/types/browser and release acceptance remain separate; keep low-memory broad checks deferred.',previewChanged:false,installed:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,newDependenciesAssetsOrFees:false};
const localArtifacts=['PREPARATION.json','baseline-red.json','baseline-red.tap','candidate-green.json','candidate-green.tap'].map(p=>[stage+'/'+p,p]);
const utilities=['loader-preservation-work-20261023.mjs','checkpoint-loader-preservation-20261023.mjs','source-proposal-checkpoint.mjs'];
const config={id:'loader-preservation-20261023',root:'F:/VisibleMedicine/recovery/checkpoints/20261023-loader-preservation',stage,site,key:'pendingLoaderPreservation',rows,verify,review,localArtifacts,
 remoteArtifacts:[...rows.map(r=>['current/'+r.path,site+'/'+r.path]),['preimage/'+prep.original,site+'/'+prep.archive],...utilities.map(p=>['coordination/'+p,path.resolve(p)])],
 parent:{receipt:'F:/VisibleMedicine/recovery/checkpoints/20261023-renal-epoch-repair-source-backup/github-backup.json',receiptSha256:'b81092ce2f64e61891cf8c162da6770a238f463c2d85b8daa4faea1d67831799',repo:'F:/VisibleMedicine/history/website-work/github-renal-epoch-repair-20261023.git'},
 backupRepo:'F:/VisibleMedicine/history/website-work/github-loader-preservation-20261023.git',sourceIdentity:{frozenSourceReceiptSha256:prep.sourceReceiptSha256,authoredSource:rows},
 backupScope:'Inherited independently verified filtered source plus three authored test/source-witness paths, one complete source preimage and three verification/checkpoint utility sources. The .raw witness is authored test source, not generated anatomy or scan data. No private decisions, scans/masks, raw logs, runtime or model binaries, generated catalogs/Review metadata, process records or canonical Git ancestry. Nine pure text/hash preservation cases pass at128MiB; no actual viewer/browser/full-feature/release/clinical/registration acceptance. This is partial source-only recovery, not whole/private/runnable backup. Stock run/source and owner preview remain unchanged.',
 proof:{nativeSourcePreservation:9,expectedBaselineFailures:3,completeOriginalProofRestored:true,existingViewerConsumersAndLoaderHelpersUnchanged:true,heapMiB:128,actualViewerOrBrowserTested:false},
 milestone:'Three loader-preservation failures repaired by composing an existing exact later-expansion inverse; nine scoped source checks pass',pending:review.pending,summary:{sourceOnlyNotWholeWebsite:true,nativeSourcePreservation:9,heapMiB:128,originalViewerAndRuntimeUnchanged:true,actualViewerBrowserAndFullReleasePending:true}};
console.log(JSON.stringify(process.argv.includes('--finalize')?finalizeProposal(config):saveProposal(config)));
