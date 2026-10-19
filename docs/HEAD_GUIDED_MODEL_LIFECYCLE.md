# Persistent guided model lifecycle

The existing 3D Atlas remains open while learners move between linked head
anatomy steps. Only controls from the current committed view can navigate,
retry or reconnect its model frame. Retired controls and speculative renders
cannot change the URL, create a session or send a structure-focus command.

Protocol actions are published during layout commit rather than during render.
Each mounted message/history channel also has its own identity and cleanup.
An abandoned source-revision render therefore cannot replace the visible
view's protocol actions. Cleanup retires its callbacks without allowing an old
cleanup to dismantle a replacement channel.

Native history, practice and in-model guide locks, explicit retries and fresh
model links are preserved. The iframe source stays stable across compatible
steps. A focus acknowledgement alone still cannot enable CT/MRI comparison:
a subsequent valid, matching model-selection snapshot is required. These are
semantic anatomical comparisons between separate subjects, not patient-space
registration or synchronization.

## Verification

Five actual-component regression cases fail against the preserved original
and pass against the corrected component. They cover speculative navigation,
retired navigation/retry/frame callbacks, abandoned revision routing and effect
cleanup/setup replay. The 132 affected checks pass, including existing history,
selection, guided learning, source-revision and comparison suites. Fresh website
types, protected Review verification and the full build pass. Non-fatal build
chunk-size and plugin-timing warnings remain.

The test harness distinguishes render, commit and effect replay. Its initial
replay implementation incorrectly added a separate replacement render; that
fixture failure and its correction are retained. Another pre-existing harness
needed the real lecture-link import and an explicit selector for the comparison
limits disclosure. No product assertion or access rule was relaxed.

Commit timing follows the existing [React layout-effect contract](https://react.dev/reference/react/useLayoutEffect).
Effect replay is tested separately from replacement renders, consistent with
[React Strict Mode](https://react.dev/reference/react/StrictMode).
Synthetic hooks and browser-event models do not establish browser focus,
hydration, concurrent-scheduler, GPU or acquired-study acceptance. The existing
client-side browser gate was not retried or bypassed.

## Scope and recovery

Production changes are limited to `components/HeadAtlasGuidedModel.tsx`.
Atlas source `813506f4`, all four learner-module manifests and protected Review
`85df3e08` remain unchanged. All 1,151 unowned source, configuration and delivery
inputs retain their captured hashes. No anatomy, masks, scan data, teaching
packets, entitlements, desktop PACS, assets, dependencies or fees change.
The code and tests are original project work, with no new third-party asset
license obligation or clinical approval.

Scoped local source recovery and a verified restore smoke test are saved at
`F:/VisibleMedicine/recovery/checkpoints/20261012-guided-model-lifecycle`.
Command receipts and retained failures are at
`F:/VisibleMedicine/staging/20261012-guided-model-lifecycle`.
This is not a complete website/private-data or off-device backup. No new GitHub
upload or public deployment occurs in this website-only milestone. Sites
guidance keeps integration local, and documentation guidance informs the saved
checkpoint. The full development goal remains active.
