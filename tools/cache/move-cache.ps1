$ErrorActionPreference = 'Stop'
$vmRoot = 'G:\VisibleMedicine-temp\proposals\20261031-cache-relocation'
$vmSource = 'F:\VisibleMedicine\staging\npm-cache'
$vmDestination = 'G:\VisibleMedicine-temp\caches\npm-cache-from-f-20261031'
$vmRetired = 'F:\VisibleMedicine\staging\npm-cache-relocation-original-20261031'
New-Item -ItemType Directory -Path $vmRoot -Force | Out-Null
function Assert-Within([string]$candidate,[string]$parent) {
  $resolved = [IO.Path]::GetFullPath($candidate)
  $boundary = [IO.Path]::GetFullPath($parent).TrimEnd('\') + '\'
  if (-not $resolved.StartsWith($boundary,[StringComparison]::OrdinalIgnoreCase)) { throw "Path outside intended workspace: $resolved" }
  return $resolved
}
$vmSource = Assert-Within $vmSource 'F:\VisibleMedicine\staging'
$vmRetired = Assert-Within $vmRetired 'F:\VisibleMedicine\staging'
$vmDestination = Assert-Within $vmDestination 'G:\VisibleMedicine-temp\caches'
if ((Test-Path -LiteralPath $vmDestination) -or (Test-Path -LiteralPath $vmRetired) -or (Test-Path -LiteralPath "$vmRoot\PLAN.json")) { throw 'Create-only relocation: inspect an existing outcome before retrying.' }
if (-not (Test-Path -LiteralPath $vmSource -PathType Container)) { throw 'Expected source cache missing.' }
if ((Get-Item -LiteralPath $vmSource).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Refuse to relocate an existing junction.' }
function Get-CacheManifest([string]$root) {
  $entries = @(Get-ChildItem -LiteralPath $root -Recurse -Force)
  if (@($entries | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }).Count) { throw 'Unexpected cache link.' }
  return @($entries | Where-Object { -not $_.PSIsContainer } | Sort-Object FullName | ForEach-Object {
    [pscustomobject]@{path=$_.FullName.Substring($root.Length+1).Replace('\','/'); bytes=$_.Length; modified=$_.LastWriteTimeUtc.ToString('o'); sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()}
  })
}
function Assert-Same($expected,$actual) {
  if ($expected.Count -ne $actual.Count) { throw 'Cache file count changed.' }
  for ($vmIndex=0;$vmIndex -lt $expected.Count;$vmIndex++) {
    if ($expected[$vmIndex].path -cne $actual[$vmIndex].path -or $expected[$vmIndex].bytes -ne $actual[$vmIndex].bytes -or $expected[$vmIndex].sha256 -cne $actual[$vmIndex].sha256) { throw "Cache readback mismatch at $vmIndex" }
  }
}
$vmBefore = Get-CacheManifest $vmSource
if ($vmBefore.Count -ne 271) { throw 'Inspected cache inventory changed; re-audit required.' }
$vmBytes = ($vmBefore | Measure-Object bytes -Sum).Sum
$vmFreeBefore = (Get-PSDrive F).Free
@{at=[DateTime]::UtcNow.ToString('o');source=$vmSource;destination=$vmDestination;retired=$vmRetired;files=$vmBefore;bytes=$vmBytes;freeBefore=$vmFreeBefore;scope='Temporary package download cache only. Original source, installed preview, scans, review data and WSL remain untouched.'} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath "$vmRoot\PLAN.json" -Encoding UTF8
New-Item -ItemType Directory -Path $vmDestination | Out-Null
foreach ($vmEntry in $vmBefore) {
  $vmTo = Join-Path $vmDestination $vmEntry.path
  Assert-Within $vmTo $vmDestination | Out-Null
  New-Item -ItemType Directory -Path (Split-Path -Parent $vmTo) -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path $vmSource $vmEntry.path) -Destination $vmTo
}
Assert-Same $vmBefore (Get-CacheManifest $vmDestination)
Assert-Same $vmBefore (Get-CacheManifest $vmSource)
# Rename within the verified F staging directory, then retain the original path as a junction.
Assert-Within $vmSource 'F:\VisibleMedicine\staging' | Out-Null
Assert-Within $vmRetired 'F:\VisibleMedicine\staging' | Out-Null
Move-Item -LiteralPath $vmSource -Destination $vmRetired
try {
  New-Item -ItemType Junction -Path $vmSource -Target $vmDestination | Out-Null
  $vmJunction = Get-Item -LiteralPath $vmSource
  if ($vmJunction.LinkType -ne 'Junction' -or [IO.Path]::GetFullPath($vmJunction.Target).TrimEnd('\') -cne $vmDestination.TrimEnd('\')) { throw 'Unexpected cache junction target.' }
  Assert-Same $vmBefore (Get-CacheManifest $vmSource)
  Assert-Same $vmBefore (Get-CacheManifest $vmRetired)
} catch {
  # The intact retired original remains available for explicit recovery on any failure.
  @{at=[DateTime]::UtcNow.ToString('o');error=$_.Exception.Message;original=$vmRetired;copy=$vmDestination;doNotRetryAutomatically=$true} | ConvertTo-Json | Set-Content -LiteralPath "$vmRoot\FAILED.json" -Encoding UTF8
  throw
}
@{at=[DateTime]::UtcNow.ToString('o');files=$vmBefore.Count;bytes=$vmBytes;sourcePathReadsVerifiedCopy=$true;originalRetainedAt=$vmRetired} | ConvertTo-Json | Set-Content -LiteralPath "$vmRoot\VERIFIED_BEFORE_REMOVAL.json" -Encoding UTF8
# Remove only the exact, revalidated old cache after byte-for-byte readback through its replacement path.
Assert-Within $vmRetired 'F:\VisibleMedicine\staging' | Out-Null
if ((Get-Item -LiteralPath $vmRetired).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Original unexpectedly became a link.' }
Assert-Same $vmBefore (Get-CacheManifest $vmRetired)
Remove-Item -LiteralPath $vmRetired -Recurse -Force
if (Test-Path -LiteralPath $vmRetired) { throw 'Old cache cleanup incomplete.' }
Assert-Same $vmBefore (Get-CacheManifest $vmSource)
$vmFreeAfter = (Get-PSDrive F).Free
$vmResult = @{at=[DateTime]::UtcNow.ToString('o');source=$vmSource;destination=$vmDestination;files=$vmBefore.Count;bytes=$vmBytes;verified=$true;retiredRemoved=$true;pathPreserved=$true;freeBefore=$vmFreeBefore;freeAfter=$vmFreeAfter;observedFreeDelta=$vmFreeAfter-$vmFreeBefore;installedPreviewChanged=$false;projectSourcesMoved=$false;patientDataMoved=$false;wslStopped=$false}
$vmResult | ConvertTo-Json | Set-Content -LiteralPath "$vmRoot\RESULT.json" -Encoding UTF8
$vmResult | ConvertTo-Json -Compress
