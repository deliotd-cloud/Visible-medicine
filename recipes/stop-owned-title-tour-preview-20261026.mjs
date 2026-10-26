import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const dir=process.argv[2]??'F:/VisibleMedicine/staging/20261026-title-tour-preview';assert.equal(dir,'F:/VisibleMedicine/staging/20261026-title-tour-preview');
const handle=JSON.parse(fs.readFileSync(dir+'/HANDLE.json'));assert(Number.isSafeInteger(handle.pid)&&handle.pid>0);const url=new URL(handle.url);assert.equal(url.hostname,'127.0.0.1');assert(['3072'].includes(url.port));
const result=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',`
$all = @(Get-CimInstance Win32_Process);
$rootProcess = $all | Where-Object ProcessId -eq ${handle.pid};
if (!$rootProcess -or $rootProcess.Name -ne 'node.exe' -or $rootProcess.CommandLine -notmatch 'wrangler[/\\\\]bin[/\\\\]wrangler[.]js' -or $rootProcess.CommandLine -notlike '*${dir}*' -or $rootProcess.CommandLine -notmatch '--port ${url.port}( |$)') { throw 'Owned preview root identity mismatch'; }
$owned = @($rootProcess); $depth = 0;
do { $ids=@($owned | ForEach-Object ProcessId); $next=@($all | Where-Object { $_.ParentProcessId -in $ids -and $_.ProcessId -notin $ids }); $owned += $next; $depth++; if($depth -gt 20){throw 'Unexpected process graph';} } while($next.Count -gt 0);
$observed=@($owned | ForEach-Object { [pscustomobject]@{pid=$_.ProcessId;parentPid=$_.ParentProcessId;name=$_.Name;created=$_.CreationDate.ToUniversalTime().ToString('o')} });
foreach($p in @($owned | Sort-Object CreationDate -Descending)) { $live=Get-CimInstance Win32_Process -Filter ('ProcessId='+$p.ProcessId); if($live) { if($live.CreationDate -ne $p.CreationDate -or $live.Name -ne $p.Name) {throw 'Process identity changed';}; Stop-Process -Id $p.ProcessId -ErrorAction Stop; } }
$remaining=@(Get-CimInstance Win32_Process | Where-Object ProcessId -in $observed.pid);
$listeners=@(Get-NetTCPConnection -State Listen -LocalPort ${url.port} -ErrorAction SilentlyContinue);
[ordered]@{ownedProcesses=$observed;remainingOwned=$remaining.Count;listeners=$listeners.Count;ownerPreviewChanged=$false} | ConvertTo-Json -Depth 4 -Compress;
`],{encoding:'utf8',windowsHide:true});
const observed=JSON.parse(result);assert.equal(observed.remainingOwned,0);assert.equal(observed.listeners,0);fs.writeFileSync(dir+'/CLEANUP.json',JSON.stringify({at:new Date().toISOString(),...observed,onlyOwnedProcessesStopped:true},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({cleanup:dir+'/CLEANUP.json',processes:observed.ownedProcesses.length,remaining:0,ownerPreviewChanged:false}));
