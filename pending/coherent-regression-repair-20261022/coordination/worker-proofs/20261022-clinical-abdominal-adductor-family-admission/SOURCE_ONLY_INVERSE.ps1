# Read-only unique-block inverse to both entire original LF byte streams.
$ErrorActionPreference='Stop'
$stage=Split-Path -Parent $PSCommandPath
function Replace-UniqueBlock([string]$anchor,[int]$offset,[int]$count,[string[]]$original){
 $hits=@(for($i=0;$i -lt $script:lines.Length;$i++){if($script:lines[$i] -ceq $anchor){$i}})
 if($hits.Count -ne 1){throw "Inverse anchor count $($hits.Count): $anchor"}
 $start=$hits[0]+$offset
 if($start -lt 0 -or $start+$count -ge $script:lines.Length){throw "Inverse range: $anchor"}
 $script:lines=@($script:lines[0..($start-1)])+$original+@($script:lines[($start+$count)..($script:lines.Length-1)])
}
function Check-Inverse([string]$name,[scriptblock]$undo){
 $proposal=[IO.File]::ReadAllBytes((Join-Path $stage $name))
 $preimage=[IO.File]::ReadAllBytes((Join-Path $stage ($name+'.preimage.bin')))
 $text=[Text.UTF8Encoding]::new($false,$true).GetString($proposal)
 if($text.Contains("`r")){throw "Unexpected CR: $name"}
 $script:lines=[regex]::Split($text,"`n")
 & $undo
 $reconstructed=[Text.UTF8Encoding]::new($false).GetBytes(($script:lines -join "`n"))
 $expected=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($preimage)).ToLowerInvariant()
 $actual=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($reconstructed)).ToLowerInvariant()
 if($reconstructed.Length -ne $preimage.Length -or $actual -cne $expected){throw "Inverse mismatch: $name"}
 Write-Output "$name inverse=PASS bytes=$($preimage.Length) sha256=$actual"
}
Check-Inverse 'clinical-review-abdominal-detail-xray.test.ts' {
 Replace-UniqueBlock "import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';" 0 1 @("import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';")
 Replace-UniqueBlock 'const currentPin=validateCurrentAtlasDelivery();' 0 1 @()
 Replace-UniqueBlock '  assert.equal(revision,currentPin.source);' 0 1 @()
 $oldLoop=@'
  for(const {name,manifest:built} of learners){
    assert.equal(built.sourceCommit,revision,name);
    assert.equal(built.patientDataIncluded,false,name);
    assert.equal(built.clinicalApproved,false,name);
  }
'@
 Replace-UniqueBlock "  const inventory=json('lib/atlas-model-inventory.json');" 0 17 @($oldLoop -split "`n")
}
Check-Inverse 'clinical-review-adductor-longus-xray.test.ts' {
 Replace-UniqueBlock "import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';" 0 1 @("import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';")
 Replace-UniqueBlock 'const currentPin=validateCurrentAtlasDelivery();' 0 1 @()
 Replace-UniqueBlock ' assert.equal(currentPin.source,liveCommit);' 0 1 @()
 $oldLoop=@'
 for(const {name,manifest} of learners){
  assert.equal(manifest.sourceCommit,liveCommit,name);
  assert.equal(manifest.patientDataIncluded,false,name);
  assert.equal(manifest.clinicalApproved,false,name);
 }
'@
 Replace-UniqueBlock " const inventory=json('lib/atlas-model-inventory.json');" 0 13 @($oldLoop -split "`n")
 $oldInput=@'
   if(name==='head-neck'||name==='shoulder')assert.equal(input?.sha256,digest,`${name}: ${path}`);
   else assert.equal(input,undefined,`${name}: independent closure`);
'@
 Replace-UniqueBlock "   if(name==='head-neck'||name==='shoulder'){" 0 6 @($oldInput -split "`n")
 $newFull=@'
   assert.equal(input.sha256,sha(committed(currentPin.runtimeSources[name],input.path)),`${name}: ${input.path}`);
'@
 $oldFull=@'
   assert.equal(input.sha256,sha(committed(liveCommit,input.path)),`${name}: ${input.path}`);
'@
 Replace-UniqueBlock $newFull 0 1 @($oldFull)
}
