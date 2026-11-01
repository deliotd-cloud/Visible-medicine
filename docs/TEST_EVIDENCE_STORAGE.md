# Local test evidence storage

Keep source checkouts on the project SSD. Set `VM_TEST_EVIDENCE_ROOT` to a dedicated absolute local directory when the main verification logs should use another drive. The directory may be created if it does not exist. Network locations, links and project source directories are refused. Every run creates a fresh directory; earlier evidence is never overwritten or removed.

For the owner's approved temporary G drive, in PowerShell:

```powershell
$env:VM_TEST_EVIDENCE_ROOT = 'G:\VisibleMedicine-temp\test-evidence'
$env:TEMP = 'G:\VisibleMedicine-temp\tmp'
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null
node scripts/run-website-tests.mjs --run --partition 1/32
```

The main runner, original notice collector and original deep-brain/foot collector honor the evidence setting. With it unset, their existing `.local` locations remain the default. Synthetic roots keep their own local-output contracts. Other tests can still create small fixtures under their declared directories; this option does not relocate the entire project or every temporary file.

The option changes only output placement. It does not choose historical source revisions, populate missing environment bindings, disable tests, change account access or confer release approval. Historical contexts must still be separately authenticated; never substitute the current Atlas for an older required checkout. Preserve the runner's `manifest.json`, `receipt.json`, logs and child start/terminal evidence together. Logs may contain private assertion values or paths: keep them local and do not add them to GitHub.
