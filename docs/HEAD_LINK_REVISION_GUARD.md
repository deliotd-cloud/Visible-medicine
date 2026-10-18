# Head comparison revision guard

The 3D head wrapper previously validated incoming model selection against the
model build, but did not separately check whether its CT/MRI concept mappings
still matched the current imaging manifest. Those are distinct revisions.

`headLinksCurrent()` now requires the pinned 64-character imaging mapping hash
to equal `HEAD_MANIFEST_SHA256`. On mismatch, comparison controls, linked-tour
picker, tour step navigation and tour library show an explanatory notice without
destinations. Live linked teaching is also withheld. The existing 3D frame,
camera/session and model exploration are not restarted or disabled. Teaching
and patient-space registration are not approved by this display guard.

Current matching revisions preserve all existing destinations and independent
access checks. No approved mask or source dataset is edited; no patient data,
new dependencies, licence changes or public deployment are involved.

Verification includes actual helper revision mutation, rendered components with
a false guard, and live-frame interaction through mismatch/recovery. Existing
link, sequence, handoff, picker, library and message-protocol regressions remain
part of the focused suite. Tests exercise source behavior, not clinical review
or signed-in model/GPU acceptance.

Local evidence: `E:/VisibleMedicine-LocalStaging/20261009-head-link-revision-guard/`.
This is same-machine recovery, not a verified GitHub or off-device backup.
