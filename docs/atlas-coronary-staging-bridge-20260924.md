# Coronary venous model staging bridge — 24 September 2026

This revision is an **administrator-only storage bridge**, not an Atlas release.
It restores the complete version-117 active runtime, 135-model / 142-path
inventory and protected-delivery policy byte-for-byte from website commit
`bb06aec09dd53c14eda5d269d440bf0f35aac166`. It only adds a staging
registration, source checks and test portability corrections. It does not
activate the coronary-venous model, change entitlements, or confer clinical
approval.

The separately saved version-118 candidate is website commit
`fbe9963e793007d2f06d31ac21ce6df61da7e4fa`, built from Atlas source
`201f8c9d075c1eda29e1dd93e94b458a44563d62`. Its new model is
`/atlas-runtime/head-neck/models/bodyparts3d/coronary-venous/coronary-venous.glb`,
40,996 bytes, SHA-256
`4dbd938c5cde865a0f7f66957ec3304965530a5b7744d93a85e95531ce827b12`.
The immutable registration is in
`lib/atlas-model-staging-coronary-20260924.json`. Tests bind it to the saved
candidate manifest and exact Git object bytes. The active 117 inventory must
reject its viewer path until activation.

Before activating version 118:

1. Save and deploy this bridge privately with owner-only access confirmed.
2. Use the existing `/workspace/atlas-models` administrator maintenance flow
   to upload the exact audited GLB. Verify full-byte checksum and length, while
   confirming active 117 delivery and denial of the new viewer path.
3. Restore the complete version-118 candidate source as a history-preserving
   descendant if needed to satisfy Sites' source-HEAD constraint. Save, deploy
   privately, and verify all 136 models / 143 paths plus prior model URLs.
4. Obtain revision-bound radiologist review and all clinical, licensing,
   accessibility, security and operational sign-offs separately. Do not imply
   that passing storage checks makes the anatomy clinically approved.

No scan, private case, DICOM packet or patient derivative belongs in these
repositories or the hosted artifact. Keep immutable objects and both source
revisions for rollback; do not delete older model bytes.
