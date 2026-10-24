import fs from 'node:fs';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {fileURLToPath} from 'node:url';import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-practice-actions',root=stage+'/atlas',here=fileURLToPath(new URL('.',import.meta.url)).replace(/[\\/]$/,'');
const phase=process.argv[2],mode=phase?.replace(/-v\d+$/,'');
const specs={feature:[768,['--test','scripts/test-practice-action-bar.mjs']],renderer:[256,['scripts/body-renderer-revisions.mjs']],display:[512,['scripts/generate-body-review-display-pins.mjs']],reviews:[256,['scripts/review-revisions.mjs']],
 rendererCheck:[256,['scripts/body-renderer-revisions.mjs','--check']],rendererScope:[512,['scripts/test-renderer-review-scope.mjs']],
 resultNavigation:[512,['scripts/test-practice-result-navigation.mjs']],
 panelNavigation:[512,['scripts/test-practice-panel-navigation.mjs']],returnView:[512,['scripts/test-practice-return-view.mjs']],
 practice:[512,['scripts/validate-practice.mjs']],nested:[512,['scripts/test-nested-practice.mjs']],nestedComponent:[768,['scripts/test-nested-practice-component.mjs']],
 nestedReview:[512,['scripts/generate-nested-review-bindings.mjs','--check']],
 holds:[256,['scripts/validate-current-source-holds.mjs']],geometry:[256,['scripts/validate-source-geometry-screen.mjs']],
 snapshot:[512,[here+'/snapshot-ventricular-reasoning-20261023.mjs',root,stage+'/candidate-'+phase+'.json']],
 build:[512,[here+'/build-ventricular-atlas-20261023.mjs']],
 regional:[512,['node_modules/vite/bin/vite.js','build','--config','integration/head-neck/vite.config.mjs']],
 exportRegional:[128,['scripts/export-head-neck-module.mjs',stage+'/qa'+(phase.match(/-v\d+$/)?.[0]??'')+'/public/atlas-runtime/head-neck']],
 types:[1536,[here+'/check-practice-actions-types-20261024.mjs',stage+'/checks/'+phase+'/RESULT.json']],
 requirements:[512,['scripts/audit-requirements.mjs']],requirementsCheck:[512,['scripts/audit-requirements.mjs','--check']]};
assert(specs[mode]);const p=json('CURRENT_CHECKPOINT.json');assert.equal(p.activeWork.current.ownerPreviewPolicy.restartPermitted,false);assert.equal(p.activeWork.current.activeExecutionSessions.length,0);
const dir=stage+'/checks/'+phase;assert(!fs.existsSync(dir));fs.mkdirSync(dir,{recursive:true});
const paths=['app/body-explorer.tsx','app/shoulder-explorer.tsx','app/nested-practice.tsx','app/um-limb-learning.tsx','app/practice-action-bar.tsx','app/practice-action-bar.css','scripts/test-practice-action-bar.mjs','package.json'];
const sourceInputs=paths.map(path=>({path,sha256:hash(root+'/'+path)}));
const [heap,args]=specs[mode],started={at:new Date().toISOString(),phase,cwd:root,args,heapMiB:heap,sourceInputs,previewChanged:false};
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'}),out=fs.createWriteStream(dir+'/stdout.log',{flags:'wx'}),err=fs.createWriteStream(dir+'/stderr.log',{flags:'wx'});
const child=spawn(process.execPath,['--max-old-space-size='+heap,...args],{cwd:root,env:{...process.env,NODE_OPTIONS:'--max-old-space-size='+heap,RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'},windowsHide:true,stdio:['ignore','pipe','pipe']});
child.stdout.pipe(out);child.stderr.pipe(err);write(dir+'/STARTED.json',{...started,pid:child.pid,driverPid:process.pid});
function state(live){const current=json('CURRENT_CHECKPOINT.json');current.activeWork.current.activeExecutionSessions=current.activeWork.current.activeExecutionSessions.filter(s=>s.role!=='practice-actions');if(live)current.activeWork.current.activeExecutionSessions.push({role:'practice-actions',phase,pid:child.pid,driverPid:process.pid,evidence:dir,previewChanged:false});const t=JSON.stringify(current,null,2)+'\n';assert(Buffer.byteLength(t)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',t);}
state(true);console.log(JSON.stringify({phase,pid:child.pid}));
const result=await new Promise(resolve=>{child.once('error',e=>resolve({code:null,error:e.message}));child.once('close',(code,signal)=>resolve({code,signal}));});
await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
write(dir+'/TERMINAL.json',{...started,...result,finishedAt:new Date().toISOString(),stdoutSha256:hash(out.path),stderrSha256:hash(err.path),resourceFailure:/heap out of memory|Reached heap limit/i.test(fs.readFileSync(err.path,'utf8'))});state(false);console.log(JSON.stringify({phase,...result}));process.exitCode=result.code===0?0:1;
