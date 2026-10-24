import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-orbital-ct-draft';
const prep=json(stage+'/PREPARATION.json'),root=prep.atlas,phase=process.argv[2];
const here=process.cwd().replaceAll('\\','/'),index=path.resolve('CURRENT_CHECKPOINT.json');
const specs={
 snapshots:[512,['scripts/regional-teaching-snapshots.mjs']],
 rendererV2:[256,['scripts/body-renderer-revisions.mjs']],
 typesV2:[1536,[here+'/check-orbital-ct-types-20261024.mjs',stage+'/checks/typesV2/RESULT.json']],
 buildV2:[512,[here+'/build-ventricular-atlas-20261023.mjs']],
};
assert(specs[phase]);
const pointer=json(index);
assert.equal(pointer.activeWork.current.activeExecutionSessions.length,0);
assert.equal(pointer.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
const out=stage+'/checks/'+phase;
assert(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const inputs=['app/body-content.ts','lib/body-orbital-ct.ts','scripts/test-body-orbital-ct.mjs','package.json','content/orbital-nerve-quiz-pins.json'].map(p=>({path:p,sha256:hash(root+'/'+p)}));
const [heap,args]=specs[phase],at=new Date().toISOString();
const stdout=fs.createWriteStream(out+'/stdout.log',{flags:'wx'}),stderr=fs.createWriteStream(out+'/stderr.log',{flags:'wx'});
const child=spawn(process.execPath,['--max-old-space-size='+heap,...args],{cwd:root,windowsHide:true,env:{...process.env,NODE_OPTIONS:'--max-old-space-size='+heap,RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'},stdio:['ignore','pipe','pipe']});
child.stdout.pipe(stdout);child.stderr.pipe(stderr);
write(out+'/STARTED.json',{at,phase,pid:child.pid,driverPid:process.pid,cwd:root,args,inputs,previewChanged:false});
function live(active){
 const p=json(index);p.activeWork.current.activeExecutionSessions=p.activeWork.current.activeExecutionSessions.filter(r=>r.role!=='orbital-ct-draft');
 if(active)p.activeWork.current.activeExecutionSessions.push({role:'orbital-ct-draft',phase,pid:child.pid,driverPid:process.pid,evidence:out,previewChanged:false});
 const text=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(text)<65536);fs.writeFileSync(index,text);
}
live(true);console.log(JSON.stringify({phase,pid:child.pid}));
const result=await new Promise(resolve=>{child.once('error',e=>resolve({code:null,error:e.message}));child.once('close',(code,signal)=>resolve({code,signal}));});
await Promise.all([stdout,stderr].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
for(const r of inputs)assert.equal(hash(root+'/'+r.path),r.sha256);
write(out+'/TERMINAL.json',{at,phase,...result,finished:new Date().toISOString(),inputs,stdoutSha256:hash(out+'/stdout.log'),stderrSha256:hash(out+'/stderr.log'),previewChanged:false});
live(false);console.log(JSON.stringify({phase,...result}));if(result.code)process.exitCode=1;
