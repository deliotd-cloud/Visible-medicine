import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {hash,json} from './bounded-source-hash-20261026.mjs';
import {guarded as small} from './run-small-native-task-guarded-20261025.mjs';import {guarded as balanced} from './run-native-build-balanced-guarded-20261025.mjs';
const stage='F:/VisibleMedicine/staging/20261026-workbook-history-website',sourceFile=stage+'/SOURCE_CANDIDATE.json',source=json(sourceFile),site=source.website;
assert.equal(hash(sourceFile),'de19377dc8e1a0c18180e3286f9dfae94209d338ead7f6cb1cd8b5575f0d73fa');
const phase=process.argv[2],attempt=process.argv[3]??'1';assert(['tests','types','build'].includes(phase));assert(/^[1-9][0-9]*$/.test(attempt));
const dir=stage+'/checks/'+phase+'-'+attempt,index=json('CURRENT_CHECKPOINT.json');assert.deepEqual(index.activeWork.current.activeExecutionSessions,[]);assert.equal(index.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
const roots=['tests/workbook-draft-navigation.test.mjs','tests/studio-content-editor.test.ts','tests/learning-draft-navigation.test.ts','tests/lecture-draft-navigation.test.ts','tests/studio-navigation-guard.test.ts'];
let command,heap=1024,aggregate=2048,minimum=4096;
if(phase==='tests')command='--max-old-space-size=1024 --experimental-strip-types --test --test-reporter=tap --test-concurrency=1 '+roots.join(' ');
if(phase==='types'){
 assert(json(stage+'/checks/tests-1/RESULT.json').passing);const folder=stage+'/types-'+attempt;fs.mkdirSync(folder);
 fs.copyFileSync('F:/VisibleMedicine/staging/20261026-surface-recovery-website/types-1/checker.mjs',folder+'/checker.mjs',fs.constants.COPYFILE_EXCL);
 command='--max-old-space-size=3072 '+folder+'/checker.mjs';heap=3072;aggregate=3584;minimum=5632;
}
if(phase==='build'){
 assert(json(stage+'/checks/types-1/RESULT.json').passing);const wrapper=stage+'/website-build.mjs';if(!fs.existsSync(wrapper))fs.copyFileSync('F:/VisibleMedicine/staging/20261026-surface-recovery-website/website-build.mjs',wrapper,fs.constants.COPYFILE_EXCL);
 command='--max-old-space-size=256 '+wrapper;heap=1536;aggregate=3584;minimum=5632;
}
index.activeWork.current.activeExecutionSessions=[{kind:'workbook-history-'+phase,driverPid:process.pid,evidence:dir,sourceSha256:hash(sourceFile)}];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(index,null,2)+'\n');
process.once('exit',code=>{if(code===75&&!fs.existsSync(dir)){const j=json('CURRENT_CHECKPOINT.json');if(j.activeWork.current.activeExecutionSessions[0]?.driverPid===process.pid){j.activeWork.current.activeExecutionSessions=[];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(j,null,2)+'\n');}}});
try{
 global.gc();const run=await(aggregate===3584?balanced:small)({site,dir,command,heap,aggregate,minimum,extraEnv:{VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas}});
 for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);for(const d of source.dependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}
 const log=fs.readFileSync(dir+'/runner.stdout.log','utf8');const counts=phase==='tests'?Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(k=>[k,Number([...log.matchAll(new RegExp('^# '+k+' (\\d+)','gm'))].at(-1)?.[1]??-1)])):null;
 const typeFile=stage+'/types-'+attempt+'/TYPE_RESULT.json',types=phase==='types'&&fs.existsSync(typeFile)?json(typeFile):null;
 const passing=run.passing&&(!counts||counts.tests>=20&&counts.tests===counts.pass&&counts.fail+counts.skipped+counts.todo+counts.cancelled===0)&&(!types||types.fullProjectTypes&&types.diagnosticCount===0);
 const result={at:new Date().toISOString(),phase,source:{path:sourceFile,sha256:hash(sourceFile)},run,roots:phase==='tests'?roots:undefined,counts,types:types?{path:typeFile,sha256:hash(typeFile),roots:types.roots.length,files:types.sourceFiles.length,diagnostics:types.diagnosticCount}:null,passing,allSealedSourceAndDependenciesExact:true,normalPreviewChanged:false,wholeStockSuitePassing:false,realAccountAcceptance:false};
 fs.writeFileSync(dir+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({result:dir+'/RESULT.json',sha256:hash(dir+'/RESULT.json'),passing,counts,types:result.types}));process.exitCode=passing?0:1;
}finally{const j=json('CURRENT_CHECKPOINT.json');assert.equal(j.activeWork.current.activeExecutionSessions[0]?.driverPid,process.pid);j.activeWork.current.activeExecutionSessions=[];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(j,null,2)+'\n');}
