import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from './bounded-source-hash-20261026.mjs';
import {guarded} from './run-small-native-task-guarded-20261025.mjs';
const stage='F:/VisibleMedicine/staging/20261027-review-link-clarity';
const sf=stage+'/SOURCE_CANDIDATE.json',source=json(sf),site=source.website,dir=stage+'/checks/labels-1';
assert.equal(hash(sf),'ee885532423a41cb3c4b2bdd8ff2e4cc677f39712803437b2e4030e2c3540b99');
const roots=['tests/clinical-review-inbox-ui.test.mjs','tests/clinical-review-inbox-link-context.test.mjs'];
function verify(){for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);for(const d of source.dependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);}
verify();const index=json('CURRENT_CHECKPOINT.json');assert.deepEqual(index.activeWork.current.activeExecutionSessions,[]);
index.activeWork.current.activeExecutionSessions=[{kind:'review-link-clarity',driverPid:process.pid,evidence:dir,sourceSha256:hash(sf)}];
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(index,null,2)+'\n');
function retire(){const i=json('CURRENT_CHECKPOINT.json');if(i.activeWork.current.activeExecutionSessions[0]?.driverPid===process.pid){i.activeWork.current.activeExecutionSessions=[];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(i,null,2)+'\n');}}
const early=()=>{if(!fs.existsSync(dir+'/SUPERVISOR-HANDLE.json'))retire();};process.once('exit',early);
try{
 global.gc();const run=await guarded({site,dir,command:'--max-old-space-size=1024 --experimental-strip-types --test --test-reporter=tap --test-concurrency=1 '+roots.join(' '),heap:1024,aggregate:2048,minimum:4096,extraEnv:{VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas}});
 verify();const log=fs.readFileSync(dir+'/runner.stdout.log','utf8');
 const counts=Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(k=>[k,Number([...log.matchAll(new RegExp('^# '+k+' (\\d+)','gm'))].at(-1)?.[1]??-1)]));
 const passing=run.passing&&counts.tests>10&&counts.tests===counts.pass&&counts.fail+counts.cancelled+counts.skipped+counts.todo===0;
 const result={at:new Date().toISOString(),source:{path:sf,sha256:hash(sf)},passingForStatedScope:passing,scope:'Accessible destination names and existing Inbox scan, pagination, filter and access-context regressions. Actual source component harnesses with synthetic rows; no signed-in browser or screen-reader session.',roots,counts,run,sourceAndDependenciesExact:true,protectedReviewInputsChanged:false,normalPreviewChanged:false,wslStopped:false,fullTypesRerun:false,productionBuildRerun:false,browserRerun:false,clinicalApproval:false,installed:false};
 fs.writeFileSync(stage+'/VERIFICATION_SUMMARY.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({verification:stage+'/VERIFICATION_SUMMARY.json',sha256:hash(stage+'/VERIFICATION_SUMMARY.json'),passing,counts}));process.exitCode=passing?0:1;
}finally{process.removeListener('exit',early);retire();}
