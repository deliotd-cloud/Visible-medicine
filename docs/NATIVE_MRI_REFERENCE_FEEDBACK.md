# Native MRI reference-selection feedback

14 October 2026. Local-only interaction refinement; broader UI redesign remains
a proposal. Atlas source `47a851db0fb3369ad056fb8a8fcc3f3ba73656ea` and protected
Review integration `c7495032df7476867b81dd94caa807d4d9b8cd2ceab1aea27b2179a86574dd1d`
are unchanged.

## Learner behaviour

- After a fresh source/session-bound specimen report, deliberately selecting a
  different model structure is described as browsing, not a failed focus request.
- MRI stays unchanged. A supported current-sequence counterpart retains the
  explicit **Show [structure] on MRI** action. Otherwise the panel explains that
  no supported link is available in this sequence.
- **Restore requested selection** starts a fresh focus session. Old selection
  actions retire; this does not change the MRI or replace the frame unnecessarily.
- A fresh return to the requested structure restores named-selection feedback.
  It does not claim camera-motion completion, anatomical validation or registration.
- Empty/blocked/stale reports, hidden pages, suspended inspections and source
  changes retain the existing refusal and recovery behaviour.

Only the inline component's feedback and recovery-button presentation change.
The requested-focus controller and original mapping, ownership, lifecycle,
source, native-renderer and practice protections are unchanged. Eighteen existing
inline UI test bodies must remain exact; three additional cases exercise browsing,
unmapped/empty reports and a fresh return to the original target.

## Next linking opportunity

Read-only metadata discovery found eight unique accepted-scoped same-side body
annotation occurrences in three native knee MRI sequences. This is not runtime,
visible-focus, clinical or registration proof. The current Atlas root channel is
head-only at its bootstrap, focus handler and parser. Extending these body links
requires an Atlas source change and normal generated-module import, followed by
owned current-session and current-sequence mapping verification. Do not hand-edit
the generated website runtimes or widen a head-only resolver implicitly.

Verification and scoped recovery evidence:
`F:/VisibleMedicine/staging/20261014-mri-reference-feedback/` and
`F:/VisibleMedicine/recovery/checkpoints/20261014-mri-reference-feedback/`.
Actual passing terminal evidence, not this document, proves checkpoint recovery.
No new public deployment, fees, assets, approvals, scan/mask changes, desktop PACS
changes, website GitHub backup or browser acceptance is claimed. Full goal active.
