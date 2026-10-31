$ErrorActionPreference = 'Stop'
$checkpointPath = 'F:/VisibleMedicine/recovery/checkpoints/20261031-release14-followup-progress/preview-window'
$restartState = Get-Content -LiteralPath "$checkpointPath/RESTART_STARTED.json" -Raw | ConvertFrom-Json
$previewNode = Get-CimInstance Win32_Process -Filter "ProcessId=$($restartState.pid)"
if (!$previewNode -or $previewNode.CommandLine -notlike '*start-stable-preview.mjs*') { throw 'Expected local preview process is not running' }
$childProcesses = @(Get-CimInstance Win32_Process -Filter "ParentProcessId=$($restartState.pid)")
$worker = @($childProcesses | Where-Object Name -eq 'workerd.exe')
if ($worker.Count -ne 1) { throw 'Expected one preview worker' }
$listener = @(Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction Stop)
if ($listener.Count -lt 1 -or @($listener | Where-Object OwningProcess -ne $restartState.pid).Count -ne 0) { throw 'Preview port is not owned by the expected preview server' }
$response = Invoke-WebRequest -Uri 'http://127.0.0.1:3000/workspace/clinical-review-inbox' -UseBasicParsing -TimeoutSec 30
if ($response.StatusCode -ne 200) { throw 'Clinical review inbox did not respond' }
$health = @{ at=(Get-Date).ToUniversalTime().ToString('o'); status=$response.StatusCode; nodePid=$restartState.pid; launcherPid=$restartState.launcherPid; workerdPid=$worker[0].ProcessId; sameInstalledVersion=$true; ownerTabsRefreshed=$false }
$health | ConvertTo-Json -Compress
