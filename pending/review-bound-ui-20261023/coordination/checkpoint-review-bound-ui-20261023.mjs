// Main-owned recovery of a verified but uninstalled private Review candidate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {saveProposal,finalizeProposal} from './source-proposal-checkpoint.mjs';
const stage='F:/VisibleMedicine/staging/20261023-review-bound-ui-website',sourcePath=stage+'/SOURCE_BOUND.json';
assert.equal(sha(read(sourcePath)),'b7e4b807f9323b864ca67bbf2148a6213c94e454a0e727dc7cbe92f5b23efecf');
const source=json(sourcePath),site=source.website;
const sourceCheck=stage+'/checks/coverage-source/TERMINAL.json';
const codePaths=['lib/atlas-delivery-policy.ts','lib/anatomy-coverage-view.ts','scripts/check-anatomy-coverage.mjs'];
const rows=codePaths.map(p=>source.sourceRows.find(r=>r.path===p));assert(rows.every(Boolean));
const slab=Buffer.alloc(65536);function hash(file){const h=createHash('sha256'),fd=fs.openSync(file,'r');try{let n;while((n=fs.readSync(fd,slab,0,slab.length,null)))h.update(slab.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');}
const verify=()=>{
  assert.equal(sha(read(sourcePath)),'b7e4b807f9323b864ca67bbf2148a6213c94e454a0e727dc7cbe92f5b23efecf');
  for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
  assert.equal(sha(read(source.sourceParent)),source.sourceParentSha256);
  assert.equal(source.wholeRoleCodeInverseVerified,true);assert.equal(source.allSealedParentBytesUnchanged,true);
  assert.equal(source.sourcePaths,6126);assert.equal(source.changedExistingPaths.length,11);
  assert.deepEqual(source.delivery,{audience:'administrator-review',models:137,paths:144,completeModelByteAndPathSetUnchanged:true,permissionOrEntitlementChanged:false});
  for(const phase of [...source.phases,{phase:'coverage-source',receipt:sourceCheck}]){
    const r=json(phase.receipt);assert.equal(r.exit,r.expectedExit);assert.equal(r.expectedExitObserved,true);
    for(const channel of ['stdout','stderr'])assert.equal(sha(read(path.dirname(phase.receipt)+'/'+channel+'.log')),r[channel+'Sha256']);
  }
  assert.equal(json(sourceCheck).exit,0);assert.equal(source.review.inputs,1734);assert.equal(source.viewer.files,46);assert.equal(source.viewer.packages,22);
  assert.equal(source.coverage.contentCountsAndHoldsUnchanged,true);assert.equal(source.plexusPacketAndLocalAssetsUnchanged,true);
  const prep=json(stage+'/PREPARATION.json');
  for(const p of ['lib/plexus-review-manifest.json','.local/plexus-review/assets.ts'])assert.equal(hash(site+'/'+p),hash(prep.sourceParentWebsite+'/'+p));
  assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD']).toString().trim(),source.atlasHead);assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
  assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
};
const report={at:new Date().toISOString(),schema:'vm.private-review-coherent-ui-runtime/1',website:site,sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),sourcePaths:source.sourcePaths,atlas:source.atlas,atlasHead:source.atlasHead,atlasTree:source.atlasTree,
  changedExistingPaths:source.changedExistingPaths,codeChanges:rows,wholeOriginalRoleCodeInversesVerified:true,allSealedParentBytesUnchanged:true,
  delivery:source.delivery,coverage:source.coverage,review:source.review,viewer:source.viewer,phases:source.phases,actualCoverageSourceCheck:{receipt:sourceCheck,sha256:sha(read(sourceCheck)),exit:0},
  focusedNativeCasesPassed:7,expectedStaleConfigurationsRefused:2,plexusPacketAndAssetsUnchanged:true,
  initialCoordinatorDiagnostic:'The coverage-copy utility first failed before executing because a Windows absolute ESM import used an f: protocol. Corrected to a file URL, then the create-only actual producer-output integration completed. Not a product or producer failure.',
  limitations:'Only the unserved successor is changed. The exact delivered model/path set and administrator-review audience are retained; no permission, entitlement, approval, decision, patient-space, accepted-mask or desktop-PACS change. Actual coverage replay establishes four scoped source inventories and unchanged contents/holds, not missing-anatomy completion. Seven focused native tests and actual metadata/access/Review/plexus checks pass; this does not replace full Website types/build/browser, original feature roots or the failed stock gate. Production viewer emits and checks 46 files and22 permissively licensed bundled packages; large-chunk/plugin-timing warnings are retained, not performance acceptance. Generated and private evidence remains F-only. The source-only GitHub subset is neither the whole private candidate nor runnable recovery.',
  pending:source.pending,reviewBound:true,protectedViewerBuiltAndVerified:true,currentDeliveryFixturePending:true,previewChanged:false,installed:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,wholeSuitePassing:false};
const localArtifacts=[[sourcePath,'SOURCE_BOUND.json'],[stage+'/PREPARATION.json','PREPARATION.json'],[stage+'/atlas-delivery-policy.before.ts.raw','preimages/atlas-delivery-policy.ts.raw'],[source.coverage.candidate,'coverage/candidate-manifest.json'],[source.coverage.transition,'coverage/TRANSITION.json']];
for(const name of fs.readdirSync(stage+'/coverage-transition'))if(name.endsWith('.raw'))localArtifacts.push([stage+'/coverage-transition/'+name,'coverage/preimages/'+name]);
for(const scope of ['root','nested','independent','reference','index'])localArtifacts.push([site+'/docs/anatomy-coverage/'+scope+'.json','coverage/'+scope+'.json']);
for(const scope of ['root','nested','independent','reference'])for(const ext of ['.log','-receipt.json'])localArtifacts.push(['F:/VisibleMedicine/staging/20261023-coverage-9e14-replay/candidate/'+scope+ext,'coverage/replay/'+scope+ext]);
for(const name of ['producer-stdout.log','producer-stderr.log'])localArtifacts.push(['F:/VisibleMedicine/staging/20261023-coverage-9e14-replay/'+name,'coverage/replay/'+name]);
for(const phase of [...source.phases,{phase:'coverage-source',receipt:sourceCheck}])for(const file of ['TERMINAL.json','STARTED.json','stdout.log','stderr.log'])localArtifacts.push([path.dirname(phase.receipt)+'/'+file,'checks/'+phase.phase+'/'+file]);
for(const p of ['manifest.json','integration-inputs.json','content/body-renderer-revision.json','content/review-revisions.json'])localArtifacts.push([site+'/atlas-review/'+p,'review/'+p]);
const viewer=json(site+'/public/atlas-review-viewer/manifest.json');
for(const p of ['manifest.json',...viewer.files.map(f=>f.path)])localArtifacts.push([site+'/public/atlas-review-viewer/'+p,'viewer/'+p]);
const utilities=['prepare-review-bound-ui-20261023.mjs','run-review-bound-ui-20261023.mjs','review-bound-ui-coverage-20261023.mjs','seal-review-bound-ui-20261023.mjs','checkpoint-review-bound-ui-20261023.mjs'];
const remoteArtifacts=[...utilities.map(p=>['coordination/'+p,path.resolve(p)]),...rows.map(r=>['candidate/'+r.path,site+'/'+r.path]),
 ['preimages/atlas-delivery-policy.ts.raw',stage+'/atlas-delivery-policy.before.ts.raw'],
 ...['lib__anatomy-coverage-view.ts.before.raw','scripts__check-anatomy-coverage.mjs.before.raw'].map(n=>['preimages/'+n,stage+'/coverage-transition/'+n])];
const config={id:'review-bound-ui-20261023',root:'F:/VisibleMedicine/recovery/checkpoints/20261023-review-bound-ui',stage,site,key:'pendingAtlasRuntimeRollforward',rows,verify,review:report,localArtifacts,remoteArtifacts,
  parent:{receipt:'F:/VisibleMedicine/recovery/checkpoints/20261023-ui-runtime-delivery-source-backup/github-backup.json',receiptSha256:'f3f854da7a028c76683d556fe82bbb947addf55f69c29ae38dcf97b7cb4b9245',repo:'F:/VisibleMedicine/history/website-work/github-ui-runtime-delivery-20261023.git'},
  backupRepo:'F:/VisibleMedicine/history/website-work/github-review-bound-ui-20261023.git',sourceIdentity:{atlasHead:source.atlasHead,atlasTree:source.atlasTree,sourceReceiptSha256:sha(read(sourcePath)),websiteIntegrationSha256:source.review.integrationHash},
  backupScope:'Inherited verified filtered source plus5coordinator recipes,3narrow inventory/coverage code changes and3exact source preimages. Excludes all generated Review/viewer/runtime/model/inventory data, clinical/private packets and asset maps, source inventories/legal outputs, raw process/log/replay records, scans/identifiers/decisions/masks, and canonical Git ancestry. Full generated evidence/complete source-manifest closure remain F-only; not full/private/runnable off-device recovery. No preview restart/install/refresh, public deployment, entitlement or permission widening, clinical approval or patient registration.',
  proof:{namedHostSourcePaths:6126,changedExistingPaths:11,narrowCodeChanges:3,wholeOriginalRoleCodeInversesVerified:true,sourceFiles:1567,reviewInputs:1734,actualProductionViewerBuild:true,viewerFiles:46,bundledPackages:22,actualCoverageScopes:4,coverageSourceInputs:171,coverageContentCountsAndHoldsUnchanged:true,focusedNativeCasesPassed:7,expectedStaleConfigurationsRefused:2,models:137,inventoryPaths:144,audienceUnchanged:'administrator-review',privateDecisionsReadOrMigrated:false,heldPlexusUnchanged:true},
  milestone:'Private Review source, four-scope inventory and protected production viewer coherently bound and verified in an uninstalled candidate',pending:report.pending,
  summary:{candidate:site,sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),sourcePathsTotal:6126,atlas:source.atlas,head:source.atlasHead,tree:source.atlasTree,priorCheckpoint:'F:/VisibleMedicine/recovery/checkpoints/20261023-ui-runtime-delivery/checkpoint.json',reviewSourceFiles:1567,reviewInputs:1734,reviewBound:true,protectedViewerBuiltAndVerified:true,viewerFiles:46,bundledPackages:22,coverageScopes:4,coverageSourceInputs:171,coverageContentCountsAndHoldsUnchanged:true,models:137,inventoryPaths:144,audienceUnchanged:'administrator-review',privatePlexusUnchanged:true,currentDeliveryFixturePending:true,fullWebsiteTypesBuildBrowserAndReleasePending:true}};
if(process.argv.includes('--finalize')){
  const result=finalizeProposal(config),p=json('CURRENT_CHECKPOINT.json');p.next=report.pending;p.activeWork.current.next=report.pending;p.activeWork.current.beforeFurtherWork=report.pending;p.activeWork.updated=new Date().toISOString();
  const text=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(text)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',text);console.log(JSON.stringify({...result,pointerBytes:Buffer.byteLength(text)}));
}else console.log(JSON.stringify(saveProposal(config)));
