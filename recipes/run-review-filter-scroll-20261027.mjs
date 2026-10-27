import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {hash,json} from './bounded-source-hash-20261026.mjs';
import {guarded as small} from './run-small-native-task-guarded-20261025.mjs';
import {guarded as balanced} from './run-native-build-balanced-guarded-20261025.mjs';
const stage='F:/VisibleMedicine/staging/20261027-review-filter-scroll';
const phase=process.argv[2],attempt=process.argv[3]??'1';
assert(['content','tests','types','build'].includes(phase));assert(/^[1-9][0-9]*$/.test(attempt));
const sourceFile=stage+'/SOURCE_CANDIDATE.json',source=json(sourceFile),site=source.website,dir=stage+'/checks/'+phase+'-'+attempt;
assert(!fs.existsSync(dir));
const acceptedFile=stage+'/checks/ACCEPTED.json';
function requirePassing(name){
 const record=json(acceptedFile)[name];assert(record,name);assert.equal(hash(record.path),record.sha256);
 const result=json(record.path);assert(result.passing,name);assert.equal(result.source.sha256,hash(sourceFile));
}
function verify(){
 for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
 for(const d of source.dependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}
 assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
}
verify();
const roots=["tests/clinical-review-inbox-auto-return.test.mjs","tests/clinical-review-inbox-deferred-return.test.mjs","tests/clinical-review-inbox-failure-focus.test.mjs","tests/clinical-review-inbox-filter-recovery.test.mjs","tests/clinical-review-inbox-link-context.test.mjs","tests/clinical-review-inbox-material-reuse.test.mjs","tests/clinical-review-inbox-navigation-revision.test.mjs","tests/clinical-review-inbox-pagination-focus.test.mjs","tests/clinical-review-inbox-priority-server.test.ts","tests/clinical-review-inbox-priority.test.mjs","tests/clinical-review-inbox-return-context.test.mjs","tests/clinical-review-inbox-return-pager-focus.test.mjs","tests/clinical-review-inbox-scan-focus.test.mjs","tests/clinical-review-inbox-short-desktop.test.mjs","tests/clinical-review-inbox-signin.test.ts","tests/clinical-review-inbox-source-update.test.ts","tests/clinical-review-inbox-ui.test.mjs","tests/clinical-review-inbox-workbench.test.mjs","tests/clinical-review-inbox.test.ts"];
let command,heap=1024,aggregate=2048,minimum=4096;
if(phase==='content'){
 const qa=fileURLToPath(new URL('./verify-review-filter-scroll-20261027.mjs',import.meta.url)).replaceAll('\\','/');
 assert(/^[A-Za-z0-9_:/.-]+$/.test(qa),'Bounded supervisor requires a path without quoting');
 command='--max-old-space-size=1024 --experimental-strip-types '+qa;
}
if(phase==='tests'){
 requirePassing('content');
 command='--max-old-space-size=1024 --experimental-strip-types --test --test-reporter=tap --test-concurrency=1 '+roots.join(' ');
}
if(phase==='types'){
 requirePassing('tests');
 const folder=stage+'/types-'+attempt;fs.mkdirSync(folder);
 fs.copyFileSync('F:/VisibleMedicine/staging/20261026-workbook-history-website/types-1/checker.mjs',folder+'/checker.mjs',fs.constants.COPYFILE_EXCL);
 command='--max-old-space-size=3072 '+folder+'/checker.mjs';heap=3072;aggregate=3584;minimum=5632;
}
if(phase==='build'){
 requirePassing('types');
 const wrapper=stage+'/website-build.mjs';
 if(!fs.existsSync(wrapper))fs.copyFileSync('F:/VisibleMedicine/staging/20261026-workbook-history-website/website-build.mjs',wrapper,fs.constants.COPYFILE_EXCL);
 command='--max-old-space-size=256 '+wrapper;heap=1536;aggregate=3584;minimum=5632;
}
const index=json('CURRENT_CHECKPOINT.json');assert.deepEqual(index.activeWork.current.activeExecutionSessions,[]);
index.activeWork.current.activeExecutionSessions=[{kind:'review-filter-scroll-'+phase,driverPid:process.pid,evidence:dir,sourceSha256:hash(sourceFile)}];
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(index,null,2)+'\n');
// The shared memory gate exits directly, so finally is not reached on refusal.
// Only retire this driver's record when no supervisor was ever launched.
const earlyExit=code=>{
 if(fs.existsSync(dir+'/SUPERVISOR-HANDLE.json'))return;
 const i=json('CURRENT_CHECKPOINT.json');
 if(i.activeWork.current.activeExecutionSessions[0]?.driverPid!==process.pid)return;
 const out=stage+'/checks/'+phase+'-'+attempt+'-EARLY_EXIT.json';
 fs.writeFileSync(out,JSON.stringify({at:new Date().toISOString(),phase,code,driverPid:process.pid,supervisorNeverLaunched:true,sourceSha256:hash(sourceFile),verificationCompleted:false,reason:'Driver exited before the guarded checker was launched; inspect admission output before retrying.',normalPreviewChanged:false},null,2)+'\n',{flag:'wx'});
 i.activeWork.current.activeExecutionSessions=[];
 fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(i,null,2)+'\n');
};
process.once('exit',earlyExit);
try{
 global.gc();
 const run=await(aggregate===3584?balanced:small)({site,dir,command,heap,aggregate,minimum,extraEnv:{VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas}});
 verify();
 const log=fs.existsSync(dir+'/runner.stdout.log')?fs.readFileSync(dir+'/runner.stdout.log','utf8'):'';
 const counts=phase==='tests'?Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(k=>[k,Number([...log.matchAll(new RegExp('^# '+k+' (\\d+)','gm'))].at(-1)?.[1]??-1)])):null;
 const typeFile=stage+'/types-'+attempt+'/TYPE_RESULT.json',types=phase==='types'&&fs.existsSync(typeFile)?json(typeFile):null;
 const content=phase==='content'&&fs.existsSync(stage+'/CONTENT_QA.json')?{path:stage+'/CONTENT_QA.json',sha256:hash(stage+'/CONTENT_QA.json'),passing:json(stage+'/CONTENT_QA.json').passing}:null;
 const passing=run.passing&&(!counts||(counts.tests>=10&&counts.tests===counts.pass&&counts.fail+counts.cancelled+counts.skipped+counts.todo===0))
  &&(phase!=='types'||(types?.fullProjectTypes&&types.diagnosticCount===0))&&(phase!=='content'||content?.passing===true);
 const result={at:new Date().toISOString(),phase,passing,run,source:{path:sourceFile,sha256:hash(sourceFile)},
  roots:phase==='tests'?roots:undefined,counts,content,types:types?{path:typeFile,sha256:hash(typeFile),roots:types.roots.length,files:types.sourceFiles.length,diagnostics:types.diagnosticCount}:null,
  allSealedSourceAndDependenciesExact:true,wholeStockSuitePassing:false,realAccountAcceptance:false,clinicalApproval:false,normalPreviewChanged:false};
 const out=dir+'/RESULT.json';fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 if(passing){const accepted=fs.existsSync(acceptedFile)?json(acceptedFile):{};assert(!accepted[phase]);accepted[phase]={path:out,sha256:hash(out)};fs.writeFileSync(acceptedFile,JSON.stringify(accepted,null,2)+'\n');}
 console.log(JSON.stringify({result:out,sha256:hash(out),passing,counts,types:result.types}));process.exitCode=passing?0:1;
}finally{
 process.removeListener('exit',earlyExit);
 const i=json('CURRENT_CHECKPOINT.json');if(i.activeWork.current.activeExecutionSessions[0]?.driverPid===process.pid){i.activeWork.current.activeExecutionSessions=[];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(i,null,2)+'\n');}
}
