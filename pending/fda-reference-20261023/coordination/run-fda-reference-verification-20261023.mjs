import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const stage='F:/VisibleMedicine/staging/20261023-fda-shoulder-reference',root=stage+'/atlas',out=stage+'/verification';
fs.mkdirSync(out,{recursive:true});
const jobs=[['source-holds',['scripts/validate-source-holds.mjs']],['source-geometry',['scripts/validate-source-geometry-screen.mjs']],['renderer',['scripts/validate-scene-recovery.mjs']],['selection-visibility',['scripts/validate-selection-visibility.mjs']]];
const rows=[];
for(const [name,args]of jobs){
 const start=Date.now(),r=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',windowsHide:true,maxBuffer:32e6,env:{...process.env,RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'}});
 fs.writeFileSync(out+'/'+name+'.stdout.log',r.stdout??'');fs.writeFileSync(out+'/'+name+'.stderr.log',r.stderr??'');
 rows.push({name,args,exitCode:r.status,signal:r.signal,error:r.error?.message,elapsedMs:Date.now()-start,stdoutSha256:createHash('sha256').update(r.stdout??'').digest('hex'),stderrSha256:createHash('sha256').update(r.stderr??'').digest('hex')});
 fs.writeFileSync(out+'/BASELINE_CHECKS.json',JSON.stringify({at:new Date().toISOString(),rows},null,2)+'\n');console.log(name+' '+r.status+' '+(Date.now()-start)+'ms');
}
process.exitCode=rows.every(r=>r.exitCode===0)?0:1;
