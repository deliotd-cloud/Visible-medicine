import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {backupReviewedRegressionQueue} from './backup-reviewed-regression-queue-20261022.mjs';
const planPath='F:/VisibleMedicine/staging/20261022-reviewed-native-followup-consolidated/PLAN.json';
assert.equal(sha(read(planPath)),'23b5b61d15d76ba96963efa4a20a97ea20476c02006a75f364afa0eb2b011228');
const plan=json(planPath),source=json(plan.sourceReceipt);
assert.equal(plan.repairs.length,20);assert.equal(plan.proposedNextNativeRoots.length,29);
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256);
const additions=new Map(),prefix='pending/regional-runtime-linking-20261022/review-tour-followups/';
function add(from){
 from=from.replaceAll('\\','/');assert(from.startsWith('F:/VisibleMedicine/staging/'));assert(/\.(?:mjs|ts|tsx|raw)$/.test(from));
 assert(!from.endsWith('.json.raw'),'Generated integration/pin metadata fixtures remain local');
 const relative=from.slice('F:/VisibleMedicine/staging/'.length),target=prefix+relative;
 assert(!additions.has(target));additions.set(target,{path:target,from,sha256:sha(read(from))});
}
for(const row of plan.repairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(row.beforePath)),row.beforeSha256);add(row.proposal);add(row.beforePath);}
const excludedMetadata=[];
for(const row of [...plan.additionalFiles,...plan.alreadyPresent]){
 assert.equal(sha(read(row.from)),row.sha256);if(row.from.endsWith('.json.raw'))excludedMetadata.push(row.path);else add(row.from);
}
assert.deepEqual(excludedMetadata.sort(),['tests/fixtures/review-frame-history/current-atlas-delivery-1712.json.raw','tests/fixtures/review-frame-history/integration-inputs-1712.json.raw']);
function files(directory){return fs.existsSync(directory)?fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(directory,entry.name)):[path.join(directory,entry.name)]):[];}
for(const batch of plan.batches){
 assert.equal(sha(read(batch.stage+'/SOURCE_PROOF.mjs')),batch.proofSha256);add(batch.stage+'/SOURCE_PROOF.mjs');
 for(const file of files(batch.stage+'/DIAGNOSTIC'))if(/\.(?:mjs|ts|tsx|raw)$/.test(file))add(file);
}
const snapshot='F:/VisibleMedicine/staging/20261022-six-clinical-runtime-admission/SNAPSHOT_SOURCE_PROOF.mjs';add(snapshot);
assert.equal(sha(read(plan.sourceComposition.receipt)),plan.sourceComposition.sha256);
assert.equal(sha(read(plan.sourceComposition.originalRefusal)),plan.sourceComposition.originalRefusalSha256);
backupReviewedRegressionQueue({queuePath:source.queue,queueSha256:source.queueSha256,expectedProposals:161,
 parentReceipt:'F:/VisibleMedicine/recovery/checkpoints/20261022-head-cranio-controls-source-backup/github-backup.json',
 parentReceiptSha256:'0a398a212949b923bfb311c46f91752688130f35278b865eea7d381052fd4cdf',
 parentRepo:'F:/VisibleMedicine/history/website-work/github-head-cranio-controls-20261022.git',stem:'review-tour-followups',
 additionalSourceFiles:[...additions.values()],
 coordinationScripts:['verify-selected-repair-roots-20261022.mjs','checkpoint-review-tour-followups-20261022.mjs','consolidate-review-tour-followups-20261022.mjs',
  'verify-six-clinical-composition-20261022.mjs','record-six-clinical-composition-refusal-20261022.mjs','backup-review-tour-followups-20261022.mjs'],
 productProof:{sourceReceiptSha256:sha(read(plan.sourceReceipt)),sourcePaths:source.sourceRows.length,newSourceOnlyProposals:20,nextFocusedNativeRoots:29,
  allFullPreimagesAndRejectedCodePreserved:true,exactSnapshotInverseAndOriginalQuizPlacementsProved:true,
  generatedMetadataFixturesExcluded:excludedMetadata,sourceCompositionReceiptSha256:plan.sourceComposition.sha256,
  originalRefusalReceiptSha256:plan.sourceComposition.originalRefusalSha256,newNativeBatchExecuted:false,
  existing172RootRunTerminalReceiptPresent:fs.existsSync(path.dirname(source.website)+'/native-selected-repairs-v5/TERMINAL.json'),
  canonicalInstalled:false,ownerPreviewChanged:false,wholeSuitePassing:false,clinicalApproval:false,patientRegistration:false},
});
