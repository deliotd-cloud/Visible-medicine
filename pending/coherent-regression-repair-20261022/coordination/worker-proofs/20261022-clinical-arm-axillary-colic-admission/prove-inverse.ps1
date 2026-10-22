$ErrorActionPreference='Stop'
$stage='F:/VisibleMedicine/staging/20261022-clinical-arm-axillary-colic-admission'
$site='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website'
$utf=New-Object System.Text.UTF8Encoding($false,$true)
$nl=[string][char]10
function Undo([string]$text,[string]$new,[string]$old,[string]$label){
  $count=([regex]::Matches($text,[regex]::Escape($new))).Count
  if($count -ne 1){throw "$label has $count occurrences, expected exactly one"}
  return $text.Replace($new,$old)
}
foreach($name in @('clinical-review-arm-arterial-xray.test.ts','clinical-review-axillary-branch-xray.test.ts','clinical-review-colic-arterial-xray.test.ts')){
  $proposal=[System.IO.File]::ReadAllBytes("$stage/proposal/tests/$name")
  $original=[System.IO.File]::ReadAllBytes("$stage/original/tests/$name")
  $frozen=[System.IO.File]::ReadAllBytes("$site/tests/$name")
  $text=$utf.GetString($proposal)
  $text=Undo $text "import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';" "import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';" 'import'
  if($name -eq 'clinical-review-colic-arterial-xray.test.ts'){
    $add='  const admission=validateCurrentAtlasDelivery();'+$nl+'  assert.equal(admission.source,liveCommit);'+$nl
    $text=Undo $text $add '' 'admission'
    $text=Undo $text 'assert.equal(manifest.sourceCommit,admission.runtimeSources[name],name);' 'assert.equal(manifest.sourceCommit,revision,name);' 'manifest'
  }else{
    $add=' const admission=validateCurrentAtlasDelivery();'+$nl+' assert.equal(admission.source,liveCommit);'+$nl
    $text=Undo $text $add '' 'admission'
    $text=Undo $text 'assert.equal(manifest.sourceCommit,admission.runtimeSources[name],name);' 'assert.equal(manifest.sourceCommit,liveCommit,name);' 'manifest'
    if($name -eq 'clinical-review-arm-arterial-xray.test.ts'){
      $new='if(name===''head-neck''||name===''shoulder'')'+$nl+'    assert.equal(input?.sha256,sha(committed(admission.runtimeSources[name],path)),`${name}: ${path}`);'
      $old='if(name===''head-neck''||name===''shoulder'')assert.equal(input?.sha256,digest,`${name}: ${path}`);'
      $text=Undo $text $new $old 'family input'
      $new='assert.equal(input.sha256,sha(committed(admission.runtimeSources[name],input.path)),'+$nl+'    `${name}: admitted family exact source ${input.path}`);'
      $old='assert.equal(input.sha256,sha(committed(liveCommit,input.path)),`${name}: current exact source ${input.path}`);'
      $text=Undo $text $new $old 'full family inputs'
    }else{
      $new='if(inLearner)assert.equal(input?.sha256,'+$nl+'    sha(committed(admission.runtimeSources[name],path)),`${name}: ${path}`);'
      $old='if(inLearner)assert.equal(input?.sha256,sha(original),`${name}: ${path}`);'
      $text=Undo $text $new $old 'family input'
    }
  }
  $reconstructed=$utf.GetBytes($text)
  if(-not [System.Linq.Enumerable]::SequenceEqual([byte[]]$reconstructed,[byte[]]$original)){throw "$name complete original inverse failed"}
  if(-not [System.Linq.Enumerable]::SequenceEqual([byte[]]$original,[byte[]]$frozen)){throw "$name frozen differs from raw preimage"}
  $before=(Get-FileHash -Algorithm SHA256 -LiteralPath "$stage/original/tests/$name").Hash.ToLower()
  $after=(Get-FileHash -Algorithm SHA256 -LiteralPath "$stage/proposal/tests/$name").Hash.ToLower()
  Write-Output "$name complete inverse and frozen equality passed $before -> $after"
}
