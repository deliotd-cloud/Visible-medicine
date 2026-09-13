# Temporary Atlas storage bootstrap

This release preserves the complete learner-facing source from website version
52 (`566b7df2f74334871f279dc1f73befc814300f91`) and adds only the seven storage
API/page/component/registry files from the tested development source
`81feb003efc55b48f9a042f8b9318f3661d469c4`.

Its static model exports remain the 44 models in the current live website. Its
administrator-only registry covers all 59 canonical files in the pending full
head/neck–thorax release. This is deliberate staged rollout, not an anatomy
reduction or a final release. Newer source remains in the canonical checkout.

The original four runtime manifests, notices and losslessly packed model bytes
must be identical to the verified version-52 archive. Only an exact complete
comparison permits reusing that transport. The new Worker and staff page must
come from this bootstrap source build, never from the earlier deployment.

No learner route, teaching, geometry, patient data, entitlement, account setting,
splash behavior or audience is changed. No new dependency or paid service is
enabled. Production authorization and complete stored-byte checks are required
before moving learner model delivery to object storage. This bootstrap is not
evidence of clinical approval or full-goal completion.

Roll forward to the preserved development tree after storage is verified, keeping
an append-only Git history and all prior release artifacts. Never force-push or
replace newer development files with this temporary learner snapshot.

The full-download follow-up copies the maintenance component, bounded verifier,
its four regression groups and the storage note exactly from development
`d2d4441bff79fa570f8528a4d6a1b4c586983a3c`. It preserves every learner-facing
file and the same 44-model transport. All 59 registered models passed a fresh
live owner-session HEAD check before this follow-up; actual complete downloads
are checked separately after publication. No learner routing is activated here.
