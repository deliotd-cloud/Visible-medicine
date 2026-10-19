# Guided library playback pause: local integration

The regional learner and protected Clinical Review bind Atlas source
`b436df6fd03170d27c08d20bf6b29c7d27e0c320`. Focusing or pressing within the tour
library, or opening whole-body discovery, pauses active regional playback and
camera movement. The selected stop, player instance and current camera are
retained. Playback resumes only with explicit Play; selecting another tour
retains its own source-loading gate and Start action.

No additional toolbar, anatomy, teaching claim, imaging navigation or approval
is introduced. Source tests cover the composed library/player, stale timers,
filtering, explicit resume and lifecycle cleanup. The integration test verifies
matching learner/Review source fingerprints and generated delivery.

Evidence and scoped same-machine recovery:
`E:/VisibleMedicine-LocalStaging/20261009-tour-pause-integration/`.
Actual signed-in browser/GPU acceptance is separate from component and delivery
tests. No public deployment or verified GitHub/off-device backup is implied.
