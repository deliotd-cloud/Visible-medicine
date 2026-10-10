# Nested guided-tour loading failures

The shared whole-body/regional tour library now shows a neutral failure alert
when an eye or ventricular workbench cannot load. The tour picker and Exit stay
outside the failure boundary. Selecting a different source/revision remounts the
existing keyed viewer; no automatic playback, fake retry or raw exception text
is introduced.

Next/vinext passes loader errors to the existing loading callback. The contained
regional Vite shim instead uses React.lazy/Suspense and ignores that option, so
a local child error boundary also covers that delivery path. Its pending
"Loading anatomy…" status remains unchanged. No shared shim or dependency change.

## Verification and limits

The focused component suite checks both deferred loading/error callbacks, both
source-bound nested viewer types, the child failure boundary, picker/Exit and all
32 existing regional tours. The same error-state assertion fails against the
immutable preceding application source and passes after this change. Eight
additional renderer, selection, regional-player, eye/ventricular-guide and nested
Review checks pass. The worker's fresh TypeScript check passes. These checks are
not actual asynchronous browser chunk-failure or native assistive acceptance.

Regenerating the renderer fingerprint changes this application dependency and
refreshes a separately pre-existing stale review-revisions dependency. Immutable
Git comparison proves the latter source bytes did not change. Existing
revision-bound re-review behavior is retained; no private decisions migrate.

The adjacent older `test-nested-guided-library.mjs` remains red at its historical
two-eye expectation: current discovery also includes the ventricular guide.
Its original assertions were not weakened. That separate historical/current
contract needs an explicit follow-up; this checkpoint is not a full-suite pass.

Evidence, retained initial harness/verification failures and exact incremental E
recovery: `E:/VisibleMedicine-LocalStaging/20261007-nested-tour-load-errors/`.
No anatomical geometry, teaching, source pins, licensing, access grants, scans,
CT-head masks or clinical desktop application change. Generated website delivery
and real browser acceptance remain the next bounded step, not a claimed release.
