// Actual source/runtime/Review producer import into an isolated website only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-renal-tour-website-candidate',prep=json(root+'/WEBSITE_PREPARED.json');
const site=prep.website,atlas=prep.atlas,source=json(prep.sourceReceipt),prior=source.website;
assert(!fs.existsSync(root+'/SOURCE_IMPORT.json'));assert(!fs.existsSync(root+'/import-logs'));
assert.equal(sha(read(prep.sourceReceipt)),prep.sourceReceiptSha256);assert.equal(sha(read(prep.runtimeReceipt)),prep.runtimeReceiptSha256);
const runtime=json(prep.runtimeReceipt),newManifest=json(runtime.target+'/manifest.json');assert.equal(runtime.code,0);
assert.equal(sha(read(runtime.target+'/manifest.json')),runtime.manifestSha256);assert.equal(newManifest.sourceCommit,prep.source);
for(const row of source.sourceRows)assert.equal(sha(read(site+'/'+row.path)),row.sha256,'Unchanged copy: '+row.path);
fs.mkdirSync(root+'/import-logs');const commands=[];let failure=null;
const environment={...nativeAtlasEnvironment({atlas,revision:prep.source,tree:prep.tree}),VM_WEBSITE_ROOT:site};
const replaceOne=(text,from,to)=>{assert.equal(text.split(from).length,2,from.slice(0,90));return text.replace(from,to);};
function mechanical(p,change){const before=read(site+'/'+p),after=Buffer.from(change(before.toString()));
 const to=containedTarget(root+'/PRE_IMPORT',p);assert(!fs.existsSync(to));fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(site+'/'+p,to);fs.writeFileSync(site+'/'+p,after);}
async function run(label,args){
 const out=fs.createWriteStream(root+'/import-logs/'+label+'.stdout.log',{flags:'wx'}),err=fs.createWriteStream(root+'/import-logs/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd:site,env:environment,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);console.log(JSON.stringify({label,pid:child.pid}));
 const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([out,err].map(stream=>new Promise(resolve=>stream.closed?resolve():stream.once('close',resolve))));
 commands.push({label,args,...outcome,stdoutSha256:sha(read(out.path)),stderrSha256:sha(read(err.path))});assert.equal(outcome.code,0,label);
}
try{
 // Keep previous hashed compatibility assets, but route the current entry and
 // manifest only to the new exact export. No geometry or licence bytes change.
 for(const row of [...newManifest.files,{path:'manifest.json',sha256:runtime.manifestSha256}]){
  const from=runtime.target+'/'+row.path;assert.equal(sha(read(from)),row.sha256);
  const to=containedTarget(site,'public/atlas-runtime/head-neck/'+row.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);
 }
 for(const p of ['scripts/import-clinical-review.mjs','scripts/check-anatomy-coverage.mjs','lib/anatomy-coverage-view.ts'])mechanical(p,text=>replaceOne(text,prep.baseline,prep.source));
 const artifacts=[];let checker=read(site+'/scripts/check-anatomy-coverage.mjs').toString();
 for(const scope of ['root','nested','independent','reference']){
  const p='docs/anatomy-coverage/'+scope+'.json',before=read(site+'/'+p),data=JSON.parse(before);assert.equal(data.sourceRevision,prep.baseline);
  for(const[p,h]of Object.entries(data.evidence.sourceInputs)){
   assert.equal(sha(read(atlas+'/'+p)),h,'Coverage evidence unchanged: '+p);
   assert.equal(sha(runGit(['-C',atlas,'show',prep.source+':'+p])),h,'Committed coverage evidence: '+p);
  }
  data.sourceRevision=prep.source;if(scope==='reference'){assert.equal(data.evidence.commitReadback.revision,prep.baseline);data.evidence.commitReadback.revision=prep.source;}
  const after=Buffer.from(JSON.stringify(data,null,2)+'\n');assert.equal(after.toString().replaceAll(prep.source,prep.baseline),before.toString());
  mechanical(p,()=>after.toString());checker=replaceOne(checker,sha(before),sha(after));artifacts.push({scope,path:p,sha256:sha(after),bytes:after});
 }
 fs.writeFileSync(site+'/scripts/check-anatomy-coverage.mjs',checker);
 const {buildCoverageIndex}=await import(pathToFileURL(site+'/scripts/build-anatomy-coverage-index.mjs'));
 const index=buildCoverageIndex(artifacts),oldIndex=json(prior+'/docs/anatomy-coverage/index.json');
 for(const key of ['scopedCounts','evidence','documentedRootTargetGroups','assessment'])assert.deepEqual(index[key],oldIndex[key],key);
 mechanical('docs/anatomy-coverage/index.json',()=>JSON.stringify(index,null,2)+'\n');
 const oldSnapshot=sha(Buffer.from(JSON.stringify(oldIndex))),nextSnapshot=sha(Buffer.from(JSON.stringify(index)));
 const view=read(site+'/lib/anatomy-coverage-view.ts').toString();const nextView=replaceOne(view,oldSnapshot,nextSnapshot);
 assert.equal(nextView.replace(prep.source,prep.baseline).replace(nextSnapshot,oldSnapshot),read(prior+'/lib/anatomy-coverage-view.ts').toString());fs.writeFileSync(site+'/lib/anatomy-coverage-view.ts',nextView);
 await run('review-import',['scripts/import-clinical-review.mjs',atlas]);
 const imported=json(site+'/atlas-review/manifest.json');assert.equal(imported.revision,prep.source);assert.equal(imported.files.length,1561);
 const previousImport=json(prior+'/atlas-review/manifest.json'),oldByPath=new Map(previousImport.files.map(row=>[row.path,row]));
 const changedImported=imported.files.filter(row=>oldByPath.get(row.path)?.sourceSha256!==row.sourceSha256).map(row=>row.path).sort();
 assert.deepEqual(changedImported,['content/body-renderer-revision.json','content/body-review-display-pins.json','content/renal-tour-pins.json','lib/regional-tours.ts','lib/renal-tour.ts'].sort());
 await run('models',['scripts/atlas-model-inventory.mjs']);
 const inventory=json(site+'/lib/atlas-model-inventory.json');assert.deepEqual(inventory.models,json(prior+'/lib/atlas-model-inventory.json').models);
 for(const module of ['shoulder','lower-limb','female-pelvis'])assert.deepEqual(inventory.sources.find(row=>row.module===module),json(prior+'/lib/atlas-model-inventory.json').sources.find(row=>row.module===module));
 const oldInventory=sha(read(prior+'/lib/atlas-model-inventory.json')),nextInventory=sha(read(site+'/lib/atlas-model-inventory.json'));
 // Exact same administrator-review audience and exact same models; maintain the
 // existing source-byte policy binding, never introduce a new grant.
 mechanical('lib/atlas-delivery-policy.ts',text=>{const after=replaceOne(text,oldInventory,nextInventory);assert.equal(after.replace(nextInventory,oldInventory),text);return after;});
 await run('lecture-catalog',['scripts/lecture-body-catalog.mjs']);
 const catalog=json(site+'/lib/lecture-body-catalog.json'),oldCatalog=json(prior+'/lib/lecture-body-catalog.json');
 const inverse=structuredClone(catalog);inverse.sourceCommit=prep.baseline;assert.deepEqual(inverse,oldCatalog);
 await run('coverage-check',['scripts/check-anatomy-coverage.mjs','--source-root',atlas,'--check']);
 await run('review-bind',['scripts/bind-clinical-review.mjs']);
 await run('review-build',['scripts/build-clinical-review-viewer.mjs']);
 await run('review-verify',['scripts/verify-clinical-review.mjs']);
 await run('model-check',['scripts/atlas-model-inventory.mjs','--check']);
 await run('policy-check',['--experimental-strip-types','scripts/verify-atlas-delivery-policy.mjs']);
 await run('catalog-check',['scripts/lecture-body-catalog.mjs','--check']);
 const binding=json(site+'/atlas-review/integration-inputs.json'),viewer=json(site+'/public/atlas-review-viewer/manifest.json');
 assert.equal(binding.sourceCommit,prep.source);assert.equal(binding.inputs.length,1728);assert.equal(viewer.sourceCommit,prep.source);assert.equal(viewer.files.length,46);assert.equal(viewer.packages.length,22);
 assert.equal(viewer.websiteIntegrationSha256,binding.sha256);assert.deepEqual(viewer.packages,json(prior+'/public/atlas-review-viewer/manifest.json').packages);
 const pin=json(prior+'/tests/fixtures/current-atlas-delivery.json');
 pin.source=prep.source;pin.sourceTree=prep.tree;pin.runtimeSources['head-neck']=prep.source;pin.reviewIntegration=binding.sha256;pin.reviewSourceFiles=imported.files.length;
 for(const p of Object.keys(pin.documents))pin.documents[p]=sha(read(site+'/'+p));
 mechanical('tests/fixtures/current-atlas-delivery.json',()=>JSON.stringify(pin,null,2)+'\n');
 for(const row of source.sourceRows)assert.equal(sha(read(prior+'/'+row.path)),row.sha256,'Frozen predecessor: '+row.path);
 assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');
 const receipt={at:new Date().toISOString(),code:0,commands,website:site,atlas,source:prep.source,tree:prep.tree,review:binding.sha256,boundInputs:binding.inputs.length,importedSources:imported.files.length,
 viewerFiles:viewer.files.length,viewerPackages:viewer.packages.length,changedImported,modelsUnchanged:true,coverageEvidenceAndCountsUnchanged:true,independentLearnerFamiliesUnchanged:true,
 privateAudienceUnchanged:true,retainedOldRuntimeAssets:true,nativeAcceptance:false,typesPassed:false,websiteBuilt:false,canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,publicDeployment:false};
 fs.writeFileSync(root+'/SOURCE_IMPORT.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
}catch(error){failure=String(error);fs.writeFileSync(root+'/SOURCE_IMPORT_FAILED.json',JSON.stringify({at:new Date().toISOString(),commands,error:failure,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});throw error;}
