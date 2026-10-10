# Guided learning: recover a failed anatomy download

28 September 2026. A failed required tour bundle previously left playback
permanently unavailable until the learner exited and reloaded the Atlas.

The player now reuses the existing scene's cache-clear and bundle-boundary retry
mechanism. A retry control appears only for failed bundles in that tour's exact
source scope. Successful models are not re-requested. Retry preserves the step,
source selection, view and explanation state, and never resumes playback
automatically. Start/Play becomes available only when all required anatomy and
the renderer are ready. Exit remains available throughout.

Repeated failures can be retried. A failure to start retry leaves the failure
state intact. Overlapping initiation and results from an exited/replaced tour
must not clear another tour's cache or alter its state. No new geometry,
teaching, clinical approval, patient imaging or dependencies are introduced.

Verification and exact recovery revisions are recorded in the main coordination
checkpoint. Controlled component checks exercise callbacks and races; a local
fault-injection browser test separately exercises the actual GLB loader. Neither
proves clinical accuracy or complete physical-device coverage. Website integration
is a separate generated import, not an automatic consequence of this source edit.

The shared renderer validator also needed its extracted shoulder handlers updated
to supply the existing tour-active ref. It now checks selection in both active
and inactive tour states, retaining the existing renderer/exam expectations.
This corrects stale test context, not production shoulder behavior.

## Guided camera timing and renderer retry — 3 October 2026

Guided sweeps now measure active frame time without a 50 ms cap, which had
stretched a configured 1.8-second sweep to roughly twice that duration at 10 FPS.
The first demand-render frame after starting or resuming is ignored so time
spent waiting for anatomy or in a hidden tab cannot jump the camera. Invalid
frame deltas are ignored; the existing smooth quaternion interpolation and
manual-orbit/keyboard interruption remain in place.

An automatic renderer retry may capture the camera part-way through a sweep.
`SceneRecovery` now marks only its own actively moving camera copy with a
private, transient object-identity ref. The fresh camera uses that pose as the start of a new sweep
toward the selected guided preset, waiting for renderer/anatomy readiness. This
restarts the configured duration; it does not claim to preserve the original
remaining milliseconds. Reduced motion reaches the preset immediately.

An explicitly queued saved view takes precedence and is restored exactly, as
are ordinary non-guided views and guided views whose sweep was completed or
cancelled by manual orbit/keyboard input. The marker survives repeated retries before
consumption but is cleared on an explicit override, camera-key change or unmount.
It is not added to saved-view data, URLs or storage. The specimen player retains
manual orbit rather than introducing a new tour lock.

Regression tests execute the real camera component on a fresh mount and cover
low frame rates, stale deltas, pause/resume, reduced motion, manual restores,
ordinary recovery and scene-wrapper wiring. The new low-FPS and fresh-mount
recovery cases fail against their respective pre-fix sources. Controlled
renderer tests do not substitute for a real GPU/context-loss test. Integration,
browser evidence and exact E-drive recovery are recorded in the coordination
checkpoint; no clinical approval or publication is implied.
