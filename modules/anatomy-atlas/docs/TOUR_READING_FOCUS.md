# Guided tours: pause on reading focus

Keyboard focus entering the current caption or optional reading resources now
uses the existing reading-pause action. This applies to the shared regional/
whole-body player and the dedicated shoulder player. No new controls, layout,
anatomy, learning content, tour steps or camera trajectory are introduced.

Previously, opening references paused playback, but focusing the caption or an
already-open resource after pressing Play did not. The tour could advance while
the learner was reading or scrolling that focused area.

Regional reading focus invalidates the playback epoch synchronously, clears the
timer and pauses the camera transition. A callback already dispatched before
React commits cannot advance to another stop. The selection and framing remain
at the same stop. Leaving the reading area does not resume; Play remains the
explicit resume action outside these reading containers. Reduced-motion mode
retains zero-duration transitions. The shoulder component delegates to its
existing reading-pause session action.

Tests exercise caption/resource focus, repeated focus, no blur-resume, queued
timeouts, explicit resumption and unchanged framing, across desktop/compact
and reduced/normal-motion states. The shoulder checks cover all five stops.
Existing player/session/camera/imaging checks remain applicable.

Two older test harnesses lacked the current component's layout-effect support;
the reference-pause harness also lacked pagehide-listener stubs. These are
corrected without changing their existing assertions. Initial failures are kept
in the E evidence folder rather than classified as production regressions.
The shoulder focus assertion did fail against the pre-change component.

Evidence: E:/VisibleMedicine-LocalStaging/20261009-tour-reading-focus/.
Source and website delivery are separate checkpoints. Actual keyboard/browser
and smoothness acceptance remains distinct from controlled-component checks.
No approvals, private images, masks, desktop PACS or access policy are changed.

The 72 focused checks and fresh TypeScript check pass. The first content-contract
run correctly rejected the stale dedicated-shoulder display fingerprints; these
were regenerated through the existing review-revisions command, followed by the
shoulder export. Its geometry-review field includes display evidence: changing
that fingerprint does not mean any source mesh changed. Teaching fingerprints
and clinical approval state remain unchanged. Failure logs are preserved.

The saved-state receipt records the remaining validator/build outcomes and exact
source commit. The website needs both regional and dedicated-shoulder generated
learners plus matching protected Review imported together; this source change
alone does not update the website preview or public site.
