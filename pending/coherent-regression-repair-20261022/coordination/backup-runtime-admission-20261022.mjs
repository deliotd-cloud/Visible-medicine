import assert from 'node:assert/strict';
import path from 'node:path';
import {read,json,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const queuePath='F:/VisibleMedicine/staging/20261022-runtime-admission-consolidated/QUEUE.json';
assert.equal(sha(read(queuePath)),'e2b417a6b33191c66d7759c6a89adadf37aab33d6f14818e1980d24efde14562');
const queue=json(queuePath),additionalProof=path.dirname(queuePath)+'/THORACIC_AUTHORED_SOURCE_PROOF.json';
assert.equal(sha(read(additionalProof)),'5f6449f0f6d8f0f53e26f42af998728ded9c21c2be9d93887d037c0d5b64ffc8');
assert.equal(queue.completeOriginalSourceInverses,28);assert.equal(queue.independentCurrentAndFamilySourceEvidence.length,65);
const previous='F:/VisibleMedicine/recovery/checkpoints/20261022-coherent-regression-proposal-backup',parentPath=previous+'/github-backup.json';
assert.equal(sha(read(parentPath)),'9edef8b94f46b9fdb8837b16088a1b5eb1495399e42bc89104cc3ffd319287cb');
const parent=json(parentPath);assert(parent.sourceBackupVerified&&parent.strictIntegrity);assert.equal(parent.head,'76e0cab16b82c0f73abe70b02c5fdd055ffd267c');
const parentRepo='F:/VisibleMedicine/history/website-work/github-coherent-regression-proposal-20261022.git';
const manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
const destinations=new Map(manifest.files.map(row=>[row.path,previous+'/remote-source-restored/'+row.path]));
for(const row of manifest.files)assert.equal(sha(read(destinations.get(row.path))),row.sha256,row.path);
const prefix='pending/coherent-regression-repair-20261022/';
for(const row of queue.repairs){assert(row.path.startsWith('tests/'));assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(row.beforePath)),row.beforeSha256);
 destinations.set(prefix+'website/'+row.path,row.proposal);
 destinations.set(prefix+'website/tests/fixtures/regression-before-20261022/'+path.basename(row.path)+'.raw',row.beforePath);
}
for(const row of queue.additionalFiles){assert.equal(sha(read(row.from)),row.sha256);destinations.set(prefix+'website/'+row.path,row.from);}
for(const name of ['observe-coherent-full-regression-20261022.mjs','record-regression-repair-queue-20261022.mjs','stage-runtime-family-batch2-20261022.mjs','stage-runtime-main-consumers-batch3-20261022.mjs','consolidate-runtime-admission-20261022.mjs','verify-thoracic-authored-epochs-20261022.mjs','prepare-css-notice-admission-20261022.mjs','verify-css-notice-source-proposal-20261022.mjs','prepare-foot-notice-admission-20261022.mjs','verify-foot-notice-source-proposal-20261022.mjs','backup-runtime-admission-20261022.mjs'])destinations.set(prefix+'coordination/'+name,path.resolve(name));
for(const row of queue.workerProofs)destinations.set(prefix+'coordination/worker-proofs/'+path.basename(path.dirname(row.script))+'/'+path.basename(row.script),row.script);
const files=[...destinations].map(([relative,from])=>({path:relative,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
assert(files.length>2800&&files.length<2900);
const bytesFor=relative=>read(destinations.get(relative));
const verifySource=()=>{
 assert.equal(sha(read(queuePath)),'e2b417a6b33191c66d7759c6a89adadf37aab33d6f14818e1980d24efde14562');
 for(const row of queue.repairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(queue.website+'/'+row.path)),row.beforeSha256);}
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),queue.source);
 for(const row of files)assert.equal(sha(bytesFor(row.path)),row.sha256,row.path);
};
backup({root:'F:/VisibleMedicine/recovery/checkpoints/20261022-runtime-admission-source-backup',repo:'F:/VisibleMedicine/history/website-work/github-runtime-admission-20261022.git',branch:'backup/runtime-admission-20261022',parent:parent.head,parentTree:parent.tree,parentRepo,files,bytesFor,verifySource,
 sourceIdentity:{installedAtlas:queue.source,installedReview:'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59',candidateReview:queue.review},
 scope:'Inherited previously filtered authored-source recovery plus28 unintegrated test-only repair proposals,28 complete original raw CODE preimages, one authored CSS code fixture, and explicitly listed coordination/proof scripts. No new generated Review/runtime JSON, model binaries, scans/masks/pixels, patient/private data, identifiers, owner decisions, credentials/environment, databases, raw logs/media, private reference notes, article prose/figures/tables/data or canonical Git ancestry. Selected source-only recovery, not whole/private/runnable project recovery.',
 proof:{selectedSourceOnly:true,proposedTestFiles:28,wholeOriginalSourceInverses:28,independentFamilySourceBindings:65,threeEpochAuthoredPaths:9,historicalDispatchSourceRetained:true,newNativeRootsPassing:false,fullRegressionStillPending:true,frozenCandidateEdited:false,installed:false,clinicalApproval:false,patientRegistration:false,publicDeployment:false,wholeProjectBackup:false,privateDataBackup:false,runnableProjectRecovery:false}});
