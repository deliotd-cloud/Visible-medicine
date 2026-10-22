# Read-only selected text Git/source-input and raw notice audit. No website code runs.
$ErrorActionPreference='Stop'
$website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website'
$atlas='F:/VisibleMedicine/atlas'
$pin=Get-Content -Raw -LiteralPath "$website/tests/fixtures/current-atlas-delivery.json"|ConvertFrom-Json
$review=Get-Content -Raw -LiteralPath "$website/atlas-review/manifest.json"|ConvertFrom-Json
$viewer=Get-Content -Raw -LiteralPath "$website/public/atlas-review-viewer/manifest.json"|ConvertFrom-Json
$inventory=Get-Content -Raw -LiteralPath "$website/lib/atlas-model-inventory.json"|ConvertFrom-Json
$priorAudit=Get-Content -Raw -LiteralPath 'F:/VisibleMedicine/staging/20261022-historic-schema-repairs-consolidated/TEXT_INPUT_AUDIT.json'|ConvertFrom-Json
function Check([bool]$yes,[string]$label){if(-not $yes){throw $label}}
function Sha([byte[]]$bytes){[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant()}
function Exact-GitBytes([string]$revision,[string]$path){
 $info=[Diagnostics.ProcessStartInfo]::new('git')
 $info.WorkingDirectory=$atlas;$info.UseShellExecute=$false
 $info.RedirectStandardOutput=$true;$info.RedirectStandardError=$true
 $info.Environment['GIT_NO_REPLACE_OBJECTS']='1'
 $info.ArgumentList.Add('show');$info.ArgumentList.Add("${revision}:$path")
 $process=[Diagnostics.Process]::Start($info)
 $memory=[IO.MemoryStream]::new();$process.StandardOutput.BaseStream.CopyTo($memory)
 $errorText=$process.StandardError.ReadToEnd();$process.WaitForExit()
 Check ($process.ExitCode -eq 0) "git show $revision`:$path $errorText"
 return $memory.ToArray()
}
Check ($pin.source -ceq '6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1') 'Current pin'
Check ($review.revision -ceq $pin.source -and $viewer.sourceCommit -ceq $pin.source) 'Review/viewer source'
Check ($priorAudit.source -ceq $pin.source -and $priorAudit.auditedTextRows -eq 2874 -and $priorAudit.familyMismatch.Count -eq 0 -and $priorAudit.unprovenCheckoutRows.Count -eq 0) 'Complete source-text audit identity'
$selected=@(
 'app/body-content.ts','content/abdominal-branch-imaging-pins.json','content/abdominal-connective-quiz-pins.json',
 'content/gastric-venous-xray.ts','lib/gastric-venous-xray.ts',
 'content/abdominal-detail-vascular-xray.ts','content/abdominal-detail-connective-xray.ts','lib/abdominal-detail-xray.ts',
 'content/hip-imaging-pins.json','lib/adductor-longus-xray.ts')
$inputsChecked=0;$noticesChecked=0;$shoulderBodyDistinct=$false
foreach($name in @('head-neck','female-pelvis','lower-limb','shoulder')){
 $base="public/atlas-runtime/$name/"
 $manifestBytes=[IO.File]::ReadAllBytes("$website/$base/manifest.json")
 $manifest=[Text.Encoding]::UTF8.GetString($manifestBytes)|ConvertFrom-Json
 $sourceInputs=Get-Content -Raw -LiteralPath "$website/$base/source-inputs.json"|ConvertFrom-Json
 $family=$pin.runtimeSources.$name
 $row=@($inventory.sources|Where-Object{$_.module -ceq $name})
 Check ($manifest.sourceCommit -ceq $family) "$name runtime source"
 Check ($row.Count -eq 1 -and $row[0].sourceCommit -ceq $family -and $row[0].manifestSha256 -ceq (Sha $manifestBytes)) "$name inventory"
 foreach($sourceRow in @($sourceInputs|Where-Object{$_.path -in $selected})){
  $familyHash=Sha (Exact-GitBytes $family $sourceRow.path)
  Check ($sourceRow.sha256 -ceq $familyHash) "$name family input $($sourceRow.path)"
  $reviewRow=@($review.files|Where-Object{$_.path -ceq $sourceRow.path})
  Check ($reviewRow.Count -eq 1) "Review input $($sourceRow.path)"
  if($name -ceq 'shoulder' -and $sourceRow.path -ceq 'app/body-content.ts'){
   Check ($sourceRow.sha256 -cne $reviewRow[0].sourceSha256) 'Distinct shoulder body source'
   $shoulderBodyDistinct=$true
  }else{Check ($sourceRow.sha256 -ceq $reviewRow[0].sourceSha256) "$name shared Review source $($sourceRow.path)"}
  $inputsChecked++
 }
 foreach($file in @($manifest.files|Where-Object{$_.path -match '(?i)(?:^|/)(?:LICENSE(?:S)?(?:/|$)|[^/]*NOTICE[^/]*)'})){
  Check ((Sha ([IO.File]::ReadAllBytes("$website/$base/$($file.path)"))) -ceq $file.sha256) "$name notice $($file.path)"
  $noticesChecked++
 }
}
Check $shoulderBodyDistinct 'Shoulder body distinction visited'
Write-Output "source-only audit PASS familyInputs=$inputsChecked shoulderBodyDistinct=true notices=$noticesChecked priorTextRows=2874"
