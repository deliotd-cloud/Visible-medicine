import fs from 'node:fs';import assert from 'node:assert/strict';
import {json} from './bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-coccygeus-tour-native';
const ix=json('CURRENT_CHECKPOINT.json'),active=ix.activeWork.current.activeExecutionSessions;
assert.equal(active.length,1);assert.equal(active[0].driverPid,96452);
let alive=true;try{process.kill(96452,0);}catch(error){if(error.code==='ESRCH')alive=false;else throw error;}
assert.equal(alive,false,'Do not clear a live driver');
assert(!fs.existsSync(stage+'/checks/metadata-1'),'No guarded child or build started');
fs.writeFileSync(stage+'/METADATA_ADMISSION_REJECTION.json',JSON.stringify({at:new Date().toISOString(),phase:'metadata',driverPid:96452,driverConfirmedExited:true,availableMiB:613,requiredMiB:4096,applicationStarted:false,guardDirectoryCreated:false,productTestFailure:false,source:'Observed admission output; the guard exits before creating its job directory.',laterAvailableGiB:15.67,retryKeepsSameGuard:true},null,2)+'\n',{flag:'wx'});
ix.activeWork.current.activeExecutionSessions=[];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(ix,null,2)+'\n');
console.log('Admission rejection saved; exited driver cleared.');
