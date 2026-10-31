$ErrorActionPreference='Stop'
$source='F:\VisibleMedicine\atlas'
$target=Join-Path $PSScriptRoot 'historical-native'
$head='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'
$tree='e9165d7122361f809a267af1414b337b69097fe2'
$sourceBefore=(git -C $source rev-parse HEAD).Trim()
if($LASTEXITCODE -ne 0){throw 'Cannot read canonical Atlas'}
if(-not (Test-Path -LiteralPath $target)){
 git clone --shared --no-checkout $source $target
 if($LASTEXITCODE -ne 0){throw 'Historical clone failed'}
 git -C $target sparse-checkout init --cone
 if($LASTEXITCODE -ne 0){throw 'Sparse checkout setup failed'}
 git -C $target checkout --detach $head
 if($LASTEXITCODE -ne 0){throw 'Historical checkout failed'}
}
$resolved=(git -C $target rev-parse --show-toplevel).Trim()
if($LASTEXITCODE -ne 0 -or [IO.Path]::GetFullPath($resolved) -ne [IO.Path]::GetFullPath($target)){throw 'Wrong clone root'}
if((git -C $target rev-parse HEAD).Trim() -ne $head){throw 'Wrong historical HEAD'}
if((git -C $target rev-parse 'HEAD^{tree}').Trim() -ne $tree){throw 'Wrong historical tree'}
if(@(git -C $target status --porcelain).Count -ne 0){throw 'Historical clone dirty'}
$alternates=Join-Path $target '.git\objects\info\alternates'
if(-not (Test-Path -LiteralPath $alternates)){throw 'Missing shared object alternate'}
$alternatePath=(Get-Content -LiteralPath $alternates -Raw).Trim()
if([IO.Path]::GetFullPath($alternatePath) -ne [IO.Path]::GetFullPath((Join-Path $source '.git\objects'))){throw 'Unexpected shared object source'}
if((git -C $source rev-parse HEAD).Trim() -ne $sourceBefore){throw 'Canonical Atlas HEAD changed'}
Write-Output "verified historical HEAD=$head tree=$tree clean; alternate=$alternatePath; canonical HEAD=$sourceBefore"
