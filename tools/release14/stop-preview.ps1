$ErrorActionPreference = 'Stop'
$planPath = 'F:/VisibleMedicine/recovery/checkpoints/20261031-release14-repair-progress/preview-window/PLAN.json'
$plan = Get-Content -LiteralPath $planPath -Raw | ConvertFrom-Json
$previewProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$($plan.oldPreview.pid)"
$launcherProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$($plan.oldPreview.launcherPid)"
$workerProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$($plan.oldPreview.workerdPid)"
if (!$previewProcess -or $previewProcess.CommandLine -notlike '*scripts/start-stable-preview.mjs*' -or $previewProcess.ParentProcessId -ne $launcherProcess.ProcessId) { throw 'Preview identity changed' }
if (!$launcherProcess -or $launcherProcess.CommandLine -notlike '*20261031-cardiac-integration/preview-window/restart.mjs*') { throw 'Launcher identity changed' }
if (!$workerProcess -or $workerProcess.Name -ne 'workerd.exe' -or $workerProcess.ParentProcessId -ne $previewProcess.ProcessId) { throw 'Worker identity changed' }
$listeners = @(Get-NetTCPConnection -LocalPort 3000 -State Listen)
if (!$listeners.Count -or @($listeners | Where-Object OwningProcess -ne $previewProcess.ProcessId).Count) { throw 'Port ownership changed' }
Stop-Process -Id $previewProcess.ProcessId -ErrorAction Stop
Wait-Process -Id $previewProcess.ProcessId -Timeout 15 -ErrorAction SilentlyContinue
$workerStill = Get-CimInstance Win32_Process -Filter "ProcessId=$($workerProcess.ProcessId)"
if ($workerStill) {
  if ($workerStill.CommandLine -ne $workerProcess.CommandLine -or $workerStill.ParentProcessId -ne $previewProcess.ProcessId) { throw 'Worker changed during stop' }
  Stop-Process -Id $workerStill.ProcessId -ErrorAction Stop
}
if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) { throw 'Preview port remains in use' }
$record = @{ at=(Get-Date).ToUniversalTime().ToString('o'); nodePid=$previewProcess.ProcessId; workerdPid=$workerProcess.ProcessId; stopped=$true; restoreSameVersion=$true; tabsRefreshed=$false; consent=$plan.consent }
$record | ConvertTo-Json | Set-Content -LiteralPath 'F:/VisibleMedicine/recovery/checkpoints/20261031-release14-repair-progress/preview-window/STOPPED.json' -Encoding utf8
$record | ConvertTo-Json -Compress
