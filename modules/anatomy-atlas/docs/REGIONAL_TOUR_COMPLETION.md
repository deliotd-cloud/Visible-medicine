# Regional Guided learning: natural completion

Timed playback now uses the same pause transition at the final stop as the
Pause button: retire the playback epoch, stop the timer and hold camera motion.
Intermediate stops retain their full-duration playback. Completion neither exits
the tour nor launches imaging. Explicit Play can replay the held stop.

A ready final root-body stop can offer the existing optional Education action.
The learner must still opt in; source-bound structure identity, connected host,
independent entitlement and clearance gates are unchanged. This is conceptual
comparison, not patient-space registration. Quiz, hidden-page, renderer failure,
source-change and exit restrictions remain in force. No accepted masks, models,
anatomical teaching, scan data, access policy or desktop PACS files change.

`node --test scripts/test-regional-tour-player.mjs` exercises the actual player
with controlled React hooks and the real paused-stop link. It verifies final
hold, intermediate playback, opt-in/no automatic launch, exact sources, reduced
motion, retired timers, quiz, hidden state and renderer loss. Related camera,
host and imaging suites remain required. The scene boundary is stubbed: these
tests do not establish a final visual camera pose, browser/GPU or clinical
acceptance. Check smooth completion on representative hardware before release.
