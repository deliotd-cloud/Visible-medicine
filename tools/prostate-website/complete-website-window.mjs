import fs from 'node:fs';import net from 'node:net';import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
const root='G:/VisibleMedicine-temp/proposals/20261031-prostate-website',cp='F:/VisibleMedicine/recovery/checkpoints/20261031-prostate-website/website-window';
// The launcher and its two children have terminated after the stop guard saw
// the worker in its exit race. No process identity is guessed or killed here.
const observed=spawnSync('powershell.exe',['-NoProfile','-Command',"if(Get-CimInstance Win32_Process -Filter 'ProcessId=56520 OR ProcessId=48116 OR ProcessId=52728'){exit 1}"],{windowsHide:true});assert.equal(observed.status,0);
await new Promise((resolve,reject)=>{const server=net.createServer();server.once('error',reject);server.listen(3000,'127.0.0.1',()=>server.close(resolve));});
fs.writeFileSync(cp+'/STOP_EXIT_RACE.json',JSON.stringify({at:new Date().toISOString(),allThreePriorProcessesTerminated:true,portFree:true,additionalProcessesStopped:false,sameVersionRestore:true},null,2)+'\n',{flag:'wx'});
try{const r=spawnSync(process.execPath,[root+'/job.mjs','website-final'],{windowsHide:true,stdio:'inherit'});console.log(JSON.stringify({websiteBuildExit:r.status}));}
finally{await import('file:///'+root+'/website-window/restart.mjs');}
