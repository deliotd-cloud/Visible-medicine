# Read-only explicit, unique inverse for each staged full-file proposal.
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
  $preimage = [IO.File]::ReadAllBytes((Join-Path $stage ($Name + '.preimage.bin')))
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

Check-Inverse 'atlas-thoracoabdominal-quiz-checks.mjs' {
  Replace-UniqueBlock "import {currentAtlasDeliveryRoot,CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';" 0 1 @("import {currentAtlasDeliveryRoot,CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';")
  Replace-UniqueBlock 'const currentPin = validateCurrentAtlasDelivery();' 0 1 @()
  Replace-UniqueBlock 'assert.equal(currentPin.source, CURRENT_ATLAS_REVISION);' 0 1 @()
  Replace-UniqueBlock '  const runtimeSource = currentPin.runtimeSources[name];' 0 6 @('  assert.equal(manifest.sourceCommit, CURRENT_ATLAS_REVISION);')
  $oldInput = @'
  for (const path of addedPaths) assert.equal(inputs.find(file => file.path === path)?.sha256, currentReview.files.find(file => file.path === path).sourceSha256, `${name}:${path}`);
'@
  $bodyAnchor = @'
  const bodyPath = 'app/body-content.ts', bodyInput = inputs.find(file => file.path === bodyPath);
'@
  Replace-UniqueBlock $bodyAnchor -7 17 @($oldInput)
}

Check-Inverse 'atlas-tour-reflow.test.ts' {
  Replace-UniqueBlock ' const atlasRoot=currentAtlasDeliveryRoot();' 0 1 @()
  $newSource = @'
 const source=execFileSync('git',['show',pin.source+':'+path],{encoding:null,cwd:atlasRoot,maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
'@
  $oldSource = @'
 const source=execFileSync('git',['show',pin.source+':'+path],{encoding:null,cwd:currentAtlasDeliveryRoot(),maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
'@
  Replace-UniqueBlock $newSource 0 1 @($oldSource)
  $newComponent = @'
 const componentSource=execFileSync('git',['show',pin.source+':'+componentPath],{encoding:null,cwd:atlasRoot,maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
'@
  $oldComponent = @'
 const componentSource=execFileSync('git',['show',pin.source+':'+componentPath],{encoding:null,cwd:currentAtlasDeliveryRoot(),maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
'@
  Replace-UniqueBlock $newComponent 0 1 @($oldComponent)
  Replace-UniqueBlock '  const runtimeSource=pin.runtimeSources[module];' 0 6 @('  assert.equal(manifest.sourceCommit,pin.source,module);')
  $componentInput = @'
  if(module==='head-neck')assert.deepEqual(inputs.filter((row:any)=>row.path===componentPath),[{path:componentPath,sha256:sha(componentSource)}]);
'@
  Replace-UniqueBlock $componentInput 0 4 @()
}
