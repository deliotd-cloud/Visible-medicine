# Guided comparison controls: committed-render lifecycle

The CT/MRI-to-existing-3D comparison tour now activates its Previous, Next and
Finish controls only after their render commits. Starting an abandoned render
no longer disables the controls still visible on screen. Speculative callbacks
cannot navigate or finish a tour; replacing or unmounting a committed tour
retires its callbacks. Null/unavailable-source commits retire them too.

The implementation uses an unconditional layout effect before the component's
early returns, with identity-checked cleanup. It preserves repeated actions
within the current commit, canonical step order, missing-step notices and the
native button elements. No anatomy is substituted when a step is unavailable.

## Verification

The test harness distinguishes render from commit, layout from passive effects,
and effect cleanup/setup replay. Thirteen actual-component tests cover ordinary
navigation, missing and invalid targets, abandoned visible and speculative
callbacks, replacement, unmount and StrictMode-style replay. The preserved
original component fails five of these thirteen tests; the corrected component
passes all thirteen. The nine affected linked-learning suites pass 251 checks.
Fresh non-incremental types, unchanged protected Review verification and the
full website build also pass. Existing build chunk-size warnings remain.

These are synthetic lifecycle/protocol/markup checks, not proof of browser
focus, hydration, concurrent-scheduler behaviour, GPU rendering or acquired
study acceptance. No blocked browser gate was retried or bypassed.

## Scope and recovery

Only the component, its tests and checkpoint documentation change. Atlas
8c644c4e, all four learner-module identities and protected Review d1399cf2 stay
unchanged. No scans, masks, source geometry, teaching, entitlements, desktop
clinical PACS, dependencies or assets change. Structure comparison remains
semantic, not validated patient-space synchronization. This fix grants no
clinical approval and is not publicly deployed.

The code and tests are original project work; no third-party media, license
obligation or fee is introduced. Normal local Sites verification is used;
publication remains outside this checkpoint's scope.

Scoped source-only recovery and a hash-verified restore smoke test are saved at
`F:/VisibleMedicine/recovery/checkpoints/20261012-comparison-tour-commit`.
Logs and command receipts are at
`F:/VisibleMedicine/staging/20261012-comparison-tour-commit`.
This is local scoped recovery, not a complete website, private-data or
off-device backup. No new GitHub upload occurs in this website-only milestone.
The full development goal remains active.
