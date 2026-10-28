import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from './bounded-source-hash-20261026.mjs';
import {guarded} from './run-small-native-task-guarded-20261025.mjs';
const target=process.argv[2];assert(['parent','current'].includes(target));
const files={parent:'F:/VisibleMedicine/staging/20261027-course-directory/SOURCE_CANDIDATE_V3.json',current:'F:/VisibleMedicine/staging/20261028-quadriceps-website/SOURCE_CANDIDATE.json'};
const sf=files[target],source=json(sf),site=source.website,base='F:/VisibleMedicine/staging/20261028-tour-delivery-regression',dir=base+'/baseline-'+target;
const roots=['tests/title-tour-functional-delivery.test.mjs','tests/tour-reading-current-delivery.test.mjs'];
const verify=()=>{for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);};verify();
const idx=json('CURRENT_CHECKPOINT.json'),c=idx.activeWork.current;assert.deepEqual(c.activeExecutionSessions,[]);assert(!c.ownerPreviewPolicy.restartPermitted&&c.ownerWslPolicy.keepRunning);
c.activeExecutionSessions=[{kind:'tour-delivery-baseline',target,driverPid:process.pid,evidence:dir}];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(idx,null,2)+'\n');
const cleanup=()=>{const i=json('CURRENT_CHECKPOINT.json');if(i.activeWork.current.activeExecutionSessions[0]?.driverPid===process.pid){i.activeWork.current.activeExecutionSessions=[];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(i,null,2)+'\n');}};
process.once('exit',()=>{if(!fs.existsSync(dir+'/SUPERVISOR-HANDLE.json'))cleanup();});
try{
 global.gc();const run=await guarded({site,dir,command:'--max-old-space-size=1024 --experimental-strip-types --test --test-reporter=tap --test-concurrency=1 '+roots.join(' '),heap:1024,aggregate:2048,minimum:4096,extraEnv:{VM_CURRENT_SOURCE_RECEIPT:sf,VM_CURRENT_SOURCE_SHA256:hash(sf),VM_WEBSITE_ROOT:site,VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas}});
 verify();const log=fs.readFileSync(dir+'/runner.stdout.log','utf8'),counts=Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(k=>[k,Number([...log.matchAll(new RegExp('^# '+k+' (\\d+)','gm'))].at(-1)?.[1]??-1)]));
 const result={at:new Date().toISOString(),target,source:{path:sf,sha256:hash(sf)},run,counts,sourceUnchanged:true,normalPreviewChanged:false,clinicalApproval:false};fs.writeFileSync(dir+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({result:dir+'/RESULT.json',sha256:hash(dir+'/RESULT.json'),counts,passing:run.passing}));
}finally{cleanup();}
