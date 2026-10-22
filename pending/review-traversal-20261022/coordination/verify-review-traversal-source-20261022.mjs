// Sequential, exact-source checks; retain every failure and never touch the owner preview.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-review-traversal-candidate',atlas=root+'/atlas',out=root+'/source-verification';assert(!fs.existsSync(out));fs.mkdirSync(out);
const rows=runGit(['-C',atlas,'ls-files','-z','--cached','--others','--exclude-standard']).toString().split('\0').filter(Boolean).sort().map(path=>({path,sha256:sha(read(atlas+'/'+path))}));
fs.writeFileSync(out+'/INPUTS.json',JSON.stringify({at:new Date().toISOString(),atlas,base:json(root+'/PREPARATION.json').baseAtlas,rows,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
const commands=[],env={...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'};let failure=null;
for(const[label,args]of [
 ['traversal',['--experimental-strip-types','--test','--test-reporter=tap','scripts/test-review-history-navigation.mjs']],
 ['review-revisions',['scripts/review-revisions.mjs','--check']],['review-suite',['--experimental-strip-types','scripts/validate-review.mjs']],
 ['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']],['build',['C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js','run','build']]
]){
 const stdout=fs.createWriteStream(out+'/'+label+'.stdout.log',{flags:'wx'}),stderr=fs.createWriteStream(out+'/'+label+'.stderr.log',{flags:'wx'}),child=spawn(process.execPath,args,{cwd:atlas,env,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(stdout);child.stderr.pipe(stderr);console.log(JSON.stringify({label,pid:child.pid}));
 const p=json('CURRENT_CHECKPOINT.json');p.activeWork.current.reviewTraversalRun={at:new Date().toISOString(),root,label,pid:child.pid,terminal:false,ownerPreviewChanged:false};fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');
 const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});await Promise.all([stdout,stderr].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
 const counts=Object.fromEntries([...read(stdout.path).toString().matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(m=>[m[1],Number(m[2])]));commands.push({label,args,...outcome,counts,stdoutSha256:sha(read(stdout.path)),stderrSha256:sha(read(stderr.path))});
 if(outcome.code!==0){failure??='Check failed: '+label;if(label==='traversal')break;}
}
const drift=rows.filter(r=>sha(read(atlas+'/'+r.path))!==r.sha256).map(r=>r.path);if(drift.length)failure??='Source drift';
const result={at:new Date().toISOString(),code:failure?1:0,failure,commands,sourceDrift:drift,atlas,sourceCommitPending:true,websiteImportPending:true,wholeSuitePassing:false,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,publicDeployment:false};
fs.writeFileSync(out+'/TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});const p=json('CURRENT_CHECKPOINT.json');Object.assign(p.activeWork.current.reviewTraversalRun,{pid:null,terminal:true,result:out+'/TERMINAL.json',code:result.code});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');console.log(JSON.stringify({receipt:out+'/TERMINAL.json',sha256:sha(read(out+'/TERMINAL.json')),code:result.code,failure,commands:commands.map(c=>[c.label,c.code,c.counts]),sourceDrift:drift}));if(failure)process.exitCode=1;
