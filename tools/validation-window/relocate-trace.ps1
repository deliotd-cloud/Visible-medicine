$ErrorActionPreference='Stop'
$source='F:\VisibleMedicine\website\.wrangler\state\v3\observability'
$target='G:\VisibleMedicine-temp\caches\website-observability-20261031'
$retired='F:\VisibleMedicine\website\.wrangler\state\v3\observability-relocation-original-20261031'
$evidence='F:\VisibleMedicine\recovery\checkpoints\20261031-temporary-validation-window'
if(Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue){throw 'Website must remain stopped during cache relocation'}
if((Test-Path -LiteralPath $target) -or (Test-Path -LiteralPath $retired)){throw 'Inspect existing relocation state first'}
$resolved=[IO.Path]::GetFullPath($source)
if($resolved -ne 'F:\VisibleMedicine\website\.wrangler\state\v3\observability'){throw 'Unexpected source'}
$sourceItem=Get-Item -LiteralPath $source
if($sourceItem.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Source must be an ordinary directory'}
$entries=@(Get-ChildItem -LiteralPath $source -Recurse -Force)
if($entries | Where-Object {$_.Attributes -band [IO.FileAttributes]::ReparsePoint}){throw 'Unexpected nested link'}
$files=@($entries | Where-Object {-not $_.PSIsContainer})
$bytes=($files | Measure-Object Length -Sum).Sum
if((Get-PSDrive G).Free -lt ($bytes+104857600)){throw 'Insufficient destination room'}
$beforeFree=(Get-PSDrive F).Free
New-Item -ItemType Directory -Path $target | Out-Null
$rows=@()
foreach($file in $files){
 $relative=[IO.Path]::GetRelativePath($source,$file.FullName)
 $destination=[IO.Path]::GetFullPath((Join-Path $target $relative))
 if(-not $destination.StartsWith($target+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'Destination escaped cache'}
 New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($destination)) -Force | Out-Null
 $hash=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
 Copy-Item -LiteralPath $file.FullName -Destination $destination
 if((Get-Item -LiteralPath $destination).Length -ne $file.Length -or (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash -ne $hash){throw 'Cache copy mismatch'}
 if((Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash -ne $hash){throw 'Source changed while copying'}
 $rows += [pscustomobject]@{path=$relative;bytes=$file.Length;sha256=$hash.ToLowerInvariant()}
}
$before=[pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');source=$source;destination=$target;retired=$retired;files=$rows;bytes=$bytes;cacheOnly=$true;privateLocalOnly=$true;uploaded=$false}
$before | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $evidence 'TRACE_VERIFIED_BEFORE_MOVE.json') -Encoding utf8
if([IO.Path]::GetFullPath($retired) -ne 'F:\VisibleMedicine\website\.wrangler\state\v3\observability-relocation-original-20261031'){throw 'Unexpected retired target'}
Move-Item -LiteralPath $source -Destination $retired
New-Item -ItemType Junction -Path $source -Target $target | Out-Null
foreach($row in $rows){if((Get-FileHash -LiteralPath (Join-Path $source $row.path) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $row.sha256){throw 'Junction readback mismatch'}}
$retiredItem=Get-Item -LiteralPath $retired
if($retiredItem.FullName -ne $retired -or ($retiredItem.Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Unsafe retired cache directory'}
if(Get-ChildItem -LiteralPath $retired -Recurse -Force | Where-Object {$_.Attributes -band [IO.FileAttributes]::ReparsePoint}){throw 'Unexpected retired link'}
foreach($row in $rows){if((Get-FileHash -LiteralPath (Join-Path $retired $row.path) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $row.sha256){throw 'Retired byte mismatch'}}
Remove-Item -LiteralPath $retired -Recurse
$result=[pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');source=$source;destination=$target;files=$rows.Count;bytes=$bytes;observedFreedBytes=((Get-PSDrive F).Free-$beforeFree);verified=$true;pathPreserved=$true;retiredRemoved=(-not (Test-Path -LiteralPath $retired));reviewDatabasesMoved=$false;privateLocalOnly=$true;uploaded=$false}
$result | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $evidence 'TRACE_RELOCATION.json') -Encoding utf8
$result | ConvertTo-Json -Compress
