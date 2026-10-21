import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-source190-website',prep=json(stage+'/PREPARATION.json'),site=prep.site,plan=json(stage+'/NATIVE_PIN_PLAN.json');
assert(json(stage+'/STOCK_IMPORT.json').all137ModelsUnchanged);
const originals=prep.original,source=prep.sourceCommit;
const replaceAllExact=(p,replacements)=>{
 const before=read(originals+'/'+p).toString(),actual=read(site+'/'+p).toString();let next=before;
 for(const [from,to] of replacements){assert.equal(next.split(from).length,2,p+' exact seam');next=next.replace(from,to);}
 assert.equal(actual,next,p+' exact native admission');let inverse=actual;
 for(const[from,to]of [...replacements].reverse()){assert.equal(inverse.split(to).length,2,p+' exact inverse');inverse=inverse.replace(to,from);}assert.equal(inverse,before,p+' whole source inverse');
 return{path:p,beforeSha256:sha(before),sha256:sha(actual),exactWholeInverse:true};
};
const changes=[
 replaceAllExact('scripts/import-clinical-review.mjs',[['485df97c2530e8e81a8d39a5ee61073ce76d93db',source]]),
 replaceAllExact('lib/anatomy-coverage-view.ts',[
 ['485df97c2530e8e81a8d39a5ee61073ce76d93db',source],['443eeaa198c30e88d73aa6d89f37376715ccd23bb6c27c5c904a075c39cbe31c',plan.coverageSnapshot],['9786b30019f418881824a20026ee66c2d3e16d4a3231f6cea85975687cbe6d1a',plan.coveragePackage]]),
 replaceAllExact('lib/atlas-delivery-policy.ts',[['5fe61d14688706a07349802cb30a5200461fd3385f5eaa680b5973f5b046836d',plan.privateModelInventory]])];
const checkerOld=read(originals+'/scripts/check-anatomy-coverage.mjs').toString(),checkerNow=read(site+'/scripts/check-anatomy-coverage.mjs').toString();
const oldArtifacts=json(originals+'/docs/anatomy-coverage/index.json').sourceArtifacts,newArtifacts=json(site+'/docs/anatomy-coverage/index.json').sourceArtifacts;
changes.push(replaceAllExact('scripts/check-anatomy-coverage.mjs',[
 ['485df97c2530e8e81a8d39a5ee61073ce76d93db',source],...oldArtifacts.map(old=>[old.sha256,newArtifacts.find(n=>n.scope===old.scope).sha256])]));
assert.equal(checkerOld.includes('clinicalApproval'),checkerNow.includes('clinicalApproval'));
const fd=fs.openSync(stage+'/BIND_BUILD.log','wx'),commands=[];
function run(args){const begin=Date.now(),r=spawnSync(process.execPath,args,{cwd:site,windowsHide:true,stdio:['ignore',fd,fd],env:{...process.env,VM_ATLAS_SOURCE_REPO:prep.atlas,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1',NODE_OPTIONS:'--max-old-space-size=4096'}});commands.push({args,code:r.status,signal:r.signal,durationMs:Date.now()-begin});assert.equal(r.status,0,args[0]);}
try{
 fs.writeFileSync(stage+'/EXACT_NATIVE_ADMISSION.json',JSON.stringify({changes,plan,canonicalInstalled:false},null,2)+'\n',{flag:'wx'});
 run(['scripts/verify-atlas-delivery-policy.mjs']);run(['scripts/bind-clinical-review.mjs']);run(['scripts/build-clinical-review-viewer.mjs']);run(['scripts/verify-clinical-review.mjs']);
 const before=json(originals+'/public/atlas-review-viewer/manifest.json'),viewer=json(site+'/public/atlas-review-viewer/manifest.json');
 assert.deepEqual([...viewer.packages].sort((a,b)=>a.name.localeCompare(b.name)),[...before.packages].sort((a,b)=>a.name.localeCompare(b.name)));
 const imported=json(site+'/atlas-review/manifest.json'),binding=json(site+'/atlas-review/integration-inputs.json');assert.equal(imported.revision,source);assert.equal(viewer.sourceCommit,source);assert.equal(binding.sha256,imported.websiteIntegrationSha256);assert.equal(viewer.websiteIntegrationSha256,binding.sha256);
 assert.equal(imported.files.length,1553);assert.equal(binding.inputs.length,1710);assert.equal(viewer.files.length,46);assert.equal(viewer.packages.length,22);assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);
 const prior=json(originals+'/tests/fixtures/current-atlas-delivery.json'),current=structuredClone(prior);
 current.source=source;current.sourceTree=prep.sourceTree;current.reviewIntegration=binding.sha256;current.reviewSourceFiles=imported.files.length;
 for(const p of Object.keys(current.documents))current.documents[p]=sha(read(site+'/'+p));
 const fixture=site+'/tests/fixtures/source190-admission';fs.mkdirSync(fixture,{recursive:true});
 fs.copyFileSync(originals+'/tests/fixtures/current-atlas-delivery.json',fixture+'/previous-current.json',fs.constants.COPYFILE_EXCL);
 fs.copyFileSync(originals+'/scripts/import-clinical-review.mjs',fixture+'/importer-before.mjs.raw',fs.constants.COPYFILE_EXCL);
 const proof={previousCurrentSha256:sha(read(fixture+'/previous-current.json')),previousTestSha256:sha(read(site+'/tests/current-atlas-delivery.test.mjs')),previousImporterSha256:sha(read(fixture+'/importer-before.mjs.raw')),modelsSha256:sha(JSON.stringify(json(originals+'/lib/atlas-model-inventory.json').models)),viewerPackagesSha256:sha(JSON.stringify([...before.packages].sort((a,b)=>a.name.localeCompare(b.name)))),source,tree:prep.sourceTree,canonicalInstalled:false,clinicalApproval:false};
 fs.writeFileSync(fixture+'/admission.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});
 fs.writeFileSync(site+'/tests/fixtures/current-atlas-delivery.json',JSON.stringify(current,null,2)+'\n');
 for(const row of json(stage+'/ORIGINAL_485_INPUTS.json'))assert.equal(sha(read(originals+'/'+row.path)),row.sha256,'Closed485unchanged:'+row.path);
 fs.closeSync(fd);const result={commands,source,tree:prep.sourceTree,review:binding.sha256,sourceFiles:1553,boundInputs:1710,viewerFiles:46,viewerPackages:22,all137ModelsUnchanged:true,all22PackagesUnchanged:true,original485Unchanged:true,log:stage+'/BIND_BUILD.log',logSha256:sha(read(stage+'/BIND_BUILD.log')),currentFixtureSha256:sha(read(site+'/tests/fixtures/current-atlas-delivery.json')),canonicalInstalled:false,ownerPreviewUnchanged:true,clinicalApproval:false,fullWebsiteSuitePass:false,publicDeployment:false};
 fs.writeFileSync(stage+'/BIND_BUILD.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
}catch(error){fs.closeSync(fd);fs.writeFileSync(stage+'/BIND_BUILD_FAILURE.json',JSON.stringify({commands,error:String(error),logSha256:sha(read(stage+'/BIND_BUILD.log')),canonicalInstalled:false},null,2)+'\n',{flag:'wx'});throw error;}
