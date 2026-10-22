// Reusable, main-owned filtered backup for an explicitly reviewed source-only queue.
// It never scans the website, raw Git history, runtime derivatives or private files.
import assert from 'node:assert/strict';
import path from 'node:path';
import {read,json,sha,runGit,backup} from './source-only-backup-20261019.mjs';

export function backupReviewedRegressionQueue({queuePath,queueSha256,expectedProposals,parentReceipt,parentReceiptSha256,parentRepo,stem,coordinationScripts=[],additionalSourceFiles=[],productProof=null}){
 assert.match(stem,/^[a-z][a-z0-9-]{1,65}$/);
 assert.match(queueSha256,/^[a-f0-9]{64}$/);assert.match(parentReceiptSha256,/^[a-f0-9]{64}$/);
 assert.equal(sha(read(queuePath)),queueSha256);const queue=json(queuePath);
 assert.equal(queue.completeOriginalSourceInverses,expectedProposals);assert.equal(queue.repairs.length,expectedProposals);
 assert.equal(queue.frozenOrCanonicalEdited,false);assert.equal(queue.nativeRootsRerun,false);
 assert.equal(sha(read(parentReceipt)),parentReceiptSha256);const parent=json(parentReceipt);
 assert(parent.sourceBackupVerified&&parent.strictIntegrity);assert.equal(parent.wholeProjectBackup,false);assert.equal(parent.privateDataBackup,false);
 const previous=path.dirname(parentReceipt),prefix='pending/coherent-regression-repair-20261022/';
 const manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
 const destinations=new Map(manifest.files.map(row=>[row.path,previous+'/remote-source-restored/'+row.path]));
 for(const row of manifest.files)assert.equal(sha(read(destinations.get(row.path))),row.sha256,row.path);
 const requireCode=from=>{const bytes=read(from);assert.deepEqual(Buffer.from(bytes.toString('utf8'),'utf8'),bytes,'Reviewed CODE must be exact UTF-8: '+from);return bytes;};
 for(const row of queue.repairs){
  assert.equal(row.wholeSourceInverse,true,'No proposal without a complete reviewed original inverse');
  assert.match(row.path,/^tests\/[a-z0-9-]+\.(?:test\.)?(?:mjs|ts)$/);
  assert.equal(sha(requireCode(row.proposal)),row.proposalSha256);assert.equal(sha(requireCode(row.beforePath)),row.beforeSha256);
  destinations.set(prefix+'website/'+row.path,row.proposal);
  destinations.set(prefix+'website/tests/fixtures/regression-before-20261022/'+path.basename(row.path)+'.raw',row.beforePath);
 }
 for(const row of queue.additionalFiles){assert.equal(sha(requireCode(row.from)),row.sha256);destinations.set(prefix+'website/'+row.path,row.from);}
 for(const row of queue.sourceProofs??[]){
  assert.equal(sha(requireCode(row.script)),row.sha256);
  // A main-owned relative script must not emit a forbidden literal '/./' path.
  const script=path.resolve(row.script);
  destinations.set(prefix+'coordination/worker-proofs/'+path.basename(path.dirname(script))+'/'+path.basename(script),script);
 }
 for(const name of ['backup-reviewed-regression-queue-20261022.mjs',...coordinationScripts]){
  assert.match(name,/^[a-z0-9-]+\.mjs$/);const from=path.resolve(name);requireCode(from);
  destinations.set(prefix+'coordination/'+name,from);
 }
 for(const row of additionalSourceFiles){
  assert.match(row.path,/^pending\/regional-runtime-linking-20261022\/[a-zA-Z0-9_./-]+$/);
  assert(row.path.split('/').every(part=>part&&part!=='.'&&part!=='..'));
  assert(!destinations.has(row.path),'No hidden source-backup overwrite: '+row.path);
  assert.equal(sha(requireCode(row.from)),row.sha256);destinations.set(row.path,row.from);
 }
 const files=[...destinations].map(([relative,from])=>({path:relative,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
 const bytesFor=name=>read(destinations.get(name));
 const verifySource=()=>{
  assert.equal(sha(read(queuePath)),queueSha256);
  assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),queue.source);
  for(const row of queue.repairs){assert.equal(sha(read(row.proposal)),row.proposalSha256);assert.equal(sha(read(queue.website+'/'+row.path)),row.beforeSha256);}
  for(const row of files)assert.equal(sha(bytesFor(row.path)),row.sha256,row.path);
 };
 return backup({root:'F:/VisibleMedicine/recovery/checkpoints/20261022-'+stem+'-source-backup',repo:'F:/VisibleMedicine/history/website-work/github-'+stem+'-20261022.git',branch:'backup/'+stem+'-20261022',parent:parent.head,parentTree:parent.tree,parentRepo,files,bytesFor,verifySource,
  sourceIdentity:{installedAtlas:queue.source,installedReview:'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59',candidateReview:queue.review},
  scope:`Inherited filtered authored-source recovery plus ${expectedProposals} unintegrated reviewed test/helper proposals, complete raw CODE preimages, ${queue.additionalFiles.length} explicit CODE/proof additions and named proof/coordination scripts. Whole-original byte inverses, historical obligations, independent Review/runtime families and all strict current-source gates are retained. No generated Review/runtime JSON, geometry/models, scans/masks/pixels, patient identifiers, owner decisions, credentials/env, databases, raw logs/media, private reference notes, article assets or raw canonical Git ancestry. Selected authored-source only, not whole/private/runnable recovery or native/browser/clinical/release completion.`,
  proof:{selectedSourceOnly:true,proposedTestAndHelperPaths:expectedProposals,completeOriginalSourceInverses:expectedProposals,additionalCodeAndProofPaths:queue.additionalFiles.length,explicitProductSourceAndPreimageFiles:additionalSourceFiles.length,productProof,strictCurrentValidatorAndPinChanged:false,frozenCandidateEdited:false,nativeRootsRerun:false,fullRegressionPending:true,installed:false,clinicalApproval:false,patientRegistration:false,publicDeployment:false,wholeProjectBackup:false,privateDataBackup:false,runnableProjectRecovery:false},
 });
}
