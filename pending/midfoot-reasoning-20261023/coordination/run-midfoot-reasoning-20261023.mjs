// Serial checks with immutable logs and actual recoverable process handles.
import fs from 'node:fs';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261023-midfoot-reasoning',root=stage+'/atlas',here=fileURLToPath(new URL('.',import.meta.url)).replace(/[\\/]$/,''),phase=process.argv[2];
const specs={
  'renderer-v2':['scripts/body-renderer-revisions.mjs'],'display-v2':['scripts/generate-body-review-display-pins.mjs'],
  native:['--test','--test-reporter=tap','--test-concurrency=1','scripts/test-midfoot-relationships-reasoning.mjs'],
  renderer:['scripts/body-renderer-revisions.mjs'],display:['scripts/generate-body-review-display-pins.mjs'],pins:['scripts/pin-midfoot-relationships-reasoning.mjs','--check'],
  practice:['scripts/validate-reasoning-practice.mjs'],regional:['scripts/regional-teaching-snapshots.mjs','--check'],holds:['scripts/validate-current-source-holds.mjs'],
  baseline:[here+'/snapshot-ventricular-reasoning-20261023.mjs',json(stage+'/PREPARED.json').parent,stage+'/baseline-snapshot.json'],
  snapshot:[here+'/snapshot-ventricular-reasoning-20261023.mjs',root,stage+'/candidate-snapshot.json'],
  requirements:['scripts/audit-requirements.mjs'],'requirements-check':['scripts/audit-requirements.mjs','--check'],
  types:[here+'/check-midfoot-reasoning-types-20261023.mjs'],build:[here+'/build-ventricular-atlas-20261023.mjs'],
  'renderer-check':['scripts/body-renderer-revisions.mjs','--check'],
};
const command=specs[phase];assert(command);assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
const dir=stage+'/checks/'+phase;assert(!fs.existsSync(dir));fs.mkdirSync(dir,{recursive:true});
const heap=phase==='types'?1536:768,write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const out=fs.createWriteStream(dir+'/stdout.log',{flags:'wx'}),err=fs.createWriteStream(dir+'/stderr.log',{flags:'wx'}),args=['--max-old-space-size='+heap,...command],started={at:new Date().toISOString(),phase,cwd:root,args,previewChanged:false};
const child=spawn(process.execPath,args,{cwd:root,env:{...process.env,NODE_OPTIONS:'--max-old-space-size='+heap,RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'},stdio:['ignore','pipe','pipe'],windowsHide:true});child.stdout.pipe(out);child.stderr.pipe(err);write(dir+'/STARTED.json',{...started,pid:child.pid,driverPid:process.pid});
function state(live){const p=json('CURRENT_CHECKPOINT.json');p.activeWork.current.activeExecutionSessions=p.activeWork.current.activeExecutionSessions.filter(r=>r.role!=='midfoot-reasoning');if(live)p.activeWork.current.activeExecutionSessions.push({role:'midfoot-reasoning',phase,pid:child.pid,driverPid:process.pid,evidence:dir,previewChanged:false});const txt=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(txt)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',txt);}state(true);
console.log(JSON.stringify({phase,pid:child.pid}));
const result=await new Promise(resolve=>{child.once('error',e=>resolve({code:null,error:e.message}));child.once('close',(code,signal)=>resolve({code,signal}));});
await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
write(dir+'/TERMINAL.json',{...started,...result,finishedAt:new Date().toISOString(),stdoutSha256:hash(out.path),stderrSha256:hash(err.path),resourceFailure:/heap out of memory|Reached heap limit/i.test(fs.readFileSync(err.path,'utf8'))});state(false);console.log(JSON.stringify({phase,...result}));process.exitCode=result.code===0?0:1;
