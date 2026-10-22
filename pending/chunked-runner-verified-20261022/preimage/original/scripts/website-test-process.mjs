import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {digest} from './website-test-chunks.mjs';

export function inspectProcess(pid){
  if(!Number.isSafeInteger(pid)||pid<=0)return {state:'unknown',reason:'invalid PID'};
  if(process.platform!=='win32')return {state:'unknown',reason:'No verified process-identity adapter for this platform'};
  const script=`$ErrorActionPreference='Stop'; $p=Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}'; if($null -eq $p){'{"state":"gone"}'} else { [pscustomobject]@{state='alive';pid=[int]$p.ProcessId;startedUtc=$p.CreationDate.ToUniversalTime().ToString('o');executable=$p.ExecutablePath;command=$p.CommandLine} | ConvertTo-Json -Compress }`;
  try{
    const raw=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{encoding:'utf8',windowsHide:true,timeout:10000,stdio:['ignore','pipe','pipe']});
    const value=JSON.parse(raw.trim());
    if(value.state==='gone')return {state:'gone'};
    if(value.state!=='alive'||value.pid!==pid||typeof value.startedUtc!=='string'||!value.startedUtc||
      typeof value.executable!=='string'||!value.executable||typeof value.command!=='string'||!value.command)
      return {state:'unknown',reason:'Incomplete Windows process identity'};
    return {state:'alive',pid,startedUtc:value.startedUtc,executable:value.executable,commandSha256:digest(value.command)};
  }catch(error){return {state:'unknown',reason:`Windows process inspection failed: ${error.code||error.name||'unknown'}`};}
}
export function requireOwnIdentity(inspector=inspectProcess){
  const value=inspector(process.pid);
  assert(value?.state==='alive'&&value.pid===process.pid&&value.startedUtc&&value.executable&&value.commandSha256,
    'Cannot establish this runner process identity');
  return value;
}
export function assertInactive(identity,inspector=inspectProcess,label='process'){
  assert(identity&&Number.isSafeInteger(identity.pid)&&identity.startedUtc&&identity.executable&&identity.commandSha256,`Invalid ${label} recorded identity`);
  const current=inspector(identity.pid);
  assert(current?.state!=='unknown',`${label} liveness unknown; manual inspection required`);
  if(current.state==='gone')return;
  assert(current.state==='alive',`${label} liveness unknown; manual inspection required`);
  const same=current.startedUtc===identity.startedUtc&&current.executable===identity.executable&&current.commandSha256===identity.commandSha256;
  assert(!same,`${label} is still active; refusing resume`);
  // A verified different start/executable/command is PID reuse, not the recorded process.
}
