# Visible Medicine application-source recovery

This branch contains4,350 screened application-source paths plus this folder's
three recovery metadata files. Its only parent is the previously screened,
parentless source snapshot 5d1d0e1e1910ae8f8d6513ecee8b0bd8c37d9a0b. Raw website/Atlas ancestry, private
review decisions, local D1 state, candidate object packages, scans and new media
are excluded. This is NOT a full website, patient-data or executable clinical
release backup. Three historical operational documents remain local only.

Use manifest.json for exact source hashes and existing-assets.json for references
to already-backed model/static objects; preserve their original licences/notices.
A source clone does not recover private model-delivery grants, sign-in roles,
approvals, candidate R2 objects, cleared imaging cases or secrets. Do not seed
approvals or disable missing-input/access gates to make it run.

The new schema migration0010_keen_ultron.sql is schema-only; apply through the
approved migration workflow, never replay all historical migrations blindly.
The migration was applied only locally during this checkpoint, not to hosting.
No new model/dependency/font or cloud resource was introduced by this source
checkpoint. Existing asset references do not establish clinical/privacy approval
or a guarantee of future free hosting. Nothing was publicly deployed.
