import fs from 'node:fs';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {hash,json} from './bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-find-keyboard-website',records=[];assert.deepEqual(json('CURRENT_CHECKPOINT.json').activeWork.current.activeExecutionSessions,[]);
fs.writeFileSync(stage+'/IMPORT_STARTED.json',JSON.stringify({at:new Date().toISOString(),driverPid:process.pid,preparationSha256:hash(stage+'/PREPARATION.json')},null,2)+'\n',{flag:'wx'});
for(const [script,args]of [['import-find-keyboard-website-stock-20261027.mjs',['import']],['import-find-keyboard-website-stock-20261027.mjs',['inventory']],['import-find-keyboard-website-stock-20261027.mjs',['lecture']],['run-find-keyboard-website-integration-20261027.mjs',[]],['seal-find-keyboard-website-source-20261027.mjs',[]]]){
 const child=spawn(process.execPath,['--expose-gc','--max-old-space-size=1024',script,...args],{windowsHide:true,stdio:'inherit'});console.log(JSON.stringify({script,args,pid:child.pid}));
 const terminal=await new Promise(resolve=>{child.once('error',e=>resolve({error:String(e)}));child.once('close',(code,signal)=>resolve({code,signal}));});records.push({script,args,pid:child.pid,sha256:hash(script),terminal});
 if(terminal.code!==0||terminal.signal||terminal.error){fs.writeFileSync(stage+'/IMPORT_STOP.json',JSON.stringify({at:new Date().toISOString(),records},null,2)+'\n',{flag:'wx'});process.exitCode=1;break;}
}
if(records.length===5&&records.every(r=>r.terminal.code===0))fs.writeFileSync(stage+'/IMPORT_FINISHED.json',JSON.stringify({at:new Date().toISOString(),passing:true,records,normalPreviewChanged:false},null,2)+'\n',{flag:'wx'});
