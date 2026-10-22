# Read-only unique-block inverse of both staged files, in memory, to entire original bytes.
$ErrorActionPreference='Stop'
$stage=Split-Path -Parent $PSCommandPath
function Replace-UniqueBlock {
  param([string]$Anchor,[int]$Offset,[int]$Count,[string[]]$Original)
  $hits=@(for($i=0;$i -lt $script:lines.Length;$i++){if($script:lines[$i] -ceq $Anchor){$i}})
  if($hits.Count -ne 1){throw "Inverse anchor count $($hits.Count): $Anchor"}
  $start=$hits[0]+$Offset
  if($start -lt 0 -or $start+$Count -ge $script:lines.Length){throw "Inverse range: $Anchor"}
  $script:lines=@($script:lines[0..($start-1)])+$Original+@($script:lines[($start+$Count)..($script:lines.Length-1)])
}
function Check-Inverse([string]$name,[scriptblock]$undo){
  $proposal=[IO.File]::ReadAllBytes((Join-Path $stage $name))
  $preimage=[IO.File]::ReadAllBytes((Join-Path $stage ($name+'.preimage.bin')))
  $text=[Text.UTF8Encoding]::new($false,$true).GetString($proposal)
  if($text.Contains("`r")){throw "Unexpected CR in $name"}
  $script:lines=[regex]::Split($text,"`n")
  & $undo
  $reconstructed=[Text.UTF8Encoding]::new($false).GetBytes(($script:lines -join "`n"))
  $expected=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($preimage)).ToLowerInvariant()
  $actual=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($reconstructed)).ToLowerInvariant()
  if($reconstructed.Length -ne $preimage.Length -or $actual -cne $expected){throw "Inverse mismatch: $name"}
  Write-Output "$name inverse=PASS bytes=$($preimage.Length) sha256=$actual"
}
Check-Inverse 'atlas-spinal-disc-function.test.ts' {
  Replace-UniqueBlock '  const pin=validateCurrentAtlasDelivery();' 0 2 @()
  Replace-UniqueBlock "    shoulder:{sha256:pin.documents['public/atlas-runtime/shoulder/manifest.json'],modelPaths:1}," 0 1 @("    shoulder:{sha256:validateCurrentAtlasDelivery().documents['public/atlas-runtime/shoulder/manifest.json'],modelPaths:1},")
  Replace-UniqueBlock "    'female-pelvis':{sha256:pin.documents['public/atlas-runtime/female-pelvis/manifest.json'],modelPaths:2}," 0 1 @("    'female-pelvis':{sha256:validateCurrentAtlasDelivery().documents['public/atlas-runtime/female-pelvis/manifest.json'],modelPaths:2},")
  Replace-UniqueBlock "    'lower-limb':{sha256:pin.documents['public/atlas-runtime/lower-limb/manifest.json'],modelPaths:5}," 0 1 @("    'lower-limb':{sha256:validateCurrentAtlasDelivery().documents['public/atlas-runtime/lower-limb/manifest.json'],modelPaths:5},")
  Replace-UniqueBlock '    assert.equal(source.sourceCommit,pin.runtimeSources[source.module],source.module);' 0 1 @('    assert.equal(source.sourceCommit,currentSource,source.module);')
  Replace-UniqueBlock '    assert.equal(manifest.sourceCommit,pin.runtimeSources[source.module],source.module);' 0 1 @('    assert.equal(manifest.sourceCommit,currentSource,source.module);')
}
Check-Inverse 'atlas-spinal-muscle-xray.test.mjs' {
  Replace-UniqueBlock 'const shoulderFamilyDifferences = new Map([' 0 8 @()
  Replace-UniqueBlock 'for (const family of new Set(Object.values(currentPin.runtimeSources)))' 0 2 @()
  Replace-UniqueBlock '  const paths = regions.filter(region => currentPin.runtimeSources[region] === family)' -2 6 @()
  Replace-UniqueBlock '    const runtimeSource = currentPin.runtimeSources[region];' 0 2 @('    assert.equal(manifest.sourceCommit, source.source, `${region} source`);')
  $oldInput=@'
      const committed = blob(source.source, input.path);
      if (!working.equals(committed)) {
        assert.ok(!working.includes(0) && !committed.includes(0));
        assert.ok(working.includes(Buffer.from('\r\n')));
        assert.ok(Buffer.from(working.toString('utf8').replaceAll('\r\n', '\n')).equals(committed));
      }
      assert.equal(input.sha256, sha(working), `${region} source input ${input.path}`);
'@
  Replace-UniqueBlock '      const committed = blob(runtimeSource, input.path);' 0 24 @($oldInput -split "`n")
}
