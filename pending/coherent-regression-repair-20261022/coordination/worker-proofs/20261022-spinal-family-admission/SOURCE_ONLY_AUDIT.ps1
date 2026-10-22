# Read-only focused audit; one Git cat-file batch for the four divergent text paths.
$ErrorActionPreference='Stop'
$website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website'
$atlas='F:/VisibleMedicine/atlas'
$pin=Get-Content -Raw -LiteralPath "$website/tests/fixtures/current-atlas-delivery.json"|ConvertFrom-Json
$inventory=Get-Content -Raw -LiteralPath "$website/lib/atlas-model-inventory.json"|ConvertFrom-Json
$priorAudit=Get-Content -Raw -LiteralPath 'F:/VisibleMedicine/staging/20261022-historic-schema-repairs-consolidated/TEXT_INPUT_AUDIT.json'|ConvertFrom-Json
function Check([bool]$yes,[string]$label){if(-not $yes){throw $label}}
function Sha([byte[]]$bytes){[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant()}
Check ($pin.source -ceq '6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1') 'Current Review source'
Check ($priorAudit.source -ceq $pin.source -and $priorAudit.familyMismatch.Count -eq 0 -and $priorAudit.unprovenCheckoutRows.Count -eq 0) 'Prior complete text audit identity'
Check ($priorAudit.auditedTextRows -eq 2874 -and $priorAudit.differingFamilyVersusCurrentRows -eq 3 -and $priorAudit.checkoutRepresentations.Count -eq 1) 'Prior complete text audit counts'
$licence='LICENSES/bodyparts3d-license-evidence.html'
$different=@('app/body-content.ts','app/body-explorer.css','content/regional-teaching/abdomen.json')
$paths=@($licence)+$different
$commits=@($pin.source,$pin.runtimeSources.shoulder)|Select-Object -Unique
$ids=[Collections.Generic.HashSet[string]]::new()
$trees=@{}
foreach($commit in $commits){
  $tree=@{}
  $lines=& git -C $atlas ls-tree -r --full-tree $commit -- $paths
  Check ($LASTEXITCODE -eq 0) "Git tree $commit"
  foreach($line in $lines){if($line -match '^(100644|100755) blob ([a-f0-9]{40})\t(.+)$'){$tree[$Matches[3]]=$Matches[2];[void]$ids.Add($Matches[2])}}
  $trees[$commit]=$tree
}
$ordered=@($ids|Sort-Object)
$info=[Diagnostics.ProcessStartInfo]::new('git')
foreach($arg in @('-C',$atlas,'cat-file','--batch')){$info.ArgumentList.Add($arg)}
$info.RedirectStandardInput=$true;$info.RedirectStandardOutput=$true;$info.UseShellExecute=$false
$info.Environment['GIT_NO_REPLACE_OBJECTS']='1'
$process=[Diagnostics.Process]::Start($info)
$memory=[IO.MemoryStream]::new()
$copy=$process.StandardOutput.BaseStream.CopyToAsync($memory)
$process.StandardInput.Write(($ordered -join "`n")+"`n");$process.StandardInput.Close()
$copy.Wait();$process.WaitForExit()
Check ($process.ExitCode -eq 0) 'Git cat-file batch'
$batch=$memory.ToArray();$offset=0;$blobs=@{}
foreach($id in $ordered){
  $end=[Array]::IndexOf($batch,[byte]10,$offset)
  Check ($end -gt $offset) "Git header $id"
  $header=[Text.Encoding]::ASCII.GetString($batch,$offset,$end-$offset)
  Check ($header -match '^([a-f0-9]{40}) blob ([0-9]+)$' -and $Matches[1] -ceq $id) "Git blob header $id"
  $length=[int]$Matches[2];$start=$end+1;$finish=$start+$length
  Check ($finish -lt $batch.Length -and $batch[$finish] -eq 10) "Git blob length $id"
  $bytes=[byte[]]::new($length);[Array]::Copy($batch,$start,$bytes,0,$length)
  $blobs[$id]=$bytes;$offset=$finish+1
}
Check ($offset -eq $batch.Length) 'Git batch fully consumed'
function Blob([string]$commit,[string]$path){$id=$trees[$commit][$path];Check (-not [string]::IsNullOrEmpty($id)) "Missing Git path $commit/$path";return $blobs[$id]}
$familyHashes=@(
  '3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2',
  '9834c72543476b41ba5acb5a47427dced3596d56320c59502d91f9e9e2524dca',
  '19f318f4d3e342ee0f1b68c7232cbf9249e828fa9802d264a20f0aa6cd9eaff0')
$currentHashes=@(
  '26320b064b5648f4f5b6ca8c123806a02dedefb761b894935707559d530882fc',
  '9722246697fafcd54f55e586797eaec33930c5f3f87d653117b064787ebe2904',
  '214bed8b53ed3db2b6ea81ed61028ff1b5f4520afb5a02c38850811189a5dd67')
for($i=0;$i -lt $different.Count;$i++){
  $path=$different[$i]
  Check ((Sha (Blob $pin.runtimeSources.shoulder $path)) -ceq $familyHashes[$i]) "Shoulder Git $path"
  Check ((Sha (Blob $pin.source $path)) -ceq $currentHashes[$i]) "Current Git $path"
  Check ((Sha ([IO.File]::ReadAllBytes("$atlas/$path"))) -ceq $currentHashes[$i]) "Checkout $path"
}
$committed=Blob $pin.source $licence
$working=[IO.File]::ReadAllBytes("$atlas/$licence")
Check ($committed.Length -eq 14682 -and (Sha $committed) -ceq '7a873d9c6ed62578a7ee5603d68d6a8fbf6e3ccc0b52db6a3ad8b952f8cf7271') 'Committed licence evidence'
Check ($working.Length -eq 14694 -and (Sha $working) -ceq '90dea95329aea5015ce339e430d9f342090617c82ee48613e15dd2240f08b746') 'Checkout licence evidence'
$utf8=[Text.UTF8Encoding]::new($false,$true);$text=$utf8.GetString($working)
Check (($text -replace "`r`n", "`n") -ceq $utf8.GetString($committed) -and ([regex]::Matches($text,"`r`n")).Count -eq 12) 'Exact 12-CRLF inverse'
$notices=0
foreach($region in @('head-neck','shoulder','lower-limb','female-pelvis')){
  $base="public/atlas-runtime/$region/"
  $manifestBytes=[IO.File]::ReadAllBytes("$website/$base/manifest.json")
  $manifest=[Text.Encoding]::UTF8.GetString($manifestBytes)|ConvertFrom-Json
  $row=@($inventory.sources|Where-Object{$_.module -ceq $region})
  Check ($row.Count -eq 1 -and $row[0].sourceCommit -ceq $pin.runtimeSources.$region -and $row[0].manifestSha256 -ceq (Sha $manifestBytes)) "$region family inventory"
  Check ($manifest.sourceCommit -ceq $pin.runtimeSources.$region) "$region manifest source"
  foreach($file in @($manifest.files|Where-Object{$_.path -match '(?i)(?:^|/)(?:LICENSE(?:S)?(?:/|$)|[^/]*NOTICE[^/]*)'})){
    Check ((Sha ([IO.File]::ReadAllBytes("$website/$base/$($file.path)"))) -ceq $file.sha256) "$region notice $($file.path)"
    $notices++
  }
}
Write-Output "source-only audit PASS familyInputs=2874 distinctShoulder=3 licenceCRLF=12 notices=$notices gitBatchBlobs=$($ordered.Count)"
