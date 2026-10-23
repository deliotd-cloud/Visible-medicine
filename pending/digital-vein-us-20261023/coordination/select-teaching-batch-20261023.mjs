// Read-only current Atlas resolver inventory; evidence only on F, no source writes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {read,sha} from './source-only-backup-20261019.mjs';
const topic=process.argv[2];assert(topic===undefined||topic==='clinical'||topic==='all');
const atlas='F:/VisibleMedicine/staging/20261023-atlas-runtime-materialized/atlas',stage='F:/VisibleMedicine/staging/20261023-teaching-batch-selection'+(topic?'-'+topic:'');
assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const git=(...args)=>execFileSync('git',['-C',atlas,...args],{encoding:'utf8',windowsHide:true}).trim();
assert.equal(git('rev-parse','HEAD'),'9e1407629bd6f85061537c9f013fd72e4543e0da');assert.equal(git('status','--porcelain'),'');
const args=['--max-old-space-size=384','scripts/report-teaching-gaps.mjs',...(topic==='all'?[]:[topic?'--topic='+topic:'--region=thorax','--readiness=pending','--limit=24'])];
const start={at:new Date().toISOString(),cwd:atlas,args,head:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),previewChanged:false,sourceChanges:false};
fs.writeFileSync(stage+'/STARTED.json',JSON.stringify(start,null,2)+'\n',{flag:'wx'});const out=fs.openSync(stage+'/report.json','wx'),err=fs.openSync(stage+'/stderr.log','wx');
const r=spawnSync(process.execPath,args,{cwd:atlas,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=384',RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'},stdio:['ignore',out,err],windowsHide:true});fs.closeSync(out);fs.closeSync(err);
assert.equal(git('rev-parse','HEAD'),start.head);assert.equal(git('status','--porcelain'),'');
const terminal={...start,finishedAt:new Date().toISOString(),exitCode:r.status,signal:r.signal,error:r.error?String(r.error):null,stdoutSha256:sha(read(stage+'/report.json')),stderrSha256:sha(read(stage+'/stderr.log')),sourceUnchanged:true};fs.writeFileSync(stage+'/TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,exit:r.status}));assert.equal(r.status,0);const report=JSON.parse(read(stage+'/report.json'));console.log(JSON.stringify({totals:report.totals,matchingRows:report.matchingRows,rows:topic==='all'?report.rows.filter(r=>r.topic==='quiz'):report.rows},null,2));
