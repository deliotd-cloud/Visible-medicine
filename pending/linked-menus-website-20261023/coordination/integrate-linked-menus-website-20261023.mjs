// Main-owned staged integration; all generated outputs go to this new checkout.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawn,execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
export const stage='F:/VisibleMedicine/staging/20261023-linked-menus-website',site=stage+'/website';
const proposalFile='F:/VisibleMedicine/staging/20261023-head-link-menu-keyboard/PROPOSAL.json',proposal=json(proposalFile),parent=json(proposal.parentReceipt),phase=process.argv[2];
const proposalNative=json('F:/VisibleMedicine/staging/20261023-head-link-menu-keyboard/checks/NATIVE.json');
assert.equal(proposalNative.code,0);assert.equal(proposalNative.counts.pass,75);
const suites=proposalNative.args.filter(p=>p.startsWith('tests/'));assert.equal(suites.length,15);
assert.equal(hash(proposalFile),'5bc16d27a08ce03368c1aa2e46d1a0e0d8d3c97c690de2c34fabfe15fdca4afc');
assert.equal(hash(proposal.parentReceipt),'8e41a9c68f78bc5d38d855f204b99b6a46ffd0f321d830c49474d239bb7c2e89');
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true}).trim();
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
assert.equal(git(parent.atlas,'rev-parse','HEAD'),parent.atlasHead);assert.equal(git(parent.atlas,'status','--porcelain'),'');
if(phase==='prepare'){
 assert(!fs.existsSync(stage));fs.mkdirSync(stage);
 execFileSync('git',['clone','--shared','--no-checkout','F:/VisibleMedicine/website',site],{stdio:'pipe',windowsHide:true});git(site,'read-tree','HEAD');
 for(const r of proposal.sourceRows){assert.equal(hash(proposal.website+'/'+r.path),r.sha256);const to=containedTarget(site,r.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(proposal.website+'/'+r.path,to,fs.constants.COPYFILE_EXCL);assert.equal(hash(to),r.sha256);}
 fs.symlinkSync(parent.website+'/node_modules',site+'/node_modules','junction');fs.symlinkSync(parent.atlas,stage+'/atlas','junction');
 const paths=['scripts/bind-clinical-review.mjs','atlas-review/manifest.json','atlas-review/integration-inputs.json','atlas-review/content/body-renderer-revision.json','atlas-review/content/review-revisions.json','tests/fixtures/current-atlas-delivery.json','public/atlas-review-viewer/manifest.json'];
 const preimages=paths.map(p=>{const to=containedTarget(stage+'/preimages',p+'.raw');fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(site+'/'+p,to,fs.constants.COPYFILE_EXCL);return{path:p,preserved:to,sha256:hash(to)};});
 write(stage+'/PREPARATION.json',{at:new Date().toISOString(),website:site,parentWebsite:parent.website,parentReceipt:proposal.parentReceipt,parentReceiptSha256:hash(proposal.parentReceipt),proposal:proposalFile,proposalSha256:hash(proposalFile),atlas:parent.atlas,atlasHead:parent.atlasHead,atlasTree:parent.atlasTree,preimages,sourcePaths:proposal.sourcePaths,previewChanged:false,installed:false});
 console.log(JSON.stringify({stage,sourcePaths:proposal.sourcePaths,preimages:preimages.length}));
}else if(phase==='capture'){
 const old=json(stage+'/preimages/atlas-review/integration-inputs.json.raw'),now=json(site+'/atlas-review/integration-inputs.json');
 const newPath='components/HeadAtlasLearningPicker.tsx';assert(!old.inputs.some(r=>r.path===newPath));
 const expected=[...old.inputs.map(r=>['scripts/bind-clinical-review.mjs','components/HeadAtlasComparisonNavigation.tsx'].includes(r.path)?{...r,sha256:hash(site+'/'+r.path)}:r),{path:newPath,sha256:hash(site+'/'+newPath)}].sort((a,b)=>a.path.localeCompare(b.path));
 assert.deepEqual(now.inputs,expected);assert.equal(now.inputs.length,1740);assert.equal(now.sourceCommit,parent.atlasHead);
 const pinOld=json(stage+'/preimages/tests/fixtures/current-atlas-delivery.json.raw'),viewer=json(site+'/public/atlas-review-viewer/manifest.json');assert.equal(viewer.websiteIntegrationSha256,now.sha256);assert.equal(viewer.mode,'production');
 const pin={...pinOld,reviewIntegration:now.sha256,documents:Object.fromEntries(Object.keys(pinOld.documents).map(p=>[p,hash(site+'/'+p)]))};fs.writeFileSync(site+'/tests/fixtures/current-atlas-delivery.json',JSON.stringify(pin,null,2)+'\n');
 write(stage+'/CAPTURE.json',{at:new Date().toISOString(),previousBinding:old.sha256,binding:now.sha256,inputs:now.inputs.length,changedExistingInputs:['scripts/bind-clinical-review.mjs','components/HeadAtlasComparisonNavigation.tsx'],addedInput:newPath,pinSha256:hash(site+'/tests/fixtures/current-atlas-delivery.json'),privateDecisionsReadOrMigrated:false,previewChanged:false});console.log(JSON.stringify({binding:now.sha256,inputs:now.inputs.length}));
}else if(phase){
 const specs={stale:[128,['scripts/verify-clinical-review.mjs'],1],bind:[128,['scripts/bind-clinical-review.mjs'],0],viewer:[384,['scripts/build-clinical-review-viewer.mjs'],0],verify:[128,['scripts/verify-clinical-review.mjs'],0],prebuild:[128,[path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),'run','prebuild'],0],build:[384,['node_modules/vinext/dist/cli.js','build'],0],tests:[192,['--experimental-strip-types','--test','--test-reporter=tap','--test-concurrency=1',...suites,'tests/current-atlas-delivery.test.mjs','tests/head-link-menu-bound-delivery.test.mjs'],0]};
 const mode=phase.replace(/-v\d+$/,''),[heap,args,expectedExit]=specs[mode]??[];assert(args);const dir=stage+'/checks/'+phase;assert(!fs.existsSync(dir));fs.mkdirSync(dir,{recursive:true});
 if(mode==='viewer'){assert.equal(fs.realpathSync(site+'/public/atlas-review-viewer').replaceAll('\\','/').toLowerCase(),(site+'/public/atlas-review-viewer').toLowerCase());assert(!fs.lstatSync(site+'/public/atlas-review-viewer').isSymbolicLink());}
 if(mode==='build')assert(!fs.existsSync(site+'/dist'),'New build only');
 const out=fs.createWriteStream(dir+'/stdout.log',{flags:'wx'}),err=fs.createWriteStream(dir+'/stderr.log',{flags:'wx'}),started={at:new Date().toISOString(),phase,cwd:site,args:['--max-old-space-size='+heap,...args],heapMiB:heap,expectedExit,previewChanged:false};
 const child=spawn(process.execPath,started.args,{cwd:site,env:{...process.env,NODE_OPTIONS:'--max-old-space-size='+heap,RAYON_NUM_THREADS:'1',GOMAXPROCS:'2',VM_ATLAS_SOURCE_REPO:parent.atlas},stdio:['ignore','pipe','pipe'],windowsHide:true});child.stdout.pipe(out);child.stderr.pipe(err);write(dir+'/STARTED.json',{...started,pid:child.pid,driverPid:process.pid});
 function state(live){const p=json('CURRENT_CHECKPOINT.json');p.activeWork.current.activeExecutionSessions=p.activeWork.current.activeExecutionSessions.filter(r=>r.role!=='linked-menus-website');if(live)p.activeWork.current.activeExecutionSessions.push({role:'linked-menus-website',phase,pid:child.pid,driverPid:process.pid,evidence:dir,previewChanged:false});const txt=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(txt)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',txt);}state(true);console.log(JSON.stringify({phase,pid:child.pid}));
 const result=await new Promise(resolve=>{child.once('error',e=>resolve({code:null,error:e.message}));child.once('close',(code,signal)=>resolve({code,signal}));});await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
 const stdout=fs.readFileSync(out.path,'utf8'),stderr=fs.readFileSync(err.path,'utf8'),counts=Object.fromEntries(['tests','pass','fail','cancelled','skipped'].map(k=>[k,Number(stdout.match(new RegExp('^# '+k+' (\\d+)$','m'))?.[1]??-1)]));
 write(dir+'/TERMINAL.json',{...started,...result,finishedAt:new Date().toISOString(),counts,stdoutSha256:hash(out.path),stderrSha256:hash(err.path),resourceFailure:/heap out of memory|Reached heap limit/i.test(stdout+stderr)});state(false);
 if(mode==='stale')assert.match(stderr,/Review input changed; rebind and rebuild: components\/HeadAtlasComparisonNavigation.tsx/);
 console.log(JSON.stringify({phase,...result,counts}));process.exitCode=result.code===expectedExit?0:1;
}
