import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {guarded as originalGuarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';

// Wait briefly for the previous child job's memory to be returned. The original
// immediate admission check and all job limits still run after this preflight.
export async function waitForStableMemory({minimum,sample,delay,attempts=12}){
 assert(Number.isSafeInteger(minimum)&&minimum>=4096);
 assert(Number.isSafeInteger(attempts)&&attempts>=2&&attempts<=12);
 const observations=[];let consecutive=0;
 for(let attempt=1;attempt<=attempts;attempt++){
  const memory=await sample();
  const valid=Number.isFinite(memory?.AvailableMBytes)&&memory.AvailableMBytes>=0&&Number.isFinite(memory?.PercentCommittedBytesInUse)&&memory.PercentCommittedBytesInUse>=0&&memory.PercentCommittedBytesInUse<=100;
  assert(valid,'Invalid memory observation; do not launch a job');
  observations.push({at:new Date().toISOString(),...memory});
  consecutive=memory.AvailableMBytes>=minimum+128&&memory.PercentCommittedBytesInUse<=90?consecutive+1:0;
  if(consecutive===2)return {ready:true,minimumMiB:minimum,extraHeadroomMiB:128,observations};
  if(attempt<attempts)await delay();
 }
 return {ready:false,minimumMiB:minimum,extraHeadroomMiB:128,observations};
}

export async function guarded(options){
 const receipt=options.dir+'-admission.json';assert(!fs.existsSync(receipt));
 const result=await waitForStableMemory({minimum:options.minimum??4096,
  sample:()=>JSON.parse(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command','Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory | Select-Object AvailableMBytes,PercentCommittedBytesInUse | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true,timeout:5000})),
  delay:()=>new Promise(resolve=>setTimeout(resolve,1000))});
 fs.writeFileSync(receipt,JSON.stringify({...result,originalJobLimitsUnchanged:true},null,2)+'\n',{flag:'wx'});
 assert(result.ready,'Memory has not settled within the bounded admission wait; no job launched');
 return originalGuarded(options);
}
