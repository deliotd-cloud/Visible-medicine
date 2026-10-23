import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';import {read,sha,json} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261023-head-pan-interruption',site=stage+'/website',mode=process.argv[2];
assert(['before','after','before-v2','after-v2'].includes(mode));const before=mode.startsWith('before'),parent=json(stage+'/PREPARED.json');
const oldTests=['tests/head-slice-keyboard.test.ts','tests/head-slice-zoom.test.ts','tests/head-slice-viewport.test.ts'];
const tests=['tests/head-pan-interruption.test.ts',...oldTests,...(!before?['tests/head-pan-source-transition.test.ts']:[])];
let cwd=site;
if(before){
 cwd=stage+'/'+mode+'-website';assert(!fs.existsSync(cwd));fs.mkdirSync(cwd);
 const all=[...parent.sourceRows.map(r=>r.path),json(stage+'/PREPARATION_APPEND.json').sourceRow.path,'tests/head-pan-interruption.test.ts'];
 for(const p of all){fs.mkdirSync(path.dirname(cwd+'/'+p),{recursive:true});fs.copyFileSync(p==='components/HeadAtlasViewer.tsx'?stage+'/preimages/HeadAtlasViewer.tsx.raw':site+'/'+p,cwd+'/'+p,fs.constants.COPYFILE_EXCL);}
 fs.symlinkSync(site+'/node_modules',cwd+'/node_modules','junction');
}
const dir=stage+'/checks/'+mode;assert(!fs.existsSync(dir));fs.mkdirSync(dir,{recursive:true});
const args=['--max-old-space-size=384','--test','--test-concurrency=1','--test-reporter=tap',...tests];
const start={at:new Date().toISOString(),cwd,args,sourceSha256:sha(read(cwd+'/components/HeadAtlasViewer.tsx')),previewChanged:false};fs.writeFileSync(dir+'/STARTED.json',JSON.stringify(start,null,2)+'\n',{flag:'wx'});
const stdout=fs.openSync(dir+'/stdout.log','wx'),stderr=fs.openSync(dir+'/stderr.log','wx');
const result=spawnSync(process.execPath,args,{cwd,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=384',RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'},stdio:['ignore',stdout,stderr],windowsHide:true});fs.closeSync(stdout);fs.closeSync(stderr);
const log=read(dir+'/stdout.log').toString(),counts=Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(k=>{const m=log.match(new RegExp('^# '+k+' (\\d+)$','m'));assert(m,k);return[k,Number(m[1])];}));
const terminal={...start,finishedAt:new Date().toISOString(),exitCode:result.status,signal:result.signal,error:result.error?String(result.error):null,counts,stdoutSha256:sha(read(dir+'/stdout.log')),stderrSha256:sha(read(dir+'/stderr.log'))};fs.writeFileSync(dir+'/TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(terminal));
assert.equal(result.status,before?1:0);assert.equal(counts.skipped,0);assert.equal(counts.cancelled,0);
assert.equal(counts.fail,before?14:0);
