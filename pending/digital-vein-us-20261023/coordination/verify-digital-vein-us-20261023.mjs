// Serial current-source verification. All generated/raw evidence stays on F.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const stage='F:/VisibleMedicine/staging/20261023-digital-vein-ultrasound',cwd=stage+'/atlas';
const mode=process.argv[2]??'produce';assert(['produce','verify'].includes(mode));
const phases=mode==='produce'?[
 ['regional-generate',['scripts/regional-teaching-snapshots.mjs']],
 ['display-pins-generate',['scripts/generate-body-review-display-pins.mjs']],
 ['renderer-generate',['scripts/body-renderer-revisions.mjs']],
]:[
 ['native',['--test','scripts/test-digital-vein-ultrasound.mjs']],
 ['regional-check',['scripts/regional-teaching-snapshots.mjs','--check']],
 ['display-pins-check',['scripts/generate-body-review-display-pins.mjs','--check']],
 ['renderer-check',['scripts/body-renderer-revisions.mjs','--check']],
 ['focused-types',['scripts/check-digital-vein-us-types.mjs']],
];
fs.mkdirSync(stage+'/checks',{recursive:true});
for(const [name,args]of phases){
 const directory=stage+'/checks/'+name;assert(!fs.existsSync(directory));fs.mkdirSync(directory);
 const start={at:new Date().toISOString(),cwd,args:['--max-old-space-size=384',...args],previewChanged:false};
 fs.writeFileSync(directory+'/STARTED.json',JSON.stringify(start,null,2)+'\n',{flag:'wx'});
 const stdout=fs.openSync(directory+'/stdout.log','wx'),stderr=fs.openSync(directory+'/stderr.log','wx');
 const r=spawnSync(process.execPath,start.args,{cwd,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=384',RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'},stdio:['ignore',stdout,stderr],windowsHide:true});fs.closeSync(stdout);fs.closeSync(stderr);
 const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 const terminal={...start,finishedAt:new Date().toISOString(),exitCode:r.status,signal:r.signal,error:r.error?String(r.error):null,stdoutSha256:hash(directory+'/stdout.log'),stderrSha256:hash(directory+'/stderr.log')};
 fs.writeFileSync(directory+'/TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({phase:name,exitCode:r.status,evidence:directory}));assert.equal(r.status,0,name);
}
