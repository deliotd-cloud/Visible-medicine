# Read-only source/metadata check. Reads Git text blobs and delivery notices as bytes.
$ErrorActionPreference = 'Stop'
$website = 'F:\VisibleMedicine\staging\20261022-review-recovery-website-candidate\website'
$atlas = 'F:\VisibleMedicine\atlas'
$pin = Get-Content -Raw -LiteralPath (Join-Path $website 'tests/fixtures/current-atlas-delivery.json') | ConvertFrom-Json
$inventory = Get-Content -Raw -LiteralPath (Join-Path $website 'lib/atlas-model-inventory.json') | ConvertFrom-Json
$review = Get-Content -Raw -LiteralPath (Join-Path $website 'atlas-review/manifest.json') | ConvertFrom-Json
$viewer = Get-Content -Raw -LiteralPath (Join-Path $website 'public/atlas-review-viewer/manifest.json') | ConvertFrom-Json

function Digest([byte[]]$bytes) { [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant() }
function Exact-GitBytes([string]$revision, [string]$path) {
  $info = [Diagnostics.ProcessStartInfo]::new('git')
  $info.WorkingDirectory = $atlas
  $info.UseShellExecute = $false
  $info.RedirectStandardOutput = $true
  $info.RedirectStandardError = $true
  $info.Environment['GIT_NO_REPLACE_OBJECTS'] = '1'
  $info.ArgumentList.Add('show')
  $info.ArgumentList.Add("${revision}:$path")
  $process = [Diagnostics.Process]::Start($info)
  $stream = [IO.MemoryStream]::new()
  $process.StandardOutput.BaseStream.CopyTo($stream)
  $errorText = $process.StandardError.ReadToEnd()
  $process.WaitForExit()
  if ($process.ExitCode -ne 0) { throw "git show $revision`:$path failed: $errorText" }
  return $stream.ToArray()
}
function Check([bool]$condition, [string]$label) { if (-not $condition) { throw $label } }

Check ($review.revision -ceq $pin.source) 'Review source role'
Check ($viewer.sourceCommit -ceq $pin.source) 'Viewer source role'
$respiratory = @('content/respiratory-core-depth-pins.json','content/respiratory-core-depth.ts','lib/respiratory-core-depth.ts')
$distinct = @('app/body-content.ts','app/body-explorer.css','content/regional-teaching/abdomen.json')
$inputChecks = 0
$noticeChecks = 0
$distinctChecks = 0
foreach ($name in @('head-neck','shoulder','female-pelvis','lower-limb')) {
  $base = "public/atlas-runtime/$name/"
  $manifestPath = Join-Path $website ($base + 'manifest.json')
  $manifestBytes = [IO.File]::ReadAllBytes($manifestPath)
  $manifest = [Text.Encoding]::UTF8.GetString($manifestBytes) | ConvertFrom-Json
  $sourceInputs = Get-Content -Raw -LiteralPath (Join-Path $website ($base + 'source-inputs.json')) | ConvertFrom-Json
  $family = $pin.runtimeSources.$name
  $entry = @($inventory.sources | Where-Object { $_.module -ceq $name })
  Check ($manifest.sourceCommit -ceq $family) "$name runtime source role"
  Check ($entry.Count -eq 1 -and $entry[0].sourceCommit -ceq $family -and $entry[0].manifestSha256 -ceq (Digest $manifestBytes)) "$name inventory source/manifest"
  $wanted = @()
  if ($name -in @('head-neck','shoulder')) { $wanted += $respiratory + $distinct }
  foreach ($row in @($sourceInputs | Where-Object { $_.path -in $wanted })) {
    Check ($row.sha256 -ceq (Digest (Exact-GitBytes $family $row.path))) "$name source input $($row.path)"
    $reviewRow = @($review.files | Where-Object { $_.path -ceq $row.path })
    Check ($reviewRow.Count -eq 1) "Review missing $($row.path)"
    if ($name -ceq 'shoulder' -and $row.path -in $distinct) {
      Check ($row.sha256 -cne $reviewRow[0].sourceSha256) "Shoulder distinction $($row.path)"
      $distinctChecks++
    } else { Check ($row.sha256 -ceq $reviewRow[0].sourceSha256) "$name shared Review input $($row.path)" }
    $inputChecks++
  }
  if ($name -in @('head-neck','shoulder')) { Check (($sourceInputs | Where-Object { $_.path -in $wanted }).Count -eq $wanted.Count) "$name selected input count" }
  foreach ($file in @($manifest.files | Where-Object { $_.path -match '(?i)(?:^|/)(?:LICENSE(?:S)?(?:/|$)|[^/]*NOTICE[^/]*)' })) {
    $bytes = [IO.File]::ReadAllBytes((Join-Path $website ($base + $file.path)))
    Check ($file.sha256 -ceq (Digest $bytes)) "$name notice $($file.path)"
    $noticeChecks++
  }
}
Check ($distinctChecks -eq 3) 'Three genuine shoulder input distinctions'
Write-Output "source-only audit PASS runtimeFamilies=4 sourceInputs=$inputChecks distinctShoulderInputs=$distinctChecks noticeBytes=$noticeChecks review=$($pin.source)"
