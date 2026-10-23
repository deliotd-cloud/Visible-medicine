// Isolated source-derived Website successor. Never install or restart the owner preview.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const stage='F:/VisibleMedicine/staging/20261023-digital-vein-website',site=stage+'/website';
const parentFile='F:/VisibleMedicine/staging/20261023-head-pan-bound/SOURCE_BOUND.json';
const atlas='F:/VisibleMedicine/staging/20261023-digital-vein-ultrasound/atlas',head='ed3c8cc0e99f6cf850a915d7a08de2e6489c1b6f',tree='0305c15be5fb58ea7729a3849bbbdb6e1e40649d';
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const hash=p=>{const h=createHash('sha256'),fd=fs.openSync(p,'r'),b=Buffer.alloc(65536);try{let n;while((n=fs.readSync(fd,b,0,b.length,null)))h.update(b.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');};
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const git=(repo,...args)=>execFileSync('git',['-C',repo,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
assert.equal(hash(parentFile),'d41eecb7d72f96eaa52b4ac494646e58cbd075f32ad337b26d309ff277fa1d2a');
 const parent=json(parentFile),phase=process.argv[2];
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
assert.equal(git(atlas,'rev-parse','HEAD'),head);assert.equal(git(atlas,'rev-parse','HEAD^{tree}'),tree);assert.equal(git(atlas,'status','--porcelain'),'');
const generated=p=>p.startsWith('atlas-review/')||p.startsWith('public/atlas-review-viewer/')||/^public\/atlas-runtime\/(head-neck|shoulder)\//.test(p);
const preimagePaths=['scripts/import-clinical-review.mjs','tests/current-atlas-delivery.test.mjs','tests/current-atlas-delivery.mjs','tests/current-ui-delivery-transition.test.mjs','tests/fixtures/current-atlas-delivery.json','lib/atlas-model-inventory.json','lib/atlas-delivery-policy.ts','lib/lecture-body-catalog.json'];
const history='tests/fixtures/digital-vein-delivery-before/';
function state(live){const p=json('CURRENT_CHECKPOINT.json');p.activeWork.current.activeExecutionSessions=p.activeWork.current.activeExecutionSessions.filter(r=>r.role!=='digital-vein-website');if(live)p.activeWork.current.activeExecutionSessions.push({role:'digital-vein-website',driverPid:process.pid,...live,previewChanged:false});p.activeWork.updated=new Date().toISOString();const bytes=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(bytes)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',bytes);}
if(phase==='prepare'){
 assert(!fs.existsSync(stage));fs.mkdirSync(stage);git('F:/VisibleMedicine/website','clone','--shared','--no-checkout','F:/VisibleMedicine/website',site);git(site,'read-tree','HEAD');
 const rows=new Map();
 for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256);if(!generated(r.path))rows.set(r.path,{...r,from:parent.website+'/'+r.path});}
 const overlays=[['F:/VisibleMedicine/recovery/checkpoints/20261023-cranial-xray-epoch/checkpoint.json','dec952debab7e7b91bd034bcbde9d3a2d35258c648288fd9ba29ce69de78c493','F:/VisibleMedicine/staging/20261023-cranial-xray-epoch/website'],['F:/VisibleMedicine/recovery/checkpoints/20261023-neonatal-current-epoch/checkpoint.json','e2b4cd58183c17756b9cd3485daf6830bbb0ab2d81f2ab8f5ae8d4b5ba4fe3f2','F:/VisibleMedicine/staging/20261023-neonatal-current-epoch/website']];
 const selected=new Map();for(const[file,digest,from]of overlays){assert.equal(hash(file),digest);for(const r of json(file).sourceRows){assert(r.path.startsWith('tests/'));assert.equal(hash(from+'/'+r.path),r.sha256);if(selected.has(r.path))assert.equal(selected.get(r.path).sha256,r.sha256,'Overlay collision');selected.set(r.path,{...r,from:from+'/'+r.path});}}
 for(const[p,r]of selected)rows.set(p,r);
 for(const r of rows.values()){const to=containedTarget(site,r.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(r.from,to,fs.constants.COPYFILE_EXCL);assert.equal(hash(to),r.sha256);}
 fs.symlinkSync(parent.website+'/node_modules',site+'/node_modules','junction');fs.symlinkSync(atlas,stage+'/atlas','junction');
 const preimages=[];for(const p of preimagePaths){const to=containedTarget(site,history+p+'.raw');fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(site+'/'+p,to,fs.constants.COPYFILE_EXCL);preimages.push({path:p,preserved:history+p+'.raw',sha256:hash(to)});}
 write(stage+'/PREPARATION.json',{at:new Date().toISOString(),website:site,atlas,atlasHead:head,atlasTree:tree,parentReceipt:parentFile,parentReceiptSha256:hash(parentFile),baseSourceRows:[...rows.values()].map(({from,...r})=>r),overlayPaths:[...selected.keys()],preimages,missingGeneratedOutputs:['atlas-review','public/atlas-review-viewer','public/atlas-runtime/head-neck','public/atlas-runtime/shoulder'],previewChanged:false,installed:false});
 console.log(JSON.stringify({stage,sourcePaths:rows.size,overlayPaths:selected.size,previewChanged:false}));
}else if(/^capture(?:-v\d+)?$/.test(phase)){
 const old=json(site+'/'+history+'tests/fixtures/current-atlas-delivery.json.raw'),review=json(site+'/atlas-review/manifest.json'),inputs=json(site+'/atlas-review/integration-inputs.json'),viewer=json(site+'/public/atlas-review-viewer/manifest.json');
 assert.equal(review.revision,head);assert.equal(inputs.sha256,sha(JSON.stringify(inputs.inputs)));assert.equal(viewer.websiteIntegrationSha256,inputs.sha256);assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.files.length,46);assert.equal(viewer.packages.length,22);
 const runtimeSources=Object.fromEntries(Object.keys(old.runtimeSources).map(n=>[n,json(site+'/public/atlas-runtime/'+n+'/manifest.json').sourceCommit]));assert.equal(runtimeSources['head-neck'],head);assert.equal(runtimeSources.shoulder,head);for(const n of ['lower-limb','female-pelvis'])assert.equal(runtimeSources[n],old.runtimeSources[n]);
 const pin={...old,source:head,sourceTree:tree,runtimeSources,reviewSourceFiles:review.files.length,reviewIntegration:inputs.sha256,documents:Object.fromEntries(Object.keys(old.documents).map(p=>[p,hash(site+'/'+p)]))};fs.writeFileSync(site+'/tests/fixtures/current-atlas-delivery.json',JSON.stringify(pin,null,2)+'\n');
 write(stage+'/CAPTURE'+phase.slice('capture'.length)+'.json',{at:new Date().toISOString(),pin,pinSha256:hash(site+'/tests/fixtures/current-atlas-delivery.json'),sourceFiles:review.files.length,reviewInputs:inputs.inputs.length,previousPinSha256:hash(site+'/'+history+'tests/fixtures/current-atlas-delivery.json.raw'),previewChanged:false,installed:false,clinicalApproval:false,spatialRegistration:false});console.log(JSON.stringify({phase,sourceFiles:review.files.length,inputs:inputs.inputs.length,pinSha256:hash(site+'/tests/fixtures/current-atlas-delivery.json')}));
}else{
 const npm=path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
 const phases={
  holds:[atlas,128,['scripts/validate-source-holds.mjs']],geometry:[atlas,128,['scripts/validate-source-geometry-screen.mjs']],audit:[atlas,128,['scripts/head-neck-module-inputs.mjs','--audit']],
  shoulder:[atlas,384,['node_modules/vite/bin/vite.js','build','--config','integration/shoulder/vite.config.mjs']],regional:[atlas,384,['node_modules/vite/bin/vite.js','build','--config','integration/head-neck/vite.config.mjs']],
  import:[site,128,['scripts/import-clinical-review.mjs',atlas]],
  'export-regional':[atlas,128,['scripts/export-head-neck-module.mjs',site+'/public/atlas-runtime/head-neck']],
  'export-shoulder':[atlas,128,['scripts/export-shoulder-module.mjs',site+'/public/atlas-runtime/shoulder']],
  inventory:[site,128,['scripts/atlas-model-inventory.mjs']],lecture:[site,128,['scripts/lecture-body-catalog.mjs']],
  coverage:[site,128,['scripts/generate-anatomy-coverage.mjs','--source-root',atlas,'--revision',head,'--output-root',stage+'/coverage-candidate']],
  'coverage-check':[site,128,['scripts/check-anatomy-coverage.mjs','--source-root',atlas,'--check']],
  bind:[site,128,['scripts/bind-clinical-review.mjs']],viewer:[site,384,['scripts/build-clinical-review-viewer.mjs']],verify:[site,128,['scripts/verify-clinical-review.mjs']],
  prebuild:[site,128,[npm,'run','prebuild']],build:[site,384,['node_modules/vinext/dist/cli.js','build']],
  tests:[site,128,['--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap','tests/current-atlas-delivery.test.mjs','tests/digital-vein-current-delivery.test.mjs','tests/head-pan-interruption.test.ts','tests/head-pan-source-transition.test.ts','tests/head-slice-keyboard.test.ts','tests/head-slice-zoom.test.ts','tests/head-slice-viewport.test.ts','tests/cranial-xray-current-epoch.test.mjs','tests/atlas-emitted-teaching-search.test.ts','tests/cranial-tour-current-epoch.test.mjs','tests/neonatal-inbox-contexts.test.mjs']],
  'xray':[site,128,['--experimental-strip-types','--test','--test-name-pattern=^twelve source-bound intracranial','tests/clinical-review-intracranial-arterial-xray.test.ts']],
  'inbox':[site,256,['--experimental-strip-types','--test','--test-reporter=tap','--test-name-pattern=^private inbox shows ten new teaching revisions','tests/clinical-review-neonatal-cranial-us.test.ts']],
 };
 const mode=phase.replace(/-v\d+$/,''),spec=phases[mode];assert(spec,'Unknown phase '+phase);const[cwd,heap,args]=spec,dir=stage+'/checks/'+phase;assert(!fs.existsSync(dir));fs.mkdirSync(dir,{recursive:true});
 const started={at:new Date().toISOString(),phase,cwd,args:['--max-old-space-size='+heap,...args],heapMiB:heap,previewChanged:false,installed:false};
 const out=fs.createWriteStream(dir+'/stdout.log',{flags:'wx'}),err=fs.createWriteStream(dir+'/stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,started.args,{cwd,env:{...process.env,NODE_OPTIONS:'--max-old-space-size='+heap,RAYON_NUM_THREADS:'1',GOMAXPROCS:'2',VM_ATLAS_SOURCE_REPO:atlas,GIT_NO_REPLACE_OBJECTS:'1',GIT_TERMINAL_PROMPT:'0'},windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);write(dir+'/STARTED.json',{...started,pid:child.pid,driverPid:process.pid});state({pid:child.pid,phase,evidence:dir});console.log(JSON.stringify({phase,pid:child.pid,heapMiB:heap}));
 const r=await new Promise(resolve=>{child.once('error',e=>resolve({code:null,error:e.message}));child.once('close',(code,signal)=>resolve({code,signal}));});await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
 const stdout=read(out.path).toString(),stderr=read(err.path).toString(),counts=Object.fromEntries(['tests','pass','fail','skipped','cancelled'].map(k=>[k,Number(stdout.match(new RegExp('^# '+k+' (\\d+)$','m'))?.[1]??-1)]));
 write(dir+'/TERMINAL.json',{...started,finishedAt:new Date().toISOString(),...r,counts,stdoutSha256:hash(out.path),stderrSha256:hash(err.path),resourceFailure:/heap out of memory|Reached heap limit/i.test(stdout+'\n'+stderr)});state(null);console.log(JSON.stringify({phase,...r,counts}));process.exitCode=r.code===0?0:1;
}
