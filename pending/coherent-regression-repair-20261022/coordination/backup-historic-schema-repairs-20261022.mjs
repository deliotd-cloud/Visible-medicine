import assert from 'node:assert/strict';
import path from 'node:path';
import {read,json,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const queuePath='F:/VisibleMedicine/staging/20261022-historic-schema-repairs-consolidated/QUEUE.json';assert.equal(sha(read(queuePath)),'12b41b14c55905a49b5e5f87a2bd362749ba8fcd7baae8814b6b3634d9f1af7f');
const queue=json(queuePath);assert.equal(queue.completeOriginalSourceInverses,39);assert.equal(queue.sourceTextAudit.rows,2874);assert.equal(queue.sourceTextAudit.unprovenTextRows,0);
const previous='F:/VisibleMedicine/recovery/checkpoints/20261022-runtime-admission-source-backup',parentPath=previous+'/github-backup.json';assert.equal(sha(read(parentPath)),'aca3e6a2cc10cbe89ded67f4d3face0fc1ad10d95d9c9480c13f3dd36e41d228');
const parent=json(parentPath);assert(parent.sourceBackupVerified&&parent.strictIntegrity);assert.equal(parent.head,'12f49b71fcf785570572a3c6511b9960c7b76e82');
const parentRepo='F:/VisibleMedicine/history/website-work/github-runtime-admission-20261022.git';
const manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
const destinations=new Map(manifest.files.map(row=>[row.path,previous+'/remote-source-restored/'+row.path]));for(const row of manifest.files)assert.equal(sha(read(destinations.get(row.path))),row.sha256,row.path);
const prefix='pending/coherent-regression-repair-20261022/';
for(const row of queue.repairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(row.beforePath)),row.beforeSha256);destinations.set(prefix+'website/'+row.path,row.proposal);destinations.set(prefix+'website/tests/fixtures/regression-before-20261022/'+path.basename(row.path)+'.raw',row.beforePath);}
for(const row of queue.additionalFiles){assert.equal(sha(read(row.from)),row.sha256);destinations.set(prefix+'website/'+row.path,row.from);}
for(const p of ['tests/fixtures/body-learning-current-admission/current-atlas-delivery-190.mjs.raw','tests/fixtures/closed56-validator/tests/current-atlas-delivery.mjs']){assert.equal(sha(read(queue.website+'/'+p)),'dfcce9763cba89e6d94f6e7e75ceb59f79ca73ac0d6056552bbe00139e804d62');destinations.set(prefix+'website/'+p,queue.website+'/'+p);}
const hand='F:/VisibleMedicine/staging/20261022-hand-vessel-historical-validator-v2-proposal',batch='F:/VisibleMedicine/staging/20261022-historical-schema-consumers-batch4';
destinations.set(prefix+'website/tests/fixtures/regression-before-20261022/atlas-hand-vessel-xray.v1.mjs.raw',hand+'/atlas-hand-vessel-xray.v1.mjs.raw');
for(const name of ['prove-source-inverse.mjs','audit-text-inputs.ps1'])destinations.set(prefix+'coordination/worker-proofs/hand-vessel-v2/'+name,hand+'/'+name);
destinations.set(prefix+'coordination/worker-proofs/historical-schema-batch4/prove-readonly.ps1',batch+'/prove-readonly.ps1');
for(const name of ['checkpoint-runtime-admission-20261022.mjs','consolidate-historic-schema-repairs-20261022.mjs','backup-historic-schema-repairs-20261022.mjs'])destinations.set(prefix+'coordination/'+name,path.resolve(name));
const files=[...destinations].map(([relative,from])=>({path:relative,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));assert(files.length>2840&&files.length<2900);
const bytesFor=p=>read(destinations.get(p));
const verifySource=()=>{
 assert.equal(sha(read(queuePath)),'12b41b14c55905a49b5e5f87a2bd362749ba8fcd7baae8814b6b3634d9f1af7f');assert.equal(sha(read(queue.sourceTextAudit.path)),queue.sourceTextAudit.sha256);
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),queue.source);
 for(const row of queue.repairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(queue.website+'/'+row.path)),row.beforeSha256);}
 for(const row of files)assert.equal(sha(bytesFor(row.path)),row.sha256,row.path);
};
backup({root:'F:/VisibleMedicine/recovery/checkpoints/20261022-historic-schema-repairs-source-backup',repo:'F:/VisibleMedicine/history/website-work/github-historic-schema-repairs-20261022.git',branch:'backup/historic-schema-repairs-20261022',parent:parent.head,parentTree:parent.tree,parentRepo,files,bytesFor,verifySource,
 sourceIdentity:{installedAtlas:queue.source,installedReview:'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59',candidateReview:queue.review},
 scope:'Inherited filtered authored-source recovery plus39 unintegrated test/helper proposals and complete raw CODE preimages, two unchanged schema1 validator CODE witnesses, intermediate hand-vessel V1 CODE, and explicitly listed proof/coordination scripts. No new generated Review/runtime JSON, models, scans/masks/pixels, patient identifiers/private data, owner decisions, credentials/environment, databases, raw logs/media, reference notes, article prose/figures/tables/datasets or canonical Git ancestry. Selected source-only recovery, not whole/private/runnable recovery or native/browser/clinical/release acceptance.',
 proof:{selectedSourceOnly:true,proposedTestAndHelperFiles:39,wholeOriginalSourceInverses:39,independentlyAuditedTextSourceRows:2874,unprovenTextRows:0,excludedPngInputsNotCovered:2,historicalAndCurrentValidatorRolesSeparate:true,oldChecksumRefusalRetained:true,exactTwelveCrLfLicenceRepresentation:true,currentStrictValidatorChanged:false,newNativeRootsPassing:false,fullRegressionStillPending:true,frozenCandidateEdited:false,installed:false,clinicalApproval:false,patientRegistration:false,publicDeployment:false,wholeProjectBackup:false,privateDataBackup:false,runnableProjectRecovery:false}});
