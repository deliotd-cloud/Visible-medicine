# Export storage preflight

The regional/whole-body, shoulder, female-pelvis and lower-limb exporters now
check destination storage after assembling their complete copy list and before
their first directory creation or copy. All existing clean-source, input-hash,
model-integrity, rights, scope and no-overwrite checks remain in place.

`scripts/export-space-preflight.mjs` uses read-only `lstat`/`statfs` with bigint
arithmetic. Each source must be a regular file. It rounds each file size up to
the reported filesystem block size and adds a 1 MiB manifest allowance plus
128 MiB reserve. It compares this with space available to the current user,
walking to the nearest existing destination ancestor only on ENOENT. Unknown,
inconsistent or inaccessible space fails closed, not as assumed free capacity.
Diagnostics include required/available/shortfall bytes. No destination is created
by the preflight and no automatic cleanup or overwrite is attempted.

This is an estimate, not a reservation: concurrent writers, quotas, filesystem
metadata and changed source files may still cause a later write to fail. Export
completion still requires the complete manifest and normal source verification.
An interrupted folder is never a valid candidate merely because preflight passed.

Each build explicitly binds both its exporter and the shared helper in
`source-inputs.json`; an exporter rejects a build missing either binding. Old
module builds must therefore be rebuilt before use. No browser/runtime control,
anatomical content, patient data, dependency, fee or clinical approval is added.

## Verification

`npm run export-space:test` covers eight helper cases and twelve actual-exporter
cases. The latter execute the real write-tail with controlled I/O, assert every
writer follows the awaited guard, and check all copy-list additions precede it.
Space/permission/unsupported errors prevent every writer; sufficient-space paths
retain all fixture records and the source, patient-data and clinical flags.
All four builds must include the exporter/helper binding; absent entries fail.

Final focused test log:
`.local/test-logs/2026-09-26T12-13-03.731Z-44764-99432a28.log`.
Initial lint reported missing awaits/bound methods in the new tests and an
existing unused destructured variable in the touched shoulder build config.
These were corrected (no suppressions); focused lint and all twenty cases pass.

A real read-only Windows probe used all 199 files of the previously verified
`03e0532` export: 211,295,031 source bytes, 211,709,952 allocated bytes and
346,976,256 required bytes including allowances. It resolved the real destination
filesystem and left the nonexistent probe destination absent. This probes disk
accounting, not clinical correctness or delivery of a new revision.

The previous failed `work/thoracic-inlet-web-20260926` export and all prior
backups remain untouched. Its cleanup was denied; this change provides no
alternative deletion mechanism. Space later recovered independently to about
3 GB, confirmed by Windows and Node. Do not infer that any files were cleaned up.

Body review/decision checks pass with unsigned fingerprints in
`.local/test-logs/2026-09-26T12-13-59.193Z-37692-0990f570.log`; TypeScript passes.
All four production builds pass: regional 3,378 modules/9.99s, shoulder
3,517/7.17s, female pelvis 2,704/6.58s, lower limb 2,694/6.52s. Existing chunk
warnings remain. Readback verifies the actual exporter/helper SHA256 entries
in every generated source-input manifest. No anatomy or clinical acceptance
is inferred from these build checks.
