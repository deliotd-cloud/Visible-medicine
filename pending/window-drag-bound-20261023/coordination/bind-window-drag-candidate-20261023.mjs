// Main-owned create-only Website/Review candidate. Never serves or installs it.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync,execFileSync} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const stage='F:/VisibleMedicine/staging/20261023-window-drag-bound',site=stage+'/website';
const parentFile='F:/VisibleMedicine/staging/20261023-ui-recovery-integrated/SOURCE_INTEGRATED.json';assert.equal(sha(read(parentFile)),'e48afc8471eee287c2464f3bd4eb4b2709847b35954ebf54686530ac68bef5a4');const parent=json(parentFile),phase=process.argv[2];
const write=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true}).trim();
function hash(file){const h=createHash('sha256'),fd=fs.openSync(file,'r'),b=Buffer.alloc(65536);try{let n;while((n=fs.readSync(fd,b,0,b.length,null)))h.update(b.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');}
const history='tests/fixtures/window-drag-binding-before/';
const oldFiles=['scripts/bind-clinical-review.mjs','tests/current-atlas-delivery.test.mjs','tests/current-ui-delivery-transition.test.mjs','tests/fixtures/current-atlas-delivery.json','atlas-review/manifest.json','atlas-review/integration-inputs.json','atlas-review/content/body-renderer-revision.json','atlas-review/content/review-revisions.json','public/atlas-review-viewer/manifest.json'];
if(phase==='prepare'){
 assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);assert(!fs.existsSync(stage));fs.mkdirSync(stage);
 assert.equal(git('-C','F:/VisibleMedicine/website','rev-parse','HEAD'),'b953ff3f5f1891599cb6e91cb91311d9d6006270');assert.equal(git('-C','F:/VisibleMedicine/atlas','rev-parse','HEAD'),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 git('clone','--shared','--no-checkout','F:/VisibleMedicine/website',site);git('-C',site,'read-tree','HEAD');
 for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256);const to=containedTarget(site,r.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(parent.website+'/'+r.path,to,fs.constants.COPYFILE_EXCL);assert.equal(hash(to),r.sha256);}
 fs.symlinkSync(parent.website+'/node_modules',site+'/node_modules','junction');fs.symlinkSync(parent.atlas,stage+'/atlas','junction');
 const checkpoint='F:/VisibleMedicine/recovery/checkpoints/20261023-window-drag-interruption/checkpoint.json';assert.equal(hash(checkpoint),'da541450cd282a2253f62553a764febc8e3ddf126d09a13c314910a6c32fb7c8');const overlay=json(checkpoint);
 for(const r of overlay.sourceRows){const from='F:/VisibleMedicine/staging/20261023-window-drag-interruption/website/'+r.path;assert.equal(hash(from),r.sha256);const to=containedTarget(site,r.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.existsSync(to)?0:fs.constants.COPYFILE_EXCL);}
 const preimages=[];for(const p of oldFiles){const to=containedTarget(site,history+p+'.raw');fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(site+'/'+p,to,fs.constants.COPYFILE_EXCL);preimages.push({path:p,preserved:history+p+'.raw',sha256:hash(to)});}
 write(stage+'/PREPARATION.json',{at:new Date().toISOString(),website:site,parentReceipt:parentFile,parentReceiptSha256:hash(parentFile),atlas:parent.atlas,atlasHead:parent.atlasHead,atlasTree:parent.atlasTree,overlayCheckpoint:checkpoint,overlayRows:overlay.sourceRows,preimages,previewChanged:false,installed:false});
 console.log(JSON.stringify({phase,paths:parent.sourceRows.length,overlayPaths:overlay.sourceRows.length,preimages:preimages.length}));
}else if(phase==='capture'){
 const prep=json(stage+'/PREPARATION.json'),old=json(site+'/'+history+'tests/fixtures/current-atlas-delivery.json.raw');
 const before=json(site+'/'+history+'atlas-review/integration-inputs.json.raw'),current=json(site+'/atlas-review/integration-inputs.json');assert.equal(before.inputs.length,1734);assert.equal(current.inputs.length,1735);
 const expected=before.inputs.map(r=>r.path==='scripts/bind-clinical-review.mjs'?{...r,sha256:hash(site+'/'+r.path)}:r).concat([{path:'lib/head-window-drag.ts',sha256:hash(site+'/lib/head-window-drag.ts')}]).sort((a,b)=>a.path.localeCompare(b.path));assert.deepEqual(current.inputs,expected);assert.equal(current.sha256,sha(JSON.stringify(expected)));
 const documents=Object.fromEntries(Object.keys(old.documents).map(p=>[p,hash(site+'/'+p)]));const pin={...old,reviewIntegration:current.sha256,documents};
 assert.equal(pin.source,prep.atlasHead);assert.equal(pin.sourceTree,prep.atlasTree);assert.equal(pin.reviewSourceFiles,1567);
 const viewer=json(site+'/public/atlas-review-viewer/manifest.json'),oldViewer=json(site+'/'+history+'public/atlas-review-viewer/manifest.json.raw');assert.equal(viewer.websiteIntegrationSha256,current.sha256);assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.mode,'production');assert.deepEqual(viewer.packages,oldViewer.packages);assert.equal(viewer.files.length,46);for(const f of viewer.files)assert.equal(hash(site+'/public/atlas-review-viewer/'+f.path),f.sha256);
 write(stage+'/CAPTURE.json',{at:new Date().toISOString(),previousPinSha256:hash(site+'/'+history+'tests/fixtures/current-atlas-delivery.json.raw'),oldIntegration:before.sha256,newIntegration:current.sha256,previousInputCount:1734,newInputCount:1735,onlyBindingInputDelta:['scripts/bind-clinical-review.mjs','lib/head-window-drag.ts'],pin,changedDocuments:Object.keys(documents).filter(p=>documents[p]!==old.documents[p]),clinicalOrAccessApproval:false,previewChanged:false});
 fs.writeFileSync(site+'/tests/fixtures/current-atlas-delivery.json',JSON.stringify(pin,null,2)+'\n');
 const testFile=site+'/tests/current-atlas-delivery.test.mjs',oldTest=read(testFile).toString(),from='assert.equal(sourceFiles,1567);assert.equal(inputs,1734);assert(artifacts>100);',to=from.replace('1734','1735');assert.equal(oldTest.split(from).length,2);fs.writeFileSync(testFile,oldTest.replace(from,to));
 console.log(JSON.stringify({phase,inputCount:1735,newIntegration:current.sha256,pinSha256:hash(site+'/tests/fixtures/current-atlas-delivery.json')}));
}else if(phase==='seal'){
 const prep=json(stage+'/PREPARATION.json'),beforeViewer=json(site+'/'+history+'public/atlas-review-viewer/manifest.json.raw'),viewer=json(site+'/public/atlas-review-viewer/manifest.json');
 const oldViewer=new Set(['public/atlas-review-viewer/manifest.json',...beforeViewer.files.map(r=>'public/atlas-review-viewer/'+r.path)]),newViewer=new Set(['public/atlas-review-viewer/manifest.json',...viewer.files.map(r=>'public/atlas-review-viewer/'+r.path)]);
 const allowed=['lib/head-window-drag.ts','scripts/bind-clinical-review.mjs','tests/current-atlas-delivery.test.mjs','tests/current-ui-delivery-transition.test.mjs','tests/fixtures/current-atlas-delivery.json','atlas-review/manifest.json','atlas-review/integration-inputs.json','atlas-review/content/body-renderer-revision.json','atlas-review/content/review-revisions.json'];
 const rows=[],changed=[],removed=[];
 for(const row of parent.sourceRows){assert.equal(hash(parent.website+'/'+row.path),row.sha256,'Parent source unchanged '+row.path);if(oldViewer.has(row.path))continue;assert(fs.existsSync(site+'/'+row.path),row.path);const digest=hash(site+'/'+row.path);if(digest!==row.sha256)changed.push(row.path);rows.push({path:row.path,bytes:fs.statSync(site+'/'+row.path).size,sha256:digest});}
 assert.deepEqual(changed.sort(),allowed.sort());
 const additions=['tests/head-window-drag-interruption.test.ts','tests/window-drag-review-binding.test.mjs',...prep.preimages.map(r=>r.preserved)];
 for(const p of [...additions,...newViewer])rows.push({path:p,bytes:fs.statSync(site+'/'+p).size,sha256:hash(site+'/'+p)});
 for(const p of oldViewer)if(!newViewer.has(p)){assert(!fs.existsSync(site+'/'+p),'Old hashed viewer output was removed only inside this candidate');removed.push(p);}
 assert.equal(parent.sourceRows.filter(r=>r.path.startsWith('public/atlas-review-viewer/')).length,oldViewer.size);assert.equal(new Set(rows.map(r=>r.path)).size,rows.length);assert.equal(rows.length,6146);rows.sort((a,b)=>a.path.localeCompare(b.path));
 for(const r of json(parent.buildArtifacts).files)assert.equal(hash(parent.website+'/dist/'+r.path),r.sha256,'Parent build unchanged '+r.path);
 const checks=fs.readdirSync(stage+'/checks').map(n=>{const r=json(stage+'/checks/'+n+'/TERMINAL.json');assert.equal(hash(stage+'/checks/'+n+'/stdout.log'),r.stdoutSha256);assert.equal(hash(stage+'/checks/'+n+'/stderr.log'),r.stderrSha256);assert.equal(r.exitCode,r.expectedExit);return r;});
 const test=checks.find(r=>r.phase==='tests');assert.equal(test.counts.tests,64);assert.equal(test.counts.pass,64);assert.equal(test.counts.fail+test.counts.skipped+test.counts.cancelled,0);
 const artifacts=[];function walk(dir,prefix=''){for(const f of fs.readdirSync(dir,{withFileTypes:true})){assert(!f.isSymbolicLink());const name=prefix+f.name,target=dir+'/'+f.name;if(f.isDirectory())walk(target,name+'/');else{assert(f.isFile());artifacts.push({path:name,bytes:fs.statSync(target).size,sha256:hash(target)});}}}walk(site+'/dist');artifacts.sort((a,b)=>a.path.localeCompare(b.path));
 write(stage+'/BUILD_ARTIFACTS.json',{at:new Date().toISOString(),root:site+'/dist',files:artifacts,bytes:artifacts.reduce((n,r)=>n+r.bytes,0),localOnly:true});
 const receipt={...prep,at:new Date().toISOString(),sourceRows:rows,sourcePaths:rows.length,changedNonViewerPaths:changed,addedNonViewerPaths:additions,removedViewerPaths:removed,newViewerPaths:[...newViewer].sort(),checks,nativeCasesPassed:64,reviewInputs:1735,reviewSourceFiles:1567,reviewBindingSha256:json(site+'/atlas-review/integration-inputs.json').sha256,viewerFiles:46,viewerPackages:22,atlasSourceAndLearnerModulesUnchanged:true,originalContractsAndValidatorInverseVerified:true,actualPrebuildPassed:true,actualProductionBuildPassed:true,buildArtifacts:stage+'/BUILD_ARTIFACTS.json',buildArtifactsSha256:hash(stage+'/BUILD_ARTIFACTS.json'),buildFiles:artifacts.length,fullProjectTypesPassing:false,wholeSuitePassing:false,authenticatedAcceptance:false,privateDecisionsReadOrMigrated:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,previewChanged:false,installed:false};
 write(stage+'/SOURCE_BOUND.json',receipt);console.log(JSON.stringify({phase,sourcePaths:rows.length,removedViewerPaths:removed.length,buildFiles:artifacts.length,sourceReceipt:stage+'/SOURCE_BOUND.json',sha256:hash(stage+'/SOURCE_BOUND.json')}));
}else{
 const prep=json(stage+'/PREPARATION.json');
 const specs={
  stale:{args:['--max-old-space-size=128','scripts/verify-clinical-review.mjs'],expected:1},
  bind:{args:['--max-old-space-size=128','scripts/bind-clinical-review.mjs'],expected:0},
  viewer:{args:['--max-old-space-size=384','scripts/build-clinical-review-viewer.mjs'],expected:0},
  verify:{args:['--max-old-space-size=128','scripts/verify-clinical-review.mjs'],expected:0},
  tests:{args:['--max-old-space-size=128','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap','tests/head-window-drag-interruption.test.ts','tests/head-window-drag.test.ts','tests/current-atlas-delivery.test.mjs','tests/current-ui-delivery-transition.test.mjs','tests/window-drag-review-binding.test.mjs'],expected:0},
  prebuild:{args:['--max-old-space-size=128',path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),'run','prebuild'],expected:0},
  build:{args:['--max-old-space-size=384','node_modules/vinext/dist/cli.js','build'],expected:0},
 };
 const spec=specs[phase];assert(spec,'Unknown phase');if(phase==='build')assert(!fs.existsSync(site+'/dist'));if(phase==='viewer'){const out=fs.realpathSync(site+'/public/atlas-review-viewer');assert.equal(out.replaceAll('\\','/').toLowerCase(),(site+'/public/atlas-review-viewer').toLowerCase());assert(!fs.lstatSync(out).isSymbolicLink());}
 const dir=stage+'/checks/'+phase;assert(!fs.existsSync(dir));fs.mkdirSync(dir,{recursive:true});const out=fs.openSync(dir+'/stdout.log','wx'),err=fs.openSync(dir+'/stderr.log','wx');const start={at:new Date().toISOString(),phase,args:spec.args,cwd:site,expectedExit:spec.expected,previewChanged:false};write(dir+'/STARTED.json',start);
 const r=spawnSync(process.execPath,spec.args,{cwd:site,env:{...process.env,NODE_OPTIONS:'--max-old-space-size='+(phase==='viewer'||phase==='build'?384:128),VM_ATLAS_SOURCE_REPO:prep.atlas,RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'},stdio:['ignore',out,err],windowsHide:true});fs.closeSync(out);fs.closeSync(err);
 const text=read(dir+'/stdout.log').toString(),counts=Object.fromEntries(['tests','pass','fail','skipped','cancelled'].map(k=>[k,Number(text.match(new RegExp('^# '+k+' (\\d+)$','m'))?.[1]??-1)]));
 const result={...start,finishedAt:new Date().toISOString(),exitCode:r.status,signal:r.signal,error:r.error?String(r.error):null,counts,stdoutSha256:hash(dir+'/stdout.log'),stderrSha256:hash(dir+'/stderr.log')};write(dir+'/TERMINAL.json',result);if(phase==='stale')assert.match(read(dir+'/stderr.log').toString(),/Review input changed; rebind and rebuild: scripts\/bind-clinical-review.mjs/);console.log(JSON.stringify({phase,exit:r.status,counts}));assert.equal(r.status,spec.expected);
}
