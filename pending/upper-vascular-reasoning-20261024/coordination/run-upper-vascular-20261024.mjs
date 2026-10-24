// Serial candidate checks with real process evidence; no owner preview changes.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-upper-vascular-reasoning',root=stage+'/atlas';
const here=fileURLToPath(new URL('.',import.meta.url)).replace(/[\\/]$/,'');
const phase=process.argv[2],mode=phase?.replace(/-v\d+$/,'');
const specs={
 renderer:[256,['scripts/body-renderer-revisions.mjs']],display:[512,['scripts/generate-body-review-display-pins.mjs']],
 rendererCheck:[256,['scripts/body-renderer-revisions.mjs','--check']],
 feature:[768,['--test','scripts/test-upper-vascular-reasoning.mjs']],
 practice:[768,['scripts/validate-reasoning-practice.mjs']],
 pins:[256,['scripts/pin-upper-vascular-reasoning.mjs','--check']],
 snapshot:[512,[here+'/snapshot-ventricular-reasoning-20261023.mjs',root,stage+'/candidate-'+phase+'.json']],
 types:[1536,[here+'/check-upper-vascular-types-20261024.mjs',stage+'/checks/'+phase+'/RESULT.json']],
 build:[512,[here+'/build-ventricular-atlas-20261023.mjs']],
 rendererScope:[512,['scripts/test-renderer-review-scope.mjs']],
 holds:[256,['scripts/validate-current-source-holds.mjs']],
 geometry:[256,['scripts/validate-source-geometry-screen.mjs']],
 requirements:[512,['scripts/audit-requirements.mjs']],
 requirementsCheck:[512,['scripts/audit-requirements.mjs','--check']],
};
assert(specs[mode]);assert(fs.existsSync(stage+'/VALIDATION_SLOT_ACQUIRED.json'),'Wait for the explicit Release Reliability handoff');
const initial=json('CURRENT_CHECKPOINT.json');assert.equal(initial.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
assert.equal(initial.activeWork.current.activeExecutionSessions.length,0);
const[heap,args]=specs[mode],dir=stage+'/checks/'+phase;assert(!fs.existsSync(dir));fs.mkdirSync(dir,{recursive:true});
const out=fs.createWriteStream(dir+'/stdout.log',{flags:'wx'}),err=fs.createWriteStream(dir+'/stderr.log',{flags:'wx'});
const sourceInputs=['lib/reasoning-questions.ts','lib/upper-vascular-reasoning.ts','content/upper-vascular-reasoning-pins.json','scripts/test-upper-vascular-reasoning.mjs','scripts/pin-upper-vascular-reasoning.mjs','package.json'].map(p=>({path:p,sha256:hash(root+'/'+p)}));
const started={at:new Date().toISOString(),phase,cwd:root,args,heapMiB:heap,sourceInputs,previewChanged:false};
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const child=spawn(process.execPath,['--max-old-space-size='+heap,...args],{cwd:root,env:{...process.env,NODE_OPTIONS:'--max-old-space-size='+heap,RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'},stdio:['ignore','pipe','pipe'],windowsHide:true});
child.stdout.pipe(out);child.stderr.pipe(err);write(dir+'/STARTED.json',{...started,pid:child.pid,driverPid:process.pid});
function state(live){
 const c=json('CURRENT_CHECKPOINT.json');c.activeWork.current.activeExecutionSessions=c.activeWork.current.activeExecutionSessions.filter(r=>r.role!=='upper-vascular-reasoning');
 if(live)c.activeWork.current.activeExecutionSessions.push({role:'upper-vascular-reasoning',phase,pid:child.pid,driverPid:process.pid,evidence:dir,previewChanged:false});
 const text=JSON.stringify(c,null,2)+'\n';assert(Buffer.byteLength(text)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',text);
}
state(true);console.log(JSON.stringify({phase,pid:child.pid}));
const result=await new Promise(resolve=>{child.once('error',e=>resolve({code:null,error:e.message}));child.once('close',(code,signal)=>resolve({code,signal}));});
await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
write(dir+'/TERMINAL.json',{...started,...result,finishedAt:new Date().toISOString(),stdoutSha256:hash(out.path),stderrSha256:hash(err.path),resourceFailure:/heap out of memory|Reached heap limit/i.test(fs.readFileSync(err.path,'utf8'))});
state(false);console.log(JSON.stringify({phase,...result}));process.exitCode=result.code===0?0:1;
