// Exact local-source closure, not clinical approval or installation authority.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='F:/VisibleMedicine/staging/20261023-review-bound-ui-website',site=root+'/website';
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const prep=json(root+'/PREPARATION.json'),parent=json(prep.sourceParent),transition=json(root+'/coverage-transition/TRANSITION.json');
assert.equal(sha(read(prep.sourceParent)),prep.sourceParentSha256);
const slab=Buffer.alloc(65536);function hash(file){const h=createHash('sha256'),fd=fs.openSync(file,'r');try{let n;while((n=fs.readSync(fd,slab,0,slab.length,null)))h.update(slab.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');}
const readText=p=>read(p).toString('utf8');
function inverse(file,preimage,pairs){let current=readText(site+'/'+file);for(const[from,to]of pairs){assert.equal(current.split(from).length,2,file+' exact unique scalar');current=current.replace(from,to);}assert.equal(current,readText(preimage),file+' whole original inverse');}
inverse(prep.policy,root+'/atlas-delivery-policy.before.ts.raw',[[prep.inventorySha256,prep.priorInventorySha256]]);
inverse('lib/anatomy-coverage-view.ts',root+'/coverage-transition/lib__anatomy-coverage-view.ts.before.raw',[
  [prep.atlasHead,'7978478992f54ea68e0f53c3d195c459c7b80068'],
  [transition.snapshotDigest,'ffe12cc729c09355ddb19b1e827b1b059d1ca09c1386390aee69923244cb8957'],
  [transition.packageDigest,'1b941e171ea58f1b33202019aff9b441cd64ad3640bd2563a43764dc6b57fdb4'],
]);
const oldChecker=readText(root+'/coverage-transition/scripts__check-anatomy-coverage.mjs.before.raw');
const scopes=['root','nested','independent','reference'];
const oldArtifacts=[...oldChecker.matchAll(/sha256:'([a-f0-9]{64})'/g)].map(m=>m[1]);assert.equal(oldArtifacts.length,4);
inverse('scripts/check-anatomy-coverage.mjs',root+'/coverage-transition/scripts__check-anatomy-coverage.mjs.before.raw',[
  [prep.atlasHead,'7978478992f54ea68e0f53c3d195c459c7b80068'],
  ...scopes.map((scope,i)=>[sha(read(site+'/docs/anatomy-coverage/'+scope+'.json')),oldArtifacts[i]]),
]);
assert.deepEqual(json(site+'/lib/atlas-model-inventory.json').models,json(prep.sourceParentWebsite+'/lib/atlas-model-inventory.json').models);
const review=json(site+'/atlas-review/manifest.json'),inputs=json(site+'/atlas-review/integration-inputs.json');
assert.equal(review.revision,prep.atlasHead);assert.equal(review.files.length,1567);assert.equal(inputs.sourceCommit,prep.atlasHead);
assert.equal(sha(JSON.stringify(inputs.inputs)),inputs.sha256);assert.equal(review.websiteIntegrationSha256,inputs.sha256);
for(const f of inputs.inputs)assert.equal(hash(site+'/'+f.path),f.sha256,'Bound input '+f.path);
const revisionFiles=['content/body-renderer-revision.json','content/review-revisions.json'];
const originalReview=json(prep.sourceParentWebsite+'/atlas-review/manifest.json');
for(const f of review.files){
  assert.equal(hash(site+'/atlas-review/'+f.path),f.importedSha256);
  const old=originalReview.files.find(r=>r.path===f.path);assert(old);const b={...f},a={...old};
  if(revisionFiles.includes(f.path)){delete b.importedSha256;delete a.importedSha256;}
  assert.deepEqual(b,a,'Imported source/adaptation unchanged '+f.path);
}
const body=json(site+'/atlas-review/'+revisionFiles[0]),oldBody=json(prep.sourceParentWebsite+'/atlas-review/'+revisionFiles[0]);
const shoulder=json(site+'/atlas-review/'+revisionFiles[1]),oldShoulder=json(prep.sourceParentWebsite+'/atlas-review/'+revisionFiles[1]);
assert.equal(body.sourceRendererSha256,oldBody.sha256);assert.equal(body.websiteIntegrationSha256,inputs.sha256);
const restoredBody={...body,sha256:body.sourceRendererSha256};delete restoredBody.sourceRendererSha256;delete restoredBody.websiteIntegrationSha256;assert.deepEqual(restoredBody,oldBody);
assert.deepEqual(shoulder.sourceRevisions,oldShoulder.revisions);const restoredShoulder={...shoulder,revisions:shoulder.sourceRevisions};delete restoredShoulder.sourceRevisions;delete restoredShoulder.websiteIntegrationSha256;assert.deepEqual(restoredShoulder,oldShoulder);
const viewer=json(site+'/public/atlas-review-viewer/manifest.json');assert.equal(viewer.sourceCommit,prep.atlasHead);assert.equal(viewer.websiteIntegrationSha256,inputs.sha256);assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.modelDelivery,'existing-protected-inventory');
const licenses=new Set(['MIT','ISC','BSD-2-Clause','BSD-3-Clause','Apache-2.0','Zlib']);assert(viewer.packages.length>0);for(const p of viewer.packages)assert(licenses.has(p.license),p.name);
for(const f of viewer.files)assert.equal(hash(site+'/public/atlas-review-viewer/'+f.path),f.sha256);
const changed=[],allowed=new Set([prep.policy,'lib/anatomy-coverage-view.ts','scripts/check-anatomy-coverage.mjs',...['root','nested','independent','reference','index'].map(n=>'docs/anatomy-coverage/'+n+'.json'),'atlas-review/manifest.json',...revisionFiles.map(p=>'atlas-review/'+p)]);
const sourceRows=[];
for(const row of parent.sourceRows){
  assert.equal(hash(prep.sourceParentWebsite+'/'+row.path),row.sha256,'Sealed parent unchanged '+row.path);
  const digest=hash(site+'/'+row.path);if(digest!==row.sha256){assert(allowed.has(row.path),'Unexpected candidate source change '+row.path);changed.push(row.path);}
  sourceRows.push({path:row.path,bytes:fs.statSync(site+'/'+row.path).size,sha256:digest});
}
assert.deepEqual(changed.sort(),[...allowed].sort());
for(const name of ['atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json',...viewer.files.map(f=>'public/atlas-review-viewer/'+f.path)])sourceRows.push({path:name,bytes:fs.statSync(site+'/'+name).size,sha256:hash(site+'/'+name)});
assert.equal(new Set(sourceRows.map(r=>r.path)).size,sourceRows.length);sourceRows.sort((a,b)=>a.path.localeCompare(b.path));
const phases=['policy-stale','policy','policy-tests','coverage-stale','coverage-tests','plexus','bind','bind-reconciled','viewer','verify'].map(name=>{
  const file=root+'/checks/'+name+'/TERMINAL.json',r=json(file);assert.equal(r.expectedExitObserved,true);assert.equal(r.exit,r.expectedExit);
  for(const channel of ['stdout','stderr'])assert.equal(sha(read(root+'/checks/'+name+'/'+channel+'.log')),r[channel+'Sha256']);
  return{phase:name,receipt:file,sha256:sha(read(file)),exit:r.exit,expectedExit:r.expectedExit};
});
const git=(repo,...a)=>execFileSync('git',['-C',repo,...a],{encoding:'utf8',windowsHide:true}).trim();
assert.equal(git(prep.atlas,'rev-parse','HEAD'),prep.atlasHead);assert.equal(git(prep.atlas,'rev-parse','HEAD^{tree}'),prep.atlasTree);assert.equal(git(prep.atlas,'status','--porcelain'),'');
assert.equal(git('F:/VisibleMedicine/website','rev-parse','HEAD'),'b953ff3f5f1891599cb6e91cb91311d9d6006270');assert.equal(git('F:/VisibleMedicine/atlas','rev-parse','HEAD'),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
const result={at:new Date().toISOString(),website:site,atlas:prep.atlas,atlasHead:prep.atlasHead,atlasTree:prep.atlasTree,sourceParent:prep.sourceParent,sourceParentSha256:prep.sourceParentSha256,
  sourcePaths:sourceRows.length,sourceRows,changedExistingPaths:changed,wholeRoleCodeInverseVerified:true,allSealedParentBytesUnchanged:true,
  review:{sourceFiles:1567,integrationHash:inputs.sha256,inputs:inputs.inputs.length,sourceRendererSha256:body.sourceRendererSha256,bodyRendererSha256:body.sha256,privateDecisionsReadOrMigrated:false},
  coverage:{candidate:'F:/VisibleMedicine/staging/20261023-coverage-9e14-replay/candidate/candidate-manifest.json',candidateManifestSha256:transition.candidateManifestSha256,transition:root+'/coverage-transition/TRANSITION.json',transitionSha256:sha(read(root+'/coverage-transition/TRANSITION.json')),scopes:4,sourceInputs:171,contentCountsAndHoldsUnchanged:true},
  delivery:{audience:'administrator-review',models:137,paths:144,completeModelByteAndPathSetUnchanged:true,permissionOrEntitlementChanged:false},
  viewer:{manifestSha256:sha(read(site+'/public/atlas-review-viewer/manifest.json')),files:viewer.files.length,packages:viewer.packages.length,production:true,personalRecordsIncluded:false,allOutputHashesVerified:true,permissivePackageAllowlistVerified:true,warningsRetained:true},phases,
  focusedNativeCasesPassed:7,expectedStaleConfigurationsRefused:2,plexusPacketAndLocalAssetsUnchanged:true,
  previewChanged:false,installed:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,
  fullWebsiteTypesBuildBrowserAndReleasePending:true,wholeSuitePassing:false,
  pending:'Current-delivery fixture/source admission remains old2381 and must not be blindly repinned. Continue exact-source current-delivery transition, original feature tests, full types/Website build and signed-in browser/performance acceptance in isolated candidates. Preserve failed6044-case stock evidence, three Windows symlink skip limits, the eight earlier feature roots and full71/eight roadmap. No normal preview install/restart/refresh without new owner direction.'};
fs.writeFileSync(root+'/SOURCE_BOUND.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:root+'/SOURCE_BOUND.json',sha256:sha(read(root+'/SOURCE_BOUND.json')),sourcePaths:result.sourcePaths,changedExistingPaths:changed.length,reviewInputs:inputs.inputs.length,viewerFiles:viewer.files.length,packages:viewer.packages.length,previewChanged:false}));
