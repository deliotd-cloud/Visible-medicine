param([Parameter(Mandatory=$true)][string]$HandlePath)
$ErrorActionPreference='Stop'
$vmHandleFile=[IO.Path]::GetFullPath($HandlePath)
if(-not $vmHandleFile.StartsWith('F:\VisibleMedicine\staging\',[StringComparison]::OrdinalIgnoreCase)){throw 'Only an explicit staged preview handle is accepted.'}
$vmHandle=Get-Content -LiteralPath $vmHandleFile -Raw|ConvertFrom-Json
if($vmHandle.role -ne 'isolated-built-workers-website-preview' -or $vmHandle.url -ne 'http://127.0.0.1:3047' -or $vmHandle.args -notcontains '--local'){throw 'Not the owned local-only built preview.'}
$vmRoot=Get-CimInstance Win32_Process -Filter "ProcessId=$([int]$vmHandle.pid)"
if($null -eq $vmRoot){throw 'Recorded preview process is absent; no process stopped.'}
if($vmHandle.at -is [DateTime]){$vmExpected=$vmHandle.at.ToUniversalTime()}else{$vmExpected=[DateTimeOffset]::Parse([string]$vmHandle.at,[Globalization.CultureInfo]::InvariantCulture).UtcDateTime}
if($vmRoot.ParentProcessId -ne [int]$vmHandle.parentPid -or [Math]::Abs(($vmRoot.CreationDate.ToUniversalTime()-$vmExpected).TotalMilliseconds) -gt 2000){throw 'Owned preview creation/parent identity changed; no process stopped.'}
$vmCommand=$vmRoot.CommandLine.Replace('\','/')
if(-not $vmCommand.Contains(([string]$vmHandle.args[1]).Replace('\','/'))){throw 'Recorded local preview executable changed; no process stopped.'}
$vmSnapshot=@(Get-CimInstance Win32_Process)
$vmOwned=@{};$vmOwned[[int]$vmRoot.ProcessId]=$vmRoot
do {$vmAdded=$false;foreach($vmEntry in $vmSnapshot){if($vmOwned.ContainsKey([int]$vmEntry.ProcessId) -or -not $vmOwned.ContainsKey([int]$vmEntry.ParentProcessId)){continue};if($vmEntry.CreationDate -lt $vmOwned[[int]$vmEntry.ParentProcessId].CreationDate){continue};$vmOwned[[int]$vmEntry.ProcessId]=$vmEntry;$vmAdded=$true}}while($vmAdded)
$vmProof=@($vmOwned.Values|Sort-Object CreationDate -Descending|ForEach-Object{[pscustomobject]@{pid=$_.ProcessId;parentPid=$_.ParentProcessId;name=$_.Name;created=$_.CreationDate.ToUniversalTime().ToString('o')}})
$vmDir=[IO.Path]::GetDirectoryName($vmHandleFile)
$vmReceipt=Join-Path $vmDir 'STOP_REQUEST.json'
if(Test-Path -LiteralPath $vmReceipt){throw 'Create-only cleanup receipt already exists.'}
[pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');reason='Task-owned isolated preview finished; release its memory';handle=$vmHandleFile;processes=$vmProof;ownerPreviewChanged=$false}|ConvertTo-Json -Depth 5|Set-Content -LiteralPath $vmReceipt
foreach($vmEntry in ($vmOwned.Values|Sort-Object CreationDate -Descending)){$vmNow=Get-CimInstance Win32_Process -Filter "ProcessId=$($vmEntry.ProcessId)";if($null -ne $vmNow -and $vmNow.ParentProcessId -eq $vmEntry.ParentProcessId -and $vmNow.CreationDate -eq $vmEntry.CreationDate){Stop-Process -Id $vmEntry.ProcessId -Force -ErrorAction Stop}}
$vmResult=[pscustomobject]@{ownedProcessCount=$vmProof.Count;port3047Listeners=@(Get-NetTCPConnection -State Listen -LocalPort 3047 -ErrorAction SilentlyContinue).Count;ownerPreviewChanged=$false}
$vmResult|ConvertTo-Json -Compress
if($vmResult.port3047Listeners -ne 0){exit 1}
