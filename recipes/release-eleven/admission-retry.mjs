import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition11-repairs';
assert.equal(hash(root+'/SOURCE.json'),'79f451df9dde58cd70a72eb6560d05fd74f8b421897405bd4ae82e6756304bb4');
const original=json(root+'/RUN_STATE.json');assert.equal(original.coordinatorPid,165744);assert.equal(original.completed.length,0);
const status={at:new Date().toISOString(),pid:process.pid,source:{path:root+'/SOURCE.json',sha256:hash(root+'/SOURCE.json')},prior:{pid:165744,toolObservedExitCode:1,reason:'Guard refused launch at3595MiB; no test child admitted'},state:'waiting-for-memory',minimumMiB:4096,attempts:[],terminal:false};
const save=()=>fs.writeFileSync(root+'/ADMISSION_RETRY.json',JSON.stringify(status,null,2)+'\n');assert(!fs.existsSync(root+'/ADMISSION_RETRY.json'));save();
const available=()=>Number(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"[math]::Round((Get-Counter '\\Memory\\Available MBytes').CounterSamples.CookedValue)"],{encoding:'utf8',windowsHide:true}).trim());
for(let attempt=0;attempt<10;attempt++){
 const free=available();status.attempts.push({at:new Date().toISOString(),availableMiB:free});save();
 if(free<4096){if(attempt===0)console.log(JSON.stringify({waiting:true,availableMiB:free,minimumMiB:4096,pid:process.pid}));await new Promise(resolve=>setTimeout(resolve,60000));continue;}
 const recipe=fs.readFileSync(root+'/verify.mjs','utf8').replaceAll('RUN_STATE.json','RUN_STATE_RETRY.json').replace("const dir=root+'/'+run.name;","const dir=root+'/'+run.name+'-retry';").replace("run.name.toUpperCase()+'_RESULT.json'","run.name.toUpperCase()+'_RETRY_RESULT.json'");
 const entry=root+'/verify-retry.mjs';fs.writeFileSync(entry,recipe,{flag:'wx'});
 status.state='launched';status.availableAtLaunchMiB=free;
 const child=spawn(process.execPath,['--max-old-space-size=192',entry],{windowsHide:true,stdio:['ignore','pipe','pipe']});status.childPid=child.pid;save();console.log(JSON.stringify({launched:true,pid:child.pid,availableMiB:free}));
 child.stdout.pipe(process.stdout);child.stderr.pipe(process.stderr);
 status.result=await new Promise(resolve=>{let error;child.once('error',e=>error=String(e));child.once('close',(code,signal)=>resolve({code,signal,error:error??null}));});status.state='child-terminal';status.terminal=true;status.finished=new Date().toISOString();save();process.exitCode=status.result.code??1;break;
}
if(!status.terminal){status.state='memory-deferred';status.terminal=true;status.finished=new Date().toISOString();save();process.exitCode=2;console.log(JSON.stringify({deferred:true,reason:'4096MiB threshold not reached during bounded wait'}));}
