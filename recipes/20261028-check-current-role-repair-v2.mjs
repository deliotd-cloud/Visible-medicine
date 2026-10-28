import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-small-native-task-guarded-20261025.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
const stage='F:/VisibleMedicine/staging/20261028-current-role-repair',sf=stage+'/SOURCE_CANDIDATE.json',root='F:/VisibleMedicine/staging/20261028-release-repair-recipes';
const phase=process.argv[2],attempt=process.argv[3]??'1';assert(['guard','roles','teaching'].includes(phase)&&/^[1-9][0-9]*$/.test(attempt));
const i=json('CURRENT_CHECKPOINT.json'),c=i.activeWork.current,ref=c.pendingCurrentRoleRepair.source;assert.equal(ref.path,sf);assert.equal(hash(sf),ref.sha256);const s=json(sf),dir=stage+'/checks/'+phase+'-'+attempt;
const pin=path=>({path,sha256:hash(path)}),save=(path,value)=>fs.writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
function verify(){assert.equal(hash(sf),ref.sha256);for(const row of s.sourceRows)assert.equal(hash(s.website+'/'+row.path),row.sha256,row.path);for(const d of s.dependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}}
verify();assert.deepEqual(c.activeExecutionSessions,[]);assert(c.ownerWslPolicy.keepRunning&&!c.ownerPreviewPolicy.restartPermitted);
const config=root+'/HISTORICAL_ENVIRONMENT_V4.json';assert.equal(hash(config),'e0246800d0d5cfc0fa7335cdb9d7c1034ca2db6bb90ecd8fb1d236097ea7a3ef');const env=json(config).environment;
const roots=phase==='roles'?['tests/neck-renal-current-role.test.mjs','tests/atlas-neck-landmark-xray.test.mjs','tests/atlas-neck-xray-delivery-transition.test.mjs','tests/atlas-renal-delivery-transition.test.mjs','tests/atlas-renal-source-tour.test.mjs']:phase==='teaching'?['tests/atlas-nested-review-queue.test.ts']:[];
const guardScript='F:/VisibleMedicine/staging/20261028-neck-renal-current-role-proposal/verify-current-guard.mjs';assert.equal(hash(guardScript),'dcd622b0e7b6b75996906e52124f1d25be6afa80150d7f0735db5d5a2200e3d1');
const command=phase==='guard'?'--max-old-space-size=128 '+guardScript+' '+s.website+' '+sf+' '+ref.sha256:'--max-old-space-size=1024 --experimental-strip-types --test --test-concurrency=1 --test-reporter=tap '+roots.join(' ');
c.activeExecutionSessions=[{kind:'current-role-repair-'+phase,pid:process.pid,evidence:dir}];saveIndex(i);
function clear(){const latest=json('CURRENT_CHECKPOINT.json');if(latest.activeWork.current.activeExecutionSessions[0]?.pid===process.pid){latest.activeWork.current.activeExecutionSessions=[];saveIndex(latest);}}
process.once('exit',()=>{if(!fs.existsSync(dir+'/SUPERVISOR-HANDLE.json')||fs.existsSync(dir+'/PROCESS-TERMINAL.json'))clear();});
try{
 global.gc?.();const run=await guarded({site:s.website,dir,command,heap:phase==='guard'?128:1024,aggregate:phase==='guard'?1024:2048,minimum:phase==='guard'?3072:4096,extraEnv:{TEMP:root,TMP:root,TMPDIR:root,VM_CURRENT_SOURCE_RECEIPT:sf,VM_CURRENT_SOURCE_SHA256:ref.sha256,VM_WEBSITE_ROOT:s.website,VM_ATLAS_SOURCE_REPO:s.atlas,ATLAS_SOURCE_REPO:s.atlas,...env}});verify();
 const stdout=fs.readFileSync(dir+'/runner.stdout.log','utf8');const counts=phase==='guard'?null:Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(k=>[k,Number([...stdout.matchAll(new RegExp('^# '+k+' (\\d+)','gm'))].at(-1)?.[1]??-1)]));
 const expected=phase==='roles'?7:4;const passing=run.passing&&(!counts||(counts.tests===expected&&counts.pass===expected&&counts.fail+counts.cancelled+counts.skipped+counts.todo===0));
 save(dir+'/RESULT.json',{at:new Date().toISOString(),source:pin(sf),configuration:pin(config),phase,roots,counts,run,passing,allSourceExact:true,productChanged:false,normalPreviewChanged:false,wslStopped:false,wholeSuitePassing:false});console.log(JSON.stringify({result:pin(dir+'/RESULT.json'),counts,passing}));process.exitCode=passing?0:1;
}finally{if(!fs.existsSync(dir+'/SUPERVISOR-HANDLE.json')||fs.existsSync(dir+'/PROCESS-TERMINAL.json'))clear();}
