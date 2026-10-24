// Main-owned isolated Website composition; never install into the normal preview.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawn,execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const stage='F:/VisibleMedicine/staging/20261024-practice-actions-website',site=stage+'/website';
const atlas='F:/VisibleMedicine/staging/20261024-practice-actions/atlas',head='7659453d7d99da78742b06ee6e6665a467e5d972',tree='386b175434aa1f7cbcd705e05f0946b3b594ca54';
const parentFile='F:/VisibleMedicine/staging/20261024-upper-vascular-website/SOURCE_BOUND.json',sourceFile='F:/VisibleMedicine/staging/20261024-practice-actions/SOURCE_BOUND.json',phase=process.argv[2];
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const git=(repo,...a)=>execFileSync('git',['-C',repo,...a],{encoding:'utf8',windowsHide:true,maxBuffer:32e6,stdio:'pipe'}).trim();
assert.equal(hash(parentFile),'40fd40cba3b6f75253e0f3b825bd02d6a94e876e6d8aafedb5e8a043ce1ed8e2');
assert.equal(hash(sourceFile),'65f5d2747c9a2229cb0c3e723315103f618db6d8bc2fdec2fc41d60939e8f660');
assert.equal(git(atlas,'rev-parse','HEAD'),head);assert.equal(git(atlas,'rev-parse','HEAD^{tree}'),tree);assert.equal(git(atlas,'status','--porcelain'),'');
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
const parent=json(parentFile),generated=p=>p.startsWith('atlas-review/')||p.startsWith('public/atlas-review-viewer/')||p.startsWith('public/atlas-runtime/');
if(phase==='prepare'){
 assert(!fs.existsSync(stage));fs.mkdirSync(stage);
 git('F:/VisibleMedicine/website','clone','--shared','--no-checkout','F:/VisibleMedicine/website',site);git(site,'read-tree','HEAD');const rows=[];
 for(const r of parent.sourceRows){
  assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);if(generated(r.path))continue;
  const to=containedTarget(site,r.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(parent.website+'/'+r.path,to,fs.constants.COPYFILE_EXCL);rows.push(r);
 }
 fs.symlinkSync(parent.website+'/node_modules',site+'/node_modules','junction');fs.symlinkSync(atlas,stage+'/atlas','junction');
 const names=['scripts/import-clinical-review.mjs','tests/current-atlas-delivery.mjs','tests/upper-vascular-current-delivery.test.mjs','tests/current-atlas-delivery.test.mjs','tests/fixtures/current-atlas-delivery.json','lib/atlas-model-inventory.json','lib/atlas-delivery-policy.ts','lib/lecture-body-catalog.json','lib/anatomy-coverage-view.ts','scripts/check-anatomy-coverage.mjs','components/clinical-review-inbox.css',...['root','nested','independent','reference','index'].map(n=>'docs/anatomy-coverage/'+n+'.json')];
 const preimages=names.map(p=>{const saved=stage+'/preimages/'+p+'.raw';fs.mkdirSync(path.dirname(saved),{recursive:true});fs.copyFileSync(site+'/'+p,saved,fs.constants.COPYFILE_EXCL);return{path:p,saved,sha256:hash(saved)};});
 write(stage+'/PREPARATION.json',{at:new Date().toISOString(),website:site,atlas,atlasHead:head,atlasTree:tree,parentReceipt:parentFile,parentReceiptSha256:hash(parentFile),atlasReceipt:sourceFile,atlasReceiptSha256:hash(sourceFile),baseSourceRows:rows,preimages,allFourRuntimeSourcesAdvance:true,nativeSourceBuildVerified:true,modulesNeedFreshBuild:true,previewChanged:false,installed:false});
 console.log(JSON.stringify({stage,baseSourceRows:rows.length,preimages:preimages.length}));
}else if(phase==='capture'){
 const old=json(stage+'/preimages/tests/fixtures/current-atlas-delivery.json.raw'),m=json(site+'/atlas-review/manifest.json'),b=json(site+'/atlas-review/integration-inputs.json'),v=json(site+'/public/atlas-review-viewer/manifest.json');
 assert.equal(m.revision,head);assert.equal(v.sourceCommit,head);assert.equal(v.websiteIntegrationSha256,b.sha256);assert.equal(v.personalRecordsIncluded,false);assert.equal(v.mode,'production');for(const r of b.inputs)assert.equal(hash(site+'/'+r.path),r.sha256);
 const runtimeSources=Object.fromEntries(Object.keys(old.runtimeSources).map(n=>[n,json(site+'/public/atlas-runtime/'+n+'/manifest.json').sourceCommit]));for(const revision of Object.values(runtimeSources))assert.equal(revision,head);
 const pin={...old,source:head,sourceTree:tree,runtimeSources,reviewSourceFiles:m.files.length,reviewIntegration:b.sha256,viewerFiles:v.files.length,viewerPackages:v.packages.length,documents:Object.fromEntries(Object.keys(old.documents).map(p=>[p,hash(site+'/'+p)]))};
 fs.writeFileSync(site+'/tests/fixtures/current-atlas-delivery.json',JSON.stringify(pin,null,2)+'\n');write(stage+'/CAPTURE.json',{at:new Date().toISOString(),pin,pinSha256:hash(site+'/tests/fixtures/current-atlas-delivery.json'),sourceFiles:m.files.length,inputs:b.inputs.length,viewerFiles:v.files.length,viewerPackages:v.packages.length,previewChanged:false});
 console.log(JSON.stringify({sourceFiles:m.files.length,inputs:b.inputs.length,viewerFiles:v.files.length,binding:b.sha256}));
}else{
 assert(fs.existsSync(stage+'/VALIDATION_SLOT_ACQUIRED.json'),'Await explicit serial validation-slot handoff');
 const npm=path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
 const specs={
  shoulder:[atlas,512,['node_modules/vite/bin/vite.js','build','--config','integration/shoulder/vite.config.mjs']],regional:[atlas,512,['node_modules/vite/bin/vite.js','build','--config','integration/head-neck/vite.config.mjs']],
  lower:[atlas,512,['node_modules/vite/bin/vite.js','build','--config','integration/lower-limb/vite.config.mjs']],pelvis:[atlas,512,['node_modules/vite/bin/vite.js','build','--config','integration/female-pelvis/vite.config.mjs']],
  exportShoulder:[atlas,128,['scripts/export-shoulder-module.mjs',site+'/public/atlas-runtime/shoulder']],exportRegional:[atlas,128,['scripts/export-head-neck-module.mjs',site+'/public/atlas-runtime/head-neck']],exportLower:[atlas,128,['scripts/export-lower-limb-module.mjs',site+'/public/atlas-runtime/lower-limb']],exportPelvis:[atlas,128,['scripts/export-female-pelvis-module.mjs',site+'/public/atlas-runtime/female-pelvis']],
  import:[site,256,['scripts/import-clinical-review.mjs',atlas]],inventory:[site,128,['scripts/atlas-model-inventory.mjs']],lecture:[site,128,['scripts/lecture-body-catalog.mjs']],coverage:[site,256,['scripts/generate-anatomy-coverage.mjs','--source-root',atlas,'--revision',head,'--output-root',stage+'/coverage-candidate']],coverageCheck:[site,128,['scripts/check-anatomy-coverage.mjs','--source-root',atlas,'--check']],
  bind:[site,128,['scripts/bind-clinical-review.mjs']],viewer:[site,768,['scripts/build-clinical-review-viewer.mjs']],verify:[site,128,['scripts/verify-clinical-review.mjs']],prebuild:[site,256,[npm,'run','prebuild']],build:[site,768,['node_modules/vinext/dist/cli.js','build']],
  feature:[site,768,['--experimental-strip-types','--test','--test-reporter=tap','--test-concurrency=1','tests/practice-actions-current-delivery.test.mjs']],
  tests:[site,768,['--experimental-strip-types','--test','--test-reporter=tap','--test-concurrency=1','tests/tour-explore-current-delivery.test.mjs','tests/tour-explore-focus-current-delivery.test.mjs','tests/upper-vascular-current-delivery.test.mjs','tests/practice-actions-current-delivery.test.mjs','tests/current-atlas-delivery.test.mjs','tests/head-practice-navigation-policy.test.ts','tests/head-practice-navigation-integration.test.mjs','tests/head-practice-exit.test.mjs','tests/atlas-region-picker.test.ts','tests/atlas-workspace-simplification.test.ts','tests/head-separate-comparison.test.ts','tests/head-learning-handoff.test.ts','tests/head-comparison-source-scope.test.ts','tests/head-comparison-compact-ui.test.mjs','tests/review-viewer-lazy-boundary.test.mjs','tests/clinical-review-return.test.ts','tests/clinical-review-panel-presentation.test.ts','tests/clinical-review-navigation-guard.test.ts','tests/clinical-review-navigation-preservation.test.mjs','tests/clinical-review-inbox.test.ts','tests/clinical-review-inbox-short-desktop.test.mjs']],
 };
 const spec=specs[phase.replace(/-v\d+$/,'')];assert(spec,'Unknown phase '+phase);
 const[cwd,heap,args]=spec,dir=stage+'/checks/'+phase;assert(!fs.existsSync(dir));assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.activeExecutionSessions.length,0);fs.mkdirSync(dir,{recursive:true});
 const out=fs.createWriteStream(dir+'/stdout.log',{flags:'wx'}),err=fs.createWriteStream(dir+'/stderr.log',{flags:'wx'}),started={at:new Date().toISOString(),phase,cwd,args,heapMiB:heap,previewChanged:false};
 const child=spawn(process.execPath,['--max-old-space-size='+heap,...args],{cwd,env:{...process.env,NODE_OPTIONS:'--max-old-space-size='+heap,RAYON_NUM_THREADS:'1',GOMAXPROCS:'2',VM_ATLAS_SOURCE_REPO:atlas,GIT_NO_REPLACE_OBJECTS:'1'},stdio:['ignore','pipe','pipe'],windowsHide:true});
 child.stdout.pipe(out);child.stderr.pipe(err);write(dir+'/STARTED.json',{...started,pid:child.pid,driverPid:process.pid});
 function state(live){const p=json('CURRENT_CHECKPOINT.json');p.activeWork.current.activeExecutionSessions=p.activeWork.current.activeExecutionSessions.filter(r=>r.role!=='practice-actions-website');if(live)p.activeWork.current.activeExecutionSessions.push({role:'practice-actions-website',phase,pid:child.pid,driverPid:process.pid,evidence:dir,previewChanged:false});const text=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(text)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',text);}
 state(true);console.log(JSON.stringify({phase,pid:child.pid}));
 const result=await new Promise(resolve=>{child.once('error',e=>resolve({code:null,error:e.message}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
 const text=fs.readFileSync(out.path,'utf8'),counts=Object.fromEntries(['tests','pass','fail','skipped','cancelled'].map(k=>[k,Number(text.match(new RegExp('^# '+k+' (\\d+)$','m'))?.[1]??-1)]));
 write(dir+'/TERMINAL.json',{...started,...result,finishedAt:new Date().toISOString(),counts,stdoutSha256:hash(out.path),stderrSha256:hash(err.path),resourceFailure:/heap out of memory|Reached heap limit/i.test(fs.readFileSync(err.path,'utf8'))});state(false);console.log(JSON.stringify({phase,...result,counts}));process.exitCode=result.code===0?0:1;
}
