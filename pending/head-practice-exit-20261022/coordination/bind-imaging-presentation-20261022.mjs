import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root=process.argv[2]??'F:/VisibleMedicine/staging/20261022-imaging-presentation-candidate';assert(['F:/VisibleMedicine/staging/20261022-imaging-presentation-candidate','F:/VisibleMedicine/staging/20261022-head-practice-exit-candidate'].includes(root));const prep=json(root+'/PREPARED.json'),previous=json(prep.previousSource),site=prep.website;
assert.equal(sha(read(prep.previousSource)),prep.previousSourceSha256);assert(!fs.existsSync(root+'/binding'));
fs.mkdirSync(root+'/binding');const commands=[];
const env={...nativeAtlasEnvironment({atlas:prep.atlas,revision:prep.atlasHead,tree:prep.atlasTree}),VM_WEBSITE_ROOT:site};
const jobs=[['review-bind',['scripts/bind-clinical-review.mjs']],['review-build',['scripts/build-clinical-review-viewer.mjs']],['review-verify',['scripts/verify-clinical-review.mjs']],['model-check',['scripts/atlas-model-inventory.mjs','--check']],['policy-check',['--experimental-strip-types','scripts/verify-atlas-delivery-policy.mjs']],['catalog-check',['scripts/lecture-body-catalog.mjs','--check']]];
let failure=null;
try{
 for(const[label,args]of jobs){
  const out=fs.createWriteStream(root+'/binding/'+label+'.stdout.log',{flags:'wx'}),err=fs.createWriteStream(root+'/binding/'+label+'.stderr.log',{flags:'wx'}),child=spawn(process.execPath,args,{cwd:site,env,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);console.log(JSON.stringify({label,pid:child.pid}));
  const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
  commands.push({label,args,...outcome,stdoutSha256:sha(read(out.path)),stderrSha256:sha(read(err.path))});assert.equal(outcome.code,0,label);
 }
 const binding=json(site+'/atlas-review/integration-inputs.json'),oldBinding=json(previous.website+'/atlas-review/integration-inputs.json'),viewer=json(site+'/public/atlas-review-viewer/manifest.json');
 assert.equal(binding.sourceCommit,prep.atlasHead);assert.equal(binding.inputs.length,1729);assert.equal(viewer.files.length,46);assert.deepEqual(viewer.packages,json(previous.website+'/public/atlas-review-viewer/manifest.json').packages);
 const oldInputs=new Map(oldBinding.inputs.map(r=>[r.path,r.sha256]));assert.deepEqual(binding.inputs.filter(r=>oldInputs.get(r.path)!==r.sha256).map(r=>r.path),['components/HeadAtlasViewer.tsx']);
 assert.equal(viewer.websiteIntegrationSha256,binding.sha256);
 // Maintain only the explicit current Review role; all old assertions and pins survive.
 const pin=json(site+'/tests/fixtures/current-atlas-delivery.json');assert.equal(pin.reviewIntegration,prep.previousReview);pin.reviewIntegration=binding.sha256;
 const changedDocs=[];for(const p of Object.keys(pin.documents)){const h=sha(read(site+'/'+p));if(h!==pin.documents[p])changedDocs.push(p);pin.documents[p]=h;}
 assert.deepEqual(changedDocs.sort(),['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json'].sort());
 fs.writeFileSync(site+'/tests/fixtures/current-atlas-delivery.json',JSON.stringify(pin,null,2)+'\n');
 const testPath=site+'/tests/head-model-access-integration.test.mjs',old=read(testPath).toString();assert.equal(old.split(prep.previousReview).length,2);const next=old.replace(prep.previousReview,binding.sha256);assert.equal(next.replace(binding.sha256,prep.previousReview),old);fs.writeFileSync(testPath,next);
 const missing=previous.sourceRows.filter(r=>!fs.existsSync(site+'/'+r.path));
 for(const row of missing){assert(/^public\/atlas-review-viewer\/assets\/[A-Za-z0-9_-]+\.(?:js|css)$/.test(row.path));assert.equal(sha(read(previous.website+'/'+row.path)),row.sha256);fs.mkdirSync(path.dirname(site+'/'+row.path),{recursive:true});fs.copyFileSync(previous.website+'/'+row.path,site+'/'+row.path,fs.constants.COPYFILE_EXCL);}
 for(const row of previous.sourceRows)assert.equal(sha(read(previous.website+'/'+row.path)),row.sha256,'Frozen previous: '+row.path);
 assert.equal(runGit(['-C',prep.atlas,'status','--porcelain']).toString().trim(),'');
 const result={at:new Date().toISOString(),code:0,commands,review:binding.sha256,boundInputs:binding.inputs.length,importedSources:json(site+'/atlas-review/manifest.json').files.length,viewerFiles:viewer.files.length,viewerPackages:viewer.packages.length,changedBindingInputs:['components/HeadAtlasViewer.tsx'],restoredCompatibilityAssets:missing,sourceUnchanged:prep.atlasHead,currentPinDocumentsChanged:changedDocs,ownerPreviewChanged:false,canonicalInstalled:false};
 fs.writeFileSync(root+'/BINDING.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/BINDING.json',review:binding.sha256,restoredAssets:missing.length}));
}catch(error){failure=String(error);fs.writeFileSync(root+'/BINDING_FAILED.json',JSON.stringify({commands,failure,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});throw error;}
