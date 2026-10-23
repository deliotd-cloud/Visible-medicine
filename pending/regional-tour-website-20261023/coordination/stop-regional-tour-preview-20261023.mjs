// Stop only the identity-verified owned fixture; never touch the normal website.
import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const dir='F:/VisibleMedicine/staging/20261023-regional-tour-website/browser',ready=JSON.parse(fs.readFileSync(dir+'/READY.json'));
assert(Number.isSafeInteger(ready.pid)&&ready.pid>0);
const result=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',`
$qa = Get-CimInstance Win32_Process -Filter 'ProcessId=${ready.pid}';
if (!$qa) { throw 'Owned fixture process is already absent; inspect before recording termination' };
if ($qa.Name -ne 'node.exe' -or $qa.CommandLine -notmatch 'preview-regional-tour-website-20261023\\.mjs') { throw 'Fixture identity mismatch' };
$observed = [ordered]@{ ProcessId=$qa.ProcessId; ParentProcessId=$qa.ParentProcessId; Name=$qa.Name; CreationDate=$qa.CreationDate.ToUniversalTime().ToString('o') };
Stop-Process -Id ${ready.pid} -ErrorAction Stop;
$gone = $null -eq (Get-CimInstance Win32_Process -Filter 'ProcessId=${ready.pid}');
[ordered]@{ process=$observed; stopped=$gone; normalWebsiteChanged=$false } | ConvertTo-Json -Compress;
`],{encoding:'utf8',windowsHide:true}).trim();
const observed=JSON.parse(result);assert.equal(observed.process.ProcessId,ready.pid);assert(observed.stopped);
fs.writeFileSync(dir+'/STOPPED.json',JSON.stringify({at:new Date().toISOString(),...observed,tabId:'148',ownedTabClosed:true,stdinQuitUnavailable:true,termination:'Identity-verified owned process only. Initial non-TTY stdin was closed; no replacement process was launched.',serverRequestLogUnavailableAfterForcedShutdown:true,normalWebsiteOrOwnerTabsChanged:false},null,2)+'\n',{flag:'wx'});console.log(result);
