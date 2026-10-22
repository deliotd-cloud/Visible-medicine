# Read-only mechanical audit of admitted runtime source-input text rows.
$ErrorActionPreference = 'Stop'
$website = 'F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website'
$atlas = 'F:/VisibleMedicine/atlas'
$pin = Get-Content -Raw -LiteralPath "$website/tests/fixtures/current-atlas-delivery.json" | ConvertFrom-Json
$sha = [Security.Cryptography.SHA256]::Create()
function Sha256([byte[]]$bytes) { [Convert]::ToHexString($sha.ComputeHash($bytes)).ToLowerInvariant() }
function EqualBytes([byte[]]$a, [byte[]]$b) {
  if ($a.Length -ne $b.Length) { return $false }
  for ($i=0; $i -lt $a.Length; $i++) { if ($a[$i] -ne $b[$i]) { return $false } }
  return $true
}
$families = @('head-neck','shoulder','lower-limb','female-pelvis')
$rows = [Collections.Generic.List[object]]::new()
$excluded = [Collections.Generic.List[object]]::new()
$manifestCounts = @{}
foreach ($region in $families) {
  $base = "public/atlas-runtime/$region/"
  foreach ($name in @('manifest.json','source-inputs.json')) {
    $path = $base+$name
    $actual = Sha256 ([IO.File]::ReadAllBytes("$website/$path"))
    if ($actual -ne $pin.documents.$path) { throw "Pinned document changed: $path" }
  }
  $manifest = Get-Content -Raw -LiteralPath "$website/$base/manifest.json" | ConvertFrom-Json
  $familySource = $pin.runtimeSources.$region
  if ($manifest.sourceCommit -ne $familySource) { throw "Manifest source mismatch: $region" }
  $inputs = Get-Content -Raw -LiteralPath "$website/$base/source-inputs.json" | ConvertFrom-Json
  $manifestCounts[$region] = $inputs.Count
  foreach ($input in $inputs) {
    $ext = [IO.Path]::GetExtension($input.path).ToLowerInvariant()
    if ($ext -eq '.png' -or $ext -eq '.glb' -or $ext -eq '.nrrd' -or $ext -eq '.nii' -or $ext -eq '.gz') {
      $excluded.Add([pscustomobject]@{region=$region;path=$input.path;extension=$ext})
      continue
    }
    if ($ext -notin @('.ts','.tsx','.json','.css','.mjs','.html','.md','.txt','') -or
        ($ext -eq '' -and $input.path -ne 'LICENSE')) { throw "Unclassified input: $region/$($input.path)" }
    $rows.Add([pscustomobject]@{region=$region;path=$input.path;declared=$input.sha256;family=$familySource})
  }
}
$trees = @{}
foreach ($commit in @($pin.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9')) {
  if ($trees.ContainsKey($commit)) { continue }
  $tree = @{}
  foreach ($line in (& git -C $atlas ls-tree -r --full-tree $commit)) {
    if ($line -match '^(100644|100755) blob ([a-f0-9]{40})\t(.+)$') { $tree[$Matches[3]]=$Matches[2] }
  }
  if ($LASTEXITCODE -ne 0) { throw "Git tree read failed: $commit" }
  $trees[$commit]=$tree
}
$ids = [Collections.Generic.HashSet[string]]::new()
foreach ($row in $rows) {
  foreach ($commit in @($row.family,$pin.source)) {
    if (-not $trees[$commit].ContainsKey($row.path)) { throw "Missing Git text path: $commit/$($row.path)" }
    [void]$ids.Add($trees[$commit][$row.path])
  }
}
# One bounded Git batch for all unique text blobs, with exact blob headers/lengths.
$orderedIds = @($ids | Sort-Object)
$psi = [Diagnostics.ProcessStartInfo]::new('git')
foreach ($arg in @('-C',$atlas,'cat-file','--batch')) { $psi.ArgumentList.Add($arg) }
$psi.RedirectStandardInput=$true
$psi.RedirectStandardOutput=$true
$psi.UseShellExecute=$false
$process=[Diagnostics.Process]::Start($psi)
$memory=[IO.MemoryStream]::new()
$copy=$process.StandardOutput.BaseStream.CopyToAsync($memory)
$process.StandardInput.Write(($orderedIds -join "`n")+"`n")
$process.StandardInput.Close()
$copy.Wait()
$process.WaitForExit()
if ($process.ExitCode -ne 0) { throw "Git batch failed: $($process.ExitCode)" }
$batch=$memory.ToArray()
$blobs=@{}
$offset=0
foreach ($id in $orderedIds) {
  $end=[Array]::IndexOf($batch,[byte]10,$offset)
  if ($end -le $offset) { throw "Missing Git batch header: $id" }
  $header=[Text.Encoding]::ASCII.GetString($batch,$offset,$end-$offset)
  if ($header -notmatch '^([a-f0-9]{40}) blob ([0-9]+)$' -or $Matches[1] -ne $id) { throw "Invalid Git blob header: $id" }
  $length=[int]$Matches[2]
  $start=$end+1
  $finish=$start+$length
  if ($finish -ge $batch.Length -or $batch[$finish] -ne 10) { throw "Invalid Git blob length: $id" }
  $bytes=[byte[]]::new($length)
  [Array]::Copy($batch,$start,$bytes,0,$length)
  $blobs[$id]=$bytes
  $offset=$finish+1
}
if ($offset -ne $batch.Length) { throw 'Unconsumed Git batch bytes' }
$workingCache=@{}
$familyMismatch=[Collections.Generic.List[object]]::new()
$checkoutMismatch=[Collections.Generic.List[object]]::new()
$representation=[Collections.Generic.List[object]]::new()
$familyDifferent=0
$checkoutEqual=0
$utf8=[Text.UTF8Encoding]::new($false,$true)
foreach ($row in $rows) {
  $familyBytes=$blobs[$trees[$row.family][$row.path]]
  $currentBytes=$blobs[$trees[$pin.source][$row.path]]
  if ((Sha256 $familyBytes) -ne $row.declared) {
    $familyMismatch.Add([pscustomobject]@{region=$row.region;path=$row.path;declared=$row.declared;committed=(Sha256 $familyBytes)})
  }
  if (-not (EqualBytes $familyBytes $currentBytes)) { $familyDifferent++ }
  if (-not $workingCache.ContainsKey($row.path)) {
    $workingCache[$row.path]=[IO.File]::ReadAllBytes("$atlas/$($row.path)")
  }
  $working=$workingCache[$row.path]
  if (EqualBytes $working $currentBytes) { $checkoutEqual++; continue }
  $kind='unproven'
  $pairs=0
  try {
    $text=$utf8.GetString($working)
    $validUtf8=EqualBytes $utf8.GetBytes($text) $working
    $pairs=([regex]::Matches($text,"`r`n")).Count
    $bareCr=$text.Replace("`r`n",'').Contains("`r")
    $normalized=$utf8.GetBytes($text.Replace("`r`n","`n"))
    if ($validUtf8 -and $pairs -gt 0 -and -not $bareCr -and (EqualBytes $normalized $currentBytes)) {
      $kind='exact-CRLF-to-current-Git'
    }
  } catch { $kind='not-valid-UTF8' }
  $representation.Add([pscustomobject]@{region=$row.region;path=$row.path;kind=$kind;pairs=$pairs;workingSha256=(Sha256 $working);currentGitSha256=(Sha256 $currentBytes)})
  if ($kind -eq 'unproven' -or $kind -eq 'not-valid-UTF8') { $checkoutMismatch.Add($representation[$representation.Count-1]) }
}
[pscustomobject]@{
  source=$pin.source
  familySources=$pin.runtimeSources
  manifestInputRows=$manifestCounts
  auditedTextRows=$rows.Count
  distinctTextPaths=$workingCache.Count
  uniqueGitBlobs=$orderedIds.Count
  excluded=$excluded
  familyMismatch=$familyMismatch
  differingFamilyVersusCurrentRows=$familyDifferent
  checkoutExactlyCurrentGitRows=$checkoutEqual
  checkoutRepresentations=$representation
  unprovenCheckoutRows=$checkoutMismatch
} | ConvertTo-Json -Depth 8
