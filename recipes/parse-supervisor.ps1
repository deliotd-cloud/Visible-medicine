param([Parameter(Mandatory=$true)][string]$Path)
$ErrorActionPreference='Stop'
$resolved=(Resolve-Path -LiteralPath $Path).Path
if(!$resolved.StartsWith('G:\VisibleMedicine-temp\staging\20261029-mandible-combined-generation\',[StringComparison]::OrdinalIgnoreCase)){throw 'Unexpected supervisor path'}
$tokens=$null
$parseErrors=$null
$null=[System.Management.Automation.Language.Parser]::ParseFile($resolved,[ref]$tokens,[ref]$parseErrors)
if($parseErrors.Count -gt 0){throw ($parseErrors|Out-String)}
[pscustomobject]@{parsed=$resolved;syntaxErrors=0;executed=$false}|ConvertTo-Json
