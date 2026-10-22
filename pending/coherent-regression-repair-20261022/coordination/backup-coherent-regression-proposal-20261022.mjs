import assert from 'node:assert/strict';
import path from 'node:path';
import {read,json,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const previous='F:/VisibleMedicine/recovery/checkpoints/20261022-review-recovery-backup';
const parentReceipt=json(previous+'/github-backup.json');
assert(parentReceipt.sourceBackupVerified&&parentReceipt.strictIntegrity);
assert.equal(parentReceipt.head,'684b769ac981d7c95baabc3afbe717f55bde1c56');
const parentRepo='F:/VisibleMedicine/history/website-work/github-review-recovery-20261022.git';
const manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parentReceipt.head+':.source-backup/manifest.json']));
const destinations=new Map(manifest.files.map(row=>[row.path,previous+'/remote-source-restored/'+row.path]));
for(const row of manifest.files)assert.equal(sha(read(destinations.get(row.path))),row.sha256,row.path);
const prefix='pending/coherent-regression-repair-20261022/',proof=json('F:/VisibleMedicine/staging/20261022-arterial-history-main-proof/RESULT.json');
assert(proof.exactEntireHarnessInverse&&proof.allFourExpectedOutcomes);assert(proof.results.every(row=>row.status===row.expected));
destinations.set(prefix+'website/tests/arterial-history-preservation.test.mjs',proof.proposal);
destinations.set(prefix+'website/tests/fixtures/arterial-history-preservation.before-6d7.test.mjs.raw',proof.website+'/tests/arterial-history-preservation.test.mjs');
for(const name of ['run-coherent-full-regression-20261022.mjs','observe-coherent-full-regression-20261022.mjs','verify-arterial-history-proposal-20261022.mjs','audit-cerebellar-link-source-20261022.mjs','backup-coherent-regression-proposal-20261022.mjs'])destinations.set(prefix+'coordination/'+name,path.resolve(name));
const files=[...destinations].map(([relative,from])=>({path:relative,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));assert.equal(files.length,2753);
const bytesFor=relative=>read(destinations.get(relative));
const verifySource=()=>{
 assert.equal(sha(read(proof.proposal)),proof.proposalSha256);
 assert.equal(sha(read(proof.website+'/tests/arterial-history-preservation.test.mjs')),proof.originalHarnessSha256);
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 for(const row of files)assert.equal(sha(bytesFor(row.path)),row.sha256,row.path);
};
backup({root:'F:/VisibleMedicine/recovery/checkpoints/20261022-coherent-regression-proposal-backup',repo:'F:/VisibleMedicine/history/website-work/github-coherent-regression-proposal-20261022.git',branch:'backup/coherent-regression-proposal-20261022',parent:parentReceipt.head,parentTree:parentReceipt.tree,parentRepo,files,bytesFor,verifySource,
 sourceIdentity:{installedAtlas:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',installedReview:'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59',candidateReview:'4db82d92f6de502a342396d290380253aff46ef754b23e6161672d40c9abce99'},
 scope:'Inherited filtered authored source plus one unintegrated inverse-only test proposal, its complete original raw CODE preimage, and five authored coordination scripts. No new generated JSON/Review/runtime, masks/scans, models, article text/figures/tables/datasets/evidence notes, patient/private data, decisions, credentials/environment, databases, raw logs/media or canonical Git ancestry. Selected authored-source recovery only, not whole/private/runnable recovery or clinical/release completion.',
 proof:{selectedSourceOnly:true,testProposalInstalled:false,exactWholeOriginalHarnessInverse:true,pureInverseCases:4,expectedNegativeRefusals:3,nativeArterialSemanticRootRerun:false,frozenFullRunSourceEdited:false,completeStockRegressionTerminal:false,completeStockRegressionPassing:false,clinicalApproval:false,patientRegistration:false,publicDeployment:false,wholeProjectBackup:false,privateDataBackup:false}});
