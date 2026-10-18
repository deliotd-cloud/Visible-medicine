# Local website source recovery

The source-only helper is `scripts/source-recovery.mjs`. It exports
`captureSourceRecovery({sourceRoot,destinationRoot,paths})`,
`verifySourceRecovery({snapshotRoot})` and
`restoreSourceRecovery({snapshotRoot,destinationRoot})`. Paths are absolute roots
and an explicit list of relative files, never a broad recursive backup request.
Destinations must be fresh and outside the source/snapshot. No existing files are
overwritten or removed. A failed copy may remain for inspection without a success
manifest. Do not run this against a concurrently edited tree.

The helper rejects unsafe/colliding Windows paths, secrets/runtime directories,
medical volume/database/key/archive extensions and filesystem redirects. It
checks source bytes twice, copied bytes, exact snapshot membership and restored
bytes. It is an integrity check, not a secrets scanner, a licence audit or signed
authentication of a manifest. Keep the expected manifest hash in a separate
checkpoint. File-symlink testing may require Windows privileges; the separate
junction test must still run.

## Verified 11 October working-copy checkpoint

Local location: `F:/VisibleMedicine/recovery/checkpoints/20261011-website-source-recovery`.
Evidence and disposable build fixture: the matching folder under `staging`.
The source snapshot captures working-copy bytes, including unpublished edits;
the Git HEAD alone does not identify that state. `plan.json` records selected and
excluded paths. No original file or running preview is changed by restoration.

- `source-snapshot`: website/Atlas imports, notices and existing public branding
  derivatives; no Git history, installed dependencies, private scans or masks.
- `source-supplement`: inspected static fracture-reader code (no cases/images),
  owner logo and these instructions. Restore to a separate fresh temporary folder,
  then copy only manifest-listed files into the assembled tree, refusing existing
  targets and checking each hash. Preserve both manifests.
- `private-generated`: three exact ignored server-only optic, disc and plexus
  source-comparison modules. Their companion manifest checks bytes against the
  current source-review manifests. These remain held, private and local-only;
  never upload this companion or move its content into public assets or Git.

The private generated modules are required by the current Review routes/prebuild.
The normal source helper intentionally refuses `.local`; this explicit companion
is not permission to copy other `.local` data. Place only its three listed files
at their recorded relative paths in a fresh local restore and verify all hashes.

Install the unchanged lockfile into the restored folder, not through a junction
to the original node_modules. Use the standard Sites installer; if Windows's npm
wrapper fails, invoke the installed npm CLI through Node with `ci`. Keep caches
and temporary files on F:. The verification run disabled package lifecycle scripts,
inherited application credentials and local scan-root environment variables.
Run `npm run build`, fresh TypeScript, the four head-link test files and the source
recovery tests there. Consult the checkpoint receipts for actual pass/fail evidence;
these instructions alone are not proof of success.

## Deliberately outside this checkpoint

Private CT/MRI/fracture datasets, masks, uploaded teaching media, accounts,
entitlements, clinical decisions, D1/R2 contents, secrets and application sessions
need separate recovery. Recreating old branding films from raw media also needs
their separate authoring archives; rendered public website files are preserved.
There is no public deployment or verified current website GitHub backup here.
This is a same-drive local recovery, not off-device resilience or clinical sign-off.
