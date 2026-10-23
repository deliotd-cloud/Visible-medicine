// Main-only checkpoint/source backup for exact build inputs and an unbound import.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {saveProposal,finalizeProposal} from './source-proposal-checkpoint.mjs';
const stage='F:/VisibleMedicine/staging/20261023-atlas-review-9e14-import',site=stage+'/website';
const nativeStage='F:/VisibleMedicine/staging/20261023-atlas-runtime-materialized';
const materialized=nativeStage+'/MATERIALIZED.json',native=json(materialized),reviewPath=nativeStage+'/MAIN_REVIEW.json',review=json(reviewPath);
assert.equal(sha(read(materialized)),'2ad32ac583cf72d59abdcefabbfe03d79ddf5378aaec825067d6dc60748bfa2f');
assert.equal(sha(read(reviewPath)),'1ebca28e8cd5c6a990b53cf584eb8ef00863d9c09fb68a07ff4d0cf72ffaf80f');
const rows=[{path:'scripts/import-clinical-review.mjs',bytes:read(review.sourceImporter).length,sha256:review.sourceImporterSha256}];
const slab=Buffer.alloc(65536);const hash=file=>{const h=createHash('sha256'),fd=fs.openSync(file,'r');try{let n;while((n=fs.readSync(fd,slab,0,slab.length,null)))h.update(slab.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');};
const verify=()=>{
 assert.equal(sha(read(materialized)),review.materializedSha256);assert.equal(sha(read(reviewPath)),'1ebca28e8cd5c6a990b53cf584eb8ef00863d9c09fb68a07ff4d0cf72ffaf80f');
 assert.equal(sha(read(review.sourceImporter)),review.sourceImporterSha256);assert.equal(sha(read(stage+'/import-clinical-review.before.mjs.raw')),review.originalImporterSha256);
 const terminal=json(stage+'/TERMINAL.json');assert.equal(terminal.code,0);assert.equal(terminal.stdoutSha256,sha(read(stage+'/import.stdout.log')));assert.equal(terminal.stderrSha256,sha(read(stage+'/import.stderr.log')));
 assert.equal(sha(read(review.manifest)),review.manifestSha256);
 const imports=json(review.manifest);assert.equal(imports.files.length,1567);assert.equal(imports.revision,native.head);assert(!Object.hasOwn(imports,'websiteIntegrationSha256'));
 const indexed=new Map(native.rows.map(r=>[r.path,r]));for(const r of imports.files){assert.equal(r.sourceSha256,indexed.get(r.path)?.sha256);assert.equal(hash(site+'/atlas-review/'+r.path),r.importedSha256,r.path);}
 for(const r of native.rows)assert.equal(hash(native.atlas+'/'+r.path),r.sha256,'Materialized native byte drift: '+r.path);
 assert.equal(runGit(['-C',native.atlas,'rev-parse','HEAD']).toString().trim(),native.head);assert.equal(runGit(['-C',native.atlas,'rev-parse','HEAD^{tree}']).toString().trim(),native.tree);assert.equal(runGit(['-C',native.atlas,'status','--porcelain']).toString().trim(),'');
 assert.equal(runGit(['-C',native.source,'rev-parse','HEAD']).toString().trim(),native.head);assert.equal(runGit(['-C',native.source,'status','--porcelain']).toString().trim(),'');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 assert.equal(sha(read(review.plan)),review.planSha256);const plan=json(review.plan);for(const r of plan.sourceEvidence)assert.equal(sha(read(r.path)),r.sha256);
};
const utilities=['materialize-atlas-runtime-inputs-20261023.mjs','prepare-atlas-review-9e14-import-20261023.mjs','review-atlas-runtime-rollforward-20261023.mjs','checkpoint-atlas-runtime-rollforward-20261023.mjs'];
const prep=json(stage+'/PREPARATION.json');
const localArtifacts=[...['PLAN.json','MATERIALIZED.json','MAIN_REVIEW.json','REVIEW_PHASE_DIAGNOSTIC.json'].map(p=>[nativeStage+'/'+p,'native/'+p]),
 ...['PREPARATION.json','STARTED.json','TERMINAL.json','import.stdout.log','import.stderr.log','import-clinical-review.before.mjs.raw'].map(p=>[stage+'/'+p,'import/'+p]),
 [review.manifest,'import/manifest.json'],[prep.originalReview,'prior-bound-7978-manifest.json'],[review.plan,'worker/PLAN.json'],['F:/VisibleMedicine/staging/20261023-runtime-rollforward-plan/SUMMARY.md','worker/SUMMARY.md']];
const pending='The6272-file clean9e14Atlas build input is ready and1567-file protected Review SOURCE import is exact but UNBOUND. The146local tracked models are not146approved delivery assets. Build and export regional/shoulder modules only with observed resource recovery and absent fresh targets, then perform exact Website presentation/Review binding, held-plexus checks, protected viewer/inventory and independent access gates. Preserve the separate6457-path test successor and failed6044-case stock receipt; eight original feature roots/full native/types/build/browser and full71/eight roadmap remain incomplete. Never install/restart/refresh the owner-held preview or manufacture approvals, new model admission, public deployment or patient-space registration.';
const config={id:'atlas-runtime-rollforward-20261023',root:'F:/VisibleMedicine/recovery/checkpoints/20261023-atlas-runtime-rollforward',stage,site,key:'pendingAtlasRuntimeRollforward',rows,verify,review,localArtifacts,
 remoteArtifacts:[['current/scripts/import-clinical-review.mjs',review.sourceImporter],['preimage/import-clinical-review.before.mjs.raw',stage+'/import-clinical-review.before.mjs.raw'],...utilities.map(p=>['coordination/'+p,path.resolve(p)])],
 parent:{receipt:'F:/VisibleMedicine/recovery/checkpoints/20261023-release-epoch-successor-source-backup/github-backup.json',receiptSha256:'adb5c1ddb5220551ad589c39505b7b6ae295490ea17b925e7c5f7075f02ea914',repo:'F:/VisibleMedicine/history/website-work/github-release-epoch-successor-20261023.git'},
 backupRepo:'F:/VisibleMedicine/history/website-work/github-atlas-runtime-rollforward-20261023.git',sourceIdentity:{atlasHead:native.head,atlasTree:native.tree,materializedReceiptSha256:sha(read(materialized)),unboundReviewManifestSha256:review.manifestSha256,sourceImporterSha256:review.sourceImporterSha256},
 backupScope:'Inherited verified filtered source plus one existing importer with a single reviewed exact7978-to9e14commit literal change, its complete authored code preimage and four main source-preparation/review/checkpoint utilities. Native Atlas materialization6272files/146tracked GLBs is local-only and does not admit or approve146models. The actual128MiB producer imports1567source files and all raw imports/source hashes verify, but Review is intentionally UNBOUND: no runtime/export, protected viewer, Website binding, private decisions, clinical/spatial/public-release acceptance or preview cutover. Full materialized/imported generated metadata, model/media binaries, raw logs, source manifests/resource/process facts, private data/references/decisions and canonical Git ancestry remain F-only. Source-only partial recovery, not whole/private/runnable backup.',
 proof:{materializedFiles:6272,allTrackedWorkingBytesMatchGitBlobs:true,localTrackedModels:146,newModelAdmission:false,actualSourceImportExit:0,heapMiB:128,importedFiles:1567,allImportedBytesAndSourceHashesVerified:true,changedImportedSources:4,completeOriginalImporterInverse:true,oldHostBindingExactInverses:2,unboundReview:true,protectedReviewReady:false,runtimeBuiltOrExported:false,fullTypesBuildBrowserPending:true},
 milestone:'Exact6272-file Atlas build input and actual1567-file9e14Review source import prepared without runtime/preview cutover',pending,
 summary:{materialized,materializedSha256:sha(read(materialized)),atlas:native.atlas,head:native.head,tree:native.tree,materializedFiles:6272,localTrackedModels:146,newModelAdmission:false,sourceImport:stage,sourceImportLive:false,sourceImportTerminal:true,sourceImportExit:0,sourceImportHeapMiB:128,importedFiles:1567,unboundReview:true,protectedReviewReady:false,runtimeBuiltOrExported:false,fullTypesBuildBrowserPending:true,workerPlan:review.plan,workerPlanSha256:review.planSha256},
 coordinationUpdate:{state:'idle/completed; runtime roll-forward plan reviewed; main materialization and raw Review import verified',cursor:'09786c67-a526-4f3e-9592-4f73d6c47d39:20',pendingAssignment:{state:'completed; all14inspected file hashes verified; execution plan adjusted for materialized inputs and raw-vs-bound Review phase',result:review.plan,resultSha256:review.planSha256,mainReview:reviewPath,mainReviewSha256:sha(read(reviewPath)),mainReviewPending:false}}};
if(process.argv.includes('--finalize')){
 const result=finalizeProposal(config),p=json('CURRENT_CHECKPOINT.json');
 p.activeWork.current.activeExecutionSessions=p.activeWork.current.activeExecutionSessions.filter(r=>r.role!=='atlas9e14-source-import');
 p.next=pending;p.activeWork.current.next=pending;p.activeWork.current.beforeFurtherWork=pending;p.activeWork.updated=new Date().toISOString();
 const text=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(text)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',text);console.log(JSON.stringify({...result,pointerBytes:Buffer.byteLength(text)}));
}else console.log(JSON.stringify(saveProposal(config)));
