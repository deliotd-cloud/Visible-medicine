# Local CT/MRI scan-opening recovery

After a verified local head package's native image fails to load, the existing
error notice offers **Retry opening scan**. The retry uses the same package
and modality through the unchanged validated image reader. It does not reselect
a folder, upload files, loosen checks or alter original images and masks.

The button appears only for a failed native image, not package verification or
annotation failures. Duplicate clicks consume the failure once. Another failure
can be retried again. Close, package replacement, modality change and unmount
abort the pending request; late success/error cannot restore an obsolete image.
The existing structure retry remains separate. Normal navigation adds no control.

Retry preserves the current URL/learning intent. Its disappearing button moves
keyboard focus to the persistent package action while the live region announces
loading and errors. There is no automatic loop: persistent corrupt or unavailable
files still require selecting a valid prepared package.

Six synthetic component regressions exercise CT and MRI retry, duplicate/stale
actions, repeated failure, cancellation and package-verification exclusion.
Four new retry tests failed before implementation. These are deterministic hook
scheduler/component tests, not concurrent React, actual scan/GPU or clinical
acceptance. Existing image navigation, practice and linking regressions remain.

Evidence and scoped source recovery:
`E:/VisibleMedicine-LocalStaging/20261009-head-study-retry/`.
Local-only; no deployment, access/entitlement change, new asset/dependency,
approved-boundary edit or clinical PACS work. E recovery is same-machine storage,
not verified GitHub or off-device backup.

Verification: 106 focused tests, fresh TypeScript checks, unchanged Clinical Review
verification and isolated E website build pass. Four local route/exact-client
readbacks pass. Preview 55571 replaces deliberately stopped 25068; historical
port 3001 and existing loaded scan/model tabs are preserved. Another 144
redundant build-only models were removed after checking exact E recovery copies;
canonical models, generated Atlas modules and original scans remain unchanged.
