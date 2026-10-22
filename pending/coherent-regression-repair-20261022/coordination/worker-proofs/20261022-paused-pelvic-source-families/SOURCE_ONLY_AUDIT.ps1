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
$paused = @('lib/paused-tour-imaging.ts','app/paused-tour-imaging-link.tsx','app/body-education-link.ts','app/regional-guided-learning.tsx','app/whole-body-guided-learning.tsx')
$pelvic = @('content/pelvic-reproductive-core-pins.json','content/pelvic-reproductive-core.ts','lib/pelvic-reproductive-core.ts')
$inputChecks = 0
$noticeChecks = 0
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
  $wanted = @($paused)
  if ($name -in @('head-neck','shoulder')) { $wanted += $pelvic }
  foreach ($row in @($sourceInputs | Where-Object { $_.path -in $wanted })) {
    Check ($row.sha256 -ceq (Digest (Exact-GitBytes $family $row.path))) "$name source input $($row.path)"
    $inputChecks++
  }
  foreach ($file in @($manifest.files | Where-Object { $_.path -match '(?i)(?:^|/)(?:LICENSE(?:S)?(?:/|$)|[^/]*NOTICE[^/]*)' })) {
    $bytes = [IO.File]::ReadAllBytes((Join-Path $website ($base + $file.path)))
    Check ($file.sha256 -ceq (Digest $bytes)) "$name notice $($file.path)"
    $noticeChecks++
  }
}
Write-Output "source-only audit PASS runtimeFamilies=4 sourceInputs=$inputChecks noticeBytes=$noticeChecks review=$($pin.source)"
