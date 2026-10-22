# Read-only explicit inverse of the staged respiratory helper proposal.
$ErrorActionPreference = 'Stop'
$stage = Split-Path -Parent $PSCommandPath
$proposal = [IO.File]::ReadAllBytes((Join-Path $stage 'atlas-respiratory-core-depth-checks.mjs'))
$preimage = [IO.File]::ReadAllBytes((Join-Path $stage 'atlas-respiratory-core-depth-checks.preimage.bin'))
$text = [Text.UTF8Encoding]::new($false, $true).GetString($proposal)
if ($text.Contains("`n") -and ($text -replace "`r`n", '').Contains("`n")) { throw 'Non-CRLF proposal' }
$script:lines = [regex]::Split($text, "`r`n")

function Replace-UniqueBlock {
  param([string]$Anchor, [int]$Offset, [int]$Count, [string[]]$Original)
  $hits = @(for ($i = 0; $i -lt $script:lines.Length; $i++) {
    if ($script:lines[$i] -ceq $Anchor) { $i }
  })
  if ($hits.Count -ne 1) { throw "Inverse anchor count $($hits.Count): $Anchor" }
  $start = $hits[0] + $Offset
  if ($start -lt 0 -or $start + $Count -ge $script:lines.Length) { throw "Inverse range: $Anchor" }
  $script:lines = @($script:lines[0..($start - 1)]) + $Original + @($script:lines[($start + $Count)..($script:lines.Length - 1)])
}

Replace-UniqueBlock "import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';" 0 1 @("import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';")
Replace-UniqueBlock "const atlas = currentAtlasDeliveryRoot(), currentPin = validateCurrentAtlasDelivery(), currentReview = liveJson('atlas-review/manifest.json');" 0 1 @("const atlas = currentAtlasDeliveryRoot(), currentReview = liveJson('atlas-review/manifest.json');")
Replace-UniqueBlock 'assert.equal(currentPin.source, CURRENT_ATLAS_REVISION);' 0 1 @()
Replace-UniqueBlock '  const runtimeSource = currentPin.runtimeSources[name];' 0 6 @('  assert.equal(manifest.sourceCommit, CURRENT_ATLAS_REVISION);')
$oldInputs = @'
  for (const path of addedPaths) assert.equal(inputs.find(file => file.path === path)?.sha256, currentReview.files.find(file => file.path === path)?.sourceSha256, `${name}:${path}`);
'@
$newDistinctAnchor = @'
    if (name === 'shoulder') assert.notEqual(input.sha256, reviewSource, `${name}: retained distinct ${path}`);
'@
Replace-UniqueBlock $newDistinctAnchor -14 19 @($oldInputs)

$reconstructed = [Text.UTF8Encoding]::new($false).GetBytes(($script:lines -join "`r`n"))
$expectedHash = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($preimage)).ToLowerInvariant()
$actualHash = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($reconstructed)).ToLowerInvariant()
if ($reconstructed.Length -ne $preimage.Length -or $actualHash -cne $expectedHash) { throw 'Inverse mismatch' }
Write-Output "respiratory inverse=PASS bytes=$($preimage.Length) sha256=$actualHash"
