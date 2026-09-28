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
