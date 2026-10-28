import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from './bounded-source-hash-20261026.mjs';
import {guarded} from './run-small-native-task-guarded-20261025.mjs';
const stage='F:/VisibleMedicine/staging/20261028-tour-delivery-website',version=process.argv[2]??'1',attempt=process.argv[3]??'1';assert(/^[1-9][0-9]*$/.test(version)&&/^[1-9][0-9]*$/.test(attempt));
const sf=stage+(version==='1'?'/SOURCE_CANDIDATE.json':'/SOURCE_CANDIDATE_V'+version+'.json'),s=json(sf),site=s.website,dir=stage+'/checks/tests-v'+version+'-'+attempt;
const roots=['tests/title-tour-functional-delivery.test.mjs','tests/tour-reading-current-delivery.test.mjs','tests/tour-delivery-preservation.test.mjs'];
const verify=()=>{assert.equal(hash(s.parent),s.parentSha256);for(const r of s.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);for(const d of s.dependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}};verify();
const ix=json('CURRENT_CHECKPOINT.json'),c=ix.activeWork.current;assert.deepEqual(c.activeExecutionSessions,[]);assert(c.ownerWslPolicy.keepRunning&&!c.ownerPreviewPolicy.restartPermitted);c.activeExecutionSessions=[{kind:'tour-delivery-regression',driverPid:process.pid,sourceSha256:hash(sf),evidence:dir}];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(ix,null,2)+'\n');
const clean=()=>{const i=json('CURRENT_CHECKPOINT.json');if(i.activeWork.current.activeExecutionSessions[0]?.driverPid===process.pid){i.activeWork.current.activeExecutionSessions=[];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(i,null,2)+'\n');}};process.once('exit',()=>{if(!fs.existsSync(dir+'/SUPERVISOR-HANDLE.json'))clean();});
try{
 global.gc();const run=await guarded({site,dir,command:'--max-old-space-size=1024 --experimental-strip-types --test --test-reporter=tap --test-concurrency=1 '+roots.join(' '),heap:1024,aggregate:2048,minimum:4096,extraEnv:{VM_CURRENT_SOURCE_RECEIPT:sf,VM_CURRENT_SOURCE_SHA256:hash(sf),VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:s.atlas,ATLAS_SOURCE_REPO:s.atlas}});
 verify();const log=fs.readFileSync(dir+'/runner.stdout.log','utf8'),counts=Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(k=>[k,Number([...log.matchAll(new RegExp('^# '+k+' (\\d+)','gm'))].at(-1)?.[1]??-1)]));
 const passing=run.passing&&counts.tests>=17&&counts.tests===counts.pass&&counts.fail+counts.cancelled+counts.skipped+counts.todo===0,result={at:new Date().toISOString(),source:{path:sf,sha256:hash(sf)},run,roots,counts,passing,sourceUnchanged:true,normalPreviewChanged:false,clinicalApproval:false,wholeStockSuitePassing:false};fs.writeFileSync(dir+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 if(passing)fs.writeFileSync(stage+'/ACCEPTED.json',JSON.stringify({source:result.source,tests:{path:dir+'/RESULT.json',sha256:hash(dir+'/RESULT.json')}},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({result:dir+'/RESULT.json',sha256:hash(dir+'/RESULT.json'),counts,passing}));process.exitCode=passing?0:1;
}finally{clean();}
