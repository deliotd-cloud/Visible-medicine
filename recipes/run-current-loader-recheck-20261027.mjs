import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from './bounded-source-hash-20261026.mjs';
import {guarded} from './run-small-native-task-guarded-20261025.mjs';
const sf='F:/VisibleMedicine/staging/20261027-review-filter-scroll/SOURCE_CANDIDATE_V2.json',s=json(sf),dir='F:/VisibleMedicine/staging/20261027-current-loader-recheck';
assert.equal(hash(sf),'022079381d39ab61ec12109285479b344fe779d7f450307b20f5e5b792c2a8ab');assert(!fs.existsSync(dir));
function verify(){for(const r of s.sourceRows)assert.equal(hash(s.website+'/'+r.path),r.sha256,r.path);}
verify();const i=json('CURRENT_CHECKPOINT.json');assert.deepEqual(i.activeWork.current.activeExecutionSessions,[]);
const roots=['tests/lecture-tour-journey.test.ts','tests/lower-limb-module-page.test.ts','tests/search-kind-page.test.ts','tests/studio-release-note-recovery-ui.test.ts','tests/public-copy-review.test.ts'];
i.activeWork.current.activeExecutionSessions=[{kind:'current-loader-recheck',driverPid:process.pid,evidence:dir}];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(i,null,2)+'\n');
const retire=()=>{const p=json('CURRENT_CHECKPOINT.json');p.activeWork.current.activeExecutionSessions=p.activeWork.current.activeExecutionSessions.filter(x=>x.driverPid!==process.pid);fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');};
const early=()=>{if(!fs.existsSync(dir+'/SUPERVISOR-HANDLE.json'))retire();};process.once('exit',early);
try{
 global.gc();const run=await guarded({site:s.website,dir,command:'--max-old-space-size=1024 --experimental-strip-types --test --test-reporter=tap --test-concurrency=1 '+roots.join(' '),heap:1024,aggregate:2048,minimum:4096,extraEnv:{VM_WEBSITE_ROOT:s.website,VM_ATLAS_SOURCE_REPO:s.atlas,ATLAS_SOURCE_REPO:s.atlas}});verify();
 const log=fs.readFileSync(dir+'/runner.stdout.log','utf8'),counts=Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(k=>[k,Number([...log.matchAll(new RegExp('^# '+k+' (\\d+)','gm'))].at(-1)?.[1]??-1)]));
 const passing=run.passing&&counts.tests>0&&counts.tests===counts.pass&&counts.fail+counts.cancelled+counts.skipped+counts.todo===0;
 const result={at:new Date().toISOString(),source:{path:sf,sha256:hash(sf)},roots,run,counts,passing,allCurrentSourceExactAfterRun:true,noProductOrTestChanges:true,historicalFailuresNotAssumedCurrent:true,wholeStockSuitePassing:false,realAccountAcceptance:false,normalPreviewChanged:false};
 fs.writeFileSync(dir+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({path:dir+'/RESULT.json',sha256:hash(dir+'/RESULT.json'),passing,counts}));process.exitCode=passing?0:1;
}finally{process.removeListener('exit',early);retire();}
