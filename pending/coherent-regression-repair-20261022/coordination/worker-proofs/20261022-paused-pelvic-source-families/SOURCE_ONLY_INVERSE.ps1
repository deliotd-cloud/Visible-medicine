# Read-only, explicit inverse of the two staged proposals. No website code runs.
$ErrorActionPreference = 'Stop'
$stage = Split-Path -Parent $PSCommandPath

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

function Check-Inverse {
  param([string]$Name, [scriptblock]$Undo)
  $proposal = [IO.File]::ReadAllBytes((Join-Path $stage $Name))
  $preimage = [IO.File]::ReadAllBytes((Join-Path $stage ($Name -replace '\.mjs$', '.preimage.bin')))
  $text = [Text.UTF8Encoding]::new($false, $true).GetString($proposal)
  if ($text.Contains("`n") -and ($text -replace "`r`n", '').Contains("`n")) { throw "Non-CRLF proposal: $Name" }
  $script:lines = [regex]::Split($text, "`r`n")
  & $Undo
  $reconstructed = [Text.UTF8Encoding]::new($false).GetBytes(($script:lines -join "`r`n"))
  $expectedHash = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($preimage)).ToLowerInvariant()
  $actualHash = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($reconstructed)).ToLowerInvariant()
  if ($reconstructed.Length -ne $preimage.Length -or $actualHash -cne $expectedHash) { throw "Inverse mismatch: $Name" }
  Write-Output "$Name inverse=PASS bytes=$($preimage.Length) sha256=$actualHash"
}

Check-Inverse 'atlas-paused-tour-imaging-checks.mjs' {
  Replace-UniqueBlock "  const inventory=JSON.parse(readFileSync('lib/atlas-model-inventory.json'));" 0 1 @()
  Replace-UniqueBlock '    const runtimeSource=pin.runtimeSources[name];' 0 6 @('    assert.equal(manifest.sourceCommit,pin.source,name);')
  $oldSource = @'
      const source=execFileSync('git',['show',`${pin.source}:${input.path}`],{cwd:atlasSource,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
'@
  $newSource = @'
      const source=execFileSync('git',['show',`${runtimeSource}:${input.path}`],{cwd:atlasSource,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
'@
  Replace-UniqueBlock $newSource 0 1 @($oldSource)
  Replace-UniqueBlock '    for(const file of manifest.files.filter(file=>/(?:^|\/)(?:LICENSE(?:S)?(?:\/|$)|[^/]*NOTICE[^/]*)/i.test(file.path)))' 0 2 @()
}

Check-Inverse 'atlas-pelvic-reproductive-core-checks.mjs' {
  Replace-UniqueBlock "import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';" 0 1 @("import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';")
  Replace-UniqueBlock "const atlas = currentAtlasDeliveryRoot(), currentPin = validateCurrentAtlasDelivery(), currentReview = liveJson('atlas-review/manifest.json');" 0 1 @("const atlas = currentAtlasDeliveryRoot(), currentReview = liveJson('atlas-review/manifest.json');")
  Replace-UniqueBlock 'assert.equal(currentPin.source, CURRENT_ATLAS_REVISION);' 0 1 @()
  Replace-UniqueBlock '  const runtimeSource = currentPin.runtimeSources[name];' 0 6 @('  assert.equal(manifest.sourceCommit, CURRENT_ATLAS_REVISION);')
  $oldInputs = @'
  for (const path of addedPaths) assert.equal(inputs.find(file => file.path === path)?.sha256, currentReview.files.find(file => file.path === path)?.sourceSha256, `${name}:${path}`);
'@
  $newInput = @'
    const runtimeInput = execFileSync('git', ['show', `${runtimeSource}:${path}`], {...gitOptions, cwd: atlas});
'@
  Replace-UniqueBlock $newInput -3 9 @($oldInputs)
}
