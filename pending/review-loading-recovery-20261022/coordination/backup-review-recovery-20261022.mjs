import assert from 'node:assert/strict';
import path from 'node:path';
import {read,json,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const previous='F:/VisibleMedicine/recovery/checkpoints/20261022-expanded-viewer-verified-backup';
const parentReceipt=json(previous+'/github-backup.json');
assert(parentReceipt.sourceBackupVerified&&parentReceipt.strictIntegrity);
assert.equal(parentReceipt.head,'568689610c1b811b40d6822f4d748b8e2189aaa4');
const parentRepo='F:/VisibleMedicine/history/website-work/github-expanded-viewer-verified-20261022.git';
const manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parentReceipt.head+':.source-backup/manifest.json']));
const destinations=new Map(manifest.files.map(row=>[row.path,previous+'/remote-source-restored/'+row.path]));
for(const row of manifest.files)assert.equal(sha(read(destinations.get(row.path))),row.sha256,row.path);
const root='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate',built=json(root+'/BUILD_RESULT.json');
assert(built.allStepsPassed);assert.equal(built.sourcePaths,5811);assert.deepEqual(built.drift,[]);assert.deepEqual(built.baseDrift,[]);
const prefix='pending/review-loading-recovery-20261022/';
for(const name of ['app/workspace/atlas-review/loading.tsx','tests/clinical-review-route-loading.test.mjs'])destinations.set(prefix+'website/'+name,built.website+'/'+name);
for(const name of ['diagnose-review-stream-20261022.mjs','verify-review-loading-recovery-20261022.mjs','build-review-recovery-candidate-20261022.mjs','backup-review-recovery-20261022.mjs','checkpoint-review-recovery-20261022.mjs'])destinations.set(prefix+'coordination/'+name,path.resolve(name));
const files=[...destinations].map(([relative,from])=>({path:relative,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
assert.equal(files.length,2746);
const bytesFor=relative=>read(destinations.get(relative));
const verifySource=()=>{
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),built.source);
 assert.equal(json('F:/VisibleMedicine/website/atlas-review/integration-inputs.json').sha256,'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59');
 assert.equal(json(built.website+'/atlas-review/integration-inputs.json').sha256,built.review);
 for(const row of files)assert.equal(sha(bytesFor(row.path)),row.sha256,row.path);
};
backup({root:'F:/VisibleMedicine/recovery/checkpoints/20261022-review-recovery-backup',repo:'F:/VisibleMedicine/history/website-work/github-review-recovery-20261022.git',branch:'backup/review-loading-recovery-20261022',parent:parentReceipt.head,parentTree:parentReceipt.tree,parentRepo,files,bytesFor,verifySource,
 sourceIdentity:{installedAtlas:built.source,installedReview:'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59',candidateReview:built.review},
 scope:'Inherited filtered authored source plus two explicit generic loading UI/test files and five authored coordination scripts. No new generated JSON, Review records, runtime, scan pixels/masks, models, private references/notes/decisions, identifiers, credentials/environment, databases, raw logs/media or canonical Git ancestry. Selected authored-source recovery only: not a whole/private/runnable backup. Candidate is not installed or deployed.',
 proof:{selectedSourceOnly:true,newFiles:2,fullTypes:true,productionWebsiteBuild:true,stockReviewVerified:true,newFocusedTests:built.results.find(row=>row.label==='loading-tests').counts,realFrameworkRouteDiscovery:true,base5809SourceUnchanged:true,sourcePaths:5811,manualNewTabRecoveryOnly:true,noAutomaticReloadOrDraftClearing:true,ownerPreviewChanged:false,clinicalApproval:false,patientSpaceRegistration:false,publicDeployment:false,wholeProjectBackup:false,privateDataBackup:false,fullStockRegressionPassing:false}});
