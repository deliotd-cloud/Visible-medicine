import assert from 'node:assert/strict';
import path from 'node:path';
import {read,json,sha,runGit,backup} from './source-only-backup-20261019.mjs';

const queuePath='F:/VisibleMedicine/staging/20261022-extra-expansion-family-consolidated/QUEUE.json';
assert.equal(sha(read(queuePath)),'d6866177d47b9d485ec112eb147f2251ffa701226a885e84bb876b857a46b4b7');
const queue=json(queuePath);assert.equal(queue.completeOriginalSourceInverses,52);
const previous='F:/VisibleMedicine/recovery/checkpoints/20261022-shared-family-admission-source-backup',parentPath=previous+'/github-backup.json';
assert.equal(sha(read(parentPath)),'814dc9451a3198ea8c5347615bc5586e4912ed39da885439a688ac1bc65c84ac');
const parent=json(parentPath);assert(parent.sourceBackupVerified&&parent.strictIntegrity);assert.equal(parent.head,'766f99b143e5fe2950849562f1719687f171e05f');
const parentRepo='F:/VisibleMedicine/history/website-work/github-shared-family-admission-20261022.git';
const manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
const destinations=new Map(manifest.files.map(row=>[row.path,previous+'/remote-source-restored/'+row.path]));
for(const row of manifest.files)assert.equal(sha(read(destinations.get(row.path))),row.sha256,row.path);
const prefix='pending/coherent-regression-repair-20261022/';
for(const row of queue.repairs){
 assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(row.beforePath)),row.beforeSha256);
 destinations.set(prefix+'website/'+row.path,row.proposal);
 destinations.set(prefix+'website/tests/fixtures/regression-before-20261022/'+path.basename(row.path)+'.raw',row.beforePath);
}
for(const row of queue.additionalFiles){assert.equal(sha(read(row.from)),row.sha256);destinations.set(prefix+'website/'+row.path,row.from);}
for(const row of queue.sourceProofs){assert.equal(sha(read(row.script)),row.sha256);destinations.set(prefix+'coordination/worker-proofs/'+path.basename(path.dirname(row.script))+'/'+path.basename(row.script),row.script);}
for(const name of ['checkpoint-shared-family-admission-20261022.mjs','prove-extra-expansion-admission-20261022.mjs','consolidate-extra-expansion-family-admission-20261022.mjs','backup-extra-expansion-family-admission-20261022.mjs'])destinations.set(prefix+'coordination/'+name,path.resolve(name));
const files=[...destinations].map(([relative,from])=>({path:relative,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
assert(files.length>2872&&files.length<3000);
const bytesFor=p=>read(destinations.get(p));
const verifySource=()=>{
 assert.equal(sha(read(queuePath)),'d6866177d47b9d485ec112eb147f2251ffa701226a885e84bb876b857a46b4b7');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),queue.source);
 for(const row of queue.repairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(queue.website+'/'+row.path)),row.beforeSha256);}
 for(const row of files)assert.equal(sha(bytesFor(row.path)),row.sha256,row.path);
};
backup({root:'F:/VisibleMedicine/recovery/checkpoints/20261022-extra-expansion-family-source-backup',repo:'F:/VisibleMedicine/history/website-work/github-extra-expansion-family-20261022.git',branch:'backup/extra-expansion-family-20261022',parent:parent.head,parentTree:parent.tree,parentRepo,files,bytesFor,verifySource,
 sourceIdentity:{installedAtlas:queue.source,installedReview:'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59',candidateReview:queue.review},
 scope:'Inherited filtered authored-source recovery plus52 unintegrated test/helper proposals, complete original raw CODE preimages, six explicit CODE/proof additions and named read-only source-proof/coordination scripts. Two additional strict SSR harnesses reuse the real expansion controller loader; nonhead migration retains every original assertion via exact inverse and adds dependency refusal checks. Runtime-family and current-Review identities remain independently authenticated. No generated Review/runtime JSON, model binaries, scans/masks/pixels, patient identifiers, owner decisions, credentials/env, databases, raw logs/media, private reference notes, article assets or raw canonical Git ancestry. Selected authored-source recovery only: not whole/private/runnable recovery or native/browser/clinical/release completion.',
 proof:{selectedSourceOnly:true,proposedTestAndHelperPaths:52,completeOriginalSourceInverses:52,newReviewedSourcePaths:7,additionalCodeAndProofPaths:6,sourceMutationRefusals:13,realControllerLoaderReused:true,strictCurrentValidatorAndPinChanged:false,frozenCandidateEdited:false,nativeRootsRerun:false,fullRegressionPending:true,installed:false,clinicalApproval:false,patientRegistration:false,publicDeployment:false,wholeProjectBackup:false,privateDataBackup:false,runnableProjectRecovery:false}});
