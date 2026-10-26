import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {hash,json} from './bounded-source-hash-20261026.mjs';
import {guarded as small} from './run-small-native-task-guarded-20261025.mjs';
import {guarded as balanced} from './run-native-build-balanced-guarded-20261025.mjs';
const stage='F:/VisibleMedicine/staging/20261026-atlas-issue-copy',site=stage+'/website',phase=process.argv[2],attempt=process.argv[3]??'1';assert(['tests','review','types','build'].includes(phase));
const dir=stage+'/checks/'+phase+'-'+attempt;assert(!fs.existsSync(dir));
const parent=json(stage+'/PREPARATION.json'),source=json(parent.parent.path),index=json('CURRENT_CHECKPOINT.json');assert.deepEqual(index.activeWork.current.activeExecutionSessions,[]);assert.equal(index.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
const roots=['tests/atlas-issue-context.test.mjs','tests/atlas-issue-integration.test.mjs','tests/atlas-body-learning-component.test.mjs','tests/atlas-runtime-keyboard-help.test.mjs'];
let command,heap=1024,aggregate=2048,minimum=4096;
if(phase==='tests')command='--max-old-space-size=1024 --experimental-strip-types --test --test-reporter=tap --test-concurrency=1 '+roots.join(' ');
if(phase==='review'){
 const pipeline=stage+'/review-pipeline.mjs';if(!fs.existsSync(pipeline))fs.writeFileSync(pipeline,`import {spawnSync} from 'node:child_process';for(const file of ['scripts/bind-clinical-review.mjs','scripts/build-clinical-review-viewer.mjs','scripts/verify-clinical-review.mjs']){console.log('STOCK_STEP '+file);const r=spawnSync(process.execPath,['--max-old-space-size=1024',file],{cwd:process.cwd(),env:process.env,stdio:'inherit',windowsHide:true});if(r.status!==0||r.error||r.signal)process.exit(r.status||1);}`,{flag:'wx'});
 command='--max-old-space-size=256 '+pipeline;
}
if(phase==='types'){
 for(const p of ['next-env.d.ts','.next/types/routes.d.ts']){const from='F:/VisibleMedicine/staging/20261026-local-reference-inbox-v3/website/'+p,to=site+'/'+p;if(!fs.existsSync(to)){fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);}}
 const folder=stage+'/types-'+attempt;fs.mkdirSync(folder);fs.copyFileSync('F:/VisibleMedicine/staging/20261026-title-tour-website/whole-project-type-checker.mjs',folder+'/checker.mjs',fs.constants.COPYFILE_EXCL);command='--max-old-space-size=3072 '+folder+'/checker.mjs';heap=3072;aggregate=3584;minimum=5632;
}
if(phase==='build'){
 assert(json(stage+'/checks/types-1/RESULT.json').passing);const checker=stage+'/website-build.mjs';if(!fs.existsSync(checker))fs.copyFileSync('F:/VisibleMedicine/staging/20261026-title-tour-website/website-stock-build.mjs',checker,fs.constants.COPYFILE_EXCL);command='--max-old-space-size=256 '+checker;heap=1536;aggregate=3584;minimum=5632;
}
const authored=[...Object.keys(json(stage+'/APPLICATION_EDITS.json')),...json(stage+'/SCOPE.json').new];const before=authored.map(p=>({path:p,sha256:hash(site+'/'+p)}));
index.activeWork.current.activeExecutionSessions=[{kind:'atlas-issue-'+phase,driverPid:process.pid,evidence:dir}];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(index,null,2)+'\n');
process.once('exit',code=>{if(code===75&&!fs.existsSync(dir)){const j=json('CURRENT_CHECKPOINT.json');if(j.activeWork.current.activeExecutionSessions[0]?.driverPid===process.pid){j.activeWork.current.activeExecutionSessions=[];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(j,null,2)+'\n');}}});
try{global.gc();const run=await (aggregate===3584?balanced:small)({site,dir,command,heap,aggregate,minimum,extraEnv:{VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas}});
 for(const r of before)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
 const log=fs.readFileSync(dir+'/runner.stdout.log','utf8');const counts=phase==='tests'?Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(k=>[k,Number([...log.matchAll(new RegExp('^# '+k+' (\\d+)','gm'))].at(-1)?.[1]??-1)])):null;
 const passing=run.passing&&(!counts||counts.tests>=20&&counts.tests===counts.pass&&counts.fail+counts.cancelled+counts.skipped+counts.todo===0);
 const r={at:new Date().toISOString(),phase,run,counts,passing,authoredInputs:before,roots:phase==='tests'?roots:undefined,normalPreviewChanged:false,clinicalApproval:false,wholeSuitePassing:false};fs.writeFileSync(dir+'/RESULT.json',JSON.stringify(r,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({path:dir+'/RESULT.json',sha256:hash(dir+'/RESULT.json'),passing,counts}));process.exitCode=passing?0:1;
}finally{const j=json('CURRENT_CHECKPOINT.json');if(j.activeWork.current.activeExecutionSessions[0]?.driverPid===process.pid){j.activeWork.current.activeExecutionSessions=[];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(j,null,2)+'\n');}}
