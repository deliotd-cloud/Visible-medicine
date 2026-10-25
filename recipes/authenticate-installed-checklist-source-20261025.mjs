import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261025-checklist-installed-source-auth';
assert(!fs.existsSync(stage));fs.mkdirSync(stage,{recursive:true});
const site='F:/VisibleMedicine/website',atlas='F:/VisibleMedicine/atlas';
const installationFile='F:/VisibleMedicine/recovery/local-cutover/20261021-colic-ultrasound/INSTALLATION.json';
const installSha='91b5d24a1da449787319c0d282816816d1e89a1fb2b493fe5924494bb2cdadf9';
assert.equal(hash(installationFile),installSha);const installation=json(installationFile);
assert.equal(installation.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(installation.tree,'e9165d7122361f809a267af1414b337b69097fe2');
assert.equal(installation.publicDeployment,false);assert.equal(installation.clinicalApproval,false);
assert.equal(installation.spatialRegistration,false);assert.equal(installation.atlasFastForwardVerified,true);
assert.equal(hash(installation.sourceSnapshot),'693de4623b0bbaf4c8c41d5e97ad77dc9b214a0210d16b45fc50035c28e9c5f7');
const snapshot=json(installation.sourceSnapshot);assert.equal(snapshot.length,5730);
const historicalRows=new Map(snapshot.map(r=>[r.path,r]));assert.equal(historicalRows.size,snapshot.length);
const env={...process.env,GIT_OPTIONAL_LOCKS:'0',GIT_NO_REPLACE_OBJECTS:'1'};
const git=(repo,ref)=>execFileSync('git',['--no-replace-objects','-C',repo,'rev-parse',ref],{encoding:'utf8',windowsHide:true,env}).trim();
assert.equal(git(atlas,'HEAD'),installation.source);assert.equal(git(atlas,'HEAD^{tree}'),installation.tree);
assert.equal(git(site,'HEAD'),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert.equal(execFileSync('git',['-C',atlas,'status','--porcelain','--untracked-files=no'],{encoding:'utf8',windowsHide:true,env}).trim(),'');
const realSite=fs.realpathSync(site),realAtlas=fs.realpathSync(atlas);
function contained(root,realRoot,p){
  assert(typeof p==='string'&&p.length>0&&p.length<500&&!p.includes('\\')&&!p.includes('\0')&&!path.isAbsolute(p)&&!p.includes(':'));
  assert(!p.split('/').some(part=>!part||part==='.'||part==='..'||part.startsWith('.env')));
  const target=path.resolve(root,p),relative=path.relative(realRoot,fs.realpathSync(target));
  assert(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative));assert(fs.statSync(target).isFile());return target;
}
const pin=p=>({path:p,sha256:hash(p)}),manifestRows=[];
const names=['head-neck','shoulder','lower-limb','female-pelvis'];
const documents=['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json',...names.map(n=>'public/atlas-runtime/'+n+'/manifest.json')];
for(const p of documents){
  const old=historicalRows.get(p);assert(old,p);const actual=contained(site,realSite,p);
  assert.equal(hash(actual),old.sha256,p+': exact recorded installation bytes');assert.equal(fs.statSync(actual).size,old.bytes);
  manifestRows.push({...old});
}
const review=json(site+'/atlas-review/manifest.json'),inputs=json(site+'/atlas-review/integration-inputs.json'),viewer=json(site+'/public/atlas-review-viewer/manifest.json');
assert.equal(review.revision,installation.source);assert.equal(review.websiteIntegrationSha256,installation.review);assert.equal(review.files.length,1558);
assert.equal(inputs.sourceCommit,installation.source);assert.equal(inputs.sha256,installation.review);assert.equal(inputs.inputs.length,1721);
assert.equal(createHash('sha256').update(JSON.stringify(inputs.inputs)).digest('hex'),installation.review);
const boundRows=[];for(const row of inputs.inputs){assert.equal(hash(contained(site,realSite,row.path)),row.sha256,row.path);boundRows.push(row);}
const importedRows=[];for(const row of review.files){
  assert.equal(hash(contained(site,realSite,'atlas-review/'+row.path)),row.importedSha256,'imported '+row.path);
  assert.equal(hash(contained(atlas,realAtlas,row.path)),row.sourceSha256,'native '+row.path);
  importedRows.push(row);
}
assert.equal(viewer.sourceCommit,installation.source);assert.equal(viewer.websiteIntegrationSha256,installation.review);assert.equal(viewer.personalRecordsIncluded,false);
for(const row of viewer.files)assert.equal(hash(contained(site,realSite,'public/atlas-review-viewer/'+row.path)),row.sha256,row.path);
const modules={};
for(const name of names){
  const relative='public/atlas-runtime/'+name+'/manifest.json',m=json(site+'/'+relative);
  const commit=name==='head-neck'?installation.source:'190a63238eadcf906abe89dcbb6a67c88afe70b9';
  assert.equal(m.sourceCommit,commit);assert.equal(git(atlas,commit+'^{commit}'),commit);
  assert.equal(m.patientDataIncluded,false);assert.equal(m.clinicalApproved,false);
  for(const row of m.files)assert.equal(hash(contained(site,realSite,'public/atlas-runtime/'+name+'/'+row.path)),row.sha256,name+'/'+row.path);
  modules[name]={manifestPath:relative,manifestSha256:hash(site+'/'+relative),sourceCommit:commit,sourceTree:git(atlas,commit+'^{tree}'),files:m.files.length,patientDataIncluded:false,clinicalApproved:false};
}
const result={schema:'vm-authenticated-installed-atlas-readback/1',at:new Date().toISOString(),passing:true,existingInstallation:{path:installationFile,sha256:installSha},existingInstallationSnapshot:pin(installation.sourceSnapshot),canonicalWebsiteHead:git(site,'HEAD'),atlasCommit:installation.source,atlasTree:installation.tree,reviewIntegration:installation.review,reviewSources:1558,protectedInputs:1721,manifestRows,reviewViewerFiles:viewer.files.length,reviewViewerPackages:viewer.packages.length,modules,allSevenCurrentManifestsByteExactToRecordedInstallation:true,allProtectedInputsByteVerified:true,allImportedAndOriginalNativeSourceBytesVerified:true,allDeclaredLearnerAndReviewViewerArtifactsVerified:true,originalNativeTrackedWorktreeClean:true,installedSourceNotInferredFromLatestCandidate:true,teaching:{draft:9377,pending:528,generated:31,placements:9936,evidence:'F:/VisibleMedicine/recovery/checkpoints/20261021-colic-ultrasound-installed/checkpoint.json'},newInstallationExecuted:false,ownerPreviewChanged:false,clinicalApproval:false,patientRegistration:false,privateDataUploaded:false,publicDeployment:false};
fs.writeFileSync(stage+'/AUTHENTICATED_INSTALLATION.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({evidence:pin(stage+'/AUTHENTICATED_INSTALLATION.json'),reviewSources:1558,protectedInputs:1721,reviewViewerFiles:viewer.files.length,modules:Object.fromEntries(Object.entries(modules).map(([k,v])=>[k,{source:v.sourceCommit,files:v.files}]))}));
