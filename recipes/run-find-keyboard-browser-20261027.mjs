import fs from 'node:fs';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
import {json} from './bounded-source-hash-20261026.mjs';import {guarded} from './run-small-native-task-guarded-20261025.mjs';
const dir='F:/VisibleMedicine/staging/20261027-find-keyboard-native/browser/process';
const index=json('CURRENT_CHECKPOINT.json');assert.deepEqual(index.activeWork.current.activeExecutionSessions,[]);
index.activeWork.current.activeExecutionSessions=[{kind:'isolated-find-keyboard-native-preview',driverPid:process.pid,evidence:dir}];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(index,null,2)+'\n');
function clearOwn(){const i=json('CURRENT_CHECKPOINT.json');i.activeWork.current.activeExecutionSessions=i.activeWork.current.activeExecutionSessions.filter(r=>r.driverPid!==process.pid);fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(i,null,2)+'\n');}
process.on('exit',()=>{if(!fs.existsSync(dir+'/SUPERVISOR-HANDLE.json'))clearOwn();});
try{const script=fileURLToPath(new URL('./serve-find-keyboard-native-20261027.mjs',import.meta.url)).replaceAll('\\','/');const run=await guarded({site:process.cwd(),dir,command:'--max-old-space-size=768 '+script,heap:768,aggregate:2048,minimum:4096});fs.writeFileSync(dir+'/RESULT.json',JSON.stringify({at:new Date().toISOString(),...run,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});assert(run.passing);}finally{clearOwn();}
