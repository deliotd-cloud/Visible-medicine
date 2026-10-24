import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-toolbar-website',site=stage+'/website',prep=json(stage+'/PREPARATION.json'),phase=process.argv[2]==='verify'&&fs.existsSync(stage+'/checks/verify')?'verifyFinal':process.argv[2],atlas=prep.atlas,index=path.resolve('CURRENT_CHECKPOINT.json');
const npm=path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
const specs={
 shoulder:[atlas,512,['node_modules/vite/bin/vite.js','build','--config','integration/shoulder/vite.config.mjs']],
 regional:[atlas,512,['node_modules/vite/bin/vite.js','build','--config','integration/head-neck/vite.config.mjs']],
 lower:[atlas,512,['node_modules/vite/bin/vite.js','build','--config','integration/lower-limb/vite.config.mjs']],
 pelvis:[atlas,512,['node_modules/vite/bin/vite.js','build','--config','integration/female-pelvis/vite.config.mjs']],
 exportShoulder:[atlas,128,['scripts/export-shoulder-module.mjs',site+'/public/atlas-runtime/shoulder']],
 exportRegional:[atlas,128,['scripts/export-head-neck-module.mjs',site+'/public/atlas-runtime/head-neck']],
 exportLower:[atlas,128,['scripts/export-lower-limb-module.mjs',site+'/public/atlas-runtime/lower-limb']],
 exportPelvis:[atlas,128,['scripts/export-female-pelvis-module.mjs',site+'/public/atlas-runtime/female-pelvis']],
 import:[site,256,['scripts/import-clinical-review.mjs',atlas]],
 inventory:[site,128,['scripts/atlas-model-inventory.mjs']],
 lecture:[site,128,['scripts/lecture-body-catalog.mjs']],
 coverage:[site,256,['scripts/generate-anatomy-coverage.mjs','--source-root',atlas,'--revision',prep.atlasHead,'--output-root',stage+'/coverage-candidate']],
 coverageCheck:[site,128,['scripts/check-anatomy-coverage.mjs','--source-root',atlas,'--check']],
 bind:[site,128,['scripts/bind-clinical-review.mjs']],
 viewer:[site,768,['scripts/build-clinical-review-viewer.mjs']],
 verify:[site,128,['scripts/verify-clinical-review.mjs']],
 verifyFinal:[site,128,['scripts/verify-clinical-review.mjs']],
 prebuild:[site,256,[npm,'run','prebuild']],
 build:[site,768,['node_modules/vinext/dist/cli.js','build']],
};
assert(specs[phase]);const pointer=json(index);assert.equal(pointer.activeWork.current.activeExecutionSessions.length,0);assert.equal(pointer.activeWork.current.ownerPreviewPolicy.restartPermitted,false);const dir=stage+'/checks/'+phase;assert(!fs.existsSync(dir));fs.mkdirSync(dir,{recursive:true});const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'}),[cwd,heap,args]=specs[phase],at=new Date().toISOString();
const stdout=fs.createWriteStream(dir+'/stdout.log',{flags:'wx'}),stderr=fs.createWriteStream(dir+'/stderr.log',{flags:'wx'}),child=spawn(process.execPath,['--max-old-space-size='+heap,...args],{cwd,windowsHide:true,env:{...process.env,NODE_OPTIONS:'--max-old-space-size='+heap,RAYON_NUM_THREADS:'1',GOMAXPROCS:'2',VM_ATLAS_SOURCE_REPO:atlas,GIT_NO_REPLACE_OBJECTS:'1'},stdio:['ignore','pipe','pipe']});child.stdout.pipe(stdout);child.stderr.pipe(stderr);write(dir+'/STARTED.json',{at,phase,cwd,args,pid:child.pid,driverPid:process.pid,heapMiB:heap,previewChanged:false});
function live(active){const p=json(index);p.activeWork.current.activeExecutionSessions=p.activeWork.current.activeExecutionSessions.filter(r=>r.role!=='toolbar-website');if(active)p.activeWork.current.activeExecutionSessions.push({role:'toolbar-website',phase,pid:child.pid,driverPid:process.pid,evidence:dir,previewChanged:false});const text=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(text)<65536);fs.writeFileSync(index,text);}
live(true);console.log(JSON.stringify({phase,pid:child.pid}));const result=await new Promise(resolve=>{child.once('error',e=>resolve({code:null,error:e.message}));child.once('close',(code,signal)=>resolve({code,signal}));});await Promise.all([stdout,stderr].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));write(dir+'/TERMINAL.json',{at,phase,...result,finished:new Date().toISOString(),stdoutSha256:hash(dir+'/stdout.log'),stderrSha256:hash(dir+'/stderr.log'),previewChanged:false});live(false);console.log(JSON.stringify({phase,...result}));if(result.code)process.exitCode=1;
