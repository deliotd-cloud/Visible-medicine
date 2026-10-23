// Main-only live observation / source-import review. No runtime installation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261023-atlas-runtime-materialized';
const materialized=stage+'/MATERIALIZED.json',native=json(materialized);
assert.equal(sha(read(materialized)),'2ad32ac583cf72d59abdcefabbfe03d79ddf5378aaec825067d6dc60748bfa2f');
const root='F:/VisibleMedicine/staging/20261023-atlas-review-9e14-import',site=root+'/website',prep=json(root+'/PREPARATION.json');
assert.equal(prep.atlas,native.atlas);assert.equal(prep.atlasHead,native.head);
const planPath='F:/VisibleMedicine/staging/20261023-runtime-rollforward-plan/PLAN.json';
assert.equal(sha(read(planPath)),'8e2c6d4c11a21af2c83504949abe5080fe01d4187484696ba7625e3c379b0488');
const plan=json(planPath);
for(const row of plan.sourceEvidence)assert.equal(sha(read(row.path)),row.sha256,row.path);
const pointer=json('CURRENT_CHECKPOINT.json');assert.equal(pointer.goal.status,'active');assert.equal(pointer.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
const started=json(root+'/STARTED.json');
if(process.argv.includes('--observe')){
 const pwsh='C:/Users/delio/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe';
 const facts=JSON.parse(execFileSync(pwsh,['-NoProfile','-NonInteractive','-Command',`@(Get-CimInstance Win32_Process -Filter 'ProcessId=${started.pid} OR ProcessId=${started.coordinatorPid}'|Select-Object ProcessId,ParentProcessId,Name,CreationDate,WorkingSetSize)|ConvertTo-Json -Compress`],{encoding:'utf8',windowsHide:true})||'[]');
 const terminalExists=fs.existsSync(root+'/TERMINAL.json'),child=facts.find(r=>r.ProcessId===started.pid),parent=facts.find(r=>r.ProcessId===started.coordinatorPid);
 const live=!!child&&!!parent&&child.Name==='node.exe'&&parent.Name==='node.exe'&&child.ParentProcessId===parent.ProcessId;
 const evidence={at:new Date().toISOString(),role:'atlas9e14-source-import',processes:facts,live,terminalExists,source:native.head,execSession:57483,evidence:root,previewChanged:false};
 const file=root+'/OBSERVATION-'+Date.now()+'.json';fs.writeFileSync(file,JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
 pointer.activeWork.current.activeExecutionSessions=pointer.activeWork.current.activeExecutionSessions.filter(r=>r.role!=='atlas9e14-source-import');
 if(live&&!terminalExists)pointer.activeWork.current.activeExecutionSessions.push({role:evidence.role,driverPid:started.coordinatorPid,pid:started.pid,execSession:57483,evidence:root,source:native.head,observation:file,observationSha256:sha(read(file)),ownerPreviewChanged:false});
 pointer.activeWork.current.pendingAtlasRuntimeRollforward={materialized,materializedSha256:sha(read(materialized)),atlas:native.atlas,head:native.head,tree:native.tree,files:native.files,models:native.models,allTrackedBytesVerified:true,modelsAreNotNewAdmission:true,sourceImport:root,sourceImportLive:live&&!terminalExists,sourceImportTerminal:terminalExists,sourceImportHeapMiB:128,workerPlan:planPath,workerPlanSha256:sha(read(planPath)),previewChanged:false,installed:false};
 pointer.activeWork.updated=evidence.at;const text=JSON.stringify(pointer,null,2)+'\n';assert(Buffer.byteLength(text)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',text);console.log(JSON.stringify({observation:file,live,terminalExists,files:native.files,previewChanged:false}));
}else{
 const terminal=json(root+'/TERMINAL.json');assert.equal(terminal.code,0);assert.equal(terminal.wholeOriginalImporterInverse,true);
 assert.equal(terminal.importerSha256,sha(read(site+'/scripts/import-clinical-review.mjs')));
 assert.equal(terminal.stdoutSha256,sha(read(root+'/import.stdout.log')));assert.equal(terminal.stderrSha256,sha(read(root+'/import.stderr.log')));
 assert.equal(sha(read(prep.originalReview)),prep.originalReviewSha256);
 const prior=json(prep.originalReview),current=json(site+'/atlas-review/manifest.json');assert.equal(current.revision,native.head);
 assert.equal(prior.revision,'7978478992f54ea68e0f53c3d195c459c7b80068');assert.equal(current.files.length,1567);assert.deepEqual(current.packages,prior.packages);
 assert.deepEqual(current.files.map(r=>r.path),prior.files.map(r=>r.path));
 const committed=new Map(native.rows.map(r=>[r.path,r])),old=new Map(prior.files.map(r=>[r.path,r])),changed=[],bindingInverses=[];
 const binder='F:/VisibleMedicine/staging/20261022-atlas-teaching-website-composition/website/scripts/bind-clinical-review.mjs';
 assert.equal(sha(read(binder)),'56feeaebfcbea52a28077a7e4a15e645c2a9c3fbd0be30a7e411d692d1ff9c97');
 const revisionPaths=['content/body-renderer-revision.json','content/review-revisions.json'];
 if(!fs.existsSync(stage+'/REVIEW_PHASE_DIAGNOSTIC.json'))fs.writeFileSync(stage+'/REVIEW_PHASE_DIAGNOSTIC.json',JSON.stringify({at:new Date().toISOString(),recordedAfterEvidenceReview:true,firstMainCheckFailed:true,actualImporterSucceeded:true,message:'The initial main comparison incorrectly treated a host-bound7978 revision document as the raw import-phase output. It failed on content/review-revisions.json; no source importer or native asset defect was established.',oldBoundImportedSha256:old.get('content/review-revisions.json').importedSha256,newUnboundImportedSha256:current.files.find(r=>r.path==='content/review-revisions.json').importedSha256,correction:'Use the actual checked binder two-path ownership and restore the complete old source bytes through its exact inverse. Keep every1567source/imported hash assertion, not a broad binding exception.'},null,2)+'\n',{flag:'wx'});
 const allowed=json('F:/VisibleMedicine/recovery/checkpoints/20261023-atlas-playback-bound-candidate/checkpoint.json').sourceRows.map(r=>r.path);
 let bytes=0;
 for(const row of current.files){
  const source=committed.get(row.path);assert(source,row.path);assert.equal(row.sourceSha256,source.sha256,row.path+': exact committed native source');
  const imported=read(site+'/atlas-review/'+row.path);assert.equal(sha(imported),row.importedSha256,row.path+': actual imported bytes');bytes+=imported.length;
  const previous=old.get(row.path);
  if(revisionPaths.includes(row.path)){
   // The prior manifest is POST host-binding. Reconstruct its complete raw
   // source rather than expecting its host-specific stamps in a new raw import.
   const oldFile=new URL('./atlas-review/'+row.path,new URL('file:///'+prep.originalReview.replaceAll('\\','/').replace(/\/atlas-review\/manifest\.json$/,'/') ));
   const oldBytes=read(oldFile);assert.equal(sha(oldBytes),previous.importedSha256);
   const value=JSON.parse(oldBytes);assert.equal(value.websiteIntegrationSha256,prior.websiteIntegrationSha256);
   if(row.path==='content/body-renderer-revision.json'){value.sha256=value.sourceRendererSha256;delete value.sourceRendererSha256;}
   else{value.revisions=value.sourceRevisions;delete value.sourceRevisions;assert.deepEqual(JSON.parse(imported).revisions,value.revisions);}
   delete value.websiteIntegrationSha256;
   const restored=Buffer.from(JSON.stringify(value,null,2)+'\n');assert.equal(sha(restored),previous.sourceSha256,'Complete old binding inverse: '+row.path);
   assert.equal(row.importedSha256,row.sourceSha256,'Raw JSON import retains complete exact native source: '+row.path);
   bindingInverses.push({path:row.path,oldBound:previous.importedSha256,oldRaw:sha(restored),newRaw:row.importedSha256});
  }
  if(previous.sourceSha256!==row.sourceSha256){assert(allowed.includes(row.path),'Unexpected source transition: '+row.path);changed.push({path:row.path,sourceBefore:previous.sourceSha256,sourceAfter:row.sourceSha256,importedBefore:previous.importedSha256,importedAfter:row.importedSha256});}
  else if(!revisionPaths.includes(row.path))assert.equal(row.importedSha256,previous.importedSha256,row.path+': unchanged source retains exact imported adaptation');
 }
 const expectedChanged=allowed.filter(p=>old.has(p));assert.deepEqual(changed.map(r=>r.path).sort(),expectedChanged.sort());
 for(const file of ['content/body-review-display-pins.json','content/review-revisions.json','content/nested-review-bindings.json']){
  if(!old.has(file))continue;assert.equal(current.files.find(r=>r.path===file).sourceSha256,old.get(file).sourceSha256,'Display/source guard stays unchanged before host binding: '+file);
 }
 assert.equal(Object.hasOwn(current,'websiteIntegrationSha256'),false,'This is an unbound source import, never an admitted protected Review delivery');
 assert.equal(runGit(['-C',native.atlas,'status','--porcelain']).toString().trim(),'');
 assert.equal(runGit(['-C',native.atlas,'rev-parse','HEAD']).toString().trim(),native.head);
 const script=read(site+'/scripts/import-clinical-review.mjs').toString(),previousScript=read(root+'/import-clinical-review.before.mjs.raw');
 const after="const revision = '9e1407629bd6f85061537c9f013fd72e4543e0da';",before="const revision = '7978478992f54ea68e0f53c3d195c459c7b80068';";
 assert.equal(script.split(after).length,2);assert.deepEqual(Buffer.from(script.replace(after,before)),previousScript);
 const report={at:new Date().toISOString(),schema:'vm.atlas9e14-unbound-review-import-review/1',materialized,materializedSha256:sha(read(materialized)),source:native.head,sourceTree:native.tree,atlas:native.atlas,files:native.files,allTrackedBytesMatchGitBlobs:true,localSourceModels:native.models,newModelAdmission:false,sourceImport:root,sourceImporter:site+'/scripts/import-clinical-review.mjs',sourceImporterSha256:sha(Buffer.from(script)),originalImporterSha256:sha(previousScript),completeOriginalImporterInverse:true,actualImporterExit:terminal.code,heapMiB:128,importedFiles:current.files.length,importedBytes:bytes,importedPackages:current.packages.length,manifest:site+'/atlas-review/manifest.json',manifestSha256:sha(read(site+'/atlas-review/manifest.json')),changedImportedSources:changed,allImportedBytesAndNativeSourceHashesVerified:true,allUnchangedAdaptationsExact:true,
  oldHostBindingInverses:bindingInverses,allUnchangedSourceAdaptationsExactAtCorrectProducerPhase:true,firstReviewPhaseDiagnostic:stage+'/REVIEW_PHASE_DIAGNOSTIC.json',firstReviewPhaseDiagnosticSha256:sha(read(stage+'/REVIEW_PHASE_DIAGNOSTIC.json')),
  plan:planPath,planSha256:sha(read(planPath)),planEvidenceFilesVerified:plan.sourceEvidence.length,
  planReview:['The source-only missing-model precondition is resolved by the separate exact6272-file materialized clone; that does not resolve the absent runtime builds.','The clean materialized source still has no new module build/export. Use installed local Vite binary rather than allowing npx to install anything.','Create-only runtime export targets, exact Review source-commit transition, Website binding, held-plexus verification, inventory/policy, full tests/types/build/browser and explicit preview hold remain required.','All146tracked GLBs are local committed build inputs, not146approved export/admission records. Preserve existing model unions and holds; never export a directory glob.'],
  scope:'Actual bounded producer source import and complete byte/source closure only. No host Website application, runtime builds/export, protected Review viewer, private decisions, patient data, approval or spatial registration were created or changed. Raw imported source/metadata and models remain F-only.',unboundReview:true,protectedReviewReady:false,runtimeBuiltOrExported:false,fullTypesBuildBrowserPending:true,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,previewChanged:false,installed:false,publicDeployment:false};
 fs.writeFileSync(stage+'/MAIN_REVIEW.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({review:stage+'/MAIN_REVIEW.json',sha256:sha(read(stage+'/MAIN_REVIEW.json')),importedFiles:current.files.length,changed:changed.map(r=>r.path),allSourceAndImportedBytesVerified:true,unboundReview:true,protectedReviewReady:false,previewChanged:false}));
}
