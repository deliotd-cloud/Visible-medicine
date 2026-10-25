import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {spec,stage,json,writeNew} from './common.mjs';

const mode=process.argv[2],s=spec(mode),dir=stage(mode);
const handle=json(dir+'/HANDLE.json');assert.equal(handle.mode,mode);
assert(Number.isSafeInteger(handle.pid)&&handle.pid>0);
assert.equal(handle.url,`http://127.0.0.1:${s.port}`);
assert.equal(handle.inspectorPort,s.inspector);
const script=`
$ErrorActionPreference='Stop'
$all=@(Get-CimInstance Win32_Process)
$root=@($all | Where-Object ProcessId -eq ${handle.pid})
if($root.Count -eq 0){
  [ordered]@{rootAbsent=$true;ownedProcesses=@();remainingOwned=0;listeners=@(Get-NetTCPConnection -State Listen -LocalPort ${s.port} -ErrorAction SilentlyContinue).Count;inspectorListeners=@(Get-NetTCPConnection -State Listen -LocalPort ${s.inspector} -ErrorAction SilentlyContinue).Count} | ConvertTo-Json -Depth 5 -Compress
  exit 0
}
if($root.Count -ne 1 -or $root[0].Name -ne 'node.exe' -or $root[0].ParentProcessId -ne ${handle.parentPid} -or $root[0].CreationDate.ToUniversalTime().ToString('o') -ne '${handle.processCreated}' -or $root[0].CommandLine -notlike '*wrangler*bin*wrangler.js*' -or $root[0].CommandLine -notlike '*${dir}*' -or $root[0].CommandLine -notmatch '--port ${s.port}( |$)' -or $root[0].CommandLine -notmatch '--inspector-port ${s.inspector}( |$)') {throw 'Owned root identity mismatch'}
$owned=@($root);$depth=0
do {$ids=@($owned | ForEach-Object ProcessId);$next=@($all | Where-Object {$_.ParentProcessId -in $ids -and $_.ProcessId -notin $ids});$owned+= $next;$depth++;if($depth -gt 20){throw 'Unexpected process graph'}} while($next.Count -gt 0)
$observed=@($owned | ForEach-Object {[pscustomobject]@{pid=$_.ProcessId;parentPid=$_.ParentProcessId;name=$_.Name;created=$_.CreationDate.ToUniversalTime().ToString('o')}})
foreach($p in @($owned | Sort-Object CreationDate -Descending)){$live=Get-CimInstance Win32_Process -Filter ('ProcessId='+$p.ProcessId);if($live){if($live.CreationDate -ne $p.CreationDate -or $live.Name -ne $p.Name){throw 'Process identity changed'};Stop-Process -Id $p.ProcessId -ErrorAction Stop}}
$remaining=@(Get-CimInstance Win32_Process | Where-Object ProcessId -in $observed.pid)
$listeners=@(Get-NetTCPConnection -State Listen -LocalPort ${s.port} -ErrorAction SilentlyContinue)
$inspectorListeners=@(Get-NetTCPConnection -State Listen -LocalPort ${s.inspector} -ErrorAction SilentlyContinue)
[ordered]@{rootAbsent=$false;ownedProcesses=$observed;remainingOwned=$remaining.Count;listeners=$listeners.Count;inspectorListeners=$inspectorListeners.Count} | ConvertTo-Json -Depth 5 -Compress
`;
const observed=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{encoding:'utf8',windowsHide:true}));
assert.equal(observed.remainingOwned,0);assert.equal(observed.listeners,0);assert.equal(observed.inspectorListeners,0);
writeNew(dir+'/CLEANUP.json',{at:new Date().toISOString(),...observed,onlyOwnedProcessesStopped:true,ownerPreviewChanged:false});
console.log(JSON.stringify({mode,cleanup:dir+'/CLEANUP.json',ownedProcesses:observed.ownedProcesses.length,remaining:0}));
