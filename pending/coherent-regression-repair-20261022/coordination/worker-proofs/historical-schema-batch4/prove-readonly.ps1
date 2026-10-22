# Read-only, text-only proof. No proposal generation, native execution, or writes.
$ErrorActionPreference = 'Stop'
$base = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = 'F:\VisibleMedicine\staging\20261022-review-recovery-website-candidate\website'
$validator = './fixtures/closed56-validator/tests/current-atlas-delivery.mjs'
$validatorHash = 'dfcce9763cba89e6d94f6e7e75ceb59f79ca73ac0d6056552bbe00139e804d62'
$rows = @(
  @('atlas-intracranial-arterial-ultrasound.test.mjs','ea5d9ff5c989be5eb5b4ddb211487fb0e594754339c214acde5da6f99974279b','34c72bc49fd71233b055340cecf3b81bd423bac6291aad0d66d56d6a64374c32'),
  @('shoulder-us-history-contract.test.mjs','e47cb8ccdde8a51e3955c1c9eb520bafb2db95d504163d7e469d829cc46dd771','d7588b2dad7da761751c5386c5a18da2bb3020edf6ce30ef2624fa8dc94957b2'),
  @('clinical-review-orbital-check-evidence.test.mjs','781cbf5f36bfe0eb902703f2f0195f2c0d11feb6b83b5f27a73b36faba2d25eb','61cac60df80a619c841bb4c8db2458b0ebe57a688ef1dceff72ea505c25ac6e1'),
  @('orbital-mri-delivery-transition.test.mjs','37ec90efd4ae774d7df4513b0cbdf59df795d5140c2543bba7d8c677ef21ae83','5fc10db664c5d5040930a607d18d130747b62f56be314980af92c00793e2ef23'),
  @('historical-deep-plantar-delivery-49.mjs','343b14a4d467135892e71ed83695f0fa1b1691c1a2c92e2fe8f4bdf0c8b0e7b9','1b251e7f7b6f10fdf2b5ac8c10d16fe789943eb37a01a9f8f75027b0efc39de7'),
  @('historical-lacrimal-delivery-50.mjs','7cc5f18105c2388b4dce7b2fdf0795c70dbac1e6d5f1f166dd1ff36d84ba9201','f35a2b9bf55be9ec8e3bbe605f61eac3c9e1ac25f80b21eca7991753304eb3dd'),
  @('historical-radial-eus-delivery-51.mjs','514853f2472efa783c9fa3a0401f5aba632675a14367b20200eac745f1d5bc08','eb6f46cc03c1075cd07a81d97797be389b294e7e91732029438deb9fbae53501'),
  @('historical-native-head-history-delivery-52.mjs','4099a2fcd7fea4051cfed4285c16e6db0249d199f814b54d9e71b149d6d9a531','78b849664d237d1cd14367d306b34b8e6c5b73241252cb0f42a63fea17cc1b7c'),
  @('historical-head-manual-recovery-delivery-53.mjs','92388db10cc70f47fa87223cd7763cdec10d16995013fc0719ce23e325c9f352','8c269f7c74564b61da647dd160a174d159dfce51f35723c0a1d7f50d41464fc5'),
  @('historical-head-mask-epoch.mjs','0dcb1ec84ffaef70f64c2d785e2898894a1b01bfab90300488cf5ecfe603ed2a','0cee4bd332e3fd63c0d641123c5b8bdd8cd1815c6b79da34934390903807ecfd')
)
$utf8 = [Text.UTF8Encoding]::new($false,$true)
function Hash([byte[]]$bytes) { [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant() }
function Undo-One([string]$text,[string]$edited,[string]$original,[string]$name) {
  $first=$text.IndexOf($edited,[StringComparison]::Ordinal)
  if($first -lt 0 -or $text.IndexOf($edited,$first+$edited.Length,[StringComparison]::Ordinal) -ge 0) { throw "Inverse anchor not unique: $name : $edited" }
  $text.Substring(0,$first)+$original+$text.Substring($first+$edited.Length)
}
function TestNames([string]$text) {
  @([regex]::Matches($text,'(?m)^\s*test\(([''\"])(.*?)\1') | ForEach-Object { $_.Groups[2].Value })
}
$validatorBytes=[IO.File]::ReadAllBytes((Join-Path $source 'tests/fixtures/closed56-validator/tests/current-atlas-delivery.mjs'))
if((Hash $validatorBytes) -ne $validatorHash) { throw 'Frozen validator hash changed' }
$frozenImport="import {validateCurrentAtlasDelivery as validateHistoricalAtlasDelivery} from '$validator';"
$liveImport="import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';"
for($i=0;$i -lt $rows.Count;$i++) {
  $name,$beforeHash,$afterHash=$rows[$i]
  $originalBytes=[IO.File]::ReadAllBytes((Join-Path $source ('tests/'+$name)))
  $preimageBytes=[IO.File]::ReadAllBytes((Join-Path $base ('preimages/tests/'+$name)))
  $proposalBytes=[IO.File]::ReadAllBytes((Join-Path $base ('proposals/tests/'+$name)))
  if((Hash $originalBytes) -ne $beforeHash -or (Hash $preimageBytes) -ne $beforeHash -or (Hash $proposalBytes) -ne $afterHash) { throw "Hash mismatch: $name" }
  if($originalBytes.Length -ne $preimageBytes.Length) { throw "Preimage length mismatch: $name" }
  for($j=0;$j -lt $originalBytes.Length;$j++){if($originalBytes[$j] -ne $preimageBytes[$j]){throw "Preimage byte mismatch: $name at $j"}}
  $original=$utf8.GetString($originalBytes);$proposal=$utf8.GetString($proposalBytes)
  $eol=if($original.Contains("`r`n")){"`r`n"}else{"`n"}
  if($original.Contains("`r`n") -ne $proposal.Contains("`r`n") -or $original.Contains("`n") -ne $proposal.Contains("`n")) { throw "EOL style mismatch: $name" }
  $oldNames=TestNames $original;$newNames=TestNames $proposal
  if($oldNames.Count -ne $newNames.Count -or (($oldNames -join [char]0) -cne ($newNames -join [char]0))) { throw "Test names changed: $name" }
  $witness="assert.equal(sha(readFileSync(new URL('$validator',import.meta.url))),'$validatorHash','Frozen schema1 validator changed');"
  if($i -eq 9){$witness=$witness.Replace('sha(readFileSync(','sha(fs.readFileSync(')}
  $indent=if($i -eq 1){'  '}elseif($i -eq 2 -or $i -eq 3 -or $i -eq 9){' '}else{''}
  $inverse=Undo-One $proposal ($indent+$witness+$eol) '' $name
  switch($i) {
    0 {
      $inverse=Undo-One $inverse 'const pin = validateHistoricalAtlasDelivery({pin: historicalPin, read: historicalRead});' 'const pin = validateCurrentAtlasDelivery({pin: historicalPin, read: historicalRead});' $name
      $import="import {CURRENT_ATLAS_REVISION, currentAtlasDeliveryRoot, validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';"
      $inverse=Undo-One $inverse ($import+$eol+$frozenImport) $import $name
    }
    1 {
      $inverse=Undo-One $inverse '  validateHistoricalAtlasDelivery({pin, read: historicalRead});' '  validateCurrentAtlasDelivery({pin, read: historicalRead});' $name
      $import="import {validateCurrentAtlasDelivery, currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';"
      $inverse=Undo-One $inverse ($import+$eol+$frozenImport) $import $name
    }
    2 {
      $inverse=Undo-One $inverse 'assert.equal(validateHistoricalAtlasDelivery({pin:closedPin,read:readClosed}).source,introduction);' 'assert.equal(validateCurrentAtlasDelivery({pin:closedPin,read:readClosed}).source,introduction);' $name
      $inverse=Undo-One $inverse ($liveImport+$eol+$frozenImport) $liveImport $name
    }
    3 {
      $inverse=Undo-One $inverse 'assert.throws(()=>validateHistoricalAtlasDelivery({pin:beforePin,read:readClosed}),/Current delivery changed:/);' 'assert.throws(()=>validateCurrentAtlasDelivery({pin:beforePin,read:readClosed}),/Current delivery changed:/);' $name
      $inverse=Undo-One $inverse 'const current=validateHistoricalAtlasDelivery({pin:closedPin,read:readClosed});' 'const current=validateCurrentAtlasDelivery({pin:closedPin,read:readClosed});' $name
      $inverse=Undo-One $inverse 'const current=closedChecklist,pin=validateHistoricalAtlasDelivery({pin:closedPin,read:readClosed});' 'const current=closedChecklist,pin=validateCurrentAtlasDelivery({pin:closedPin,read:readClosed});' $name
      $inverse=Undo-One $inverse ($liveImport+$eol+$frozenImport) $liveImport $name
    }
    {$_ -ge 4 -and $_ -le 8} {
      $inverse=Undo-One $inverse 'return validateHistoricalAtlasDelivery({pin:' 'return validateCurrentAtlasDelivery({pin:' $name
      $inverse=Undo-One $inverse $frozenImport $liveImport $name
    }
    9 {
      $inverse=Undo-One $inverse '=>validateHistoricalAtlasDelivery({...options,pin:options.pin??pin,read:readPath})' '=>validateCurrentAtlasDelivery({...options,pin:options.pin??pin,read:readPath})' $name
      $inverse=Undo-One $inverse $frozenImport $liveImport $name
    }
  }
  $inverseBytes=$utf8.GetBytes($inverse)
  if($inverseBytes.Length -ne $originalBytes.Length) { throw "Whole-original length mismatch: $name" }
  for($j=0;$j -lt $inverseBytes.Length;$j++){if($inverseBytes[$j] -ne $originalBytes[$j]){throw "Whole-original byte mismatch: $name at $j"}}
  Write-Output "PROVED $name preimage=$beforeHash proposal=$afterHash tests=$($oldNames.Count)"
}
