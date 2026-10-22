$ErrorActionPreference = 'Stop'
$baseline = 'F:\VisibleMedicine\staging\20261022-corpus-cranio-assurance\website'
$stage = 'F:\VisibleMedicine\staging\20261022-four-live-source-roles'
$oldSource = '6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'
$newSource = '2381efe43b75f8a7fb768a069eecd7268c508dac'
$oldTree = 'e9165d7122361f809a267af1414b337b69097fe2'
$newTree = 'db21ed3dee259c390878450b3495468996a3af85'
$changes = @(
    @{File='native-focus-review-binding.test.mjs'; From="assert.equal(pin.source,'$oldSource');"; To="assert.equal(pin.source,'$newSource');"},
    @{File='native-focus-review-binding.test.mjs'; From="assert.equal(pin.sourceTree,'$oldTree');"; To="assert.equal(pin.sourceTree,'$newTree');"},
    @{File='native-focus-review-binding.test.mjs'; From='assert.equal(pin.reviewSourceFiles,1558);'; To='assert.equal(pin.reviewSourceFiles,1562);'},
    @{File='native-focus-review-binding.test.mjs'; From='assert.equal(binding.inputs.length,1724);'; To='assert.equal(binding.inputs.length,1729);'},
    @{File='posterior-fossa-coverage.test.mjs'; From="`"assert.equal(coverageRevision,'7b3e678ae4b8059aadb84459048ebd05f7abe7b9');`",`"assert.equal(coverageRevision,'$oldSource');`""; To="`"assert.equal(coverageRevision,'7b3e678ae4b8059aadb84459048ebd05f7abe7b9');`",`"assert.equal(coverageRevision,'$newSource');`""},
    @{File='posterior-fossa-coverage.test.mjs'; From="assert.equal(coverageRevision,'$oldSource');"; To="assert.equal(coverageRevision,'$newSource');"},
    @{File='salpingopharyngeus-integration-register.test.mjs'; From="assert.equal(current.source,'$oldSource');"; To="assert.equal(current.source,'$newSource');"},
    @{File='studio-lineage-integration.test.mjs'; From="assert.equal(pin.source,'$oldSource');"; To="assert.equal(pin.source,'$newSource');"},
    @{File='studio-lineage-integration.test.mjs'; From="assert.equal(pin.sourceTree,'$oldTree');"; To="assert.equal(pin.sourceTree,'$newTree');"},
    @{File='studio-lineage-integration.test.mjs'; From='assert.equal(pin.reviewSourceFiles,1558);'; To='assert.equal(pin.reviewSourceFiles,1562);'}
)
function Assert-True([bool]$condition, [string]$message) { if (-not $condition) { throw $message } }
foreach ($file in @($changes.File | Sort-Object -Unique)) {
    $beforePath = Join-Path $baseline "tests\$file"
    $afterPath = Join-Path $stage "tests\$file"
    $before = [IO.File]::ReadAllText($beforePath)
    $after = [IO.File]::ReadAllText($afterPath)
    $expected = $before
    foreach ($seam in @($changes | Where-Object File -EQ $file)) {
        $count = ($expected.Split([string[]]@($seam.From), [StringSplitOptions]::None)).Length - 1
        Assert-True ($count -eq 1) "Expected one preimage seam for $file : $($seam.From)"
        $expected = $expected.Replace($seam.From, $seam.To)
    }
    Assert-True ($expected -ceq $after) "Unexpected change beyond declared seams: $file"
    Write-Output "EXACT $file $((Get-FileHash $beforePath -Algorithm SHA256).Hash) $((Get-FileHash $afterPath -Algorithm SHA256).Hash)"
}
$pin = Get-Content (Join-Path $baseline 'tests\fixtures\current-atlas-delivery.json') -Raw | ConvertFrom-Json
$binding = Get-Content (Join-Path $baseline 'atlas-review\integration-inputs.json') -Raw | ConvertFrom-Json
$review = Get-Content (Join-Path $baseline 'atlas-review\manifest.json') -Raw | ConvertFrom-Json
$coverage = Get-Content (Join-Path $baseline 'docs\anatomy-coverage\index.json') -Raw | ConvertFrom-Json
Assert-True ($pin.source -eq $newSource -and $pin.sourceTree -eq $newTree) 'Current Atlas pin identity mismatch'
Assert-True ($pin.reviewIntegration -eq '1a48d6bc674a007b4e6be7ebdb777810ca0f2ee3e373d58b53d22a43ba9babfc') 'Review pin mismatch'
Assert-True ($pin.reviewSourceFiles -eq 1562 -and @($review.files).Count -eq 1562) 'Review source count mismatch'
Assert-True ($binding.sourceCommit -eq $newSource -and $binding.sha256 -eq $pin.reviewIntegration -and @($binding.inputs).Count -eq 1729) 'Binding identity or count mismatch'
Assert-True ($coverage.sourceRevision -eq $newSource -and @($coverage.evidence.sourceInputs.PSObject.Properties).Count -eq 168) 'Coverage identity or input count mismatch'
Write-Output 'CURRENT_PIN_AND_MANIFEST_EXACT'
